const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await page.goto('http://127.0.0.1:8080/focus.html?game=nback_flow');
    const ids = await page.locator('#game-select option').evaluateAll(nodes => nodes.map(node => node.value));
    for (const id of ids) {
      await page.locator('#game-select').selectOption(id);
      await page.locator('#btn-test-level-up').click();
      assert.match(await page.locator('#level-badge').innerText(), /L2/);
      assert.equal(await page.locator('#game-controls button').count(), 2);
      await page.getByRole('button', {name: '继续', exact: true}).click();
      await page.locator('#btn-test-level-up').click();
      await page.clock.runFor(60000);
      assert.match(await page.locator('#level-badge').innerText(), /L3/);
      assert.equal(await page.locator('#game-controls button').count(), 2, 'Old game timers cannot resume');
      assert.equal(await page.locator('.heart.active').count(), 3);
      const max = id === 'nback_flow' || id === 'sequence_order' ? 12 : id === 'matrix_flash' ? 15 : ['ufov_dual_field', 'cambridge_decoder'].includes(id) ? 14 : 10;
      await page.locator('#level-select').selectOption(String(max));
      await page.locator('#btn-test-level-up').click();
      assert.match(await page.locator('#level-badge').innerText(), new RegExp('L' + max + '$'));
    }
    await page.locator('#game-select').selectOption('nback_flow');
    await page.getByRole('button', {name: '继续', exact: true}).click();
    const read = () => page.locator('.active-lit').evaluate(cell => ({pos: cell.dataset.pos, icon: cell.textContent}));
    let previous = await read();
    await page.clock.runFor(374); assert.equal(await page.locator('.active-lit').count(), 1);
    await page.clock.runFor(1); assert.equal(await page.locator('.active-lit').count(), 0);
    for (let gap = 0; gap < 8; gap++) {
      const flying = gap % 2 === 0;
      assert.equal(await page.locator('.nback-flying-picture').count(), flying ? 1 : 0);
      assert.equal(await page.locator('.nback-empty-flip').count(), flying ? 0 : 1);
      assert(await page.locator('.nback-grid-cell').evaluateAll(cells => cells.every(cell => !cell.textContent)));
      await page.clock.runFor(2000);
      assert.equal(await page.locator('.nback-empty-flip,.nback-flying-picture').count(), 0);
      const current = await read();
      await page.clock.runFor(375);
      await page.locator(JSON.stringify(previous) === JSON.stringify(current) ? '#btn-nback-match' : '#btn-nback-different').click();
      previous = current;
    }
    // Skip during the delayed natural promotion; only one level is entered.
    await page.locator('#btn-test-level-up').click(); await page.clock.runFor(1000);
    assert.match(await page.locator('#level-badge').innerText(), /L2/);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('20 games test-upgrade, active timer cancellation, max levels, 375ms exposure and alternating blank/flying distractions passed');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
