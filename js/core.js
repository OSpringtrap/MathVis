// Shared helpers: number formatting and a tiny SVG-string toolkit.
// Topics register themselves with MV.register({...}); see README.md for the shape.
(() => {
  'use strict';

  const MINUS = '−';

  const fmt = (x, d = 2) => {
    if (Number.isNaN(x)) return 'undefined';
    if (!Number.isFinite(x)) return (x < 0 ? MINUS : '') + '∞';
    const s = x.toLocaleString('en-US', { maximumFractionDigits: d });
    return s === '-0' ? '0' : s.replace('-', MINUS);
  };

  const compact = (x) =>
    Math.abs(x) >= 1e5
      ? x.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })
      : fmt(x);

  // Colour names map to CSS variables so drawings follow the theme.
  const COLORS = {
    a: 'var(--a)', b: 'var(--b)', c: 'var(--c)', ink: 'var(--ink)',
    muted: 'var(--muted)', grid: 'var(--grid)', grid2: 'var(--grid-strong)', paper: 'var(--paper)', card: 'var(--card)',
    'a-soft': 'var(--a-soft)', 'b-soft': 'var(--b-soft)', 'c-soft': 'var(--c-soft)', 'ink-soft': 'var(--ink-soft)',
  };
  const col = (v) => COLORS[v] || v;

  function el(tag, attrs = {}, inner = '') {
    let out = '', style = '';
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'fill' || k === 'stroke') style += `${k}:${col(v)};`;
      else out += ` ${k}="${v}"`;
    }
    if (style) out += ` style="${style}"`;
    return `<${tag}${out}>${inner}</${tag}>`;
  }

  const S = {
    el,
    line: (x1, y1, x2, y2, stroke = 'ink', w = 2, extra = {}) =>
      el('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round', ...extra }),
    rect: (x, y, w, h, fill, stroke, extra = {}) =>
      el('rect', { x, y, width: Math.max(0, w), height: Math.max(0, h), fill: fill || 'none', stroke, ...extra }),
    circle: (cx, cy, r, fill, stroke, extra = {}) =>
      el('circle', { cx, cy, r, fill: fill || 'none', stroke, ...extra }),
    path: (d, stroke = 'ink', w = 2, extra = {}) =>
      el('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra }),
    poly: (pts, fill, stroke, extra = {}) =>
      el('polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: fill || 'none', stroke, 'stroke-linejoin': 'round', ...extra }),
    text: (x, y, str, o = {}) =>
      el('text', {
        x, y,
        fill: o.fill || 'ink',
        'font-size': o.size || 15,
        'text-anchor': o.anchor || 'middle',
        'font-weight': o.weight,
        'font-style': o.italic ? 'italic' : null,
        class: o.math ? 'm' : null,
        transform: o.transform,
      }, str),
    arrow(x1, y1, x2, y2, color = 'ink', w = 3, head = 12) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      if (len < 0.5) return '';
      const ux = dx / len, uy = dy / len, h = Math.min(head, len * 0.6);
      const bx = x2 - ux * h, by = y2 - uy * h, px = -uy * h * 0.55, py = ux * h * 0.55;
      return S.line(x1, y1, bx, by, color, w) +
        S.poly([[x2, y2], [bx + px, by + py], [bx - px, by - py]], color, color, { 'stroke-width': 1 });
    },
  };

  const dashed = (pattern = '4 6') => ({ 'stroke-dasharray': pattern });

  // ---------- Animation ----------
  // Drawings receive a build progress k from 0 to 1. Each element animates
  // over its own slice of that range: lin() is linear, seg() is eased.
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lin = (k, a, b) => clamp01((k - a) / (b - a));
  const seg = (k, a, b) => ease(lin(k, a, b));
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerpPt = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
  // Rotate point p about c by deg degrees (clockwise on screen).
  const rot = ([x, y], [cx, cy], deg) => {
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  };
  // Attributes that draw a stroke on progressively (needs pathLength support: path, circle, line, polyline).
  const drawOn = (u) => (u >= 1 ? {} : u <= 0 ? { opacity: 0 } : { pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': (1 - u).toFixed(4) });
  S.fade = (u, inner) => (u <= 0 ? '' : u >= 1 ? inner : `<g opacity="${u.toFixed(3)}">${inner}</g>`);

  // Fit a world-space box into a screen box, y pointing up. Returns P(x, y) -> [sx, sy].
  function fit(xmin, xmax, ymin, ymax, box = { x: 60, y: 40, w: 680, h: 330 }, maxScale = 60) {
    const sc = Math.min(maxScale, box.w / Math.max(xmax - xmin, 1e-6), box.h / Math.max(ymax - ymin, 1e-6));
    const ox = box.x + (box.w - (xmax - xmin) * sc) / 2 - xmin * sc;
    const oy = box.y + (box.h + (ymax - ymin) * sc) / 2 + ymin * sc;
    return { sc, P: (x, y) => [ox + x * sc, oy - y * sc] };
  }

  // 1, 2 or 5 times a power of ten: a tidy tick spacing near x.
  const niceStep = (x) => {
    const p = 10 ** Math.floor(Math.log10(x)), m = x / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  };

  // Typeset a small formula: single letters and pairs become italic variables; words of 3+ letters (sin, log, rel) stay upright;
  // ^x / ^{..} make superscripts and _x / _{..} subscripts.
  const UPRIGHT = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'mod', 'max', 'min', 'end', 'start', 'lim', 'exp']);
  const ATOM = '(<i>[^<]+</i>|[\\w−]+)';
  const M = (src) => `<span class="m">${src
    .replace(/[A-Za-zθ]+/g, (w) => (UPRIGHT.has(w) || (w.length > 2 && w === w.toLowerCase()) ? w : w.replace(/./g, (ch) => `<i>${ch}</i>`)))
    .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>').replace(new RegExp('\\^' + ATOM, 'g'), '<sup>$1</sup>')
    .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(new RegExp('_' + ATOM, 'g'), '<sub>$1</sub>')}</span>`;

  // A horizontal number line from lo to hi, drawn at height y.
  function numberLine(lo, hi, y, x0 = 40, x1 = 760) {
    const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const unit = (x1 - x0) / (hi - lo);
    const every = unit >= 26 ? 1 : unit >= 12 ? 2 : unit >= 5 ? 5 : 10;
    let svg = S.line(x0, y, x1, y, 'grid2', 2);
    for (let v = Math.ceil(lo); v <= hi; v++) {
      const major = v % every === 0;
      if (!major && unit < 6) continue;
      const t = major ? 7 : 4;
      svg += S.line(X(v), y - t, X(v), y + t, v === 0 ? 'ink' : 'grid2', v === 0 ? 2 : 1.5);
      if (major) svg += S.text(X(v), y + 28, fmt(v), { fill: v === 0 ? 'ink' : 'muted', size: 13 });
    }
    return { X, svg };
  }

  // A Cartesian plane. Visible area is [-xr, xr] × [-yr, yr].
  function plane({ cx = 400, cy = 210, unit = 30, xr = 12.6, yr = 6.6, labelEvery = 2 } = {}) {
    const X = (x) => cx + x * unit, Y = (y) => cy - y * unit;
    let svg = `<defs><clipPath id="plane-clip"><rect x="${X(-xr)}" y="${Y(yr)}" width="${2 * xr * unit}" height="${2 * yr * unit}"/></clipPath></defs>`;
    for (let i = Math.ceil(-xr); i <= xr; i++) svg += S.line(X(i), Y(yr), X(i), Y(-yr), 'grid', 1);
    for (let j = Math.ceil(-yr); j <= yr; j++) svg += S.line(X(-xr), Y(j), X(xr), Y(j), 'grid', 1);
    svg += S.line(X(-xr), Y(0), X(xr), Y(0), 'grid2', 1.5) + S.line(X(0), Y(yr), X(0), Y(-yr), 'grid2', 1.5);
    for (let i = Math.ceil(-xr); i <= xr; i++) {
      if (i && i % labelEvery === 0) svg += S.text(X(i), Y(0) + 17, fmt(i), { fill: 'muted', size: 11 });
    }
    for (let j = Math.ceil(-yr); j <= yr; j++) {
      if (j && j % labelEvery === 0) svg += S.text(X(0) - 7, Y(j) + 4, fmt(j), { fill: 'muted', size: 11, anchor: 'end' });
    }
    const clip = (inner) => `<g clip-path="url(#plane-clip)">${inner}</g>`;
    const curve = (f, color = 'ink', w = 3, extra = {}) => {
      let d = '', pen = false;
      const N = 400;
      for (let k = 0; k <= N; k++) {
        const x = -xr + (2 * xr * k) / N, y = f(x);
        if (!Number.isFinite(y) || Math.abs(y) > yr * 20) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;
        pen = true;
      }
      return S.path(d, color, w, extra);
    };
    return { X, Y, svg, clip, curve, xr, yr };
  }

  // ---------- Shapes in motion ----------
  const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  // Morph polygon A into polygon B (same number of corners): match winding and the closest starting corner, then lerp.
  function morph(A, B, u) {
    const area = (Q) => Q.reduce((s, p, i) => { const q = Q[(i + 1) % Q.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
    const Bm = Math.sign(area(A)) === Math.sign(area(B)) ? B : [...B].reverse();
    let best = 0, bestD = Infinity;
    for (let s = 0; s < Bm.length; s++) {
      let d = 0;
      for (let i = 0; i < A.length; i++) { const q = Bm[(i + s) % Bm.length]; d += (A[i][0] - q[0]) ** 2 + (A[i][1] - q[1]) ** 2; }
      if (d < bestD) { bestD = d; best = s; }
    }
    return A.map((p, i) => lerpPt(p, Bm[(i + best) % Bm.length], u));
  }

  // ---------- Sound events ----------
  // Topics describe sounds as events placed on the build (at/until in 0–1) or the simulation (in seconds).
  const pitch = (semitones) => 261.63 * 2 ** (semitones / 12); // 0 = middle C
  const PENTA = [0, 2, 4, 7, 9];
  const note = (i) => pitch(12 * Math.floor(i / 5) + PENTA[((i % 5) + 5) % 5]); // pentatonic: any sequence sounds pleasant
  const sfx = {
    glide: (at, until, from, to) => ({ kind: 'glide', at, until, from, to }),
    curve: (at, until, freqs) => ({ kind: 'curve', at, until, freqs }),
    tick: (at, f = pitch(12)) => ({ kind: 'tick', at, f }),
    pop: (at, f = pitch(12)) => ({ kind: 'pop', at, f }),
    chime: (at, f = pitch(12)) => ({ kind: 'chime', at, f }),
    chord: (at, freqs) => ({ kind: 'chord', at, freqs }),
    whoosh: (at, until) => ({ kind: 'whoosh', at, until }),
    swoosh: (at, until) => ({ kind: 'swoosh', at, until }),
    snip: (at) => ({ kind: 'snip', at }),
    thud: (at) => ({ kind: 'thud', at }),
    splash: (at) => ({ kind: 'splash', at }),
    hum: (at, until, f, harmonics = [1], gain = 1) => ({ kind: 'hum', at, until, f, harmonics, gain }),
  };

  window.MV = {
    topics: [],
    register(topic) { this.topics.push(topic); },
    fmt, compact, S, dashed, numberLine, plane, MINUS,
    clamp01, ease, lin, seg, lerp, lerpPt, rot, drawOn, fit, niceStep, M,
    centroid, morph, pitch, note, sfx,
  };
})();
