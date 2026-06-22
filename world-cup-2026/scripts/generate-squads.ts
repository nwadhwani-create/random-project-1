/**
 * Squad data generator for all 48 World Cup 2026 teams.
 * Run: npx tsx scripts/generate-squads.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

interface TeamMeta {
  id: string;
  name: string;
  code: string;
  flagColors: [string, string, string];
  kitHome: { primary: string; secondary: string; accent: string; shorts: string; socks: string };
  kitAway: { primary: string; secondary: string; accent: string; shorts: string; socks: string };
  formation: string;
  overallRating: number;
  squad: { name: string; number: number; position: Position; club: string; ratings: Record<string, number> }[];
}

const TEAMS: Omit<TeamMeta, 'squad'>[] = [
  { id: 'usa', name: 'United States', code: 'USA', flagColors: ['#BF0A30', '#FFFFFF', '#002868'], kitHome: { primary: '#FFFFFF', secondary: '#BF0A30', accent: '#002868', shorts: '#002868', socks: '#FFFFFF' }, kitAway: { primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF', shorts: '#002868', socks: '#BF0A30' }, formation: '4-3-3', overallRating: 78 },
  { id: 'mex', name: 'Mexico', code: 'MEX', flagColors: ['#006847', '#FFFFFF', '#CE1126'], kitHome: { primary: '#006847', secondary: '#FFFFFF', accent: '#CE1126', shorts: '#FFFFFF', socks: '#006847' }, kitAway: { primary: '#FFFFFF', secondary: '#006847', accent: '#CE1126', shorts: '#CE1126', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 79 },
  { id: 'can', name: 'Canada', code: 'CAN', flagColors: ['#FF0000', '#FFFFFF', '#FF0000'], kitHome: { primary: '#FF0000', secondary: '#FFFFFF', accent: '#FF0000', shorts: '#FFFFFF', socks: '#FF0000' }, kitAway: { primary: '#FFFFFF', secondary: '#FF0000', accent: '#000000', shorts: '#FF0000', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 76 },
  { id: 'bra', name: 'Brazil', code: 'BRA', flagColors: ['#009C3B', '#FFDF00', '#002776'], kitHome: { primary: '#FFDF00', secondary: '#009C3B', accent: '#002776', shorts: '#002776', socks: '#FFFFFF' }, kitAway: { primary: '#002776', secondary: '#FFDF00', accent: '#009C3B', shorts: '#002776', socks: '#FFDF00' }, formation: '4-2-3-1', overallRating: 87 },
  { id: 'arg', name: 'Argentina', code: 'ARG', flagColors: ['#74ACDF', '#FFFFFF', '#74ACDF'], kitHome: { primary: '#FFFFFF', secondary: '#74ACDF', accent: '#000000', shorts: '#000000', socks: '#FFFFFF' }, kitAway: { primary: '#1B3A5C', secondary: '#74ACDF', accent: '#FFFFFF', shorts: '#1B3A5C', socks: '#74ACDF' }, formation: '4-3-3', overallRating: 88 },
  { id: 'fra', name: 'France', code: 'FRA', flagColors: ['#002395', '#FFFFFF', '#ED2939'], kitHome: { primary: '#002395', secondary: '#FFFFFF', accent: '#ED2939', shorts: '#FFFFFF', socks: '#ED2939' }, kitAway: { primary: '#FFFFFF', secondary: '#002395', accent: '#ED2939', shorts: '#002395', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 86 },
  { id: 'eng', name: 'England', code: 'ENG', flagColors: ['#FFFFFF', '#CE1124', '#FFFFFF'], kitHome: { primary: '#FFFFFF', secondary: '#CE1124', accent: '#00247D', shorts: '#00247D', socks: '#FFFFFF' }, kitAway: { primary: '#CE1124', secondary: '#FFFFFF', accent: '#00247D', shorts: '#CE1124', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 85 },
  { id: 'ger', name: 'Germany', code: 'GER', flagColors: ['#000000', '#DD0000', '#FFCE00'], kitHome: { primary: '#FFFFFF', secondary: '#000000', accent: '#DD0000', shorts: '#000000', socks: '#FFFFFF' }, kitAway: { primary: '#1B1B1B', secondary: '#DD0000', accent: '#FFCE00', shorts: '#1B1B1B', socks: '#DD0000' }, formation: '4-2-3-1', overallRating: 84 },
  { id: 'esp', name: 'Spain', code: 'ESP', flagColors: ['#AA151B', '#F1BF00', '#AA151B'], kitHome: { primary: '#AA151B', secondary: '#F1BF00', accent: '#00247D', shorts: '#00247D', socks: '#AA151B' }, kitAway: { primary: '#FFFFFF', secondary: '#AA151B', accent: '#F1BF00', shorts: '#AA151B', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 86 },
  { id: 'por', name: 'Portugal', code: 'POR', flagColors: ['#006600', '#FF0000', '#FF0000'], kitHome: { primary: '#FF0000', secondary: '#006600', accent: '#FFD700', shorts: '#006600', socks: '#FF0000' }, kitAway: { primary: '#FFFFFF', secondary: '#FF0000', accent: '#006600', shorts: '#FF0000', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 84 },
  { id: 'ned', name: 'Netherlands', code: 'NED', flagColors: ['#AE1C28', '#FFFFFF', '#21468B'], kitHome: { primary: '#FF6600', secondary: '#FFFFFF', accent: '#21468B', shorts: '#000000', socks: '#FF6600' }, kitAway: { primary: '#21468B', secondary: '#FF6600', accent: '#FFFFFF', shorts: '#21468B', socks: '#FF6600' }, formation: '4-3-3', overallRating: 83 },
  { id: 'bel', name: 'Belgium', code: 'BEL', flagColors: ['#000000', '#FAE042', '#ED2939'], kitHome: { primary: '#FF0000', secondary: '#000000', accent: '#FAE042', shorts: '#000000', socks: '#FF0000' }, kitAway: { primary: '#FFFFFF', secondary: '#FF0000', accent: '#000000', shorts: '#FF0000', socks: '#FFFFFF' }, formation: '3-5-2', overallRating: 82 },
  { id: 'ita', name: 'Italy', code: 'ITA', flagColors: ['#009246', '#FFFFFF', '#CE2B37'], kitHome: { primary: '#003399', secondary: '#FFFFFF', accent: '#009246', shorts: '#FFFFFF', socks: '#003399' }, kitAway: { primary: '#FFFFFF', secondary: '#003399', accent: '#CE2B37', shorts: '#003399', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 83 },
  { id: 'cro', name: 'Croatia', code: 'CRO', flagColors: ['#FF0000', '#FFFFFF', '#003399'], kitHome: { primary: '#FF0000', secondary: '#FFFFFF', accent: '#003399', shorts: '#003399', socks: '#FF0000' }, kitAway: { primary: '#003399', secondary: '#FF0000', accent: '#FFFFFF', shorts: '#003399', socks: '#FF0000' }, formation: '4-3-3', overallRating: 81 },
  { id: 'uru', name: 'Uruguay', code: 'URU', flagColors: ['#FFFFFF', '#0038A8', '#FFFFFF'], kitHome: { primary: '#75AADB', secondary: '#FFFFFF', accent: '#000000', shorts: '#000000', socks: '#75AADB' }, kitAway: { primary: '#FFFFFF', secondary: '#75AADB', accent: '#000000', shorts: '#75AADB', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 82 },
  { id: 'col', name: 'Colombia', code: 'COL', flagColors: ['#FCD116', '#003893', '#CE1126'], kitHome: { primary: '#FCD116', secondary: '#003893', accent: '#CE1126', shorts: '#003893', socks: '#FCD116' }, kitAway: { primary: '#003893', secondary: '#FCD116', accent: '#CE1126', shorts: '#003893', socks: '#FCD116' }, formation: '4-2-3-1', overallRating: 80 },
  { id: 'jpn', name: 'Japan', code: 'JPN', flagColors: ['#FFFFFF', '#BC002D', '#FFFFFF'], kitHome: { primary: '#003399', secondary: '#FFFFFF', accent: '#BC002D', shorts: '#003399', socks: '#FFFFFF' }, kitAway: { primary: '#FFFFFF', secondary: '#003399', accent: '#BC002D', shorts: '#003399', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 79 },
  { id: 'kor', name: 'South Korea', code: 'KOR', flagColors: ['#FFFFFF', '#CD2E3A', '#0047A0'], kitHome: { primary: '#CD2E3A', secondary: '#FFFFFF', accent: '#0047A0', shorts: '#0047A0', socks: '#CD2E3A' }, kitAway: { primary: '#FFFFFF', secondary: '#CD2E3A', accent: '#0047A0', shorts: '#CD2E3A', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 77 },
  { id: 'aus', name: 'Australia', code: 'AUS', flagColors: ['#00008B', '#FFFFFF', '#FF0000'], kitHome: { primary: '#FFCC00', secondary: '#00843D', accent: '#00008B', shorts: '#00843D', socks: '#FFCC00' }, kitAway: { primary: '#00843D', secondary: '#FFCC00', accent: '#00008B', shorts: '#00843D', socks: '#FFCC00' }, formation: '4-2-3-1', overallRating: 76 },
  { id: 'mar', name: 'Morocco', code: 'MAR', flagColors: ['#C1272D', '#006233', '#C1272D'], kitHome: { primary: '#C1272D', secondary: '#006233', accent: '#FFFFFF', shorts: '#006233', socks: '#C1272D' }, kitAway: { primary: '#FFFFFF', secondary: '#C1272D', accent: '#006233', shorts: '#C1272D', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 80 },
  { id: 'sen', name: 'Senegal', code: 'SEN', flagColors: ['#00853F', '#FDEF42', '#E31B23'], kitHome: { primary: '#FFFFFF', secondary: '#00853F', accent: '#E31B23', shorts: '#00853F', socks: '#FFFFFF' }, kitAway: { primary: '#00853F', secondary: '#FFFFFF', accent: '#E31B23', shorts: '#00853F', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 78 },
  { id: 'nga', name: 'Nigeria', code: 'NGA', flagColors: ['#008751', '#FFFFFF', '#008751'], kitHome: { primary: '#008751', secondary: '#FFFFFF', accent: '#008751', shorts: '#FFFFFF', socks: '#008751' }, kitAway: { primary: '#FFFFFF', secondary: '#008751', accent: '#000000', shorts: '#008751', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 77 },
  { id: 'gha', name: 'Ghana', code: 'GHA', flagColors: ['#CE1126', '#FCD116', '#006B3F'], kitHome: { primary: '#FFFFFF', secondary: '#CE1126', accent: '#FCD116', shorts: '#000000', socks: '#FFFFFF' }, kitAway: { primary: '#CE1126', secondary: '#FFFFFF', accent: '#FCD116', shorts: '#CE1126', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 75 },
  { id: 'cmr', name: 'Cameroon', code: 'CMR', flagColors: ['#007A5E', '#CE1126', '#FCD116'], kitHome: { primary: '#007A5E', secondary: '#FCD116', accent: '#CE1126', shorts: '#CE1126', socks: '#007A5E' }, kitAway: { primary: '#FFFFFF', secondary: '#007A5E', accent: '#CE1126', shorts: '#007A5E', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 76 },
  { id: 'egy', name: 'Egypt', code: 'EGY', flagColors: ['#CE1126', '#FFFFFF', '#000000'], kitHome: { primary: '#CE1126', secondary: '#FFFFFF', accent: '#000000', shorts: '#FFFFFF', socks: '#CE1126' }, kitAway: { primary: '#FFFFFF', secondary: '#CE1126', accent: '#000000', shorts: '#CE1126', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 77 },
  { id: 'rsa', name: 'South Africa', code: 'RSA', flagColors: ['#007A4D', '#FFB612', '#DE3831'], kitHome: { primary: '#FFB612', secondary: '#007A4D', accent: '#DE3831', shorts: '#007A4D', socks: '#FFB612' }, kitAway: { primary: '#FFFFFF', secondary: '#007A4D', accent: '#DE3831', shorts: '#007A4D', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 73 },
  { id: 'alg', name: 'Algeria', code: 'ALG', flagColors: ['#006233', '#FFFFFF', '#D21034'], kitHome: { primary: '#FFFFFF', secondary: '#006233', accent: '#D21034', shorts: '#006233', socks: '#FFFFFF' }, kitAway: { primary: '#006233', secondary: '#FFFFFF', accent: '#D21034', shorts: '#006233', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 76 },
  { id: 'tun', name: 'Tunisia', code: 'TUN', flagColors: ['#E70013', '#FFFFFF', '#E70013'], kitHome: { primary: '#FFFFFF', secondary: '#E70013', accent: '#000000', shorts: '#E70013', socks: '#FFFFFF' }, kitAway: { primary: '#E70013', secondary: '#FFFFFF', accent: '#000000', shorts: '#E70013', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 74 },
  { id: 'crc', name: 'Costa Rica', code: 'CRC', flagColors: ['#002B7F', '#FFFFFF', '#CE1126'], kitHome: { primary: '#CE1126', secondary: '#002B7F', accent: '#FFFFFF', shorts: '#002B7F', socks: '#CE1126' }, kitAway: { primary: '#FFFFFF', secondary: '#CE1126', accent: '#002B7F', shorts: '#CE1126', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 74 },
  { id: 'ecu', name: 'Ecuador', code: 'ECU', flagColors: ['#FFD100', '#0033A0', '#CE1126'], kitHome: { primary: '#FFD100', secondary: '#0033A0', accent: '#CE1126', shorts: '#0033A0', socks: '#FFD100' }, kitAway: { primary: '#0033A0', secondary: '#FFD100', accent: '#CE1126', shorts: '#0033A0', socks: '#FFD100' }, formation: '4-3-3', overallRating: 77 },
  { id: 'per', name: 'Peru', code: 'PER', flagColors: ['#D91023', '#FFFFFF', '#D91023'], kitHome: { primary: '#FFFFFF', secondary: '#D91023', accent: '#FFFFFF', shorts: '#D91023', socks: '#FFFFFF' }, kitAway: { primary: '#D91023', secondary: '#FFFFFF', accent: '#D91023', shorts: '#D91023', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 75 },
  { id: 'chi', name: 'Chile', code: 'CHI', flagColors: ['#D52B1E', '#FFFFFF', '#0039A6'], kitHome: { primary: '#D52B1E', secondary: '#FFFFFF', accent: '#0039A6', shorts: '#0039A6', socks: '#D52B1E' }, kitAway: { primary: '#FFFFFF', secondary: '#D52B1E', accent: '#0039A6', shorts: '#D52B1E', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 76 },
  { id: 'par', name: 'Paraguay', code: 'PAR', flagColors: ['#D52B1E', '#FFFFFF', '#0038A8'], kitHome: { primary: '#FFFFFF', secondary: '#D52B1E', accent: '#0038A8', shorts: '#0038A8', socks: '#FFFFFF' }, kitAway: { primary: '#0038A8', secondary: '#FFFFFF', accent: '#D52B1E', shorts: '#0038A8', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 74 },
  { id: 'jam', name: 'Jamaica', code: 'JAM', flagColors: ['#009B3A', '#FED100', '#000000'], kitHome: { primary: '#FED100', secondary: '#009B3A', accent: '#000000', shorts: '#009B3A', socks: '#FED100' }, kitAway: { primary: '#009B3A', secondary: '#FED100', accent: '#000000', shorts: '#009B3A', socks: '#FED100' }, formation: '4-2-3-1', overallRating: 72 },
  { id: 'pan', name: 'Panama', code: 'PAN', flagColors: ['#FFFFFF', '#DA121A', '#072357'], kitHome: { primary: '#DA121A', secondary: '#FFFFFF', accent: '#072357', shorts: '#072357', socks: '#DA121A' }, kitAway: { primary: '#FFFFFF', secondary: '#DA121A', accent: '#072357', shorts: '#DA121A', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 71 },
  { id: 'hon', name: 'Honduras', code: 'HON', flagColors: ['#0073CF', '#FFFFFF', '#0073CF'], kitHome: { primary: '#FFFFFF', secondary: '#0073CF', accent: '#FFFFFF', shorts: '#0073CF', socks: '#FFFFFF' }, kitAway: { primary: '#0073CF', secondary: '#FFFFFF', accent: '#0073CF', shorts: '#0073CF', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 70 },
  { id: 'qat', name: 'Qatar', code: 'QAT', flagColors: ['#8D1B3D', '#FFFFFF', '#8D1B3D'], kitHome: { primary: '#8D1B3D', secondary: '#FFFFFF', accent: '#8D1B3D', shorts: '#FFFFFF', socks: '#8D1B3D' }, kitAway: { primary: '#FFFFFF', secondary: '#8D1B3D', accent: '#000000', shorts: '#8D1B3D', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 73 },
  { id: 'ksa', name: 'Saudi Arabia', code: 'KSA', flagColors: ['#006C35', '#FFFFFF', '#006C35'], kitHome: { primary: '#006C35', secondary: '#FFFFFF', accent: '#006C35', shorts: '#FFFFFF', socks: '#006C35' }, kitAway: { primary: '#FFFFFF', secondary: '#006C35', accent: '#006C35', shorts: '#006C35', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 74 },
  { id: 'irn', name: 'Iran', code: 'IRN', flagColors: ['#239F40', '#FFFFFF', '#DA0000'], kitHome: { primary: '#FFFFFF', secondary: '#239F40', accent: '#DA0000', shorts: '#239F40', socks: '#FFFFFF' }, kitAway: { primary: '#239F40', secondary: '#FFFFFF', accent: '#DA0000', shorts: '#239F40', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 75 },
  { id: 'uzb', name: 'Uzbekistan', code: 'UZB', flagColors: ['#1EB53A', '#FFFFFF', '#0099B5'], kitHome: { primary: '#FFFFFF', secondary: '#1EB53A', accent: '#0099B5', shorts: '#1EB53A', socks: '#FFFFFF' }, kitAway: { primary: '#0099B5', secondary: '#FFFFFF', accent: '#1EB53A', shorts: '#0099B5', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 72 },
  { id: 'jor', name: 'Jordan', code: 'JOR', flagColors: ['#000000', '#FFFFFF', '#007A3D'], kitHome: { primary: '#CE1126', secondary: '#FFFFFF', accent: '#000000', shorts: '#000000', socks: '#CE1126' }, kitAway: { primary: '#FFFFFF', secondary: '#CE1126', accent: '#000000', shorts: '#CE1126', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 71 },
  { id: 'nzl', name: 'New Zealand', code: 'NZL', flagColors: ['#00247D', '#FFFFFF', '#CC142B'], kitHome: { primary: '#FFFFFF', secondary: '#000000', accent: '#CC142B', shorts: '#000000', socks: '#FFFFFF' }, kitAway: { primary: '#000000', secondary: '#FFFFFF', accent: '#CC142B', shorts: '#000000', socks: '#FFFFFF' }, formation: '4-4-2', overallRating: 69 },
  { id: 'sui', name: 'Switzerland', code: 'SUI', flagColors: ['#FF0000', '#FFFFFF', '#FF0000'], kitHome: { primary: '#FF0000', secondary: '#FFFFFF', accent: '#FF0000', shorts: '#FFFFFF', socks: '#FF0000' }, kitAway: { primary: '#FFFFFF', secondary: '#FF0000', accent: '#000000', shorts: '#FF0000', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 80 },
  { id: 'den', name: 'Denmark', code: 'DEN', flagColors: ['#C60C30', '#FFFFFF', '#C60C30'], kitHome: { primary: '#C60C30', secondary: '#FFFFFF', accent: '#C60C30', shorts: '#FFFFFF', socks: '#C60C30' }, kitAway: { primary: '#FFFFFF', secondary: '#C60C30', accent: '#000000', shorts: '#C60C30', socks: '#FFFFFF' }, formation: '4-3-3', overallRating: 79 },
  { id: 'pol', name: 'Poland', code: 'POL', flagColors: ['#FFFFFF', '#DC143C', '#FFFFFF'], kitHome: { primary: '#FFFFFF', secondary: '#DC143C', accent: '#FFFFFF', shorts: '#DC143C', socks: '#FFFFFF' }, kitAway: { primary: '#DC143C', secondary: '#FFFFFF', accent: '#DC143C', shorts: '#DC143C', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 78 },
  { id: 'srb', name: 'Serbia', code: 'SRB', flagColors: ['#C6363C', '#0C4076', '#FFFFFF'], kitHome: { primary: '#C6363C', secondary: '#0C4076', accent: '#FFFFFF', shorts: '#0C4076', socks: '#C6363C' }, kitAway: { primary: '#FFFFFF', secondary: '#C6363C', accent: '#0C4076', shorts: '#C6363C', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 77 },
  { id: 'ukr', name: 'Ukraine', code: 'UKR', flagColors: ['#005BBB', '#FFD500', '#005BBB'], kitHome: { primary: '#FFD500', secondary: '#005BBB', accent: '#FFD500', shorts: '#005BBB', socks: '#FFD500' }, kitAway: { primary: '#005BBB', secondary: '#FFD500', accent: '#005BBB', shorts: '#005BBB', socks: '#FFD500' }, formation: '4-3-3', overallRating: 76 },
  { id: 'tur', name: 'Turkey', code: 'TUR', flagColors: ['#E30A17', '#FFFFFF', '#E30A17'], kitHome: { primary: '#E30A17', secondary: '#FFFFFF', accent: '#E30A17', shorts: '#FFFFFF', socks: '#E30A17' }, kitAway: { primary: '#FFFFFF', secondary: '#E30A17', accent: '#000000', shorts: '#E30A17', socks: '#FFFFFF' }, formation: '4-2-3-1', overallRating: 76 },
];

const FIRST_NAMES = ['James','Carlos','Lucas','Mohamed','Pierre','Marco','Andre','David','Thomas','Sergio','Luis','Diego','Gabriel','Rafael','Pedro','Fernando','Antonio','Miguel','Daniel','Alex','Ryan','Jack','Harry','Marcus','Kylian','Ousmane','Antoine','Olivier','Nolo','Bruno','Cristiano','Joao','Bernardo','Ruben','Luka','Ivan','Mateo','Nicolas','Julian','Joshua','Leroy','Kai','Jamal','Florian','Federico','Nicolo','Lorenzo','Gianluigi','Alessandro','Roberto','Hakim','Achraf','Youssef','Sadio','Kalidou','Victor','Wilfred','Riyad','Heung-min','Son','Kaoru','Takefusa','Mathew','Martin','Jackson','Alphonso','Jonathan','Cyle','Milan','Dusan','Sergej','Lautaro','Enzo','Rodrigo','Vinicius','Endrick','Richarlison','Ederson','Alisson','Emiliano'];
const LAST_NAMES = ['Silva','Santos','Oliveira','Souza','Rodriguez','Martinez','Garcia','Lopez','Fernandez','Gonzalez','Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Taylor','Mbappe','Griezmann','Giroud','Kante','Fernandes','Ronaldo','Felix','Modric','Perisic','Kovacic','Havertz','Musiala','Sane','Gnabry','Kimmich','Barella','Chiesa','Donnarumma','Bastoni','Hakimi','Ziyech','Mane','Koulibaly','Osimhen','Chukwueze','Mahrez','Son','Mitoma','Kubo','Ryan','Odegaard','Davies','David','Larin','Pulisic','Musah','Reyna','Martinez','Dybala','Vlahovic','Mitrovic','Alvarez','Valverde','Vinicius','Neymar','Richarlison','Ederson','Martinez','Courtois','Donnarumma'];

const POSITIONS: Position[] = ['GK','GK','GK','CB','CB','CB','LB','RB','CDM','CDM','CM','CM','CM','CAM','LM','RM','LW','RW','ST','ST','CF','CB','LB','RB','CM'];

function generateSquad(team: Omit<TeamMeta, 'squad'>, count = 26) {
  const squad = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      name = `${fn} ${ln}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const pos = POSITIONS[i] ?? 'CM';
    const isGK = pos === 'GK';
    const base = team.overallRating;
    const variance = Math.floor(Math.random() * 12) - 6;
    const rating = clamp(base + variance + (i < 11 ? 5 : 0), 55, 92);

    const ratings: Record<string, number> = isGK
      ? { pace: rating - 20, shooting: 30, passing: rating - 10, dribbling: 40, defending: 50, physical: rating, diving: rating + 5, handling: rating, kicking: rating - 5, reflexes: rating + 3, positioning: rating }
      : { pace: rating + Math.floor(Math.random() * 10) - 5, shooting: rating + Math.floor(Math.random() * 8) - 4, passing: rating + Math.floor(Math.random() * 8) - 4, dribbling: rating + Math.floor(Math.random() * 8) - 4, defending: rating + Math.floor(Math.random() * 8) - 4, physical: rating + Math.floor(Math.random() * 8) - 4 };

    const player = {
      id: `${team.id}-p${i + 1}`,
      name,
      number: i < 11 ? i + 1 : 12 + (i - 11),
      position: pos,
      club: ['FC Barcelona', 'Real Madrid', 'Manchester City', 'Liverpool', 'Bayern Munich', 'PSG', 'Inter Milan', 'AC Milan', 'Arsenal', 'Chelsea', 'Juventus', 'Borussia Dortmund', 'Atletico Madrid', 'Tottenham', 'Napoli', 'LAFC', 'Inter Miami', 'Club America'][Math.floor(Math.random() * 18)],
      nationality: team.name,
      height: 170 + Math.floor(Math.random() * 25),
      skinTone: Math.floor(Math.random() * 6),
      hairStyle: Math.floor(Math.random() * 5),
      ratings,
    };
    squad.push(player);
  }
  return squad;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

const outDir = join(__dirname, '..', 'src', 'data', 'teams');
mkdirSync(outDir, { recursive: true });

const index: { id: string; name: string; code: string; file: string }[] = [];

for (const team of TEAMS) {
  const full: TeamMeta = { ...team, squad: generateSquad(team) };
  const file = `${team.id}.json`;
  writeFileSync(join(outDir, file), JSON.stringify(full, null, 2));
  index.push({ id: team.id, name: team.name, code: team.code, file });
}

writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`Generated ${TEAMS.length} team files`);
