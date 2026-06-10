import squadsJson from './squads.json';
import { TEAMS, teamMeta, type TeamMeta } from './teams';
import type { PlayerData, SquadsFile, Pos } from './types';

const squads = squadsJson as unknown as SquadsFile;

export interface Team {
  meta: TeamMeta;
  squad: PlayerData[];
  lineup: PlayerData[]; // 11 starters ordered GK first, then by formation slot
  strength: number;     // 0..100 best-XI average, used for quick sims + AI
  attack: number;
  defense: number;
}

/** formation -> count of DF / MF / FW outfield slots */
export function formationShape(f: string): [number, number, number] {
  switch (f) {
    case '433': return [4, 3, 3];
    case '442': return [4, 4, 2];
    case '4231': return [4, 5, 1];
    case '352': return [3, 5, 2];
    case '532': return [5, 3, 2];
    case '541': return [5, 4, 1];
    case '343': return [3, 4, 3];
    default: return [4, 4, 2];
  }
}

function pickLineup(players: PlayerData[], formation: string): PlayerData[] {
  const [nd, nm, nf] = formationShape(formation);
  const by = (pos: Pos) => players.filter((p) => p.pos === pos).sort((a, b) => b.overall - a.overall);
  const gk = by('GK')[0];
  const df = by('DF');
  const mf = by('MF');
  const fw = by('FW');
  const take = (arr: PlayerData[], n: number, used: Set<PlayerData>) => {
    const out: PlayerData[] = [];
    for (const p of arr) {
      if (out.length >= n) break;
      if (!used.has(p)) { out.push(p); used.add(p); }
    }
    return out;
  };
  const used = new Set<PlayerData>([gk]);
  const defs = take(df, nd, used);
  const mids = take(mf, nm, used);
  const fwds = take(fw, nf, used);
  // backfill shortages from the best remaining players of adjacent lines
  const rest = players
    .filter((p) => !used.has(p) && p.pos !== 'GK')
    .sort((a, b) => b.overall - a.overall);
  while (defs.length < nd && rest.length) { const p = rest.shift()!; defs.push(p); used.add(p); }
  while (mids.length < nm && rest.length) { const p = rest.shift()!; mids.push(p); used.add(p); }
  while (fwds.length < nf && rest.length) { const p = rest.shift()!; fwds.push(p); used.add(p); }
  return [gk, ...defs, ...mids, ...fwds];
}

function buildTeam(meta: TeamMeta): Team {
  const squad = squads.teams.find((t) => t.name === meta.name)?.players;
  if (!squad) throw new Error(`No squad for ${meta.name}`);
  const lineup = pickLineup(squad, meta.formation);
  const avg = (ps: PlayerData[]) => ps.reduce((s, p) => s + p.overall, 0) / ps.length;
  const strength = avg(lineup);
  const attack = avg(lineup.filter((p) => p.pos === 'FW' || p.pos === 'MF'));
  const defense = avg(lineup.filter((p) => p.pos === 'DF' || p.pos === 'GK'));
  return { meta, squad, lineup, strength, attack, defense };
}

const cache = new Map<string, Team>();

export function getTeam(name: string): Team {
  let t = cache.get(name);
  if (!t) { t = buildTeam(teamMeta(name)); cache.set(name, t); }
  return t;
}

export function allTeams(): Team[] {
  return TEAMS.map((m) => getTeam(m.name));
}
