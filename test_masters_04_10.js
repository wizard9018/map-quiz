const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const api = require('./focus-batch-games');
for (const [id] of api.definitions) {
  for (let level = 1; level <= (['ufov_dual_field', 'cambridge_decoder'].includes(id) ? 14 : 10); level++) {
    const cfg = api.getConfig(id, level);
    assert.equal(cfg.required, ['tidal_treasures', 'schulte_ladder'].includes(id) ? 1 : ['semantic_synthesis', 'cambridge_decoder'].includes(id) ? 3 : id === 'flanker_birds' ? 8 + (level - 1) * 2 : 5);
    if (id === 'schulte_ladder') { assert.equal(cfg.limit, [15,10,5,20,15,10,30,25,20,40][level - 1] * 1000); assert.equal(cfg.size, 3 + Math.floor((level - 1) / 3)); }
    if (id === 'tidal_treasures') { assert.equal(cfg.count, level + 3); assert.equal(cfg.size, level <= 5 ? 4 : 5); }
    for (let run = 0; run < 30; run++) {
      const trial = api.generateTrial(id, level);
      if (id === 'tidal_treasures') assert.equal(new Set(trial.objects).size, cfg.count);
      if (id === 'semantic_synthesis') {
        assert.equal(cfg.count, [5, 7, 9, 7, 9, 11, 9, 11, 13, 15][level - 1]);
        assert.equal(cfg.categoryCount, level <= 3 ? 2 : level <= 6 ? 3 : 4);
        assert.equal(trial.words.length, cfg.count);
        const counts = Object.fromEntries(trial.categories.map(category => [category, 0]));
        trial.words.forEach(item => { assert(api.vocabulary[item.category].includes(item.word)); counts[item.category]++; });
        assert(Object.values(counts).every(count => count > 0));
        assert(trial.categories.every(category => category === trial.category || counts[category] < counts[trial.category]));
      }
      if (id === 'schulte_ladder') assert.deepEqual(trial.numbers.slice().sort((a, b) => a - b), Array.from({ length: cfg.size ** 2 }, (_, i) => i + 1));
      if (id === 'cambridge_decoder') {
        assert.equal(cfg.count, 3 + Math.floor((level - 1) / 2));
        assert.equal(cfg.reverse, level % 2 === 0);
        assert.equal(cfg.exposure, Math.max(350, 800 - (level - 1) * 50));
        assert.equal(new Set(trial.sequence).size, cfg.count);
        assert.deepEqual(trial.choices.slice().sort(), trial.sequence.slice().sort());
        assert.notDeepEqual(trial.choices, trial.sequence);
      }
      if (id === 'flanker_birds') {
        assert.deepEqual(cfg.directions, level < 6 ? ['left', 'right'] : ['left', 'right', 'up', 'down']);
        assert(trial.birds.every(direction => cfg.directions.includes(direction)));
        assert.equal(cfg.limit, level <= 5 ? 20000 : 25000); assert.equal(cfg.count, cfg.rows * cfg.cols);
        assert.equal(trial.birds.length, cfg.count); assert(trial.target >= 0 && trial.target < cfg.count);
        assert.equal(trial.birds[trial.target], trial.direction); assert(cfg.rows <= 6 && cfg.cols <= 6);
        assert.equal(trial.objects.length, cfg.count);
        assert.equal(trial.objects.filter(object => object !== 'bird').length, cfg.distractors);
        assert(trial.objects.every(object => ['bird', 'fish', 'rabbit', 'turtle', 'pencil', 'pen', 'paintbrush'].includes(object)));
      }
      if (id === 'ufov_dual_field') {
        assert.equal(cfg.exposure, [500, 300, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250][level - 1]);
        assert.equal(cfg.size, level <= 5 ? 3 : 5); assert.equal(cfg.options, Math.min(6, 2 + Math.floor((level - 1) / 2)));
        assert.equal(cfg.triple, level >= 11);
        assert.notEqual(trial.object, 'star'); assert.equal(new Set(trial.choices).size, cfg.options); assert(trial.choices.includes(trial.object));
        const onEdge = pos => Math.floor(pos / cfg.size) === 0 || Math.floor(pos / cfg.size) === cfg.size - 1 || pos % cfg.size === 0 || pos % cfg.size === cfg.size - 1;
        assert(onEdge(trial.position)); assert(!trial.distractors.includes(trial.position)); assert.equal(new Set(trial.distractors).size, cfg.distractors);
        assert.equal(trial.distractorObjects.length, cfg.distractors);
        assert.equal(new Set(trial.distractorObjects).size, cfg.distractors);
        assert(trial.distractorObjects.every(object => ['star-blue', 'star-green', 'star-red', 'triangle-yellow', 'diamond-yellow'].includes(object)));
        if (cfg.triple) { assert(onEdge(trial.heart)); assert.notEqual(trial.heart, trial.position); assert(!trial.distractors.includes(trial.heart)); }
        assert.notEqual(api.generateTrial(id, level, trial).object, trial.object);
      }
      if (id === 'bimodal_divert') {
        assert.equal(cfg.count, level + 1); assert.equal(cfg.exposure, 750); assert.equal(cfg.colors.length, level < 6 ? 2 : 3);
        assert.equal(trial.colors.length, cfg.colors.length); assert.equal(new Set(trial.colors).size, cfg.colors.length); assert(trial.colors.includes(cfg.targetColor));
        const next = api.generateTrial(id, level, trial); assert.deepEqual(next.colors, cfg.colors); assert.deepEqual(trial.colors, cfg.colors); assert(!trial.colors.includes('yellow'));
        assert.equal(trial.steps.length, cfg.count); assert(trial.steps.every(step => trial.colors.includes(step.color) && ['clear', 'soft'].includes(step.sound)));
        assert.equal(trial.colorCount, trial.steps.filter(step => step.color === cfg.targetColor).length); assert.equal(trial.soundCount, trial.steps.filter(step => step.sound === cfg.targetSound).length);
        if (level > 1) { const prev = api.getConfig(id, level - 1); assert.notEqual(cfg.targetColor, prev.targetColor); assert.notEqual(cfg.targetSound, prev.targetSound); }
      }
    }
  }
}

let previousSemantic;
for (let level = 1; level <= 10; level++) {
  for (let round = 0; round < 1000; round++) {
    const trial = api.generateTrial('semantic_synthesis', level, previousSemantic);
    const cfg = api.getConfig('semantic_synthesis', level);
    assert.equal(trial.categories.length, cfg.categoryCount);
    assert.equal(trial.words.length, cfg.count);
    assert.equal(new Set(trial.words.map(item => item.word)).size, cfg.count, 'Words must not repeat within a group');
    const counts = trial.categories.map(category => trial.words.filter(item => item.category === category).length);
    assert(counts.every(count => count > 0));
    assert.equal(counts.filter(count => count === Math.max(...counts)).length, 1);
    if (previousSemantic) {
      const overlap = trial.categories.filter(category => previousSemantic.categories.includes(category)).length;
      assert.equal(overlap, Math.max(0, cfg.categoryCount + previousSemantic.categories.length - Object.keys(api.vocabulary).length), 'Adjacent groups must use the minimum possible overlap');
      assert.notDeepEqual(trial.categories.slice().sort(), previousSemantic.categories.slice().sort());
    }
    previousSemantic = trial;
  }
}

let previousBirds;
for (let level = 1; level <= 10; level++) {
  for (let round = 0; round < 100; round++) {
    const next = api.generateTrial('flanker_birds', level, previousBirds);
    if (previousBirds) {
      assert.notEqual(next.target, previousBirds.target, 'Underline must move every trial');
      assert(next.birds.filter((direction, index) => direction !== previousBirds.birds[index] && index < previousBirds.birds.length).length > next.birds.length / 2, 'More than half the birds must flip');
    }
    assert.equal(next.direction, next.birds[next.target]); previousBirds = next;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  async function createPage(id, width = 390, level = 1) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on('pageerror', error => errors.push(`${id}: ${error.message}`));
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await page.addInitScript(words => {
      window.spokenWords = []; window.audioTones = []; window.failSpeech = false; window.deferSpeech = false;
      const NativeAudio = window.Audio;
      window.Audio = class {
        constructor(src) { const match = src && src.match(/word-(\d+)/); if (!match) return new NativeAudio(src || ''); this.word = words[Number(match[1]) - 1]; }
        pause() {}
        play() { window.spokenWords.push(this.word); return Promise.resolve().then(() => { if (window.deferSpeech) return; window.failSpeech ? this.onerror && this.onerror() : this.onended && this.onended(); }); }
      };
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
      Object.defineProperty(window, 'speechSynthesis', { value: {
        cancel() {}, getVoices: () => [{ lang: 'zh-CN' }],
        speak(utterance) { window.spokenWords.push(utterance.text); Promise.resolve().then(() => { if (window.deferSpeech) return; window.failSpeech ? utterance.onerror && utterance.onerror() : utterance.onend && utterance.onend(); }); }
      }});
      window.AudioContext = class {
        state = 'running'; currentTime = 0; destination = {};
        createOscillator() { let freq; return { frequency: { setValueAtTime: value => { freq = value; } }, connect() {}, start() {}, stop: duration => window.audioTones.push({ frequency: freq, duration }) }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      };
    }, api.audioWords);
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.results=[];window.wx={miniProgram:{postMessage:function(m){window.results.push(m.data)}}};' }));
    await page.goto(`http://127.0.0.1:8080/focus.html?game=${id}&miniprogram=1`);
    if (level !== 1) await page.locator('#level-select').evaluate((select, value) => { select.value = value; select.dispatchEvent(new Event('change')); }, String(level));
    return page;
  }
  async function start(page, level) {
    await page.clock.runFor(60000);
    assert.equal(await page.locator('.heart.active').count(), 3);
    if (new URL(page.url()).searchParams.get('game') === 'bimodal_divert') {
      assert.equal(await page.locator('.bimodal-color-guide').count(), 1);
      const cfg = api.getConfig('bimodal_divert', level);
      assert.deepEqual(await page.locator('.bimodal-color-preview').evaluateAll(nodes => nodes.map(node => node.dataset.color)), cfg.colors);
      assert.equal(await page.locator('.bimodal-color-preview.is-target').count(), 1);
      assert.equal(await page.locator('.bimodal-color-preview.is-target').getAttribute('data-color'), cfg.targetColor);
      assert.match(await page.locator('.bimodal-color-guide').innerText(), /其他颜色不计数/);
      assert.equal(await page.locator('.batch-audio-tools button').count(), 2);
      const before = await page.evaluate(() => window.audioTones.length);
      await page.getByRole('button', { name: /^试听清亮音/ }).click();
      await page.getByRole('button', { name: /^试听柔和音/ }).click();
      assert.deepEqual(await page.evaluate(index => window.audioTones.slice(index).map(tone => tone.frequency), before), [880, 220]);
    }
    await page.getByRole('button', { name: level > 1 ? '继续' : `开始第 ${level} 关`, exact: true }).click();
    assert.equal(await page.locator('.bimodal-color-guide').count(), 0);
  }
  async function collectStream(page, count, exposure, read) {
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(await read());
      await page.clock.runFor(exposure + (i < count - 1 ? 180 : 200));
    }
    return values;
  }
  const previousObjects = new WeakMap();
  const flankerTargetKinds = new Set();
  async function solve(page, id, level, wrong = false) {
    const cfg = api.getConfig(id, level);
    if (id === 'tidal_treasures') {
      const seen = new Set();
      let first;
      for (let i = 0; i < cfg.count; i++) {
        const available = await page.locator('.batch-cell[data-object]').evaluateAll(cells => cells.map(cell => cell.dataset.object));
        const object = available.find(value => !seen.has(value)); first ||= object;
        await page.locator(`.batch-cell[data-object="${object}"]`).click(); seen.add(object);
        if (i < cfg.count - 1) {
          assert.equal(await page.locator('.tidal-wave').count(), 1);
          assert.equal(await page.locator('.batch-cell:enabled').count(), 0, 'Tide blocks repeated clicks');
          await page.clock.runFor(450);
          assert.equal(await page.locator('.batch-cell[data-object]').count(), cfg.count);
          assert.equal(await page.locator('.batch-cell:enabled').count(), 0);
          await page.clock.runFor(449);
          assert.equal(await page.locator('.tidal-wave').count(), 1);
          await page.clock.runFor(1);
          assert.equal(await page.locator('.tidal-wave').count(), 0);
          assert.equal(await page.locator('.batch-cell:enabled').count(), cfg.count);
        }
        if (wrong) { await page.locator(`.batch-cell[data-object="${first}"]`).click(); return; }
      }
    } else if (id === 'semantic_synthesis') {
      for (let index = 1; index < cfg.count; index++) {
        assert.equal(await page.locator('.batch-choice-row button:enabled').count(), 0, 'No answer until every word finishes');
        await page.clock.runFor(300);
      }
      const words = await page.evaluate(count => window.spokenWords.slice(-count), cfg.count);
      const categories = await page.locator('.batch-choice-row button').evaluateAll(nodes => nodes.map(node => node.dataset.choice));
      assert.equal(new Set(words).size, cfg.count);
      if (page.semanticCategories) {
        assert.equal(categories.filter(category => page.semanticCategories.includes(category)).length, Math.max(0, categories.length + page.semanticCategories.length - Object.keys(api.vocabulary).length), 'Browser rounds, upgrades and failure restarts must rotate categories');
      }
      page.semanticCategories = categories;
      const counts = categories.map(category => words.filter(word => api.vocabulary[category].includes(word)).length);
      const category = categories[counts.indexOf(Math.max(...counts))];
      await page.locator(`.batch-choice[data-choice="${wrong ? categories.find(value => value !== category) : category}"]`).click();
    } else if (id === 'schulte_ladder') {
      if (wrong) { await page.clock.runFor(cfg.limit); return; }
      for (let number = 1; number <= cfg.size ** 2; number++) await page.locator(`.batch-cell[data-number="${number}"]`).click();
    } else if (id === 'cambridge_decoder') {
      assert.equal(await page.locator('.batch-icon-slot').count(), 9);
      assert.equal(await page.locator('.batch-icon-slot img').count(), 0, 'All slots start blank');
      await page.clock.runFor(399);
      assert.equal(await page.locator('.batch-icon-slot img').count(), 0);
      await page.clock.runFor(1);
      assert.equal(await page.locator('.batch-icon-choice').count(), 0);
      const sequence = [];
      for (let shown = 0; shown < cfg.count; shown++) {
        assert.equal(await page.locator('.batch-icon-choice').count(), 0, 'Choices appear only after presentation');
        assert.equal(await page.locator('.batch-icon-slot img').count(), 1, 'Only the current icon is visible');
        const src = await page.locator(`.batch-icon-slot[data-order="${shown}"] img`).getAttribute('src');
        sequence.push(src.split('/').at(-1).replace('.svg', ''));
        if (shown < cfg.count - 1) {
          await page.clock.runFor(cfg.exposure);
          assert.equal(await page.locator('.batch-icon-slot img').count(), 0, 'Previous icon disappears before the next icon');
          await page.clock.runFor(180);
        }
      }
      await page.clock.runFor(cfg.exposure - 1);
      assert.equal(await page.locator('.batch-icon-slot img').count(), 1, 'Last icon uses the same display duration');
      assert.equal(await page.locator('.batch-icon-choice').count(), 0);
      await page.clock.runFor(1);
      assert.equal(await page.locator('.tidal-wave').count(), 1);
      assert.equal(await page.locator('.batch-icon-choice').count(), 0);
      await page.clock.runFor(450);
      assert.equal(await page.locator('.batch-icon-choice').count(), cfg.count);
      assert.equal(await page.locator('.batch-icon-choice:enabled').count(), 0);
      await page.clock.runFor(449);
      assert.equal(await page.locator('.tidal-wave').count(), 1);
      assert.equal(await page.locator('.batch-icon-choice:enabled').count(), 0);
      await page.clock.runFor(1);
      assert.equal(await page.locator('.tidal-wave').count(), 0);
      assert.equal(await page.locator('.batch-icon-choice:enabled').count(), cfg.count);
      const choices = await page.locator('.batch-icon-choice').evaluateAll(nodes => nodes.map(node => node.dataset.object));
      assert.equal(await page.locator('.decoder-grid > *').count(), 9);
      const geometry = await page.locator('.decoder-grid > *').evaluateAll(nodes => nodes.map(node => ({x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y})));
      assert.equal(new Set(geometry.map(cell => Math.round(cell.x))).size, 3);
      assert.equal(new Set(geometry.map(cell => Math.round(cell.y))).size, 3);
      assert.notDeepEqual(choices, sequence);
      if (cfg.reverse) sequence.reverse();
      if (wrong) { await page.locator(`.batch-icon-choice[data-object="${sequence[1]}"]`).click(); return; }
      for (const [index, object] of sequence.entries()) {
        await page.locator(`.batch-icon-choice[data-object="${object}"]`).click();
        assert.equal(await page.locator('.batch-icon-choice:disabled').count(), index + 1);
        assert.equal(await page.locator(`.batch-icon-choice[data-object="${object}"]`).isDisabled(), true);
        const selected = await page.locator(`.batch-icon-choice[data-object="${object}"]`).evaluate(node => ({highlighted: node.classList.contains('decoder-selected'), opacity: getComputedStyle(node.querySelector('img')).opacity, border: getComputedStyle(node).borderColor}));
        assert.equal(selected.highlighted, true); assert.equal(selected.opacity, '1'); assert.equal(selected.border, 'rgb(22, 163, 74)');
      }
    } else if (id === 'flanker_birds') {
      const direction = await page.locator('.batch-flanker-target').getAttribute('data-direction');
      const targetKind = await page.locator('.batch-flanker-target').getAttribute('data-object');
      flankerTargetKinds.add(targetKind);
      assert.match(await page.locator('.batch-flanker-target img').getAttribute('src'), new RegExp('/' + targetKind + '\\.svg$'));
      assert.equal(await page.locator('.batch-flanker-bird:not([data-object="bird"])').count(), cfg.distractors);
      await page.locator(`.batch-choice[data-choice="${wrong ? (direction === 'left' ? 'right' : 'left') : direction}"] span`).click();
    } else if (id === 'ufov_dual_field') {
      const center = Math.floor(cfg.size * cfg.size / 2);
      const object = (await page.locator(`.batch-cell[data-pos="${center}"] img`).getAttribute('src')).split('/').at(-1).replace('.svg', '');
      assert.notEqual(object, previousObjects.get(page)); previousObjects.set(page, object);
      const position = await page.locator('.batch-cell').filter({ has: page.locator('img[src="assets/distractions/star.svg"]') }).getAttribute('data-pos');
      const heart = cfg.triple ? await page.locator('.batch-cell').filter({ has: page.locator('img[src="assets/distractions/heart.svg"]') }).getAttribute('data-pos') : null;
      assert.equal(await page.locator('.ufov-object-choice').count(), 0, 'Options must be absent during observation');
      assert.equal(await page.locator('.batch-cell:enabled').count(), 0);
      await page.clock.runFor(cfg.exposure - 1);
      assert.equal(await page.locator('.batch-grid img').count(), (cfg.triple ? 3 : 2) + cfg.distractors, 'Targets and distractors remain visible until the exposure deadline');
      await page.clock.runFor(1);
      assert.equal(await page.locator('.batch-grid img').count(), 0, 'Targets hide at the exposure deadline');
      await page.clock.runFor(199);
      assert.equal(await page.locator('.ufov-object-choice').count(), 0, 'Options must be absent during retention');
      await page.clock.runFor(1);
      assert.equal(await page.locator('.ufov-object-choice').count(), cfg.options);
      const optionRows = await page.locator('.ufov-object-choice').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().y)));
      assert.equal(new Set(optionRows).size, 1, 'All object choices fit on one row');
      const options = await page.locator('.ufov-object-choice').evaluateAll(nodes => nodes.map(node => node.dataset.choice));
      await page.locator(`.batch-choice[data-choice="${wrong ? options.find(value => value !== object) : object}"]`).click();
      if (!wrong) {
        assert.match(await page.locator('#batch-status').innerText(), /中心图形正确/);
        assert.equal(await page.locator(`.batch-cell[data-pos="${center}"].matrix-correct img`).count(), 1);
        assert.equal(await page.locator('.ufov-choice-correct').count(), 1);
        await page.locator(`.batch-cell[data-pos="${position}"]`).click();
        assert.equal(await page.locator(`.batch-cell[data-pos="${position}"].matrix-correct img[src="assets/distractions/star.svg"]`).count(), 1);
        assert.match(await page.locator('#batch-status').innerText(), /星星位置正确/);
        if (cfg.triple) {
          assert.match(await page.locator('#batch-status').innerText(), /心形/);
          await page.locator(`.batch-cell[data-pos="${heart}"]`).click();
          assert.equal(await page.locator(`.batch-cell[data-pos="${heart}"].matrix-correct img[src="assets/distractions/heart.svg"]`).count(), 1);
          assert.match(await page.locator('#batch-status').innerText(), /心形位置正确/);
        }
      }
    } else {
      assert.equal(await page.locator('.bimodal-count-options button:enabled').count(), 0);
      const tonesBeforeCountdown = await page.evaluate(() => window.audioTones.length);
      for (const number of [3, 2, 1]) {
        assert.equal(await page.locator('.bimodal-countdown').innerText(), String(number));
        assert.equal(await page.locator('.batch-visual-target').count(), 0);
        assert.equal(await page.locator('.bimodal-count-options button:enabled').count(), 0);
        assert.equal(await page.evaluate(() => window.audioTones.length), tonesBeforeCountdown);
        await page.clock.runFor(1000);
      }
      const steps = await collectStream(page, cfg.count, cfg.exposure, async () => ({
        color: await page.locator('.batch-visual-target').getAttribute('data-color'),
        sound: await page.evaluate(() => window.audioTones.filter(tone => tone.frequency === 880 || tone.frequency === 220).at(-1).frequency === 880 ? 'clear' : 'soft')
      }));
      const color = steps.filter(step => step.color === cfg.targetColor).length;
      await page.locator('[data-choice="color-' + (wrong ? (color + 1) % (cfg.count + 1) : color) + '"]').click();
      await page.locator('[data-choice="sound-' + steps.filter(step => step.sound === cfg.targetSound).length + '"]').click();
      assert.equal(await page.locator('.bimodal-count-selected').count(), 2);
      await page.locator('[data-choice="submit"]').click();
    }
  }
  try {
    const schulte = await createPage('schulte_ladder'); await start(schulte, 1);
    const board = await schulte.locator('.batch-cell').allTextContents();
    await schulte.locator('.batch-cell[data-number="1"]').click();
    await schulte.clock.runFor(3000);
    await schulte.locator('.batch-cell[data-number="3"]').click();
    assert.equal(await schulte.locator('.heart.active').count(), 3, 'Wrong number must not cost a heart');
    assert.deepEqual(await schulte.locator('.batch-cell').allTextContents(), board, 'Wrong number must preserve the board');
    assert.equal(await schulte.locator('.batch-cell[data-number="1"]').isDisabled(), true);
    assert.match(await schulte.locator('#batch-status').innerText(), /点错.*2/);
    assert.match(await schulte.locator('#timer-badge').innerText(), /12.0/);
    await schulte.clock.runFor(1000);
    assert.match(await schulte.locator('#timer-badge').innerText(), /11.0/);
    for (let number = 2; number <= 9; number++) await schulte.locator(`.batch-cell[data-number="${number}"]`).click();
    await schulte.clock.runFor(1200);
    assert.match(await schulte.locator('#level-badge').innerText(), /L2/);
    await schulte.close(); console.log('Schulte wrong click preserves hearts, board, progress and deadline; continuation upgrades passed');
    const flanker = await createPage('flanker_birds'); await start(flanker, 1);
    await flanker.keyboard.press('ArrowUp'); assert.equal(await flanker.locator('.heart.active').count(), 3);
    assert.equal(await flanker.locator('.batch-flanker-target').count(), 1);
    const firstBirds = await flanker.locator('.batch-flanker-bird').evaluateAll(nodes => nodes.map(node => node.dataset.direction));
    const firstTarget = await flanker.locator('.batch-flanker-bird').evaluateAll(nodes => nodes.findIndex(node => node.classList.contains('batch-flanker-target')));
    await solve(flanker, 'flanker_birds', 1); await flanker.clock.runFor(600);
    const nextBirds = await flanker.locator('.batch-flanker-bird').evaluateAll(nodes => nodes.map(node => node.dataset.direction));
    const nextTarget = await flanker.locator('.batch-flanker-bird').evaluateAll(nodes => nodes.findIndex(node => node.classList.contains('batch-flanker-target')));
    assert.notEqual(firstTarget, nextTarget); assert(nextBirds.filter((direction, index) => direction !== firstBirds[index]).length > firstBirds.length / 2);
    assert((await flanker.locator('[data-choice="left"]').boundingBox()).height >= 80);
    assert.match(await flanker.locator('#timer-badge').innerText(), /19.4/);
    await flanker.clock.runFor(19300);
    await solve(flanker, 'flanker_birds', 1); await flanker.clock.runFor(100);
    assert.equal(await flanker.locator('.heart.active').count(), 2, 'Deadline during a round transition must fail');
    assert.match(await flanker.locator('#batch-progress').innerText(), /0\/8/);
    await flanker.clock.runFor(2000);
    assert.match(await flanker.locator('#timer-badge').innerText(), /20.0/);
    await flanker.locator('#game-select').evaluate(select => { select.value = 'nback_flow'; select.dispatchEvent(new Event('change')); });
    await flanker.clock.runFor(60000); assert.equal(await flanker.locator('.heart.active').count(), 3);
    await flanker.close(); console.log('Flanker level-wide countdown, transition deadline, restart and switch cleanup passed');
    const keyboard = await createPage('flanker_birds', 390, 6); await start(keyboard, 6);
    assert.equal(await keyboard.locator('.batch-choice-row button').count(), 4);
    for (let index = 0; index < 12; index++) {
      const direction = await keyboard.locator('.batch-flanker-target').getAttribute('data-direction');
      const keys = index % 3 === 0 ? { left: 'a', right: 'd', up: 'w', down: 's' } : index % 3 === 1 ? { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' } : { left: 'Numpad4', right: 'Numpad6', up: 'Numpad8', down: 'Numpad2' };
      await keyboard.keyboard.press(keys[direction]);
      assert.match(await keyboard.locator('#batch-progress').innerText(), new RegExp(`${index + 1}/18`));
      await keyboard.clock.runFor(600);
    }
    const direction = await keyboard.locator('.batch-flanker-target').getAttribute('data-direction');
    await keyboard.evaluate(value => window.dispatchEvent(new KeyboardEvent('keydown', { key: { left: 'a', right: 'd', up: 'w', down: 's' }[value], repeat: true, bubbles: true })), direction);
    assert.match(await keyboard.locator('#batch-progress').innerText(), /12\/18/);
    await keyboard.locator('#game-select').evaluate(select => { select.value = 'nback_flow'; select.dispatchEvent(new Event('change')); });
    await keyboard.keyboard.press('ArrowRight'); assert.equal(await keyboard.locator('.heart.active').count(), 3);
    await keyboard.close(); console.log('Flanker four-way keys, WASD, numpad, repeat and cross-game keyboard guards passed');
    await Promise.all(api.definitions.map(async ([id]) => {
      const page = await createPage(id);
      const maxLevel = ['ufov_dual_field', 'cambridge_decoder'].includes(id) ? 14 : 10;
      for (let level = 1; level <= maxLevel; level++) {
        await start(page, level);
        for (let round = 0; round < api.getConfig(id, level).required; round++) {
          await solve(page, id, level);
          const count = api.getConfig(id, level).count;
          assert.match(await page.locator('#batch-progress').innerText(), new RegExp(id === 'tidal_treasures' ? `${count}/${count}` : `${round + 1}/${api.getConfig(id, level).required}`));
          await page.clock.runFor(600);
        }
        if (level < maxLevel) await page.clock.runFor(600);
      }
      assert.equal(await page.locator('#report-modal').isVisible(), true);
      const report = await page.evaluate(() => window.results[0]);
      assert.equal(report.gameId, id); assert.equal(report.level, maxLevel);
      console.log(`${id}: full ${maxLevel}-level journey and report passed`); await page.close();
    }));
    await Promise.all(api.definitions.map(async ([id]) => {
      const page = await createPage(id, 320);
      await start(page, 1);
      if (!['tidal_treasures', 'schulte_ladder'].includes(id)) { await solve(page, id, 1); await page.clock.runFor(600); }
      for (let mistake = 1; mistake <= 3; mistake++) {
        await solve(page, id, 1, true);
        assert.equal(await page.locator('.heart.active').count(), 3 - mistake);
        assert.equal(await page.locator('#report-modal').isVisible(), mistake === 3);
        if (mistake < 3) {
          assert.match(await page.locator('#batch-progress').innerText(), id === 'tidal_treasures' ? /0\/4/ : id === 'schulte_ladder' ? /0\/1/ : ['semantic_synthesis', 'cambridge_decoder'].includes(id) ? /0\/3/ : id === 'flanker_birds' ? /0\/8/ : /0\/5/);
          assert.equal(await page.locator('.batch-error-notice').isVisible(), true);
          await page.clock.runFor(2000);
        }
      }
      await page.clock.runFor(60000);
      assert.equal(await page.locator('#report-modal').isVisible(), true);
      console.log(`${id}: streak reset, three-error failure and timer cleanup passed`); await page.close();
    }));
    for (const id of ['schulte_ladder', 'flanker_birds']) {
      const page = await createPage(id); await start(page, 1);
      await page.clock.runFor(api.getConfig(id, 1).limit);
      assert.equal(await page.locator('.heart.active').count(), 2);
      assert.equal(await page.locator('.batch-error-notice').isVisible(), true); await page.close();
    }
    const speech = await createPage('semantic_synthesis');
    await speech.evaluate(() => { window.failSpeech = true; }); await start(speech, 1);
    assert.match(await speech.locator('#batch-status').innerText(), /声音暂不可用/);
    assert.equal(await speech.getByRole('button', { name: '文字练习', exact: true }).count(), 0);
    assert.equal(await speech.getByRole('button', { name: '再听一次', exact: true }).count(), 0);
    assert.equal(await speech.locator('.semantic-category-row button:enabled').count(), 0);
    assert.equal(await speech.locator('.semantic-voice-animation.is-playing').count(), 0);
    await speech.evaluate(() => { window.failSpeech = false; });
    await speech.locator('#game-select').evaluate(select => { select.value = 'semantic_synthesis'; select.dispatchEvent(new Event('change')); });
    await start(speech, 1);
    assert.match(await speech.locator('#batch-status').innerText(), /听词语 1\/5/);
    await solve(speech, 'semantic_synthesis', 1); await speech.clock.runFor(600);
    await speech.locator('#game-select').evaluate(select => { select.value = 'nback_flow'; select.dispatchEvent(new Event('change')); });
    await speech.clock.runFor(60000); assert.equal(await speech.locator('.heart.active').count(), 3); await speech.close();
    assert(flankerTargetKinds.has('bird'));
    assert([...flankerTargetKinds].some(kind => kind !== 'bird'), 'Animals/stationery can also be the underlined target');
    assert.deepEqual(errors, []);
    console.log('All seven masters: generators, gameplay, complete levels, errors, deadlines, speech fallback and bridge passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
