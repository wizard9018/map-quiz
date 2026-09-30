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
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:8080/focus.html?miniprogram=1');
    for (let level = 1; level <= 12; level++) {
      const cfg = getNBackConfig(level);
      const grid = page.locator('#nback-grid-matrix');
      assert.equal(await page.locator('.nback-grid-cell').count(), cfg.size * cfg.size);
      if ([4, 7, 10].includes(level)) {
        const start = page.getByRole('button', { name: `开始 ${cfg.n}-Back` });
        await start.waitFor();
        await page.clock.runFor(60000);
        assert.equal(await page.locator('#timer-badge').isVisible(), false);
        await start.click();
      } else {
        await page.clock.runFor(300);
      }
      const bounds = await grid.boundingBox();
      const items = [];
      let matchingGroups = 0;
      for (let step = 0; step < cfg.totalSteps; step++) {
        const active = page.locator('.active-lit');
        assert.equal(await active.count(), 1);
        assert(Number(await active.getAttribute('data-pos')) < cfg.size * cfg.size);
        if (step === 0 && cfg.size > 3) assert(Number(await active.getAttribute('data-pos')) > 8);
        items.push(await active.evaluate(cell => ({ pos: cell.dataset.pos, icon: cell.innerText })));
        const matches = step >= cfg.n && items.slice(step - cfg.n + 1, step + 1).every((item, index) => {
          const previous = items[step - 2 * cfg.n + 1 + index];
          return previous && item.pos === previous.pos && item.icon === previous.icon;
        });
        if (cfg.n === 1 && matches) {
          matchingGroups++;
          await page.locator('#btn-nback-match').click();
        }
        await page.clock.runFor(1499);
        assert.equal(await active.count(), 1, 'Every item must stay visible for 1500ms');
        await page.clock.runFor(1);
        assert.equal(await active.count(), 0);
        const groupEnd = cfg.n >= 2 && (step + 1) % cfg.n === 0;
        if (groupEnd && step >= cfg.n) {
          assert.equal(await page.locator('#btn-nback-match').isEnabled(), true);
          if (matches) {
            matchingGroups++;
            await page.locator('#btn-nback-match').click();
          }
          await page.clock.runFor(1500);
        }
        const gap = groupEnd ? 1200 : cfg.n >= 2 ? 180 : 360;
        await page.clock.runFor(gap - 1);
        assert.equal(await active.count(), 0);
        assert.deepEqual(await grid.boundingBox(), bounds, 'Group changes must not move the grid');
        await page.clock.runFor(1);
      }
      assert.equal(matchingGroups, 5);
      await page.clock.runFor(1000);
      console.log(`L${level}: ${cfg.n}-Back, ${cfg.size}x${cfg.size}, fixed exposure and group gaps passed`);
    }
    const presentationTones = await page.evaluate(() => window.tones.filter(tone => tone.duration === 0.12));
    assert.equal(presentationTones.length, 330, 'All 330 displayed items across 12 levels emit a tone');
    assert(presentationTones.every(tone => tone.frequency === 440 && tone.type === 'triangle' && tone.gain === 0.12),
      'Every item must sound identical regardless of position, icon or match');
    assert.equal(await page.locator('#report-modal').isVisible(), true);
    assert.match(await page.locator('#report-title').innerText(), /12 关/);
    assert.match(await page.locator('#stat-level').innerText(), /12/);
    assert.equal(await page.evaluate(() => window.results[0].level), 12);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
