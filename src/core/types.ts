import type * as THREE from 'three';

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type PlayerPosition =
  | 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM'
  | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface PlayerRatings {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  /** Goalkeeper only */
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  positioning?: number;
}

export interface PlayerData {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  club: string;
  ratings: PlayerRatings;
  height: number;
  skinTone: number;
  hairColor: number;
}

export interface TeamData {
  code: string;
  name: string;
  flagColors: [string, string, string];
  kit: { home: { primary: string; secondary: string }; away: { primary: string; secondary: string } };
  formation: string;
  players: PlayerData[];
}

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  spin: Vec3;
  onGround: boolean;
}

export interface PlayerState {
  id: string;
  teamId: 'home' | 'away';
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  isControlled: boolean;
  isSprinting: boolean;
  animation: PlayerAnimation;
  mesh?: THREE.Group;
}

export type PlayerAnimation =
  | 'idle' | 'run' | 'sprint' | 'pass' | 'shoot'
  | 'tackle' | 'header' | 'dive' | 'celebrate';

export type GamePhase = 'menu' | 'lineup' | 'kickoff' | 'play' | 'setpiece' | 'halftime' | 'fulltime' | 'replay';

export type SetPieceType = 'throwin' | 'corner' | 'goalkick' | 'freekick' | 'penalty' | 'kickoff';

export interface MatchState {
  phase: GamePhase;
  homeScore: number;
  awayScore: number;
  clock: number;
  half: 1 | 2;
  halfDuration: number;
  possession: 'home' | 'away';
  setPiece: SetPieceType | null;
  offside: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  homeTeam: string;
  awayTeam: string;
  halfMinutes: number;
  difficulty: Difficulty;
  lighting: 'day' | 'dusk' | 'night';
}
