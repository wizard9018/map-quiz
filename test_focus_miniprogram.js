const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({
      contentType: 'application/javascript',
      body: 'window.results=[]; window.wx={miniProgram:{postMessage:function(message){window.results.push(message.data)}}};'
    }));
    await page.goto((process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html') + '?game=nback_flow&miniprogram=1&uid=test');
    await page.waitForFunction(() => window.wx && window.wx.miniProgram);
    assert.equal(await page.locator('.top-toolbar').isVisible(), false);
    const phone = await page.locator('#phone-container').boundingBox();
    assert.equal(phone.y, 0);
    assert.equal(phone.height, 844);
    assert.equal(await page.locator('.nback-grid-cell').count(), 9);
    await page.locator('#btn-test-fail').click();
    const report = await page.evaluate(() => window.results[0]);
    assert.equal(report.type, 'GAME_FINISH');
    assert.equal(report.gameId, 'nback_flow');
    assert.equal(report.uid, 'test');
    assert.equal(typeof report.score, 'number');
    console.log('Mini program viewport, grid and result bridge checks passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
