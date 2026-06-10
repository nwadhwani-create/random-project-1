import * as THREE from 'three';
import { Ball } from './ball';
import { PlayerSim } from './player';
import { formationSlots, type Slot } from './formations';
import type { Team } from '../data/roster';
import {
  HALF_L, HALF_W, GOAL_HALF_W, GOAL_HEIGHT, BALL_RADIUS, CONTROL_RADIUS, CONTROL_HEIGHT,
  PENALTY_SPOT, BOX_LENGTH, BOX_WIDTH, CENTER_CIRCLE_R, DIFFICULTY, type Difficulty, type DifficultyParams,
} from './const';

export type Phase =
  | 'reset'        // players jogging to restart positions
  | 'set-piece'    // waiting for taker (kickoff, throw-in, corner, goal kick, free kick, penalty)
  | 'play'
  | 'goal'         // celebration
  | 'half-end' | 'full-end'
  | 'shootout';

export type RestartKind = 'kickoff' | 'throw-in' | 'corner' | 'goal-kick' | 'free-kick' | 'penalty' | null;

export interface MatchEvent {
  type: string;
  team?: number;
  player?: PlayerSim;
  text?: string;
  minute?: number;
}

export interface Scorer { name: string; minute: number; team: number; }

export interface TeamStats {
  shots: number; onTarget: number; fouls: number; corners: number;
  yellows: number; reds: number; possession: number; // possession = accumulated seconds
  saves: number; offsides: number;
}

export interface MatchConfig {
  halfMinutes: number;       // real minutes per half (3 / 5 / 10)
  difficulty: Difficulty;
  knockout: boolean;         // extra time + shootout if drawn
  userTeams: [boolean, boolean]; // which sides are human controlled
  shootoutOnly?: boolean;    // penalty practice mode
}

export interface SideState {
  team: Team;
  players: PlayerSim[];
  attackDir: 1 | -1;
  score: number;
  stats: TeamStats;
}

interface PassSnapshot {
  teamIdx: number;
  passer: PlayerSim;
  /** x positions (signed toward attackDir) of attackers at pass time */
  positions: Map<PlayerSim, number>;
  secondLastDef: number; // signed defensive line
  ballX: number;
  throughIntent: boolean;
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();

const newStats = (): TeamStats => ({ shots: 0, onTarget: 0, fouls: 0, corners: 0, yellows: 0, reds: 0, possession: 0, saves: 0, offsides: 0 });

export class Match {
  ball = new Ball();
  sides: [SideState, SideState];
  phase: Phase = 'reset';
  restart: RestartKind = 'kickoff';
  restartTeam = 0;
  restartPos = new THREE.Vector3();
  restartTaker: PlayerSim | null = null;
  phaseTime = 0;

  /** game clock in game-seconds (45*60 per half) */
  clock = 0;
  half = 1; // 1, 2, 3 (ET1), 4 (ET2)
  totalHalves = 2;
  timeScale: number;
  over = false;

  scorers: Scorer[] = [];
  events: MatchEvent[] = [];
  diff: DifficultyParams;

  // shootout state
  shootout = false;
  shootoutScores: [number[], number[]] = [[], []];
  shootoutKicker = 0; // team index taking next
  shootoutRound = 0;
  shootoutDone = false;
  penaltyResolved: 'goal' | 'miss' | 'save' | null = null;
  private penSave: { t: number } | null = null;

  /** excitement 0..1 for crowd audio */
  excitement = 0.2;

  lastPass: PassSnapshot | null = null;
  pendingOffside: { player: PlayerSim; teamIdx: number } | null = null;
  advantage: { teamIdx: number; pos: THREE.Vector3; t: number } | null = null;

  winner: number | -1 = -1;

  constructor(home: Team, away: Team, public cfg: MatchConfig) {
    this.diff = DIFFICULTY[cfg.difficulty];
    this.timeScale = (45 * 60) / (cfg.halfMinutes * 60);
    this.sides = [
      { team: home, players: this.makePlayers(home, 0), attackDir: 1, score: 0, stats: newStats() },
      { team: away, players: this.makePlayers(away, 1), attackDir: -1, score: 0, stats: newStats() },
    ];
    if (cfg.shootoutOnly) {
      this.beginShootout();
    } else {
      this.setupKickoff(0);
    }
  }

  private makePlayers(team: Team, teamIdx: number): PlayerSim[] {
    const slots = formationSlots(team.meta.formation);
    return team.lineup.map((p, i) => new PlayerSim(teamIdx, i, p, slots[i].role));
  }

  emit(type: string, e: Partial<MatchEvent> = {}): void {
    this.events.push({ type, minute: this.minute, ...e });
  }

  get minute(): number {
    const base = this.half <= 2 ? (this.half - 1) * 45 : 90 + (this.half - 3) * 15;
    const halfLen = this.half <= 2 ? 45 : 15;
    return Math.min(base + halfLen, base + Math.floor(this.clock / 60) + 1);
  }

  get clockDisplay(): string {
    const base = this.half <= 2 ? (this.half - 1) * 45 * 60 : 90 * 60 + (this.half - 3) * 15 * 60;
    const t = base + this.clock;
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  slot(p: PlayerSim): Slot {
    return formationSlots(this.sides[p.teamIdx].team.meta.formation)[p.idx];
  }

  /** signed x in attacking direction of given team */
  attX(teamIdx: number, x: number): number { return x * this.sides[teamIdx].attackDir; }

  opponents(teamIdx: number): PlayerSim[] { return this.sides[1 - teamIdx].players; }

  activePlayers(teamIdx: number): PlayerSim[] { return this.sides[teamIdx].players.filter((p) => !p.sentOff); }

  nearestToBall(teamIdx: number, exclude?: PlayerSim): PlayerSim | null {
    let best: PlayerSim | null = null, bd = Infinity;
    for (const p of this.activePlayers(teamIdx)) {
      if (p === exclude || !p.controllable) continue;
      const d = p.pos.distanceToSquared(this.ball.pos);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  ballOwnerPlayer(): PlayerSim | null {
    const o = this.ball.owner;
    if (!o) return null;
    return this.sides[o.teamIdx].players[o.playerIdx];
  }

  // ---------------------------------------------------------------- restarts

  private formationPosition(p: PlayerSim, kickoff = false): THREE.Vector3 {
    const side = this.sides[p.teamIdx];
    const s = this.slot(p);
    let x = s.x * HALF_L * 0.95;
    if (kickoff) x = Math.min(x, -2.5); // everyone in own half
    return new THREE.Vector3(x * side.attackDir, 0, s.z * HALF_W * 0.85 * side.attackDir);
  }

  setupKickoff(teamIdx: number): void {
    this.phase = 'reset';
    this.restart = 'kickoff';
    this.restartTeam = teamIdx;
    this.restartPos.set(0, 0, 0);
    this.phaseTime = 0;
    this.ball.reset(0, 0);
    for (const side of this.sides) {
      for (const p of side.players) {
        const pos = this.formationPosition(p, true);
        if (p.teamIdx === teamIdx && this.slot(p).role === 'ST' && p.idx === side.players.length - 1) {
          pos.set(-0.8 * side.attackDir, 0, 0.4);
        }
        p.warp(pos.x, pos.z, side.attackDir === 1 ? 0 : Math.PI);
      }
    }
    const side = this.sides[teamIdx];
    const taker = side.players[side.players.length - 1];
    taker.warp(-1.1 * side.attackDir, 0.25, side.attackDir === 1 ? 0 : Math.PI);
    this.restartTaker = taker;
    this.phase = 'set-piece';
    this.emit('whistle');
  }

  private beginReset(kind: Exclude<RestartKind, null>, teamIdx: number, x: number, z: number): void {
    this.phase = 'reset';
    this.restart = kind;
    this.restartTeam = teamIdx;
    this.restartPos.set(x, 0, z);
    this.phaseTime = 0;
    this.ball.reset(x, z);
    this.lastPass = null;
    this.pendingOffside = null;
    this.penSave = null;
    // choose taker = nearest eligible
    const side = this.sides[teamIdx];
    let taker: PlayerSim | null = null;
    if (kind === 'goal-kick') taker = side.players[0];
    else if (kind === 'penalty') {
      taker = this.activePlayers(teamIdx).filter((p) => !p.isGK).sort((a, b) => b.data.attrs.shooting - a.data.attrs.shooting)[0];
    } else {
      let bd = Infinity;
      for (const p of this.activePlayers(teamIdx)) {
        if (p.isGK) continue;
        const d = p.pos.distanceToSquared(this.restartPos);
        if (d < bd) { bd = d; taker = p; }
      }
    }
    this.restartTaker = taker;
  }

  awardThrowIn(teamIdx: number, x: number, z: number): void {
    this.emit('out');
    this.beginReset('throw-in', teamIdx, THREE.MathUtils.clamp(x, -HALF_L + 1, HALF_L - 1), Math.sign(z) * HALF_W);
  }

  awardCorner(teamIdx: number, zSide: number): void {
    const side = this.sides[teamIdx];
    this.sides[teamIdx].stats.corners++;
    this.emit('corner', { team: teamIdx });
    this.beginReset('corner', teamIdx, HALF_L * side.attackDir, Math.sign(zSide) * HALF_W);
  }

  awardGoalKick(teamIdx: number): void {
    const side = this.sides[teamIdx];
    this.emit('out');
    this.beginReset('goal-kick', teamIdx, -side.attackDir * (HALF_L - 5.5), 0);
  }

  awardFreeKick(teamIdx: number, x: number, z: number): void {
    this.beginReset('free-kick', teamIdx, THREE.MathUtils.clamp(x, -HALF_L + 1, HALF_L - 1), THREE.MathUtils.clamp(z, -HALF_W + 1, HALF_W - 1));
  }

  awardPenalty(teamIdx: number): void {
    const side = this.sides[teamIdx];
    this.emit('penalty', { team: teamIdx, text: 'PENALTY!' });
    this.beginReset('penalty', teamIdx, side.attackDir * (HALF_L - PENALTY_SPOT), 0);
  }

  /** placement for set pieces once reset movement is done */
  private setPiecePositions(): void {
    const kind = this.restart!;
    const atkIdx = this.restartTeam;
    const atk = this.sides[atkIdx];
    const def = this.sides[1 - atkIdx];
    const taker = this.restartTaker;

    for (const sideState of this.sides) {
      for (const p of sideState.players) {
        if (p === taker || p.sentOff) continue;
        const pos = this.formationPosition(p);
        // shift shape toward the restart spot
        const shift = THREE.MathUtils.clamp(this.restartPos.x - pos.x, -18, 18) * 0.45;
        pos.x += shift;
        if (kind === 'corner') {
          // crowd the box
          const role = this.slot(p).role;
          const inAtkBox = sideState === atk && (role === 'ST' || role === 'CB' || role === 'AM' || role === 'WG');
          const inDefBox = sideState === def && role !== 'GK';
          const goalX = HALF_L * atk.attackDir;
          if (inAtkBox) {
            pos.set(goalX - atk.attackDir * (6 + Math.abs(p.idx % 4) * 2.6), 0, (p.idx % 5 - 2) * 3.4);
          } else if (inDefBox && (this.slot(p).role === 'CB' || this.slot(p).role === 'FB' || this.slot(p).role === 'DM' || this.slot(p).role === 'CM')) {
            pos.set(goalX - atk.attackDir * (4.5 + (p.idx % 4) * 2.2), 0, (p.idx % 5 - 2) * 2.8 + 0.9);
          }
        }
        if (kind === 'penalty') {
          // everyone outside the box except taker & GK
          const goalX = HALF_L * atk.attackDir;
          const dx = Math.abs(pos.x - goalX);
          if (dx < BOX_LENGTH + 2 && Math.abs(pos.z) < BOX_WIDTH / 2 + 2) {
            pos.x = goalX - atk.attackDir * (BOX_LENGTH + 3 + (p.idx % 3) * 1.5);
            pos.z = THREE.MathUtils.clamp(pos.z * 1.4 + (p.idx % 2 ? 3 : -3), -HALF_W + 3, HALF_W - 3);
          }
        }
        if (kind === 'free-kick' && sideState === def) {
          // 9.15m away from ball
          const d = pos.distanceTo(this.restartPos);
          if (d < 9.5) {
            v1.copy(pos).sub(this.restartPos).setY(0);
            if (v1.lengthSq() < 0.01) v1.set(-atk.attackDir, 0, 0);
            v1.normalize();
            pos.copy(this.restartPos).addScaledVector(v1, 9.5);
          }
          // wall: 2-3 defenders between ball and goal if shooting range
          const goalX = HALF_L * atk.attackDir;
          const distGoal = Math.hypot(this.restartPos.x - goalX, this.restartPos.z);
          if (distGoal < 30) {
            const role = this.slot(p).role;
            if (role === 'CM' || role === 'DM' || role === 'ST') {
              const wallIdx = p.idx % 3;
              v1.set(goalX - this.restartPos.x, 0, -this.restartPos.z).normalize();
              v2.set(-v1.z, 0, v1.x);
              pos.copy(this.restartPos).addScaledVector(v1, 9.2).addScaledVector(v2, (wallIdx - 1) * 0.55);
            }
          }
        }
        if (kind === 'kickoff') {
          pos.x = sideState.attackDir === 1 ? Math.min(pos.x, -2) : Math.max(pos.x, 2);
        }
        p.moveTarget.copy(pos);
      }
    }

    // GK for penalty stands on the line
    if (kind === 'penalty' || this.shootout) {
      const gk = def.players[0];
      const goalX = HALF_L * atk.attackDir;
      gk.moveTarget.set(goalX, 0, 0);
    }
    // taker stands near the ball
    if (taker) {
      const off = kind === 'penalty' ? 3 : 1.2;
      v1.set(-atk.attackDir * off, 0, kind === 'corner' ? -Math.sign(this.restartPos.z) * 0.8 : 0.3);
      taker.moveTarget.copy(this.restartPos).add(v1);
    }
  }

  /** Take the restart. dir/power may come from the user; AI passes sensible defaults. */
  takeSetPiece(dirHint?: THREE.Vector3, lofted = false, power = 0.5): void {
    const taker = this.restartTaker;
    if (!taker || this.phase !== 'set-piece') return;
    const kind = this.restart!;
    const atk = this.sides[this.restartTeam];

    if (kind === 'penalty') { this.takePenalty(dirHint, power); return; }

    if (kind === 'throw-in') {
      taker.setState('throw');
      const target = this.bestPassTarget(taker, dirHint, false);
      v1.copy(target ? target.pos : v2.set(taker.pos.x + atk.attackDir * 8, 0, taker.pos.z - Math.sign(taker.pos.z) * 6)).sub(this.ball.pos);
      const d = v1.length();
      v1.normalize().multiplyScalar(Math.min(14, 5 + d * 0.55));
      v1.y = Math.min(6, 2 + d * 0.18);
      this.ball.pos.set(taker.pos.x, 1.9, taker.pos.z);
      this.ball.kick(v1);
      this.ball.touch(taker.teamIdx, taker.idx, this.clock);
      taker.ballLock = 0.7;
      this.phase = 'play';
      this.emit('throw');
      return;
    }

    taker.startKick();
    let vel: THREE.Vector3;
    const spin = v3.set(0, 0, 0);
    if (kind === 'corner') {
      // cross to the box
      const goalX = HALF_L * atk.attackDir;
      const tx = goalX - atk.attackDir * (7 + Math.random() * 4);
      const tz = (Math.random() - 0.5) * 10;
      vel = this.lobVelocity(this.ball.pos, v1.set(tx, 0, tz), 1.1);
      spin.set(0, -Math.sign(this.restartPos.z) * atk.attackDir * 6, 0);
      this.emit('cross');
    } else if (kind === 'goal-kick') {
      const target = this.bestPassTarget(taker, dirHint, true);
      const tp = target ? target.pos : v2.set(atk.attackDir * 10, 0, (Math.random() - 0.5) * 30);
      vel = lofted || !target || tp.distanceTo(this.ball.pos) > 30
        ? this.lobVelocity(this.ball.pos, tp, 1.0)
        : this.groundPassVelocity(this.ball.pos, tp);
    } else { // free-kick or kickoff
      const goalX = HALF_L * atk.attackDir;
      const distGoal = Math.hypot(this.restartPos.x - goalX, this.restartPos.z);
      const shootIt = kind === 'free-kick' && distGoal < 28 && (dirHint ? power > 0.55 : Math.random() < 0.5);
      if (shootIt) {
        // curled free kick on goal
        v1.set(goalX, GOAL_HEIGHT * 0.7, (Math.random() - 0.5) * GOAL_HALF_W * 1.4).sub(this.ball.pos);
        const d = v1.length();
        vel = v1.normalize().multiplyScalar(Math.min(27, 17 + d * 0.32));
        vel.y += d * 0.13;
        spin.set(0, (Math.random() < 0.5 ? 1 : -1) * 7, 0);
        this.registerShot(taker);
        this.emit('shot');
      } else {
        const target = this.bestPassTarget(taker, dirHint, kind !== 'kickoff');
        const tp = target ? target.pos : v2.set(this.restartPos.x - atk.attackDir * 6, 0, this.restartPos.z * 0.5);
        vel = lofted && tp.distanceTo(this.ball.pos) > 14
          ? this.lobVelocity(this.ball.pos, tp, 1.0)
          : this.groundPassVelocity(this.ball.pos, tp);
        if (kind === 'free-kick') this.recordPass(taker, false);
      }
    }
    this.ball.kick(vel, spin);
    this.ball.touch(taker.teamIdx, taker.idx, this.clock);
    taker.ballLock = 0.6;
    this.phase = 'play';
    this.emit('kick', { player: taker });
  }

  // ---------------------------------------------------------------- penalties

  takePenalty(dirHint?: THREE.Vector3, power = 0.6): void {
    const taker = this.restartTaker;
    if (!taker) return;
    const atkIdx = this.restartTeam;
    const atk = this.sides[atkIdx];
    const def = this.sides[1 - atkIdx];
    const gk = def.players[0];
    const goalX = HALF_L * atk.attackDir;
    taker.startKick();

    // aim: user direction or AI choice
    let aimZ: number, aimY: number;
    if (dirHint && dirHint.lengthSq() > 0.01) {
      aimZ = THREE.MathUtils.clamp(dirHint.z, -1, 1) * GOAL_HALF_W * 1.06;
      aimY = power > 0.75 ? 1.9 : 0.6;
    } else {
      const corners = [-0.85, -0.45, 0.45, 0.85];
      aimZ = corners[Math.floor(Math.random() * corners.length)] * GOAL_HALF_W;
      aimY = Math.random() < 0.4 ? 1.7 : 0.5;
    }
    // skill noise: low shooting or max power = wilder
    const noise = (1 - taker.data.attrs.shooting / 110) * 1.4 + Math.max(0, power - 0.82) * 3.2;
    aimZ += (Math.random() - 0.5) * 2 * noise;
    aimY += Math.random() * noise * 0.8;

    v1.set(goalX, aimY, aimZ).sub(this.ball.pos);
    const speed = 17 + power * 9;
    this.ball.kick(v1.normalize().multiplyScalar(speed));
    this.ball.touch(taker.teamIdx, taker.idx, this.clock);
    this.registerShot(taker);

    // GK dive decision
    const guess = Math.random();
    const correct = guess < 0.42 + (gk.data.attrs.reflexes ?? 70) / 400;
    const diveZ = correct ? Math.sign(aimZ || (Math.random() - 0.5)) : -Math.sign(aimZ || 1);
    v2.set(0, 0, diveZ * (3 + Math.random() * 1.5));
    gk.startDive(v2);
    gk.facing = Math.atan2(0 - gk.pos.z, -atk.attackDir);
    this.emit('shot');
    this.phase = 'play';
    this.penaltyResolved = null;
    // save resolution: scheduled at ball arrival if GK guessed right
    this.penSave = null;
    const onTarget = Math.abs(aimZ) < GOAL_HALF_W - 0.1 && aimY < GOAL_HEIGHT - 0.1;
    if (correct && onTarget) {
      const placement = Math.abs(aimZ) / GOAL_HALF_W; // 1 = right in the corner
      const high = aimY > 1.4 ? 0.75 : 1;
      const pSave = (0.78 - placement * 0.5 - power * 0.22) * high * (0.7 + (gk.data.attrs.diving ?? 75) / 250);
      if (Math.random() < Math.max(0.05, pSave)) {
        this.penSave = { t: (PENALTY_SPOT / speed) * 0.92 };
      }
    }
  }

  beginShootout(): void {
    this.shootout = true;
    this.phase = 'shootout';
    this.shootoutKicker = 0;
    this.shootoutRound = 0;
    this.emit('shootout', { text: 'PENALTY SHOOTOUT' });
    this.nextShootoutKick();
  }

  nextShootoutKick(): void {
    // park everyone at center circle, GK in goal, taker at spot
    const atkIdx = this.shootoutKicker;
    const atk = this.sides[atkIdx];
    const def = this.sides[1 - atkIdx];
    const goalX = HALF_L; // always use +x goal for shootout
    atk.attackDir = 1; def.attackDir = -1;
    this.restartTeam = atkIdx;
    this.restart = 'penalty';
    this.restartPos.set(goalX - PENALTY_SPOT, 0, 0);
    this.ball.reset(this.restartPos.x, 0);
    const kicks = this.shootoutScores[atkIdx].length;
    const order = this.activePlayers(atkIdx).filter((p) => !p.isGK).sort((a, b) => b.data.attrs.shooting - a.data.attrs.shooting);
    this.restartTaker = order[kicks % order.length];
    let i = 0;
    for (const side of this.sides) {
      for (const p of side.players) {
        if (p === this.restartTaker) continue;
        if (p.isGK && side === def) { p.warp(goalX - 0.3, 0, Math.PI); continue; }
        const ang = (i / 21) * Math.PI * 2;
        p.warp(Math.cos(ang) * 8, Math.sin(ang) * 7, 0);
        i++;
      }
    }
    this.restartTaker!.warp(this.restartPos.x - 3, 0.3, 0);
    this.phase = 'set-piece';
    this.phaseTime = 0;
    this.penaltyResolved = null;
  }

  private resolveShootoutKick(result: 'goal' | 'miss' | 'save'): void {
    const t = this.shootoutKicker;
    this.shootoutScores[t].push(result === 'goal' ? 1 : 0);
    this.emit(result === 'goal' ? 'pen-goal' : 'pen-miss', { team: t });
    const a = this.shootoutScores[0], b = this.shootoutScores[1];
    const sum = (arr: number[]) => arr.reduce((s, x) => s + x, 0);
    const sa = sum(a), sb = sum(b);
    // decided?
    const remA = Math.max(0, 5 - a.length), remB = Math.max(0, 5 - b.length);
    let done = false;
    if (a.length >= 5 && b.length >= 5 && a.length === b.length && sa !== sb) done = true;
    if (!done && (sa > sb + remB || sb > sa + remA)) done = true;
    if (done) {
      this.shootoutDone = true;
      this.winner = sa > sb ? 0 : 1;
      this.phase = 'full-end';
      this.over = true;
      this.emit('fulltime', { text: 'SHOOTOUT OVER' });
      return;
    }
    this.shootoutKicker = 1 - this.shootoutKicker;
    this.nextShootoutKick();
  }

  // ---------------------------------------------------------------- kicking helpers

  groundPassVelocity(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
    const d = v1.copy(to).sub(from).setY(0);
    const dist = d.length();
    const speed = THREE.MathUtils.clamp(7 + dist * 0.62, 8, 26);
    return d.normalize().multiplyScalar(speed).clone();
  }

  lobVelocity(from: THREE.Vector3, to: THREE.Vector3, arc = 1): THREE.Vector3 {
    const d = v1.copy(to).sub(from).setY(0);
    const dist = d.length();
    const speed = THREE.MathUtils.clamp(6 + dist * 0.5, 8, 24);
    const out = d.normalize().multiplyScalar(speed).clone();
    out.y = THREE.MathUtils.clamp(3.2 + dist * 0.17, 3, 11.5) * arc;
    return out;
  }

  /** choose pass target weighted by direction hint and openness */
  bestPassTarget(passer: PlayerSim, dirHint?: THREE.Vector3, preferForward = true, through = false): PlayerSim | null {
    const side = this.sides[passer.teamIdx];
    const opps = this.opponents(passer.teamIdx);
    let best: PlayerSim | null = null;
    let bestScore = -Infinity;
    for (const p of this.activePlayers(passer.teamIdx)) {
      if (p === passer || !p.controllable) continue;
      v1.copy(p.pos).sub(passer.pos).setY(0);
      const dist = v1.length();
      if (dist < 2 || dist > (through ? 45 : 38)) continue;
      let score = 0;
      // direction match
      if (dirHint && dirHint.lengthSq() > 0.01) {
        const dot = v1.clone().normalize().dot(v2.copy(dirHint).normalize());
        if (dot < -0.1) continue;
        score += dot * 30;
      }
      if (preferForward) score += this.attX(passer.teamIdx, p.pos.x - passer.pos.x) * 0.9;
      // openness
      let nearestOpp = Infinity;
      for (const o of opps) nearestOpp = Math.min(nearestOpp, o.pos.distanceToSquared(p.pos));
      score += Math.min(10, Math.sqrt(nearestOpp)) * 1.4;
      // lane blocked?
      let lanePenalty = 0;
      for (const o of opps) {
        v2.copy(o.pos).sub(passer.pos).setY(0);
        const t = v2.dot(v1) / (dist * dist);
        if (t > 0.08 && t < 0.95) {
          const perp = v3.copy(passer.pos).addScaledVector(v1, t).distanceTo(o.pos);
          if (perp < 1.6) lanePenalty += (1.6 - perp) * 12;
        }
      }
      score -= through ? lanePenalty * 0.4 : lanePenalty;
      // distance comfort
      score -= Math.abs(dist - (through ? 22 : 14)) * 0.35;
      if (p.isGK) score -= 18;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    void side;
    return best;
  }

  /** record an attempted pass for offside checking */
  recordPass(passer: PlayerSim, through: boolean): void {
    const teamIdx = passer.teamIdx;
    const dir = this.sides[teamIdx].attackDir;
    const positions = new Map<PlayerSim, number>();
    for (const p of this.activePlayers(teamIdx)) positions.set(p, p.pos.x * dir);
    const defXs = this.activePlayers(1 - teamIdx).map((p) => p.pos.x * dir).sort((a, b) => b - a);
    const secondLastDef = defXs[1] ?? defXs[0] ?? 0;
    this.lastPass = { teamIdx, passer, positions, secondLastDef, ballX: this.ball.pos.x * dir, throughIntent: through };
  }

  registerShot(p: PlayerSim): void {
    this.sides[p.teamIdx].stats.shots++;
    this.excitement = Math.min(1, this.excitement + 0.35);
  }

  // ---------------------------------------------------------------- actions (shared by user & AI)

  pass(p: PlayerSim, dirHint?: THREE.Vector3, lofted = false, through = false): boolean {
    if (!p.hasBall || p.cooldown > 0) return false;
    let target = this.bestPassTarget(p, dirHint, true, through);
    p.hasBall = false;
    this.ball.owner = null;
    p.startKick();
    let vel: THREE.Vector3;
    const aimNoise = this.cfg.userTeams[p.teamIdx] ? 0.02 : this.diff.passError;
    const err = aimNoise * (1 - p.data.attrs.passing / 130);
    if (target) {
      v2.copy(target.pos);
      if (through) {
        // lead the runner into space
        const lead = 6 + target.maxSprint * 0.9;
        v2.x += this.sides[p.teamIdx].attackDir * lead;
        v2.z += (target.vel.z) * 0.8;
      } else {
        v2.addScaledVector(target.vel, 0.25);
      }
      vel = lofted ? this.lobVelocity(this.ball.pos, v2, through ? 0.85 : 1) : this.groundPassVelocity(this.ball.pos, v2);
    } else {
      const d = dirHint && dirHint.lengthSq() > 0.01 ? v2.copy(dirHint).normalize() : v2.set(Math.cos(p.facing), 0, Math.sin(p.facing));
      vel = d.multiplyScalar(lofted ? 14 : 12).clone();
      if (lofted) vel.y = 6;
    }
    // noise
    const ang = (Math.random() - 0.5) * 2 * err * 3;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const vx = vel.x * cos - vel.z * sin, vz = vel.x * sin + vel.z * cos;
    vel.x = vx; vel.z = vz;
    this.ball.kick(vel);
    this.ball.touch(p.teamIdx, p.idx, this.clock);
    p.ballLock = 0.5;
    this.recordPass(p, through);
    this.emit('kick', { player: p });
    return true;
  }

  shoot(p: PlayerSim, power: number, aimSide = 0): boolean {
    if (!p.hasBall || p.cooldown > 0) return false;
    p.hasBall = false;
    this.ball.owner = null;
    p.startKick();
    const side = this.sides[p.teamIdx];
    const goalX = HALF_L * side.attackDir;
    const distGoal = Math.hypot(goalX - p.pos.x, p.pos.z);
    // aim point in the goal mouth
    const skill = p.data.attrs.shooting / 100;
    const noise = (1 - skill * 0.75) * (0.5 + power * 0.9) * (distGoal / 18);
    let aimZ = THREE.MathUtils.clamp(aimSide, -1, 1) * GOAL_HALF_W * 0.82;
    if (aimSide === 0) aimZ = Math.sign(p.pos.z || Math.random() - 0.5) * -GOAL_HALF_W * 0.6; // far corner default
    aimZ += (Math.random() - 0.5) * 2 * noise * 2.6;
    let aimY = 0.4 + power * 1.3 + (Math.random() - 0.5) * noise;
    aimY = Math.max(0.15, aimY);
    v1.set(goalX, aimY, aimZ).sub(this.ball.pos);
    const speed = THREE.MathUtils.clamp(15 + power * 15 * (0.75 + skill * 0.35), 13, 31);
    const vel = v1.normalize().multiplyScalar(speed).clone();
    // curl
    const spin = v3.set(0, (Math.random() - 0.5) * 4 + -Math.sign(p.pos.z) * 2.5, 0).clone();
    this.ball.kick(vel, spin);
    this.ball.touch(p.teamIdx, p.idx, this.clock);
    p.ballLock = 0.5;
    this.registerShot(p);
    this.lastPass = null;
    this.emit('shot', { player: p });
    return true;
  }

  clearBall(p: PlayerSim): boolean {
    if (!p.hasBall || p.cooldown > 0) return false;
    p.hasBall = false;
    this.ball.owner = null;
    p.startKick();
    const side = this.sides[p.teamIdx];
    v1.set(side.attackDir, 0, Math.sign(p.pos.z || 1) * 0.8).normalize().multiplyScalar(22);
    v1.y = 8;
    this.ball.kick(v1);
    this.ball.touch(p.teamIdx, p.idx, this.clock);
    p.ballLock = 0.6;
    this.emit('kick', { player: p });
    return true;
  }

  /** standing tackle attempt */
  tackle(p: PlayerSim): boolean {
    if (p.cooldown > 0 || !p.controllable) return false;
    p.cooldown = 0.85;
    const carrier = this.ballOwnerPlayer();
    if (!carrier || carrier.teamIdx === p.teamIdx) return false;
    const d = p.pos.distanceTo(carrier.pos);
    if (d > 1.7) return false;
    const winP = 0.45 + (p.data.attrs.defending - carrier.data.attrs.dribbling) / 180;
    if (Math.random() < winP) {
      // win the ball: pop it loose toward tackler
      carrier.hasBall = false;
      this.ball.owner = null;
      carrier.ballLock = 0.8;
      v1.copy(p.pos).sub(carrier.pos).setY(0).normalize().multiplyScalar(3.5);
      this.ball.vel.copy(v1);
      this.ball.pos.y = BALL_RADIUS;
      this.ball.touch(p.teamIdx, p.idx, this.clock);
      this.emit('tackle', { player: p });
      return true;
    } else if (Math.random() < 0.09) {
      this.foul(p, carrier, false);
    }
    return false;
  }

  slideTackle(p: PlayerSim): boolean {
    if (p.cooldown > 0 || !p.controllable || p.state === 'slide') return false;
    // direction: toward ball
    v1.copy(this.ball.pos).sub(p.pos).setY(0);
    if (v1.lengthSq() < 0.04) v1.set(Math.cos(p.facing), 0, Math.sin(p.facing));
    p.startSlide(v1);
    this.emit('slide', { player: p });
    return true;
  }

  /** called during play step to resolve ongoing slides */
  private resolveSlide(p: PlayerSim): void {
    if (p.state !== 'slide' || p.stateTime > 0.45) return;
    const carrier = this.ballOwnerPlayer();
    // ball contact?
    const dBall = p.pos.distanceTo(this.ball.pos);
    if (dBall < 1.15 && this.ball.pos.y < 0.6) {
      if (carrier && carrier.teamIdx !== p.teamIdx) {
        carrier.hasBall = false;
        this.ball.owner = null;
        carrier.ballLock = 0.9;
      }
      if (!carrier || carrier.teamIdx !== p.teamIdx) {
        v1.copy(p.vel).setY(0).normalize().multiplyScalar(7);
        this.ball.kick(v1);
        this.ball.touch(p.teamIdx, p.idx, this.clock);
        p.stateTime = 0.46; // mark contact done
        this.emit('tackle', { player: p });
        return;
      }
    }
    // player contact without ball = foul risk
    for (const o of this.opponents(p.teamIdx)) {
      if (!o.controllable || o.state === 'fall') continue;
      if (p.pos.distanceTo(o.pos) < 0.85) {
        const hadBall = o.hasBall;
        o.knockDown();
        if (o.hasBall || hadBall) { o.hasBall = false; this.ball.owner = null; }
        p.stateTime = 0.46;
        this.foul(p, o, true);
        return;
      }
    }
  }

  foul(offender: PlayerSim, victim: PlayerSim, slide: boolean): void {
    const defSide = this.sides[offender.teamIdx];
    const atkIdx = victim.teamIdx;
    this.sides[offender.teamIdx].stats.fouls++;
    // advantage if attacking team retains ball... keep simple: always whistle
    void defSide;
    // card?
    const goalX = HALF_L * this.sides[atkIdx].attackDir;
    const distGoal = Math.hypot(goalX - victim.pos.x, victim.pos.z);
    const lastMan = slide && distGoal < 22 && this.defendersBehind(offender, victim) === 0;
    let card: 'none' | 'yellow' | 'red' = 'none';
    const r = Math.random();
    if (lastMan || (slide && r < 0.05)) card = 'red';
    else if (slide && r < 0.38) card = 'yellow';
    else if (!slide && r < 0.1) card = 'yellow';
    if (card === 'yellow') {
      offender.yellow++;
      this.sides[offender.teamIdx].stats.yellows++;
      if (offender.yellow >= 2) card = 'red';
      else this.emit('yellow', { player: offender, team: offender.teamIdx, text: `Yellow card: ${offender.data.name}` });
    }
    if (card === 'red') {
      offender.sentOff = true;
      this.sides[offender.teamIdx].stats.reds++;
      this.emit('red', { player: offender, team: offender.teamIdx, text: `RED CARD: ${offender.data.name}` });
    }
    this.emit('foul', { player: offender, text: `Foul by ${offender.data.name}` });
    // penalty?
    const inBox = Math.abs(victim.pos.x - goalX) < BOX_LENGTH && Math.abs(victim.pos.z) < BOX_WIDTH / 2;
    if (inBox) this.awardPenalty(atkIdx);
    else this.awardFreeKick(atkIdx, victim.pos.x, victim.pos.z);
  }

  private defendersBehind(offender: PlayerSim, victim: PlayerSim): number {
    const dir = this.sides[victim.teamIdx].attackDir;
    const goalX = HALF_L * dir;
    let n = 0;
    for (const d of this.activePlayers(offender.teamIdx)) {
      if (d === offender) continue;
      if ((goalX - d.pos.x) * dir > 0 && (d.pos.x - victim.pos.x) * dir > 0) n++;
    }
    return n;
  }

  // ---------------------------------------------------------------- main step

  step(dt: number): void {
    this.phaseTime += dt;
    this.excitement = Math.max(0.15, this.excitement - dt * 0.06);

    switch (this.phase) {
      case 'reset': this.stepReset(dt); break;
      case 'set-piece': this.stepSetPiece(dt); break;
      case 'play': this.stepPlay(dt); break;
      case 'goal': this.stepGoalCelebration(dt); break;
      case 'half-end': break;
      case 'full-end': break;
      case 'shootout': break;
    }
  }

  private stepPlayers(dt: number): void {
    for (const side of this.sides) {
      for (const p of side.players) {
        if (p.sentOff) continue;
        const human = this.cfg.userTeams[p.teamIdx];
        p.step(dt, human ? 1 : this.diff.speedMul);
        // keep on pitch (with margin)
        p.pos.x = THREE.MathUtils.clamp(p.pos.x, -HALF_L - 2.5, HALF_L + 2.5);
        p.pos.z = THREE.MathUtils.clamp(p.pos.z, -HALF_W - 2.5, HALF_W + 2.5);
      }
    }
  }

  private stepReset(dt: number): void {
    this.setPiecePositions();
    this.stepPlayers(dt);
    // ready when taker near ball or timeout
    const taker = this.restartTaker;
    const ready = !taker || taker.pos.distanceTo(this.restartPos) < 2.2;
    if ((ready && this.phaseTime > 1.2) || this.phaseTime > 6) {
      this.phase = 'set-piece';
      this.phaseTime = 0;
      if (this.restart === 'kickoff') this.emit('whistle');
    }
  }

  private stepSetPiece(dt: number): void {
    this.setPiecePositions();
    this.stepPlayers(dt);
    // AI takes automatically after a beat; user side waits for input (handled by controller)
    const userControlled = this.cfg.userTeams[this.restartTeam];
    if (!userControlled && this.phaseTime > (this.restart === 'penalty' ? 2.2 : 1.4)) {
      this.takeSetPiece();
    }
  }

  private stepPlay(dt: number): void {
    const scaledDt = dt;
    // clock only runs in open play (penalties during shootout don't advance it)
    if (!this.shootout) {
      this.clock += scaledDt * this.timeScale;
      const halfLen = (this.half <= 2 ? 45 : 15) * 60;
      if (this.clock >= halfLen && this.ball.pos.y < 2 && Math.abs(this.ball.pos.x) < HALF_L - 8) {
        this.endHalf();
        return;
      }
    }

    this.stepPlayers(dt);
    this.ball.step(dt);

    // scheduled penalty save: GK gets a glove to it as the ball arrives
    if (this.penSave) {
      this.penSave.t -= dt;
      if (this.penSave.t <= 0) {
        this.penSave = null;
        const atk = this.sides[this.restartTeam];
        const gk = this.sides[1 - this.restartTeam].players[0];
        v1.set(-atk.attackDir * (5 + Math.random() * 4), 2 + Math.random() * 2.2, Math.sign(this.ball.pos.z || 1) * (3 + Math.random() * 5));
        this.ball.kick(v1);
        this.ball.touch(gk.teamIdx, gk.idx, this.clock);
        this.emit('save', { player: gk });
        this.excitement = Math.min(1, this.excitement + 0.4);
      }
    }

    // possession stats
    const owner = this.ballOwnerPlayer();
    if (owner) this.sides[owner.teamIdx].stats.possession += dt;
    else if (this.ball.lastTouch) this.sides[this.ball.lastTouch.teamIdx].stats.possession += dt;

    // dribbling: glue ball to owner's feet
    if (owner) {
      const lead = 0.55 + Math.hypot(owner.vel.x, owner.vel.z) * 0.085;
      this.ball.pos.set(
        owner.pos.x + Math.cos(owner.facing) * lead,
        BALL_RADIUS,
        owner.pos.z + Math.sin(owner.facing) * lead,
      );
      this.ball.vel.copy(owner.vel);
      // sprint knock-on
      if (owner.sprinting && Math.hypot(owner.vel.x, owner.vel.z) > owner.maxJog * 1.05 && Math.random() < dt * 2.2) {
        owner.hasBall = false;
        this.ball.owner = null;
        v1.set(Math.cos(owner.facing), 0, Math.sin(owner.facing)).multiplyScalar(Math.hypot(owner.vel.x, owner.vel.z) + 2.6);
        this.ball.kick(v1);
        this.ball.touch(owner.teamIdx, owner.idx, this.clock);
        owner.ballLock = 0.12;
      }
    } else {
      this.tryGainPossession();
    }

    // slides
    for (const side of this.sides) for (const p of side.players) this.resolveSlide(p);

    // GK catch/save handled in AI module via dive; here: GK holding ball while ball slow in hands
    this.checkGoalAndBounds();
  }

  private tryGainPossession(): void {
    if (this.ball.pos.y > CONTROL_HEIGHT) return;
    let best: PlayerSim | null = null;
    let bd = Infinity;
    for (const side of this.sides) {
      for (const p of side.players) {
        if (p.sentOff || !p.controllable || p.ballLock > 0) continue;
        const dx = p.pos.x - this.ball.pos.x;
        const dz = p.pos.z - this.ball.pos.z;
        const d2 = dx * dx + dz * dz;
        const reach = p.isGK ? 1.5 : CONTROL_RADIUS + Math.min(0.45, this.ball.speed * 0.02);
        if (d2 < reach * reach && d2 < bd) { bd = d2; best = p; }
      }
    }
    if (!best) return;
    // first touch quality: fast balls may bounce off poor controllers
    const sp = this.ball.speed;
    const ctl = best.data.attrs.dribbling / 100;
    if (sp > 14 && Math.random() > 0.55 + ctl * 0.4) {
      v1.copy(this.ball.vel).multiplyScalar(0.32);
      v1.y = Math.abs(v1.y) * 0.4 + 1.2;
      this.ball.kick(v1);
      this.ball.touch(best.teamIdx, best.idx, this.clock);
      best.ballLock = 0.25;
      this.checkOffsideOnTouch(best);
      return;
    }
    // offside check before granting possession
    if (this.checkOffsideOnTouch(best)) return;
    this.ball.owner = { teamIdx: best.teamIdx, playerIdx: best.idx };
    best.hasBall = true;
    this.ball.touch(best.teamIdx, best.idx, this.clock);
    this.ball.spin.set(0, 0, 0);
    if (best.isGK && this.shootout) { /* GK save in shootout resolved by bounds check */ }
  }

  /** returns true if offside was called */
  private checkOffsideOnTouch(toucher: PlayerSim): boolean {
    const lp = this.lastPass;
    if (!lp) return false;
    if (toucher.teamIdx !== lp.teamIdx || toucher === lp.passer) { this.lastPass = null; return false; }
    const xAtPass = lp.positions.get(toucher);
    if (xAtPass === undefined) { this.lastPass = null; return false; }
    const dir = this.sides[lp.teamIdx].attackDir;
    const inOwnHalf = xAtPass <= 0;
    const offside = !inOwnHalf && xAtPass > lp.secondLastDef + 0.2 && xAtPass > lp.ballX;
    this.lastPass = null;
    if (offside) {
      this.sides[lp.teamIdx].stats.offsides++;
      this.emit('offside', { team: lp.teamIdx, text: 'Offside!' });
      this.beginReset('free-kick', 1 - lp.teamIdx, toucher.pos.x, toucher.pos.z);
      void dir;
      return true;
    }
    return false;
  }

  private checkGoalAndBounds(): void {
    const b = this.ball;
    if (b.owner) return;

    // goal?
    for (let ti = 0; ti < 2; ti++) {
      const side = this.sides[ti];
      const goalX = HALF_L * side.attackDir;
      const crossed = (b.pos.x - goalX) * side.attackDir > BALL_RADIUS;
      if (crossed && Math.abs(b.pos.z) < GOAL_HALF_W - BALL_RADIUS * 0.5 && b.pos.y < GOAL_HEIGHT) {
        this.onGoal(ti);
        return;
      }
    }

    if (this.shootout || this.restart === 'penalty') {
      // penalty miss/save detection
      if (this.phase === 'play' && this.penaltyResolved === null) {
        const atk = this.sides[this.restartTeam];
        const goalX = HALF_L * atk.attackDir;
        const past = (b.pos.x - goalX) * atk.attackDir > 1;
        const slow = b.speed < 3 && b.pos.distanceTo(this.restartPos) > 2;
        const gk = this.sides[1 - this.restartTeam].players[0];
        const gkHas = gk.hasBall;
        const bouncedBack = (b.vel.x * atk.attackDir) < -2 && (goalX - b.pos.x) * atk.attackDir < PENALTY_SPOT + 4;
        if (past || slow || gkHas || bouncedBack || this.phaseTime > 7) {
          this.penaltyResolved = gkHas || bouncedBack ? 'save' : 'miss';
          if (this.shootout) this.resolveShootoutKick(this.penaltyResolved);
          else this.awardGoalKick(1 - this.restartTeam);
          if (this.penaltyResolved === 'save') { this.sides[1 - this.restartTeam].stats.saves++; this.emit('save'); }
          return;
        }
      }
      if (this.shootout) return;
    }

    // out of bounds
    if (Math.abs(b.pos.z) > HALF_W + BALL_RADIUS) {
      const lt = b.lastTouch;
      const toTeam = lt ? 1 - lt.teamIdx : 0;
      this.awardThrowIn(toTeam, b.pos.x, b.pos.z);
      return;
    }
    if (Math.abs(b.pos.x) > HALF_L + BALL_RADIUS && Math.abs(b.pos.z) > GOAL_HALF_W - 0.2) {
      const exitDir = Math.sign(b.pos.x);
      const lt = b.lastTouch;
      // which team defends this end?
      const defIdx = this.sides[0].attackDir === exitDir ? 1 : 0;
      const atkIdx = 1 - defIdx;
      if (lt && lt.teamIdx === defIdx) this.awardCorner(atkIdx, b.pos.z);
      else this.awardGoalKick(defIdx);
      return;
    }
    // also behind goal but inside net z-range but above crossbar etc.
    if (Math.abs(b.pos.x) > HALF_L + BALL_RADIUS && b.pos.y >= GOAL_HEIGHT) {
      const exitDir = Math.sign(b.pos.x);
      const lt = b.lastTouch;
      const defIdx = this.sides[0].attackDir === exitDir ? 1 : 0;
      const atkIdx = 1 - defIdx;
      if (lt && lt.teamIdx === defIdx) this.awardCorner(atkIdx, b.pos.z || 1);
      else this.awardGoalKick(defIdx);
    }
  }

  private onGoal(scoringTeam: number): void {
    if (this.shootout) {
      this.resolveShootoutKick('goal');
      this.emit('goal', { team: scoringTeam, text: 'GOAL!' });
      return;
    }
    const side = this.sides[scoringTeam];
    side.score++;
    side.stats.onTarget++;
    const lt = this.ball.lastTouch;
    let scorerName = 'Unknown';
    if (lt) {
      const sp = this.sides[lt.teamIdx].players[lt.playerIdx];
      scorerName = lt.teamIdx === scoringTeam ? sp.data.name : `${sp.data.name} (o.g.)`;
      if (lt.teamIdx === scoringTeam) {
        sp.setState('celebrate');
      }
    }
    this.scorers.push({ name: scorerName, minute: this.minute, team: scoringTeam });
    this.excitement = 1;
    this.emit('goal', { team: scoringTeam, text: `GOAL! ${side.team.meta.name}` });
    this.phase = 'goal';
    this.phaseTime = 0;
    // celebration: scorer + nearby teammates celebrate
    if (lt && lt.teamIdx === scoringTeam) {
      const scorer = this.sides[lt.teamIdx].players[lt.playerIdx];
      for (const p of this.activePlayers(scoringTeam)) {
        if (p !== scorer && p.pos.distanceTo(scorer.pos) < 18) p.setState('celebrate');
      }
    }
  }

  private stepGoalCelebration(dt: number): void {
    this.stepPlayers(dt);
    this.ball.step(dt);
    if (this.phaseTime > 4.6) {
      if (this.restart === 'penalty' && this.cfg.shootoutOnly) {
        this.nextShootoutKick();
        return;
      }
      const conceded = this.scorers.length ? 1 - this.scorers[this.scorers.length - 1].team : 0;
      this.setupKickoff(conceded);
    }
  }

  private endHalf(): void {
    this.emit('whistle');
    if (this.half < this.totalHalves) {
      this.half++;
      this.clock = 0;
      // swap ends
      for (const side of this.sides) side.attackDir = (side.attackDir === 1 ? -1 : 1);
      const kicked = this.half === 2 ? 1 : this.half === 3 ? 0 : 1;
      this.phase = 'half-end';
      this.emit('halftime', { text: this.half === 2 ? 'HALF TIME' : 'END OF PERIOD' });
      this._resumeKickoffTeam = kicked;
      return;
    }
    // match end
    if (this.sides[0].score === this.sides[1].score && this.cfg.knockout) {
      if (this.totalHalves === 2) {
        // go to extra time
        this.totalHalves = 4;
        this.half = 3;
        this.clock = 0;
        for (const side of this.sides) side.attackDir = (side.attackDir === 1 ? -1 : 1);
        this.phase = 'half-end';
        this.emit('halftime', { text: 'EXTRA TIME' });
        this._resumeKickoffTeam = 0;
        return;
      }
      // shootout
      this.beginShootout();
      return;
    }
    this.phase = 'full-end';
    this.over = true;
    this.winner = this.sides[0].score > this.sides[1].score ? 0 : this.sides[0].score < this.sides[1].score ? 1 : -1;
    this.emit('fulltime', { text: 'FULL TIME' });
  }

  private _resumeKickoffTeam = 1;

  /** called by UI when user dismisses half-time screen */
  resumeFromBreak(): void {
    if (this.phase !== 'half-end') return;
    this.setupKickoff(this._resumeKickoffTeam);
  }

  /** final result including shootout */
  get resultText(): string {
    const [a, b] = this.sides;
    let t = `${a.team.meta.code} ${a.score} - ${b.score} ${b.team.meta.code}`;
    if (this.shootoutDone) {
      const sum = (arr: number[]) => arr.reduce((s, x) => s + x, 0);
      t += ` (${sum(this.shootoutScores[0])}-${sum(this.shootoutScores[1])} pens)`;
    }
    return t;
  }
}
