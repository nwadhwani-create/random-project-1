// Pitch coordinate system: x = along length, z = across width, y = up.
// Center of pitch at origin. Home team attacks +x in the first half.
export const PITCH_LENGTH = 105;
export const PITCH_WIDTH = 68;
export const HALF_L = PITCH_LENGTH / 2;
export const HALF_W = PITCH_WIDTH / 2;

export const GOAL_WIDTH = 7.32;
export const GOAL_HEIGHT = 2.44;
export const GOAL_HALF_W = GOAL_WIDTH / 2;
export const GOAL_DEPTH = 2.2;
export const POST_RADIUS = 0.06;

export const BOX_LENGTH = 16.5;   // penalty area depth from goal line
export const BOX_WIDTH = 40.32;   // penalty area width
export const SIX_LENGTH = 5.5;
export const SIX_WIDTH = 18.32;
export const PENALTY_SPOT = 11;   // from goal line
export const CENTER_CIRCLE_R = 9.15;

export const BALL_RADIUS = 0.11;
export const GRAVITY = 9.81;

export const CONTROL_RADIUS = 0.85;   // distance at which a player can take the ball
export const CONTROL_HEIGHT = 1.4;    // max ball height for ground control
export const HEADER_MIN = 1.4;
export const HEADER_MAX = 2.6;

export type Difficulty = 'amateur' | 'pro' | 'world-class';

export interface DifficultyParams {
  reaction: number;     // seconds of AI decision latency
  passError: number;    // radians of aim noise
  decision: number;     // 0..1 quality of choices
  speedMul: number;     // AI movement speed multiplier
}

export const DIFFICULTY: Record<Difficulty, DifficultyParams> = {
  amateur: { reaction: 0.45, passError: 0.14, decision: 0.5, speedMul: 0.92 },
  pro: { reaction: 0.25, passError: 0.08, decision: 0.75, speedMul: 0.97 },
  'world-class': { reaction: 0.12, passError: 0.04, decision: 0.95, speedMul: 1.0 },
};
