// E2E test of the tournament mode UI: create tournament, sim all rounds to a champion,
// verify group tables, bracket, top scorers render.
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
await page.evaluate(() => localStorage.removeItem('wc26-tournament'));
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForSelector('.menu-buttons');
await page.click('[data-act="cup"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="United States"]');
await page.waitForSelector('.group-table');
console.log('tournament hub OK');

let guard = 0;
while (guard++ < 12) {
  const st = await page.evaluate(() => ({
    round: document.querySelector('.pick-status')?.textContent,
    hasPlay: !!document.querySelector('[data-act="play"]'),
    hasSimMe: !!document.querySelector('[data-act="simme"]'),
    hasSimRound: !!document.querySelector('[data-act="simround"]'),
    champ: document.querySelector('.champ-banner')?.textContent?.trim(),
  }));
  console.log(`round=${st.round} play=${st.hasPlay} simme=${st.hasSimMe} simround=${st.hasSimRound}${st.champ ? ' CHAMP: ' + st.champ : ''}`);
  if (st.champ) break;
  if (st.hasSimMe) await page.click('[data-act="simme"]');
  else if (st.hasSimRound) await page.click('[data-act="simround"]');
  else { console.log('FAIL: no action button'); break; }
  await new Promise((r) => setTimeout(r, 400));
}

const finalState = await page.evaluate(() => ({
  groups: document.querySelectorAll('.group-table').length,
  koRounds: document.querySelectorAll('.ko-round').length,
  koMatches: document.querySelectorAll('.ko-match').length,
  scorers: document.querySelectorAll('.scorers-panel tr').length,
  groupRowsSample: document.querySelector('.group-table table')?.innerText.replace(/\n/g, ' | ').slice(0, 120),
}));
console.log('final:', JSON.stringify(finalState, null, 1));

// persistence check: start a fresh tournament, play one round, reload mid-tournament
await page.evaluate(() => localStorage.removeItem('wc26-tournament'));
await page.reload({ waitUntil: 'networkidle0' });
await page.click('[data-act="cup"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="France"]');
await page.waitForSelector('.group-table');
await page.click('[data-act="simme"]');
await new Promise((r) => setTimeout(r, 400));
await page.reload({ waitUntil: 'networkidle0' });
const resumeBtn = await page.evaluate(() => document.querySelector('[data-act="cup"]')?.textContent?.trim());
console.log('main menu cup button after reload:', resumeBtn);
await page.click('[data-act="cup"]');
await new Promise((r) => setTimeout(r, 500));
const persisted = await page.evaluate(() => ({
  hub: !!document.querySelector('.group-table'),
  round: document.querySelector('.pick-status')?.textContent,
  franceRowPts: [...document.querySelectorAll('.user-row .gt-pts')].map((e) => e.textContent)[0],
}));
console.log('mid-tournament persistence:', JSON.stringify(persisted));

await page.screenshot({ path: '/tmp/tournament_test.png', fullPage: false });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
