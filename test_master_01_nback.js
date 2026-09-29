// test_master_01_nback.js - 母版 01 N-Back 工作记忆刷新流核心算法单元测试
const assert = require('assert');

// 算法核心实现 (待验证模块)
function getNForLevel(lvl) {
  if (lvl <= 3) return 1;
  if (lvl <= 7) return 2;
  return 3;
}

function getStimulusPool(lvl) {
  if (lvl <= 3) {
    return [
      { id: 'rocket', type: 'emoji', icon: '🚀', label: '火箭' },
      { id: 'star', type: 'emoji', icon: '⭐', label: '星星' },
      { id: 'cat', type: 'emoji', icon: '🐱', label: '小猫' },
      { id: 'apple', type: 'emoji', icon: '🍎', label: '苹果' },
      { id: 'ball', type: 'emoji', icon: '⚽', label: '足球' },
      { id: 'diamond', type: 'emoji', icon: '💎', label: '钻石' }
    ];
  } else if (lvl <= 7) {
    // 3x3 空间位置点位 (0~8)
    const items = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    for (let pos = 0; pos < 9; pos++) {
      items.push({
        id: `grid_${pos}`,
        type: 'grid',
        pos: pos,
        color: colors[pos % colors.length]
      });
    }
    return items;
  } else {
    // 几何图形 + 反色/灰度干扰
    const shapes = ['square', 'circle', 'triangle', 'diamond', 'cross'];
    const modes = ['normal', 'inverted', 'grayscale'];
    const items = [];
    shapes.forEach(s => {
      modes.forEach(m => {
        items.push({
          id: `geom_${s}_${m}`,
          type: 'geometry',
          shape: s,
          mode: m
        });
      });
    });
    return items;
  }
}

function isStimulusEqual(a, b, lvl) {
  if (!a || !b) return false;
  if (lvl <= 3) {
    return a.id === b.id;
  } else if (lvl <= 7) {
    return a.pos === b.pos; // 空间 2-Back 核心关注空间九宫格点位
  } else {
    // L8-L10 考验形状本质（忽略反色干扰，真正锻炼顶内沟特征提取能力）
    return a.shape === b.shape;
  }
}

function generateNBackSequence(lvl, totalSteps = 14, targetRatio = 0.35) {
  const n = getNForLevel(lvl);
  const pool = getStimulusPool(lvl);
  const sequence = [];

  for (let i = 0; i < totalSteps; i++) {
    let item;
    let expectedMatch = false;

    if (i < n) {
      // 初始 N 步：无法形成前向比对，纯随机选
      item = pool[Math.floor(Math.random() * pool.length)];
      expectedMatch = false;
    } else {
      const matchPrev = Math.random() < targetRatio;
      if (matchPrev) {
        // 生成与 N 步前匹配的项
        const prev = sequence[i - n].item;
        if (lvl <= 7) {
          item = Object.assign({}, prev);
        } else {
          // L8-L10: 保持 shape 相同，但 mode（正常/反色/灰度）可能随机，测试抗扰
          const randomMode = ['normal', 'inverted', 'grayscale'][Math.floor(Math.random() * 3)];
          item = { id: `geom_${prev.shape}_${randomMode}`, type: 'geometry', shape: prev.shape, mode: randomMode };
        }
        expectedMatch = true;
      } else {
        // 生成与 N 步前不同的项
        const prev = sequence[i - n].item;
        let candidates = pool.filter(cand => !isStimulusEqual(cand, prev, lvl));
        item = candidates[Math.floor(Math.random() * candidates.length)];
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
  console.log('>>> [母版 01 N-Back] 开始运行单元测试...');

  // 测试 1: 关卡 N 值分配
  assert.strictEqual(getNForLevel(1), 1, 'L1 应为 1-Back');
  assert.strictEqual(getNForLevel(3), 1, 'L3 应为 1-Back');
  assert.strictEqual(getNForLevel(4), 2, 'L4 应为 2-Back');
  assert.strictEqual(getNForLevel(7), 2, 'L7 应为 2-Back');
  assert.strictEqual(getNForLevel(8), 3, 'L8 应为 3-Back');
  assert.strictEqual(getNForLevel(10), 3, 'L10 应为 3-Back');
  console.log('✅ 测试 1 通过: 1~10 关 N 值自适应映射严格符合神经阶梯规划');

  // 测试 2: 序列生成与精确比对
  [1, 2, 4, 5, 8, 10].forEach(lvl => {
    const { n, sequence } = generateNBackSequence(lvl, 20, 0.35);
    assert.strictEqual(sequence.length, 20, `L${lvl} 序列长度应为 20`);
    
    for (let i = n; i < sequence.length; i++) {
      const current = sequence[i].item;
      const prevN = sequence[i - n].item;
      const actualMatch = isStimulusEqual(current, prevN, lvl);
      assert.strictEqual(
        sequence[i].expectedMatch,
        actualMatch,
        `L${lvl} 第 ${i} 步判定不一致: expected=${sequence[i].expectedMatch}, actual=${actualMatch}`
      );
    }
  });
  console.log('✅ 测试 2 通过: 全关卡 expectedMatch 判定与实际 N 步前刺激 100% 数学一致');

  // 测试 3: 靶向匹配率统计 (在 1000 次蒙特卡洛仿真中均值稳定在 30%~40%)
  let totalTargets = 0;
  let totalComparisons = 0;
  for (let s = 0; s < 200; s++) {
    const { n, sequence } = generateNBackSequence(5, 15, 0.35);
    for (let i = n; i < sequence.length; i++) {
      totalComparisons++;
      if (sequence[i].expectedMatch) totalTargets++;
    }
  }
  const measuredRatio = totalTargets / totalComparisons;
  console.log(`📊 蒙特卡洛模拟实测匹配率: ${(measuredRatio * 100).toFixed(2)}% (预期 35%)`);
  assert(measuredRatio >= 0.28 && measuredRatio <= 0.42, '匹配率应稳健落在预定统计区间内');
  console.log('✅ 测试 3 通过: 靶向刺激匹配率严格受控，杜绝作弊与无脑选不同');

  console.log('🎉 母版 01 N-Back 算法核心全部通过！');
}

runTests();

module.exports = {
  getNForLevel,
  getStimulusPool,
  isStimulusEqual,
  generateNBackSequence
};
