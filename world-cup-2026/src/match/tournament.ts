import type { BracketMatch, GroupStanding, TournamentGroup, TournamentState } from '../data/types';
import { getTeamById, getTeamIds } from '../data/teams';
import { shuffle } from '../utils/math';

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export class TournamentManager {
  state: TournamentState;

  constructor(userTeamId: string) {
    this.state = this.createTournament(userTeamId);
  }

  private createTournament(userTeamId: string): TournamentState {
    const allTeams = shuffle(getTeamIds());
    const groups: TournamentGroup[] = [];

    for (let g = 0; g < 12; g++) {
      const groupTeams = allTeams.slice(g * 4, g * 4 + 4);
      groups.push({
        name: GROUP_NAMES[g],
        teams: groupTeams,
        standings: groupTeams.map((teamId) => ({
          teamId,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
        })),
      });
    }

    return {
      groups,
      bracket: [],
      topScorers: [],
      userTeamId,
      currentMatchId: null,
    };
  }

  simulateGroupMatch(homeId: string, awayId: string): { homeScore: number; awayScore: number } {
    const home = getTeamById(homeId)!;
    const away = getTeamById(awayId)!;
    const homeStr = home.overallRating + Math.random() * 10;
    const awayStr = away.overallRating + Math.random() * 10;
    const homeScore = this.generateGoals(homeStr, awayStr);
    const awayScore = this.generateGoals(awayStr, homeStr);
    return { homeScore, awayScore };
  }

  private generateGoals(attack: number, defense: number): number {
    const expected = Math.max(0, (attack - defense) / 15 + 1);
    let goals = 0;
    for (let i = 0; i < 5; i++) {
      if (Math.random() < expected / 5) goals++;
    }
    return goals;
  }

  recordResult(groupIndex: number, homeId: string, awayId: string, homeScore: number, awayScore: number): void {
    const group = this.state.groups[groupIndex];
    const homeStanding = group.standings.find((s) => s.teamId === homeId)!;
    const awayStanding = group.standings.find((s) => s.teamId === awayId)!;

    homeStanding.played++;
    awayStanding.played++;
    homeStanding.goalsFor += homeScore;
    homeStanding.goalsAgainst += awayScore;
    awayStanding.goalsFor += awayScore;
    awayStanding.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeStanding.won++;
      awayStanding.lost++;
      homeStanding.points += 3;
    } else if (awayScore > homeScore) {
      awayStanding.won++;
      homeStanding.lost++;
      awayStanding.points += 3;
    } else {
      homeStanding.drawn++;
      awayStanding.drawn++;
      homeStanding.points++;
      awayStanding.points++;
    }

    group.standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  }

  simulateRemainingGroupGames(): void {
    for (let gi = 0; gi < this.state.groups.length; gi++) {
      const group = this.state.groups[gi];
      const teams = group.teams;
      const matchups = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

      for (const [a, b] of matchups) {
        const home = teams[a];
        const away = teams[b];
        const alreadyPlayed = group.standings.find((s) => s.teamId === home)!.played >= 3;
        if (alreadyPlayed) continue;
        if (home === this.state.userTeamId || away === this.state.userTeamId) continue;

        const result = this.simulateGroupMatch(home, away);
        this.recordResult(gi, home, away, result.homeScore, result.awayScore);
      }
    }
  }

  buildBracket(): void {
    const qualified: string[] = [];
    const thirdPlace: GroupStanding[] = [];

    for (const group of this.state.groups) {
      qualified.push(group.standings[0].teamId, group.standings[1].teamId);
      thirdPlace.push(group.standings[2]);
    }

    thirdPlace.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    qualified.push(...thirdPlace.slice(0, 8).map((s) => s.teamId));

    const rounds = ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
    const bracket: BracketMatch[] = [];
    let matchId = 0;

    for (let i = 0; i < 16; i++) {
      bracket.push({
        id: `r32-${matchId++}`,
        round: rounds[0],
        homeTeamId: qualified[i * 2] ?? null,
        awayTeamId: qualified[i * 2 + 1] ?? null,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        played: false,
        userPlayed: false,
      });
    }

    this.state.bracket = bracket;
  }

  getUserGroup(): TournamentGroup | null {
    return this.state.groups.find((g) => g.teams.includes(this.state.userTeamId)) ?? null;
  }

  getNextUserMatch(): { homeId: string; awayId: string; groupIndex: number } | null {
    const group = this.getUserGroup();
    if (!group) return null;

    const gi = this.state.groups.indexOf(group);
    const userId = this.state.userTeamId;

    for (const opponent of group.teams) {
      if (opponent === userId) continue;
      const userPlayed = group.standings.find((s) => s.teamId === userId)!.played;
      if (userPlayed < 3) {
        const matchCount = group.standings.find((s) => s.teamId === userId)!.played;
        if (matchCount < 3) {
          return { homeId: userId, awayId: opponent, groupIndex: gi };
        }
      }
    }
    return null;
  }
}
