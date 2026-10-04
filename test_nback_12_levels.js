const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { getNBackConfig } = require('./test_nback_helpers');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    // Deterministic randomness exercises both matching and different groups.
    await page.addInitScript(() => {
      Math.random = () => 0.9;
      window.tones = [];
      window.AudioContext = class {
        state = 'running';
        currentTime = 0;
        destination = {};
        createOscillator() {
          const tone = {};
          return {
            frequency: { setValueAtTime: value => { tone.frequency = value; } },
            connect: gain => { tone.gain = gain; },
            start() { tone.type = this.type; },
            stop(duration) { window.tones.push({ frequency: tone.frequency, type: tone.type, duration, gain: tone.gain.value }); }
          };
        }
        createGain() {
          const node = { value: null, connect() {} };
          node.gain = { setValueAtTime: value => { node.value = value; }, exponentialRampToValueAtTime() {} };
          return node;
        }
      };
    });
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({
      contentType: 'application/javascript',
      body: 'window.results=[];window.wx={miniProgram:{postMessage:function(message){window.results.push(message.data)}}};'
    }));
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html?game=nback_flow&miniprogram=1');
    for (let level = 1; level <= 12; level++) {
      const cfg = getNBackConfig(level);
      const grid = page.locator('#nback-grid-matrix');
      assert.equal(await page.locator('.nback-grid-cell').count(), cfg.size * cfg.size);
      {
        const start = page.getByRole('button', { name: '继续', exact: true });
        await start.waitFor();
        assert.equal(await page.locator('#game-controls button').count(), 2);
        assert.equal(await page.locator('#btn-nback-match, #btn-nback-different').count(), 0);
        assert.equal(await page.getByRole('button', {name: '退出', exact: true}).isEnabled(), true);
        if (level > 1) {
          const previous = getNBackConfig(level - 1);
          const notice = await page.locator('.nback-transition-notice').innerText();
          assert(notice.includes(`${previous.size}×${previous.size} → ${cfg.size}×${cfg.size}`));
          assert.equal(notice.includes('每组图形'), previous.n !== cfg.n);
          assert(!notice.includes('不限作答时间'));
        }
        await page.clock.runFor(60000);
        assert.equal(await page.locator('#timer-badge').isVisible(), false);
        assert.equal(await page.locator('.active-lit').count(), 0, 'Each level waits for start');
        await start.click();
      }
      const bounds = await grid.boundingBox();
      const items = [];
      let matchingGroups = 0;
      let decisions = 0;
      for (let step = 0; step < cfg.n * 9; step++) {
        const active = page.locator('.active-lit');
        assert.equal(await active.count(), 1);
        assert.equal(await page.locator('.nback-distraction').count(), 0);
        assert(Number(await active.getAttribute('data-pos')) < cfg.size * cfg.size);
        if (step === 0 && cfg.size > 3) assert(Number(await active.getAttribute('data-pos')) > 8);
        items.push(await active.evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText })));
        const matches = step >= cfg.n && items.slice(step - cfg.n + 1, step + 1).every((item, index) => {
          const previous = items[step - 2 * cfg.n + 1 + index];
          return previous && item.pos === previous.pos && item.icon === previous.icon;
        });
        await page.clock.runFor((level >= 7 ? 750 : 375) - 1);
        assert.equal(await active.count(), 1, 'Item remains visible until its level-specific exposure ends');
        await page.clock.runFor(1);
        assert.equal(await active.count(), 0);
        const groupEnd = (step + 1) % cfg.n === 0;
        if (groupEnd && step >= cfg.n) {
          decisions++;
          assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
          assert.equal(await page.locator('#btn-nback-different').isEnabled(), true);
          if (matches) matchingGroups++;
          await page.clock.runFor(60000);
          assert.equal(await page.locator('#btn-nback-match').isEnabled(), true, 'Answers have no deadline');
          assert.equal(await page.locator('.heart.active').count(), 3);
          await page.locator(matches ? '#btn-nback-match' : '#btn-nback-different').click();
          assert.equal(await page.locator('#btn-nback-different').isDisabled(), true);
          if (decisions === 8) break;
        }
        const gap = (step + 1) % cfg.n === 0 ? 2000 : 180;
        await page.clock.runFor(gap - 1);
        assert.equal(await active.count(), 0);
        assert.deepEqual(await grid.boundingBox(), bounds, 'Group changes must not move the grid');
        await page.clock.runFor(1);
      }
      assert(matchingGroups > 0 && matchingGroups < 8);
      assert.equal(decisions, 8);
      await page.clock.runFor(1000);
      console.log(`L${level}: ${cfg.n}-Back, ${cfg.size}x${cfg.size}, fixed exposure and group gaps passed`);
    }
    const presentationTones = await page.evaluate(() => window.tones.filter(tone => tone.duration === 0.12));
    assert.equal(presentationTones.length, 270, 'All 270 displayed items across 12 levels emit a tone');
    assert(presentationTones.every(tone => tone.frequency === 440 && tone.type === 'triangle' && tone.gain === 0.12),
      'Every item must sound identical regardless of position, icon or match');
    assert.equal(await page.locator('#report-modal').isVisible(), true);
    assert.match(await page.locator('#report-title').innerText(), /12 关/);
    assert.match(await page.locator('#stat-level').innerText(), /12/);
    assert.equal(await page.evaluate(() => window.results[0].level), 12);
    await page.locator('#level-select').evaluate(select => {select.value = '2'; select.dispatchEvent(new Event('change'));});
    await page.getByRole('button', {name: '退出', exact: true}).click();
    assert.equal(await page.locator('#focus-home').isVisible(), true);
    await page.clock.runFor(60000);
    assert.equal(await page.locator('.active-lit').count(), 0);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
