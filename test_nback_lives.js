const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const random of [0.9, 0.1]) {
      const page = await browser.newPage();
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.addInitScript(value => { Math.random = () => value; }, random);
      await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html');
      await page.locator('#level-select').selectOption('4');
      await page.getByRole('button', { name: '开始 2-Back' }).click();
      assert.equal(await page.locator('#timer-badge').isVisible(), false, 'N-Back has no level countdown');
      let firstItem = await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText }));
      const initialGrid = await page.locator('#nback-grid-matrix').boundingBox();
      await page.clock.runFor(7560);
      for (let mistake = 1; mistake <= 3; mistake++) {
        assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
        if (random === 0.9) await page.locator('#btn-nback-match').click();
        else await page.clock.runFor(1500);
        assert.equal(await page.locator('.heart.active').count(), 3 - mistake);
        assert.equal(await page.locator('#report-modal').isVisible(), mistake === 3);
        if (mistake < 3) {
          assert.match(await page.locator('#nback-step-counter').innerText(), /第 1 组/);
          assert.equal(await page.locator('#btn-nback-match').isDisabled(), true);
          assert.match(await page.locator('#level-badge').innerText(), /L4/);
          await page.clock.runFor(300);
          assert.equal(await page.locator('.active-lit').count(), 1);
          const newFirstItem = await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText }));
          assert.notDeepEqual(newFirstItem, firstItem, 'Restart must display a different first group');
          firstItem = newFirstItem;
          assert.deepEqual(await page.locator('#nback-grid-matrix').boundingBox(), initialGrid);
          await page.clock.runFor(7560);
        }
      }
      await page.clock.runFor(10000);
      assert.equal(await page.locator('#report-modal').isVisible(), true);
      assert.equal(await page.locator('.heart.active').count(), 0);
      await page.close();
    }
    // Two errors followed by a successful level must restore three hearts on promotion.
    const page = await browser.newPage();
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.addInitScript(() => { Math.random = () => 0.9; });
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html');
    await page.clock.runFor(2160);
    await page.locator('#btn-nback-match').click();
    await page.clock.runFor(2160);
    await page.locator('#btn-nback-match').click();
    assert.equal(await page.locator('.heart.active').count(), 1);
    await page.clock.runFor(300 + 10 * 1860);
    await page.clock.runFor(1000);
    assert.equal(await page.locator('.heart.active').count(), 3);
    assert.match(await page.locator('#level-badge').innerText(), /L2/);
    assert.equal(await page.locator('#timer-badge').isVisible(), false);
    await page.locator('#game-select').selectOption('schulte_classic');
    assert.equal(await page.locator('#timer-badge').isVisible(), true, 'Other games retain their timers');
    console.log('No countdown, restart from first group, third-error failure and level-up heart refill passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
