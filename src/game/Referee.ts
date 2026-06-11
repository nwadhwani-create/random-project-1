import { PITCH } from '@/core/constants';
import type { BallState, SetPieceType } from '@/core/types';
import type { Player } from '@/entities/Player';

export interface RefereeDecision {
  type: 'play_on' | 'foul' | 'offside' | 'out_of_play' | 'goal';
  setPiece?: SetPieceType;
  card?: 'yellow' | 'red';
  team?: 'home' | 'away';
  message: string;
}

export class Referee {
  private lastTouchTeam: 'home' | 'away' = 'home';
  private foulCooldown = 0;

  recordTouch(team: 'home' | 'away'): void {
    this.lastTouchTeam = team;
  }

  update(dt: number, ball: BallState, players: Player[]): RefereeDecision | null {
    if (this.foulCooldown > 0) {
      this.foulCooldown -= dt;
      return null;
    }

    // Check offside on attacking pass
    const offside = this.checkOffside(ball, players);
    if (offside) {
      return {
        type: 'offside',
        setPiece: 'freekick',
        team: offside.defendingTeam,
        message: `Offside — ${offside.player.data.name}`,
      };
    }

    // Out of play
    const out = this.checkOutOfPlay(ball);
    if (out) return out;

    // Random foul on tackle (simplified)
    const tackling = players.find((p) => p.animation === 'tackle');
    if (tackling && Math.random() < 0.02) {
      const opponent = players.find(
        (p) => p.teamId !== tackling.teamId && p.distanceToBall(ball.position) < 1.5
      );
      if (opponent) {
        this.foulCooldown = 3;
        const card = Math.random() < 0.1 ? 'yellow' : undefined;
        return {
          type: 'foul',
          setPiece: 'freekick',
          team: tackling.teamId === 'home' ? 'away' : 'home',
          card,
          message: card ? `Yellow card — ${tackling.data.name}` : `Foul by ${tackling.data.name}`,
        };
      }
    }

    return null;
  }

  private checkOutOfPlay(ball: BallState): RefereeDecision | null {
    const halfL = PITCH.LENGTH / 2;
    const halfW = PITCH.WIDTH / 2;
    const goalHalf = PITCH.GOAL_WIDTH / 2;
    const { position } = ball;

    if (position.x < -halfL) {
      if (Math.abs(position.z) < goalHalf && position.y < PITCH.GOAL_HEIGHT) {
        return { type: 'goal', team: 'away', message: 'GOAL!' };
      }
      return {
        type: 'out_of_play',
        setPiece: 'goalkick',
        team: 'home',
        message: 'Goal kick',
      };
    }

    if (position.x > halfL) {
      if (Math.abs(position.z) < goalHalf && position.y < PITCH.GOAL_HEIGHT) {
        return { type: 'goal', team: 'home', message: 'GOAL!' };
      }
      return {
        type: 'out_of_play',
        setPiece: 'goalkick',
        team: 'away',
        message: 'Goal kick',
      };
    }

    if (Math.abs(position.z) > halfW) {
      const team = position.z > 0 ? (this.lastTouchTeam === 'home' ? 'away' : 'home') : (this.lastTouchTeam === 'home' ? 'home' : 'away');
      return {
        type: 'out_of_play',
        setPiece: 'throwin',
        team,
        message: 'Throw-in',
      };
    }

    return null;
  }

  private checkOffside(
    ball: BallState,
    players: Player[]
  ): { player: Player; defendingTeam: 'home' | 'away' } | null {
    if (ball.velocity.x === 0 && ball.velocity.z === 0) return null;

    const attackingTeam = ball.velocity.x > 0 ? 'home' : 'away';
    const defenders = players.filter((p) => p.teamId !== attackingTeam && p.data.position !== 'GK');
    const attackers = players.filter((p) => p.teamId === attackingTeam && p.data.position !== 'GK');

    if (defenders.length === 0 || attackers.length === 0) return null;

    const defX = defenders.map((d) => d.position.x);
    const secondLast = attackingTeam === 'home'
      ? Math.min(...defX.sort((a, b) => a - b).slice(0, 2))
      : Math.max(...defX.sort((a, b) => b - a).slice(0, 2));

    for (const attacker of attackers) {
      const ahead = attackingTeam === 'home'
        ? attacker.position.x > secondLast && attacker.position.x > ball.position.x - 1
        : attacker.position.x < secondLast && attacker.position.x < ball.position.x + 1;

      if (ahead && attacker.distanceToBall(ball.position) < 3) {
        return { player: attacker, defendingTeam: attackingTeam === 'home' ? 'away' : 'home' };
      }
    }

    return null;
  }

  getLastTouchTeam(): 'home' | 'away' {
    return this.lastTouchTeam;
  }
}
