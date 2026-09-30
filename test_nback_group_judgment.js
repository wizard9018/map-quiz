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
        assert.equal(await page.locator('#timer-badge').isVisible(), false);
        await page.getByRole('button', { name: `开始 ${n}-Back` }).click();
        const previous = [];
        const current = [];
        for (let item = 0; item < n; item++) {
          previous.push(await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText })));
          await page.clock.runFor(1500);
          if (item < n - 1) {
            assert.equal(await page.locator('.nback-distraction').count(), 0, 'No distractions inside a group');
            await page.clock.runFor(180);
          } else {
            assert.equal(await page.locator('.nback-distraction').count(), 1);
            await page.waitForFunction(() => { const picture = document.querySelector('.nback-flying-picture'); return picture && picture.complete && picture.naturalWidth > 0; });
            assert.equal(await page.locator('.nback-flying-picture').getAttribute('src'), `assets/distractions/${random === 0.1 ? 'football' : 'umbrella'}.svg`);
            assert.equal(await page.locator('.active-lit').count(), 0);
            assert.equal(await page.locator('#btn-nback-match').isDisabled(), true);
            assert.equal(await page.locator('.nback-grid-cell').evaluateAll(cells => cells.every(cell => cell.innerText === '')), true,
              'Distractions reveal no icons');
            await page.keyboard.press('Space');
            assert.equal(await page.locator('.heart.active').count(), 3);
            await page.clock.runFor(1999);
            assert.equal(await page.locator('.active-lit').count(), 0);
            await page.clock.runFor(1);
            assert.equal(await page.locator('.nback-distraction').count(), 0);
          }
        }
        const button = page.locator('#btn-nback-match');
        for (let item = 0; item < n; item++) {
          current.push(await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText })));
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
        assert.equal(await page.locator('.heart.active').count(), JSON.stringify(previous) === JSON.stringify(current) ? 3 : 2,
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
