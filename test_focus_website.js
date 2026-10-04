const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({viewport: {width, height: 900}});
      await page.goto('http://127.0.0.1:8080/index.html?tab=focus');
      const frame = page.frameLocator('.focus-frame');
      await frame.getByRole('link', {name: /01 · N-Back/}).click();
      assert.equal(await frame.locator('body.website-view').count(), 1);
      const iframeBounds = await page.locator('.focus-frame').boundingBox();
      assert.equal(iframeBounds.width, width);
      assert.equal(iframeBounds.x, 0);
      assert(Math.abs(iframeBounds.y + iframeBounds.height - 900) < 2);
      const phone = await frame.locator('#phone-container').evaluate(node => {
        const css = getComputedStyle(node), box = node.getBoundingClientRect();
        return {width: box.width, viewport: innerWidth, radius: css.borderRadius, border: css.borderWidth};
      });
      assert.equal(phone.width, phone.viewport);
      assert.equal(phone.radius, '0px'); assert.equal(phone.border, '0px');
      await page.screenshot({path: `scratch/website-focus-${width}.png`});
      const ids = await frame.locator('#game-select option').evaluateAll(nodes => nodes.map(node => node.value));
      for (const id of ids) {
        await frame.locator('#game-select').evaluate((select, value) => {select.value = value; select.dispatchEvent(new Event('change'));}, id);
        await frame.locator('#btn-test-fail').click();
        assert.equal(await frame.locator('#report-modal').isVisible(), false);
        assert.equal(await frame.locator('#focus-home').isVisible(), true);
      }
      assert.equal(await frame.locator('body').evaluate(() => JSON.parse(localStorage.getItem('focus_training_records_v1')).length), 20);
      await page.getByRole('button', {name: 'Geography', exact: true}).click();
      assert.equal(await page.locator('body.focus-tab-view').count(), 0);
      assert((await page.locator('#app').boundingBox()).width <= 1100);
      await page.close();
    }
    const mini = await browser.newPage();
    await mini.route('https://res.wx.qq.com/**', route => route.fulfill({body: ''}));
    await mini.goto('http://127.0.0.1:8080/focus.html?game=nback_flow&miniprogram=1');
    await mini.locator('#btn-test-fail').click();
    assert.equal(await mini.locator('#report-modal').isVisible(), true);
    await mini.close();
    console.log('Website fullscreen at desktop/mobile sizes, 20 no-report endings, saved records, other tabs and mini-program report passed');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
