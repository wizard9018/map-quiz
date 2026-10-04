const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const objects = ['bird', 'football', 'balloon', 'plane', 'kite', 'butterfly', 'fish', 'rocket', 'star', 'apple', 'umbrella', 'leaf'];
const source = fs.readFileSync(__dirname + '/focus.js', 'utf8');
let randomValues;
const math = Object.create(Math);
math.random = () => randomValues.shift();
const context = { Math: math, module: { exports: null } };
vm.runInNewContext(source.slice(source.indexOf('  function generateNBackDistraction('), source.indexOf('  function renderNBackFlow(')) +
  '\nmodule.exports = generateNBackDistraction;', context);
for (let object = 0; object < objects.length; object++) {
  assert(fs.existsSync(__dirname + '/assets/distractions/' + objects[object] + '.svg'));
  for (let side = 0; side < 4; side++) {
    for (const diagonal of [false, true]) {
      for (const lane of [0.1, 0.9]) {
        randomValues = [(object + 0.1) / 12, (side + 0.1) / 4, diagonal ? 0.1 : 0.9, lane];
        const flight = context.module.exports(244, 244);
        assert.equal(flight.object, objects[object]);
        assert.equal(flight.entry, ['left', 'right', 'top', 'bottom'][side]);
        assert.equal(flight.diagonal, diagonal);
        const horizontal = side < 2;
        const start = horizontal ? flight.startX : flight.startY;
        const end = horizontal ? flight.endX : flight.endY;
        const forward = side === 0 || side === 2;
        assert(forward ? start + (horizontal ? 60 : 52) < 0 && end > 244 : start > 244 && end + (horizontal ? 60 : 52) < 0);
        const crossStart = horizontal ? flight.startY : flight.startX;
        const crossEnd = horizontal ? flight.endY : flight.endX;
        assert.equal(crossStart !== crossEnd, diagonal);
        assert(crossStart >= 0 && crossStart + (horizontal ? 52 : 60) <= 244);
        assert(crossEnd >= 0 && crossEnd + (horizontal ? 52 : 60) <= 244);
      }
    }
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto('http://127.0.0.1:8080/focus.html?game=nback_flow&miniprogram=1');
    for (let i = 0; i < 16; i++) {
      await page.locator('#level-select').evaluate(select => { select.value = '1'; select.dispatchEvent(new Event('change')); });
      await page.getByRole('button', { name: '继续', exact: true }).click();
      const side = Math.floor(i / 2) % 4;
      const diagonal = i % 2 === 1;
      await page.evaluate(values => { Math.random = () => values.length ? values.shift() : 0.9; },
        [((i % 12) + 0.1) / 12, (side + 0.1) / 4, diagonal ? 0.1 : 0.9, 0.1]);
      await page.clock.runFor(375);
      const image = page.locator('.nback-flying-picture');
      await page.waitForFunction(() => { const img = document.querySelector('.nback-flying-picture'); return img && img.complete && img.naturalWidth > 0; });
      assert.equal(await image.getAttribute('src'), `assets/distractions/${objects[i % 12]}.svg`);
      assert.equal(await page.locator('.nback-distraction').getAttribute('data-entry'), ['left', 'right', 'top', 'bottom'][side]);
      assert.equal(await page.locator('.nback-distraction').getAttribute('data-motion'), diagonal ? 'diagonal' : 'straight');
      assert.equal(await image.evaluate(img => getComputedStyle(img).animationDuration), '0.95s');
      assert.equal(await page.locator('#btn-nback-match').isDisabled(), true);
      await page.clock.runFor(1999);
      assert.equal(await page.locator('.active-lit').count(), 0);
      await page.clock.runFor(1);
      assert.equal(await image.count(), 0);
      assert.equal(await page.locator('.active-lit').count(), 1);
    }
    console.log('12 images, all entry directions, straight/diagonal routes, 0.95s animation and cleanup passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
