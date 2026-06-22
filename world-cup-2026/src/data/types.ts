export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface PlayerRatings {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
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
  position: Position;
  club: string;
  nationality: string;
  height: number;
  skinTone: number;
  hairStyle: number;
  ratings: PlayerRatings;
}

export interface KitColors {
  primary: string;
  secondary: string;
  accent: string;
  shorts: string;
  socks: string;
}

export interface TeamData {
  id: string;
  name: string;
  code: string;
  flagColors: [string, string, string];
  kitHome: KitColors;
  kitAway: KitColors;
  formation: string;
  defaultTactics: {
    pressing: number;
    width: number;
    tempo: number;
  };
  squad: PlayerData[];
  overallRating: number;
}

export type LightingPreset = 'day' | 'dusk' | 'night';
export type GameMode = 'quick_match' | 'tournament' | 'penalty_practice' | 'sandbox';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type MatchPhase = 'pregame' | 'kickoff' | 'playing' | 'halftime' | 'extratime' | 'penalties' | 'finished' | 'replay';

export interface MatchConfig {
  homeTeamId: string;
  awayTeamId: string;
  halfLengthMinutes: 3 | 5 | 10;
  difficulty: Difficulty;
  isKnockout: boolean;
  lighting: LightingPreset;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface MatchClock {
  minute: number;
  second: number;
  half: 1 | 2 | 3 | 4;
  addedTime: number;
  isRunning: boolean;
}

export interface TournamentGroup {
  name: string;
  teams: string[];
  standings: GroupStanding[];
}

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface BracketMatch {
  id: string;
  round: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  played: boolean;
  userPlayed: boolean;
}

export interface TournamentState {
  groups: TournamentGroup[];
  bracket: BracketMatch[];
  topScorers: { playerId: string; teamId: string; goals: number }[];
  userTeamId: string;
  currentMatchId: string | null;
}

export const PITCH = {
  LENGTH: 105,
  WIDTH: 68,
  GOAL_WIDTH: 7.32,
  GOAL_HEIGHT: 2.44,
  GOAL_DEPTH: 2.5,
  PENALTY_AREA_LENGTH: 16.5,
  PENALTY_AREA_WIDTH: 40.32,
  GOAL_AREA_LENGTH: 5.5,
  GOAL_AREA_WIDTH: 18.32,
  CENTER_CIRCLE_RADIUS: 9.15,
  PENALTY_SPOT: 11,
  CORNER_ARC_RADIUS: 1,
  BALL_RADIUS: 0.11,
} as const;

export const FORMATION_SLOTS: Record<string, Position[]> = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'CF'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LM', 'CDM', 'CM', 'CAM', 'RM', 'ST', 'CF'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'LW', 'CAM', 'RW', 'ST'],
};

export const FORMATIONS: Record<string, Record<Position, [number, number]>> = {
  '4-3-3': {
    GK: [0.05, 0.5],
    LB: [0.22, 0.15], CB: [0.22, 0.38], RB: [0.22, 0.85],
    CDM: [0.32, 0.5],
    CM: [0.38, 0.3], CAM: [0.38, 0.7],
    LW: [0.65, 0.12], ST: [0.65, 0.5], RW: [0.65, 0.88],
    LM: [0.42, 0.15], RM: [0.42, 0.85], CF: [0.68, 0.65],
  },
  '4-4-2': {
    GK: [0.05, 0.5],
    LB: [0.22, 0.15], CB: [0.22, 0.38], RB: [0.22, 0.85],
    LM: [0.42, 0.15], CM: [0.38, 0.38], CDM: [0.38, 0.62], RM: [0.42, 0.85],
    ST: [0.68, 0.35], CF: [0.68, 0.65],
    LW: [0.65, 0.12], RW: [0.65, 0.88], CAM: [0.52, 0.5],
  },
  '3-5-2': {
    GK: [0.05, 0.5],
    CB: [0.2, 0.25], LB: [0.2, 0.5], RB: [0.2, 0.75],
    LM: [0.42, 0.1], CDM: [0.35, 0.35], CM: [0.42, 0.5], CAM: [0.35, 0.65], RM: [0.42, 0.9],
    ST: [0.68, 0.35], CF: [0.68, 0.65],
    LW: [0.65, 0.12], RW: [0.65, 0.88],
  },
  '4-2-3-1': {
    GK: [0.05, 0.5],
    LB: [0.22, 0.15], CB: [0.22, 0.38], RB: [0.22, 0.85],
    CDM: [0.32, 0.4], CM: [0.32, 0.6],
    LW: [0.52, 0.15], CAM: [0.52, 0.5], RW: [0.52, 0.85],
    ST: [0.72, 0.5],
    LM: [0.42, 0.15], RM: [0.42, 0.85], CF: [0.68, 0.65],
  },
};
