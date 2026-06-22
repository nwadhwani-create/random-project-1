import type { Difficulty, Vec3 } from '../data/types';
import type { PlayerEntity } from '../physics/playerPhysics';
import { movePlayerToTarget, findClosestToBall, getTeamDirection } from '../physics/playerPhysics';
import { distance2D, clamp } from '../utils/math';
import type { BallPhysics } from '../physics/ballPhysics';

export interface AIConfig {
  reactionSpeed: number;
  passAccuracy: number;
  decisionQuality: number;
  aggression: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, AIConfig> = {
  easy: { reactionSpeed: 0.5, passAccuracy: 0.6, decisionQuality: 0.4, aggression: 0.3 },
  medium: { reactionSpeed: 0.7, passAccuracy: 0.75, decisionQuality: 0.6, aggression: 0.5 },
  hard: { reactionSpeed: 0.85, passAccuracy: 0.85, decisionQuality: 0.8, aggression: 0.7 },
  legendary: { reactionSpeed: 1.0, passAccuracy: 0.95, decisionQuality: 0.95, aggression: 0.85 },
};

export class TeamAI {
  private config: AIConfig;
  private thinkTimer = 0;
  private currentDecision: 'attack' | 'defend' | 'press' = 'defend';

  constructor(difficulty: Difficulty) {
    this.config = DIFFICULTY_CONFIG[difficulty];
  }

  setDifficulty(difficulty: Difficulty): void {
    this.config = DIFFICULTY_CONFIG[difficulty];
  }

  update(
    players: PlayerEntity[],
    ball: BallPhysics,
    dt: number,
    attackingTeam: 'home' | 'away',
  ): void {
    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = 0.5 / this.config.reactionSpeed;
      const ballX = ball.state.position.x;
      this.currentDecision = ballX * getTeamDirection(attackingTeam) > 0 ? 'attack' : 'defend';
    }

    const ballPos = ball.state.position;

    for (const player of players) {
      if (player.isControlled) continue;

      const isAttacking = player.team === attackingTeam;
      const dir = getTeamDirection(player.team);

      if (player.role === 'GK') {
        this.updateGoalkeeper(player, ballPos, dt);
        continue;
      }

      if (isAttacking && this.currentDecision === 'attack') {
        this.updateAttacking(player, ballPos, ball, players, dir, dt);
      } else {
        this.updateDefending(player, ballPos, players, dir, dt);
      }
    }
  }

  private updateGoalkeeper(player: PlayerEntity, ballPos: Vec3, dt: number): void {
    const goalX = getTeamDirection(player.team) * -52;
    const targetZ = clamp(ballPos.z, -3, 3);
    const distToBall = distance2D(player.position, ballPos);

    if (distToBall < 3 && Math.abs(ballPos.x - goalX) < 15) {
      movePlayerToTarget(player, ballPos, dt, 1.5);
      player.animState = 'gk_dive';
    } else {
      movePlayerToTarget(player, { x: goalX + getTeamDirection(player.team) * 2, y: 0, z: targetZ }, dt, 0.8);
    }
  }

  private updateAttacking(
    player: PlayerEntity,
    ballPos: Vec3,
    ball: BallPhysics,
    teammates: PlayerEntity[],
    dir: number,
    dt: number,
  ): void {
    const distToBall = distance2D(player.position, ballPos);
    const closest = findClosestToBall(teammates.filter((p) => p.team === player.team), ballPos);

    if (closest?.id === player.id && distToBall < 2) {
      const goalX = dir * 52;
      const dx = goalX - player.position.x;
      const dz = -player.position.z * 0.3;
      const shootDist = Math.abs(dx);

      if (shootDist < 25 && Math.random() < this.config.decisionQuality * 0.02) {
        const power = clamp(0.4 + (30 - shootDist) / 30, 0.3, 0.9);
        const loft = shootDist > 18 ? 0.15 : 0;
        ball.kick({ x: dx, y: 0, z: dz }, power, loft, 0, player.id, player.team);
        player.animState = 'shoot';
        player.animTime = 0;
        return;
      }

      const passTarget = teammates
        .filter((p) => p.team === player.team && p.id !== player.id && p.role !== 'GK')
        .sort((a, b) => (b.position.x * dir) - (a.position.x * dir))
        [0];

      if (passTarget && Math.random() < this.config.decisionQuality * 0.015) {
        const pdx = passTarget.position.x - player.position.x;
        const pdz = passTarget.position.z - player.position.z;
        ball.kick({ x: pdx, y: 0, z: pdz }, 0.4 + Math.random() * 0.2, 0, 0, player.id, player.team);
        player.animState = 'pass';
        player.animTime = 0;
        return;
      }

      const runTarget = { x: player.position.x + dir * 5, y: 0, z: player.position.z };
      movePlayerToTarget(player, runTarget, dt, 1.1);
    } else {
      const anchor = player.homeAnchor;
      const pushX = anchor.x + dir * 15;
      const spread = (Math.sin(player.data.number) * 8);
      movePlayerToTarget(player, { x: pushX, y: 0, z: anchor.z + spread }, dt, 0.7);
    }
  }

  private updateDefending(
    player: PlayerEntity,
    ballPos: Vec3,
    allPlayers: PlayerEntity[],
    _dir: number,
    dt: number,
  ): void {
    const distToBall = distance2D(player.position, ballPos);
    const closest = findClosestToBall(
      allPlayers.filter((p) => p.team === player.team),
      ballPos,
    );

    if (closest?.id === player.id && distToBall < 3) {
      movePlayerToTarget(player, ballPos, dt, 1.3);
      if (distToBall < 1.5 && Math.random() < this.config.aggression * 0.05) {
        player.animState = 'tackle';
        player.animTime = 0;
      }
    } else {
      const anchor = player.homeAnchor;
      const ballInfluence = 0.3;
      const tx = anchor.x + (ballPos.x - anchor.x) * ballInfluence;
      const tz = anchor.z + (ballPos.z - anchor.z) * ballInfluence;
      movePlayerToTarget(player, { x: tx, y: 0, z: tz }, dt, 0.8);
    }
  }
}

export function checkOffside(
  attacker: PlayerEntity,
  ballPos: Vec3,
  defenders: PlayerEntity[],
  attackingTeam: 'home' | 'away',
): boolean {
  const dir = getTeamDirection(attackingTeam);
  const attackerX = attacker.position.x * dir;
  const ballX = ballPos.x * dir;

  const defenderXs = defenders
    .filter((d) => d.role !== 'GK')
    .map((d) => d.position.x * dir)
    .sort((a, b) => b - a);

  const secondLastDefender = defenderXs[1] ?? defenderXs[0] ?? 0;
  return attackerX > secondLastDefender && attackerX > ballX;
}
