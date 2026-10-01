// Masters 11–20: inhibition, tracking and spatial reasoning.
(function (root) {
  'use strict';
  const definitions = [
    ['stroop_dimension', 11, '色词冲突切换', 'control', '按本题指令选择文字含义或墨水颜色，忽略另一维度'],
    ['simon_reverse', 12, '空间西蒙反转', 'control', '忽略箭头出现的位置，按规则选择箭头的同向或反向'],
    ['sst_stop_signal', 13, '紧急停止信号', 'control', '箭头出现时点击对应方向；出现停止信号时收手'],
    ['rhythm_seven', 14, '节奏逢7克制', 'control', '普通数字点击通过；7的倍数或含7的数字不要点击'],
    ['wcst_rule_switch', 15, '规则切换分拣', 'control', '按当前颜色、形状或数量规则，把卡片放入对应篮子'],
    ['mot_trajectory', 16, '多目标轨迹追踪', 'agility', '记住高亮小球，运动停止后找回所有目标'],
    ['odd_one_out', 17, '成双物体找孤品', 'agility', '其他物体都成双出现，找出唯一没有同伴的物体'],
    ['mental_rotation_clock', 18, '镜中时钟还原', 'agility', '观察镜像表盘，在脑中还原真实时间'],
    ['train_switch_dispatch', 19, '火车变轨调度', 'agility', '及时切换道岔，让每辆彩色火车进入同色车站'],
    ['laser_prism_deflect', 20, '激光镜面推演', 'agility', '记住镜面，隐藏后推算激光经过反射的出口']
  ];
  const registry = Object.fromEntries(definitions.map(([id, masterId, title, academy, prompt]) => [id, { masterId, title: `母版 ${masterId} · ${title}`, academy, prompt, engine: 'batch_master', modality: 'next_master', gesture: 'task_specific' }]));
  const colors = [{ name: '红', hex: '#dc2626' }, { name: '蓝', hex: '#2563eb' }, { name: '绿', hex: '#15803d' }, { name: '橙', hex: '#c2410c' }, { name: '紫', hex: '#9333ea' }];
  const shapes = ['●', '▲', '■'];
  const objects = ['bird', 'football', 'balloon', 'plane', 'kite', 'butterfly', 'fish', 'rocket', 'star', 'apple', 'umbrella', 'leaf', 'clock', 'heart'];
  const directions = ['left', 'right', 'up', 'down'];
  const arrows = { left: '←', right: '→', up: '↑', down: '↓' };
  const opposite = { left: 'right', right: 'left', up: 'down', down: 'up' };
  function shuffle(items) { const copy = items.slice(); for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
  function integer(max) { return Math.floor(Math.random() * max); }
  function getConfig(id, level) {
    const base = { required: 3 };
    if (id === 'stroop_dimension') return { ...base, count: 6 + Math.floor((level - 1) / 2), colors: Math.min(5, 2 + Math.floor((level - 1) / 2)), mixed: level >= 6, conflict: Math.min(.9, .3 + level * .06), limit: 5000 - (level - 1) * 250 };
    if (id === 'simon_reverse') return { ...base, count: 6 + Math.floor((level - 1) / 2), directions: level < 6 ? directions.slice(0, 2) : directions, mixed: level >= 8, limit: 5000 - (level - 1) * 300 };
    if (id === 'sst_stop_signal') return { ...base, count: 8, stops: 2, limit: 1800 - (level - 1) * 70, stopDelay: 250 + (level - 1) * 35 };
    if (id === 'rhythm_seven') return { ...base, count: 10, limit: 2000 - (level - 1) * 100, range: 15 + level * 10 };
    if (id === 'wcst_rule_switch') return { ...base, count: level + 5, rules: level < 3 ? ['color'] : level < 6 ? ['color', 'shape'] : ['color', 'shape', 'quantity'], switchEvery: Math.max(1, 5 - Math.floor((level - 1) / 2)) };
    if (id === 'mot_trajectory') return { ...base, count: Math.min(14, 6 + level - 1), targets: 2 + Math.floor((level - 1) / 3), preview: 2000, motion: 3000 + (level - 1) * 250, speed: 38 + level * 5 };
    if (id === 'odd_one_out') return { ...base, size: Math.ceil(Math.sqrt(7 + level * 2)), count: 7 + level * 2 };
    if (id === 'mental_rotation_clock') return { ...base, options: Math.min(4, level + 1), minuteStep: level < 4 ? 30 : level < 6 ? 15 : level === 6 ? 10 : 5, numbered: level < 5, rotation: level >= 8, angles: level < 8 ? [0] : level === 8 ? [90] : level === 9 ? [90, 270] : [90, 180, 270] };
    if (id === 'train_switch_dispatch') return { ...base, count: 3 + Math.floor((level - 1) / 2), stations: level < 6 ? 2 : 4, travel: 6000 - (level - 1) * 250, interval: level < 6 ? 6300 - (level - 1) * 250 : (6000 - (level - 1) * 250) * .75 };
    return { ...base, size: level < 4 ? 4 : level < 7 ? 5 : 6, mirrors: 1 + Math.floor((level - 1) / 2), preview: Math.max(2000, 4000 - (level - 1) * 200) };
  }
  function traceLaser(size, mirrors, entryRow) {
    let x = -1, y = entryRow, dx = 1, dy = 0;
    const seen = new Set(), path = [], hit = [];
    for (;;) {
      x += dx; y += dy;
      if (x < 0 || x >= size || y < 0 || y >= size) return { exit: x < 0 ? 'left-' + y : x >= size ? 'right-' + y : y < 0 ? 'top-' + x : 'bottom-' + x, path, hit };
      const state = [x, y, dx, dy].join(',');
      if (seen.has(state)) return null;
      seen.add(state); path.push({ x, y });
      const mirror = mirrors.find(item => item.x === x && item.y === y);
      if (mirror) { hit.push(mirror); const oldDx = dx; dx = mirror.slash === '/' ? -dy : dy; dy = mirror.slash === '/' ? -oldDx : oldDx; }
    }
  }
  function laserTrial(cfg) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const entryRow = integer(cfg.size), mirrors = [];
      let x = -1, y = entryRow, dx = 1, dy = 0;
      for (let i = 0; i < cfg.mirrors; i++) {
        const available = dx > 0 ? cfg.size - 1 - x : dx < 0 ? x : dy > 0 ? cfg.size - 1 - y : y;
        if (available < 1) break;
        const distance = 1 + integer(available); x += dx * distance; y += dy * distance;
        if (mirrors.some(m => m.x === x && m.y === y)) break;
        const slash = pick(['/', '\\']); mirrors.push({ x, y, slash });
        const oldDx = dx; dx = slash === '/' ? -dy : dy; dy = slash === '/' ? -oldDx : oldDx;
      }
      const result = traceLaser(cfg.size, mirrors, entryRow);
      if (mirrors.length === cfg.mirrors && result && new Set(result.hit).size === cfg.mirrors) return { entryRow, mirrors, ...result };
    }
    const mirrors = [{ x: 1, y: 0, slash: '\\' }, { x: 1, y: cfg.size - 2, slash: '\\' }, { x: cfg.size - 2, y: cfg.size - 2, slash: '/' }, { x: cfg.size - 2, y: 1, slash: '\\' }, { x: 0, y: 1, slash: '/' }].slice(0, cfg.mirrors);
    return { entryRow: 0, mirrors, ...traceLaser(cfg.size, mirrors, 0) };
  }
  function generateTrial(id, level) {
    const cfg = getConfig(id, level);
    if (id === 'stroop_dimension') return { items: Array.from({ length: cfg.count }, () => { const word = integer(cfg.colors), ink = Math.random() < cfg.conflict ? pick(Array.from({ length: cfg.colors }, (_, i) => i).filter(i => i !== word)) : word; const rule = cfg.mixed ? pick(['word', 'ink']) : 'ink'; return { word, ink, rule, answer: rule === 'word' ? word : ink }; }) };
    if (id === 'simon_reverse') return { items: Array.from({ length: cfg.count }, () => { const direction = pick(cfg.directions), position = pick(cfg.directions), reverse = cfg.mixed ? Math.random() < .5 : true; return { direction, position, reverse, answer: reverse ? opposite[direction] : direction }; }) };
    if (id === 'sst_stop_signal') { const stops = new Set(shuffle(Array.from({ length: cfg.count }, (_, i) => i)).slice(0, cfg.stops)); return { items: Array.from({ length: cfg.count }, (_, i) => ({ direction: pick(['left', 'right']), stop: stops.has(i) })) }; }
    if (id === 'rhythm_seven') { const start = 1 + integer(cfg.range); return { items: Array.from({ length: cfg.count }, (_, i) => ({ number: start + i, stop: (start + i) % 7 === 0 || String(start + i).includes('7') })) }; }
    if (id === 'wcst_rule_switch') { let rule = pick(cfg.rules); return { items: Array.from({ length: cfg.count }, (_, i) => { if (i && i % cfg.switchEvery === 0 && cfg.rules.length > 1) rule = pick(cfg.rules.filter(value => value !== rule)); const item = { color: integer(3), shape: integer(3), quantity: integer(3), rule }; return { ...item, answer: item[rule] }; }) }; }
    if (id === 'mot_trajectory') { const targets = shuffle(Array.from({ length: cfg.count }, (_, i) => i)).slice(0, cfg.targets); return { balls: Array.from({ length: cfg.count }, (_, i) => { const angle = Math.random() * Math.PI * 2; return { x: 28 + (i % 4) * 70, y: 30 + Math.floor(i / 4) * 65, vx: Math.cos(angle) * cfg.speed, vy: Math.sin(angle) * cfg.speed }; }), targets }; }
    if (id === 'odd_one_out') { const chosen = shuffle(objects).slice(0, (cfg.count + 1) / 2), singleton = chosen.pop(), items = shuffle([...chosen, ...chosen, singleton]); return { items, singleton, answer: items.indexOf(singleton) }; }
    if (id === 'mental_rotation_clock') {
      const time = integer(12) * 60 + integer(60 / cfg.minuteStep) * cfg.minuteStep;
      const alternatives = shuffle(Array.from({ length: 720 / cfg.minuteStep }, (_, i) => i * cfg.minuteStep).filter(value => value !== time)).slice(0, cfg.options - 1);
      return { time, choices: shuffle([time, ...alternatives]), rotation: pick(cfg.angles) };
    }
    if (id === 'train_switch_dispatch') return { stations: shuffle(colors.slice(0, cfg.stations)), trains: Array.from({ length: cfg.count }, () => integer(cfg.stations)) };
    const trial = laserTrial(cfg);
    const ports = ['left', 'right', 'top', 'bottom'].flatMap(side => Array.from({ length: cfg.size }, (_, i) => side + '-' + i)).filter(port => port !== 'left-' + trial.entryRow && port !== trial.exit);
    return { ...trial, ports: shuffle([trial.exit, ...shuffle(ports).slice(0, 3)]) };
  }
  function clockLabel(time) { return `${Math.floor(time / 60) || 12}:${String(time % 60).padStart(2, '0')}`; }
  function render(level, host) {
    const { state, el, playTone, soundSuccess, deductLife, nextLevel } = host;
    const id = state.gameId, cfg = getConfig(id, level);
    const sub = state.subState = { phase: 'ready', completed: 0, timers: new Set(), itemIndex: 0, motionTimer: null, timerHandle: null };
    const wrap = document.createElement('div'); wrap.className = 'next-master-stage';
    wrap.innerHTML = '<div class="nback-meta-bar"><span class="nback-mode-pill" id="next-difficulty"></span><span id="next-progress"></span></div><div class="next-task-card" id="next-card"></div><p class="next-status" id="next-status" role="status" aria-live="polite"></p>';
    el.stage.appendChild(wrap);
    const card = wrap.querySelector('#next-card'), status = wrap.querySelector('#next-status');
    wrap.querySelector('#next-difficulty').textContent = 'L' + level + ' · ' + (cfg.size ? cfg.size + '×' + cfg.size : cfg.count ? cfg.count + ' 项/组' : cfg.options + ' 个选项');
    function progress() { wrap.querySelector('#next-progress').textContent = '连续正确 ' + sub.completed + '/3 组'; }
    function later(action, duration) { const timer = setTimeout(() => { sub.timers.delete(timer); if (state.subState === sub && sub.phase !== 'finished') action(); }, duration); sub.timers.add(timer); return timer; }
    function clear() { sub.timers.forEach(clearTimeout); sub.timers.clear(); clearInterval(sub.motionTimer); sub.motionTimer = null; }
    function lock() { card.querySelectorAll('button').forEach(button => { button.disabled = true; }); el.controls.querySelectorAll('button').forEach(button => { button.disabled = true; }); }
    function button(text, value, action, parent = el.controls) { const node = document.createElement('button'); node.type = 'button'; node.className = 'batch-choice next-choice'; node.textContent = text; node.dataset.choice = value; node.onclick = () => action(value, node); parent.appendChild(node); return node; }
    function choices(items, action) { el.controls.innerHTML = '<div class="next-choice-row"></div>'; const row = el.controls.firstChild; items.forEach(([label, value]) => button(label, value, action, row)); }
    function fail(reason) { if (['error', 'finished', 'pause'].includes(sub.phase)) return; sub.phase = 'error'; clear(); lock(); deductLife(reason); }
    function pass() {
      clear(); lock(); sub.phase = 'pause'; sub.completed++; state.stats.correct++; progress(); soundSuccess(); status.textContent = '本组正确！';
      sub.timerHandle = later(() => { if (sub.completed === cfg.required) nextLevel(); else beginRound(); }, 600);
    }
    sub.destroy = () => { clear(); sub.phase = 'finished'; lock(); };
    sub.restart = () => { clear(); sub.completed = 0; progress(); sub.phase = 'error'; lock(); card.innerHTML = '<div class="next-error" role="alert"><h3>本轮重新开始</h3><p>要认真对待哦！</p><p>即将随机生成新的一组</p></div>'; status.textContent = '失误后重新开始本关'; later(beginRound, 2000); };
    function answer() { sub.phase = 'answer'; sub.answerStart = Date.now(); }
    function reaction() { state.stats.clicks++; state.stats.reactionTimes.push(Date.now() - sub.answerStart); }
    function itemProgress(index, total) { status.textContent = '本组第 ' + (index + 1) + '/' + total + ' 项'; }
    function sequence(trial, draw) {
      function show(index) {
        clear(); if (index >= trial.items.length) { pass(); return; }
        sub.itemIndex = index; card.innerHTML = ''; el.controls.innerHTML = ''; itemProgress(index, trial.items.length);
        draw(trial.items[index], () => { clear(); lock(); sub.phase = 'pause'; soundSuccess(); status.textContent = '正确！'; later(() => show(index + 1), 350); });
      }
      show(0);
    }
    function stroop(trial) {
      sequence(trial, (item, done) => {
        card.innerHTML = '<div class="next-rule">本题只选：' + (item.rule === 'ink' ? '墨水颜色' : '文字含义') + '</div><div class="next-color-word" style="color:' + colors[item.ink].hex + '">' + colors[item.word].name + '</div>';
        answer(); choices(colors.slice(0, cfg.colors).map((color, i) => [color.name + '色', String(i)]), value => { if (sub.phase !== 'answer') return; reaction(); Number(value) === item.answer ? done() : fail('混淆了文字与墨水颜色'); });
        later(() => fail('本题未在规定时间内作答'), cfg.limit);
      });
    }
    function simon(trial) {
      sequence(trial, (item, done) => {
        card.innerHTML = '<div class="next-rule">' + (item.reverse ? '红色：选箭头反方向' : '蓝色：选箭头同方向') + '</div><div class="next-simon-field"><span class="next-simon-arrow at-' + item.position + '" style="color:' + (item.reverse ? '#dc2626' : '#2563eb') + '">' + arrows[item.direction] + '</span></div>';
        answer(); choices(cfg.directions.map(direction => [arrows[direction], direction]), value => { if (sub.phase !== 'answer') return; reaction(); value === item.answer ? done() : fail('方向判断错误，请忽略箭头出现的位置'); });
        later(() => fail('方向判断超时'), cfg.limit);
      });
    }
    function inhibition(trial, stopSignal) {
      sequence(trial, (item, done) => {
        card.innerHTML = '<div class="next-rule">' + (stopSignal ? '箭头按方向，STOP 时收手' : '7的倍数或含7：不要点击') + '</div><div class="next-inhibit-stimulus">' + (stopSignal ? arrows[item.direction] : item.number) + '</div><div class="next-stop-cue"></div>';
        let pressed = null; answer();
        choices(stopSignal ? [['←', 'left'], ['→', 'right']] : [['通过', 'go']], value => {
          if (sub.phase !== 'answer' || pressed !== null) return;
          reaction(); pressed = value; el.controls.querySelectorAll('button').forEach(node => { node.disabled = true; }); status.textContent = '已记录点击，等待本题结束';
        });
        if (stopSignal && item.stop) later(() => { card.querySelector('.next-stop-cue').textContent = 'STOP · 收手'; card.classList.add('next-stop-active'); playTone(240, 'square', .12, .06); }, cfg.stopDelay);
        later(() => { card.classList.remove('next-stop-active'); const correct = item.stop ? pressed === null : pressed === (stopSignal ? item.direction : 'go'); correct ? done() : fail(item.stop ? '该题需要收手，不应点击' : '该题需要点击正确方向或通过'); }, cfg.limit);
      });
    }
    function sorting(trial) {
      sequence(trial, (item, done) => {
        const names = { color: '颜色', shape: '形状', quantity: '数量' };
        card.innerHTML = '<div class="next-rule">当前规则：按' + names[item.rule] + '分拣</div><div class="next-sort-card" style="color:' + colors[item.color].hex + '">' + shapes[item.shape].repeat(item.quantity + 1) + '</div>';
        answer(); choices([0, 1, 2].map(i => [colors[i].name + ' / ' + shapes[i] + ' / ' + (i + 1) + '个', String(i)]), value => { if (sub.phase !== 'answer') return; reaction(); Number(value) === item.answer ? done() : fail('分拣错误，请留意当前规则'); });
      });
    }
    function mot(trial) {
      const field = document.createElement('div'); field.className = 'next-mot-field'; card.appendChild(field);
      const balls = trial.balls.map(ball => ({ ...ball }));
      const nodes = balls.map((ball, i) => { const node = button('', String(i), () => {
        if (sub.phase !== 'answer' || node.disabled) return;
        reaction(); if (!trial.targets.includes(i)) { fail('选到了非目标小球'); return; }
        node.classList.add('next-ball-selected'); node.disabled = true; found++;
        if (found === cfg.targets) pass();
      }, field); node.className = 'next-mot-ball'; node.dataset.ball = i; node.disabled = true; if (trial.targets.includes(i)) node.classList.add('next-ball-target'); return node; });
      let found = 0;
      function position() { balls.forEach((ball, i) => { nodes[i].style.left = ball.x / 300 * 100 + '%'; nodes[i].style.top = ball.y / 280 * 100 + '%'; }); }
      position(); sub.phase = 'preview'; status.textContent = '记住 ' + cfg.targets + ' 颗金色目标球';
      later(() => {
        nodes.forEach(node => node.classList.remove('next-ball-target')); sub.phase = 'motion'; status.textContent = '追踪目标，运动结束后再选择';
        let last = Date.now();
        sub.motionTimer = setInterval(() => {
          const dt = Math.min(.05, (Date.now() - last) / 1000); last = Date.now();
          balls.forEach(ball => { ball.x += ball.vx * dt; ball.y += ball.vy * dt; if (ball.x < 11 || ball.x > 289) { ball.x = Math.max(11, Math.min(289, ball.x)); ball.vx *= -1; } if (ball.y < 11 || ball.y > 269) { ball.y = Math.max(11, Math.min(269, ball.y)); ball.vy *= -1; } });
          for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < 22) { const nx = dx / distance, ny = dy / distance, speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (speed > 0) { a.vx -= speed * nx; a.vy -= speed * ny; b.vx += speed * nx; b.vy += speed * ny; } const shift = (22 - distance) / 2; a.x -= nx * shift; a.y -= ny * shift; b.x += nx * shift; b.y += ny * shift; }
          }
          balls.forEach(ball => { ball.x = Math.max(11, Math.min(289, ball.x)); ball.y = Math.max(11, Math.min(269, ball.y)); });
          position();
        }, 20);
        later(() => { clearInterval(sub.motionTimer); sub.motionTimer = null; answer(); nodes.forEach((node, i) => { node.disabled = false; node.setAttribute('aria-label', '小球 ' + (i + 1)); }); status.textContent = '找回全部 ' + cfg.targets + ' 颗目标球'; }, cfg.motion);
      }, cfg.preview);
    }
    function odd(trial) {
      const grid = document.createElement('div'); grid.className = 'next-object-grid'; grid.style.gridTemplateColumns = 'repeat(' + cfg.size + ',1fr)'; card.appendChild(grid); answer();
      trial.items.forEach((object, i) => { const node = button('', String(i), value => { if (sub.phase !== 'answer') return; reaction(); Number(value) === trial.answer ? pass() : fail('这个物体还有同伴，请找唯一落单物体'); }, grid); node.innerHTML = '<img src="assets/distractions/' + object + '.svg" alt="">'; node.setAttribute('aria-label', '物体 ' + (i + 1)); }); for (let i = trial.items.length; i < cfg.size * cfg.size; i++) { const blank = document.createElement('span'); blank.style.aspectRatio = '1'; grid.appendChild(blank); } status.textContent = '只有一件物体没有同伴';
    }
    function clock(trial) {
      const hour = trial.time / 60 * 30, minute = trial.time % 60 * 6;
      const ticks = Array.from({ length: 12 }, (_, i) => cfg.numbered ? '<text x="' + (150 + Math.sin(i * Math.PI / 6) * 104) + '" y="' + (155 - Math.cos(i * Math.PI / 6) * 104) + '" text-anchor="middle">' + (i || 12) + '</text>' : '<line x1="150" y1="38" x2="150" y2="45" transform="rotate(' + i * 30 + ' 150 150)"/>').join('');
      card.innerHTML = '<div class="next-rule">左右镜像' + (trial.rotation ? ' · 顶部又旋转 ' + trial.rotation + '°' : '') + '，还原真实时间</div><svg class="next-clock" viewBox="0 0 300 300" aria-label="镜像时钟" role="img"><circle cx="150" cy="150" r="125"/><g transform="rotate(' + trial.rotation + ' 150 150) translate(300 0) scale(-1 1)">' + ticks + '<path class="clock-top" d="M143 18L150 5L157 18Z"/><line class="clock-hour" x1="150" y1="150" x2="150" y2="80" transform="rotate(' + hour + ' 150 150)"/><line class="clock-minute" x1="150" y1="150" x2="150" y2="51" transform="rotate(' + minute + ' 150 150)"/></g><circle cx="150" cy="150" r="5"/></svg>';
      answer(); choices(trial.choices.map(time => [clockLabel(time), String(time)]), value => { if (sub.phase !== 'answer') return; reaction(); Number(value) === trial.time ? pass() : fail('镜像时间还原错误'); }); status.textContent = '蓝色三角标记表盘原来的顶部';
    }
    function train(trial) {
      const field = document.createElement('div'); field.className = 'next-train-field'; card.appendChild(field);
      field.innerHTML = '<svg viewBox="0 0 300 280"><path d="M150 0V80M150 80L75 160M150 80L225 160' + (cfg.stations === 2 ? 'M75 160V250M225 160V250' : 'M75 160L35 250M75 160L105 250M225 160L195 250M225 160L265 250') + '"/></svg>';
      trial.stations.forEach((color, i) => { const station = document.createElement('span'); station.className = 'next-station'; station.textContent = color.name; station.style.background = color.hex; station.style.left = (cfg.stations === 2 ? [25, 75][i] : [12, 35, 65, 88][i]) + '%'; field.appendChild(station); });
      const switches = [0, 0, 0];
      const rail = field.querySelector('svg');
      for (let i = 0; i < (cfg.stations === 2 ? 1 : 3); i++) { const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.classList.add('next-track-active'); path.dataset.gate = i; rail.appendChild(path); }
      function showSwitches() {
        rail.querySelector('[data-gate="0"]').setAttribute('d', 'M150 80L' + (switches[0] ? 225 : 75) + ' 160' + (cfg.stations === 2 ? 'V250' : ''));
        if (cfg.stations === 4) { rail.querySelector('[data-gate="1"]').setAttribute('d', 'M75 160L' + (switches[1] ? 105 : 35) + ' 250'); rail.querySelector('[data-gate="2"]').setAttribute('d', 'M225 160L' + (switches[2] ? 265 : 195) + ' 250'); }
      }
      showSwitches();
      choices(Array.from({ length: cfg.stations === 2 ? 1 : 3 }, (_, i) => [(i === 0 ? '主道岔' : i === 1 ? '左道岔' : '右道岔') + '：左', String(i)]), (value, node) => { if (sub.phase !== 'motion') return; const i = Number(value); switches[i] = 1 - switches[i]; showSwitches(); node.textContent = (i === 0 ? '主道岔' : i === 1 ? '左道岔' : '右道岔') + '：' + (switches[i] ? '右' : '左'); });
      const active = []; let dispatched = 0, delivered = 0; sub.phase = 'motion'; status.textContent = '调节道岔，送入同色车站 · 0/' + cfg.count;
      function spawn() { const node = document.createElement('span'); node.className = 'next-train'; node.style.left = '50%'; node.style.top = '0%'; const destination = trial.trains[dispatched++]; node.style.background = trial.stations[destination].hex; node.textContent = trial.stations[destination].name; node.dataset.destination = destination; field.appendChild(node); active.push({ node, destination, stamp: Date.now(), main: null, child: null }); }
      spawn();
      for (let i = 1; i < cfg.count; i++) later(spawn, i * cfg.interval);
      sub.motionTimer = setInterval(() => {
        for (const item of active.slice()) {
          const p = Math.min(1, (Date.now() - item.stamp) / cfg.travel);
          if (p >= .3 && item.main === null) item.main = switches[0];
          if (p >= .65 && cfg.stations === 4 && item.child === null) item.child = switches[1 + item.main];
          const branchX = item.main === 1 ? 225 : 75;
          const exitX = cfg.stations === 2 ? branchX : [35, 105, 195, 265][item.main * 2 + (item.child || 0)];
          const x = p < .3 ? 150 : p < .65 ? 150 + (branchX - 150) * (p - .3) / .35 : branchX + (exitX - branchX) * (p - .65) / .35;
          item.node.style.left = x / 300 * 100 + '%'; item.node.style.top = (p * 250) / 280 * 100 + '%';
          item.node.dataset.progress = p; item.node.dataset.nextSwitch = p < .3 ? '0' : cfg.stations === 4 && p < .65 ? String(1 + item.main) : '';
          if (p >= 1) { const route = cfg.stations === 2 ? item.main : item.main * 2 + item.child; item.node.remove(); active.splice(active.indexOf(item), 1); if (route !== item.destination) { fail('火车进入了不同颜色的车站'); return; } delivered++; soundSuccess(); status.textContent = '送达 ' + delivered + '/' + cfg.count; if (delivered === cfg.count) { pass(); return; } }
        }
      }, 25);
    }
    function laser(trial) {
      const size = cfg.size;
      const marker = (port, label) => { const [side, indexText] = port.split('-'), index = Number(indexText), along = (index + .5) / size * 100; return '<span class="next-port port-' + side + '" style="' + (side === 'left' || side === 'right' ? 'top' : 'left') + ':' + along + '%">' + label + '</span>'; };
      const field = document.createElement('div'); field.className = 'next-laser-field'; field.innerHTML = marker('left-' + trial.entryRow, '→') + trial.ports.map((port, i) => marker(port, 'ABCD'[i])).join('');
      const grid = document.createElement('div'); grid.className = 'next-laser-grid'; grid.style.gridTemplateColumns = 'repeat(' + size + ',1fr)'; field.appendChild(grid); card.appendChild(field);
      for (let i = 0; i < size * size; i++) { const cell = document.createElement('span'); cell.className = 'next-mirror-cell'; const mirror = trial.mirrors.find(item => item.x === i % size && item.y === Math.floor(i / size)); cell.textContent = mirror ? mirror.slash : ''; grid.appendChild(cell); }
      sub.phase = 'preview'; status.textContent = '记住 ' + cfg.mirrors + ' 面镜子，隐藏后推算出口'; el.controls.textContent = '先观察镜面位置';
      later(() => { grid.querySelectorAll('span').forEach(cell => { cell.textContent = ''; }); answer(); choices(trial.ports.map((port, i) => ['出口 ' + 'ABCD'[i], port]), value => { if (sub.phase !== 'answer') return; reaction(); value === trial.exit ? pass() : fail('反射出口判断错误'); }); status.textContent = '从箭头入射，选择正确出口'; }, cfg.preview);
    }
    function beginRound() {
      clear(); card.classList.remove('next-stop-active'); card.innerHTML = ''; el.controls.innerHTML = ''; progress(); sub.phase = 'display';
      const trial = generateTrial(id, level);
      if (id === 'stroop_dimension') stroop(trial);
      else if (id === 'simon_reverse') simon(trial);
      else if (id === 'sst_stop_signal') inhibition(trial, true);
      else if (id === 'rhythm_seven') inhibition(trial, false);
      else if (id === 'wcst_rule_switch') sorting(trial);
      else if (id === 'mot_trajectory') mot(trial);
      else if (id === 'odd_one_out') odd(trial);
      else if (id === 'mental_rotation_clock') clock(trial);
      else if (id === 'train_switch_dispatch') train(trial);
      else laser(trial);
    }
    const detail = id === 'stroop_dimension' || id === 'simon_reverse' ? '本题限时 ' + cfg.limit / 1000 + ' 秒。' : id === 'sst_stop_signal' || id === 'rhythm_seven' ? '每题节奏 ' + cfg.limit / 1000 + ' 秒；该收手时不要点击。' : '';
    card.innerHTML = '<div class="batch-intro"><h3>' + registry[id].title.split(' · ')[1] + '</h3><p>' + registry[id].prompt + '</p><p>' + detail + '连续正确 3 组升级。失误重开本关，第三次失败结束，升级补满三颗心。</p></div>';
    status.textContent = '准备好后点击开始'; progress(); el.controls.innerHTML = ''; button('开始第 ' + level + ' 关', 'start', beginRound);
  }
  const api = { registry, definitions, getConfig, generateTrial, traceLaser, clockLabel, colors, directions, opposite, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FocusNextGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
