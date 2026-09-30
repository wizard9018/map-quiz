// test_master_01_nback.js - 母版 01 N-Back 工作记忆刷新流核心算法单元测试
const assert = require('assert');

const { getNForLevel, getNBackConfig, ICONS_POOL, isStimulusEqual, generateNBackSequence } = require('./test_nback_helpers.js');

// ---------------- 单元测试套件 ----------------

function runTests() {
  console.log('>>> [母版 01 N-Back 九宫格+图标双重绑定] 开始运行单元测试...');

  // 测试 1: 关卡 N 值分配
  assert.strictEqual(getNForLevel(1), 1, 'L1 应为 1-Back');
  assert.strictEqual(getNForLevel(3), 1, 'L3 应为 1-Back');
  assert.strictEqual(getNForLevel(4), 2, 'L4 应为 2-Back');
  assert.strictEqual(getNForLevel(7), 3, 'L7 应为 3-Back');
  assert.strictEqual(getNForLevel(10), 4, 'L10 应为 4-Back');
  for (let level = 1; level <= 12; level++) {
    const cfg = getNBackConfig(level);
    assert.strictEqual(cfg.size, 3 + (level - 1) % 3);
    assert.strictEqual(cfg.stepDuration, 1.5);
  }
  console.log('✅ 测试 1 通过: 1~12 关 N 值映射符合规划');

  // 测试 2: 序列生成与位置+图标双重精确比对
  Array.from({ length: 12 }, (_, i) => i + 1).forEach(lvl => {
    const { n, sequence } = generateNBackSequence(lvl, 20, 0.35);
    assert.strictEqual(sequence.length, 20);
    const size = getNBackConfig(lvl).size;
    sequence.forEach(step => assert(step.item.pos >= 0 && step.item.pos < size * size));

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
  getNBackConfig,
  isStimulusEqual,
  generateNBackSequence
};
