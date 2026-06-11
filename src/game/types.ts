import type { Vector3 } from "three";

export type LightingPreset = "day" | "dusk" | "night";

export type PlayerRole = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerRatings {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  goalkeeping: number;
}

export interface SquadPlayer {
  name: string;
  number: number;
  position: PlayerRole;
  club: string;
  ratings: PlayerRatings;
  skinTone: string;
  hair: string;
  heightCm: number;
}

export interface Team {
  name: string;
  code: string;
  flagColors: [string, string, string];
  kit: {
    home: string;
    away: string;
    trim: string;
  };
  formation: string;
  tacticalStyle: string;
  squad: SquadPlayer[];
}

export interface InputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  pass: boolean;
  shootHeld: boolean;
  shootReleased: boolean;
  tackle: boolean;
  cycleLighting: boolean;
}

export interface BallState {
  position: Vector3;
  velocity: Vector3;
  spin: Vector3;
}

export interface MatchScore {
  home: number;
  away: number;
}
