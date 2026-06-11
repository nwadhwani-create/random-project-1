import type { Difficulty, GamePhase, MatchState, SetPieceType } from '@/core/types';

export interface MatchConfig {
  halfMinutes: number;
  difficulty: Difficulty;
  isKnockout: boolean;
}

export class MatchEngine {
  state: MatchState;
  private config: MatchConfig;

  constructor(config: MatchConfig) {
    this.config = config;
    this.state = {
      phase: 'kickoff',
      homeScore: 0,
      awayScore: 0,
      clock: 0,
      half: 1,
      halfDuration: config.halfMinutes * 60,
      possession: 'home',
      setPiece: 'kickoff',
      offside: false,
    };
  }

  update(dt: number): void {
    if (this.state.phase !== 'play' && this.state.phase !== 'kickoff') return;
    this.state.clock += dt;

    const halfEnd = this.state.halfDuration;
    if (this.state.clock >= halfEnd) {
      if (this.state.half === 1) {
        this.state.half = 2;
        this.state.clock = 0;
        this.state.phase = 'halftime';
        this.state.setPiece = 'kickoff';
      } else {
        this.state.phase = 'fulltime';
      }
    }
  }

  scoreGoal(team: 'home' | 'away'): void {
    if (team === 'home') this.state.homeScore++;
    else this.state.awayScore++;
    this.state.phase = 'replay';
    this.state.setPiece = null;
  }

  resumePlay(): void {
    this.state.phase = 'play';
    this.state.setPiece = null;
    this.state.offside = false;
  }

  setSetPiece(type: SetPieceType, team: 'home' | 'away'): void {
    this.state.phase = 'setpiece';
    this.state.setPiece = type;
    this.state.possession = team;
  }

  getPhase(): GamePhase {
    return this.state.phase;
  }

  formatClock(): string {
    const mins = Math.floor(this.state.clock / 60);
    const secs = Math.floor(this.state.clock % 60);
    const halfLabel = this.state.half === 1 ? '' : ' (2H)';
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}${halfLabel}`;
  }

  needsExtraTime(): boolean {
    if (!this.config.isKnockout) return false;
    return this.state.phase === 'fulltime' && this.state.homeScore === this.state.awayScore;
  }

  needsPenalties(): boolean {
    return this.config.isKnockout && this.state.phase === 'fulltime';
  }
}
