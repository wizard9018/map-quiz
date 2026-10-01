const assert = require('node:assert/strict');
const api = require('./focus-history');
const { chromium } = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const games = [{ id: 'nback_flow', title: 'N-Back' }, { id: 'matrix_flash', title: '空间网格' }];
const now = new Date(2026, 8, 30, 23, 59).getTime();
const records = [
  { gameId: 'nback_flow', timestamp: new Date(2026, 8, 30, 0, 1).getTime(), level: 3, score: 65 },
  { gameId: 'nback_flow', timestamp: now, level: 2, score: 50 },
  { gameId: 'matrix_flash', timestamp: now, level: 5, score: 80 },
  { gameId: 'nback_flow', timestamp: new Date(2026, 8, 24, 12).getTime(), level: 1, score: 30 },
  { gameId: 'nback_flow', timestamp: new Date(2026, 8, 23, 12).getTime(), level: 12, score: 99 }
];
assert.deepEqual(api.summarize(records, games, now).map(row => [row.count, row.level, row.score]), [[2, 3, 50], [1, 5, 80]]);
assert.deepEqual(api.week(records, 'nback_flow', now).map(day => day.level), [1, null, null, null, null, null, 3]);
assert.equal(api.week(records, 'nback_flow', now)[6].date, '2026-09-30');
assert.equal(api.summarize(records, games, new Date(2026, 9, 1)).every(row => row.count === 0), true);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://res.wx.qq.com/**', route => route.fulfill({ body: 'window.wx={miniProgram:{postMessage(){}}}' }));
  await page.goto('http://127.0.0.1:8080/focus.html?v=local21');
  assert.equal(await page.locator('.focus-game-entry').count(), 20);
  assert.equal(await page.locator('#game-select option').count(), 20);
  assert.equal(await page.locator('#home-history tbody tr').count(), 20);
  assert.equal(await page.locator('#home-history tbody tr').first().locator('td').nth(1).innerText(), '0');
  await page.locator('.focus-game-entry').nth(9).click();
  assert.equal(await page.locator('#focus-home').isVisible(), false);
  await page.locator('#btn-test-fail').click();
  assert.equal(await page.locator('#report-modal').isVisible(), true);
  const result = await page.evaluate(() => FocusHistory.read());
  assert.equal(result.length, 1); assert.equal(result[0].gameId, 'bimodal_divert');
  assert.equal(await page.locator('#report-history tbody tr').nth(9).locator('td').nth(1).innerText(), '1');
  assert.equal(await page.locator('#report-history circle').count(), 1);
  await page.evaluate(() => document.getElementById('btn-test-fail').click());
  assert.equal(await page.evaluate(() => FocusHistory.read().length), 1, 'Finishing twice must not duplicate a result');
  await page.locator('#report-home-btn').click();
  assert.equal(await page.locator('#focus-home').isVisible(), true);
  await page.reload();
  assert.equal(await page.locator('#home-history tbody tr').nth(9).locator('td').nth(1).innerText(), '1');
  await page.locator('#home-history select').selectOption('nback_flow');
  assert.equal(await page.locator('#home-history circle').count(), 0);
  await page.goto('http://127.0.0.1:8080/focus.html?game=schulte_classic');
  assert.equal(await page.locator('#game-select').inputValue(), 'nback_flow');
  await page.locator('#next-btn').click(); assert.equal(await page.locator('#game-select').inputValue(), 'matrix_flash');
  await page.locator('#prev-btn').click(); assert.equal(await page.locator('#game-select').inputValue(), 'nback_flow');
  await page.locator('[data-academy="control"]').click();
  assert.equal(await page.locator('#game-select option').count(), 5);
  await page.locator('#prev-btn').click(); assert.equal(await page.locator('#game-select').inputValue(), 'wcst_rule_switch');
  await page.locator('#next-btn').click(); assert.equal(await page.locator('#game-select').inputValue(), 'stroop_dimension');
  await page.locator('#focus-home-btn').click();
  await page.locator('.focus-game-entry').nth(15).click();
  assert.equal(await page.locator('#game-select').inputValue(), 'mot_trajectory');
  assert.equal(await page.locator('#game-select option').count(), 20);
  await page.goto('http://127.0.0.1:8080/index.html?tab=focus');
  const frame = page.frameLocator('.focus-frame');
  await frame.locator('.focus-game-entry').first().waitFor();
  assert.equal(await frame.locator('.focus-game-entry').count(), 20);
  assert.equal(await frame.locator('#home-history tbody tr').nth(9).locator('td').nth(1).innerText(), '1');
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Focus: 20-game website entry, local result persistence, duplicate guard, daily rollover, seven-day gaps, game selection and website iframe passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
