import { Game } from '@/game/Game';
import { ALL_TEAMS } from '@/data/teamLoader';
import { Tournament } from '@/game/Tournament';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

function populateTeamSelects(): void {
  const homeSelect = document.getElementById('home-select') as HTMLSelectElement;
  const awaySelect = document.getElementById('away-select') as HTMLSelectElement;
  const sorted = [...ALL_TEAMS].sort((a, b) => a.name.localeCompare(b.name));

  for (const team of sorted) {
    const opt1 = new Option(`${team.name} (${team.code})`, team.code);
    const opt2 = new Option(`${team.name} (${team.code})`, team.code);
    homeSelect.add(opt1);
    awaySelect.add(opt2);
  }
  homeSelect.value = 'USA';
  awaySelect.value = 'MEX';
}

function loop(): void {
  game.update();
  requestAnimationFrame(loop);
}

document.getElementById('btn-quick-match')?.addEventListener('click', () => {
  const home = (document.getElementById('home-select') as HTMLSelectElement).value;
  const away = (document.getElementById('away-select') as HTMLSelectElement).value;
  game.startMatch({ halfMinutes: 5, lighting: 'day', homeTeam: home, awayTeam: away });
});

document.getElementById('btn-tournament')?.addEventListener('click', () => {
  const tournament = new Tournament();
  tournament.simulateGroupStage();
  const groupA = tournament.getSortedStandings('A');
  const table = groupA.map((s) =>
    `${s.team.code}: ${s.points}pts (${s.goalsFor}-${s.goalsAgainst})`
  ).join('\n');
  alert(`Tournament Group A simulated!\n\n${table}\n\nFull bracket UI coming in next milestone.`);
});

populateTeamSelects();
game.update();
requestAnimationFrame(loop);
