import type { Difficulty, Vec3 } from '@/core/types';
import type { Player } from '@/entities/Player';
import { getFormationPositions } from '@/game/Formation';

export class TeamAI {
  private difficulty: Difficulty = 'medium';

  setDifficulty(d: Difficulty): void {
    this.difficulty = d;
  }

  private getReactionMod(): number {
    switch (this.difficulty) {
      case 'easy': return 0.5;
      case 'hard': return 1.3;
      default: return 1.0;
    }
  }

  private getAccuracyMod(): number {
    switch (this.difficulty) {
      case 'easy': return 0.6;
      case 'hard': return 0.95;
      default: return 0.8;
    }
  }

  update(
    dt: number,
    players: Player[],
    ballPos: Vec3,
    _ballVelocity: Vec3,
    formation: string,
    teamId: 'home' | 'away'
  ): void {
    const reaction = this.getReactionMod();
    const formationPos = getFormationPositions(formation, teamId);
    const teamPlayers = players.filter((p) => p.teamId === teamId);
    const hasPossession = this.teamHasPossession(teamPlayers, ballPos);
    const attacking = teamId === 'home' ? ballPos.x > 0 : ballPos.x < 0;

    teamPlayers.forEach((player, i) => {
      const homePos = formationPos[i] ?? { x: 0, z: 0 };
      let targetX = homePos.x;
      let targetZ = homePos.z;

      const distToBall = player.distanceToBall(ballPos);
      const isClosest = this.isClosestToBall(player, teamPlayers, ballPos);

      if (hasPossession) {
        // Attacking: spread out, make runs
        if (attacking && player.data.position === 'ST') {
          targetX = teamId === 'home' ? ballPos.x + 15 : ballPos.x - 15;
          targetZ = ballPos.z + (Math.sin(Date.now() * 0.001 + i) * 5);
        } else if (isClosest && distToBall > 1.5) {
          targetX = ballPos.x;
          targetZ = ballPos.z;
        }
      } else {
        // Defending: compress toward ball side
        const compress = 0.4;
        targetX = homePos.x + (ballPos.x - homePos.x) * compress;
        targetZ = homePos.z + (ballPos.z - homePos.z) * compress * 0.5;

        if (isClosest && distToBall < 20) {
          targetX = ballPos.x;
          targetZ = ballPos.z;
        }
      }

      const dx = targetX - player.position.x;
      const dz = targetZ - player.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.5) {
        const speed = Math.min(1, dist / 10) * reaction;
        player.update(dt, (dx / dist) * speed, (dz / dist) * speed, dist > 8 && isClosest);
      } else {
        player.update(dt, 0, 0, false);
      }

      // AI pass/shoot decision for closest player
      if (isClosest && distToBall < 1.2 && Math.random() < 0.01 * reaction) {
        const shootDist = teamId === 'home'
          ? PITCH_LENGTH - ballPos.x
          : PITCH_LENGTH + ballPos.x;
        if (shootDist < 30 && Math.random() < this.getAccuracyMod()) {
          player.animation = 'shoot';
        }
      }
    });
  }

  private teamHasPossession(team: Player[], ballPos: Vec3): boolean {
    const closest = team.reduce((best, p) => {
      const d = p.distanceToBall(ballPos);
      return d < best.dist ? { p, dist: d } : best;
    }, { p: team[0]!, dist: Infinity });
    return closest.dist < 1.5;
  }

  private isClosestToBall(player: Player, team: Player[], ballPos: Vec3): boolean {
    const dist = player.distanceToBall(ballPos);
    return team.every((p) => p === player || p.distanceToBall(ballPos) >= dist);
  }
}

const PITCH_LENGTH = 105;
