// Headless penalty shootout test (shootout-only mode, both sides AI).
import { Match } from '../src/sim/match';
import { TeamAI } from '../src/sim/ai';
import { getTeam } from '../src/data/roster';

const match = new Match(getTeam('Argentina'), getTeam('England'), {
  halfMinutes: 3, difficulty: 'pro', knockout: true,
  userTeams: [false, false], shootoutOnly: true,
});
const ai = new TeamAI(match);
const dt = 1 / 60;
let frames = 0;
let lastEvent = 0;
while (!match.over && frames < 60 * 600) {
  frames++;
  ai.step(dt, [null, null]);
  match.step(dt);
  for (; lastEvent < match.events.length; lastEvent++) {
    const e = match.events[lastEvent];
    if (['pen-goal', 'pen-miss', 'shootout', 'fulltime', 'save'].includes(e.type)) {
      console.log(`${e.type} ${e.team !== undefined ? match.sides[e.team].team.meta.code : ''}`);
    }
  }
}
if (!match.over) { console.error('FAIL: shootout never finished, phase=', match.phase); process.exit(1); }
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
console.log(`RESULT: ${sum(match.shootoutScores[0])}-${sum(match.shootoutScores[1])}, winner=${match.sides[match.winner].team.meta.name}`);
console.log(`kicks: ${match.shootoutScores[0].length}+${match.shootoutScores[1].length}, frames=${frames}`);
console.log('PASS');
