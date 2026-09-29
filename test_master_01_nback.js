// test_master_01_nback.js - 母版 01 N-Back 工作记忆刷新流核心算法单元测试
const assert = require('assert');

function getNForLevel(lvl) {
  if (lvl <= 3) return 1;
  if (lvl <= 7) return 2;
  return 3;
}

// 符号库
const ICONS_POOL = [
  { id: 'rocket', icon: '🚀', label: '火箭' },
  { id: 'star', icon: '⭐', label: '星星' },
  { id: 'cat', icon: '🐱', label: '小猫' },
  { id: 'apple', icon: '🍎', label: '苹果' },
  { id: 'ball', icon: '⚽', label: '足球' },
  { id: 'diamond', icon: '💎', label: '钻石' }
];

function getRandomItem(lvl) {
  const iconObj = ICONS_POOL[Math.floor(Math.random() * ICONS_POOL.length)];
  const pos = Math.floor(Math.random() * 9); // 0~8 九宫格坐标
  return {
    pos: pos,
    icon: iconObj.icon,
    id: iconObj.id
  };
}

// 判定标准：九宫格位置 pos 与 图标 id 必须【两者同时相同】才算真正匹配
function isStimulusEqual(a, b) {
  if (!a || !b) return false;
  return a.pos === b.pos && a.id === b.id;
}

function generateNBackSequence(lvl, totalSteps = 14, targetRatio = 0.35) {
  const n = getNForLevel(lvl);
  const sequence = [];

  for (let i = 0; i < totalSteps; i++) {
    let item;
    let expectedMatch = false;

    if (i < n) {
      item = getRandomItem(lvl);
      expectedMatch = false;
    } else {
      const prev = sequence[i - n].item;
      const matchPrev = Math.random() < targetRatio;

      if (matchPrev) {
        // 真匹配：位置与图标 100% 相同
        item = { pos: prev.pos, icon: prev.icon, id: prev.id };
        expectedMatch = true;
      } else {
        // 伪匹配 / 干扰项 (Lure)：
        // 构造高价值干扰项（同位异图 或 异位同图），深度考验前额叶特征绑定
        const lureType = Math.random();
        if (lureType < 0.35) {
          // 同位置，不同图标
          const otherIcons = ICONS_POOL.filter(ic => ic.id !== prev.id);
          const pick = otherIcons[Math.floor(Math.random() * otherIcons.length)];
          item = { pos: prev.pos, icon: pick.icon, id: pick.id };
        } else if (lureType < 0.70) {
          // 不同位置，相同图标
          const otherPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(p => p !== prev.pos);
          const pickPos = otherPositions[Math.floor(Math.random() * otherPositions.length)];
          item = { pos: pickPos, icon: prev.icon, id: prev.id };
        } else {
          // 位置与图标均不同
          const otherPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(p => p !== prev.pos);
          const otherIcons = ICONS_POOL.filter(ic => ic.id !== prev.id);
          const pickPos = otherPositions[Math.floor(Math.random() * otherPositions.length)];
          const pickIcon = otherIcons[Math.floor(Math.random() * otherIcons.length)];
          item = { pos: pickPos, icon: pickIcon.icon, id: pickIcon.id };
        }
        expectedMatch = false;
      }
    }

    sequence.push({
      step: i,
      item: item,
      expectedMatch: expectedMatch
    });
  }

  return { n, sequence };
}

// ---------------- 单元测试套件 ----------------

function runTests() {
  console.log('>>> [母版 01 N-Back 九宫格+图标双重绑定] 开始运行单元测试...');

  // 测试 1: 关卡 N 值分配
  assert.strictEqual(getNForLevel(1), 1, 'L1 应为 1-Back');
  assert.strictEqual(getNForLevel(3), 1, 'L3 应为 1-Back');
  assert.strictEqual(getNForLevel(4), 2, 'L4 应为 2-Back');
  assert.strictEqual(getNForLevel(8), 3, 'L8 应为 3-Back');
  console.log('✅ 测试 1 通过: 1~10 关 N 值映射符合规划');

  // 测试 2: 序列生成与位置+图标双重精确比对
  [1, 2, 3, 4, 5, 8, 10].forEach(lvl => {
    const { n, sequence } = generateNBackSequence(lvl, 20, 0.35);
    assert.strictEqual(sequence.length, 20);

    for (let i = n; i < sequence.length; i++) {
      const current = sequence[i].item;
      const prevN = sequence[i - n].item;
      const actualMatch = isStimulusEqual(current, prevN);
      assert.strictEqual(
        sequence[i].expectedMatch,
        actualMatch,
        `L${lvl} 第 ${i} 步判定不一致: expected=${sequence[i].expectedMatch}, actual=${actualMatch}`
      );
    }
  });
  console.log('✅ 测试 2 通过: 全关卡 expectedMatch 与 [位置+图标] 必须同时一致');

  // 测试 3: 干扰项 (Lure) 校验：同位不同图、同图不同位均严格判定为 false
  const dummy1 = { pos: 4, icon: '🚀', id: 'rocket' };
  const dummySamePosDiffIcon = { pos: 4, icon: '⭐', id: 'star' };
  const dummyDiffPosSameIcon = { pos: 2, icon: '🚀', id: 'rocket' };
  const dummySameBoth = { pos: 4, icon: '🚀', id: 'rocket' };

  assert.strictEqual(isStimulusEqual(dummy1, dummySamePosDiffIcon), false, '同位不同图不可判为匹配');
  assert.strictEqual(isStimulusEqual(dummy1, dummyDiffPosSameIcon), false, '异位同图不可判为匹配');
  assert.strictEqual(isStimulusEqual(dummy1, dummySameBoth), true, '同位同图必须判为匹配');
  console.log('✅ 测试 3 通过: 干扰诱饵项 (同位异图/异位同图) 均正确拦截');

  // 测试 4: 靶向匹配率蒙特卡洛统计
  let totalTargets = 0;
  let totalComparisons = 0;
  for (let s = 0; s < 200; s++) {
    const { n, sequence } = generateNBackSequence(1, 15, 0.35);
    for (let i = n; i < sequence.length; i++) {
      totalComparisons++;
      if (sequence[i].expectedMatch) totalTargets++;
    }
  }
  const measuredRatio = totalTargets / totalComparisons;
  console.log(`📊 蒙特卡洛实测匹配率: ${(measuredRatio * 100).toFixed(2)}% (预期 35%)`);
  assert(measuredRatio >= 0.28 && measuredRatio <= 0.42);
  console.log('✅ 测试 4 通过: 匹配率统计平稳');

  console.log('🎉 母版 01 N-Back [九宫格位置+图标双重特征绑定] 算法验证全通！');
}

runTests();

module.exports = {
  getNForLevel,
  ICONS_POOL,
  getRandomItem,
  isStimulusEqual,
  generateNBackSequence
};
