// Measures how long the GOAL!/text banner stays visible during a shootout.
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1280,800', '--mute-audio'],
  defaultViewport: { width: 1280, height: 800 },
  protocolTimeout: 600000,
});
const page = await browser.newPage();
page.on('console', (m) => { const t = m.text(); if (t.includes('BANNERDBG')) console.log('  >', t); });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('wc26-settings', JSON.stringify({ difficulty: 'amateur', halfMinutes: 5, lighting: 'day', sound: false })));
await page.reload({ waitUntil: 'networkidle0' });
await page.click('[data-act="pens"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="Brazil"]');
await new Promise((r) => setTimeout(r, 150));
await page.click('[data-team="Panama"]');
await new Promise((r) => setTimeout(r, 300));
const ko = await page.$('[data-act="ko"]');
if (ko) await ko.click();
await page.waitForSelector('.scoreboard');

// Poll banner visibility every 100ms for ~40s while auto-driving user kicks.
const samples = [];
const start = Date.now();
let kicked = 0;
const poll = setInterval(async () => {
  try {
    const st = await page.evaluate(() => {
      const m = window.__session.match;
      const b = document.querySelector('.banner');
      return {
        text: b && !b.classList.contains('hidden') ? b.textContent : null,
        gt: m.elapsed,
        phase: m.phase, restartTeam: m.restartTeam, restart: m.restart,
        kicker: m.shootoutKicker, done: m.shootoutDone,
        a: m.shootoutScores[0].length, b: m.shootoutScores[1].length,
      };
    });
    samples.push({ t: ((Date.now() - start) / 1000).toFixed(1), ...st });
  } catch {}
}, 100);

// drive user kicks
let guard = 0;
while (guard++ < 120) {
  const s = await page.evaluate(() => {
    const m = window.__session.match;
    return { phase: m.phase, rt: m.restartTeam, restart: m.restart, done: m.shootoutDone };
  });
  if (s.done) break;
  if (s.phase === 'set-piece' && s.rt === 0 && s.restart === 'penalty') {
    await page.keyboard.down('KeyA');
    await new Promise((r) => setTimeout(r, 600));
    await page.keyboard.up('KeyA');
    kicked++;
    await new Promise((r) => setTimeout(r, 4500));
  } else {
    await new Promise((r) => setTimeout(r, 400));
  }
}
clearInterval(poll);

// Analyze: find contiguous runs where text === 'GOAL!' and measure duration
// in GAME-TIME (gt), which is what matters on real hardware (headless runs in
// slow motion, so wall-clock is meaningless here).
let runs = [];
let cur = null;
for (const s of samples) {
  const isGoal = s.text === 'GOAL!';
  if (isGoal && !cur) cur = { start: s.gt, end: s.gt };
  else if (isGoal && cur) cur.end = s.gt;
  else if (!isGoal && cur) { runs.push(cur); cur = null; }
}
if (cur) runs.push(cur);
console.log('user kicks taken:', kicked);
const seen = [...new Set(samples.map((s) => s.text).filter(Boolean))];
console.log('banner texts seen:', JSON.stringify(seen));
// also report runs for ANY banner text (e.g. set-piece prompts) to catch lingering
let anyRuns = []; let acur = null;
for (const s of samples) {
  if (s.text && !acur) acur = { text: s.text, start: Number(s.t), end: Number(s.t) };
  else if (s.text && acur) { if (s.text !== acur.text) { anyRuns.push(acur); acur = { text: s.text, start: Number(s.t), end: Number(s.t) }; } else acur.end = Number(s.t); }
  else if (!s.text && acur) { anyRuns.push(acur); acur = null; }
}
if (acur) anyRuns.push(acur);
console.log('all banner runs:', anyRuns.map((r) => `"${r.text}" ${r.start}-${r.end} (${(r.end - r.start).toFixed(1)}s)`).join(' | ') || 'none');
console.log('GOAL! banner visible runs (s):', runs.map((r) => `${r.start}-${r.end} (${(r.end - r.start).toFixed(1)}s)`).join(', ') || 'none');
const maxDur = runs.reduce((mx, r) => Math.max(mx, r.end - r.start), 0);
console.log('GOAL! banner GAME-TIME durations:', runs.map((r) => `${(r.end - r.start).toFixed(2)}s`).join(', ') || 'none');
console.log('longest GOAL! banner GAME-TIME duration:', maxDur.toFixed(2), 's');
// The next penalty taker auto-steps up at 2.2s game-time, so the banner must clear
// before then (and stay long enough to read). 0.3s..2.0s is the acceptable window.
console.log(maxDur < 2.0 ? 'PASS (banner clears before the next kick, game-time)' : 'FAIL (banner lingers into next kick)');
await browser.close();
