import type { PlayerData, Position, Vec3 } from '../data/types';
import { PITCH, FORMATIONS, FORMATION_SLOTS } from '../data/types';
import { clamp, damp, distance2D, normalize2D } from '../utils/math';

export type PlayerAnimState =
  | 'idle' | 'run' | 'sprint' | 'pass' | 'shoot' | 'tackle'
  | 'slide' | 'header' | 'dive' | 'celebrate' | 'gk_idle' | 'gk_dive';

export interface PlayerEntity {
  id: string;
  data: PlayerData;
  team: 'home' | 'away';
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  animState: PlayerAnimState;
  animTime: number;
  isControlled: boolean;
  isSprinting: boolean;
  stamina: number;
  hasBall: boolean;
  cooldown: number;
  homeAnchor: Vec3;
  role: Position;
}

const ROLE_MAP: Record<Position, Position> = {
  GK: 'GK', CB: 'CB', LB: 'LB', RB: 'RB',
  CDM: 'CDM', CM: 'CM', CAM: 'CAM',
  LM: 'LM', RM: 'RM', LW: 'LW', RW: 'RW',
  ST: 'ST', CF: 'CF',
};

export function createPlayer(
  data: PlayerData,
  team: 'home' | 'away',
  role: Position,
  formation: string,
  _index: number,
): PlayerEntity {
  const form = FORMATIONS[formation] ?? FORMATIONS['4-3-3'];
  const anchor = form[role] ?? [0.5, 0.5];
  const side = team === 'home' ? 1 : -1;
  const x = (anchor[0] - 0.5) * PITCH.LENGTH * side;
  const z = (anchor[1] - 0.5) * PITCH.WIDTH;

  return {
    id: `${team}-${data.id}`,
    data,
    team,
    position: { x, y: 0, z },
    velocity: { x: 0, y: 0, z },
    rotation: team === 'home' ? 0 : Math.PI,
    animState: role === 'GK' ? 'gk_idle' : 'idle',
    animTime: 0,
    isControlled: false,
    isSprinting: false,
    stamina: 100,
    hasBall: false,
    cooldown: 0,
    homeAnchor: { x, y: 0, z },
    role: ROLE_MAP[role] ?? role,
  };
}

export function getFormationPositions(formation: string): Position[] {
  return FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
}

export function updatePlayerMovement(
  player: PlayerEntity,
  inputDx: number,
  inputDz: number,
  dt: number,
  sprinting: boolean,
): void {
  const pace = player.data.ratings.pace / 100;
  const baseSpeed = player.role === 'GK' ? 5.5 : 7 + pace * 4;
  const speed = sprinting && player.stamina > 0 ? baseSpeed * 1.45 : baseSpeed;

  if (inputDx !== 0 || inputDz !== 0) {
    const [nx, nz] = normalize2D(inputDx, inputDz);
    player.velocity.x = damp(player.velocity.x, nx * speed, 12, dt);
    player.velocity.z = damp(player.velocity.z, nz * speed, 12, dt);
    player.rotation = Math.atan2(nx, nz);
    player.animState = sprinting ? 'sprint' : 'run';
  } else {
    player.velocity.x = damp(player.velocity.x, 0, 8, dt);
    player.velocity.z = damp(player.velocity.z, 0, 8, dt);
    if (Math.hypot(player.velocity.x, player.velocity.z) < 0.1) {
      player.animState = player.role === 'GK' ? 'gk_idle' : 'idle';
    }
  }

  if (sprinting && (inputDx !== 0 || inputDz !== 0)) {
    player.stamina = clamp(player.stamina - 18 * dt, 0, 100);
  } else {
    player.stamina = clamp(player.stamina + 8 * dt, 0, 100);
  }

  player.position.x += player.velocity.x * dt;
  player.position.z += player.velocity.z * dt;

  const halfL = PITCH.LENGTH / 2 - 1;
  const halfW = PITCH.WIDTH / 2 - 1;
  player.position.x = clamp(player.position.x, -halfL, halfL);
  player.position.z = clamp(player.position.z, -halfW, halfW);

  player.animTime += dt;
  if (player.cooldown > 0) player.cooldown -= dt;
}

export function movePlayerToTarget(
  player: PlayerEntity,
  target: Vec3,
  dt: number,
  urgency = 1,
): void {
  const dx = target.x - player.position.x;
  const dz = target.z - player.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.5) {
    player.velocity.x = damp(player.velocity.x, 0, 8, dt);
    player.velocity.z = damp(player.velocity.z, 0, 8, dt);
    player.animState = player.role === 'GK' ? 'gk_idle' : 'idle';
    return;
  }

  const pace = player.data.ratings.pace / 100;
  const speed = (6 + pace * 4) * urgency;
  const [nx, nz] = normalize2D(dx, dz);
  player.velocity.x = damp(player.velocity.x, nx * speed, 10, dt);
  player.velocity.z = damp(player.velocity.z, nz * speed, 10, dt);
  player.rotation = Math.atan2(nx, nz);
  player.animState = urgency > 1.2 ? 'sprint' : 'run';
  player.position.x += player.velocity.x * dt;
  player.position.z += player.velocity.z * dt;
  player.animTime += dt;
}

export function findClosestToBall(players: PlayerEntity[], ballPos: Vec3, team?: 'home' | 'away'): PlayerEntity | null {
  let closest: PlayerEntity | null = null;
  let minDist = Infinity;
  for (const p of players) {
    if (team && p.team !== team) continue;
    if (p.role === 'GK') continue;
    const d = distance2D(p.position, ballPos);
    if (d < minDist) {
      minDist = d;
      closest = p;
    }
  }
  return closest;
}

export function getTeamDirection(team: 'home' | 'away'): number {
  return team === 'home' ? 1 : -1;
}
