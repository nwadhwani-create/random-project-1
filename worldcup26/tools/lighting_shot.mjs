// Screenshot each lighting preset for visual verification.
import puppeteer from 'puppeteer-core';

const preset = process.argv[2] ?? 'night';
const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1600,900', '--mute-audio'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.evaluate((p) => localStorage.setItem('wc26-settings', JSON.stringify({ difficulty: 'amateur', halfMinutes: 3, lighting: p, sound: false })), preset);
await page.reload({ waitUntil: 'networkidle0' });
await page.click('[data-act="quick"]');
await page.waitForSelector('.team-grid');
await page.click('[data-team="Spain"]');
await new Promise((r) => setTimeout(r, 200));
await page.click('[data-team="Panama"]');
await page.waitForSelector('.lineup-table');
await page.click('[data-act="ko"]');
await page.waitForSelector('.scoreboard');
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: `/tmp/lighting_${preset}.png` });
console.log(`saved /tmp/lighting_${preset}.png`);
await browser.close();
