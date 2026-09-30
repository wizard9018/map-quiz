const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const words = Object.values(require('./focus-batch-games').vocabulary).flat();
for (let index = 1; index <= words.length; index++) {
  const bytes = fs.readFileSync(path.join(__dirname, 'assets/semantic-audio', `word-${String(index).padStart(2, '0')}.wav`));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let data;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4);
    if (bytes.toString('ascii', offset, offset + 4) === 'data') data = bytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  assert(data && data.length > 1000, `Missing recording for ${words[index - 1]}`);
  assert(data.some(byte => byte !== 0), `Silent recording for ${words[index - 1]}`);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.playedWords = [];
      const NativeAudio = window.Audio;
      window.Audio = class extends NativeAudio {
        constructor(src) {
          super(src);
          this.addEventListener('ended', () => window.playedWords.push(src));
        }
      };
      Object.defineProperty(window, 'speechSynthesis', { value: undefined });
    });
    await page.route('https://res.wx.qq.com/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.wx={miniProgram:{postMessage(){}}};' }));
    await page.goto('http://127.0.0.1:8080/focus.html?game=semantic_synthesis&miniprogram=1&v=local9');
    await page.getByRole('button', { name: '开始第 1 关', exact: true }).click();
    assert.equal(await page.locator('.batch-choice-row button:enabled').count(), 0);
    await page.waitForFunction(() => window.playedWords.length === 5);
    assert.equal(await page.locator('#batch-word').innerText(), '哪个类别出现最多？');
    await page.getByRole('button', { name: '文字练习', exact: true }).click();
    assert.match(await page.locator('#batch-status').innerText(), /文字练习/);
    await page.getByRole('button', { name: '再听一次', exact: true }).click();
    await page.waitForFunction(() => window.playedWords.length === 10);
    assert.equal(await page.locator('#batch-word').innerText(), '哪个类别出现最多？');
    assert.match(await page.locator('#batch-status').innerText(), /请选择出现次数最多/);
    assert.equal(await page.evaluate(() => JSON.stringify(window.playedWords.slice(0, 5)) === JSON.stringify(window.playedWords.slice(5))), true);
    console.log('36 nonempty WAV recordings, real browser audio playback without SpeechSynthesis, replay from text mode passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
