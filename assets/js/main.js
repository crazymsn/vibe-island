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
  EN['cycle.0'] = 'AI agents'; EN['cycle.1'] = 'Claude Code'; EN['cycle.2'] = 'Codex'; EN['cycle.3'] = 'Gemini CLI'; EN['cycle.4'] = 'Cursor'; EN['cycle.5'] = 'OpenCode';
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

  /* ---------- headline word cycle ---------- */
  const cycle = $('#cycle');
  let ci = 0;
  if (!reduced) {
    setInterval(() => {
      cycle.classList.add('out');
      setTimeout(() => { ci = (ci + 1) % 6; cycle.textContent = EN['cycle.' + ci]; cycle.classList.remove('out'); }, 260);
    }, 2600);
  }

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

  /* ---------- hero scatter canvas (drifting 0/1 glyphs, like the reference) ---------- */
  const cv = $('#scatter'), ctx = cv.getContext('2d');
  const GLYPHS = ['0', '1', '+', '*', ':', '.', '-'];
  let cells = [], cw = 0, ch = 0, dpr = 1, raf = 0;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cw = cv.clientWidth; ch = cv.clientHeight;
    cv.width = cw * dpr; cv.height = ch * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const stepX = 40, stepY = 40; cells = [];
    for (let y = 0; y < ch; y += stepY) for (let x = 0; x < cw; x += stepX)
      cells.push({ x: x + (Math.random() * 10 - 5), y: y + (Math.random() * 10 - 5), g: GLYPHS[(Math.random() * GLYPHS.length) | 0], p: Math.random() * 6.28, sp: .3 + Math.random() * .9 });
    draw(0);
  }
  function draw(time) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.font = '11px "Geist Mono", monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    for (const c of cells) {
      const a = .06 + .16 * (.5 + .5 * Math.sin(time / 1000 * c.sp + c.p));
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fillText(c.g, c.x, c.y);
    }
  }
  function loop(ts) { if (visibleHero) draw(ts); raf = requestAnimationFrame(loop); }
  let visibleHero = true;
  new IntersectionObserver(es => { visibleHero = es[0].isIntersecting; }, { threshold: 0 }).observe($('.hero'));
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  layout(); if (!reduced) raf = requestAnimationFrame(loop);

  /* ---------- boot ---------- */
  const saved = store.get('vi-lang');
  setInstall('iso');
  if (saved === 'zh') applyLang('zh');
  go('overview');
})();
