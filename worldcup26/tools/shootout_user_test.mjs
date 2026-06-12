// Drives a REAL user-controlled penalty shootout via keyboard and verifies
// alternation, per-kick scoring, and final penScores consistency.
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1280,800', '--mute-audio'],
  defaultViewport: { width: 1280, height: 800 },
  protocolTimeout: 600000,
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('wc26-settings', JSON.stringify({ difficulty: 'amateur', halfMinutes: 5, lighting: 'day', sound: false })));
await page.reload({ waitUntil: 'networkidle0' });
await page.click('[data-act="pens"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="Brazil"]');
await new Promise((r) => setTimeout(r, 200));
await page.click('[data-team="Panama"]');
await new Promise((r) => setTimeout(r, 400));
const ko = await page.$('[data-act="ko"]');
if (ko) await ko.click();
await page.waitForSelector('.scoreboard');
await new Promise((r) => setTimeout(r, 1500));

const snap = () => page.evaluate(() => {
  const m = window.__session.match;
  return {
    phase: m.phase, restartTeam: m.restartTeam, restart: m.restart,
    kicker: m.shootoutKicker, done: m.shootoutDone,
    a: m.shootoutScores[0].slice(), b: m.shootoutScores[1].slice(),
  };
});

const log = [];
let guard = 0;
let lastTaken = 0;
let stale = 0;
while (guard++ < 400) {
  const s = await snap();
  const taken = s.a.length + s.b.length;
  if (s.done) { log.push(`DONE a=[${s.a}] b=[${s.b}] kicker_seq_complete`); break; }
  if (s.phase === 'set-piece' && s.restartTeam === 0 && s.restart === 'penalty') {
    // user's turn
    await page.keyboard.down('KeyA');
    await new Promise((r) => setTimeout(r, 600));
    await page.keyboard.up('KeyA');
    let w = 0;
    while (w++ < 80) {
      await new Promise((r) => setTimeout(r, 150));
      const t = await snap();
      if (t.a.length + t.b.length !== taken || t.done) {
        log.push(`USER(BRA) kick -> a=[${t.a}] b=[${t.b}] nextKicker=${t.kicker} done=${t.done}`);
        break;
      }
    }
  } else {
    // AI (Panama) turn — wait for it to resolve
    await new Promise((r) => setTimeout(r, 500));
    const t = await snap();
    if (t.a.length + t.b.length !== taken) {
      log.push(`AI(PAN)  kick -> a=[${t.a}] b=[${t.b}] nextKicker=${t.kicker} done=${t.done}`);
    }
  }
  // stall detection
  const s2 = await snap();
  const taken2 = s2.a.length + s2.b.length;
  if (taken2 === lastTaken) { stale++; } else { stale = 0; lastTaken = taken2; }
  if (stale > 40) { log.push(`STALLED at a=[${s2.a}] b=[${s2.b}] phase=${s2.phase} restartTeam=${s2.restartTeam} kicker=${s2.kicker}`); break; }
}

const final = await page.evaluate(() => {
  const m = window.__session.match;
  const sum = (x) => x.reduce((a, c) => a + c, 0);
  return {
    a: m.shootoutScores[0], b: m.shootoutScores[1],
    penA: sum(m.shootoutScores[0]), penB: sum(m.shootoutScores[1]),
    winner: m.winner, done: m.shootoutDone,
    boardText: document.querySelector('.shootout-board')?.textContent ?? null,
  };
});
console.log(log.join('\n'));
console.log('FINAL', JSON.stringify(final));
console.log('errors:', errs.length ? errs.join('; ') : 'none');

// assertions: both teams actually take kicks (alternation), the shootout
// terminates with a winner, and that winner matches the penalty totals.
const ok =
  final.done &&
  final.a.length > 0 && final.b.length > 0 &&
  Math.abs(final.a.length - final.b.length) <= 1 &&
  final.winner === (final.penA > final.penB ? 0 : 1) &&
  errs.length === 0;
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
