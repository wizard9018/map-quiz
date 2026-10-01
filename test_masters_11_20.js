const assert = require('node:assert/strict');
const api = require('./focus-next-games');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
for (const [id] of api.definitions) for (let level = 1; level <= 10; level++) {
  const cfg = api.getConfig(id, level); assert.equal(cfg.required, 3);
  if (level > 1) assert.notDeepEqual(cfg, api.getConfig(id, level - 1), 'Every level must change the difficulty');
  for (let sample = 0; sample < 40; sample++) {
    const trial = api.generateTrial(id, level);
    if (id === 'stroop_dimension') trial.items.forEach(item => { assert.equal(item.answer, item[item.rule]); assert(item.ink < cfg.colors && item.word < cfg.colors); });
    if (id === 'simon_reverse') trial.items.forEach(item => assert.equal(item.answer, item.reverse ? api.opposite[item.direction] : item.direction));
    if (id === 'sst_stop_signal') { assert.equal(trial.items.filter(item => item.stop).length, 2); assert(cfg.stopDelay < cfg.limit); }
    if (id === 'rhythm_seven') trial.items.forEach(item => assert.equal(item.stop, item.number % 7 === 0 || String(item.number).includes('7')));
    if (id === 'wcst_rule_switch') trial.items.forEach((item, i) => { assert.equal(item.answer, item[item.rule]); if (i && i % cfg.switchEvery === 0 && cfg.rules.length > 1) assert.notEqual(item.rule, trial.items[i - 1].rule); });
    if (id === 'mot_trajectory') { assert.equal(trial.balls.length, cfg.count); assert.equal(new Set(trial.targets).size, cfg.targets); assert(trial.targets.every(i => i < cfg.count)); }
    if (id === 'odd_one_out') { const counts = new Map(); trial.items.forEach(item => counts.set(item, (counts.get(item) || 0) + 1)); assert.equal([...counts.values()].filter(count => count === 1).length, 1); assert.equal(counts.get(trial.singleton), 1); assert.equal(trial.items[trial.answer], trial.singleton); }
    if (id === 'mental_rotation_clock') { assert.equal(trial.time % cfg.minuteStep, 0); assert.equal(new Set(trial.choices).size, cfg.options); assert(trial.choices.includes(trial.time)); assert(cfg.angles.includes(trial.rotation)); }
    if (id === 'train_switch_dispatch') { assert.equal(new Set(trial.stations.map(color => color.name)).size, cfg.stations); assert(trial.trains.every(index => index < cfg.stations)); }
    if (id === 'laser_prism_deflect') { const result = api.traceLaser(cfg.size, trial.mirrors, trial.entryRow); assert.equal(result.exit, trial.exit); assert.equal(new Set(result.hit).size, cfg.mirrors); assert.equal(new Set(trial.ports).size, 4); assert(trial.ports.includes(trial.exit)); }
  }
}
// Explicit physical reflections, independent of trial generation.
assert.equal(api.traceLaser(4, [{ x: 1, y: 1, slash: '/' }], 1).exit, 'top-1');
assert.equal(api.traceLaser(4, [{ x: 1, y: 1, slash: '\\' }], 1).exit, 'bottom-1');
assert.equal(api.traceLaser(4, [{ x: 1, y: 1, slash: '\\' }, { x: 1, y: 2, slash: '\\' }], 1).exit, 'right-2');
(async () => {
  const browser = await chromium.launch(); const errors = [];
  async function create(id, level = 1, width = 390) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on('pageerror', error => errors.push(id + ': ' + error.message));
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({ body: 'window.results=[];window.wx={miniProgram:{postMessage(m){window.results.push(m.data)}}}' }));
    await page.goto('http://127.0.0.1:8080/focus.html?game=' + id + '&miniprogram=1');
    if (level !== 1) await page.locator('#level-select').evaluate((select, value) => { select.value = value; select.dispatchEvent(new Event('change')); }, String(level));
    return page;
  }
  async function start(page, level) { assert.equal(await page.locator('.heart.active').count(), 3); await page.getByRole('button', { name: '开始第 ' + level + ' 关' }).click(); }
  async function solve(page, id, level, wrong = false) {
    const cfg = api.getConfig(id, level);
    const choice = value => page.locator('#game-controls [data-choice="' + value + '"]').click();
    if (['stroop_dimension', 'simon_reverse', 'sst_stop_signal', 'rhythm_seven', 'wcst_rule_switch'].includes(id)) {
      for (let i = 0; i < cfg.count; i++) {
        if (id === 'stroop_dimension') {
          const word = await page.locator('.next-color-word').innerText();
          const ink = await page.locator('.next-color-word').evaluate(node => node.style.color);
          const answer = (await page.locator('.next-rule').innerText()).includes('文字') ? api.colors.findIndex(color => color.name === word) : api.colors.findIndex(color => {
            const hex = color.hex.slice(1); return 'rgb(' + [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16)).join(', ') + ')' === ink;
          });
          await choice(wrong ? (answer + 1) % cfg.colors : answer);
        } else if (id === 'simon_reverse') {
          const arrow = await page.locator('.next-simon-arrow').innerText(); const direction = { '←': 'left', '→': 'right', '↑': 'up', '↓': 'down' }[arrow];
          const answer = (await page.locator('.next-rule').innerText()).includes('反') ? api.opposite[direction] : direction;
          await choice(wrong ? cfg.directions.find(value => value !== answer) : answer);
        } else if (id === 'sst_stop_signal') {
          await page.clock.runFor(cfg.stopDelay + 1);
          const stop = (await page.locator('.next-stop-cue').innerText()).includes('STOP');
          const arrow = await page.locator('.next-inhibit-stimulus').innerText(); const direction = arrow === '←' ? 'left' : 'right';
          if (!stop || wrong) await choice(wrong && !stop ? api.opposite[direction] : direction);
          await page.clock.runFor(cfg.limit - cfg.stopDelay - 1);
          if (wrong && stop) return;
        } else if (id === 'rhythm_seven') {
          const number = Number(await page.locator('.next-inhibit-stimulus').innerText()); const stop = number % 7 === 0 || String(number).includes('7');
          if ((!stop && !wrong) || (stop && wrong)) await choice('go');
          await page.clock.runFor(cfg.limit);
        } else {
          const rule = await page.locator('.next-rule').innerText(), text = await page.locator('.next-sort-card').innerText();
          const ink = await page.locator('.next-sort-card').evaluate(node => node.style.color);
          const color = ['rgb(220, 38, 38)', 'rgb(37, 99, 235)', 'rgb(21, 128, 61)'].indexOf(ink);
          const answer = rule.includes('颜色') ? color : rule.includes('形状') ? ['●', '▲', '■'].indexOf(text[0]) : text.length - 1;
          await choice(wrong ? (answer + 1) % 3 : answer);
        }
        if (wrong) return;
        await page.clock.runFor(350);
      }
    } else if (id === 'mot_trajectory') {
      const targets = await page.locator('.next-ball-target').evaluateAll(nodes => nodes.map(node => node.dataset.ball));
      const before = await page.locator('.next-mot-ball').evaluateAll(nodes => nodes.map(node => [node.style.left, node.style.top]));
      assert.equal(await page.locator('.next-mot-ball:enabled').count(), 0);
      await page.clock.runFor(cfg.preview + cfg.motion);
      assert.equal(await page.locator('.next-ball-target').count(), 0);
      assert.notDeepEqual(await page.locator('.next-mot-ball').evaluateAll(nodes => nodes.map(node => [node.style.left, node.style.top])), before);
      if (wrong) { const nonTarget = await page.locator('.next-mot-ball').evaluateAll((nodes, targets) => nodes.find(node => !targets.includes(node.dataset.ball)).dataset.ball, targets); await page.locator('[data-ball="' + nonTarget + '"]').click(); }
      else for (const target of targets) await page.locator('[data-ball="' + target + '"]').click();
    } else if (id === 'odd_one_out') {
      const images = await page.locator('.next-object-grid img').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
      const answer = images.findIndex(src => images.filter(item => item === src).length === 1);
      await page.locator('.next-object-grid button').nth(wrong ? (answer + 1) % images.length : answer).click();
    } else if (id === 'mental_rotation_clock') {
      const angle = await page.locator('.clock-hour').getAttribute('transform'); const time = Math.round(Number(angle.match(/rotate\(([^ ]+)/)[1]) * 2);
      const values = await page.locator('#game-controls button').evaluateAll(nodes => nodes.map(node => node.dataset.choice));
      await choice(wrong ? values.find(value => Number(value) !== time) : time);
    } else if (id === 'train_switch_dispatch') {
      for (let t = 0; t < cfg.travel + (cfg.count - 1) * cfg.interval + 50; t += 100) {
        const trains = await page.locator('.next-train').evaluateAll(nodes => nodes.map(node => ({ destination: Number(node.dataset.destination), progress: Number(node.dataset.progress || 0), next: node.dataset.nextSwitch || '0' })));
        const handled = new Set();
        for (const train of trains) {
          if (train.progress < .3 || (cfg.stations === 4 && train.progress < .65)) {
            if (handled.has(train.next)) continue; handled.add(train.next);
            const gate = train.progress < .3 ? 0 : Number(train.next); const target = gate === 0 ? cfg.stations === 2 ? train.destination : Math.floor(train.destination / 2) : train.destination % 2;
            const node = page.locator('#game-controls [data-choice="' + gate + '"]'); const selected = (await node.innerText()).endsWith('右') ? 1 : 0;
            if (selected !== (wrong ? 1 - target : target)) await node.click();
          }
        }
        await page.clock.runFor(100);
        if ((await page.locator('.next-error').count()) || (await page.locator('#next-status').innerText()) === '本组正确！') break;
      }
    } else {
      const mirrors = await page.locator('.next-mirror-cell').evaluateAll((nodes, size) => nodes.flatMap((node, i) => node.textContent ? [{ x: i % size, y: Math.floor(i / size), slash: node.textContent }] : []), cfg.size);
      const entry = await page.locator('.next-port.port-left').filter({ hasText: '→' }).evaluate(node => Math.round(parseFloat(node.style.top) / 100 * Number(node.closest('.next-laser-field').querySelector('.next-laser-grid').style.gridTemplateColumns.match(/repeat\((\d+)/)[1]) - .5));
      const result = api.traceLaser(cfg.size, mirrors, entry);
      await page.clock.runFor(cfg.preview);
      assert.equal(await page.locator('.next-mirror-cell').evaluateAll(nodes => nodes.every(node => node.textContent === '')), true);
      const values = await page.locator('#game-controls button').evaluateAll(nodes => nodes.map(node => node.dataset.choice));
      await choice(wrong ? values.find(value => value !== result.exit) : result.exit);
    }
  }
  try {
    for (const [id] of api.definitions) {
      const page = await create(id);
      for (let level = 1; level <= 10; level++) {
        await start(page, level);
        for (let group = 0; group < 3; group++) { await solve(page, id, level); await page.clock.runFor(600); }
        if (level < 10) await page.clock.runFor(600);
      }
      assert.equal(await page.locator('#report-modal').isVisible(), true); assert.equal(await page.evaluate(() => window.results[0].level), 10);
      assert.equal(await page.evaluate(() => FocusHistory.read().at(-1).gameId), id);
      console.log(id + ': ten-level journey, heart refill, bridge and saved report passed'); await page.close();
    }
    for (const [id] of api.definitions) {
      const page = await create(id); await start(page, 1);
      for (let error = 1; error <= 3; error++) { await solve(page, id, 1, true); assert.equal(await page.locator('.heart.active').count(), 3 - error); if (error < 3) { assert.equal(await page.locator('.next-error').isVisible(), true); await page.clock.runFor(2000); } }
      assert.equal(await page.locator('#report-modal').isVisible(), true);
      await page.clock.runFor(60000); assert.equal(await page.evaluate(() => window.results.length), 1);
      await page.close(); console.log(id + ': restart, third-error report and timer cleanup passed');
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  console.log('All ten new masters: generators and 100 playable levels verified.');
})().catch(error => { console.error(error); process.exitCode = 1; });
