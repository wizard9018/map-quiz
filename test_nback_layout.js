const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 390, 1280]) {
      for (let level = 1; level <= 12; level++) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto('http://127.0.0.1:8080/focus.html?game=nback_flow');
      await page.locator('#level-select').selectOption(String(level));
      const n = Math.ceil(level / 3);
      await page.getByRole('button', { name: '继续', exact: true }).click();
      const grid = page.locator('#nback-grid-matrix');
      await grid.waitFor();
      const size = 3 + (level - 1) % 3;
      assert.equal(await page.locator('.nback-grid-cell').count(), size * size);
      const cell = await page.locator('.nback-grid-cell').first().boundingBox();
      assert.ok(Math.abs(cell.width - cell.height) < 0.1, 'Cells must stay square');
      const initial = await grid.boundingBox();

      const before = await grid.boundingBox();
      assert.deepEqual(before, initial, 'Grid must stay fixed when observation starts');
      await page.clock.runFor(n === 1 ? 2760 : 2 * (n * (level >= 7 ? 750 : 375) + (n - 1) * 180) + 2000 + 10);
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



