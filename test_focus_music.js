const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.Audio = class extends NativeAudio {
        constructor(...args) { super(...args); if (!args.length) window.musicAudio = this; }
      };
    });
    await page.goto('http://127.0.0.1:8080/focus.html');
    await page.getByRole('link', {name: /01 · N-Back/}).click();
    await page.waitForFunction(() => window.musicAudio && !musicAudio.paused && musicAudio.readyState >= 2);
    const songs = new Set();
    const ids = await page.locator('#game-select option').evaluateAll(nodes => nodes.map(node => node.value));
    for (const id of ids) {
      await page.locator('#game-select').selectOption(id);
      songs.add(await page.evaluate(() => musicAudio.src));
    }
    assert.equal(songs.size, 20);
    await page.locator('#game-select').selectOption('nback_flow');
    await page.locator('#focus-music-controls select').selectOption('tense');
    assert.match(await page.evaluate(() => musicAudio.src), /curious-path/);
    await page.locator('#focus-music-controls button').click();
    assert(await page.evaluate(() => musicAudio.paused));
    await page.reload();
    assert.equal(await page.locator('#focus-music-controls button').getAttribute('aria-pressed'), 'false');
    await page.locator('#focus-music-controls button').click();
    await page.locator('#game-select').selectOption('semantic_synthesis');
    await page.locator('#game-controls button').first().click();
    assert(await page.evaluate(() => musicAudio.paused));
    assert.match(await page.locator('#focus-music-controls small').innerText(), /听觉/);
    assert.equal(await page.getByRole('button', {name: '文字练习', exact: true}).count(), 0);
    await page.waitForFunction(() => !musicAudio.paused);
    await page.locator('#game-select').selectOption('bimodal_divert');
    await page.locator('#game-controls button').first().click();
    assert(await page.evaluate(() => musicAudio.paused));
    await page.waitForFunction(() => !musicAudio.paused, {timeout: 12000});
    await page.locator('#focus-home-btn').click();
    assert(await page.evaluate(() => musicAudio.paused));
    await page.goto('http://127.0.0.1:8080/music-library.html');
    await page.waitForSelector('audio');
    assert.equal(await page.locator('audio').count(), 30);
    const catalog = JSON.parse(fs.readFileSync('assets/focus-music/catalog.json', 'utf8'));
    assert.equal(catalog.filter(song => song.mood === 'relaxed').length, 15);
    const decoded = await page.evaluate(async tracks => {
      const context = new AudioContext();
      const results = [];
      for (const track of tracks) {
        const response = await fetch('assets/focus-music/' + track.file);
        const audio = await context.decodeAudioData(await response.arrayBuffer());
        const samples = audio.getChannelData(0);
        let peak = 0, square = 0;
        for (const sample of samples) { peak = Math.max(peak, Math.abs(sample)); square += sample * sample; }
        results.push({file: track.file, duration: audio.duration, peak, rms: Math.sqrt(square / samples.length)});
      }
      await context.close(); return results;
    }, catalog);
    for (const song of decoded) { assert(song.duration > 30 && song.duration < 46); assert(song.peak < .8); assert(song.rms > .03); }
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('30 MP3s decoded; 20 distinct game assignments; mood, mute persistence, auditory pause/resume and home stop passed');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
