const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 390, 1280]) {
      for (const level of [1, 4, 8]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto('http://127.0.0.1:8080/focus.html');
      await page.locator('#level-select').selectOption(String(level));
      const grid = page.locator('#nback-grid-matrix');
      await grid.waitFor();
      const initial = await grid.boundingBox();
      await page.clock.runFor(300);
      const before = await grid.boundingBox();
      assert.deepEqual(before, initial, 'Grid must stay fixed when observation starts');
      const n = level <= 3 ? 1 : level <= 7 ? 2 : 3;
      const duration = Math.max(0.9, 1.6 - level * 0.07);
      await page.clock.runFor(Math.ceil(n * (duration * 1000 + 360)) + 10);
      assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
      const after = await grid.boundingBox();
      console.log(JSON.stringify({ width, level, before, after }));
      assert.deepEqual(after, before, 'Grid must stay fixed when observation ends');
      await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });



