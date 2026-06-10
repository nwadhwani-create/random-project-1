import { allTeams, getTeam, type Team } from '../data/roster';
import { GROUPS } from '../data/teams';
import { simulateMatch, type SimResult } from '../game';

export interface Fixture {
  id: string;
  home: string;
  away: string;
  group?: string;
  round: 'group1' | 'group2' | 'group3' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  result?: SimResult & { userPlayed?: boolean };
}

export interface TableRow {
  team: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
}

interface TournamentState {
  userTeam: string;
  fixtures: Fixture[];
  stage: 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'done';
  champion?: string;
}

const ROUND_LABEL: Record<string, string> = {
  group1: 'Matchday 1', group2: 'Matchday 2', group3: 'Matchday 3',
  r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-final', sf: 'Semi-final', final: 'FINAL',
};

const KO_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'] as const;

/**
 * Full 2026 World Cup: 12 groups of 4; top two of each group plus the
 * 8 best third-placed teams advance to a round of 32, then knockout.
 */
export class Tournament {
  state: TournamentState;

  constructor(userTeam: string, restore?: TournamentState) {
    if (restore) { this.state = restore; return; }
    const fixtures: Fixture[] = [];
    for (const g of GROUPS) {
      const teams = allTeams().filter((t) => t.meta.group === g).map((t) => t.meta.name);
      const [a, b, c, d] = teams;
      fixtures.push(
        { id: `g${g}1a`, home: a, away: b, group: g, round: 'group1' },
        { id: `g${g}1b`, home: c, away: d, group: g, round: 'group1' },
        { id: `g${g}2a`, home: a, away: c, group: g, round: 'group2' },
        { id: `g${g}2b`, home: b, away: d, group: g, round: 'group2' },
        { id: `g${g}3a`, home: d, away: a, group: g, round: 'group3' },
        { id: `g${g}3b`, home: b, away: c, group: g, round: 'group3' },
      );
    }
    this.state = { userTeam, fixtures, stage: 'groups' };
  }

  save(): void {
    try { localStorage.setItem('wc26-tournament', JSON.stringify(this.state)); } catch { /* ignore */ }
  }

  static load(): Tournament | null {
    try {
      const s = localStorage.getItem('wc26-tournament');
      if (!s) return null;
      return new Tournament('', JSON.parse(s));
    } catch { return null; }
  }

  static clear(): void {
    try { localStorage.removeItem('wc26-tournament'); } catch { /* ignore */ }
  }

  get userTeam(): string { return this.state.userTeam; }

  table(group: string): TableRow[] {
    const rows = new Map<string, TableRow>();
    for (const t of allTeams().filter((t) => t.meta.group === group)) {
      rows.set(t.meta.name, { team: t.meta.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
    }
    for (const f of this.state.fixtures) {
      if (f.group !== group || !f.result) continue;
      const [gh, ga] = f.result.scores;
      const rh = rows.get(f.home)!, ra = rows.get(f.away)!;
      rh.p++; ra.p++;
      rh.gf += gh; rh.ga += ga; ra.gf += ga; ra.ga += gh;
      if (gh > ga) { rh.w++; rh.pts += 3; ra.l++; }
      else if (gh < ga) { ra.w++; ra.pts += 3; rh.l++; }
      else { rh.d++; ra.d++; rh.pts++; ra.pts++; }
    }
    return [...rows.values()].sort((a, b) =>
      b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team));
  }

  /** next unplayed fixture involving the user's team, or null */
  nextUserFixture(): Fixture | null {
    return this.state.fixtures.find((f) => !f.result && (f.home === this.userTeam || f.away === this.userTeam)) ?? null;
  }

  /** all unplayed fixtures of the current pending round */
  private currentRound(): Fixture[] {
    for (const r of ['group1', 'group2', 'group3', ...KO_ORDER] as const) {
      const fs = this.state.fixtures.filter((f) => f.round === r);
      if (fs.length && fs.some((f) => !f.result)) return fs.filter((f) => !f.result);
    }
    return [];
  }

  get currentRoundName(): string {
    for (const r of ['group1', 'group2', 'group3', ...KO_ORDER] as const) {
      const fs = this.state.fixtures.filter((f) => f.round === r);
      if (fs.length && fs.some((f) => !f.result)) return ROUND_LABEL[r];
    }
    return this.state.champion ? `Champions: ${this.state.champion}` : '';
  }

  isKnockout(f: Fixture): boolean { return !f.group; }

  /** record the user-played result and simulate the rest of the round */
  reportUserResult(f: Fixture, result: SimResult): void {
    f.result = { ...result, userPlayed: true };
    this.simulateCurrentRound();
    this.save();
  }

  /** sim every remaining match of the current round (including user's if skipped) */
  simulateCurrentRound(): void {
    const fs = this.currentRound();
    for (const f of fs) {
      if (f.result) continue;
      f.result = simulateMatch(getTeam(f.home), getTeam(f.away), this.isKnockout(f));
    }
    this.afterRound();
    this.save();
  }

  private roundDone(round: Fixture['round']): boolean {
    const fs = this.state.fixtures.filter((f) => f.round === round);
    return fs.length > 0 && fs.every((f) => !!f.result);
  }

  private afterRound(): void {
    const s = this.state;
    if (s.stage === 'groups' && this.roundDone('group3')) {
      this.buildR32();
      s.stage = 'r32';
      return;
    }
    for (let i = 0; i < KO_ORDER.length; i++) {
      const r = KO_ORDER[i];
      if (s.stage === r && this.roundDone(r)) {
        if (r === 'final') {
          const f = s.fixtures.find((x) => x.round === 'final')!;
          s.champion = this.winnerOf(f);
          s.stage = 'done';
        } else {
          this.buildNextKO(r, KO_ORDER[i + 1]);
          s.stage = KO_ORDER[i + 1];
        }
        return;
      }
    }
  }

  winnerOf(f: Fixture): string {
    const r = f.result!;
    if (r.scores[0] !== r.scores[1]) return r.scores[0] > r.scores[1] ? f.home : f.away;
    if (r.penScores) return r.penScores[0] > r.penScores[1] ? f.home : f.away;
    return f.home;
  }

  private buildR32(): void {
    // winners, runners-up, and 8 best thirds
    const winners: TableRow[] = [];
    const runners: TableRow[] = [];
    const thirds: TableRow[] = [];
    for (const g of GROUPS) {
      const t = this.table(g);
      winners.push(t[0]);
      runners.push(t[1]);
      thirds.push(t[2]);
    }
    const cmp = (a: TableRow, b: TableRow) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
    winners.sort(cmp); runners.sort(cmp); thirds.sort(cmp);
    const qualified = [...winners, ...runners, ...thirds.slice(0, 8)].map((r) => r.team);
    // seeded bracket: 1v32, 16v17 etc., standard seed ordering keeps top seeds apart
    const seedOrder = bracketSeeds(32); // positions for seeds 1..32
    const slots: string[] = new Array(32);
    seedOrder.forEach((seed, pos) => { slots[pos] = qualified[seed - 1]; });
    // avoid same-group clashes in R32 where a simple swap fixes it
    for (let i = 0; i < 32; i += 2) {
      const a = getTeam(slots[i]).meta.group, b = getTeam(slots[i + 1]).meta.group;
      if (a === b) {
        for (let j = i + 3; j < 32; j += 2) {
          if (getTeam(slots[j]).meta.group !== a && getTeam(slots[i]).meta.group !== getTeam(slots[j]).meta.group) {
            [slots[i + 1], slots[j]] = [slots[j], slots[i + 1]];
            break;
          }
        }
      }
    }
    for (let i = 0; i < 16; i++) {
      this.state.fixtures.push({ id: `r32-${i}`, home: slots[i * 2], away: slots[i * 2 + 1], round: 'r32' });
    }
  }

  private buildNextKO(from: Fixture['round'], to: Fixture['round']): void {
    const prev = this.state.fixtures.filter((f) => f.round === from);
    for (let i = 0; i < prev.length / 2; i++) {
      this.state.fixtures.push({
        id: `${to}-${i}`,
        home: this.winnerOf(prev[i * 2]),
        away: this.winnerOf(prev[i * 2 + 1]),
        round: to,
      });
    }
  }

  topScorers(limit = 12): { name: string; team: string; goals: number }[] {
    const map = new Map<string, { name: string; team: string; goals: number }>();
    for (const f of this.state.fixtures) {
      if (!f.result) continue;
      for (const s of f.result.scorers) {
        if (s.name.includes('(o.g.)')) continue;
        const teamName = s.team === 0 ? f.home : f.away;
        const key = `${s.name}|${teamName}`;
        const e = map.get(key) ?? { name: s.name, team: teamName, goals: 0 };
        e.goals++;
        map.set(key, e);
      }
    }
    return [...map.values()].sort((a, b) => b.goals - a.goals).slice(0, limit);
  }

  koRounds(): { round: string; label: string; fixtures: Fixture[] }[] {
    return KO_ORDER
      .map((r) => ({ round: r, label: ROUND_LABEL[r], fixtures: this.state.fixtures.filter((f) => f.round === r) }))
      .filter((x) => x.fixtures.length > 0);
  }

  /** is user still alive? */
  userAlive(): boolean {
    if (this.state.stage === 'groups') return true;
    if (this.state.stage === 'done') return this.state.champion === this.userTeam;
    // user alive if they appear in the current stage fixtures
    return this.state.fixtures.some((f) => f.round === this.state.stage && (f.home === this.userTeam || f.away === this.userTeam));
  }

  get champion(): string | undefined { return this.state.champion; }
}

/** standard bracket positions: returns seed number for each slot (1-indexed seeds) */
function bracketSeeds(n: number): number[] {
  let rounds = [1];
  while (rounds.length < n) {
    const next: number[] = [];
    const m = rounds.length * 2;
    for (const s of rounds) { next.push(s, m + 1 - s); }
    rounds = next;
  }
  return rounds;
}

export type { Team };
