(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage is optional */ } }
  };

  /* ---------- nav shadow ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- i18n ---------- */
  const EN = {};
  $$('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.textContent; });
  $$('[data-i18n-html]').forEach(el => { EN[el.dataset.i18nHtml] = el.innerHTML; });
  EN['meta.title'] = document.title;
  let lang = 'en';
  const t = k => (lang === 'zh' && window.VI_ZH && window.VI_ZH[k]) || EN[k] || '';
  const SCENE_COPY = {
    overview: ['scene.overview.t', 'scene.overview.d'],
    approval: ['scene.approval.t', 'scene.approval.d'],
    ask: ['scene.ask.t', 'scene.ask.d'],
    jump: ['scene.jump.t', 'scene.jump.d']
  };
  EN['scene.approval.t'] = 'Approve without switching apps.';
  EN['scene.approval.d'] = 'Preview the change, then allow or deny the request without leaving your flow.';
  EN['scene.ask.t'] = 'Answer right from the notch.';
  EN['scene.ask.d'] = 'When an agent asks a question, pick the answer here. No more hunting for the right terminal.';
  EN['scene.jump.t'] = 'Jump back to the right terminal.';
  EN['scene.jump.d'] = 'Task done? One click takes you to the exact tab, split or tmux pane.';
  EN['install.src'] = 'Clone the repository to read the code, build it yourself or send a pull request.';
  EN['copy.iso'] = 'Copy SHA-256 checksum'; EN['copy.src'] = 'Copy clone command';
  EN['copy'] = $('#copyLabel').textContent; EN['copied'] = 'Copied';

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === 'zh' ? 'zh-Hans' : 'en';
    $$('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (v) el.textContent = v; });
    $$('[data-i18n-html]').forEach(el => { const v = t(el.dataset.i18nHtml); if (v) el.innerHTML = v; });
    document.title = t('meta.title');
    $('#langCode').textContent = l === 'zh' ? '中' : 'EN';
    $$('.lang-item').forEach(b => b.setAttribute('aria-checked', String(b.dataset.lang === l)));
    setScene(current, true); setInstall(installTab);
    store.set('vi-lang', l);
  }

  /* language menu */
  const langEl = $('#lang'), langBtn = $('#langBtn'), langMenu = $('#langMenu');
  const setMenu = open => {
    langMenu.hidden = false;
    open ? langEl.setAttribute('data-open', '') : langEl.removeAttribute('data-open');
    langBtn.setAttribute('aria-expanded', String(open));
    if (!open) setTimeout(() => { if (!langEl.hasAttribute('data-open')) langMenu.hidden = true; }, 160);
  };
  langBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(!langEl.hasAttribute('data-open')); });
  document.addEventListener('click', e => { if (!langEl.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && langEl.hasAttribute('data-open')) { setMenu(false); langBtn.focus(); } });
  $$('.lang-item').forEach(b => b.addEventListener('click', () => { applyLang(b.dataset.lang); setMenu(false); }));

  /* ---------- headline word cycle ----------
     Each character flickers through a few glyphs before settling, staggered left to right,
     and every word has its own colour. First word holds longer (4.5s), the rest 2.5s. */
  const WORDS = [["AI agents", "#d97757"], ["Claude Code", "#d97757"], ["OpenCode", "#f59e0b"], ["Codex", "#22c55e"], ["Gemini CLI", "#3b82f6"], ["Cursor", "#a855f7"]];
  const SCRAMBLE = "01+-*:.", STEP_MS = 40, SCRAMBLE_TICKS = 4, STAGGER_MS = 30;
  const cycle = $("#cycle");
  let wi = 0, cycleTimer = null, firstHold = true, pageHidden = false;
  const paint = (text, color) => { cycle.textContent = text; cycle.style.color = color; };
  function scrambleTo(text, color) {
    const from = cycle.textContent || "", len = Math.max(from.length, text.length), padded = from.padEnd(len);
    cycle.textContent = "";
    const cells = [];
    for (let i = 0; i < len; i++) { const s = document.createElement("span"); s.textContent = padded[i] || " "; cycle.appendChild(s); cells.push(s); }
    cycle.style.color = color;
    for (let i = 0; i < len; i++) {
      const target = i < text.length ? text[i] : "";
      let ticks = SCRAMBLE_TICKS;
      const tick = () => {
        if (ticks > 0) { cells[i].textContent = SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]; ticks--; setTimeout(tick, STEP_MS); }
        else cells[i].textContent = target;
      };
      setTimeout(tick, i * STAGGER_MS);
    }
    /* collapse back to a plain text node once every cell has settled */
    setTimeout(() => { cycle.textContent = text; }, len * STAGGER_MS + SCRAMBLE_TICKS * STEP_MS + 50);
  }
  function nextWord() {
    wi = (wi + 1) % WORDS.length;
    const [text, color] = WORDS[wi];
    if (reduced) { cycle.style.transition = "opacity 300ms ease"; cycle.style.opacity = "0"; setTimeout(() => { paint(text, color); cycle.style.opacity = "1"; }, 300); }
    else scrambleTo(text, color);
    scheduleCycle();
  }
  function scheduleCycle() {
    clearTimeout(cycleTimer);
    const wait = firstHold ? 4500 : 2500; firstHold = false;
    if (!pageHidden) cycleTimer = setTimeout(nextWord, wait);
  }
  document.addEventListener("visibilitychange", () => { pageHidden = document.hidden; if (!pageHidden) scheduleCycle(); });
  paint(WORDS[0][0], WORDS[0][1]);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(scheduleCycle);

  /* ---------- install tabs + copy ---------- */
  let installTab = 'iso';
  const SHA256 = 'e8e53ac8e2e0f3347683ae41e8e6c303423931423f28d45ab1b58648d5e6090c', CLONE = 'git clone https://github.com/crazymsn/vibe-island.git';
  const CODE = { iso: '<span class="prompt">↓</span>Vibe_Island_Design_by_DeepCloud.iso', src: '<span class="prompt">$</span>' + CLONE };
  const COPY = { iso: SHA256, src: CLONE };
  function setInstall(tab) {
    installTab = tab;
    $$('.install-tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('#installCode').innerHTML = CODE[tab];
    $('#installNote').textContent = t('install.' + tab);
    $('#copyBtn').setAttribute('aria-label', t('copy.' + tab));
  }
  $$('.install-tab').forEach(b => b.addEventListener('click', () => setInstall(b.dataset.tab)));
  $('#copyBtn').addEventListener('click', async () => {
    const label = $('#copyLabel');
    try { await navigator.clipboard.writeText(COPY[installTab]); label.textContent = t('copied'); }
    catch (e) { label.textContent = COPY[installTab].slice(0, 24) + '…'; }
    setTimeout(() => { label.textContent = t('copy'); }, 1600);
  });

  /* ---------- scroll reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px' })
    : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- MacBook scaling (fixed 1060px canvas, scaled to fit) ---------- */
  const stage = $('#stage'), mac = $('#mac');
  function fit() {
    const w = stage.clientWidth;
    const s = Math.min(1, w / 1060);
    mac.style.setProperty('--s', s);
    stage.style.height = (mac.offsetHeight * s) + 'px';
    if (w < 700) { /* phones: crop to the notch + terminal, like the reference */
      const s2 = Math.max(s, 680 / 1060);
      mac.style.setProperty('--s', s2);
      mac.style.setProperty('--sx', ((w - 1060 * s2) / 2) + 'px');
      stage.style.height = (mac.offsetHeight * s2) + 'px';
    } else mac.style.setProperty('--sx', '0px');
  }
  addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit); fit();

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(',', ''); };
  tick(); setInterval(tick, 30000);

  /* ---------- demo timeline ---------- */
  const notch = $('#notch'), cursor = $('#cursor'), term = $('#term');
  const termBody = $('#termBody'), termTitle = $('#termTitle');
  const demo = $('#demo');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const timers = new Set();
  let runId = 0, current = 'overview', paused = false, visible = true;
  const SCREEN = () => $('.screen', mac).getBoundingClientRect();

  function showLayer(name) {
    $$('.layer', notch).forEach(l => l.classList.toggle('on', l.dataset.layer === name));
    notch.dataset.state = name;
  }
  function moveCursor(el, dx = 0, dy = 0) {
    const sr = SCREEN(), r = el.getBoundingClientRect(), k = sr.width / $('.screen', mac).offsetWidth;
    cursor.style.left = ((r.left - sr.left + r.width / 2) / k + dx) + 'px';
    cursor.style.top = ((r.top - sr.top + r.height / 2) / k + dy) + 'px';
  }
  async function click(el) {
    cursor.style.opacity = 1; cursor.classList.add('big');
    moveCursor(el, -2, -2); await wait(900);
    cursor.classList.add('click'); el.classList.add('press'); await wait(180);
    el.classList.remove('press'); await wait(200); cursor.classList.remove('click', 'big');
  }
  const hideCursor = () => { cursor.style.opacity = 0; };

  const SCRIPTS = {
    overview: { title: 'claude — fix-auth-bug', lines: [
      ['c-r', 'Let me look at the auth module.'],
      ['c-i', 'Searching for 6 patterns… <span class="c-hint">(ctrl+o to expand)</span>'],
      ['c-i', 'Read 2 files <span class="c-hint">(ctrl+o to expand)</span>'],
      ['', '&nbsp;'],
      ['c-r', 'Found the issue — token validation skips expiry check.']] },
    approval: { title: 'claude — fix-auth-bug', lines: [
      ['c-r', 'Found the issue — token validation skips expiry check.'],
      ['', '&nbsp;'],
      ['c-tool', 'Edit(src/auth/middleware.ts)'],
      ['c-tree', '└── Waiting for permission…'],
      ['c-del', '- jwt.verify(token);'],
      ['c-add', '+ if (!token) throw new AuthError(\'missing\');'],
      ['c-add', '+ return jwt.verify(token, secret);']] },
    ask: { title: 'claude — fix-auth-bug', lines: [
      ['c-r', 'Auth fix applied. Tests are green.'],
      ['', '&nbsp;'],
      ['c-q', 'Which deployment target?'],
      ['c-opt', '1. Production'], ['c-opt', '2. Staging'], ['c-opt', '3. Local only'],
      ['c-hint', '↑↓ to select · enter to confirm']] },
    jump: { title: 'claude — fix-auth-bug', lines: [
      ['c-r', 'Deployed to Staging.'],
      ['c-tool', 'Bash(npm run deploy:staging)'],
      ['c-tree', '└── <span class="c-ok">Deploy complete</span>'],
      ['', '&nbsp;'],
      ['c-r', 'All done. 3 files changed.']] }
  };
  async function typeLines(name, id) {
    const s = SCRIPTS[name];
    termTitle.textContent = s.title;
    termBody.classList.add('typing');
    termBody.innerHTML = s.lines.map(([c, h]) => `<div class="${c}">${h}</div>`).join('');
    const rows = [...termBody.children];
    for (const r of rows) { if (id !== runId) return; await wait(reduced ? 0 : 340); r.classList.add('show'); }
  }
  const alive = id => id === runId;

  async function play(name) {
    const id = ++runId; current = name;
    hideCursor(); term.classList.remove('min', 'pop');
    setPill(name); setSceneCopy(name);
    const dur = { overview: 6200, approval: 8200, ask: 8200, jump: 7600 }[name];
    demo.style.setProperty('--dur', dur + 'ms');
    restartFill(name);
    notch.style.transitionDelay = '0s';
    typeLines(name, id);

    if (name === 'overview') {
      showLayer('compact'); await wait(1300); if (!alive(id)) return;
      showLayer('overview');
    } else if (name === 'approval') {
      showLayer('compact'); await wait(900); if (!alive(id)) return;
      showLayer('approval'); await wait(2300); if (!alive(id)) return;
      await click($('#allow')); if (!alive(id)) return;
      $('#okLabel').textContent = t('ok.approved') || 'Approved';
      showLayer('approved'); hideCursor(); await wait(1500); if (!alive(id)) return;
      showLayer('compact');
    } else if (name === 'ask') {
      showLayer('compact'); await wait(900); if (!alive(id)) return;
      showLayer('ask'); await wait(2300); if (!alive(id)) return;
      const opt = $('.k-opt[data-idx="1"]');
      await click(opt); if (!alive(id)) return;
      opt.classList.add('pick'); await wait(450); if (!alive(id)) return;
      $('#okLabel').textContent = 'Staging';
      showLayer('approved'); hideCursor(); await wait(1500); if (!alive(id)) return;
      opt.classList.remove('pick'); showLayer('compact');
    } else if (name === 'jump') {
      showLayer('compact'); await wait(900); if (!alive(id)) return;
      showLayer('jump'); await wait(2300); if (!alive(id)) return;
      await click($('#jumpRow')); if (!alive(id)) return;
      hideCursor(); showLayer('compact'); term.classList.add('pop'); await wait(700);
    }
  }

  /* pills + auto-advance */
  const order = ['overview', 'approval', 'ask', 'jump'];
  const pills = $$('.pill');
  function setPill(name) { pills.forEach(p => p.setAttribute('aria-selected', String(p.dataset.scene === name))); }
  function restartFill(name) {
    const p = pills.find(x => x.dataset.scene === name);
    p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  }
  function setSceneCopy(name) {
    $('#sceneT').textContent = t(SCENE_COPY[name][0]);
    $('#sceneD').textContent = t(SCENE_COPY[name][1]);
  }
  function setScene(name) { setSceneCopy(name); }
  let advance;
  function schedule(name) {
    clearTimeout(advance);
    if (reduced) return;
    const dur = { overview: 6200, approval: 8200, ask: 8200, jump: 7600 }[name];
    advance = setTimeout(() => { if (!paused && visible) go(order[(order.indexOf(name) + 1) % order.length]); else schedule(name); }, dur + 500);
  }
  function go(name) { play(name); schedule(name); }
  pills.forEach(p => p.addEventListener('click', () => go(p.dataset.scene)));

  new IntersectionObserver(es => {
    visible = es[0].isIntersecting; demo.classList.toggle('paused', !visible);
  }, { threshold: .15 }).observe(demo);
  demo.addEventListener('mouseenter', () => { paused = true; demo.classList.add('paused'); });
  demo.addEventListener('mouseleave', () => { paused = false; demo.classList.remove('paused'); });

  /* ---------- hero scatter canvas ----------
     A regular grid of tiny glyphs. Each glyph is dim by default and lights up with distance
     to the pointer (linear falloff, 140px). A few glyphs are swapped at random on a timer. */
  const cv = $("#scatter"), ctx = cv.getContext("2d");
  const hero = $(".hero");
  const GLYPHS = ["0", "1", "+", "-", "*", ":", "."];
  const REACH = 140, BASE = .12, GAIN = .5;
  let cell = innerWidth < 768 ? 20 : 14, cols = 0, rows = 0, cw = 0, ch = 0, grid = [], px = -999, py = -999, heroVisible = true;
  const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  function layout() {
    cell = innerWidth < 768 ? 20 : 14;
    cw = Math.min(hero.offsetWidth, 1060); ch = Math.max(0, hero.offsetHeight - 60);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = cw * dpr; cv.height = ch * dpr; cv.style.width = cw + "px"; cv.style.height = ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(cw / cell); rows = Math.ceil(ch / cell);
    grid = Array.from({ length: rows }, () => Array.from({ length: cols }, rnd));
  }
  function paintGrid() {
    ctx.clearRect(0, 0, cw, ch);
    ctx.font = ((cell * .55) | 0) + "px \"JetBrains Mono\", monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2, y = r * cell + cell / 2;
      const near = Math.max(0, 1 - Math.hypot(x - px, y - py) / REACH);
      ctx.fillStyle = "rgba(255,255,255," + (BASE + near * GAIN).toFixed(3) + ")";
      ctx.fillText(grid[r][c], x, y);
    }
  }
  hero.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; if (reduced) paintGrid(); });
  hero.addEventListener("pointerleave", () => { px = py = -999; if (reduced) paintGrid(); });
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(cv);
  /* repaint on a steady beat so the glow follows the pointer, and shuffle ~3% of glyphs each beat */
  setInterval(() => {
    if (!heroVisible || document.hidden || reduced) return;
    const n = ((rows * cols * .03) | 0) + 1;
    for (let i = 0; i < n; i++) grid[(Math.random() * rows) | 0][(Math.random() * cols) | 0] = rnd();
    paintGrid();
  }, innerWidth < 768 ? 250 : 150);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { layout(); paintGrid(); }, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { layout(); paintGrid(); });
  layout(); paintGrid();

  /* ---------- boot ---------- */
  const saved = store.get('vi-lang');
  setInstall('iso');
  if (saved === 'zh') applyLang('zh');
  go('overview');
})();
