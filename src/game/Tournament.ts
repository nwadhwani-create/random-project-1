import type { TeamMeta } from '@/data/teamLoader';
import { ALL_TEAMS } from '@/data/teamLoader';

export interface GroupStanding {
  team: TeamMeta;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface KnockoutMatch {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  home: TeamMeta | null;
  away: TeamMeta | null;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  userMatch: boolean;
}

export class Tournament {
  readonly groups: Record<string, GroupStanding[]> = {};
  readonly knockout: KnockoutMatch[] = [];
  private readonly groupLetters = 'ABCDEFGHIJKL'.split('');

  constructor() {
    this.initGroups();
  }

  private initGroups(): void {
    for (const letter of this.groupLetters) {
      const teams = ALL_TEAMS.filter((t) => t.group === letter);
      this.groups[letter] = teams.map((team) => ({
        team, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
      }));
    }
  }

  simulateMatch(home: TeamMeta, away: TeamMeta): { homeScore: number; awayScore: number } {
    const homeStr = home.strength + Math.random() * 10;
    const awayStr = away.strength + Math.random() * 10;
    const diff = (homeStr - awayStr) / 15;
    const baseGoals = 1.2 + Math.random() * 2;

    let homeScore = Math.max(0, Math.round(baseGoals + diff + (Math.random() - 0.5)));
    let awayScore = Math.max(0, Math.round(baseGoals - diff + (Math.random() - 0.5)));

    if (Math.random() < 0.25) homeScore = awayScore; // draw chance
    return { homeScore, awayScore };
  }

  recordResult(group: string, homeCode: string, awayCode: string, homeScore: number, awayScore: number): void {
    const standings = this.groups[group];
    if (!standings) return;

    const home = standings.find((s) => s.team.code === homeCode);
    const away = standings.find((s) => s.team.code === awayCode);
    if (!home || !away) return;

    home.played++; away.played++;
    home.goalsFor += homeScore; home.goalsAgainst += awayScore;
    away.goalsFor += awayScore; away.goalsAgainst += homeScore;

    if (homeScore > awayScore) { home.won++; home.points += 3; away.lost++; }
    else if (awayScore > homeScore) { away.won++; away.points += 3; home.lost++; }
    else { home.drawn++; away.drawn++; home.points++; away.points++; }

    standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  }

  getSortedStandings(group: string): GroupStanding[] {
    return [...(this.groups[group] ?? [])];
  }

  simulateGroupStage(): void {
    for (const letter of this.groupLetters) {
      const standings = this.groups[letter]!;
      const teams = standings.map((s) => s.team);
      const matchups: [number, number][] = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
      for (const [hIdx, aIdx] of matchups) {
        const homeTeam = teams[hIdx]!;
        const awayTeam = teams[aIdx]!;
        const result = this.simulateMatch(homeTeam, awayTeam);
        this.recordResult(letter, homeTeam.code, awayTeam.code, result.homeScore, result.awayScore);
      }
    }
  }
}
