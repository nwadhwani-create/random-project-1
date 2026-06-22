import type { TeamData } from './types';
import teamIndex from './teams/index.json';

const teamCache = new Map<string, TeamData>();

const modules = import.meta.glob('./teams/*.json', { eager: true });

export function getAllTeams(): Pick<TeamData, 'id' | 'name' | 'code' | 'overallRating'>[] {
  return teamIndex
    .map((t) => {
      const data = getTeamById(t.id);
      return data ? { id: data.id, name: data.name, code: data.code, overallRating: data.overallRating } : null;
    })
    .filter(Boolean) as Pick<TeamData, 'id' | 'name' | 'code' | 'overallRating'>[];
}

export function getTeamById(id: string): TeamData | null {
  if (teamCache.has(id)) return teamCache.get(id)!;
  const entry = teamIndex.find((t) => t.id === id);
  if (!entry) return null;
  const path = `./teams/${entry.file}`;
  const mod = modules[path] as { default: TeamData };
  if (!mod?.default) return null;
  const team = mod.default;
  teamCache.set(id, team);
  return team;
}

export function getTeamIds(): string[] {
  return teamIndex.map((t) => t.id);
}
