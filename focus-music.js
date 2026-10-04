/* Original instrumental loops; independent of gameplay and feedback sounds. */
(function () {
  const themes = ['sunny-steps', 'garden-bells', 'cloud-picnic', 'curious-path', 'quiet-mission', 'puzzle-spark'];
  const titles = ['晴天脚步', '花园风铃', '云上野餐', '好奇小径', '安静任务', '谜题火花'];
  const tracks = themes.flatMap(name => Array.from({ length: 5 }, (_, i) => name + (i ? '-' + (i + 1) : '')));
  const names = titles.flatMap(name => Array.from({ length: 5 }, (_, i) => name + ' ' + (i + 1)));
  const assignments = {
    nback_flow: 0, matrix_flash: 5, sequence_order: 10, tidal_treasures: 1, semantic_synthesis: 6,
    schulte_ladder: 15, cambridge_decoder: 11, flanker_birds: 20, ufov_dual_field: 25, bimodal_divert: 12,
    stroop_dimension: 16, simon_reverse: 26, sst_stop_signal: 21, rhythm_seven: 2, wcst_rule_switch: 27,
    mot_trajectory: 22, odd_one_out: 7, mental_rotation_clock: 13, train_switch_dispatch: 17, laser_prism_deflect: 28
  };
  const audio = new Audio();
  audio.loop = true; audio.volume = .16; audio.preload = 'none';
  let game = null, unlocked = false, muted = false, mode = 'auto', blocked = false, hostVisible = !window.frameElement || window.frameElement.getClientRects().length > 0, toneTimer;
  let toneBlocked = false, track = null, unavailable = false;
  try { muted = localStorage.getItem('focus_music_muted') === '1'; } catch (e) {}
  function wanted() { return game && unlocked && !muted && !blocked && !toneBlocked && hostVisible && !document.hidden; }
  function render() {
    const controls = document.getElementById('focus-music-controls');
    if (!controls) return;
    const en = window.FocusLanguage && window.FocusLanguage.language === 'en';
    const button = controls.querySelector('button');
    button.textContent = muted ? (en ? 'Music: off' : '音乐：关') : (en ? 'Music: on' : '音乐：开');
    button.setAttribute('aria-pressed', String(!muted));
    const select = controls.querySelector('select');
    select.setAttribute('aria-label', en ? 'Music mood' : '音乐风格');
    ['auto', 'relaxed', 'tense'].forEach((value, index) => {
      select.options[index].textContent = en ? ['Game music', 'Cheerful', 'Mild suspense'][index] : ['随游戏配乐', '轻松愉快', '稍显紧张'][index];
    });
    controls.querySelector('small').textContent = unavailable ? (en ? 'Audio unavailable' : '音乐暂不可用')
      : game && blocked ? (en ? 'Paused for listening' : '听觉训练中暂停')
      : track === null ? '' : (en ? tracks[track].replaceAll('-', ' ') : names[track]);
  }
  function sync() {
    if (!wanted()) audio.pause();
    else if (audio.paused && !unavailable) {
      audio.play().then(() => { if (!wanted()) audio.pause(); }).catch(error => {
        if (error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError') unlocked = false;
        else unavailable = true;
        render();
      });
    }
    render();
  }
  function choose() {
    if (!game) return;
    const assigned = assignments[game];
    const next = mode === 'auto' ? assigned : assigned % 15 + (mode === 'tense' ? 15 : 0);
    if (next !== track) {
      audio.pause(); track = next; unavailable = false;
      audio.src = 'assets/focus-music/' + tracks[next] + '.mp3';
    }
    sync();
  }
  window.FocusMusic = {
    setGame(id) { game = id; blocked = false; toneBlocked = false; clearTimeout(toneTimer); choose(); },
    stop() { game = null; blocked = false; audio.pause(); audio.currentTime = 0; render(); },
    training(value) { if (['semantic_synthesis', 'bimodal_divert'].includes(game)) { blocked = value; sync(); } },
    tone(duration) {
      if (!['semantic_synthesis', 'bimodal_divert'].includes(game)) return;
      toneBlocked = true; clearTimeout(toneTimer); sync();
      toneTimer = setTimeout(() => { toneBlocked = false; sync(); }, duration * 1000 + 100);
    }
  };
  audio.addEventListener('error', () => { unavailable = true; render(); });
  document.addEventListener('click', () => { unlocked = true; sync(); });
  document.addEventListener('keydown', event => { if (!event.repeat) { unlocked = true; sync(); } });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => audio.pause());
  window.addEventListener('pageshow', sync);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === parent && event.data && event.data.type === 'focus-host-visible') {
      hostVisible = event.data.visible; sync();
    }
  });
  window.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('focus-music-controls');
    controls.querySelector('button').onclick = () => {
      muted = !muted; unavailable = false;
      try { localStorage.setItem('focus_music_muted', muted ? '1' : '0'); } catch (e) {}
      sync();
    };
    controls.querySelector('select').onchange = event => { mode = event.target.value; choose(); };
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
  });
})();
