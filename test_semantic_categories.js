const assert = require('node:assert/strict');
const api = require('./focus-batch-games');
const {chromium} = require('C:/Users/wizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const width of [320,1280]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.clock.install(); await page.clock.pauseAt(new Date());
      await page.addInitScript(() => {
        const NativeAudio = window.Audio;
        window.Audio = class {
          constructor(src) { if (!src || !src.includes('/word-')) return new NativeAudio(src || ''); }
          pause() {}
          play() { return Promise.resolve().then(() => { if (this.onended) this.onended(); }); }
        };
      });
      await page.route('https://res.wx.qq.com/**', route => route.fulfill({body:''}));
      await page.goto('http://127.0.0.1:8080/focus.html?game=semantic_synthesis');
      let previous;
      for (let level = 1; level <= 10; level++) {
        const count = [5,7,9,7,9,11,9,11,13,15][level-1];
        const categories = level <= 3 ? 2 : level <= 6 ? 3 : 4;
        const cfg = api.getConfig('semantic_synthesis',level);
        assert.equal(cfg.count,count); assert.equal(cfg.categoryCount,categories);
        for (let run=0; run<50; run++) {
          const trial = api.generateTrial('semantic_synthesis',level,previous);
          assert.equal(new Set(trial.words.map(item=>item.word)).size,count);
          assert.equal(trial.categories.length,categories);
          const counts = trial.categories.map(category=>trial.words.filter(word=>word.category===category).length);
          assert.equal(counts.filter(value=>value===Math.max(...counts)).length,1);
          if (previous) assert.notDeepEqual([...trial.categories].sort(),[...previous.categories].sort());
          previous=trial;
        }
        await page.locator('#level-select').selectOption(String(level));
        await page.locator('#game-controls button').first().click();
        const options = page.locator('.semantic-category-row button');
        assert.equal(await options.count(),categories);
        const bounds = await options.evaluateAll(nodes=>nodes.map(node=>{
          const box=node.getBoundingClientRect();
          return {x:box.x,y:box.y,width:box.width,overflow:node.scrollWidth>node.clientWidth,icon:node.querySelector('.semantic-category-icon').textContent};
        }));
        assert(bounds.every(box=>Math.abs(box.y-bounds[0].y)<1 && box.x>=0 && box.x+box.width<=width && !box.overflow && box.icon));
        assert.equal(await page.locator('.semantic-category-row button:enabled').count(),0);
        assert.equal(await page.getByRole('button',{name:'文字练习',exact:true}).count(),0);
        assert.equal(await page.getByRole('button',{name:'再听一次',exact:true}).count(),0);
        await page.clock.runFor(count*300);
        assert.equal(await page.locator('.semantic-category-row button:enabled').count(),categories);
      }
      await page.screenshot({path:`scratch/semantic-categories-${width}.png`});
      await page.close();
    }
    console.log('Game 5: 10 level configs, unique words and majority, changing categories, one-row icons at 320/1280 widths and answer lockout passed');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
