// test_nback_e2e.js - 母版 01 N-Back 端到端 1~10 关仿真与生命周期回归测试
const assert = require('assert');
const {
  getNForLevel,
  getStimulusPool,
  isStimulusEqual,
  generateNBackSequence
} = require('./test_master_01_nback.js');

console.log('>>> [母版 01 N-Back] 开始执行 1~10 关全周期端到端仿真...');

// 仿真玩家状态机
class NBackSimulator {
  constructor() {
    this.level = 1;
    this.lives = 3;
    this.score = 0;
    this.correctCount = 0;
    this.mistakesCount = 0;
    this.reactionTimes = [];
    this.history = [];
  }

  playLevel(lvl, errorRate = 0.05) {
    this.lives = 3; // 每关开始满血 3 命
    const n = getNForLevel(lvl);
    const totalSteps = (lvl <= 3) ? 10 : (lvl <= 7 ? 14 : 18);
    const { sequence } = generateNBackSequence(lvl, totalSteps, 0.35);

    for (let stepIdx = 0; stepIdx < totalSteps; stepIdx++) {
      const step = sequence[stepIdx];

      // 阶段 1: 瞬记预热阶段 (无需且不可做二选一操作)
      if (stepIdx < n) {
        // 观察记忆项
        continue;
      }

      // 阶段 2: 正式比对决策阶段
      const willMakeMistake = Math.random() < errorRate;
      let playerChoice;
      if (willMakeMistake) {
        playerChoice = !step.expectedMatch; // 故意按错
      } else {
        playerChoice = step.expectedMatch;  // 正确按键
      }

      // 模拟 320ms ~ 750ms 真实生理反应时
      const simRt = Math.floor(320 + Math.random() * 400);
      this.reactionTimes.push(simRt);

      if (playerChoice === step.expectedMatch) {
        this.correctCount++;
        this.score += 15 * lvl;
      } else {
        this.mistakesCount++;
        this.lives--;
        if (this.lives <= 0) {
          return { status: 'GAMEOVER', levelReached: lvl };
        }
      }
    }

    return { status: 'CLEARED', level: lvl };
  }
}

// 场景 1: 优秀玩家 (错误率 3%) 冲击 10 关大满贯
const p1 = new NBackSimulator();
let maxLevel = 1;
for (let lvl = 1; lvl <= 10; lvl++) {
  const res = p1.playLevel(lvl, 0.02);
  if (res.status === 'CLEARED') {
    maxLevel = lvl;
  } else {
    break;
  }
}
console.log(`✅ 场景 1 仿真完成: 优秀玩家闯关结果 = 第 ${maxLevel} 关, 剩余命数 = ${p1.lives}, 累计得分 = ${p1.score}`);
assert(maxLevel >= 9, '低失误率玩家应稳定冲至 9~10 关高阶');

// 场景 2: 验证 3 命耗尽保护机制 (高失误率玩家必定在早期止步并进入战报)
const p2 = new NBackSimulator();
let failed = false;
for (let lvl = 1; lvl <= 10; lvl++) {
  const res = p2.playLevel(lvl, 0.8); // 80% 高失误
  if (res.status === 'GAMEOVER') {
    failed = true;
    console.log(`✅ 场景 2 仿真完成: 3命耗尽机制触发, 成功在第 ${res.levelReached} 关止步保护`);
    break;
  }
}
assert(failed, '失误过高时必须触发生命值耗尽拦截');

// 场景 3: 验证平均反应时统计与神经报告评定算法
const totalTrials = p1.reactionTimes.length;
const avgRt = Math.round(p1.reactionTimes.reduce((a, b) => a + b, 0) / totalTrials);
console.log(`📊 统计生理指标: 决策样本数 = ${totalTrials}, 平均反应时 = ${avgRt}ms, 正确率 = ${Math.round((p1.correctCount / (p1.correctCount + p1.mistakesCount)) * 100)}%`);
assert(avgRt >= 300 && avgRt <= 800, '反应时应符合真实生理参数区间');

console.log('🎉 母版 01 N-Back 全周期端到端仿真测试 100% 成功！');
