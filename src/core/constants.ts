/** FIFA standard pitch dimensions in meters */
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

export const PHYSICS = {
  GRAVITY: -9.81,
  BALL_FRICTION: 0.985,
  BALL_BOUNCE: 0.65,
  BALL_AIR_RESISTANCE: 0.998,
  GROUND_FRICTION: 0.92,
  PLAYER_MAX_SPEED: 7.5,
  PLAYER_SPRINT_SPEED: 10.5,
  PLAYER_ACCELERATION: 25,
  PLAYER_DECELERATION: 30,
} as const;

export const MATCH = {
  DEFAULT_HALF_MINUTES: 5,
  TICK_RATE: 60,
} as const;

export type LightingPreset = 'day' | 'dusk' | 'night';

export const TEAM_COLORS = {
  home: { primary: 0x1565c0, secondary: 0xffffff, accent: 0xffd700 },
  away: { primary: 0xc62828, secondary: 0xffffff, accent: 0x212121 },
} as const;
