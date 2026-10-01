const fs = require('node:fs');
const path = require('node:path');
const api = require('./focus-batch-games');
const descriptions = {
  tidal_treasures: {
    rule: '画面展示一组不同物体。每次选择本关还没选过的物体，选对后所有物体重新换位置。把所有物体各选一次就升级，无需完成 5 组。L1～L5 为 4×4，L6～L10 为 5×5；物体由 4 件逐级增加到 13 件。',
    example: 'L1 有 4 件物体：先选足球，位置打乱后再选小鸟；足球即使换了位置，也不能再选。将 4 件各选一次就进入 L2，L2 需要选 5 件。重复选择会扣心，并重新随机开始本关。',
    challenge: '记住“选过哪些物体”，抵抗摆放位置改变带来的干扰。',
    parameter: cfg => `${cfg.count} 件物体，${cfg.size}×${cfg.size} 摆放区域；各选一次升级`
  },
  semantic_synthesis: {
    rule: '点击开始，依次听完整组词语，再选择出现次数最多的类别。播放期间不能答题，不显示词语或类别次数。每组词语不重复，保证只有一个最多的类别；相邻组类别尽量不重叠，类别较多时保证组合不同；连续正确 3 组升级。可点击“再听一次”重播同一整组。',
    example: 'L1 听到“苹果、小狗、香蕉、小猫、葡萄”：水果出现 3 次、动物出现 2 次，选择“水果”。后续同时统计更多词语和更多类别。',
    challenge: '边听边分类、分别累计各类别的次数，直到整组结束再比较。',
    parameter: cfg => `${cfg.count} 个词，${cfg.categoryCount} 类；连续正确 3 组升级`,
    note: '使用项目内置的 42 段中文词语录音，不依赖浏览器中文朗读服务。可点击“再听一次”重播；即使已进入文字练习，也会恢复听觉模式。播放失败会明确提示重试或选择文字练习。文字练习不当作纯听觉玩法。'
  },
  schulte_ladder: {
    rule: '数字随机摆放，在本关限时内按 1、2、3……顺序点击，直到找齐。正确格子变绿并锁定；每关完成一张数字表就升级。点错只显示错误提示，可以继续寻找正确数字，不扣心、不重置棋盘、进度或倒计时。只按是否在规定时间内完成来判断过关。',
    example: 'L1 的 3×3 表含 1～9，须在 20 秒内依次找齐，完成后直接升级。L2 同为 3×3，限时缩短至 15 秒。',
    challenge: '扩大搜索范围，并在逐步缩短的时间里保持顺序。',
    parameter: cfg => `${cfg.size}×${cfg.size}，1～${cfg.size ** 2}，本组 ${cfg.limit / 1000} 秒`,
    note: 'L1～L3：3×3、20/15/10 秒；L4～L6：4×4、30/25/20 秒；L7～L9：5×5、40/35/30 秒；L10：6×6、50 秒。只有超时才扣心并重新随机开始本关，第三次超时结束游戏。'
  },
  cambridge_decoder: {
    rule: '先依次显示不同图标，记住出现顺序。全部展示完毕后，同一批图标打乱排列；直接按原顺序依次点击，无需填空。每个图标只点一次，选对后保持显示并锁定，全部按正确顺序点完才完成一组。连续正确 3 组升级。',
    example: '先出现“小鸟→足球→苹果”。随后打乱为“苹果、足球、小鸟”，依次点击小鸟、足球、苹果，就完成这一组。',
    challenge: '记住图标和先后关系，抵抗下方打乱排列带来的干扰。',
    parameter: cfg => `${cfg.count} 个不同图标；每个显示 ${cfg.exposure}ms`,
    note: 'L1 从 3 个图标开始，每级增加 1 个，L10 为 12 个。观察期间没有候选图标；点错扣心并重置本关进度，第三次失误结束，升级补满三颗心。'
  },
  flanker_birds: {
    rule: '鸟群排列在网格中，每题随机一只小鸟带下划线。找到它，L1～L5 判断左右，L6～L10 判断上下左右。可点击方向按钮，也可用方向键或 WASD，数字小键盘 8/4/2/6 也可控制。L1～L5 每关 20 秒，L6～L10 每关 25 秒，必须达到规定正确次数才升级；换题时倒计时继续，小鸟保留到作答。每次换题超过一半的小鸟改变方向，下划线位置必定变化；方向按钮组成圆形四分区，上下左右各在对应位置，方便点击。W 上、A 左、S 下、D 右，长按不重复计分。',
    example: 'L1 为 2×2、4 只小鸟，需要在 20 秒内答对 8 次。目标可在四个位置中的任何一个，其他小鸟的方向不能作为答案。L10 为 6×6、36 只，需要在 25 秒内答对 26 次。',
    challenge: '在越来越密集的鸟群中迅速找到下划线目标，抵抗其他方向的干扰，并达到整关速度要求。',
    parameter: cfg => `${cfg.rows}×${cfg.cols}，${cfg.count} 只；${cfg.directions.length === 2 ? '左右' : '上下左右'}；${cfg.limit / 1000} 秒内答对 ${cfg.required} 次`,
    note: 'L1～L10 正确次数为 8/10/12/14/16/18/20/22/24/26；网格为 2×2、2×3、3×3、3×4、4×4、4×5、5×5、5×6、6×6、6×6。点错或超时扣心并清零本关次数，2 秒提示后重新开始本关倒计时；第三次失败结束，升级补满三颗心。'
  },
  ufov_dual_field: {
    rule: '观察时只展示中心图形和周边目标，不显示下方选项。图形隐藏并保持 200ms 后，先选择中心图形，再点击星星位置。L11～L14 加入心形，最后还须点击心形位置，三项都正确才完成一组。每组更换中心图形，保证与上一组不同。',
    example: '看到中心蝴蝶、右上角星星：先选蝴蝶，中心格和选项显示绿色正确反馈；再点击右上格，该格显示金色星星和绿色正确反馈。灰色圆点是干扰，不需要回答。',
    challenge: '同时分配注意给中心与周边，保留目标类别和空间位置。',
    parameter: cfg => `${cfg.size}×${cfg.size}；${cfg.options} 个图形选项；${cfg.triple ? '三重' : '双重'}视野；显示 ${cfg.exposure}ms；${cfg.distractors} 个干扰点`,
    note: '共 14 关。L1～L5 为 3×3，L6 起为 5×5；星星和心形只出现在最外圈，位置互不重叠。L1～L10 每两级增加一个图形选项，依次为 2/2/3/3/4/4/5/5/6/6；L11～L14 保持 6 个选项，曝光保持 280ms。中心图形从 12 种物体中随机选取。连续正确 5 组升级。'
  },
  bimodal_divert: {
    rule: '每组播放前先显示 3、2、1，各停留 1 秒，倒计时结束后才开始图形和声音；下一组与失误重开也会倒计时。每次同时出现一个彩色圆点和一个声音。只统计本关指定颜色与目标音色的次数，忽略其他颜色和声音；每级更换目标颜色与音色。L1 每组 2 次，每级增加 1 次，L10 为 11 次。每次显示 750ms，项间 180ms，播放速度固定。整组结束后点击两个次数按钮，再提交。',
    example: 'L1 的目标为蓝色与清亮音。两次呈现中，蓝色出现 1 次、清亮音出现 2 次，分别点击 1 和 2，再提交。图形与声音独立随机，不能只看图猜声音。',
    challenge: '同时保持两条独立的计数，避免混淆视觉与听觉目标。',
    parameter: cfg => `${cfg.count} 次视听呈现；${cfg.colors.length} 种颜色；目标 ${ {blue:'蓝色',orange:'橙色',green:'绿色'}[cfg.targetColor] } / ${cfg.targetSound === 'clear' ? '清亮音' : '柔和音'}；每次 ${cfg.exposure}ms`,
    note: 'L1～L5 使用目标色与 1 种随机干扰色，L6～L10 使用目标色与 2 种随机干扰色；每组干扰配色必定与上一组不同。清亮音为 880Hz 正弦波，柔和音为 220Hz 三角波，目标交替。每关开始前展示全部七种可能颜色的圆点，并标注本关只统计的目标颜色；保留两个声音的试听按钮及目标音色标记。次数可为 0，按钮范围为 0～本组次数；连续正确 5 组升级。真实音色和音量需本机试听确认。'
  }
};
const base = 'http://127.0.0.1:8080';
const url = id => `${base}/focus.html?game=${id}&miniprogram=1&v=local26#${id}`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const intro = '母版 04～10 已做成本地试玩初版。以下说明对应实际实现，不涉及在线部署。关卡参数仍可根据体验调整。';
const common = ['游戏 09 共 14 关，其他各 10 关；每关都先点击开始，准备期间不消耗时间。', '游戏 04 将本关所有物体各选一次就升级；游戏 05 连续正确 3 组升级；游戏 06 完成一张数字表就升级；游戏 07 连续正确 3 组升级；游戏 08 在本关限时内达到正确次数要求升级；游戏 09～10 连续正确 5 组升级。', '前两次失误各扣一颗心，并将本关进度归零；提示停留 2 秒后重新出题，无需确认。游戏 06 点错只提示，只有超时才适用扣心重开规则。', '第三次失误结束游戏并显示报告；升级恢复三颗心。', '舒尔特按每关限时；鸟群 L1～L5 每关 20 秒、L6～L10 每关 25 秒；其余没有作答倒计时。', '切换游戏或结束时清理呈现和声音任务，避免旧流程干扰新游戏。'];
let markdown = '# 游戏 04～10 本地玩法报告\n\n2026-09-30\n\n' + intro + '\n\n## 共同规则\n\n' + common.map(text => '- ' + text).join('\n') + '\n\n## 试玩目录\n\n';
let sections = '';
for (const [id, number, title] of api.definitions) {
  const detail = descriptions[id];
  markdown += `- [母版 ${String(number).padStart(2, '0')} · ${title}](${url(id)})\n`;
  const rows = Array.from({ length: id === 'ufov_dual_field' ? 14 : 10 }, (_, i) => [i + 1, detail.parameter(api.getConfig(id, i + 1))]);
  sections += `<section id="${id}"><header><span class="number">${String(number).padStart(2, '0')}</span><div><h2>${escape(title)}</h2><p>${escape(detail.challenge)}</p></div><a class="play" href="${url(id)}" target="_blank" rel="noopener">本地试玩 ↗</a></header><div class="details"><div><h3>怎么玩</h3><p>${escape(detail.rule)}</p><h3>一个例子</h3><p>${escape(detail.example)}</p>${detail.note ? '<p class="note">' + escape(detail.note) + '</p>' : ''}<div class="table-wrap"><table><thead><tr><th>关卡</th><th>实际参数</th></tr></thead><tbody>${rows.map(([level, params]) => `<tr><td>L${level}</td><td>${escape(params)}</td></tr>`).join('')}</tbody></table></div></div><figure><img src="reports/masters04-10/${id}.png" alt="${escape(title)}本地试玩界面"><figcaption>本地试玩界面 · 手机尺寸</figcaption></figure></div></section>`;
}
for (const [id, number, title] of api.definitions) {
  const detail = descriptions[id];
  markdown += `\n## ${String(number).padStart(2, '0')} · ${title}\n\n**操作：**${detail.rule}\n\n**例子：**${detail.example}\n\n**挑战：**${detail.challenge}\n\n${detail.note ? detail.note + '\n\n' : ''}[本地试玩](${url(id)})\n\n| 关卡 | 实际参数 |\n| --- | --- |\n`;
  for (let level = 1; level <= (id === 'ufov_dual_field' ? 14 : 10); level++) markdown += `| L${level} | ${detail.parameter(api.getConfig(id, level))} |\n`;
}
markdown += '\n## 验证情况\n\n`node test_masters_04_10.js` 已通过：七款游戏共 74 关的完整通关、连续进度重置、第三次错误结束、舒尔特超时、小鸟漏答、语音失败后的明确文字模式、H5 成绩回传。游戏 05 另通过 node test_semantic_audio.js 验证 36 段录音文件、真实浏览器播放和文字模式后的重播。游戏 10 的音高统计流程使用模拟音频验证，实际音量请本机试听。前 3 款另做回归测试。\n';
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>游戏04～10 · 本地玩法报告</title><style>
*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#23313a;font-family:"Microsoft YaHei",system-ui,sans-serif;line-height:1.7}main{max-width:1080px;margin:auto;padding:40px 28px}h1{font-size:32px;line-height:1.3;margin:8px 0 20px}h2{font-size:22px;line-height:1.4;margin:0}h3{font-size:16px;color:#075985;margin:20px 0 8px}p{margin:8px 0 16px}.eyebrow{color:#075985;font-size:13px;font-weight:700}.lead{max-width:760px}a{color:#075985;text-underline-offset:3px}nav{display:flex;flex-wrap:wrap;gap:10px 22px;margin:22px 0 36px}section{padding:32px 0;border-top:1px solid #cbd5e1;scroll-margin-top:24px}section header{display:flex;align-items:start;gap:16px;margin-bottom:18px}section header p{color:#475569;font-size:14px;margin:6px 0}.number{font-size:27px;font-weight:800;color:#0284c7;line-height:1.3}.play{margin-left:auto;white-space:nowrap;font-weight:700}.details{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:38px}.note{font-size:14px;background:#e0f2fe;color:#0c4a6e;padding:12px 14px;border-radius:8px}.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #d7dee2}th{background:#edf2f4}td:first-child{width:60px;white-space:nowrap}figure{margin:0;align-self:start}figure img{display:block;width:100%;border:1px solid #cbd5e1;border-radius:14px}figcaption{font-size:12px;color:#475569;text-align:center;margin-top:8px}.common{padding:12px 18px;background:#fff;border-left:4px solid #0284c7}.common ul{padding-left:20px;margin:8px 0}footer{border-top:1px solid #cbd5e1;padding-top:24px;font-size:14px}a:focus-visible{outline:3px solid #0284c7;outline-offset:4px}@media(max-width:700px){main{padding:24px 18px}h1{font-size:26px}.details{grid-template-columns:1fr;gap:24px}figure{width:min(260px,100%);margin:auto}section header{flex-wrap:wrap}.play{margin-left:46px}nav{gap:8px 14px}}@media print{body{background:#fff}main{padding:0}.play,nav{display:none}section{break-inside:avoid}.details{grid-template-columns:1fr 190px}figure img{max-height:410px;object-fit:contain}}
</style></head><body><main><div class="eyebrow">本地试玩初版 · 2026-09-30</div><h1>游戏 04～10 玩法报告</h1><p class="lead">${intro}</p><div class="common"><strong>共同规则</strong><ul>${common.map(text => `<li>${escape(text)}</li>`).join('')}</ul></div><nav aria-label="游戏目录">${api.definitions.map(([id, number, title]) => `<a href="#${id}">${String(number).padStart(2, '0')} ${escape(title)}</a>`).join('')}</nav>${sections}<footer><strong>验证：</strong>七款共 74 关通关及错误流程测试已通过。中文朗读、音量和音高效果仍需本机试听确认；“文字练习”会明确标注。<p><a href="GAMEPLAY_REPORT_04_10.md">下载 Markdown 版报告</a></p></footer></main></body></html>`;
fs.mkdirSync(path.join(__dirname, 'reports', 'masters04-10'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'GAMEPLAY_REPORT_04_10.md'), markdown);
fs.writeFileSync(path.join(__dirname, 'games04-10-report.html'), html);
console.log('Generated Markdown and illustrated HTML gameplay reports.');
