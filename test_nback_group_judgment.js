const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const random of [0.1, 0.9]) {
      for (const level of [4, 7, 10]) {
        const n = Math.ceil(level / 3);
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await page.addInitScript(value => { Math.random = () => value; }, random);
        await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html');
        await page.locator('#level-select').selectOption(String(level));
        await page.clock.runFor(60000);
        assert.equal(await page.locator('#timer-badge').innerText(), '等待开始');
        await page.getByRole('button', { name: `开始 ${n}-Back` }).click();
        const groupDuration = n * 1500 + (n - 1) * 180;
        await page.clock.runFor(groupDuration + 1200);
        const button = page.locator('#btn-nback-match');
        for (let item = 0; item < n; item++) {
          assert.equal(await button.isDisabled(), true, 'No answers while group items are displaying');
          await page.keyboard.press('Space');
          assert.equal(await page.locator('.heart.active').count(), 3);
          await page.clock.runFor(1500);
          if (item < n - 1) await page.clock.runFor(180);
        }
        assert.equal(await button.isEnabled(), true, 'Answer only after all group items finish');
        assert.equal(await page.locator('.active-lit').count(), 0);
        const grid = await page.locator('#nback-grid-matrix').boundingBox();
        await button.click();
        assert.equal(await page.locator('.heart.active').count(), random === 0.1 ? 3 : 2,
          'One different item makes the whole group different');
        assert.deepEqual(await page.locator('#nback-grid-matrix').boundingBox(), grid);
        await page.close();
      }
    }
    console.log('Whole-group judgment, presentation lockout and partial mismatch checks passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
