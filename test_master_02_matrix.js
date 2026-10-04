const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source = fs.readFileSync(__dirname + '/focus.js', 'utf8');
const context = { module: { exports: {} } };
vm.runInNewContext(source.slice(source.indexOf('  function getMatrixFlashConfig('), source.indexOf('  function renderMatrixFlash(')) +
  '\nmodule.exports = {getMatrixFlashConfig, generateMatrixFlashTargets};', context);
const { getMatrixFlashConfig, generateMatrixFlashTargets } = context.module.exports;
const expected = [[4,3,600,5],[4,4,550,5],[4,5,550,5],[4,6,1000,5],[4,7,950,5],
  [5,8,900,5],[5,9,850,5],[5,10,800,5],[5,11,850,5],[5,12,800,5],
  [5,13,800,5],[5,14,800,5],[5,15,800,5],[5,16,800,5],[5,17,800,5]];
for (let level = 1; level <= 15; level++) {
  const cfg = getMatrixFlashConfig(level);
  assert.deepEqual([cfg.size, cfg.count, cfg.exposure, cfg.required], expected[level - 1]);
  const layouts = new Set();
  for (let run = 0; run < 100; run++) {
    const targets = generateMatrixFlashTargets(level);
    assert.equal(targets.length, cfg.count);
    assert.equal(new Set(targets.map(target => target.pos)).size, cfg.count);
    assert(targets.every(target => target.pos >= 0 && target.pos < cfg.size * cfg.size));
    assert.equal(targets.filter(target => target.color === 'blue').length, level < 9 ? cfg.count : Math.floor(cfg.count / 2));
    layouts.add(targets.map(target => target.pos).sort((a, b) => a - b).join(','));
  }
  assert(layouts.size > 1);
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
    await page.goto(process.env.MATRIX_TEST_URL || 'http://127.0.0.1:8080/focus.html?game=matrix_flash&miniprogram=1');
    if (level !== 1) await page.locator('#level-select').evaluate((select, value) => { select.value = value; select.dispatchEvent(new Event('change')); }, String(level));
    return page;
  }
  async function startLevel(page, level) {
    await page.clock.runFor(60000);
    assert.equal(await page.locator('.matrix-flash-cell:enabled').count(), 0);
    await page.getByRole('button', {name: level > 1 ? '继续' : '开始记忆', exact: true}).click();
  }
  async function observe(page, cfg) {
    const cells = page.locator('.matrix-flash-cell');
    const grid = page.locator('#matrix-flash-grid');
    const bounds = await grid.boundingBox();
    assert(Math.abs(bounds.width - bounds.height) < 1);
    const target = await cells.evaluateAll(nodes => nodes.filter(node => node.classList.contains('matrix-lit-blue') || node.classList.contains('matrix-lit-yellow'))
      .map(node => ({ pos: node.dataset.pos, blue: node.classList.contains('matrix-lit-blue') })));
    assert.equal(target.length, cfg.count);
    assert.equal(await page.locator('.matrix-flash-cell:enabled').count(), 0);
    await page.clock.runFor(cfg.exposure - 1);
    assert.equal(await page.locator('.matrix-lit-blue, .matrix-lit-yellow').count(), cfg.count);
    await page.clock.runFor(1);
    assert.equal(await page.locator('.matrix-lit-blue, .matrix-lit-yellow').count(), 0);
    await page.clock.runFor(199);
    assert.equal(await page.locator('.matrix-flash-cell:enabled').count(), 0);
    await page.clock.runFor(1);
    assert.equal(await page.locator('.matrix-flash-cell:enabled').count(), cfg.size * cfg.size);
    assert.deepEqual(await grid.boundingBox(), bounds, 'Recall must not move the board');
    return target.sort((a, b) => Number(b.blue) - Number(a.blue));
  }
  try {
    // Full actual-browser fifteen-level journey, including new color rule and result bridge.
    const page = await createPage();
    assert.equal(await page.locator('#timer-badge').isVisible(), false);
    for (let level = 1; level <= 15; level++) {
      const cfg = getMatrixFlashConfig(level);
      assert.equal(await page.locator('.matrix-flash-cell').count(), cfg.size * cfg.size);
      await startLevel(page, level);
      for (let round = 0; round < cfg.required; round++) {
        const target = await observe(page, cfg);
        for (const item of target) await page.locator(`.matrix-flash-cell[data-pos="${item.pos}"]`).click();
        assert.equal(await page.locator('.matrix-correct').count(), cfg.count);
        assert.equal(await page.locator('.matrix-flash-cell:enabled').count(), 0);
        assert.match(await page.locator('#matrix-round-counter').innerText(), new RegExp(`${round + 1}/${cfg.required}`));
        await page.clock.runFor(600);
      }
      if (level < 15) await page.clock.runFor(600);
      console.log(`Matrix L${level}: ${cfg.size}x${cfg.size}, ${cfg.count} targets, ${cfg.required} rounds passed`);
    }
    assert.equal(await page.locator('#report-modal').isVisible(), true);
    const report = await page.evaluate(() => window.results[0]);
    assert.equal(report.gameId, 'matrix_flash');
    assert.equal(report.level, 15);
    assert.match(await page.locator('#report-title').innerText(), /15 关/);
    await page.close();

    // Wrong color order resets streak, pause blocks input; third error ends game.
    const failure = await createPage(390, 9);
    await startLevel(failure, 9);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const target = await observe(failure, getMatrixFlashConfig(9));
      if (attempt === 1) {
        await failure.locator(`.matrix-flash-cell[data-pos="${target[0].pos}"]`).click();
        await failure.keyboard.press('Enter');
        assert.equal(await failure.locator('.matrix-correct').count(), 1, 'Selected cells are locked');
      }
      const yellow = target.find(item => !item.blue);
      await failure.locator(`.matrix-flash-cell[data-pos="${yellow.pos}"]`).click();
      assert.equal(await failure.locator('.heart.active').count(), 4 - attempt, 'Review does not deduct a heart');
      assert.equal(await failure.locator('.matrix-lit-blue, .matrix-lit-yellow').count(), 11, 'Review shows the entire correct pattern');
      assert.equal(await failure.locator('.matrix-selected').count(), attempt === 1 ? 1 : 0);
      assert.equal(await failure.locator('.matrix-wrong').getAttribute('data-pos'), yellow.pos);
      await failure.clock.runFor(60000);
      assert.equal(await failure.locator('.heart.active').count(), 4 - attempt);
      assert.equal(await failure.locator('.matrix-flash-cell:enabled').count(), 0);
      assert.equal(await failure.locator('#report-modal').isVisible(), false);
      await failure.getByRole('button', { name: '确认', exact: true }).click();
      assert.equal(await failure.locator('.heart.active').count(), 3 - attempt);
      assert.equal(await failure.locator('#report-modal').isVisible(), attempt === 3);
      if (attempt < 3) assert.match(await failure.locator('#matrix-round-counter').innerText(), /0\/5/);
    }
    await failure.clock.runFor(10000);
    assert.equal(await failure.locator('#report-modal').isVisible(), true);
    await failure.close();

    // Mobile/desktop square layout, wrong position, streak reset and lifecycle cancellation.
    for (const width of [320, 390, 1280]) {
      const layout = await createPage(width);
      await startLevel(layout, 1);
      let target = await observe(layout, getMatrixFlashConfig(1));
      for (const item of target) await layout.locator(`.matrix-flash-cell[data-pos="${item.pos}"]`).click();
      await layout.clock.runFor(600);
      target = await observe(layout, getMatrixFlashConfig(1));
      const wrong = Array.from({ length: 16 }, (_, pos) => String(pos)).find(pos => !target.some(item => item.pos === pos));
      await layout.locator(`.matrix-flash-cell[data-pos="${wrong}"]`).click();
      assert.equal(await layout.locator('.heart.active').count(), 3);
      assert.equal(await layout.locator('.matrix-lit-blue').count(), 3);
      assert.equal(await layout.locator('.matrix-wrong').getAttribute('data-pos'), wrong);
      await layout.getByRole('button', { name: '确认', exact: true }).click();
      assert.match(await layout.locator('#matrix-round-counter').innerText(), /0\/5/);
      assert.equal(await layout.locator('.heart.active').count(), 2);
      for (let round = 0; round < 5; round++) {
        target = await observe(layout, getMatrixFlashConfig(1));
        for (const item of target) await layout.locator(`.matrix-flash-cell[data-pos="${item.pos}"]`).click();
        await layout.clock.runFor(600);
      }
      await layout.clock.runFor(600);
      assert.match(await layout.locator('#level-badge').innerText(), /L2/);
      assert.equal(await layout.locator('.heart.active').count(), 3, 'Promotion restores all hearts');
      await layout.clock.runFor(300);
      await layout.locator('#game-select').evaluate(select => { select.value = 'nback_flow'; select.dispatchEvent(new Event('change')); });
      await layout.clock.runFor(300);
      assert.equal(await layout.locator('#level-select option[value="15"]').count(), 0);
      await layout.locator('#game-select').evaluate(select => { select.value = 'matrix_flash'; select.dispatchEvent(new Event('change')); });
      await layout.clock.runFor(3000);
      assert.equal(await layout.locator('.matrix-flash-cell:enabled').count(), 0);
      assert.equal(await layout.locator('.heart.active').count(), 3);
      await layout.close();
    }
    assert.deepEqual(errors, []);
    console.log('Matrix config, random targets, full journey, errors, layout, lifecycle and report bridge passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
