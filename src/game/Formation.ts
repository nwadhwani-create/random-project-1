import { PITCH } from '@/core/constants';

export interface FormationSlot {
  x: number; // -1 to 1 along pitch length (negative = own half for home)
  z: number; // -1 to 1 along pitch width
  role: string;
}

const FORMATIONS: Record<string, FormationSlot[]> = {
  '4-3-3': [
    { x: -0.9, z: 0, role: 'GK' },
    { x: -0.6, z: -0.7, role: 'LB' },
    { x: -0.65, z: -0.25, role: 'CB' },
    { x: -0.65, z: 0.25, role: 'CB' },
    { x: -0.6, z: 0.7, role: 'RB' },
    { x: -0.35, z: -0.35, role: 'CM' },
    { x: -0.4, z: 0, role: 'CDM' },
    { x: -0.35, z: 0.35, role: 'CM' },
    { x: -0.1, z: -0.6, role: 'LW' },
    { x: -0.05, z: 0, role: 'ST' },
    { x: -0.1, z: 0.6, role: 'RW' },
  ],
  '4-2-3-1': [
    { x: -0.9, z: 0, role: 'GK' },
    { x: -0.6, z: -0.7, role: 'LB' },
    { x: -0.65, z: -0.25, role: 'CB' },
    { x: -0.65, z: 0.25, role: 'CB' },
    { x: -0.6, z: 0.7, role: 'RB' },
    { x: -0.4, z: -0.25, role: 'CDM' },
    { x: -0.4, z: 0.25, role: 'CDM' },
    { x: -0.2, z: -0.55, role: 'LW' },
    { x: -0.25, z: 0, role: 'CAM' },
    { x: -0.2, z: 0.55, role: 'RW' },
    { x: -0.05, z: 0, role: 'ST' },
  ],
};

export function getFormationPositions(
  formation: string,
  side: 'home' | 'away'
): { x: number; z: number }[] {
  const slots = FORMATIONS[formation] ?? FORMATIONS['4-3-3']!;
  const halfL = PITCH.LENGTH / 2 * 0.85;
  const halfW = PITCH.WIDTH / 2 * 0.85;
  const dir = side === 'home' ? 1 : -1;

  return slots.map((s) => ({
    x: s.x * halfL * dir,
    z: s.z * halfW,
  }));
}
