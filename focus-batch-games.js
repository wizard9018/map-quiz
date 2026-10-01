// Masters 04–10: shared round lifecycle, separate task rules.
(function (root) {
  'use strict';
  const definitions = [
    ['tidal_treasures', 4, '排他性情景记忆提取', 'memory', '每次选一个本组从未选过的物体，潮水会打乱位置'],
    ['semantic_synthesis', 5, '听觉语义概念综摄', 'memory', '听完整组词语，选择出现次数最多的类别'],
    ['schulte_ladder', 6, '舒尔特注意力阶梯', 'focus', '在限时内从 1 开始，按数字顺序找齐方格'],
    ['cambridge_decoder', 7, '图标顺序复原', 'memory', '记住图标出现的顺序，再按原顺序依次点击'],
    ['flanker_birds', 8, '迷途鸟群侧抑制', 'focus', '找到带下划线的小鸟，限时内完成规定次数的方向判断'],
    ['ufov_dual_field', 9, '双重视野捕获', 'focus', '同时记住中心图形和周边金色星星的位置'],
    ['bimodal_divert', 10, '视听双通道分流', 'focus', '分别统计本关指定颜色与目标音色的次数']
  ];
  const registry = Object.fromEntries(definitions.map(([id, masterId, title, academy, prompt]) =>
    [id, { masterId, title: `母版 ${String(masterId).padStart(2, '0')} · ${title}`, academy, prompt,
      modality: 'batch_master', gesture: 'task_specific', engine: 'batch_master' }]));
  const objects = ['bird', 'football', 'balloon', 'plane', 'kite', 'butterfly', 'fish', 'rocket', 'star', 'apple', 'umbrella', 'leaf', 'clock'];
  const objectNames = { bird: '小鸟', football: '足球', balloon: '气球', plane: '飞机', kite: '风筝', butterfly: '蝴蝶', fish: '小鱼', rocket: '火箭', star: '星星', apple: '苹果', umbrella: '雨伞', leaf: '树叶', clock: '时钟' };
  const vocabulary = {
    水果: ['苹果', '香蕉', '葡萄', '西瓜', '桃子', '橙子'],
    动物: ['小猫', '小狗', '大象', '老虎', '兔子', '熊猫'],
    交通工具: ['汽车', '火车', '飞机', '轮船', '自行车', '公交车'],
    蔬菜: ['白菜', '萝卜', '黄瓜', '菠菜', '茄子', '土豆'],
    学习用品: ['铅笔', '橡皮', '尺子', '书包', '作业本', '文具盒'],
    家具: ['桌子', '椅子', '沙发', '衣柜', '床', '书架'],
    昆虫: ['蝴蝶', '蜜蜂', '蚂蚁', '蜻蜓', '瓢虫', '蚱蜢']
  };
  // Keep the existing recording numbers stable when extending a category.
  const audioWords = Object.values(vocabulary).flat();
  const extraWords = {
    水果: ['梨子', '草莓', '芒果', '菠萝', '柠檬', '樱桃', '猕猴桃', '荔枝', '龙眼', '石榴', '柚子', '蓝莓', '李子', '杏子'],
    动物: ['绵羊', '奶牛', '骏马', '狮子', '长颈鹿', '斑马', '猴子', '狐狸', '狼', '袋鼠', '松鼠', '河马', '企鹅', '海豚'],
    交通工具: ['地铁', '出租车', '摩托车', '电动车', '三轮车', '卡车', '面包车', '救护车', '消防车', '警车', '高铁', '有轨电车', '帆船', '直升机'],
    蔬菜: ['西红柿', '青椒', '南瓜', '冬瓜', '丝瓜', '苦瓜', '洋葱', '大蒜', '韭菜', '芹菜', '生菜', '花菜', '莲藕', '西兰花'],
    学习用品: ['钢笔', '圆珠笔', '彩笔', '蜡笔', '毛笔', '水彩笔', '卷笔刀', '订书机', '剪刀', '胶水', '笔记本', '字典', '练习本', '计算器'],
    家具: ['茶几', '餐桌', '书桌', '鞋柜', '电视柜', '床头柜', '梳妆台', '凳子', '摇椅', '躺椅', '橱柜', '酒柜', '电脑桌', '屏风'],
    昆虫: ['蝉', '蟋蟀', '萤火虫', '螳螂', '蚕', '金龟子', '天牛', '蝈蝈', '豆娘', '竹节虫', '蟑螂', '白蚁', '蚊子', '苍蝇']
  };
  Object.entries(extraWords).forEach(([category, words]) => { vocabulary[category].push(...words); audioWords.push(...words); });
  function outerPositions(size) { return Array.from({ length: size * size }, (_, i) => i).filter(i => Math.floor(i / size) === 0 || Math.floor(i / size) === size - 1 || i % size === 0 || i % size === size - 1); }
  function shuffle(values) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function pick(values) { return values[Math.floor(Math.random() * values.length)]; }
  function getConfig(id, level) {
    const base = { required: 5 };
    if (id === 'tidal_treasures') return { required: 1, count: level + 3, size: level < 6 ? 4 : 5 };
    if (id === 'semantic_synthesis') return { required: 3, count: 5 + 2 * Math.floor(level / 2), categoryCount: 2 + Math.floor((level - 1) / 2), rate: 0.8 + level * 0.03 };
    if (id === 'schulte_ladder') return { required: 1, size: 3 + Math.floor((level - 1) / 3), limit: 20000 + 10000 * Math.floor((level - 1) / 3) - 5000 * ((level - 1) % 3) };
    if (id === 'cambridge_decoder') return { required: 3, count: level + 2, exposure: 800 - (level - 1) * 50 };
    if (id === 'flanker_birds') {
      const rows = 2 + Math.floor((level - 1) / 2), cols = Math.min(6, 2 + Math.floor(level / 2));
      return { required: 8 + (level - 1) * 2, rows, cols, count: rows * cols, directions: level < 6 ? ['left', 'right'] : ['left', 'right', 'up', 'down'], conflict: 0.2 + level * 0.06, limit: level <= 5 ? 20000 : 25000 };
    }
    if (id === 'ufov_dual_field') return { ...base, size: level < 6 ? 3 : 5, options: Math.min(6, 2 + Math.floor((level - 1) / 2)), triple: level >= 11, exposure: Math.max(280, 1000 - (level - 1) * 80), distractors: Math.floor((Math.min(level, 10) - 1) / 3) };
    return { ...base, count: level + 1, exposure: 750, colors: level < 6 ? ['blue', 'orange'] : ['blue', 'orange', 'green'], targetColor: level < 6 ? (level % 2 ? 'blue' : 'orange') : ['green', 'blue', 'orange'][(level - 6) % 3], targetSound: level % 2 ? 'clear' : 'soft' };
  }
  function generateTrial(id, level, previous) {
    const cfg = getConfig(id, level);
    if (id === 'tidal_treasures') return { objects: shuffle(objects).slice(0, cfg.count) };
    if (id === 'semantic_synthesis') {
      const pool = Object.keys(vocabulary);
      const oldCategories = previous ? previous.categories : [];
      const categories = [...shuffle(pool.filter(value => !oldCategories.includes(value))), ...shuffle(oldCategories)].slice(0, cfg.categoryCount);
      const counts = Object.fromEntries(categories.map(category => [category, 1]));
      for (let i = categories.length; i < cfg.count; i++) counts[pick(categories.filter(value => counts[value] < vocabulary[value].length))]++;
      const maximum = Math.max(...Object.values(counts));
      const leaders = categories.filter(category => counts[category] === maximum);
      const category = pick(leaders);
      if (leaders.length > 1) { counts[category]++; counts[leaders.find(value => value !== category)]--; }
      const words = shuffle(categories.flatMap(value => shuffle(vocabulary[value]).slice(0, counts[value]).map(word => ({ word, category: value }))));
      return { category, categories: shuffle(categories), words };
    }
    if (id === 'schulte_ladder') return { numbers: shuffle(Array.from({ length: cfg.size * cfg.size }, (_, i) => i + 1)) };
    if (id === 'cambridge_decoder') {
      const sequence = shuffle(objects).slice(0, cfg.count);
      const choices = shuffle(sequence);
      if (choices.every((object, index) => object === sequence[index])) choices.push(choices.shift());
      return { sequence, choices };
    }
    if (id === 'flanker_birds') {
      const direction = pick(cfg.directions);
      const target = pick(Array.from({ length: cfg.count }, (_, i) => i).filter(i => !previous || i !== previous.target));
      const birds = Array.from({ length: cfg.count }, (_, i) => i === target ? direction :
        Math.random() < cfg.conflict ? pick(cfg.directions.filter(value => value !== direction)) : direction);
      const minimumChanges = Math.floor(cfg.count / 2) + 1;
      if (previous && Math.min(previous.birds.length, cfg.count) >= minimumChanges) {
        const overlap = Math.min(previous.birds.length, cfg.count);
        for (let i = 0; i < overlap; i++) birds[i] = cfg.directions.includes(previous.birds[i]) ? previous.birds[i] : pick(cfg.directions);
        const changed = shuffle(Array.from({ length: overlap }, (_, i) => i)).slice(0, minimumChanges + Math.floor(Math.random() * (overlap - minimumChanges + 1)));
        changed.forEach(i => { birds[i] = pick(cfg.directions.filter(value => value !== previous.birds[i])); });
      }
      return { direction: birds[target], target, birds };
    }
    if (id === 'ufov_dual_field') {
      const positions = shuffle(outerPositions(cfg.size));
      const pool = objects.filter(object => object !== 'star');
      const object = pick(pool.filter(value => !previous || value !== previous.object));
      return { object, choices: shuffle([object, ...shuffle(pool.filter(value => value !== object)).slice(0, cfg.options - 1)]), position: positions[0], heart: cfg.triple ? positions[1] : null, distractors: positions.slice(cfg.triple ? 2 : 1, (cfg.triple ? 2 : 1) + cfg.distractors) };
    }
    const distractorPool = ['blue', 'orange', 'green', 'purple', 'pink', 'yellow', 'red'].filter(color => color !== cfg.targetColor);
    const distractors = shuffle(distractorPool).slice(0, cfg.colors.length - 1);
    if (previous && distractors.every(color => previous.colors.includes(color)) && previous.colors.includes(cfg.targetColor)) distractors[0] = pick(distractorPool.filter(color => !previous.colors.includes(color)));
    const colors = [cfg.targetColor, ...distractors];
    const sequence = Array.from({ length: cfg.count }, () => pick(colors));
    const steps = sequence.map(color => ({ color, sound: pick(['clear', 'soft']) }));
    return { colors, steps, colorCount: steps.filter(step => step.color === cfg.targetColor).length, soundCount: steps.filter(step => step.sound === cfg.targetSound).length };
  }

  function render(level, host) {
    const { state, el, playTone, soundSuccess, deductLife, nextLevel, updateTimerDisplay } = host;
    const id = state.gameId;
    const cfg = getConfig(id, level);
    if (id === 'bimodal_divert') el.gamePrompt.textContent = '分别统计' + { blue: '蓝色', orange: '橙色', green: '绿色' }[cfg.targetColor] + '和' + (cfg.targetSound === 'clear' ? '清亮音' : '柔和音') + '，每组 ' + cfg.count + ' 次';
    if (id === 'ufov_dual_field') el.gamePrompt.textContent = cfg.triple ? '依次记住并选择中心图形、星星位置、心形位置' : registry[id].prompt;
    const sub = state.subState = { phase: 'ready', completed: 0, timers: new Set(), ticker: null, token: 0, textMode: false, timerHandle: null };
    const wrap = document.createElement('div');
    wrap.className = 'batch-master-stage';
    wrap.innerHTML = '<div class="nback-meta-bar"><span class="nback-mode-pill" id="batch-difficulty"></span><span id="batch-progress"></span></div><div class="batch-task-card" id="batch-card"></div><p class="batch-status" role="status" aria-live="polite" id="batch-status"></p>';
    el.stage.appendChild(wrap);
    const card = wrap.querySelector('#batch-card');
    const status = wrap.querySelector('#batch-status');
    const difficulty = wrap.querySelector('#batch-difficulty');
    difficulty.textContent = id === 'tidal_treasures' ? `${cfg.count} 件物体` : id === 'schulte_ladder' ? `${cfg.size}×${cfg.size} · ${cfg.limit / 1000} 秒` :
      id === 'semantic_synthesis' ? `${cfg.count} 个词 · ${cfg.categoryCount} 类` : id === 'cambridge_decoder' ? `${cfg.count} 个图标 · 顺序复原` :
      id === 'flanker_birds' ? `${cfg.rows}×${cfg.cols} · ${cfg.count} 只小鸟` : id === 'ufov_dual_field' ? `${cfg.size}×${cfg.size} · ${cfg.triple ? '三重' : '双重'}视野` : `${cfg.count} 次视听呈现`;
    function progress() { wrap.querySelector('#batch-progress').textContent = id === 'tidal_treasures' ? `已选 ${sub.picked ? sub.picked.size : 0}/${cfg.count} 件` : id === 'schulte_ladder' ? `完成 ${sub.completed}/1 张` : id === 'flanker_birds' ? `答对 ${sub.completed}/${cfg.required} 次` : `连续正确 ${sub.completed}/${cfg.required} 组`; }
    function later(fn, delay) {
      const timer = setTimeout(() => { sub.timers.delete(timer); if (state.subState === sub && sub.phase !== 'finished') fn(); }, delay);
      sub.timers.add(timer);
      return timer;
    }
    function clearTimers() {
      sub.timers.forEach(clearTimeout);
      sub.timers.clear();
      clearInterval(sub.ticker);
      sub.ticker = null;
      if (sub.audio) { sub.audio.pause(); sub.audio = null; }
    }
    function clearLevelTimer() {
      clearInterval(sub.levelTicker); clearTimeout(sub.levelTimeout); sub.levelTimeout = null;
    }
    function lock() { wrap.querySelectorAll('button, select').forEach(node => { node.disabled = true; }); el.controls.querySelectorAll('button, select').forEach(node => { node.disabled = true; }); }
    function answerPhase(phase = 'answer') { sub.phase = phase; sub.answerStart = Date.now(); }
    function button(label, value, action, container = el.controls) {
      const node = document.createElement('button');
      node.className = 'batch-choice'; node.type = 'button'; node.textContent = label; node.dataset.choice = value;
      node.onclick = () => action(value); container.appendChild(node); return node;
    }
    function choiceRow(items, action) {
      el.controls.innerHTML = '';
      const row = document.createElement('div'); row.className = 'batch-choice-row'; el.controls.appendChild(row);
      items.forEach(([label, value]) => button(label, value, action, row));
      return row;
    }
    function makeGrid(size, handler) {
      const grid = document.createElement('div'); grid.className = 'batch-grid';
      grid.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
      grid.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;
      card.replaceChildren(grid);
      for (let pos = 0; pos < size * size; pos++) {
        const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'matrix-flash-cell batch-cell'; cell.dataset.pos = pos;
        cell.setAttribute('aria-label', `第 ${Math.floor(pos / size) + 1} 行第 ${pos % size + 1} 列`);
        cell.onclick = () => handler(pos, cell); grid.appendChild(cell);
      }
      return grid;
    }
    function image(object) { return `<img class="batch-object" src="assets/distractions/${object}.svg" alt="">`; }
    function fail(reason) {
      if (sub.phase === 'error' || sub.phase === 'finished' || (sub.phase === 'pause' && (id !== 'flanker_birds' || sub.completed === cfg.required))) return;
      sub.phase = 'error'; clearTimers(); clearLevelTimer(); lock(); deductLife(reason);
    }
    function pass() {
      if (sub.phase === 'pause' || sub.phase === 'finished') return;
      if (id === 'flanker_birds' && Date.now() >= sub.levelDeadline) { fail(`${cfg.limit / 1000} 秒内未完成规定次数`); return; }
      sub.phase = 'pause'; clearTimers(); lock();
      sub.completed++; state.stats.correct++; state.stats.reactionTimes.push(Date.now() - sub.answerStart); soundSuccess(); progress();
      if (sub.completed === cfg.required) clearLevelTimer();
      status.textContent = sub.completed === cfg.required ? '本关完成！' : '本组正确，准备下一组';
      later(sub.completed === cfg.required ? nextLevel : beginRound, 600);
    }
    function decide(value, expected) {
      if (sub.phase !== 'answer') return;
      state.stats.clicks++;
      value === expected ? pass() : fail('判断错误，请认真观察下一组');
    }
    sub.restart = () => {
      if (id === 'tidal_treasures') sub.picked = new Set();
      sub.completed = 0; progress();
      const notice = document.createElement('div'); notice.className = 'nback-transition-notice batch-error-notice'; notice.setAttribute('role', 'alert');
      notice.innerHTML = `<h3>本组失误</h3><p>${id === 'tidal_treasures' ? '本关选择' : '连续'}进度已重置，要认真对待哦！</p><p>2 秒后重新开始…</p>`; card.appendChild(notice);
      status.textContent = '重新准备，先记住任务规则';
      later(beginRound, 2000);
    };
    sub.destroy = () => { sub.phase = 'finished'; sub.token++; clearTimers(); clearLevelTimer(); clearTimeout(sub.timerHandle); lock(); };

    function treasures(trial) {
      sub.picked = new Set();
      function wave() {
        answerPhase();
        const grid = makeGrid(cfg.size, (pos, cell) => {
          if (sub.phase !== 'answer' || !cell.dataset.object) return;
          state.stats.clicks++;
          const object = cell.dataset.object;
          if (sub.picked.has(object)) { fail('重复选择了本组已经选过的物体'); return; }
          sub.picked.add(object); progress(); cell.classList.add('matrix-correct');
          if (sub.picked.size === cfg.count) pass();
          else { sub.phase = 'wave'; lock(); status.textContent = `已选 ${sub.picked.size}/${cfg.count} 件，潮水正在打乱位置`; later(wave, 350); }
        });
        const positions = shuffle(Array.from({ length: cfg.size * cfg.size }, (_, i) => i));
        Array.from(grid.children).forEach(cell => { cell.disabled = true; });
        shuffle(trial.objects).forEach((object, i) => { const cell = grid.children[positions[i]]; cell.disabled = false; cell.dataset.object = object; cell.innerHTML = image(object); });
        status.textContent = `选一个本组没选过的物体，已选 ${sub.picked.size}/${cfg.count} 件`;
        el.controls.textContent = '只记物体是否选过，不要只记位置';
      }
      wave();
    }
    function semantics(trial) {
      card.innerHTML = '<div class="batch-stream-display" id="batch-word">听一听词语</div><div class="batch-audio-tools"></div>';
      const word = card.querySelector('#batch-word');
      const tools = card.querySelector('.batch-audio-tools');
      const row = choiceRow(trial.categories.map(category => [category, category]), value => decide(value, trial.category));
      function unavailable() {
        if (sub.phase !== 'listening') return;
        sub.phase = 'audio-unavailable'; status.textContent = '声音暂不可用，请点击“再听一次”重试，或选择“文字练习”';
      }
      function present(textMode) {
        sub.token++; clearTimers(); const token = sub.token;
        sub.textMode = textMode;
        sub.phase = 'listening'; row.querySelectorAll('button').forEach(node => { node.disabled = true; });
        function show(index) {
          word.setAttribute('translate', textMode ? 'no' : 'yes');
          word.textContent = textMode ? trial.words[index].word : '正在读词语…';
          status.textContent = `${textMode ? '文字练习（不是纯听觉任务）' : '听词语'} ${index + 1}/${cfg.count}，记住各类别的次数`;
          function done() {
            if (state.subState !== sub || sub.token !== token || sub.phase !== 'listening') return;
            clearTimers();
            if (index + 1 < trial.words.length) later(() => show(index + 1), 300);
            else {
              answerPhase(); word.setAttribute('translate', 'yes'); word.textContent = '哪个类别出现最多？';
              status.textContent = `${textMode ? '文字练习：' : ''}请选择出现次数最多的类别，可以点击“再听一次”重播整组`;
              row.querySelectorAll('button').forEach(node => { node.disabled = false; });
            }
          }
          if (textMode) { later(done, 1500); return; }
          const wordIndex = audioWords.indexOf(trial.words[index].word) + 1;
          const audio = sub.audio = new root.Audio(`assets/semantic-audio/word-${String(wordIndex).padStart(2, '0')}.wav`);
          audio.playbackRate = cfg.rate; audio.volume = 1; audio.onended = done;
          audio.onerror = () => { if (sub.token === token) unavailable(); };
          later(unavailable, 8000);
          audio.play().catch(() => { if (state.subState === sub && sub.token === token) unavailable(); });
        }
        show(0);
      }
      function listen() { present(false); }
      function textPractice() { present(true); }
      button('再听一次', 'replay', listen, tools); button('文字练习', 'text', textPractice, tools);
      if (sub.textMode) textPractice(); else listen();
    }
    function schulte(trial) {
      sub.nextNumber = 1;
      const grid = makeGrid(cfg.size, (pos, cell) => {
        if (sub.phase !== 'answer' || cell.disabled) return;
        state.stats.clicks++;
        if (Number(cell.dataset.number) !== sub.nextNumber) { status.textContent = `点错了，请继续寻找数字 ${sub.nextNumber}`; return; }
        cell.disabled = true; cell.classList.add('matrix-correct'); sub.nextNumber++;
        if (sub.nextNumber > trial.numbers.length) pass(); else status.textContent = `下一格：${sub.nextNumber}`;
      });
      trial.numbers.forEach((number, pos) => { grid.children[pos].textContent = number; grid.children[pos].dataset.number = number; });
      answerPhase(); state.timer = cfg.limit / 1000; updateTimerDisplay();
      const deadline = Date.now() + cfg.limit;
      sub.ticker = setInterval(() => { state.timer = Math.max(0, (deadline - Date.now()) / 1000); updateTimerDisplay(); }, 100);
      later(() => fail('本组时间耗尽，请重新从 1 开始'), cfg.limit);
      status.textContent = '从 1 开始，按顺序找齐所有数字'; el.controls.textContent = '点错可继续，倒计时不停；限时内找齐即可过关';
    }
    function stream(items, exposure, display, renderItem, done) {
      sub.phase = 'display';
      function show(index) {
        renderItem(items[index], display); status.textContent = `观察 ${index + 1}/${items.length}`;
        later(() => {
          display.innerHTML = '';
          if (index + 1 < items.length) later(() => show(index + 1), 180);
          else later(done, 200);
        }, exposure);
      }
      show(0);
    }
    function decoder(trial) {
      card.innerHTML = '<div class="batch-stream-display batch-icon-display"></div>';
      const display = card.querySelector('.batch-stream-display');
      el.controls.textContent = '先观察全部图标，随后按原顺序依次点击';
      stream(trial.sequence, cfg.exposure, display, (object, target) => {
        target.innerHTML = image(object); playTone(440, 'triangle', 0.12, 0.12);
      }, () => {
        display.remove(); answerPhase(); let next = 0;
        const choices = document.createElement('div'); choices.className = 'batch-icon-choices';
        choices.style.gridTemplateColumns = `repeat(${Math.min(6, cfg.count)}, minmax(0, 1fr))`;
        card.appendChild(choices);
        trial.choices.forEach((object, index) => {
          const choice = document.createElement('button'); choice.type = 'button'; choice.className = 'batch-choice batch-icon-choice';
          choice.dataset.object = object; choice.innerHTML = image(object); choice.setAttribute('aria-label', `选择图标 ${index + 1}`);
          choice.onclick = () => {
            if (sub.phase !== 'answer' || choice.disabled) return;
            state.stats.clicks++;
            if (object !== trial.sequence[next]) { fail('图标顺序记错了，请重新观察'); return; }
            choice.disabled = true; choice.setAttribute('aria-label', `图标 ${index + 1} 已选对`); next++;
            if (next === cfg.count) pass();
            else status.textContent = `已点对 ${next}/${cfg.count} 个，请选择第 ${next + 1} 个图标`;
          };
          choices.appendChild(choice);
        });
        status.textContent = '请选择第 1 个出现的图标'; el.controls.textContent = '按出现顺序依次点击图标；每个图标只点一次';
      });
    }
    function flanker(trial) {
      state.flankerPrevious = trial;
      card.innerHTML = '<div class="batch-flanker-grid"></div>';
      const birds = card.firstChild;
      birds.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;
      birds.style.aspectRatio = `${cfg.cols}/${cfg.rows}`;
      trial.birds.forEach((direction, i) => {
        const bird = document.createElement('span'); bird.className = 'batch-flanker-bird' + (i === trial.target ? ' batch-flanker-target' : '');
        bird.dataset.direction = direction; bird.innerHTML = image('bird'); bird.classList.add(`batch-bird-${direction}`); birds.appendChild(bird);
      });
      sub.handleDirection = value => { if (cfg.directions.includes(value)) decide(value, trial.direction); };
      const labels = { left: '← 左', right: '右 →', up: '↑ 上', down: '下 ↓' };
      const dial = choiceRow(['up', 'right', 'down', 'left'].map(value => [labels[value], value]), sub.handleDirection);
      dial.classList.add('flanker-dial'); dial.setAttribute('aria-label', '圆形方向控制');
      dial.querySelectorAll('button').forEach(node => {
        node.classList.add(`flanker-sector-${node.dataset.choice}`);
        node.innerHTML = `<span>${labels[node.dataset.choice]}</span>`;
        node.disabled = !cfg.directions.includes(node.dataset.choice);
      });
      dial.insertAdjacentHTML('beforeend', '<svg class="flanker-dial-lines" viewBox="0 0 180 180" aria-hidden="true"><path d="M0 0L180 180M180 0L0 180" fill="none" stroke="#0284c7" stroke-width="2"/></svg>');
      answerPhase(); status.textContent = '找到带下划线的小鸟，判断它的方向';
      el.controls.insertAdjacentHTML('beforeend', `<p class="batch-keyboard-help">${level < 6 ? '← / → 或 A / D' : '方向键或 W / A / S / D'}，也可点击按钮</p>`);
      if (!sub.levelTimeout) {
        sub.levelDeadline = Date.now() + cfg.limit;
        state.timer = cfg.limit / 1000; updateTimerDisplay();
        sub.levelTicker = setInterval(() => { state.timer = Math.max(0, (sub.levelDeadline - Date.now()) / 1000); updateTimerDisplay(); }, 100);
        sub.levelTimeout = setTimeout(() => { state.timer = 0; updateTimerDisplay(); fail(`${cfg.limit / 1000} 秒内未完成规定次数`); }, cfg.limit);
      }
    }
    function ufov(trial) {
      state.ufovPrevious = trial;
      const center = Math.floor(cfg.size * cfg.size / 2);
      const peripheral = outerPositions(cfg.size);
      const grid = makeGrid(cfg.size, (pos, cell) => {
        if (!['location', 'heart'].includes(sub.phase) || pos === center) return;
        state.stats.clicks++;
        const isHeart = sub.phase === 'heart';
        if (pos !== (isHeart ? trial.heart : trial.position)) { fail(isHeart ? '心形位置记错了' : '周边星星位置记错了'); return; }
        cell.innerHTML = image(isHeart ? 'heart' : 'star'); cell.classList.add('matrix-correct'); cell.disabled = true;
        if (cfg.triple && !isHeart) { sub.phase = 'heart'; soundSuccess(); status.textContent = '星星位置正确！再点击心形刚才所在的位置'; }
        else { pass(); status.textContent = `${isHeart ? '心形' : '星星'}位置正确！本组完成`; }
      });
      Array.from(grid.children).forEach(cell => { cell.disabled = true; });
      grid.children[center].innerHTML = image(trial.object);
      grid.children[trial.position].innerHTML = image('star');
      if (cfg.triple) grid.children[trial.heart].innerHTML = image('heart');
      trial.distractors.forEach(pos => { grid.children[pos].innerHTML = '<span class="batch-gray-dot"></span>'; });
      function showChoices() {
        answerPhase('object');
        const row = choiceRow(trial.choices.map(object => [objectNames[object], object]), value => {
          if (sub.phase !== 'object') return;
          state.stats.clicks++;
          if (value !== trial.object) { fail('中心图形记错了'); return; }
          grid.children[center].innerHTML = image(trial.object); grid.children[center].classList.add('matrix-correct');
          row.querySelector(`[data-choice="${value}"]`).classList.add('ufov-choice-correct'); soundSuccess();
          sub.phase = 'location'; row.querySelectorAll('button').forEach(node => { node.disabled = true; });
          peripheral.forEach(pos => { grid.children[pos].disabled = false; }); status.textContent = '中心图形正确！再点击金色星星刚才所在的位置';
        });
        row.querySelectorAll('button').forEach(node => { node.innerHTML = image(node.dataset.choice) + `<span>${objectNames[node.dataset.choice]}</span>`; node.classList.add('ufov-object-choice'); });
        status.textContent = cfg.triple ? '依次选择中心图形、星星位置、心形位置' : '先选择中心图形，再点周边星星的位置';
      }
      sub.phase = 'display'; el.controls.textContent = '观察结束后再显示图形选项';
      status.textContent = cfg.triple ? '同时记住中心图形、星星和心形的位置' : '同时记住中心图形和周边金色星星的位置';
      later(() => {
        Array.from(grid.children).forEach(cell => { cell.innerHTML = ''; }); status.textContent = '保留中心和周边的信息…';
        later(showChoices, 200);
      }, cfg.exposure);
    }
    const colorNames = { blue: '蓝色', orange: '橙色', green: '绿色', purple: '紫色', pink: '粉色', yellow: '黄色', red: '红色' };
    const colorValues = { blue: '#0284c7', orange: '#f97316', green: '#16a34a', purple: '#9333ea', pink: '#ec4899', yellow: '#eab308', red: '#dc2626' };
    const soundNames = { clear: '清亮音', soft: '柔和音' };
    function playBimodalSound(sound) { playTone(sound === 'clear' ? 880 : 220, sound === 'clear' ? 'sine' : 'triangle', 0.2, 0.12); }
    function bimodal(trial) {
      card.innerHTML = '<div class="batch-targets">视觉：只数' + colorNames[cfg.targetColor] + '　声音：只数' + soundNames[cfg.targetSound] + '</div><div class="batch-stream-display"></div>';
      const selected = { color: null, sound: null };
      el.controls.innerHTML = '<div class="bimodal-count-form"></div>';
      const form = el.controls.firstChild;
      for (const [kind, label] of [['color', colorNames[cfg.targetColor] + '次数'], ['sound', soundNames[cfg.targetSound] + '次数']]) {
        const group = document.createElement('div'); group.className = 'bimodal-count-group'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
        group.innerHTML = '<span>' + label + '</span><div class="bimodal-count-options"></div>'; form.appendChild(group);
        for (let count = 0; count <= cfg.count; count++) {
          const option = button(String(count), kind + '-' + count, () => {
            if (sub.phase !== 'answer') return;
            selected[kind] = count;
            group.querySelectorAll('button').forEach(node => { const active = node === option; node.classList.toggle('bimodal-count-selected', active); node.setAttribute('aria-pressed', String(active)); });
          }, group.lastChild);
          option.disabled = true; option.setAttribute('aria-pressed', 'false');
        }
      }
      const submit = button('提交两项统计', 'submit', () => {
        if (sub.phase !== 'answer') return;
        if (selected.color === null || selected.sound === null) { status.textContent = '请分别选择两个次数，再提交'; return; }
        state.stats.clicks++;
        selected.color === trial.colorCount && selected.sound === trial.soundCount ? pass() : fail('两项统计至少有一项不准确');
      }, form); submit.disabled = true;
      const display = card.querySelector('.batch-stream-display');
      sub.phase = 'countdown';
      function countdown(number) {
        display.innerHTML = '<span class="bimodal-countdown">' + number + '</span>';
        status.textContent = '准备播放 · ' + number;
        later(() => {
          if (number > 1) { countdown(number - 1); return; }
          stream(trial.steps, cfg.exposure, display, (step, target) => {
            target.innerHTML = '<span class="batch-visual-target" style="border-radius:50%;background:' + colorValues[step.color] + '" data-color="' + step.color + '"></span>';
            playBimodalSound(step.sound);
          }, () => { answerPhase(); form.querySelectorAll('button').forEach(node => { node.disabled = false; }); status.textContent = '点击选择' + colorNames[cfg.targetColor] + '和' + soundNames[cfg.targetSound] + '的次数'; });
        }, 1000);
      }
      countdown(3);
    }
    function beginRound() {
      clearTimers(); sub.token++; card.innerHTML = ''; el.controls.innerHTML = ''; progress();
      const trial = generateTrial(id, level, id === 'flanker_birds' ? state.flankerPrevious : id === 'ufov_dual_field' ? state.ufovPrevious : id === 'bimodal_divert' ? sub.previousBimodal : id === 'semantic_synthesis' ? state.semanticPrevious : undefined);
      if (id === 'bimodal_divert') sub.previousBimodal = trial;
      if (id === 'semantic_synthesis') state.semanticPrevious = trial;
      if (id === 'tidal_treasures') treasures(trial);
      else if (id === 'semantic_synthesis') semantics(trial);
      else if (id === 'schulte_ladder') schulte(trial);
      else if (id === 'cambridge_decoder') decoder(trial);
      else if (id === 'flanker_birds') flanker(trial);
      else if (id === 'ufov_dual_field') ufov(trial);
      else bimodal(trial);
    }
    card.innerHTML = `<div class="batch-intro"><h3>${registry[id].title.split(' · ')[1]}</h3><p>${id === 'ufov_dual_field' && cfg.triple ? '记住中心图形、星星和心形；观察结束后依次选择图形、星星位置、心形位置' : el.gamePrompt.textContent}</p><p>${id === 'schulte_ladder' ? '限时内完成一张数字表即可升级；点错只提示，不重置、不扣心。超时扣心并重开，第三次超时结束。' : `${id === 'tidal_treasures' ? `在 ${cfg.size}×${cfg.size} 棋盘中，将 ${cfg.count} 件物体各选一次即可升级` : id === 'flanker_birds' ? `${cfg.limit / 1000} 秒内答对 ${cfg.required} 次升级，换题时倒计时继续` : `连续正确 ${cfg.required} 组升级`}；失误重置进度，第三次失误结束。`}</p></div>`;
    progress(); status.textContent = '准备好后点击开始'; el.controls.innerHTML = '';
    const start = document.createElement('button'); start.className = 'duo-btn'; start.textContent = `开始第 ${level} 关`; start.onclick = beginRound; el.controls.appendChild(start);
    if (id === 'schulte_ladder' || id === 'flanker_birds') { state.timer = cfg.limit / 1000; updateTimerDisplay(); }
    if (id === 'bimodal_divert') {
      const guide = document.createElement('div'); guide.className = 'bimodal-color-guide';
      guide.innerHTML = `<p><strong>本关只统计${colorNames[cfg.targetColor]}圆点的次数</strong>，其他颜色不计数。以下颜色均可能出现，干扰色每组随机更换。</p><div class="bimodal-color-previews">${Object.entries(colorValues).map(([color, value]) => `<div class="bimodal-color-preview${color === cfg.targetColor ? ' is-target' : ''}" data-color="${color}"><span role="img" aria-label="${colorNames[color]}圆点" class="bimodal-color-dot" style="background:${value}"></span><span>${colorNames[color]}${color === cfg.targetColor ? ' · 要数' : ''}</span></div>`).join('')}</div>`;
      card.firstChild.insertBefore(guide, card.firstChild.children[2]);
      const samples = document.createElement('div'); samples.className = 'batch-audio-tools'; card.firstChild.appendChild(samples);
      button('试听清亮音' + (cfg.targetSound === 'clear' ? '（本关目标）' : ''), 'clear', () => playBimodalSound('clear'), samples);
      button('试听柔和音' + (cfg.targetSound === 'soft' ? '（本关目标）' : ''), 'soft', () => playBimodalSound('soft'), samples);
    }
  }
  const api = { registry, definitions, getConfig, generateTrial, vocabulary, audioWords, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FocusBatchGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
