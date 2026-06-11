import type { PlayerData, TeamData } from '@/core/types';

const defaultRatings = {
  pace: 70, shooting: 65, passing: 70, dribbling: 68, defending: 60, physical: 70,
};

function makePlayer(
  id: string, name: string, number: number,
  position: PlayerData['position'], club: string,
  ratings: Partial<PlayerData['ratings']> = {}
): PlayerData {
  return {
    id, name, number, position, club,
    ratings: { ...defaultRatings, ...ratings },
    height: 1.75 + Math.random() * 0.15,
    skinTone: 0xc68642 + Math.floor(Math.random() * 5) * 0x111111,
    hairColor: [0x2c1810, 0x1a1a1a, 0x8b4513, 0xd4a574][Math.floor(Math.random() * 4)]!,
  };
}

/** Demo teams for Milestone 1 — full 48-team data added in Milestone 3 */
export const DEMO_HOME: TeamData = {
  code: 'USA',
  name: 'United States',
  flagColors: ['#BF0A30', '#FFFFFF', '#002868'],
  kit: { home: { primary: '#BF0A30', secondary: '#FFFFFF' }, away: { primary: '#002868', secondary: '#FFFFFF' } },
  formation: '4-3-3',
  players: [
    makePlayer('usa-1', 'Matt Turner', 1, 'GK', 'Crystal Palace', { defending: 50, diving: 78, handling: 76, kicking: 70, reflexes: 80, positioning: 77 }),
    makePlayer('usa-2', 'Sergino Dest', 2, 'RB', 'PSV', { pace: 82, defending: 72 }),
    makePlayer('usa-3', 'Walker Zimmerman', 3, 'CB', 'Dallas', { defending: 78, physical: 80 }),
    makePlayer('usa-4', 'Chris Richards', 4, 'CB', 'Crystal Palace', { defending: 76, physical: 78 }),
    makePlayer('usa-5', 'Antonee Robinson', 5, 'LB', 'Fulham', { pace: 80, defending: 74 }),
    makePlayer('usa-6', 'Tyler Adams', 6, 'CDM', 'Bournemouth', { passing: 78, defending: 76, physical: 80 }),
    makePlayer('usa-7', 'Yunus Musah', 7, 'CM', 'Milan', { pace: 78, passing: 76, dribbling: 80 }),
    makePlayer('usa-8', 'Weston McKennie', 8, 'CM', 'Juventus', { physical: 82, passing: 74 }),
    makePlayer('usa-9', 'Christian Pulisic', 9, 'RW', 'Milan', { pace: 84, shooting: 78, dribbling: 84 }),
    makePlayer('usa-10', 'Gio Reyna', 10, 'CAM', 'Borussia Dortmund', { passing: 80, dribbling: 82, shooting: 74 }),
    makePlayer('usa-11', 'Folarin Balogun', 11, 'ST', 'Monaco', { pace: 82, shooting: 80 }),
  ],
};

export const DEMO_AWAY: TeamData = {
  code: 'MEX',
  name: 'Mexico',
  flagColors: ['#006847', '#FFFFFF', '#CE1126'],
  kit: { home: { primary: '#006847', secondary: '#FFFFFF' }, away: { primary: '#FFFFFF', secondary: '#006847' } },
  formation: '4-2-3-1',
  players: [
    makePlayer('mex-1', 'Guillermo Ochoa', 1, 'GK', 'Salernitana', { diving: 82, handling: 80, reflexes: 84, positioning: 80 }),
    makePlayer('mex-2', 'Jorge Sanchez', 2, 'RB', 'Houston Dynamo', { pace: 76, defending: 72 }),
    makePlayer('mex-3', 'Cesar Montes', 3, 'CB', 'Almeria', { defending: 76, physical: 78 }),
    makePlayer('mex-4', 'Hector Moreno', 4, 'CB', 'Monterrey', { defending: 74, physical: 76 }),
    makePlayer('mex-5', 'Gerardo Arteaga', 5, 'LB', 'Genk', { pace: 78, defending: 72 }),
    makePlayer('mex-6', 'Edson Alvarez', 6, 'CDM', 'West Ham', { defending: 82, physical: 84, passing: 76 }),
    makePlayer('mex-7', 'Luis Chavez', 7, 'CM', 'Dynamo Moscow', { passing: 76, shooting: 74 }),
    makePlayer('mex-8', 'Carlos Rodriguez', 8, 'CM', 'Cruz Azul', { passing: 74 }),
    makePlayer('mex-9', 'Santiago Gimenez', 9, 'ST', 'Feyenoord', { pace: 80, shooting: 82 }),
    makePlayer('mex-10', 'Alexis Vega', 10, 'LW', 'Guadalajara', { pace: 78, dribbling: 80, shooting: 76 }),
    makePlayer('mex-11', 'Uriel Antuna', 11, 'RW', 'América', { pace: 86, dribbling: 78 }),
  ],
};

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
