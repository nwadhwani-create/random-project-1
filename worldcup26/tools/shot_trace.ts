// Frame-by-frame trace of a single box shot vs the GK.
import { Match } from '../src/sim/match';
import { TeamAI } from '../src/sim/ai';
import { getTeam } from '../src/data/roster';

const m = new Match(getTeam('Spain'), getTeam('Panama'), {
  halfMinutes: 10, difficulty: 'amateur', knockout: false, userTeams: [true, false],
});
const ai = new TeamAI(m);
const dt = 1 / 60;
// get into play
for (let i = 0; i < 600 && m.phase !== 'play'; i++) { ai.step(dt, [null, null]); m.step(dt); }
m.takeSetPiece();
for (let i = 0; i < 60; i++) { ai.step(dt, [null, null]); m.step(dt); }
console.log('phase', m.phase);

const dir = m.sides[0].attackDir;
const p = m.sides[0].players[10];
p.pos.set(41 * dir, 0, -3);
p.facing = dir === 1 ? 0 : Math.PI;
p.vel.set(0, 0, 0);
p.cooldown = 0; p.ballLock = 0;
m.sides.forEach((sd) => sd.players.forEach((q) => (q.hasBall = false)));
p.hasBall = true;
m.ball.owner = { teamIdx: 0, playerIdx: p.idx };
m.ball.pos.set((41 + 0.6) * dir, 0.11, -3);
m.ball.vel.set(0, 0, 0);
const gk = m.sides[1].players[0];
gk.pos.set(52 * dir, 0, 0);
gk.cooldown = 0;
gk.setState('idle');

console.log('shooter:', p.data.name, 'shooting:', p.data.attrs.shooting, 'dir:', dir);
const ok = m.shoot(p, 0.6, -1);
console.log('shoot ok:', ok, 'ball vel:', m.ball.vel.toArray().map((v) => v.toFixed(1)).join(','));

for (let f = 0; f < 90; f++) {
  ai.step(dt, [null, null]);
  m.step(dt);
  if (f % 5 === 0 || m.phase !== 'play') {
    const b = m.ball.pos;
    console.log(
      `f${f} ball=(${b.x.toFixed(1)},${b.y.toFixed(2)},${b.z.toFixed(1)}) spd=${m.ball.speed.toFixed(1)} owner=${m.ball.owner ? m.sides[m.ball.owner.teamIdx].players[m.ball.owner.playerIdx].data.name : '-'} gk=(${gk.pos.x.toFixed(1)},${gk.pos.z.toFixed(1)}) gkState=${gk.state} phase=${m.phase} ev=${m.events.slice(-1)[0]?.type}`,
    );
  }
  if (m.phase !== 'play') break;
}
console.log('score', m.sides[0].score, '-', m.sides[1].score);
