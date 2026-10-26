// Wires the registered topics to the page: navigation, scrubbable numbers, the animation clock,
// the timeline, step captions with formula highlighting, the formula list, sounds and preferences.
(() => {
  'use strict';
  const { topics, fmt } = MV;
  const $ = (id) => document.getElementById(id);
  const all = (sel) => [...document.querySelectorAll(sel)];
  const els = {
    nav: $('nav'), stage: $('stage'), title: $('title'), lede: $('lede'), modes: $('modes'), formula: $('formula'),
    aside: $('aside'), hint: $('hint'), fig: $('fig'), practice: $('practice'), pager: $('pager'),
    play: $('play'), replay: $('replay'), more: $('more'), menu: $('menu'), mute: $('mute'), demoChip: $('demo-chip'),
    settings: $('settings'), settingsPop: $('settings-pop'),
    readout: $('readout'), caption: $('caption'), timeline: $('timeline'), scrub: $('scrub'), markers: $('markers'),
    tlTime: $('tl-time'), tlSpeed: $('tl-speed'), theory: $('theory'), theoryTitle: $('theory-title'),
    formulas: $('formulas'), fList: $('f-list'), fFocus: $('f-focus'), fBack: $('f-back'), fPlay: $('f-play'), fPreview: $('f-preview'),
    player: document.querySelector('.player'),
    realms: all('.realm'), themeButtons: all('[data-theme-set]'),
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 820px)');
  const SECTION_TITLE = { math: 'The mathematics', phys: 'The physics' };
  const SUB_SYMBOL = { Triangles: '△' };
  const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
  const realmOf = (t) => t.realm || 'math';

  // ---------- Preferences (kept in this browser only) ----------

  const store = {
    get(k, d) { try { const v = localStorage.getItem(`mv:${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`mv:${k}`, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const prefs = {
    speed: store.get('speed', 1),
    timeline: store.get('timeline', false),
    sound: store.get('sound', true),
    volume: store.get('volume', 0.6),
    autoplay: store.get('autoplay', true),
    formulas: store.get('formulas', true),
    hint: store.get('hint', !store.get('hintSeen', false)),
    theme: store.get('theme', 'system'),
    closed: store.get('closed', []),
    openSubs: store.get('openSubs', []),
  };
  if (!SPEEDS.includes(prefs.speed)) prefs.speed = 1;
  MV.sound.setVolume(prefs.volume);

  // ---------- State ----------

  let base = null;     // the registered topic
  let topic = null;    // the topic with its active mode (or a formula demo) merged in
  let modeIdx = 0, state = {}, drag = null, realm = null;
  let steps = [], sounds = [], litKey = '';
  let demo = null, beforeDemo = null, focusIdx = -1;
  const remembered = {}, lastInRealm = { math: null, phys: null };

  // The whole animation lives on one timeline, in seconds: first the build (frame.k goes 0 → 1),
  // then, for simulations, the run (frame.t counts seconds) or, for sweeps, one full turn of a parameter.
  const frame = { k: 1, t: 0 };
  const tl = { p: 0, playing: false, through: false, raf: 0, last: 0 };

  const def = (k) => topic.params[k];
  const digits = (k) => def(k).digits ?? 2;
  const buildLen = () => topic.build ?? 2;
  const simDuration = () => (topic.sim?.duration ? topic.sim.duration(state) : 0);
  const sweepLen = () => { const a = topic.animate; if (!a) return 0; const d = def(a.param); return (d.max - d.min) / a.speed; };
  const tailLen = () => (topic.sim ? simDuration() : sweepLen());
  const total = () => buildLen() + tailLen();
  const hasTail = () => !!(topic.sim || topic.animate);
  const sfxOn = () => prefs.sound && prefs.volume > 0;

  // ---------- Formula helpers handed to each topic ----------

  const h = {
    f: fmt,
    n: (k, abs = false) => {
      const d = def(k);
      const shown = abs ? Math.abs(state[k]) : state[k];
      return `<span class="scrub" data-k="${k}" data-p="${k}" tabindex="0" role="slider" aria-label="${d.label}" ` +
        `aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${state[k]}" ` +
        `style="--col:var(--${d.color})">${fmt(shown, digits(k))}</span>`;
    },
    // "+ 3" or "− 3": the operator follows the sign so formulas never read "+ −3".
    signed: (k) => `<span class="op">${state[k] < 0 ? MV.MINUS : '+'}</span>${h.n(k, true)}`,
    val: (k, x = state[k], d = digits(k)) => `<span class="val" data-k="${k}" style="--col:var(--${def(k).color})">${fmt(x, d)}</span>`,
    c: (color, text, key) => `<span class="val"${key ? ` data-k="${key}"` : ''} style="--col:var(--${color})">${text}</span>`,
    r: (x, d = 2) => `<span class="res" data-k="res">${typeof x === 'number' ? fmt(x, d) : x}</span>`,
    v: (name) => `<i class="v">${name}</i>`,
    frac: (num, den) => `<span class="frac"><span>${num}</span><span>${den}</span></span>`,
    unit: (u) => `<span class="unit">${u}</span>`,
    ro: (label, value, unit = '', color) =>
      `<span class="ro">${label} <b${color ? ` style="color:var(--${color})"` : ''}>${value}</b>${unit ? ` ${unit}` : ''}</span>`,
  };

  // ---------- Navigation ----------

  function renderNav() {
    const groups = [];
    for (const t of topics.filter((x) => realmOf(x) === realm)) {
      let g = groups.find((x) => x.name === t.group);
      if (!g) groups.push((g = { name: t.group, items: [] }));
      g.items.push(t);
    }
    const link = (t) => `<li><a href="#${t.id}" data-id="${t.id}"><span class="sym">${t.symbol}</span><span>${t.title}</span></a></li>`;
    els.nav.innerHTML = groups.map((g) => {
      let html = '', sub = null;
      for (const t of g.items) {
        if ((t.sub || null) !== sub) {
          if (sub) html += '</ul></li>';
          if (t.sub) {
            const key = `${realm}:${t.sub}`, open = prefs.openSubs.includes(key);
            html += `<li class="sub${open ? '' : ' collapsed'}" data-sub="${key}"><button type="button" class="sub-toggle" aria-expanded="${open}">` +
              `<span class="sym">${SUB_SYMBOL[t.sub] || '•'}</span><span>${t.sub}</span><span class="caret"></span></button><ul>`;
          }
          sub = t.sub || null;
        }
        html += link(t);
      }
      if (sub) html += '</ul></li>';
      const key = `${realm}:${g.name}`;
      const open = narrow.matches || !prefs.closed.includes(key);
      return `<details class="group" data-key="${key}"${open ? ' open' : ''}><summary>${g.name}</summary><ul>${html}</ul></details>`;
    }).join('');
    for (const d of els.nav.querySelectorAll('details')) {
      d.addEventListener('toggle', () => {
        if (narrow.matches) return;
        const set = new Set(prefs.closed);
        if (d.open) set.delete(d.dataset.key); else set.add(d.dataset.key);
        prefs.closed = [...set];
        store.set('closed', prefs.closed);
      });
    }
  }

  function setSubOpen(li, open, remember = true) {
    li.classList.toggle('collapsed', !open);
    li.querySelector('.sub-toggle').setAttribute('aria-expanded', String(open));
    if (!remember) return;
    const set = new Set(prefs.openSubs);
    if (open) set.add(li.dataset.sub); else set.delete(li.dataset.sub);
    prefs.openSubs = [...set];
    store.set('openSubs', prefs.openSubs);
  }

  els.nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.sub-toggle');
    if (!btn) return;
    const li = btn.closest('.sub');
    setSubOpen(li, li.classList.contains('collapsed'));
  });

  // ---------- Rendering ----------

  const resolve = (x) => (typeof x === 'function' ? x(state, h) : x);

  function renderText() {
    const active = document.activeElement;
    const focusKey = active && active.classList.contains('scrub') ? active.dataset.p : null;
    els.formula.innerHTML = topic.formula(state, h);
    const aside = topic.aside ? topic.aside(state, h) : '';
    els.aside.innerHTML = aside;
    els.aside.hidden = !aside;
    // Operators get their symbol as a highlight key, so steps can light up "+" or "×".
    for (const el of els.stage.querySelectorAll('#formula .op, #aside .op')) if (!el.dataset.k) el.dataset.k = el.textContent.trim();
    const practice = topic.practice ? topic.practice(state, h) : null;
    els.practice.parentElement.hidden = !practice;
    if (practice) els.practice.innerHTML = practice.map((x) => `<li>${x}</li>`).join('');
    steps = resolve(topic.steps) || [];
    buildSounds();
    litKey = '';
    if (focusKey) els.stage.querySelector(`.scrub[data-p="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  function currentStep() {
    if (!steps.length) return -1;
    if (tl.p >= buildLen() - 1e-9) return steps.length - 1;
    let i = 0;
    for (let j = 0; j < steps.length; j++) if (frame.k >= steps[j].at) i = j;
    return i;
  }

  function renderCaption() {
    const i = currentStep();
    const building = tl.p < buildLen() - 1e-9;
    let text = '', num = '';
    if (!building && topic.simSay && topic.sim) {
      text = topic.simSay(state, h, frame);
    } else if (i >= 0) {
      text = resolve(steps[i].say);
      num = `${i + 1}/${steps.length}`;
    }
    els.caption.innerHTML = text ? `${num ? `<span class="n">${num}</span>` : ''}<span>${text}</span>` : '';
    // Light up the parts of the formula this step is about, only while the drawing is being built.
    const keys = building && i >= 0 ? steps[i].hl || [] : [];
    const key = keys.join('|');
    if (key === litKey) return;
    litKey = key;
    for (const el of els.stage.querySelectorAll('#formula [data-k], #aside [data-k]')) {
      el.classList.toggle('lit', keys.includes(el.dataset.k));
    }
  }

  function drawFrame() {
    els.fig.innerHTML = topic.draw(state, h, frame);
    els.fPlay.style.setProperty('--prog', demo ? Math.min(1, tl.p / total()).toFixed(4) : 0);
    els.readout.innerHTML = topic.readout ? topic.readout(state, h, frame) : '';
    renderCaption();
    syncTimeline();
  }

  // ---------- Timeline ----------

  function renderMarkers() {
    const T = total();
    let html = steps.map((s, i) => `<button type="button" class="marker" data-p="${s.at * buildLen()}" style="left:${(100 * s.at * buildLen()) / T}%" aria-label="Step ${i + 1}" title="${String(resolve(s.say)).replace(/<[^>]+>/g, '').replace(/"/g, '&quot;')}"></button>`).join('');
    if (hasTail()) html += `<button type="button" class="marker run" data-p="${buildLen()}" style="left:${(100 * buildLen()) / T}%" aria-label="${topic.sim ? 'Simulation' : 'Sweep'} starts" title="${topic.sim ? 'Simulation' : 'Sweep'} starts"></button>`;
    els.markers.innerHTML = html;
  }

  function syncTimeline() {
    if (els.timeline.hidden) return;
    const T = total();
    els.scrub.max = T.toFixed(3);
    els.scrub.value = tl.p.toFixed(3);
    els.scrub.style.setProperty('--fill', `${(100 * tl.p) / T}%`);
    els.tlTime.textContent = `${tl.p.toFixed(1)} s of ${T.toFixed(1)} s`;
    for (const m of els.markers.children) m.classList.toggle('done', +m.dataset.p <= tl.p + 1e-6);
  }

  // Put everything that depends on the timeline position in place.
  function applyPosition() {
    const B = buildLen();
    frame.k = Math.min(1, tl.p / B);
    frame.t = topic.sim ? Math.max(0, tl.p - B) : 0;
    if (topic.animate && tl.p > B) {
      const { param, speed } = topic.animate, d = def(param);
      state = { ...state, [param]: Math.min(d.max, d.min + (tl.p - B) * speed) };
      renderText();
    }
  }

  // ---------- Sound ----------

  function buildSounds() {
    const B = buildLen();
    const build = (resolve(topic.sfx) || []).map((e) => ({ ...e, P: e.at * B, D: ((e.until ?? e.at) - e.at) * B }));
    const sim = topic.sim ? (resolve(topic.simSfx) || []).map((e) => ({ ...e, P: B + e.at, D: (e.until ?? e.at) - e.at })) : [];
    sounds = build.concat(sim).sort((x, y) => x.P - y.P);
  }

  function playSounds(from, to) {
    if (!sfxOn() || to <= from) return;
    for (const e of sounds) {
      if (e.P >= to) break;
      if (e.P >= from) MV.sound.play(e, e.D / prefs.speed);
    }
  }

  const blip = (kind, extra = {}) => { if (sfxOn()) MV.sound.play({ kind, ...extra }, 0.25); };

  // ---------- Clock ----------

  function tick(now) {
    const dt = (Math.min(0.05, (now - tl.last) / 1000)) * prefs.speed;
    tl.last = now;
    const B = buildLen(), T = total();
    const from = tl.p;
    let to = from + dt, stop = false;
    if (from < B && to >= B && !tl.through) { to = B; stop = true; }
    if (to >= T) {
      if (topic.animate && tl.through && sweepLen() > 0) to = B + ((to - B) % sweepLen());
      else { to = T; stop = true; }
    }
    playSounds(from, to);
    tl.p = to;
    applyPosition();
    drawFrame();
    if (stop) tl.playing = false;
    updateButtons();
    tl.raf = tl.playing ? requestAnimationFrame(tick) : 0;
  }

  function start(through) {
    tl.through = through;
    tl.playing = true;
    if (!tl.raf) { tl.last = performance.now(); tl.raf = requestAnimationFrame(tick); }
    updateButtons();
  }

  function pause() {
    tl.playing = false;
    cancelAnimationFrame(tl.raf);
    tl.raf = 0;
    updateButtons();
  }

  function seek(p) {
    tl.p = Math.max(0, Math.min(total(), p));
    applyPosition();
    drawFrame();
  }

  function replay() {
    pause();
    if (reducedMotion.matches) { seek(topic.sim ? total() : buildLen()); return; }
    seek(0);
    start(!!topic.sim);
  }

  function togglePlay() {
    MV.sound.unlock();
    if (tl.playing) return pause();
    const B = buildLen(), T = total();
    if (topic.sim) {
      if (tl.p >= T - 1e-6) seek(B);
      start(true);
    } else if (topic.animate) {
      // Continue the sweep from the parameter's current value.
      if (tl.p >= B - 1e-6) {
        const { param, speed } = topic.animate, d = def(param);
        tl.p = B + (state[param] - d.min) / speed;
      }
      start(true);
    } else {
      if (tl.p >= B - 1e-6) seek(0);
      start(false);
    }
  }

  function updateButtons() {
    if (!topic) return;
    if (demo) els.fPlay.querySelector('.f-playlabel').textContent = tl.playing ? 'Playing formula' : tl.p >= total() - 1e-6 ? 'Play formula again' : 'Paused';
    els.fPlay.classList.toggle('playing', !!demo && tl.playing);
    const playing = tl.playing;
    els.play.innerHTML = `<svg><use href="#i-${playing ? 'pause' : 'play'}"/></svg>`;
    els.play.setAttribute('aria-label', playing ? 'Pause' : hasTail() ? (topic.sim ? 'Run the simulation' : 'Play the sweep') : 'Play the drawing');
    els.play.title = els.play.getAttribute('aria-label');
  }

  // ---------- Parameters ----------

  function set(k, v) {
    const d = def(k);
    v = Math.min(d.max, Math.max(d.min, v));
    v = +(Math.round((v - d.min) / d.step) * d.step + d.min).toFixed(6);
    if (v === state[k]) return;
    const B = buildLen();
    const atEnd = tl.p >= total() - 1e-6;
    state = { ...state, [k]: v };
    if (topic.constrain) state = topic.constrain(state, k);
    if (tl.p < B) tl.p = B; // show the finished drawing so the change is visible right away
    if (topic.sim) tl.p = atEnd ? total() : Math.min(tl.p, total());
    if (topic.animate && k === topic.animate.param) {
      if (tl.playing) pause();
      tl.p = B + (v - d.min) / topic.animate.speed;
    }
    applyPosition();
    renderText();
    renderMarkers();
    drawFrame();
    if (prefs.hint) setPref('hint', false);
  }

  // ---------- Formula list ----------

  const formulaList = () => (topic && (topic.formulas || MV.formulas?.[base.id])) || [];

  function renderFormulas() {
    const list = formulaList();
    const show = prefs.formulas && list.length > 0;
    els.stage.classList.toggle('no-formulas', !show);
    els.formulas.hidden = !show;
    focusIdx = -1;
    els.fFocus.hidden = true;
    els.fBack.hidden = true;
    els.fList.hidden = false;
    els.fList.innerHTML = list.map((f, i) => `<li><button type="button" class="f-item" data-i="${i}">` +
      `<span class="f-name">${f.name}</span><span class="f-tex">${MV.M(f.f)}</span></button></li>`).join('');
    // The big button plays this topic's formula; its preview lights the pieces up in the order they'll be built.
    const play = MV.plays?.[base.id];
    els.fPlay.hidden = !play;
    if (play) {
      const parts = play.preview.map(([pos, text, order]) => ({ pos, text, order })).sort((x, y) => x.pos - y.pos);
      els.fPreview.innerHTML = parts.map((x) => `<span style="--i:${x.order}">${x.text}</span>`).join('');
      els.fPlay.setAttribute('aria-label', `Play formula: build ${play.name} step by step on the display`);
    }
  }

  // The chosen formula pops out of the list and grows into a card.
  function openFocus(i) {
    const f = formulaList()[i];
    const item = els.fList.querySelector(`.f-item[data-i="${i}"]`);
    if (!f || !item) return;
    const from = item.getBoundingClientRect();
    focusIdx = i;
    els.fFocus.innerHTML = `<span class="f-name">${f.name}</span><span class="f-tex">${MV.M(f.f)}</span>` +
      (f.note ? `<p class="f-note">${f.note}</p>` : '');
    els.fList.hidden = true;
    els.fFocus.hidden = false;
    els.fBack.hidden = false;
    blip('pop', { f: MV.note(9) });
    if (reducedMotion.matches) return;
    const to = els.fFocus.getBoundingClientRect();
    els.fFocus.style.transformOrigin = 'top left';
    els.fFocus.animate([
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.7 },
      { transform: 'translate(0, 0) scale(1.04)', offset: 0.7 },
      { transform: 'none', opacity: 1 },
    ], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  // Back to the list: the card winds up to the left, flings right into its place,
  // overshoots into the edge of the window with a thud, and settles.
  function closeFocus() {
    if (focusIdx < 0) return;
    const i = focusIdx;
    focusIdx = -1;
    const from = els.fFocus.getBoundingClientRect();
    const ghost = els.fFocus.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('f-ghost');
    els.fFocus.hidden = true;
    els.fBack.hidden = true;
    els.fList.hidden = false;
    const item = els.fList.querySelector(`.f-item[data-i="${i}"]`);
    if (reducedMotion.matches || !item) return;
    const to = item.getBoundingClientRect();
    Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.appendChild(ghost);
    item.style.visibility = 'hidden';
    const sx = to.width / from.width, sy = to.height / from.height;
    const dx = to.left - from.left, dy = to.top - from.top;
    const over = Math.max(8, Math.min(48, window.innerWidth - 4 - to.right)); // distance to the "wall"
    const T = (x, y, a, b) => `translate(${x}px, ${y}px) scale(${a}, ${b})`;
    const duration = 760;
    ghost.animate([
      { transform: T(0, 0, 1, 1), easing: 'cubic-bezier(.3,.7,.4,1)' },
      { transform: T(-34, 0, 1.07, 0.95), offset: 0.26, easing: 'cubic-bezier(.6,0,.9,.4)' },
      { transform: T(dx + over, dy, sx * 0.84, sy * 1.08), offset: 0.6, easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: T(dx - 7, dy, sx * 1.03, sy * 0.98), offset: 0.8 },
      { transform: T(dx, dy, sx, sy) },
    ], { duration }).onfinish = () => { ghost.remove(); item.style.visibility = ''; };
    setTimeout(() => blip('swoosh'), duration * 0.24);
    setTimeout(() => {
      blip('thud');
      els.formulas.classList.remove('bump');
      void els.formulas.offsetWidth;
      els.formulas.classList.add('bump');
    }, duration * 0.6);
  }

  els.fList.addEventListener('click', (e) => {
    const item = e.target.closest('.f-item');
    if (item) { MV.sound.unlock(); openFocus(+item.dataset.i); }
  });
  els.fPlay.addEventListener('click', () => {
    if (demo && tl.playing) { pause(); return; }
    if (demo && tl.p < buildLen() - 1e-6) { start(false); return; }
    startDemo();
  });
  els.fBack.addEventListener('click', closeFocus);

  // A formula demo temporarily takes over the player: it builds the formula one term at a time.
  function startDemo() {
    const play = MV.plays?.[base.id];
    if (!play) return;
    MV.sound.unlock();
    if (demo) endDemo(false);
    demo = play;
    beforeDemo = topic;
    topic = { ...topic, ...play, sim: undefined, animate: undefined, simSay: undefined, simSfx: undefined, readout: undefined };
    els.fPlay.classList.add('playing');
    els.fPlay.querySelector('.f-playlabel').textContent = 'Playing formula';
    els.demoChip.querySelector('span').textContent = play.name;
    els.demoChip.setAttribute('aria-label', `Leave ${play.name}`);
    els.demoChip.hidden = false;
    els.fig.setAttribute('viewBox', `0 0 800 ${topic.height || 420}`);
    renderText();
    renderMarkers();
    const r = els.player.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) els.player.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    replay();
  }

  function endDemo(redraw = true) {
    if (!demo) return;
    demo = null;
    topic = beforeDemo;
    els.demoChip.hidden = true;
    resetPlayButton();
    els.fig.setAttribute('viewBox', `0 0 800 ${topic.height || 420}`);
    renderText();
    renderMarkers();
    if (redraw) { pause(); seek(topic.sim ? total() : buildLen()); }
  }
  els.demoChip.addEventListener('click', () => endDemo());
  function resetPlayButton() {
    els.fPlay.classList.remove('playing');
    els.fPlay.querySelector('.f-playlabel').textContent = 'Play formula';
    els.fPlay.style.setProperty('--prog', 0);
  }

  // ---------- Topics and modes ----------

  function parseHash() {
    const [id, mode] = decodeURIComponent(location.hash.slice(1)).split(':');
    return { id, mode };
  }

  function show(id, modeId) {
    const t = topics.find((x) => x.id === id) || topics.find((x) => x.id === store.get('last', '')) || topics[0];
    pause();
    if (demo) { demo = null; topic = beforeDemo; els.demoChip.hidden = true; resetPlayButton(); }
    if (topic) remembered[`${base.id}:${topic.modeId || ''}`] = state;
    const switching = base && base !== t;
    base = t;
    modeIdx = t.modes ? Math.max(0, t.modes.findIndex((m) => m.id === modeId)) : 0;
    topic = t.modes ? { ...t, ...t.modes[modeIdx], modeId: t.modes[modeIdx].id } : t;
    state = remembered[`${t.id}:${topic.modeId || ''}`] || Object.fromEntries(Object.entries(topic.params).map(([k, d]) => [k, d.value]));
    store.set('last', t.id);

    if (realmOf(t) !== realm) { realm = realmOf(t); renderNav(); }
    lastInRealm[realm] = t.id;
    for (const a of els.realms) {
      const r = a.dataset.realm;
      a.href = `#${lastInRealm[r] || topics.find((x) => realmOf(x) === r).id}`;
      if (r === realm) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
    for (const a of els.nav.querySelectorAll('a')) {
      if (a.dataset.id === t.id) {
        a.setAttribute('aria-current', 'page');
        a.closest('details').open = true;
        const sub = a.closest('.sub');
        if (sub) setSubOpen(sub, true, false);
      } else a.removeAttribute('aria-current');
    }

    document.title = `${t.title} – ${realm === 'phys' ? 'PhysVis' : 'MathVis'}`;
    els.title.textContent = t.title;
    els.lede.textContent = topic.lede;
    els.modes.hidden = !t.modes;
    els.modes.innerHTML = '';
    if (t.modes) {
      const btn = (m, i) => `<button type="button" data-mode="${m.id}" aria-pressed="${i === modeIdx}">${m.label}</button>`;
      els.modes.innerHTML = btn(t.modes[0], 0) + (t.modes.length > 1 ? `<span class="label">Examples</span>` : '') +
        t.modes.slice(1).map((m, i) => btn(m, i + 1)).join('');
    }
    els.formula.classList.toggle('compact', !!topic.compact);
    els.fig.setAttribute('viewBox', `0 0 800 ${topic.height || 420}`);
    els.fig.setAttribute('aria-label', `Diagram: ${t.title.toLowerCase()}`);
    els.theoryTitle.textContent = SECTION_TITLE[realm];
    els.theory.innerHTML = (topic.theory || []).map(([head, body]) => `<div class="theory-item"><h3>${head}</h3><p>${body}</p></div>`).join('');
    els.theory.parentElement.hidden = !topic.theory;

    const list = topics.filter((x) => realmOf(x) === realm);
    const i = list.indexOf(t), prev = list[i - 1], next = list[i + 1];
    els.pager.innerHTML =
      (prev ? `<a class="prev" href="#${prev.id}"><span>Previous</span>${prev.title}</a>` : '') +
      (next ? `<a class="next" href="#${next.id}"><span>Next</span>${next.title}</a>` : '');

    renderText();
    renderMarkers();
    renderFormulas();
    els.stage.classList.remove('arrive');
    void els.stage.offsetWidth;
    els.stage.classList.add('arrive');
    if (prefs.autoplay) replay();
    else seek(topic.sim ? total() : buildLen());
    if (switching) window.scrollTo({ top: 0 });
  }

  els.modes.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]');
    if (!b) return;
    MV.sound.unlock();
    history.replaceState(null, '', `#${base.id}${b.dataset.mode === base.modes[0].id ? '' : `:${b.dataset.mode}`}`);
    show(base.id, b.dataset.mode);
  });

  // ---------- Controls and preferences ----------

  els.play.addEventListener('click', togglePlay);
  els.replay.addEventListener('click', () => { MV.sound.unlock(); replay(); });

  const popovers = [[els.more, els.menu], [els.settings, els.settingsPop]];
  function setPopover(btn, pop, open) {
    pop.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    // Settings opens upward from the sidebar's corner, positioned against the window so the sidebar can't clip it.
    if (open && pop === els.settingsPop && !narrow.matches) {
      const r = btn.getBoundingClientRect();
      Object.assign(pop.style, { left: `${Math.max(8, r.left - 150)}px`, bottom: `${window.innerHeight - r.top + 8}px` });
    }
  }
  for (const [btn, pop] of popovers) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = pop.hidden;
      for (const [b, p] of popovers) setPopover(b, p, false);
      setPopover(btn, pop, open);
    });
  }
  document.addEventListener('click', (e) => {
    for (const [btn, pop] of popovers) if (!pop.hidden && !pop.contains(e.target)) setPopover(btn, pop, false);
  });

  function setPref(key, value) {
    prefs[key] = value;
    store.set(key, value);
    if (key === 'sound' && value) MV.sound.unlock();
    if (key === 'formulas' && topic) renderFormulas();
    applyPrefs();
  }

  function applyPrefs() {
    els.timeline.hidden = !prefs.timeline;
    els.hint.hidden = !prefs.hint;
    for (const b of all('[data-pref]')) b.setAttribute('aria-checked', String(!!prefs[b.dataset.pref]));
    const silent = !prefs.sound || prefs.volume <= 0;
    els.mute.innerHTML = `<svg><use href="#i-${silent ? 'mute' : 'sound'}"/></svg>`;
    els.mute.setAttribute('aria-label', prefs.sound ? 'Turn sound off' : 'Turn sound on');
    els.mute.title = `${els.mute.getAttribute('aria-label')} (hover for volume)`;
    for (const g of all('[data-speed-group]')) {
      g.innerHTML = SPEEDS.map((s) => `<button type="button" data-speed="${s}" aria-pressed="${s === prefs.speed}">${s}×</button>`).join('');
    }
    for (const v of all('[data-volume]')) { v.value = prefs.volume; v.style.setProperty('--fill', `${prefs.volume * 100}%`); }
    els.tlSpeed.textContent = `${prefs.speed}× speed`;
    for (const b of els.themeButtons) b.setAttribute('aria-pressed', String(b.dataset.themeSet === prefs.theme));
    if (prefs.theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = prefs.theme;
    if (topic) syncTimeline();
  }

  document.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-pref]');
    if (sw) setPref(sw.dataset.pref, !prefs[sw.dataset.pref]);
    const sp = e.target.closest('[data-speed]');
    if (sp) setPref('speed', +sp.dataset.speed);
  });
  for (const v of all('[data-volume]')) {
    v.addEventListener('input', () => {
      prefs.volume = +v.value;
      store.set('volume', prefs.volume);
      MV.sound.setVolume(prefs.volume);
      if (prefs.volume > 0 && !prefs.sound) prefs.sound = true, store.set('sound', true);
      applyPrefs();
    });
    v.addEventListener('change', () => { MV.sound.unlock(); blip('tick', { f: MV.note(7) }); });
  }
  els.mute.addEventListener('click', () => setPref('sound', !prefs.sound));
  for (const b of els.themeButtons) b.addEventListener('click', () => setPref('theme', b.dataset.themeSet));

  els.scrub.addEventListener('input', () => { pause(); seek(+els.scrub.value); });
  els.markers.addEventListener('click', (e) => {
    const m = e.target.closest('.marker');
    if (!m) return;
    pause();
    seek(+m.dataset.p + 1e-4);
  });

  // ---------- Scrubbing numbers: drag sideways or use the keyboard ----------

  els.stage.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.scrub');
    if (!el || e.button > 0) return;
    e.preventDefault();
    MV.sound.unlock();
    el.focus({ preventScroll: true });
    const k = el.dataset.p, d = def(k);
    drag = { k, x: e.clientX, v: d.min + Math.round((state[k] - d.min) / d.step) * d.step };
    document.body.classList.add('scrubbing');
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const d = def(drag.k);
    const n = (d.max - d.min) / d.step;
    const px = Math.max(3, Math.min(16, 420 / n)); // pixels per step
    set(drag.k, drag.v + Math.round((e.clientX - drag.x) / px) * d.step);
  });

  const endDrag = () => { drag = null; document.body.classList.remove('scrubbing'); };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  els.stage.addEventListener('keydown', (e) => {
    const el = e.target.closest('.scrub');
    if (!el) return;
    const k = el.dataset.p, d = def(k), big = e.shiftKey ? 10 : 1;
    const moves = {
      ArrowUp: d.step * big, ArrowRight: d.step * big,
      ArrowDown: -d.step * big, ArrowLeft: -d.step * big,
      PageUp: d.step * 10, PageDown: -d.step * 10,
    };
    if (e.key in moves) set(k, state[k] + moves[e.key]);
    else if (e.key === 'Home') set(k, d.min);
    else if (e.key === 'End') set(k, d.max);
    else return;
    e.preventDefault();
  });

  // ---------- Keyboard shortcuts ----------

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      for (const [btn, pop] of popovers) if (!pop.hidden) { setPopover(btn, pop, false); btn.focus(); return; }
      if (focusIdx >= 0) { closeFocus(); return; }
    }
    const tag = e.target.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
    if (typing && e.target !== els.scrub) return;
    if (e.target.classList?.contains('scrub') && e.key.startsWith('Arrow')) return;
    const list = topics.filter((x) => realmOf(x) === realm);
    const i = list.indexOf(base);
    if (e.key === ' ' && !(tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) { e.preventDefault(); togglePlay(); }
    else if (e.key === 'r' || e.key === 'R') { MV.sound.unlock(); replay(); }
    else if (e.key === 't' || e.key === 'T') setPref('timeline', !prefs.timeline);
    else if (e.key === 'm' || e.key === 'M') setPref('sound', !prefs.sound);
    else if (e.key === '[' && list[i - 1]) location.hash = list[i - 1].id;
    else if (e.key === ']' && list[i + 1]) location.hash = list[i + 1].id;
  });

  // The browser only allows sound after the person interacts with the page.
  window.addEventListener('pointerdown', () => { if (prefs.sound) MV.sound.unlock(); }, { once: true });

  applyPrefs();
  window.addEventListener('hashchange', () => { const { id, mode } = parseHash(); show(id, mode); });
  const { id, mode } = parseHash();
  show(id, mode);
})();
