const fs = require('node:fs');
const api = require('./focus-next-games');
const descriptions = {
  stroop_dimension: {
    rule: '逐题出现一个彩色汉字。看清“墨水颜色”或“文字含义”指令后选择对应颜色，忽略另一个维度。每组须全部答对，连续正确 3 组升级。',
    example: '蓝色墨水写着“红”：如果本题只选墨水颜色，选择蓝色；如果只选文字含义，选择红色。',
    parameter: c => `${c.count} 题/组，${c.colors} 种颜色；${c.mixed ? '字义/墨色随机切换' : '只选墨色'}；冲突约 ${Math.round(c.conflict * 100)}%；每题 ${c.limit / 1000} 秒`
  },
  simon_reverse: {
    rule: '箭头偏侧出现。忽略它在屏幕上的位置，红色箭头选箭头的反方向，蓝色箭头选同方向。L1～L7 只有红色反向规则，L8 起两种规则随机出现。',
    example: '红色“→”即使出现在左边，也必须选择“←”；蓝色“→”则选择“→”。',
    parameter: c => `${c.count} 题/组，${c.directions.length} 个方向；${c.mixed ? '同向/反向随机切换' : '反向规则'}；每题 ${c.limit / 1000} 秒`
  },
  sst_stop_signal: {
    rule: '一组 8 题，其中恰好 2 题会延迟出现 STOP。普通题按箭头方向点击，STOP 题整题都不能点击。每题结束再判定；先点击、后出现 STOP 也算失误。',
    example: '看到“←”先准备左键；若出现 STOP 则收手，保持不点击直到本题结束。没有 STOP 的题必须在窗口结束前点击左键。',
    parameter: c => `8 题/组，2 题 STOP（25%）；信号延迟 ${c.stopDelay}ms；每题 ${c.limit / 1000} 秒`
  },
  rhythm_seven: {
    rule: '每组依次出现 10 个连续数字。7 的倍数或数字中含 7 时不要点击，其他数字必须点击“通过”。所有题都在固定节奏结束时判定。',
    example: '13 点击通过，14 不点击；16 点击通过，17 不点击；27 虽然不是 7 的倍数，因为含 7 也不能点击。',
    parameter: c => `10 个连续数字/组；起始数随机 1～${c.range}；每题 ${c.limit / 1000} 秒`
  },
  wcst_rule_switch: {
    rule: '上方卡片同时有颜色、形状和数量。下方三个篮子分别代表“红/圆/1个”“蓝/三角/2个”“绿/方/3个”。根据本题明示的当前规则选篮子，不能沿用上一题规则。此版为有规则提示的切换练习。',
    example: '蓝色的三个圆：按颜色放蓝色篮，按形状放圆形篮，按数量放三个篮。切换规则时，上方提示同步改变。',
    parameter: c => `${c.count} 张卡/组；${c.rules.length} 种规则；${c.rules.length > 1 ? '每 ' + c.switchEvery + ' 张切换规则' : '只按颜色'}；不限作答时间`
  },
  mot_trajectory: {
    rule: '先用 2 秒记住金色目标球，随后全部变为相同的白色小球，在边界内移动并相互碰撞。运动结束后，点出全部原目标球。点错非目标球则失误；正确目标变绿并锁定。',
    example: '开始高亮两颗球，跟随它们穿过其他小球；停止时不能按原位置猜，要选择跟踪到的最终位置。',
    parameter: c => `${c.count} 颗球，${c.targets} 个目标；观察 2 秒，运动 ${c.motion / 1000} 秒；速度 ${c.speed} px/s；停止后不限答题时间`
  },
  odd_one_out: {
    rule: '一组不同物体中，其他物体都恰好出现两次，只有一件出现一次。找到它并点击。每级物体数量增加 2 件，网格随之扩大。',
    example: '足球、小鸟、苹果各有两件，雨伞只有一件，选择雨伞。',
    parameter: c => `${c.count} 件物体，${(c.count - 1) / 2} 对＋1 件孤品；${c.size}×${c.size} 网格；不限答题时间`
  },
  mental_rotation_clock: {
    rule: '表盘是左右镜像。先在脑中还原镜像，再选择真实时间；后期还需回正旋转的表盘。蓝色三角始终标记表盘原来的顶部，粗短针为时针、细长针为分针。',
    example: '真实时间 3:00 的时针指右，镜像图中的时针指左；还原后应选择 3:00。',
    parameter: c => `${c.options} 个时间选项；分钟以 ${c.minuteStep} 分钟为步长；${c.numbered ? '带数字表盘' : '无数字表盘'}；${c.rotation ? '镜像＋旋转 ' + c.angles.join('/') + '°' : '左右镜像'}；不限答题时间`
  },
  train_switch_dispatch: {
    rule: '彩色火车从上方驶入，点击道岔按钮切换左右轨道。火车经过主道岔时锁定第一段路线；四车站关卡还会经过左/右支线道岔。火车和车站同时标有颜色文字。后期会有两辆火车同时在路上。',
    example: '两车站关卡中，红站在左、蓝站在右；红火车接近道岔前把主道岔调左，蓝火车到来时调右。四站时还需切换对应支线道岔。',
    parameter: c => `${c.count} 辆/组，${c.stations} 座车站；每辆行驶 ${c.travel / 1000} 秒；发车间隔 ${c.interval / 1000} 秒`
  },
  laser_prism_deflect: {
    rule: '先观察斜镜的位置和方向，镜子隐藏后，从左侧箭头沿直线推演激光。每碰到一面镜子转向 90°，选择最终出口 A/B/C/D。每题都保证光线经过全部镜子且能够离开网格。',
    example: '光线从左向右射入，遇到“/”转向上方；遇到“\\”转向下方。多面镜子需要连续推演。',
    parameter: c => `${c.size}×${c.size}，${c.mirrors} 面镜子；观察 ${c.preview / 1000} 秒；4 个出口选项；不限答题时间`
  }
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = id => `http://127.0.0.1:8080/focus.html?game=${id}&miniprogram=1&v=local24#${id}`;
const common = '十款各有 10 级，每级先点击开始。每关连续正确 3 组升级；前两次失误扣心并清零本关连续进度，自动显示 2 秒重开提示后随机出新组，第三次失败显示报告；升级补满三颗心。每次结束保存本浏览器记录，并显示当天二十款游戏记录和近七日趋势。';
let markdown = '# 游戏 11～20 玩法与关卡报告\n\n2026-10-01\n\n' + common + '\n';
let sections = '';
for (const [id, number, title] of api.definitions) {
  const d = descriptions[id], rows = Array.from({ length: 10 }, (_, i) => [i + 1, d.parameter(api.getConfig(id, i + 1))]);
  markdown += `\n## ${number} · ${title}\n\n${d.rule}\n\n例子：${d.example}\n\n[本地试玩](${url(id)})\n\n| 关卡 | 参数 |\n| --- | --- |\n` + rows.map(([level, params]) => `| L${level} | ${params} |`).join('\n') + '\n';
  sections += `<section id="${id}"><header><span class="number">${number}</span><div><h2>${escape(title)}</h2></div><a class="play" href="${url(id)}" target="_blank" rel="noopener">本地试玩 ↗</a></header><div class="details"><div><h3>怎么玩</h3><p>${escape(d.rule)}</p><h3>例子</h3><p>${escape(d.example)}</p><div class="table-wrap"><table><thead><tr><th>关卡</th><th>实际参数</th></tr></thead><tbody>${rows.map(([level, params]) => `<tr><td>L${level}</td><td>${escape(params)}</td></tr>`).join('')}</tbody></table></div></div><figure><img src="reports/masters11-20/${id}.png" alt="${escape(title)}试玩界面"><figcaption>手机尺寸 · 本地训练界面</figcaption></figure></div></section>`;
}
const css = fs.readFileSync('games04-10-report.html', 'utf8').split('<style>')[1].split('</style>')[0];
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>游戏11～20玩法报告</title><style>${css}</style></head><body><main><h1>游戏 11～20 玩法报告</h1><p>2026-10-01 · 本地训练版本</p><p>${common}</p><nav>${api.definitions.map(([id, number, title]) => `<a href="#${id}">${number} ${escape(title)}</a>`).join('')}</nav><p><a href="focus.html#home">返回二十款训练首页</a> · <a href="games-playground.html">图片试玩总览</a></p>${sections}<footer><p>各项实际参数由训练引擎配置生成。记录保存在当前浏览器。</p><a href="GAMEPLAY_REPORT_11_20.md">Markdown 版报告</a></footer></main></body></html>`;
fs.writeFileSync('GAMEPLAY_REPORT_11_20.md', markdown); fs.writeFileSync('games11-20-report.html', html);
console.log('Generated games 11–20 gameplay report.');
