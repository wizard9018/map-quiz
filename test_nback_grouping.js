const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html');
    await page.locator('#level-select').selectOption('4');
    const button = page.getByRole('button', { name: '开始 2-Back' });
    await button.waitFor();
    await page.clock.runFor(60000);
    assert.equal(await page.locator('#timer-badge').innerText(), '等待开始');
    assert.equal(await page.locator('.active-lit').count(), 0);
    assert.equal(await page.locator('.heart.active').count(), 3);
    await button.click();
    assert.equal(await page.locator('.nback-transition-notice').count(), 0);
    assert.match(await page.locator('#nback-step-counter').innerText(), /1\/2 项/);
    const grid = await page.locator('#nback-grid-matrix').boundingBox();
    await page.clock.runFor(1320);
    assert.equal(await page.locator('.active-lit').count(), 0);
    await page.clock.runFor(359);
    assert.equal(await page.locator('.active-lit').count(), 0);
    await page.clock.runFor(1);
    assert.match(await page.locator('#nback-step-counter').innerText(), /2\/2 项/);
    await page.clock.runFor(1320);
    assert.match(await page.locator('#nback-step-counter').innerText(), /停顿/);
    assert.equal(await page.locator('#btn-nback-match').isDisabled(), true);
    assert.deepEqual(await page.locator('#nback-grid-matrix').boundingBox(), grid);
    await page.clock.runFor(1199);
    assert.equal(await page.locator('.active-lit').count(), 0);
    await page.clock.runFor(1);
    assert.match(await page.locator('#nback-step-counter').innerText(), /第 2 组/);
    assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
    assert.deepEqual(await page.locator('#nback-grid-matrix').boundingBox(), grid);
    await page.locator('#level-select').selectOption('3');
    await page.clock.runFor(300);
    const history = [];
    for (let step = 0; step < 10; step++) {
      const cell = page.locator('.active-lit');
      const current = { pos: await cell.getAttribute('data-pos'), icon: await cell.innerText() };
      const previous = history[history.length - 1];
      const match = previous && previous.pos === current.pos && previous.icon === current.icon;
      history.push(current);
      if (match) await page.locator('#btn-nback-match').click();
      await page.clock.runFor((match ? 200 : 1390) + 360);
    }
    await page.clock.runFor(1000);
    assert.equal(await button.isVisible(), true, 'Natural L3 completion must require confirmation');
    await page.clock.runFor(60000);
    assert.equal(await page.locator('#timer-badge').innerText(), '等待开始');
    console.log('2-Back confirmation, paused timer, 360ms intra-group and 1200ms inter-group gaps passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
