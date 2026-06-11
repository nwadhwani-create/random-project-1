import type { TeamData } from '@/core/types';
import teamsIndex from './teams/index.json';
import { DEMO_HOME, DEMO_AWAY } from './demoTeams';

export interface TeamMeta {
  code: string;
  name: string;
  group: string;
  flagColors: [string, string, string];
  kit: TeamData['kit'];
  formation: string;
  strength: number;
}

export const ALL_TEAMS: TeamMeta[] = teamsIndex as TeamMeta[];

const squadCache = new Map<string, TeamData>();

export async function loadTeam(code: string): Promise<TeamData> {
  const upper = code.toUpperCase();
  if (upper === 'USA') return { ...DEMO_HOME };
  if (upper === 'MEX') return { ...DEMO_AWAY };

  const cached = squadCache.get(upper);
  if (cached) return cached;

  try {
    const mod = await import(`./teams/squads/${upper.toLowerCase()}.json`);
    const team = mod.default as TeamData;
    squadCache.set(upper, team);
    return team;
  } catch {
    const meta = ALL_TEAMS.find((t) => t.code === upper);
    if (!meta) throw new Error(`Team not found: ${code}`);
    return metaToTeamData(meta);
  }
}

export function metaToTeamData(meta: TeamMeta): TeamData {
  return {
    code: meta.code,
    name: meta.name,
    flagColors: meta.flagColors,
    kit: meta.kit,
    formation: meta.formation,
    players: [],
  };
}

export function getTeamsByGroup(): Record<string, TeamMeta[]> {
  const groups: Record<string, TeamMeta[]> = {};
  for (const team of ALL_TEAMS) {
    if (!groups[team.group]) groups[team.group] = [];
    groups[team.group]!.push(team);
  }
  return groups;
}

export function getAllTeamCodes(): string[] {
  return ALL_TEAMS.map((t) => t.code);
}
