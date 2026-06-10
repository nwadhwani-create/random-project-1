// Measures user shot conversion through the REAL input chain:
// places the controlled player in the box with the ball, then sends actual
// keyboard events (hold A ~0.45s, release) and counts outcomes.
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1600,900', '--mute-audio'],
  defaultViewport: { width: 1600, height: 900 },
  protocolTimeout: 360000,
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('wc26-settings', JSON.stringify({ difficulty: 'amateur', halfMinutes: 10, lighting: 'day', sound: false })));
await page.reload({ waitUntil: 'networkidle0' });
await page.click('[data-act="quick"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="Spain"]');
await new Promise((r) => setTimeout(r, 200));
await page.click('[data-team="Panama"]');
await page.waitForSelector('.lineup-table');
await page.click('[data-act="ko"]');
await page.waitForSelector('.scoreboard');
await new Promise((r) => setTimeout(r, 3000));

let goals = 0, saves = 0, noShot = 0, out = 0, other = 0;
const N = 14;
for (let i = 0; i < N; i++) {
  process.stdout.write(`attempt ${i}... `);
  // dismiss any overlay (half time)
  await page.evaluate(() => document.querySelector('.overlay button')?.click());
  // wait for open play
  await page.evaluate(async () => {
    const m = window.__session.match;
    let guard = 0;
    while (m.phase !== 'play' && guard++ < 200) await new Promise((r) => setTimeout(r, 50));
  });
  // teleport controlled player into the box with the ball
  const setup = await page.evaluate(() => {
    const s = window.__session;
    const m = s.match;
    const u = s.users[0];
    u.autoPick();
    const p = u.controlled;
    if (!p) return false;
    const dir = m.sides[0].attackDir;
    p.pos.set(41 * dir, 0, -3);
    p.facing = dir === 1 ? 0 : Math.PI;
    p.vel.set(0, 0, 0);
    p.cooldown = 0;
    p.ballLock = 0;
    p.setState('idle');
    m.sides.forEach((sd) => sd.players.forEach((q) => (q.hasBall = false)));
    p.hasBall = true;
    m.ball.owner = { teamIdx: 0, playerIdx: p.idx };
    m.ball.pos.set(41 * dir + 0.6 * dir, 0.11, -3);
    m.ball.vel.set(0, 0, 0);
    // GK back on his line
    const gk = m.sides[1].players[0];
    gk.pos.set(52 * dir, 0, 0);
    gk.setState('idle');
    gk.cooldown = 0;
    return { phase: m.phase, score0: m.sides[0].score, shots: m.sides[0].stats.shots };
  });
  if (!setup) { other++; continue; }
  // real key press: hold A 450ms with Up aim
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('KeyA');
  await new Promise((r) => setTimeout(r, 450));
  await page.keyboard.up('KeyA');
  await page.keyboard.up('ArrowUp');
  await new Promise((r) => setTimeout(r, 2200));
  const result = await page.evaluate((before) => {
    const m = window.__session.match;
    return {
      score0: m.sides[0].score,
      shots: m.sides[0].stats.shots,
      phase: m.phase,
      restart: m.restart,
      lastEvents: m.events.slice(-4).map((e) => e.type),
    };
  }, setup);
  if (result.score0 > setup.score0) goals++;
  else if (result.shots === setup.shots) { noShot++; console.log(`  attempt ${i}: NO SHOT — events: ${result.lastEvents.join(',')} phase=${result.phase}`); }
  else if (result.lastEvents.includes('save')) saves++;
  else if (result.restart === 'goal-kick' || result.restart === 'corner') out++;
  else { other++; console.log(`  attempt ${i}: other — ${JSON.stringify(result)}`); }
}
console.log(`\nconversion over ${N} box shots: goals=${goals} saves=${saves} wide/out=${out} noShot=${noShot} other=${other}`);
await browser.close();
