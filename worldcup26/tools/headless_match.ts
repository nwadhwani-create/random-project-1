// Headless full-match simulation through the real engine (no rendering).
// Usage: npx tsx tools/headless_match.ts [homeTeam] [awayTeam] [halves-minutes] [--knockout]
// Validates: phases progress, goals get scored, restarts work, match completes.
import { Match } from '../src/sim/match';
import { TeamAI } from '../src/sim/ai';
import { getTeam } from '../src/data/roster';

const home = process.argv[2] ?? 'Brazil';
const away = process.argv[3] ?? 'Argentina';
const halfMin = Number(process.argv[4] ?? 3);
const knockout = process.argv.includes('--knockout');

const match = new Match(getTeam(home), getTeam(away), {
  halfMinutes: halfMin,
  difficulty: 'pro',
  knockout,
  userTeams: [false, false],
});
const ai = new TeamAI(match);

const dt = 1 / 60;
let frames = 0;
let third0 = 0, thirdM = 0, third1 = 0; // ball occupancy: home-defensive / middle / home-attacking
const maxFrames = 60 * 60 * (halfMin * 2 + 8); // generous cap incl. ET + pens
const phaseCounts = new Map<string, number>();
let lastEvent = 0;

while (!match.over && frames < maxFrames) {
  frames++;
  ai.step(dt, [null, null]);
  match.step(dt);
  phaseCounts.set(match.phase, (phaseCounts.get(match.phase) ?? 0) + 1);
  if (match.phase === 'half-end') match.resumeFromBreak();
  for (; lastEvent < match.events.length; lastEvent++) {
    const e = match.events[lastEvent];
    if (['goal', 'penalty', 'yellow', 'red', 'offside', 'halftime', 'fulltime', 'corner', 'shootout', 'pen-goal', 'pen-miss'].includes(e.type)) {
      console.log(`[${match.clockDisplay}] ${e.type}${e.text ? ` — ${e.text}` : ''}`);
    }
  }
  if (match.phase === 'play') {
    const bx = match.ball.pos.x * match.sides[0].attackDir;
    if (bx < -17.5) third0++; else if (bx > 17.5) third1++; else thirdM++;
  }
  // sanity checks
  const b = match.ball.pos;
  if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.z)) {
    console.error('FAIL: ball position NaN at frame', frames);
    process.exit(1);
  }
  for (const side of match.sides) {
    for (const p of side.players) {
      if (!isFinite(p.pos.x) || !isFinite(p.pos.z)) {
        console.error('FAIL: player NaN', p.data.name);
        process.exit(1);
      }
    }
  }
}

if (!match.over) {
  console.error(`FAIL: match did not finish in ${maxFrames} frames (phase=${match.phase}, clock=${match.clockDisplay}, half=${match.half})`);
  process.exit(1);
}

const s = match.sides;
console.log('\n=== RESULT:', match.resultText, '===');
const poss = s[0].stats.possession + s[1].stats.possession || 1;
console.log(`possession ${Math.round((s[0].stats.possession / poss) * 100)}% - ${Math.round((s[1].stats.possession / poss) * 100)}%`);
console.log(`shots ${s[0].stats.shots}-${s[1].stats.shots}, on target ${s[0].stats.onTarget}-${s[1].stats.onTarget}, saves ${s[0].stats.saves}-${s[1].stats.saves}`);
console.log(`fouls ${s[0].stats.fouls}-${s[1].stats.fouls}, yellows ${s[0].stats.yellows}-${s[1].stats.yellows}, reds ${s[0].stats.reds}-${s[1].stats.reds}`);
console.log(`corners ${s[0].stats.corners}-${s[1].stats.corners}, offsides ${s[0].stats.offsides}-${s[1].stats.offsides}`);
console.log('scorers:', match.scorers.map((x) => `${x.name} ${x.minute}'`).join(', ') || 'none');
const tt = third0 + thirdM + third1 || 1;
console.log(`ball thirds (def/mid/att for home): ${Math.round(third0 / tt * 100)}% / ${Math.round(thirdM / tt * 100)}% / ${Math.round(third1 / tt * 100)}%`);
console.log('phases seen:', [...phaseCounts.keys()].join(', '));
console.log('frames:', frames);
console.log('PASS');
