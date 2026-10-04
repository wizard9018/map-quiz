const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto('http://127.0.0.1:8080/focus.html?game=tidal_treasures');
    await page.locator('#level-select').selectOption('10');
    await page.getByRole('button', {name: '继续', exact: true}).click();
    await page.waitForFunction(() => [...document.querySelectorAll('.batch-cell img')].every(img => img.complete));
    const icons = await page.locator('.batch-cell img').evaluateAll(images => images.map(img => {
      const box = img.getBoundingClientRect(); const parent = img.parentElement.getBoundingClientRect();
      return {src: img.src, loaded: img.naturalWidth > 0, width: box.width, height: box.height, cellHeight: parent.height};
    }));
    console.log(JSON.stringify(icons));
    assert.equal(icons.length, 13);
    assert(icons.every(img => img.loaded && img.width > 20 && img.height > 20 && img.height <= img.cellHeight), 'All game 4 icons load and have usable dimensions');
    await page.screenshot({path: 'scratch/treasures-icons.png'});
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
