// Props shared by the PhysVis subject topics and their formula plays: captions, stick figures, time graphs,
// springs, bars, thermometers, flames, circuits and clipping boxes. Everything returns SVG strings.
(() => {
  'use strict';
  const { S, fmt, niceStep } = MV;

  const caption = (x, y, text, o = {}) => S.text(x, y, text, { anchor: 'start', fill: 'muted', size: 13, ...o });
  const label = (x, y, text, o = {}) => S.text(x, y, text, { size: 13, ...o });
  const pts = (list) => list.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  // A path through n + 1 samples of f(u) for u from 0 to 1, where f returns [x, y].
  const path = (n, f) => pts(Array.from({ length: n + 1 }, (_, i) => f(i / n)));

  const figure = (x, y, color, k = 1) =>
    S.line(x, y - 22 * k, x - 9 * k, y, color, 3.5) + S.line(x, y - 22 * k, x + 9 * k, y, color, 3.5) +
    S.line(x, y - 22 * k, x, y - 42 * k, color, 4) + S.line(x - 12 * k, y - 34 * k, x + 12 * k, y - 34 * k, color, 3) +
    S.circle(x, y - 51 * k, 8 * k, color);
  const wheels = (xs, y, spin) => xs.map((x) =>
    S.circle(x, y - 6, 6.5, 'ink') + S.line(x, y - 6, x + 5 * Math.cos(spin), y - 6 + 5 * Math.sin(spin), 'paper', 1.5)).join('');
  // A cart: body from x - w to x, sitting on the line y.
  const cart = (x, y, w, color, text, spin = 0) =>
    S.rect(x - w, y - 34, w, 24, color, null, { rx: 4 }) + wheels([x - w + 9, x - 9], y, spin) +
    (text ? S.text(x - w / 2, y - 18, text, { fill: 'paper', size: 11, weight: 600 }) : '');
  // A labelled box standing on y, centred on cx.
  const block = (cx, y, w, h, color = 'b', text) =>
    S.rect(cx - w / 2, y - h, w, h, `${color}-soft`, color, { rx: 5, 'stroke-width': 2 }) +
    (text ? S.text(cx, y - h / 2 + 5, text, { fill: color, size: 13, weight: 600 }) : '');

  // Axes for a quantity against time (or anything). Returns X, Y and the axes markup.
  function graph({ x0 = 90, x1 = 740, y0 = 390, y1 = 230, tMax, vMax, vMin = 0, tLabel = 'time (s)', vLabel = '', ticks = true }) {
    const X = (t) => x0 + (t / tMax) * (x1 - x0), Y = (v) => y0 - ((v - vMin) / (vMax - vMin)) * (y0 - y1);
    let s = '';
    if (ticks) {
      const ts = niceStep(tMax / 6), vs = niceStep((vMax - vMin) / 4);
      for (let t = 0; t <= tMax + 1e-9; t += ts) s += S.line(X(t), y0, X(t), y1, 'grid', 1) + S.text(X(t), (vMin < 0 ? Y(0) : y0) + 16, fmt(t), { fill: 'muted', size: 10 });
      for (let v = Math.ceil(vMin / vs) * vs; v <= vMax + 1e-9; v += vs) s += S.line(x0, Y(v), x1, Y(v), 'grid', 1) + S.text(x0 - 6, Y(v) + 4, fmt(v), { fill: 'muted', size: 10, anchor: 'end' });
    }
    const zero = vMin < 0 ? Y(0) : y0;
    s += S.line(x0, zero, x1, zero, 'grid2', 1.5) + S.line(x0, y0, x0, y1, 'grid2', 1.5);
    s += S.text(x1, zero + 30, tLabel, { fill: 'muted', size: 11, anchor: 'end' }) + S.text(x0, y1 - 9, vLabel, { fill: 'muted', size: 11, anchor: 'start' });
    return { X, Y, s, zero };
  }

  // A zigzag spring from (x1, y) to (x2, y).
  function spring(x1, y, x2, color = 'ink', coils = 12, amp = 9, w = 2) {
    const list = [[x1, y]];
    for (let i = 1; i < coils * 2; i++) list.push([x1 + ((x2 - x1) * i) / (coils * 2), y + (i % 2 ? -amp : amp)]);
    list.push([x2, y]);
    return S.path(pts(list), color, w);
  }

  // A vertical bar growing up from y0 (down if v < 0), with its name under and value over it.
  function bar(x, y0, v, sc, color, name, value, w = 36) {
    const hgt = Math.abs(v) * sc, top = v >= 0 ? y0 - hgt : y0;
    return S.rect(x - w / 2, top, w, hgt, `${color}-soft`, color, { 'stroke-width': 1.5, rx: 2 }) +
      (name ? S.text(x, y0 + 18, name, { fill: color, size: 11, weight: 600 }) : '') +
      (value != null ? S.text(x, v >= 0 ? top - 6 : top + hgt + 14, value, { fill: color, size: 11 }) : '');
  }

  // A thermometer: bulb at the bottom, column filled to frac (0–1).
  function thermometer(x, yTop, hgt, frac, color = 'c', text) {
    const f = Math.max(0, Math.min(1, frac));
    return S.rect(x - 6, yTop, 12, hgt, 'card', 'grid2', { rx: 6, 'stroke-width': 1.5 }) +
      S.rect(x - 3, yTop + hgt - (hgt - 6) * f, 6, (hgt - 6) * f + 4, color, null, { rx: 3 }) +
      S.circle(x, yTop + hgt + 8, 11, color, 'grid2', { 'stroke-width': 1.5 }) +
      (text ? S.text(x, yTop - 10, text, { fill: color, size: 12, weight: 600 }) : '');
  }

  // A flickering flame standing on y. size scales it; t makes it move.
  function flame(cx, y, t, size = 1, o = 1) {
    if (size <= 0) return '';
    const f = 1 + 0.12 * Math.sin(t * 23) + 0.06 * Math.sin(t * 37);
    const outer = [[cx - 13 * size, y], [cx - 9 * size, y - 18 * size], [cx + 1 * size * Math.sin(t * 9), y - 38 * size * f], [cx + 10 * size, y - 16 * size], [cx + 13 * size, y]];
    const inner = [[cx - 6 * size, y], [cx - 3 * size, y - 10 * size], [cx, y - 20 * size * f], [cx + 4 * size, y - 9 * size], [cx + 6 * size, y]];
    return S.fade(o, S.poly(outer, 'b', null, { opacity: 0.85 }) + S.poly(inner, 'c', null, { opacity: 0.9 }));
  }

  // A clipping region: wrap content in clip(inner) and include defs once.
  function clipBox(id, x, y, w, h) {
    return {
      defs: `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>`,
      clip: (inner) => `<g clip-path="url(#${id})">${inner}</g>`,
    };
  }

  // ---------- Circuits ----------

  // A wire through a list of corner points. at(s) gives the point at arc length s (wrapping around for loops).
  function wire(points, loop = false) {
    const list = loop ? [...points, points[0]] : points;
    const lens = [];
    let len = 0;
    for (let i = 1; i < list.length; i++) { const d = Math.hypot(list[i][0] - list[i - 1][0], list[i][1] - list[i - 1][1]); lens.push(d); len += d; }
    const at = (s) => {
      s = loop ? ((s % len) + len) % len : Math.max(0, Math.min(len, s));
      for (let i = 0; i < lens.length; i++) {
        if (s <= lens[i] || i === lens.length - 1) { const u = lens[i] ? s / lens[i] : 0; return [list[i][0] + (list[i + 1][0] - list[i][0]) * u, list[i][1] + (list[i + 1][1] - list[i][1]) * u]; }
        s -= lens[i];
      }
      return list[list.length - 1];
    };
    return { d: pts(list), len, at, svg: (color = 'ink', w = 2.5) => S.path(pts(list), color, w) };
  }
  // Charges as small dots along a wire, spaced `gap` apart and shifted by `shift` (pixels travelled).
  function charges(w, shift, color = 'a', gap = 26, r = 3.2) {
    let s = '';
    const n = Math.floor(w.len / gap);
    for (let i = 0; i < n; i++) { const [x, y] = w.at(i * gap + shift); s += S.circle(x, y, r, color); }
    return s;
  }
  // A resistor drawn between two points (horizontal or vertical), masking the wire behind it. glow (0–1) shows the heat it gives off.
  function resistor(x1, y1, x2, y2, color = 'ink', text, glow = 0) {
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy, py = ux;
    const n = 8, pad = L * 0.12, list = [[x1, y1], [x1 + ux * pad, y1 + uy * pad]];
    for (let i = 1; i < n; i++) { const d = pad + ((L - 2 * pad) * i) / n, a = i % 2 ? 8 : -8; list.push([x1 + ux * d + px * a, y1 + uy * d + py * a]); }
    list.push([x2 - ux * pad, y2 - uy * pad], [x2, y2]);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    return (glow > 0.02 ? S.circle(cx, cy, 14 + 16 * glow, 'b', null, { opacity: (0.06 + 0.22 * glow).toFixed(3) }) : '') +
      S.rect(Math.min(x1, x2) - (uy ? 12 : 0), Math.min(y1, y2) - (ux ? 12 : 0), Math.abs(x2 - x1) + (uy ? 24 : 0), Math.abs(y2 - y1) + (ux ? 24 : 0), 'card', null, { opacity: 0.85 }) +
      S.path(pts(list), color, 2.5) +
      (text ? S.text(cx + px * 26, cy + py * 26 + 4, text, { fill: color, size: 12, weight: 600 }) : '');
  }
  // A battery on a vertical wire at (x, y): long line is +, short is −.
  function battery(x, y, text, color = 'ink') {
    return S.rect(x - 22, y - 14, 44, 28, 'card', null) + S.line(x - 18, y - 6, x + 18, y - 6, color, 3) + S.line(x - 10, y + 6, x + 10, y + 6, color, 5) +
      S.text(x + 24, y - 6, '+', { fill: 'muted', size: 12, anchor: 'start' }) + (text ? S.text(x - 28, y + 5, text, { fill: color, size: 13, weight: 600, anchor: 'end' }) : '');
  }
  // A meter: a circle with its letter and a needle at frac (0–1) of full scale.
  function meter(cx, cy, letter, frac, color = 'ink', text) {
    const a = Math.PI * (1.15 - 0.9 * Math.max(0, Math.min(1.08, frac)));
    return S.circle(cx, cy, 22, 'card', color, { 'stroke-width': 2 }) + S.text(cx, cy + 14, letter, { fill: color, size: 12, weight: 600 }) +
      S.line(cx, cy + 4, cx + 15 * Math.cos(a), cy + 4 - 15 * Math.sin(a), 'c', 2) + S.circle(cx, cy + 4, 2.2, 'c') +
      (text ? S.text(cx, cy - 30, text, { fill: color, size: 12, weight: 600 }) : '');
  }

  // Wavelength (nm) to an approximate display colour.
  function spectral(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    const c = (v) => Math.round(255 * Math.max(0, Math.min(1, v)) ** 0.8);
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }

  MV.phys = { caption, label, pts, path, figure, wheels, cart, block, graph, spring, bar, thermometer, flame, clipBox, wire, charges, resistor, battery, meter, spectral, G: 9.8 };
})();
