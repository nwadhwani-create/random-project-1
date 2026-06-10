// Formation slot layouts in normalized coordinates.
// x: -1 = own goal line, +1 = opponent goal line (neutral shape spans roughly -0.85..0.1)
// z: -1 = left touchline, +1 = right touchline (from the attacking team's view)

export type Role = 'GK' | 'CB' | 'FB' | 'DM' | 'CM' | 'AM' | 'WG' | 'ST';

export interface Slot {
  x: number;
  z: number;
  role: Role;
}

const S = (x: number, z: number, role: Role): Slot => ({ x, z, role });

// Slot order must match roster.pickLineup: GK, defenders, midfielders, forwards.
export const FORMATIONS: Record<string, Slot[]> = {
  '433': [
    S(-0.94, 0, 'GK'),
    S(-0.62, -0.7, 'FB'), S(-0.68, -0.24, 'CB'), S(-0.68, 0.24, 'CB'), S(-0.62, 0.7, 'FB'),
    S(-0.38, 0, 'DM'), S(-0.22, -0.36, 'CM'), S(-0.22, 0.36, 'CM'),
    S(0.1, -0.72, 'WG'), S(0.16, 0, 'ST'), S(0.1, 0.72, 'WG'),
  ],
  '442': [
    S(-0.94, 0, 'GK'),
    S(-0.62, -0.7, 'FB'), S(-0.68, -0.24, 'CB'), S(-0.68, 0.24, 'CB'), S(-0.62, 0.7, 'FB'),
    S(-0.26, -0.72, 'WG'), S(-0.34, -0.2, 'CM'), S(-0.34, 0.2, 'CM'), S(-0.26, 0.72, 'WG'),
    S(0.14, -0.2, 'ST'), S(0.14, 0.2, 'ST'),
  ],
  '4231': [
    S(-0.94, 0, 'GK'),
    S(-0.62, -0.7, 'FB'), S(-0.68, -0.24, 'CB'), S(-0.68, 0.24, 'CB'), S(-0.62, 0.7, 'FB'),
    S(-0.4, -0.18, 'DM'), S(-0.4, 0.18, 'DM'),
    S(-0.04, -0.7, 'WG'), S(-0.06, 0, 'AM'), S(-0.04, 0.7, 'WG'),
    S(0.18, 0, 'ST'),
  ],
  '352': [
    S(-0.94, 0, 'GK'),
    S(-0.66, -0.42, 'CB'), S(-0.7, 0, 'CB'), S(-0.66, 0.42, 'CB'),
    S(-0.28, -0.82, 'FB'), S(-0.36, -0.28, 'CM'), S(-0.42, 0, 'DM'), S(-0.36, 0.28, 'CM'), S(-0.28, 0.82, 'FB'),
    S(0.14, -0.2, 'ST'), S(0.14, 0.2, 'ST'),
  ],
  '532': [
    S(-0.94, 0, 'GK'),
    S(-0.56, -0.78, 'FB'), S(-0.66, -0.38, 'CB'), S(-0.7, 0, 'CB'), S(-0.66, 0.38, 'CB'), S(-0.56, 0.78, 'FB'),
    S(-0.32, -0.36, 'CM'), S(-0.38, 0, 'DM'), S(-0.32, 0.36, 'CM'),
    S(0.12, -0.2, 'ST'), S(0.12, 0.2, 'ST'),
  ],
  '541': [
    S(-0.94, 0, 'GK'),
    S(-0.56, -0.78, 'FB'), S(-0.66, -0.38, 'CB'), S(-0.7, 0, 'CB'), S(-0.66, 0.38, 'CB'), S(-0.56, 0.78, 'FB'),
    S(-0.26, -0.66, 'WG'), S(-0.36, -0.2, 'CM'), S(-0.36, 0.2, 'CM'), S(-0.26, 0.66, 'WG'),
    S(0.14, 0, 'ST'),
  ],
  '343': [
    S(-0.94, 0, 'GK'),
    S(-0.66, -0.42, 'CB'), S(-0.7, 0, 'CB'), S(-0.66, 0.42, 'CB'),
    S(-0.3, -0.8, 'FB'), S(-0.38, -0.22, 'CM'), S(-0.38, 0.22, 'CM'), S(-0.3, 0.8, 'FB'),
    S(0.08, -0.66, 'WG'), S(0.16, 0, 'ST'), S(0.08, 0.66, 'WG'),
  ],
};

export function formationSlots(f: string): Slot[] {
  return FORMATIONS[f] ?? FORMATIONS['442'];
}
