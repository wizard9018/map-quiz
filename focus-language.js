// Translate interface text without changing task data, timers or recordings.
(function () {
  'use strict';
  const key = 'focus_interface_language';
  let language = localStorage.getItem(key) === 'en' ? 'en' : 'zh';
  const labels = {
    '声音暂不可用，请返回训练首页后重新开始': 'Audio is unavailable. Return to training home and start again.',
    '请选择出现次数最多的类别': 'Choose the category that appeared most often',
    '找到带下划线的图标，判断动物头部或文具尖端的方向': 'Find the underlined icon. Judge the direction of the animal’s head or the stationery’s tip.',
    '找到带下划线的图标，判断头部或尖端的方向': 'Judge the direction of the underlined icon’s head or tip.',
    '记住九宫格图标的出现顺序，按本关要求正序或倒序点击': 'Remember the icon sequence in the 3×3 grid. Recall it forward or backward as instructed.',
    '先观察全部图标，随后按倒序依次点击': 'Observe all icons, then click in reverse order',
    '请从最后出现的图标开始，按倒序点击': 'Start with the last icon and click in reverse order',
    '按出现顺序倒着点击图标；每个图标只点一次': 'Click icons in reverse order; select each icon once',
    '专注力 · 10 款认知训练': 'Focus · 20 cognitive games',
    '专注力 · 20 款认知训练': 'Focus · 20 cognitive games',
    'K12 专注力 · 20 款认知训练': 'K12 Focus · 20 cognitive games',
    '全部游戏': 'All games', '认知母版 (20)': 'Cognitive games (20)',
    '工作记忆': 'Working memory', '深度专注': 'Attention', '抑制与切换': 'Control & switching', '视觉与空间': 'Visual & spatial',
    '训练首页': 'Training home', '返回训练首页': 'Back to training home',
    '确认': 'Confirm',
    '继续': 'Continue', '退出': 'Exit',
    '还原规则：单色、顺序不限 → 蓝黄双色、先蓝后黄': 'Recall rule: one color, any order → blue and yellow, blue first',
    '词语播放速率：': 'Word playback rate: ', '干扰方向比例：': 'Distractor direction rate: ',
    '本关变化，准备好后点击继续': 'Changes this level. Click Continue when ready.',
    '网格：': 'Grid: ', '每组图形：': 'Items per group: ',
    '项。整组显示完后，与上一整组比较。': 'items. Compare with the previous whole group after all items appear.',
    '顺序错误：请先找齐蓝色方格': 'Wrong order: select all blue cells first',
    '位置错误：这格刚才没有亮起': 'Wrong position: this cell was not highlighted',
    '。蓝色/黄色显示正确答案；✓ 是已选格，× 是本次错选。': '. Blue/yellow show the correct pattern; ✓ marks your selections and × marks the wrong choice.',
    '上一款': 'Previous', '下一款': 'Next', '上一个游戏': 'Previous game', '下一个游戏': 'Next game',
    '选择游戏': 'Choose a game', '选择关卡': 'Choose a level', '选择趋势游戏': 'Choose a trend game',
    '初阶': 'Beginner', '中阶': 'Intermediate', '高阶': 'Advanced', '极限': 'Expert',
    '选择今天的训练': 'Choose today’s training',
    '20 款认知小游戏，从记忆、注意到视听协作。选择一款开始，结束后查看训练记录。': '20 cognitive games for memory, attention and audiovisual coordination. Choose a game, then review your training records.',
    '开始训练 →': 'Start training →', '试玩预览': 'Game preview',
    'N-Back 工作记忆刷新流': 'N-Back group memory', '空间网格暂留闪记': 'Spatial grid memory', '序列顺序复原': 'Sequence recall',
    '排他性情景记忆提取': 'Pick each object once', '听觉语义概念综摄': 'Listen and count categories',
    '舒尔特注意力阶梯': 'Schulte number grid', '图标顺序复原': 'Icon sequence recall',
    '迷途鸟群侧抑制': 'Bird direction challenge', '双重视野捕获': 'Visual field recall', '视听双通道分流': 'Color and sound counting',
    '色词冲突切换': 'Color-word switching', '空间西蒙反转': 'Spatial Simon reversal', '紧急停止信号': 'Stop-signal challenge',
    '节奏逢7克制': 'Hold on seven', '规则切换分拣': 'Rule-switch sorting', '多目标轨迹追踪': 'Multiple-object tracking',
    '成双物体找孤品': 'Find the unpaired object', '镜中时钟还原': 'Mirror clock recall', '火车变轨调度': 'Train routing', '激光镜面推演': 'Laser reflection',
    '记住上一组的位置、图标和顺序，判断整组是否相同；从 1 项逐步增加到 4 项。': 'Remember the previous group’s positions, icons and order. Decide whether the whole group matches. Groups grow from 1 to 4 items.',
    '潮水正在打乱图标位置': 'The tide is shuffling the icon positions.',
    '每次选一个本组从未选过的物体，潮水会打乱位置': 'Choose an object you have not picked in this group. Positions change after each choice.',
    '听完整组词语，选择出现次数最多的类别': 'Listen to all the words, then choose the most frequent category.',
    '在限时内从 1 开始，按数字顺序找齐方格': 'Find every number in order, starting at 1, within the time limit.',
    '记住图标出现的顺序，再按原顺序依次点击': 'Remember the icons, then click them in the order they appeared.',
    '找到带下划线的小鸟，限时内完成规定次数的方向判断': 'Judge the underlined bird’s direction. Reach the required number of correct answers before time runs out.',
    '同时记住中心图形和周边金色星星的位置': 'Remember the center object and the position of the gold star.',
    '分别统计本关指定颜色与目标音色的次数': 'Count the target color and target sound separately.',
    '按本题指令选择文字含义或墨水颜色，忽略另一维度': 'Follow the instruction: choose the word’s meaning or its ink color. Ignore the other feature.',
    '忽略箭头出现的位置，按规则选择箭头的同向或反向': 'Ignore the arrow’s position. Choose the same or opposite direction according to the rule.',
    '箭头出现时点击对应方向；出现停止信号时收手': 'Click the arrow’s direction. Hold your response if a stop signal appears.',
    '普通数字点击通过；7的倍数或含7的数字不要点击': 'Click for ordinary numbers. Do not click for multiples of 7 or numbers containing 7.',
    '按当前颜色、形状或数量规则，把卡片放入对应篮子': 'Sort each card by the current rule: color, shape or number.',
    '记住高亮小球，运动停止后找回所有目标': 'Remember the highlighted balls. Select all targets after they stop moving.',
    '其他物体都成双出现，找出唯一没有同伴的物体': 'Every other object appears twice. Find the only unpaired object.',
    '观察镜像表盘，在脑中还原真实时间': 'Read the mirrored clock and work out the actual time.',
    '及时切换道岔，让每辆彩色火车进入同色车站': 'Switch the tracks in time to send each train to its matching station.',
    '记住镜面，隐藏后推算激光经过反射的出口': 'Remember the mirrors. After they disappear, work out where the laser exits.',
    '当天训练记录': 'Today’s training', '游戏': 'Game', '次数': 'Count', '最高关卡': 'Highest level', '最近得分': 'Latest score',
    '最近 7 天': 'Last 7 days', '每天最高到达关卡 · 空白表示当天未训练': 'Highest level reached each day · Gaps mean no training',
    '记录保存在当前浏览器，清除网站数据会删除记录。': 'Records are saved in this browser. Clearing site data deletes them.',
    '这款游戏最近 7 天还没有训练记录': 'No training records for this game in the last 7 days.',
    '浏览器无法保存本次记录，请检查网站存储设置。': 'This record could not be saved. Check your browser’s storage settings.',
    '最近七天最高关卡：': 'Highest levels over the last 7 days: ', '未训练': 'No training',
    '游戏加载中...': 'Loading game...', '游戏规则提示': 'Game instructions', '准备好后点击开始': 'Click Start when ready',
    '直接失败 (测试)': 'End test', '测试专用：立即失败并查看评定报告': 'Testing only: end this run and view the report',
    '已触发测试直接失败！': 'Test run ended.',
    '本关完成！': 'Level complete!', '本组正确，准备下一组': 'Correct! Get ready for the next group.', '本组正确！': 'Group correct!', '正确！': 'Correct!',
    '判断错误': 'Incorrect answer', '顺序错误': 'Wrong order', '本轮重新开始': 'Restarting this round', '要认真对待哦！': 'Stay focused!',
    '本轮重新开始，要认真对待哦！': 'This round will restart. Stay focused!',
    '即将重新开始…': 'Restarting shortly…', '即将随机生成新的一组': 'A new random group is coming', '即将重新显示第一组…': 'A new first group is coming…',
    '失误后重新开始本关': 'Restarting this level after an error', '连续进度已重置，认真记住下一组哦！': 'Your streak has reset. Watch the next group carefully.',
    '判断错误，请认真观察下一组': 'Incorrect. Watch the next group carefully.', '重新准备，先记住任务规则': 'Get ready again. Remember the task rules.',
    '组间从不同方向飞过的物体只是干扰，不需要判断。': 'Flying objects between groups are distractions. Ignore them.',
    '先记住第一项，再将每一项与上一项比较。': 'Remember the first item, then compare each item with the one before it.',
    '不限作答时间，连续答对 8 组升级：位置、图标和顺序都相同选“一致”，否则选“不一致”。': 'No answer time limit. Get 8 consecutive judgments correct to advance. Choose Match only if positions, icons and order all match; otherwise choose Different.',
    '一致': 'Match', '不一致': 'Different', '观察': 'Observe', '正序': 'Forward', '倒序': 'Reverse',
    '重复选择了本组已经选过的物体': 'You already picked this object in this group.',
    '只记物体是否选过，不要只记位置': 'Remember which objects you have picked, not their positions.',
    '声音暂不可用，请点击“再听一次”重试，或选择“文字练习”': 'Audio is unavailable. Try Replay or choose Text practice.',
    '正在读词语…': 'Playing words…', '听一听词语': 'Listen to the words', '听词语': 'Listening',
    '文字练习（不是纯听觉任务）': 'Text practice (not an audio-only task)', '哪个类别出现最多？': 'Which category occurred most often?',
    '文字练习：': 'Text practice: ', '再听一次': 'Replay', '文字练习': 'Text practice',
    '水果': 'Fruit', '动物': 'Animals', '交通工具': 'Transport', '蔬菜': 'Vegetables', '学习用品': 'School supplies', '家具': 'Furniture', '昆虫': 'Insects',
    '本组时间耗尽，请重新从 1 开始': 'Time is up. Start again from 1.', '从 1 开始，按顺序找齐所有数字': 'Find all numbers in order, starting at 1.',
    '点错可继续，倒计时不停；限时内找齐即可过关': 'Wrong clicks do not reset the grid or timer. Finish before time runs out.',
    '限时内完成一张数字表即可升级；点错只提示，不重置、不扣心。超时扣心并重开，第三次超时结束。': 'Finish one grid in time to advance. Wrong clicks only show a hint. A timeout costs one heart and restarts the level; the third timeout ends the run.',
    '先观察全部图标，随后按原顺序依次点击': 'Watch all the icons, then click them in the original order.',
    '图标顺序记错了，请重新观察': 'Wrong icon order. Watch again.', '请选择第 1 个出现的图标': 'Select the icon that appeared first.',
    '按出现顺序依次点击图标；每个图标只点一次': 'Click the icons in order. Click each icon once.',
    '← 左': '← Left', '右 →': 'Right →', '↑ 上': '↑ Up', '下 ↓': 'Down ↓', '圆形方向控制': 'Direction pad',
    '找到带下划线的小鸟，判断它的方向': 'Judge the direction of the underlined bird.', '方向键或 W / A / S / D': 'Arrow keys or W / A / S / D',
    '心形位置记错了': 'Wrong heart position.', '周边星星位置记错了': 'Wrong star position.', '中心图形记错了': 'Wrong center object.',
    '星星位置正确！再点击心形刚才所在的位置': 'Star correct! Now select the heart’s position.',
    '中心图形正确！再点击金色星星刚才所在的位置': 'Object correct! Now select the gold star’s position.',
    '依次选择中心图形、星星位置、心形位置': 'Select the object, then the star position, then the heart position.',
    '先选择中心图形，再点周边星星的位置': 'Select the center object, then the star’s position.',
    '观察结束后再显示图形选项': 'Choices appear after observation.', '同时记住中心图形、星星和心形的位置': 'Remember the object, star and heart positions.',
    '保留中心和周边的信息…': 'Keep both center and surrounding information in mind…',
    '记住中心图形、星星和心形；观察结束后依次选择图形、星星位置、心形位置': 'Remember the object, star and heart. After observation, select the object, star position and heart position.',
    'W 上、A 左、S 下、D 右，也可使用方向键': 'W up, A left, S down, D right; arrow keys also work.',
    '按规则完成当前判断': 'Complete this response using the rule.', '火车已正确送达': 'The train reached the correct station.', '即将开始下一题': 'The next question will begin shortly.',
    '忽略格子位置，按颜色规则选择方向': 'Ignore the cell position and choose the direction using the color rule.',
    '蓝色': 'Blue', '橙色': 'Orange', '绿色': 'Green', '紫色': 'Purple', '粉色': 'Pink', '黄色': 'Yellow', '红色': 'Red',
    '清亮音': 'Clear tone', '柔和音': 'Soft tone', '视觉：只数': 'Color: count only ', '声音：只数': 'Sound: count only ',
    '提交两项统计': 'Submit both counts', '请分别选择两个次数，再提交': 'Select both counts before submitting.',
    '两项统计至少有一项不准确': 'At least one count is incorrect.', '（本关目标）': ' (target)', ' · 要数': ' · Count',
    '本题只选：': 'Choose only: ', '墨水颜色': 'Ink color', '文字含义': 'Word meaning',
    '混淆了文字与墨水颜色': 'Word meaning and ink color were confused.', '本题未在规定时间内作答': 'No response within the time limit.',
    '红色：选箭头反方向': 'Red: choose the opposite direction', '蓝色：选箭头同方向': 'Blue: choose the same direction',
    '方向判断错误，请忽略箭头出现的位置': 'Wrong direction. Ignore the arrow’s position.', '方向判断超时': 'Direction response timed out.',
    '箭头按方向，STOP 时收手': 'Follow the arrow; hold when STOP appears', '7的倍数或含7：不要点击': 'Multiple of 7 or contains 7: do not click',
    '通过': 'Go', '已记录点击，等待本题结束': 'Response recorded. Wait for the trial to finish.', 'STOP · 收手': 'STOP · Hold',
    '该题需要收手，不应点击': 'This trial required holding your response.', '该题需要点击正确方向或通过': 'This trial required a correct direction or Go response.',
    '颜色': 'Color', '形状': 'Shape', '数量': 'Number', '分拣错误，请留意当前规则': 'Wrong sorting choice. Check the current rule.',
    '选到了非目标小球': 'That ball was not a target.', '追踪目标，运动结束后再选择': 'Track the targets. Select them after movement ends.',
    '这个物体还有同伴，请找唯一落单物体': 'This object has a partner. Find the unpaired one.', '只有一件物体没有同伴': 'Only one object has no partner.',
    '镜像时钟': 'Mirrored clock', '镜像时间还原错误': 'Incorrect clock time.', '蓝色三角标记表盘原来的顶部': 'The blue triangle marks the clock’s original top.',
    '主道岔': 'Main switch', '左道岔': 'Left switch', '右道岔': 'Right switch', '火车进入了不同颜色的车站': 'A train reached a station with a different color.',
    '先观察镜面位置': 'Observe the mirror positions.', '反射出口判断错误': 'Wrong reflection exit.', '从箭头入射，选择正确出口': 'Light enters at the arrow. Choose its exit.',
    '挑战结束': 'Run complete', '专注力认知潜能诊断与战报分析': 'Attention training report',
    '最高闯关级数': 'Highest completed level', '全场正确率': 'Accuracy', '平均反应时': 'Average response time', '综合专注力得分': 'Attention score',
    '专家点评': 'Mentor feedback', '伴学导师': 'Learning mentor', '导师评定': 'Mentor feedback',
    '柯南风·星言 伴学': 'Xingyan · Mentor', '小哀风·清禾 伴学': 'Qinghe · Mentor',
    '点击切换伴学导师 (柯南风星言 / 小哀风清禾)': 'Switch learning mentor (Xingyan / Qinghe)',
    '星言学长': 'Xingyan', '清禾学姐': 'Qinghe',
    '1v1 好友对决战报': 'Friend challenge results', '挑战大获全胜！': 'Challenge won!', '稍逊一筹·继续加油': 'Keep practicing!',
    '你 (当前战绩)': 'You (this run)', '省份天梯战报评定': 'Regional comparison', '选择出战省份': 'Choose a province',
    '高于本省平均成绩 · 恭喜加分！': 'Above the regional average', '低于本省平均成绩 · 拖了后腿！': 'Below the regional average',
    '领取《7天专注力提升资料》与专家诊断': 'Get the 7-day attention guide and expert feedback',
    '针对做题粗心马虎、听课走神磨蹭的专项激活包': 'Resources for careless mistakes, distraction and slow task completion',
    '微信扫码添加专注力专家': 'Scan with WeChat to add the attention specialist',
    '手机可长按识别二维码 · 电脑可微信扫码': 'On phone: press and hold the QR code. On desktop: scan with WeChat.',
    '专属专家微信：': 'Expert WeChat: ', '一键复制': 'Copy', '已复制微信号': 'WeChat ID copied',
    '7天打卡营：': '7-day practice: ', '每日 10 分钟前额叶脑力专项训练音频与微题包': '10 minutes of training audio and short exercises per day',
    '实操防错指南：': 'Error-prevention guide: ', '《中小学生做题粗心断片与漏题防错手册 (PDF)》': 'Guide to preventing careless mistakes and missed questions (PDF)',
    '专家 1对1 诊断：': '1-to-1 expert feedback: ', '依据本次闯关失误数据，量身定制个性化专注力提分方案': 'A personal attention practice plan based on this run’s errors',
    '发给朋友挑战 PK（比拼闯关级数）': 'Challenge a friend (compare levels)', '再试一次': 'Try again', '下一款游戏': 'Next game',
    '小鸟': 'Bird', '足球': 'Football', '气球': 'Balloon', '飞机': 'Plane', '风筝': 'Kite', '蝴蝶': 'Butterfly', '小鱼': 'Fish',
    '火箭': 'Rocket', '星星': 'Star', '苹果': 'Apple', '雨伞': 'Umbrella', '树叶': 'Leaf', '时钟': 'Clock', '心形': 'Heart'
  };
  Object.assign(labels, {
    '记住刚才的顺序，2 秒后开始选择': 'Remember the sequence. Choices appear in 2 seconds.',
    '准备观察：图标将从左到右依次出现': 'Get ready: icons will appear from left to right',
    '直接升级 (测试)': 'Level up (test)', '测试专用：跳到下一关': 'Test: skip to the next level', '已是最高关卡': 'Already at the highest level',
    '组间的图片飞过与空白格翻转交替出现，只是干扰，不需要判断。': 'Flying pictures and blank tile flips alternate between groups. Ignore these distractions.',
    '时序先后正逆组块复原': 'Forward and reverse sequence recall',
    '记住闪亮方格，熄灭后点选还原；双色关先蓝后黄': 'Remember the highlighted cells, then select them after they go dark. In two-color levels, select blue before yellow.',
    '记住方格亮起的先后顺序，按要求正序或倒序复现': 'Remember the order of the lit cells, then repeat it forward or backward as instructed.',
    '开始记忆': 'Start memorizing', '本题计时': 'Trial timer',
    '失误重开本关，第三次失败结束，升级补满三颗心。': 'An error restarts the level. The third error ends the run. Advancing restores all three hearts.',
    '真相只有一个！你的专注力与观察力完美破局，超越同龄人！': 'You solved it! Your attention and observation skills were excellent.',
    '别着急！蛛丝马迹就在细节里，深呼吸稳住，我们再试一次！': 'Take your time. Clues are in the details. Take a breath and try again!',
    '数据非常惊艳呢。你的工作记忆容量远超预期，继续保持哦。': 'Excellent results! Your working memory performed very well. Keep it up.',
    '偶尔的数据波动在认知常模内，放松肩膀，下一轮一定能校准。': 'Results can vary. Relax your shoulders and get ready for another round.',
    '柯南风·星言 (8岁)': 'Xingyan (age 8)', '小哀风·清禾 (8岁)': 'Qinghe (age 8)',
    '海淀·林同学': 'Lin (Haidian)', '林同学': 'Lin', '你的好友': 'Your friend',
    '本省': 'This province', '平均成绩': 'Average score', '你的成绩为': 'Your score is',
    '高出': 'Above by', '落后': 'Below by', '恭喜为全省平均分拉榜加分，排名持续提升！': 'Well done! Keep building your skills.',
    '给全省平均战力拖了后腿，快加练追赶超越！': 'Keep practicing to improve your score.',
    '江苏省': 'Jiangsu', '浙江省': 'Zhejiang', '广东省': 'Guangdong', '山东省': 'Shandong', '福建省': 'Fujian', '河南省': 'Henan', '湖南省': 'Hunan', '湖北省': 'Hubei',
    '安徽省': 'Anhui', '江西省': 'Jiangxi', '四川省': 'Sichuan', '河北省': 'Hebei', '山西省': 'Shanxi', '辽宁省': 'Liaoning', '吉林省': 'Jilin', '黑龙江省': 'Heilongjiang',
    '陕西省': 'Shaanxi', '甘肃省': 'Gansu', '青海省': 'Qinghai', '海南省': 'Hainan', '贵州省': 'Guizhou', '云南省': 'Yunnan', '台湾省': 'Taiwan',
    '北京市': 'Beijing', '上海市': 'Shanghai', '天津市': 'Tianjin', '重庆市': 'Chongqing', '内蒙古': 'Inner Mongolia', '广西': 'Guangxi', '西藏': 'Tibet', '宁夏': 'Ningxia', '新疆': 'Xinjiang',
    '榜#': 'Rank #', '均分': 'Average ', '未作答：每组都需要选择一致或不一致': 'No answer: choose Match or Different for every group.',
    '位置、图标和顺序都相同点【一致】，否则点【不一致】；不限作答时间，连续答对 8 组升级': 'Choose Match only when positions, icons and order all match. Otherwise choose Different. No answer time limit; get 8 consecutive judgments correct to advance.',
    '保留中心和周边的信息…': 'Remember the center and surrounding positions…',
    '星星位置正确！本组完成': 'Star correct! Group complete.', '心形位置正确！本组完成': 'Heart correct! Group complete.',
    '等整组显示完再判断': 'Wait for the whole group before answering',
    '连续': 'Streak', '点击': 'Click', '已完成': 'Completed', '秒': 's'
  });
  Object.assign(labels, {
    '直接在上方舞台点选正确目标': 'Select the correct targets above',
    '记住蓝色圆点与黄色菱形：还原时先蓝后黄': 'Remember blue circles and yellow diamonds. Select blue first, then yellow.',
    '观察并记住位置': 'Observe and remember the positions',
    '倒序挑战：最后亮起的先点，第一个亮起的最后点': 'Reverse order: click the last cell first and the first cell last',
    '先观察顺序，随后从最后亮起的方格开始倒着点': 'Watch the sequence, then start with the last cell and work backward',
    '观察结束后，按倒序点击方格': 'After observation, click cells in reverse order',
    '观察结束后，按正序点击方格': 'After observation, click cells in forward order',
    '选一个本组没选过的物体，': 'Pick an object you have not selected · ',
    '也可点击按钮': 'or use the buttons', '依次记住并选择中心图形、星星位置、心形位置': 'Remember and select the object, then the star position, then the heart position',
    '三重视野': 'Triple field', '双重视野': 'Dual field', '左右镜像': 'Left-right mirror', '，还原真实时间': ' · Find the actual time',
    '柯南风·星言': 'Xingyan', '小哀风·清禾': 'Qinghe', '红': 'Red', '蓝': 'Blue', '绿': 'Green', '橙': 'Orange', '紫': 'Purple'
  });
  Object.assign(labels, {
    '广西壮族自治区': 'Guangxi', '内蒙古自治区': 'Inner Mongolia', '新疆维吾尔自治区': 'Xinjiang', '宁夏回族自治区': 'Ningxia', '西藏自治区': 'Tibet',
    '先观察顺序，随后从第一个亮起的方格开始依次点': 'Watch the sequence, then click cells from the first to the last',
    '在脑中保留刚才的顺序…': 'Keep the sequence in mind…', '在脑中保留刚才的图形…': 'Keep the pattern in mind…',
    '倒序：先点最后一格，再倒着往前点': 'Reverse: start with the last cell and work backward',
    '正序：从第一格开始依次点': 'Forward: start with the first cell',
    '先点蓝色圆点的位置，再点黄色菱形的位置': 'Select blue circle positions, then yellow diamond positions',
    '休息一下，重新观察': 'Take a breath and observe again', '新规则：先蓝后黄': 'New rule: blue first, then yellow',
    '开始双色挑战': 'Start two-color challenge', '直接点击方格还原': 'Click cells to recall the pattern',
    '本关重新开始：先记住第一组图形': 'Restarting this level: remember the first group', '停顿': 'Pause', '黄': 'Yellow',
    '限时内答对 10 题，倒计时持续进行': 'Get 10 correct answers before time runs out. The timer keeps running.',
    '本关时间耗尽，未完成 10 题': 'Time is up. You did not finish 10 questions.',
    '不分组。': 'No groups.', '即将重新开始本关挑战': 'This level will restart shortly',
    '按键一致性误判': 'Incorrect match judgment', '键盘或按钮均可操作': 'Use the keyboard or buttons',
    '专属挑战链接已复制！快发给微信好友/群聊 PK 吧！': 'Challenge link copied. Send it to a friend or group.',
    '挑战链接已复制！': 'Challenge link copied!', '请复制当前页面链接发给好友挑战': 'Copy this page’s link to challenge a friend.',
    '专家微信号已复制：ql_focus88，请打开微信添加！': 'WeChat ID copied: ql_focus88. Open WeChat to add it.',
    '微信号：ql_focus88，请手动长按复制': 'WeChat ID: ql_focus88. Press and hold to copy.',
    '已切换为伴学导师：': 'Learning mentor changed to: '

  });
  Object.assign(labels, Object.fromEntries(Object.entries({ '本关变化': 'Changes this level', '记忆格数：': 'Cells to remember: ', '物体数量：': 'Objects: ', '词语数量：': 'Words: ', '图标数量：': 'Icons: ', '小鸟数量：': 'Birds: ', '播放次数：': 'Presentations: ', '小球数量：': 'Balls: ', '图形数量：': 'Shapes: ', '火车数量：': 'Trains: ', '每组题数：': 'Questions per group: ', '类别数量：': 'Categories: ', '颜色数量：': 'Colors: ', '选项数量：': 'Options: ', '目标数量：': 'Targets: ', '镜面数量：': 'Mirrors: ', '车站数量：': 'Stations: ', '干扰图形数量：': 'Distractors: ', '正确次数要求：': 'Correct answers required: ', '时间：': 'Time: ', '图形显示时间：': 'Display time: ', '观察时间：': 'Preview time: ', '运动时间：': 'Motion time: ', '火车行驶时间：': 'Train travel time: ', '发车间隔：': 'Train interval: ', '停止信号延迟：': 'Stop-signal delay: ', '运动速度：': 'Speed: ', '起始数字范围：': 'Starting number range: ', '规则切换间隔：': 'Rule-switch interval: ', '时间精度：': 'Time precision: ', '判断方向：': 'Directions: ', '判断规则：': 'Rule: ', '旋转角度：': 'Rotation: ', '要数的颜色：': 'Color to count: ', '要数的声音：': 'Sound to count: ', '复现顺序：': 'Recall order: ', '表盘数字：': 'Clock numbers: ', '记忆目标：': 'Memory targets: ', '蓝色/黄色格数：': 'Blue/yellow cells: ', '色词冲突比例：': 'Color-word conflict rate: ', '墨色/字义随机切换': 'Random ink/word rule', '同向/反向随机切换': 'Random same/opposite rule', '只判断墨色': 'Ink color only', '只判断反向': 'Opposite direction only', '显示数字': 'Numbers shown', '隐藏数字': 'Numbers hidden', '图形、星星、心形': 'Shape, star and heart', '图形、星星': 'Shape and star', '本关参数与上一关相同，继续巩固练习。': 'Same settings as the previous level. Keep practicing.' })));
  const patterns = [
    [/正确次数要求：/g, 'Correct answers required: '], [/播放次数：/g, 'Presentations: '],
    [/每组图形：(\d+) 项 → (\d+) 项。整组显示完后，与上一整组比较。/g, 'Items per group: $1 → $2. Compare with the previous whole group after all items appear.'],
    [/整关 (\d+) 秒内答对 10 题即可升级，不分组。/g, 'Answer 10 questions correctly within $1 seconds to advance. No groups.'],
    [/(\d+) 色 · (\d+) 秒/g, '$1 colors · $2 seconds'],
    [/答对 (\d+)\/10 题/g, 'Correct $1/10'],
    [/下一格：(\d+)/g, 'Next number: $1'],
    [/出口 ([A-D])/g, 'Exit $1'],
    [/已复现 (\d+)\/(\d+) 格/g, 'Recalled $1/$2 cells'],
    [/已找回 (\d+)\/(\d+) 格/g, 'Found $1/$2 cells'],
    [/记住 (\d+) 个闪亮方格，熄灭后再点击/g, 'Remember $1 lit cells. Click after they go dark'],
    [/请找回 (\d+) 个方格（顺序不限）/g, 'Recall $1 cells in any order'],
    [/观察顺序 (\d+)\/(\d+)，暂时不要点击/g, 'Observe item $1/$2; do not click yet'],
    [/已点对 (\d+)\/(\d+) 个，请选择第 (\d+) 个图标/g, 'Correct $1/$2 · Select icon $3 next'],
    [/(\d+)个/g, '$1'],
    [/开始第 (\d+) 关/g, 'Start level $1'],
    [/正序挑战：按方格亮起的先后顺序点击/g, 'Forward: click cells in the order they lit up'],
    [/倒序挑战：按方格亮起的相反顺序点击/g, 'Reverse: click cells in the opposite order'],
    [/本关(正序|倒序)复现，点击开始后观察/g, '$1 recall · Click Start to observe'],
    [/开始(正序|倒序)训练/g, 'Start $1 recall'],
    [/记住 (\d+) 格/g, 'Remember $1 cells'],
    [/(\d+)-Back 刷新流/g, '$1-Back groups'],
    [/观察瞬记 \[位置\+图标\]\.\.\./g, 'Memorize positions and icons...'],
    [/观察本组 (\d+) 项，全部出现完再判断一致或不一致（(\d+)\/(\d+)）/g, 'Observe all $1 items, then choose Match or Different ($2/$3)'],
    [/记住第一组…/g, 'Remember the first group…'],
    [/判断 (\d+) \/ 10 组/g, 'Judgment $1 / 10'],
    [/第 (\d+) 组 · (\d+)\/(\d+) 项/g, 'Group $1 · Item $2/$3'],
    [/([\d.]+) 分(?!钟)/g, '$1 pts'],
    [/在全国 31 省平均专注力天梯榜排名：第 (\d+) 名/g, ' · Rank $1 of 31 provinces'],
    [/发给你的人 \((.*?)\)/g, 'Challenger ($1)'],
    [/恭喜！你成功战胜了发给你的人（(.*?)），前额叶控制力与敏捷反应超越同龄好友！/g, 'Congratulations! You beat $1 in this challenge.'],
    [/本次落后于发给你的人（(.*?)），不要灰心！针对性训练可快速激活专注力，快再试一次逆袭！/g, '$1 won this round. Keep practicing and try again!'],
    [/💡 复制或扫码添加时请备注：【专注力\+第 (\d+) 关\+(\d+)分】，老师将在 5 分钟内为您发送诊断报告与资料！/g, '💡 When adding the contact, include: Focus + level $1 + $2 points. The teacher will send your report and resources within 5 minutes.'],
    [/\(8岁\)/g, '(age 8)'],

    [/每 (\d+) 项为一组，等整组显示完再与上一组比较。/g, 'Each group has $1 items. Wait for the whole group, then compare it with the previous group.'],
    [/本关只统计(.+?)圆点的次数/g, 'Count only $1 circles'],
    [/，其他颜色不计数。本关只会出现以下颜色，配色在本关内保持不变。/g, '. Ignore other colors. Only the colors below can appear in this level; the palette stays the same throughout.'],
    [/分别统计(.+?)和(.+?)，每组 (\d+) 次/g, 'Count $1 and $2 separately · $3 items per group'],
    [/点击选择(.+?)和(.+?)的次数/g, 'Select the counts for $1 and $2'],
    [/试听(.+)/g, 'Listen: $1'], [/准备播放 · (\d+)/g, 'Starting in $1'],
    [/第 (\d+) 关/g, 'Level $1'], [/开始第 (\d+) 关/g, 'Start level $1'],
    [/连续正确 (\d+)\/(\d+) 次/g, 'Correct streak $1/$2 answers'],
    [/连续正确 (\d+) 次升级/g, 'Advance after $1 correct answers in a row'],
    [/连续正确 (\d+)\/(\d+) 组/g, 'Correct streak $1/$2 groups'],
    [/连续正确 (\d+) 组升级/g, 'Advance after $1 correct groups in a row'],
    [/；失误重置进度，第三次失误结束。/g, '. An error resets progress. The third error ends the run.'],
    [/在 (\d+)×(\d+) 棋盘中，将 (\d+) 件物体各选一次即可升级/g, 'Pick each of the $3 objects once in the $1×$2 grid to advance'],
    [/(\d+) 秒内答对 (\d+) 次升级，换题时倒计时继续/g, 'Get $2 correct answers in $1 seconds to advance. The timer continues between trials'],
    [/(\d+) 个词 · (\d+) 类/g, '$1 words · $2 categories'], [/(\d+) 个图标 · 顺序复原/g, '$1 icons · Recall the order'],
    [/(\d+) 个图标 · 正序复原/g, '$1 icons · Forward recall'], [/(\d+) 个图标 · 倒序复原/g, '$1 icons · Reverse recall'],
    [/(\d+)×(\d+) · (\d+) 个图标/g, '$1×$2 · $3 icons'],
    [/(\d+) 种规则/g, '$1 rules'], [/(\d+) 颗球/g, '$1 balls'], [/(\d+) 座车站/g, '$1 stations'], [/(\d+(?:\.\d+)?) 秒\/题/g, '$1 s per response'],
    [/(\d+) 件物体/g, '$1 objects'], [/(\d+) 只小鸟/g, '$1 birds'], [/(\d+) 次视听呈现/g, '$1 audiovisual items'],
    [/(\d+) 项\/组/g, '$1 items/group'], [/(\d+) 个选项/g, '$1 choices'],
    [/已选 (\d+)\/(\d+) 件/g, 'Picked $1/$2 objects'], [/完成 (\d+)\/1 张/g, 'Completed $1/1 grid'],
    [/答对 (\d+)\/(\d+) 次/g, 'Correct $1/$2'], [/本组第 (\d+)\/(\d+) 项/g, 'Item $1/$2'],
    [/，记住各类别的次数/g, ' · Keep count of each category'], [/请选择出现次数最多的类别，可以点击“再听一次”重播整组/g, 'Choose the most frequent category. Replay repeats this group.'],
    [/选一个本组没选过的物体，已选 (\d+)\/(\d+) 件/g, 'Pick an object you have not selected · $1/$2 picked'],
    [/点错了，请继续寻找数字 (\d+)/g, 'Wrong number. Keep looking for $1.'],
    [/已找到 (\d+)\/(\d+)，继续找 (\d+)/g, 'Found $1/$2 · Find $3 next'],
    [/请点击数字 (\d+)/g, 'Click number $1'], [/请选择第 (\d+) 个出现的图标/g, 'Select icon $1 in the original order'],
    [/已复原 (\d+)\/(\d+) 个图标/g, 'Recalled $1/$2 icons'],
    [/记住 (\d+) 颗金色目标球/g, 'Remember $1 gold target balls'], [/找回全部 (\d+) 颗目标球/g, 'Find all $1 target balls'],
    [/小球 (\d+)/g, 'Ball $1'], [/物体 (\d+)/g, 'Object $1'], [/出口 (\d+)/g, 'Exit $1'],
    [/记住 (\d+) 面镜子，隐藏后推算出口/g, 'Remember $1 mirrors. Work out the exit after they disappear'],
    [/调节道岔，送入同色车站 · (\d+)\/(\d+)/g, 'Route trains to matching stations · $1/$2'], [/送达 (\d+)\/(\d+)/g, 'Delivered $1/$2'],
    [/本题限时 ([\d.]+) 秒。/g, 'Time per trial: $1 seconds.'], [/每题节奏 ([\d.]+) 秒；该收手时不要点击。/g, 'Each trial lasts $1 seconds. Hold when required.'],
    [/挑战结束 · 止步Level (\d+)/g, 'Run ended at level $1'], [/🏆 恭喜！(\d+) 关大满贯通关！/g, '🏆 Congratulations! All $1 levels complete!'],
    [/冲至Level (\d+)/g, 'Reached level $1'], [/达成Level (\d+)！晋级Level (\d+)/g, 'Level $1 complete! Moving to level $2'],
    [/(\d+)分/g, '$1 pts'], [/心数 -1/g, 'One heart lost'],
    [/视觉：只数/g, 'Color: count only '], [/　声音：只数/g, ' · Sound: count only '],
    [/圆点/g, ' circle'], [/次数/g, ' count'], [/（本关目标）/g, ' (target)'],
    [/本关选择/g, 'Level picks'],
    [/当前规则：按(.+?)分拣/g, 'Current rule: sort by $1'], [/ · 顶部又旋转 (\d+)°/g, ' · Rotated $1°'],
    [/：左/g, ': Left'], [/：右/g, ': Right'], [/准备好后点击开始/g, 'Click Start when ready'],
    [/第 (\d+) 组/g, 'Group $1'],
    [/，准备好后点击开始/g, ' · Click Start when ready'], [/开始 (\d+)-Back/g, 'Start $1-Back']
  ];
  const entries = Object.entries(labels).sort((a, b) => b[0].length - a[0].length);
  function text(source) {
    if (language !== 'en') return source;
    if (labels[source.trim()]) return source.replace(source.trim(), labels[source.trim()]);
    let result = source;
    if (source.includes('→')) result = result.replace(/像素\/秒/g, 'px/s').replace(/分钟/g, 'min').replace(/ 秒/g, ' s').replace(/ 倍/g, '×').replace(/每 (\d+) 题/g, 'every $1 questions');
    patterns.forEach(([pattern, value]) => { result = result.replace(pattern, value); });
    entries.forEach(([zh, en]) => { result = result.split(zh).join(en); });
    return result.replace(/母版 /g, 'Game ').replace(/开始Level/g, 'Start level').replace(/，/g, ', ').replace(/；/g, '; ').replace(/。/g, '.');
  }
  const originals = new WeakMap();
  function apply(node, attribute) {
    const current = attribute ? node.getAttribute(attribute) : node.nodeValue;
    if (!current) return;
    let values = originals.get(node);
    if (!values) { values = {}; originals.set(node, values); }
    const slot = attribute || 'text';
    if (!values[slot] || current !== values[slot].rendered) values[slot] = { source: current, rendered: current };
    const translated = text(values[slot].source);
    values[slot].rendered = translated;
    if (current !== translated) attribute ? node.setAttribute(attribute, translated) : node.nodeValue = translated;
  }
  function refresh(root) {
    if (!root.isConnected || (root.parentElement && root.parentElement.closest('[translate="no"],script,style'))) return;
    if (root.nodeType === Node.TEXT_NODE) { apply(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches('[translate="no"],script,style')) return;
    ['title', 'alt', 'aria-label'].forEach(name => apply(root, name));
    root.childNodes.forEach(refresh);
  }
  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'zh';
    localStorage.setItem(key, language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    refresh(document.body); refresh(document.querySelector('title'));
    document.querySelectorAll('[data-focus-language]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.focusLanguage === language)); });
  }
  window.FocusLanguage = { text, setLanguage, get language() { return language; } };
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-focus-language]').forEach(button => { button.onclick = () => setLanguage(button.dataset.focusLanguage); });
    setLanguage(language);
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'childList') record.addedNodes.forEach(refresh);
        else if (record.type === 'attributes') apply(record.target, record.attributeName);
        else refresh(record.target);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'alt', 'aria-label'] });
  });
  window.addEventListener('storage', event => { if (event.key === key) setLanguage(event.newValue); });
})();
