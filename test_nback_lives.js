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
      await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html?game=nback_flow&miniprogram=1');
      await page.locator('#level-select').selectOption('4', { force: true });
      await page.getByRole('button', { name: '继续', exact: true }).click();
      assert.equal(await page.locator('#timer-badge').isVisible(), false, 'N-Back has no level countdown');
      let firstItem = await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText }));
      const initialGrid = await page.locator('#nback-grid-matrix').boundingBox();

      for (let mistake = 1; mistake <= 3; mistake++) {
        const groups = [];
        for (let group = 0; group < 2; group++) {
          const items = [];
          for (let item = 0; item < 2; item++) {
            items.push(await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText })));
            await page.clock.runFor(375 + (item === 0 ? 180 : group === 0 ? 2000 : 0));
          }
          groups.push(items);
        }
        assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
        await page.clock.runFor(60000);
        assert.equal(await page.locator('.heart.active').count(), 4 - mistake);
        await page.locator(JSON.stringify(groups[0]) === JSON.stringify(groups[1]) ? '#btn-nback-different' : '#btn-nback-match').click();
        assert.equal(await page.locator('.heart.active').count(), 3 - mistake);
        assert.equal(await page.locator('#report-modal').isVisible(), mistake === 3);
        if (mistake < 3) {
          assert.match(await page.locator('#nback-step-counter').innerText(), /第 1 组/);
          assert.equal(await page.locator('#btn-nback-match').isDisabled(), true);
          assert.match(await page.locator('#level-badge').innerText(), /L4/);
          const notice = page.locator('.nback-error-notice');
          assert.equal(await notice.isVisible(), true);
          assert.match(await notice.innerText(), /本轮重新开始，要认真对待哦/);
          assert.equal(await notice.locator('button').count(), 0);
          await page.keyboard.press('Space');
          await page.clock.runFor(1999);
          assert.equal(await page.locator('.active-lit').count(), 0);
          assert.equal(await notice.isVisible(), true);
          await page.clock.runFor(1);
          assert.equal(await notice.count(), 0);
          assert.equal(await page.locator('.active-lit').count(), 1);
          const newFirstItem = await page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText }));
          assert.notDeepEqual(newFirstItem, firstItem, 'Restart must display a different first group');
          firstItem = newFirstItem;
          assert.deepEqual(await page.locator('#nback-grid-matrix').boundingBox(), initialGrid);

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
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html?game=nback_flow&miniprogram=1');
    await page.getByRole('button', { name: '继续', exact: true }).click();
    const readItem = () => page.locator('.active-lit').evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText }));
    for (let mistake = 0; mistake < 2; mistake++) {
      if (mistake > 0) await page.clock.runFor(2000);
      const previous = await readItem();
      await page.clock.runFor(2375);
      const current = await readItem();
      await page.clock.runFor(375);
      await page.locator(JSON.stringify(previous) === JSON.stringify(current) ? '#btn-nback-different' : '#btn-nback-match').click();
    }
    assert.equal(await page.locator('.heart.active').count(), 1);
    await page.clock.runFor(2000);
    let previous = await readItem();
    await page.clock.runFor(2375);
    for (let judgment = 0; judgment < 8; judgment++) {
      const current = await readItem();
      await page.clock.runFor(375);
      await page.locator(JSON.stringify(previous) === JSON.stringify(current) ? '#btn-nback-match' : '#btn-nback-different').click();
      previous = current;
      await page.clock.runFor(2000);
    }
    await page.clock.runFor(1000);
    assert.equal(await page.locator('.heart.active').count(), 3);
    assert.match(await page.locator('#level-badge').innerText(), /L2/);
    assert.equal(await page.locator('#timer-badge').isVisible(), false);
    await page.locator('#game-select').selectOption('schulte_ladder', { force: true });
    assert.equal(await page.locator('#timer-badge').isVisible(), true, 'Other games retain their timers');
    console.log('No countdown, restart from first group, third-error failure and level-up heart refill passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
