const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const batch = require('./focus-batch-games');
const next = require('./focus-next-games');
const ids = ['nback_flow', 'matrix_flash', 'sequence_order', ...batch.definitions.map(([id]) => id), ...next.definitions.map(([id]) => id)];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({body: ''}));
    await page.goto('http://127.0.0.1:8080/focus.html?game=matrix_flash&miniprogram=1');
    for (const id of ids) {
      await page.locator('#game-select').evaluate((select, value) => {select.value = value; select.dispatchEvent(new Event('change'));}, id);
      const maximum = id === 'nback_flow' || id === 'sequence_order' ? 12 : id === 'matrix_flash' ? 15 : ['ufov_dual_field', 'cambridge_decoder'].includes(id) ? 14 : 10;
      for (let level = 2; level <= maximum; level++) {
        await page.locator('#level-select').evaluate((select, value) => {select.value = String(value); select.dispatchEvent(new Event('change'));}, level);
        assert.equal(await page.locator('#game-controls button').count(), 2);
        const panel = page.locator(id === 'nback_flow' ? '.nback-transition-notice' : '.level-change-panel');
        const text = await panel.innerText();
        assert(!/undefined|NaN/.test(text), `${id} L${level}: readable values`);
        assert(text.includes('→') || text.includes('参数与上一关相同'), `${id} L${level}: differences or unchanged explanation`);
        await page.clock.runFor(60000);
        assert.equal(await page.locator('.heart.active').count(), 3);
        assert.equal(await panel.isVisible(), true);
        assert.equal(await page.locator('.active-lit').count(), 0);
        if (id === 'bimodal_divert') {
          assert.equal(await panel.locator('.bimodal-color-preview').count(), level < 6 ? 2 : 3);
          assert.equal(await panel.locator('.batch-audio-tools button').count(), 2);
        }
        if (level === 2 && id !== 'nback_flow') await page.screenshot({path: `scratch/upgrade-${id}.png`});
        await page.getByRole('button', {name: '继续', exact: true}).click();
        assert.equal(await panel.count(), 0);
        await page.clock.runFor(1);
        assert.equal(await page.locator('.heart.active').count(), 3);
      }
      await page.locator('#level-select').evaluate(select => {select.value = '2'; select.dispatchEvent(new Event('change'));});
      await page.getByRole('button', {name: '退出', exact: true}).click();
      assert.equal(await page.locator('#focus-home').isVisible(), true);
      await page.clock.runFor(60000);
      assert.equal(await page.locator('.heart.active').count(), 3);
      console.log(`${id}: all promotion gates, continue and exit passed`);
    }
    assert.deepEqual(errors, []);
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
