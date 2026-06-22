import type { MatchConfig, MatchClock, MatchPhase, MatchScore, Vec3 } from '../data/types';
import { PITCH } from '../data/types';
import type { PlayerEntity } from '../physics/playerPhysics';
import { BallPhysics } from '../physics/ballPhysics';
import { createPlayer, findClosestToBall, getFormationPositions } from '../physics/playerPhysics';
import type { TeamData } from '../data/types';
import { TeamAI } from '../ai/teamAI';

export type SetPiece = 'kickoff' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | null;

export interface MatchEvent {
  type: 'goal' | 'foul' | 'offside' | 'yellow_card' | 'red_card' | 'halftime' | 'fulltime';
  team?: 'home' | 'away';
  playerId?: string;
  minute: number;
}

export class MatchState {
  readonly config: MatchConfig;
  readonly ball = new BallPhysics();
  players: PlayerEntity[] = [];
  score: MatchScore = { home: 0, away: 0 };
  clock: MatchClock = { minute: 0, second: 0, half: 1, addedTime: 0, isRunning: false };
  phase: MatchPhase = 'pregame';
  events: MatchEvent[] = [];
  setPiece: SetPiece = null;
  setPiecePosition: Vec3 = { x: 0, y: 0, z: 0 };
  attackingTeam: 'home' | 'away' = 'home';
  homeTeam: TeamData;
  awayTeam: TeamData;
  controlledPlayerId: string | null = null;
  homeAI: TeamAI;
  awayAI: TeamAI;
  foulCooldown = 0;
  replayBuffer: Vec3[] = [];

  constructor(config: MatchConfig, homeTeam: TeamData, awayTeam: TeamData) {
    this.config = config;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.homeAI = new TeamAI(config.difficulty);
    this.awayAI = new TeamAI(config.difficulty);
    this.setupPlayers();
  }

  private setupPlayers(): void {
    this.players = [];
    const homePositions = getFormationPositions(this.homeTeam.formation);
    const awayPositions = getFormationPositions(this.awayTeam.formation);

    const homeStarters = this.homeTeam.squad.slice(0, 11);
    const awayStarters = this.awayTeam.squad.slice(0, 11);

    homeStarters.forEach((p, i) => {
      const role = homePositions[i] ?? p.position;
      this.players.push(createPlayer(p, 'home', role, this.homeTeam.formation, i));
    });
    awayStarters.forEach((p, i) => {
      const role = awayPositions[i] ?? p.position;
      this.players.push(createPlayer(p, 'away', role, this.awayTeam.formation, i));
    });

    const firstHome = this.players.find((p) => p.team === 'home' && p.role !== 'GK');
    if (firstHome) {
      firstHome.isControlled = true;
      this.controlledPlayerId = firstHome.id;
    }
  }

  start(): void {
    this.phase = 'kickoff';
    this.clock.isRunning = true;
    this.ball.reset(0, 0);
    this.setPiece = 'kickoff';
  }

  update(dt: number): void {
    if (this.phase !== 'playing' && this.phase !== 'kickoff') return;

    if (this.clock.isRunning) {
      this.clock.second += dt;
      if (this.clock.second >= 60) {
        this.clock.second = 0;
        this.clock.minute++;
      }

      const halfLength = this.config.halfLengthMinutes;
      if (this.clock.half === 1 && this.clock.minute >= halfLength) {
        this.phase = 'halftime';
        this.clock.isRunning = false;
        this.events.push({ type: 'halftime', minute: this.clock.minute });
      }
      if (this.clock.half === 2 && this.clock.minute >= halfLength * 2) {
        this.phase = 'finished';
        this.clock.isRunning = false;
        this.events.push({ type: 'fulltime', minute: this.clock.minute });
      }
    }

    this.replayBuffer.push({ ...this.ball.state.position });
    if (this.replayBuffer.length > 240) this.replayBuffer.shift();

    const result = this.ball.update(dt);
    if (result.goal) {
      this.onGoal(result.goal);
    }

    if (this.foulCooldown > 0) this.foulCooldown -= dt;
  }

  onGoal(team: 'home' | 'away'): void {
    if (team === 'home') this.score.home++;
    else this.score.away++;
    this.events.push({ type: 'goal', team, minute: this.clock.minute });
    this.phase = 'replay';
    this.clock.isRunning = false;
    this.setPiece = 'kickoff';
    setTimeout(() => {
      this.ball.reset(0, 0);
      this.phase = 'playing';
      this.clock.isRunning = true;
    }, 4000);
  }

  switchPlayer(team: 'home' | 'away'): void {
    const current = this.players.find((p) => p.id === this.controlledPlayerId);
    if (current) current.isControlled = false;

    const closest = findClosestToBall(
      this.players.filter((p) => p.team === team && p.role !== 'GK'),
      this.ball.state.position,
    );
    if (closest) {
      closest.isControlled = true;
      this.controlledPlayerId = closest.id;
    }
  }

  getControlledPlayer(): PlayerEntity | null {
    return this.players.find((p) => p.id === this.controlledPlayerId) ?? null;
  }

  handlePass(player: PlayerEntity, lob = false): void {
    const teammates = this.players.filter(
      (p) => p.team === player.team && p.id !== player.id && p.role !== 'GK',
    );
    const dir = player.team === 'home' ? 1 : -1;
    const sorted = teammates.sort((a, b) => {
      const aScore = a.position.x * dir + (lob ? 10 : 0);
      const bScore = b.position.x * dir + (lob ? 10 : 0);
      return bScore - aScore;
    });
    const target = sorted[0];
    if (!target) return;

    const dx = target.position.x - player.position.x;
    const dz = target.position.z - player.position.z;
    const power = lob ? 0.6 : 0.35 + Math.random() * 0.15;
    this.ball.kick({ x: dx, y: 0, z: dz }, power, lob ? 0.4 : 0, 0, player.id, player.team);
    player.animState = 'pass';
    player.animTime = 0;
  }

  handleShoot(player: PlayerEntity, power: number): void {
    const dir = player.team === 'home' ? 1 : -1;
    const goalX = dir * PITCH.LENGTH / 2;
    const dx = goalX - player.position.x;
    const dz = -player.position.z * 0.2 + (Math.random() - 0.5) * 2;
    const dist = Math.abs(dx);
    const loft = dist > 20 ? 0.2 + power * 0.3 : power * 0.1;
    const curl = (Math.random() - 0.5) * power * 0.5;
    this.ball.kick({ x: dx, y: 0, z: dz }, 0.3 + power * 0.7, loft, curl, player.id, player.team);
    player.animState = 'shoot';
    player.animTime = 0;
  }

  handleTackle(player: PlayerEntity, slide = false): void {
    if (player.cooldown > 0) return;
    player.animState = slide ? 'slide' : 'tackle';
    player.animTime = 0;
    player.cooldown = slide ? 2 : 1;

    const ballDist = Math.hypot(
      player.position.x - this.ball.state.position.x,
      player.position.z - this.ball.state.position.z,
    );
    if (ballDist < (slide ? 2.5 : 1.5)) {
      this.ball.state.velocity.x *= 0.3;
      this.ball.state.velocity.z *= 0.3;
      if (this.ball.state.lastTouchedTeam && this.ball.state.lastTouchedTeam !== player.team) {
        if (Math.random() < 0.1) {
          this.events.push({ type: 'foul', team: player.team, playerId: player.id, minute: this.clock.minute });
        }
      }
    }
  }
}
