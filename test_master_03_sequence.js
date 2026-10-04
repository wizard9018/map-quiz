const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source = fs.readFileSync(__dirname + '/focus.js', 'utf8');
const context = { module: { exports: {} } };
vm.runInNewContext(source.slice(source.indexOf('  function getSequenceOrderConfig('), source.indexOf('  function renderSequenceOrder(')) +
  '\nmodule.exports = {getSequenceOrderConfig, generateSequenceOrder};', context);
const { getSequenceOrderConfig, generateSequenceOrder } = context.module.exports;
for (let level = 1; level <= 12; level++) {
  const cfg = getSequenceOrderConfig(level);
  assert.equal(cfg.size, 3);
  assert.equal(cfg.count, [4,5,6,7,8,9,4,5,6,7,8,9][level - 1]);
  assert.equal(cfg.reverse, level > 6);
  assert.equal(cfg.required, 5);
  const orders = new Set();
  for (let run = 0; run < 100; run++) {
    const sequence = generateSequenceOrder(level);
    assert.equal(sequence.length, cfg.count);
    assert.equal(new Set(sequence).size, cfg.count);
    assert(sequence.every(pos => pos >= 0 && pos < 9));
    orders.add(sequence.join(','));
  }
  assert(orders.size > 1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  async function createPage(width = 390, level = 1) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({ contentType: 'application/javascript',
      body: 'window.results=[];window.wx={miniProgram:{postMessage:function(m){window.results.push(m.data)}}};' }));
    await page.goto('http://127.0.0.1:8080/focus.html?game=sequence_order&miniprogram=1');
    if (level !== 1) await page.locator('#level-select').evaluate((select, value) => { select.value = value; select.dispatchEvent(new Event('change')); }, String(level));
    return page;
  }
  async function start(page, level) {
    await page.clock.runFor(60000);
    assert.equal(await page.locator('.sequence-order-cell:enabled').count(), 0);
    await page.getByRole('button', { name: level > 1 ? '继续' : '开始正序训练', exact: true }).click();
  }
  async function observe(page, level) {
    const cfg = getSequenceOrderConfig(level);
    const bounds = await page.locator('#sequence-order-grid').boundingBox();
    assert(Math.abs(bounds.width - bounds.height) < 1);
    const sequence = [];
    for (let index = 0; index < cfg.count; index++) {
      const active = page.locator('.sequence-order-cell.matrix-lit-blue');
      assert.equal(await active.count(), 1);
      assert.equal(await active.innerText(), String(index + 1));
      sequence.push(await active.getAttribute('data-pos'));
      assert.equal(await page.locator('.sequence-order-cell:enabled').count(), 0);
      await page.clock.runFor(399);
      assert.equal(await active.count(), 1);
      await page.clock.runFor(1);
      assert.equal(await active.count(), 0);
      await page.clock.runFor(index < cfg.count - 1 ? 180 : 199);
    }
    assert.equal(await page.locator('.sequence-order-cell:enabled').count(), 0);
    await page.clock.runFor(1);
    assert.equal(await page.locator('.sequence-order-cell:enabled').count(), 9);
    assert.deepEqual(await page.locator('#sequence-order-grid').boundingBox(), bounds);
    return cfg.reverse ? sequence.reverse() : sequence;
  }
  async function restore(page, sequence) {
    for (const pos of sequence) await page.locator(`.sequence-order-cell[data-pos="${pos}"]`).click();
    assert.equal(await page.locator('.matrix-correct').count(), sequence.length);
    assert.equal(await page.locator('.sequence-order-cell:enabled').count(), 0);
  }
  try {
    const page = await createPage();
    assert.equal(await page.locator('#timer-badge').isVisible(), false);
    for (let level = 1; level <= 12; level++) {
      await start(page, level);
      for (let round = 0; round < 5; round++) {
        const sequence = await observe(page, level);
        await restore(page, sequence);
        assert.match(await page.locator('#sequence-round-counter').innerText(), new RegExp(`${round + 1}/5`));
        await page.clock.runFor(600);
      }
      if (level < 12) await page.clock.runFor(600);
      console.log(`Sequence L${level}: ${level > 6 ? 'reverse' : 'forward'}, five rounds passed`);
    }
    assert.equal(await page.locator('#report-modal').isVisible(), true);
    const report = await page.evaluate(() => window.results[0]);
    assert.equal(report.gameId, 'sequence_order');
    assert.equal(report.level, 12);
    await page.close();

    for (const level of [1, 7]) {
      const failure = await createPage(390, level);
      await start(failure, level);
      let sequence = await observe(failure, level);
      await restore(failure, sequence);
      await failure.clock.runFor(600);
      for (let mistake = 1; mistake <= 3; mistake++) {
        sequence = await observe(failure, level);
        await failure.locator(`.sequence-order-cell[data-pos="${sequence[1]}"]`).click();
        assert.equal(await failure.locator('.heart.active').count(), 3 - mistake);
        assert.equal(await failure.locator('#report-modal').isVisible(), mistake === 3);
        if (mistake < 3) {
          assert.match(await failure.locator('#sequence-round-counter').innerText(), /0\/5/);
          assert.equal(await failure.locator('.sequence-error-notice').isVisible(), true);
          await failure.clock.runFor(1999);
          assert.equal(await failure.locator('.sequence-order-cell:enabled').count(), 0);
          await failure.clock.runFor(1);
          assert.equal(await failure.locator('.sequence-error-notice').count(), 0);
        }
      }
      await failure.clock.runFor(10000);
      assert.equal(await failure.locator('#report-modal').isVisible(), true);
      await failure.close();
    }

    for (const width of [320, 1280]) {
      const layout = await createPage(width);
      await start(layout, 1);
      let sequence = await observe(layout, 1);
      await layout.locator(`.sequence-order-cell[data-pos="${sequence[1]}"]`).click();
      await layout.clock.runFor(2000);
      for (let round = 0; round < 5; round++) {
        sequence = await observe(layout, 1);
        await restore(layout, sequence);
        await layout.clock.runFor(600);
      }
      await layout.clock.runFor(600);
      assert.equal(await layout.locator('.heart.active').count(), 3);
      assert.match(await layout.locator('#level-badge').innerText(), /L2/);
      await start(layout, 2);
      await layout.clock.runFor(100);
      await layout.locator('#game-select').evaluate(select => { select.value = 'matrix_flash'; select.dispatchEvent(new Event('change')); });
      await layout.clock.runFor(5000);
      assert.equal(await layout.locator('.matrix-flash-cell:enabled').count(), 0);
      await layout.close();
    }
    assert.deepEqual(errors, []);
    console.log('Sequence config, forward/reverse journey, errors, heart refill, layout, timer cancellation and report passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
