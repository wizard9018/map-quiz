(function (root) {
  'use strict';
  const key = 'focus_training_records_v1';
  function dateKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function read() {
    try {
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(records) ? records.filter(record => typeof record.gameId === 'string' && Number.isFinite(record.timestamp) && Number.isFinite(record.level) && Number.isFinite(record.score)) : [];
    } catch (_) { return []; }
  }
  function save(record) {
    const records = read(); records.push(record);
    try { localStorage.setItem(key, JSON.stringify(records)); return true; }
    catch (_) { return false; }
  }
  function summarize(records, games, now = Date.now()) {
    const today = dateKey(now);
    return games.map(game => {
      const matches = records.filter(record => record.gameId === game.id && dateKey(record.timestamp) === today).sort((a, b) => a.timestamp - b.timestamp);
      return { ...game, count: matches.length, level: matches.length ? Math.max(...matches.map(record => record.level)) : null, score: matches.length ? matches.at(-1).score : null };
    });
  }
  function week(records, gameId, now = Date.now()) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - 6 + i);
      const day = dateKey(date);
      const matches = records.filter(record => record.gameId === gameId && dateKey(record.timestamp) === day);
      return { date: day, level: matches.length ? Math.max(...matches.map(record => record.level)) : null };
    });
  }
  function render(container, games, selectedId) {
    const records = read();
    container.innerHTML = '<h2>当天训练记录</h2><p class="history-date"></p><div class="history-table-wrap"><table><thead><tr><th>游戏</th><th>次数</th><th>最高关卡</th><th>最近得分</th></tr></thead><tbody></tbody></table></div><div class="history-chart-header"><h3>最近 7 天</h3><select aria-label="选择趋势游戏"></select></div><p class="history-chart-caption">每天最高到达关卡 · 空白表示当天未训练</p><div class="history-chart"></div><p class="history-storage-note">记录保存在当前浏览器，清除网站数据会删除记录。</p>';
    container.querySelector('.history-date').textContent = dateKey(Date.now());
    const body = container.querySelector('tbody');
    summarize(records, games).forEach(game => {
      const row = document.createElement('tr');
      for (const value of [game.title.replace(/^母版 /, ''), game.count, game.level === null ? '未训练' : `L${game.level}`, game.score === null ? '—' : `${game.score}分`]) {
        const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
      }
      body.appendChild(row);
    });
    const select = container.querySelector('select');
    games.forEach(game => { const option = document.createElement('option'); option.value = game.id; option.textContent = game.title.replace(/^母版 /, ''); select.appendChild(option); });
    select.value = games.some(game => game.id === selectedId) ? selectedId : games[0].id;
    function draw() {
      const days = week(records, select.value);
      const ceiling = Math.max(5, ...days.map(day => day.level || 0));
      const x = i => 30 + i * 44;
      const y = level => 134 - level / ceiling * 104;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 318 172'); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', select.selectedOptions[0].textContent + '最近七天最高关卡：' + days.map(day => day.date + ' ' + (day.level === null ? '未训练' : 'L' + day.level)).join('，'));
      let content = `<line x1="30" y1="134" x2="302" y2="134" stroke="#cbd5e1"/><text x="4" y="138">0</text><line x1="30" y1="30" x2="302" y2="30" stroke="#e2e8f0"/><text x="4" y="34">${ceiling}</text>`;
      days.forEach((day, i) => {
        content += `<text x="${x(i)}" y="160" text-anchor="middle">${day.date.slice(5).replace('-', '/')}</text>`;
        if (day.level === null) return;
        if (i && days[i - 1].level !== null) content += `<line x1="${x(i - 1)}" y1="${y(days[i - 1].level)}" x2="${x(i)}" y2="${y(day.level)}" stroke="#0284c7" stroke-width="2"/>`;
        content += `<circle cx="${x(i)}" cy="${y(day.level)}" r="4" fill="#0284c7"/><text x="${x(i)}" y="${y(day.level) - 10}" text-anchor="middle">L${day.level}</text>`;
      });
      svg.innerHTML = content;
      const chart = container.querySelector('.history-chart'); chart.replaceChildren(svg);
      if (days.every(day => day.level === null)) { const empty = document.createElement('p'); empty.className = 'history-empty'; empty.textContent = '这款游戏最近 7 天还没有训练记录'; chart.appendChild(empty); }
    }
    select.onchange = draw; draw();
  }
  const api = { key, dateKey, read, save, summarize, week, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FocusHistory = api;
})(typeof window !== 'undefined' ? window : globalThis);
