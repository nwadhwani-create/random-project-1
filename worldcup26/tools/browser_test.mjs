// E2E browser test via puppeteer-core + system Chrome.
// Verifies: menu flow, match start, power gauge while holding A, shooting, rendering FPS.
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1600,900', '--mute-audio'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.waitForSelector('.menu-buttons');
console.log('menu OK');

// set difficulty amateur
await page.select('#set-diff', 'amateur');
await page.click('[data-act="quick"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="Spain"]');
await new Promise((r) => setTimeout(r, 300));
await page.click('[data-team="Panama"]');
await new Promise((r) => setTimeout(r, 300));
const state = await page.evaluate(() => ({
  picked: [...document.querySelectorAll('.picked-home,.picked-away')].map((e) => e.dataset.team),
  hasLineups: !!document.querySelector('.lineup-table'),
}));
console.log('after picks:', JSON.stringify(state));
await page.waitForSelector('.lineup-table');
console.log('lineups OK');
await page.click('[data-act="ko"]');
try {
  await page.waitForSelector('.scoreboard', { timeout: 20000 });
} catch (e) {
  console.log('SCOREBOARD TIMEOUT — page errors so far:', errors);
  await page.screenshot({ path: '/tmp/browser_test_fail.png' });
  await browser.close();
  process.exit(1);
}
console.log('match started');

// wait for kickoff set-piece, then take it with S
await new Promise((r) => setTimeout(r, 2500));
await page.keyboard.press('KeyS');
await new Promise((r) => setTimeout(r, 800));

// hold A and check power gauge appears
await page.keyboard.down('KeyA');
await new Promise((r) => setTimeout(r, 600));
const gauge = await page.evaluate(() => {
  const wrap = document.querySelector('.power-wrap');
  const bar = document.querySelector('.power-bar');
  const s = window.__session;
  return {
    hidden: wrap?.classList.contains('hidden'),
    width: bar?.style.width,
    charging: s?.users?.[0]?.charging,
    charge: s?.users?.[0]?.shotCharge,
    phase: s?.match?.phase,
    controlled: s?.users?.[0]?.controlled?.data?.name,
    hasBall: s?.users?.[0]?.controlled?.hasBall,
  };
});
console.log('gauge state while holding A:', JSON.stringify(gauge));
await page.keyboard.up('KeyA');

if (gauge.hidden || !gauge.charging) {
  console.log('FAIL: power gauge not showing');
} else {
  console.log('GAUGE OK');
}

// move right for a while, measure fps
await page.keyboard.down('ArrowRight');
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const tick = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else resolve(frames / 3); };
  requestAnimationFrame(tick);
}));
await page.keyboard.up('ArrowRight');
console.log('fps (headless swiftshader):', Math.round(fps));

// force a shot situation: teleport controlled player with ball near goal and shoot
const shot = await page.evaluate(() => {
  const s = window.__session;
  const u = s.users[0];
  const m = s.match;
  if (m.phase !== 'play') return { skipped: m.phase };
  const p = u.controlled;
  // give the player the ball near the right goal
  const dir = m.sides[0].attackDir;
  p.pos.set(40 * dir, 0, 2);
  m.ball.owner = { teamIdx: 0, playerIdx: p.idx };
  p.hasBall = true;
  m.ball.pos.set(40 * dir + 0.5, 0.11, 2);
  const before = m.sides[0].stats.shots;
  m.shoot(p, 0.7, 0);
  return { shotRegistered: m.sides[0].stats.shots === before + 1, ballSpeed: m.ball.vel.length().toFixed(1) };
});
console.log('forced shot:', JSON.stringify(shot));

// let it play out, see if goal or save occurs
await new Promise((r) => setTimeout(r, 3500));
const after = await page.evaluate(() => {
  const m = window.__session.match;
  return { score: [m.sides[0].score, m.sides[1].score], phase: m.phase, events: m.events.slice(-6).map((e) => e.type) };
});
console.log('after shot:', JSON.stringify(after));

// force a guaranteed goal: place ball just outside the line moving in, no GK nearby
const goalTest = await page.evaluate(() => {
  const m = window.__session.match;
  if (m.phase !== 'play') {
    // wait for restart to finish by fast-forwarding sim
    for (let i = 0; i < 60 * 12 && m.phase !== 'play'; i++) m.step(1 / 60);
  }
  if (m.phase !== 'play') return { skipped: m.phase };
  const dir = m.sides[0].attackDir;
  // move GK away
  const gk = m.sides[1].players[0];
  gk.pos.set(30 * dir, 0, 20);
  m.ball.owner = null;
  m.sides[0].players.forEach((p) => (p.hasBall = false));
  m.ball.pos.set(50 * dir, 0.5, 0);
  m.ball.vel.set(18 * dir, 0, 0);
  m.ball.touch(0, 10, m.clock);
  for (let i = 0; i < 240 && m.phase === 'play'; i++) m.step(1 / 60);
  return { phase: m.phase, score: [m.sides[0].score, m.sides[1].score], scorers: m.scorers.map((s) => s.name) };
});
console.log('forced goal:', JSON.stringify(goalTest));

// goal celebration should trigger auto replay within a few seconds
await new Promise((r) => setTimeout(r, 4000));
const replayState = await page.evaluate(() => ({
  replayTagVisible: !document.querySelector('.replay-tag')?.classList.contains('hidden'),
  score: document.querySelector('.sb-score')?.textContent,
}));
console.log('replay state:', JSON.stringify(replayState));

await page.screenshot({ path: '/tmp/browser_test.png' });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
