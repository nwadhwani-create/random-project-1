export type Pos = 'GK' | 'DF' | 'MF' | 'FW';

export interface PlayerAttrs {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  diving?: number;
  handling?: number;
  reflexes?: number;
}

export interface PlayerLook {
  skin: number;      // 0..5
  hair: number;      // style 0..4
  hairColor: number; // 0..3
  height: number;    // meters
}

export interface PlayerData {
  no: number;
  pos: Pos;
  name: string;
  shirtName: string;
  captain: boolean;
  birth: string;
  caps: number;
  goals: number;
  club: string;
  overall: number;
  attrs: PlayerAttrs;
  look: PlayerLook;
}

export interface SquadData {
  name: string;
  group: string;
  players: PlayerData[];
}

export interface SquadsFile {
  generated: string;
  source: string;
  teams: SquadData[];
}
