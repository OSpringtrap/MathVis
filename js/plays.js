// "Show formula": every formula in every list, built on the display one piece at a time, then each variable
// swung back and forth so you can see what it does. This file holds the kit plus the operations and algebra
// plays; plays-shapes.js and plays-physics.js hold the rest. Plays are stored as MV.plays[topicId][formulaName].
(() => {
  'use strict';
  const { S, fmt, seg, lin, lerp, lerpPt, clamp01, dashed, drawOn, numberLine, plane, sfx, pitch, note, MINUS } = MV;

  const resolve = (x, q) => (typeof x === 'function' ? x(q) : x);
  const strip = (t) => t.replace(/<[^>]+>/g, '');

  // A play lists its pieces in the order they're built. Each piece has its text and where that text sits in
  // the formula ([[position, text]]), a caption, highlight keys and a drawing that grows with its progress u.
  // `vary` lists variables to swing afterwards: each gets a phase where it moves along a sine wave and back.
  function play(spec) {
    const pieces = spec.pieces, vary = spec.vary || [];
    const n = pieces.length, m = vary.length, W = n + 1.3 * m;
    const at = (w) => 0.04 + (0.92 * w) / W;
    const start = (i) => at(i), stop = (i) => at(i + 1);
    const vStart = (j) => at(n + 1.3 * j), vStop = (j) => at(n + 1.3 * (j + 1));
    const parts = [];
    pieces.forEach((pc, i) => { for (const [pos, text] of pc.parts || [[i, pc.text]]) parts.push({ pos, text, i, color: pc.color || 'ink' }); });
    parts.sort((x, y) => x.pos - y.pos);
    // `own` plays (the physics ones) use only their own example numbers, ignoring the topic's.
    const values = (p) => (spec.own ? { ...spec.values } : { ...(spec.values || {}), ...p });
    return {
      build: spec.build ?? Math.max(5, 2.5 * n + 3.4 * m + 1),
      preview: parts.map((x) => [x.pos, strip(x.text), x.i]),
      steps: (p) => {
        const q = values(p);
        return [
          { at: 0, hl: [], say: resolve(spec.intro, q) || 'Start from nothing.' },
          ...pieces.map((pc, i) => ({ at: start(i), hl: pc.hl || [], say: resolve(pc.say, q) })),
          ...vary.map((v, j) => ({ at: vStart(j), hl: [v.key], say: resolve(v.say, q) })),
        ];
      },
      sfx: () => [
        ...pieces.map((pc, i) => sfx.pop(start(i), note(2 * i + 4))),
        ...pieces.map((pc, i) => sfx.glide(start(i) + 0.005, start(i) + (stop(i) - start(i)) * 0.7, pitch(2 * i), pitch(2 * i + 5))),
        ...vary.map((v, j) => sfx.curve(vStart(j), vStop(j), Array.from({ length: 24 }, (_, s) => pitch(4 + 7 * Math.sin((2 * Math.PI * s) / 23))))),
        sfx.chime(0.97, note(2 * n + 4)),
      ],
      draw(p, h, { k }) {
        const defs = (!spec.own && this && this.params) || {};
        let q = values(p), live = '';
        for (let j = 0; j < m; j++) {
          if (k < vStart(j) || k > vStop(j)) continue;
          const v = vary[j], d = defs[v.key] || {};
          let x = q[v.key] + v.amp * Math.sin(2 * Math.PI * lin(k, vStart(j), vStop(j)));
          const lo = resolve(v.min, q) ?? d.min, hi = resolve(v.max, q) ?? d.max;
          if (lo != null) x = Math.max(lo, x);
          if (hi != null) x = Math.min(hi, x);
          q = { ...q, [v.key]: x };
          live = S.text(400, 76, `${v.label || v.key} = ${fmt(x)}`, { fill: v.color || d.color || 'c', size: 16, weight: 600 });
        }
        const u = (i) => seg(k, start(i), start(i) + (stop(i) - start(i)) * 0.8);
        const newest = k < vStart(0) || !m ? pieces.reduce((acc, _, i) => (k >= start(i) ? i : acc), -1) : -1;
        let s = '<text x="400" y="44" text-anchor="middle" class="m" font-size="30" font-style="italic">' +
          parts.map((x) => `<tspan style="fill:var(--${x.i === newest ? 'c' : x.color});opacity:${seg(k, start(x.i), start(x.i) + 0.03).toFixed(3)}" font-weight="${x.i === newest ? 600 : 400}">${x.text}</tspan>`).join('') +
          '</text>' + live;
        if (spec.backdrop) s += S.fade(seg(k, 0, 0.04), spec.backdrop(q));
        if (spec.scene) s += spec.scene(q, h, k, u, start, stop);
        else pieces.forEach((pc, i) => { if (pc.draw) s += pc.draw(q, u(i), u, k); });
        return s;
      },
    };
  }

  // ---------- Drawing helpers shared by all the play files ----------

  const label = (x, y, str, o = {}) => S.text(x, y, str, { size: 14, ...o });
  const shape = (P, pts, fill, stroke, extra = {}) => S.poly(pts.map(([x, y]) => P(x, y)), fill, stroke, { 'stroke-width': 2, ...extra });
  const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const remap = (k, pts) => {
    for (let i = 1; i < pts.length; i++) {
      const [a0, b0] = pts[i - 1], [a1, b1] = pts[i];
      if (k <= a1) return lerp(b0, b1, a1 > a0 ? (k - a0) / (a1 - a0) : 1);
    }
    return pts[pts.length - 1][1];
  };
  const topicDraw = (id) => (q, h, k) => { const t = MV.topics.find((x) => x.id === id); return t.draw(q, h, { k, t: 0 }); };
  const NL = (...v) => { const R = Math.max(10, ...v.map((x) => Math.abs(x) || 0)) + 1; return numberLine(-R, R, 240); };
  // Arrows laid tip to tail along a line, drawn one after another as u goes from 0 to 1.
  function route(X, y, from, steps, u) {
    let s = '', pos = from;
    steps.forEach(([len, col, lab], i) => {
      const ui = clamp01(u * steps.length - i);
      if (ui > 0) {
        s += S.arrow(X(pos), y, X(pos + len * ui), y, col, 4);
        if (ui >= 1 && lab) s += label(X(pos + len / 2), y - 14, lab, { fill: col, weight: 600 });
      }
      pos += len;
    });
    return s;
  }
  const brace = (x1, x2, y, text, color = 'ink') => S.line(x1, y, x2, y, color, 1.5) + S.line(x1, y - 6, x1, y + 6, color, 1.5) + S.line(x2, y - 6, x2, y + 6, color, 1.5) + label((x1 + x2) / 2, y + 22, text, { fill: color, weight: 600 });
  function cells(x0, y0, cols, rows, cell, fill, stroke, count = Infinity, opacity = 1) {
    let s = '', c = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (c++ >= count) return s;
      s += S.rect(x0 + i * cell + 2, y0 + j * cell + 2, cell - 4, cell - 4, fill, stroke, { rx: Math.min(4, cell / 6), 'stroke-width': 1.2, opacity });
    }
    return s;
  }
  const chip = (x, y, t, color, o = 1) => S.fade(o, S.rect(x - 20, y - 20, 40, 40, `${color}-soft`, color, { rx: 9, 'stroke-width': 1.5 }) + S.text(x, y + 6, t, { fill: color, size: 17, math: true, italic: true }));
  // An isometric box: front face w × h with its bottom-left corner at (x, y), and depth d.
  function iso(x, y, w, hgt, d, fill, stroke) {
    const dx = d * 0.62, dy = -d * 0.42;
    return S.poly([[x, y], [x + w, y], [x + w, y - hgt], [x, y - hgt]], fill, stroke, { 'stroke-width': 1.3 }) +
      S.poly([[x, y - hgt], [x + dx, y - hgt + dy], [x + w + dx, y - hgt + dy], [x + w, y - hgt]], fill, stroke, { 'stroke-width': 1.3, opacity: 0.9 }) +
      S.poly([[x + w, y], [x + w + dx, y + dy], [x + w + dx, y - hgt + dy], [x + w, y - hgt]], fill, stroke, { 'stroke-width': 1.3, opacity: 0.8 });
  }
  const pl = () => plane({ cx: 400, cy: 245, unit: 26, xr: 13, yr: 6.1 });

  MV.playKit = { play, label, shape, plus, remap, topicDraw, NL, route, brace, cells, chip, iso, pl };
  MV.plays = MV.plays || {};
  const reg = (id, map) => { MV.plays[id] = { ...(MV.plays[id] || {}), ...map }; };
  MV.playKit.reg = reg;

  // =====================================================================
  // Addition
  // =====================================================================

  reg('add', {
    Sum: play({
      intro: 'Start from an empty number line.',
      backdrop: ({ a, b }) => NL(a, b, a + b).svg,
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: an arrow from 0, ${fmt(Math.abs(a))} steps ${a >= 0 ? 'right' : 'left'}.`,
          draw: ({ a, b }, u) => { const { X } = NL(a, b, a + b); return S.arrow(X(0), 180, X(a * u), 180, 'a', 4) + S.fade(u, label(X(a / 2), 164, fmt(a), { fill: 'a', weight: 600 })); } },
        { text: ' + b', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b: start where a ended and go ${fmt(Math.abs(b))} more ${b >= 0 ? 'right' : 'left'}.`,
          draw: ({ a, b }, u) => { const { X } = NL(a, b, a + b); return S.line(X(a), 240, X(a), 110, 'grid2', 1, dashed('3 5')) + S.arrow(X(a), 120, X(a + b * u), 120, 'b', 4) + S.fade(u, label(X(a + b / 2), 104, fmt(b), { fill: 'b', weight: 600 })); } },
        { text: ' = c', hl: ['=', 'res'], say: ({ a, b }) => `= c: the whole trip, from 0 straight to ${fmt(a + b)}.`,
          draw: ({ a, b }, u) => { const { X } = NL(a, b, a + b); return S.arrow(X(0), 310, X((a + b) * u), 310, 'ink', 4.5) + S.fade(u, label(X((a + b) / 2), 342, `c = ${fmt(a + b)}`, { weight: 600, size: 16 }) + S.circle(X(a + b), 240, 7, 'ink')); } },
      ],
      vary: [
        { key: 'a', amp: 4, say: 'Vary a: the first arrow stretches, the second rides along on its tip, and the total moves the same amount.' },
        { key: 'b', amp: 4, say: 'Vary b: only the second step changes, and the total follows it.' },
      ],
    }),
    Commutative: play({
      intro: 'Two ways to make the same trip.',
      backdrop: ({ a, b }) => NL(a, b, a + b).svg,
      pieces: [
        { text: 'a + b', hl: ['a', 'b'], say: 'a + b: first a, then b (above the line).', draw: ({ a, b }, u) => route(NL(a, b, a + b).X, 140, 0, [[a, 'a', fmt(a)], [b, 'b', fmt(b)]], u) },
        { text: ' = ', say: 'Both trips end at the same point…', draw: ({ a, b }, u) => { const { X } = NL(a, b, a + b); return S.line(X(a + b), 140, X(a + b), 140 + 200 * u, 'c', 2, dashed('4 4')); } },
        { text: 'b + a', hl: ['b', 'a'], say: '…as b first, then a (below the line). Order doesn’t matter.', draw: ({ a, b }, u) => route(NL(a, b, a + b).X, 340, 0, [[b, 'b', fmt(b)], [a, 'a', fmt(a)]], u) },
      ],
      vary: [{ key: 'a', amp: 4, say: 'Vary a: the two routes change shape, but they always end at the same point.' }],
    }),
    Associative: play({
      intro: 'Three steps, a, b and c = 2, grouped two different ways.',
      values: { c: 2 },
      backdrop: ({ a, b, c }) => NL(a, b, c, a + b + c).svg,
      pieces: [
        { text: '(a + b)', hl: ['a', 'b'], say: '(a + b): add the first two together…', draw: ({ a, b, c }, u) => { const { X } = NL(a, b, c, a + b + c); return route(X, 150, 0, [[a, 'a'], [b, 'b']], u) + S.fade(u, brace(X(0), X(a + b), 96, 'a + b')); } },
        { text: ' + c', color: 'c', say: '…then add c.', draw: ({ a, b, c }, u) => route(NL(a, b, c, a + b + c).X, 150, a + b, [[c, 'c', 'c']], u) },
        { text: ' = a + (b + c)', say: 'Or add b and c first, then put a in front: the same place.', draw: ({ a, b, c }, u) => { const { X } = NL(a, b, c, a + b + c); return route(X, 320, 0, [[a, 'a'], [b, 'b'], [c, 'c']], u) + S.fade(u, brace(X(a), X(a + b + c), 352, 'b + c')); } },
      ],
      vary: [{ key: 'b', amp: 4, say: 'Vary b: however the steps are grouped, they land in the same place.' }],
    }),
    Identity: play({
      intro: 'What does adding nothing do?',
      backdrop: ({ a }) => NL(a).svg,
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: go to ${fmt(a)}.`, draw: ({ a }, u) => { const { X } = NL(a); return S.arrow(X(0), 180, X(a * u), 180, 'a', 4); } },
        { text: ' + 0', say: '+ 0: a step of length zero. You stay put.', draw: ({ a }, u) => { const { X } = NL(a); return S.circle(X(a), 180, 6 + 10 * Math.sin(Math.PI * u), null, 'c', { 'stroke-width': 2, opacity: 1 - u * 0.5 }); } },
        { text: ' = a', hl: ['res'], say: '= a: adding zero changes nothing. Zero is the identity for addition.', draw: ({ a }, u) => { const { X } = NL(a); return S.fade(u, S.circle(X(a), 240, 8, 'ink') + label(X(a), 280, `still ${fmt(a)}`, { weight: 600 })); } },
      ],
      vary: [{ key: 'a', amp: 5, say: 'Vary a: whatever a is, adding zero leaves it there.' }],
    }),
    Inverse: play({
      intro: 'A step, and then its opposite.',
      backdrop: ({ a }) => NL(a).svg,
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: go to ${fmt(a)}.`, draw: ({ a }, u) => { const { X } = NL(a); return S.arrow(X(0), 180, X(a * u), 180, 'a', 4); } },
        { text: ' + (−a)', color: 'c', say: '+ (−a): the same length, pointing the other way.', draw: ({ a }, u) => { const { X } = NL(a); return S.arrow(X(a), 130, X(a - a * u), 130, 'c', 4); } },
        { text: ' = 0', hl: ['res'], say: '= 0: back where you started. Every number has an opposite that cancels it.', draw: ({ a }, u) => { const { X } = NL(a); return S.fade(u, S.circle(X(0), 240, 9, 'ink') + label(X(0), 280, '0', { weight: 600, size: 16 })); } },
      ],
      vary: [{ key: 'a', amp: 5, say: 'Vary a: the out-and-back trip always ends at 0.' }],
    }),
    'Gauss’s sum': play({
      intro: 'Add 1 + 2 + 3 + … + 6 without adding them one by one.',
      values: { gn: 6 },
      scene: ({ gn }, h, k, u) => {
        const cell = 34, x0 = 400 - (gn * cell) / 2, base = 370;
        let s = '';
        for (let i = 1; i <= gn; i++) s += S.fade(clamp01(u(0) * gn - (i - 1)), cells(x0 + (i - 1) * cell, base - i * cell, 1, i, cell, 'a-soft', 'a'));
        const drop = (1 - u(1)) * 120;
        for (let i = 1; i <= gn; i++) s += S.fade(u(1), cells(x0 + (i - 1) * cell, base - (gn + 1) * cell - drop, 1, gn + 1 - i, cell, 'b-soft', 'b'));
        s += S.fade(u(1), label(x0 + gn * cell + 12, base - ((gn + 1) * cell) / 2, `${gn} × ${gn + 1} = ${gn * (gn + 1)}`, { anchor: 'start', weight: 600 }));
        s += S.fade(u(2), label(400, 404, `half of ${gn * (gn + 1)} = ${(gn * (gn + 1)) / 2} = 1 + 2 + … + ${gn}`, { size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { text: '1 + 2 + … + n', color: 'a', say: 'Stack the numbers as columns of blocks: a staircase.' },
        { text: ' = n(n + 1)', color: 'b', say: 'Turn a copy of the staircase upside down and drop it on top: together they make an n by n + 1 rectangle.' },
        { text: '/2', say: 'The staircase is exactly half of that rectangle.' },
      ],
    }),
  });

  // =====================================================================
  // Subtraction
  // =====================================================================

  reg('subtract', {
    Definition: play({
      intro: 'Two ways to describe the same move.',
      backdrop: ({ a, b }) => NL(a, b, a - b).svg,
      pieces: [
        { text: 'a − b', hl: ['a', MINUS, 'b'], say: ({ b }) => `a − b: go to a, then take ${fmt(b)} away: step back.`, draw: ({ a, b }, u) => route(NL(a, b, a - b).X, 150, 0, [[a, 'a', fmt(a)], [-b, 'b', `−${fmt(b)}`]], u) },
        { text: ' = a + (−b)', say: '= a + (−b): or go to a and add the opposite of b, an arrow pointing back. The same move.', draw: ({ a, b }, u) => route(NL(a, b, a - b).X, 330, 0, [[a, 'a', fmt(a)], [-b, 'c', `+(${fmt(-b)})`]], u) },
      ],
      vary: [{ key: 'b', amp: 4, say: 'Vary b: taking away b and adding −b always match.' }],
    }),
    'Inverse of addition': play({
      intro: 'Take something away, then put it back.',
      backdrop: ({ a, b }) => NL(a, b, a - b).svg,
      pieces: [
        { text: '(a − b)', hl: ['a', 'b'], say: '(a − b): go to a, then step back b.', draw: ({ a, b }, u) => route(NL(a, b, a - b).X, 150, 0, [[a, 'a'], [-b, 'b']], u) },
        { text: ' + b', color: 'b', say: '+ b: now step forward b again…', draw: ({ a, b }, u) => route(NL(a, b, a - b).X, 100, a - b, [[b, 'c', `+${fmt(b)}`]], u) },
        { text: ' = a', hl: ['a'], say: '= a: …and you’re back at a. Adding b undoes subtracting b.', draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b); return S.fade(u, S.circle(X(a), 240, 8, 'a') + label(X(a), 280, `back to ${fmt(a)}`, { fill: 'a', weight: 600 })); } },
      ],
      vary: [{ key: 'b', amp: 4, say: 'Vary b: whatever you take away, adding it back returns you to a.' }],
    }),
    'Order matters': play({
      intro: 'Swap the two numbers in a subtraction.',
      backdrop: ({ a, b }) => NL(a, b, a - b, b - a).svg,
      pieces: [
        { text: 'b − a', hl: ['b', 'a'], say: ({ a, b }) => `b − a = ${fmt(b - a)}.`, draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b, b - a); return S.arrow(X(0), 160, X((b - a) * u), 160, 'b', 4) + S.fade(u, label(X((b - a) / 2), 144, `b − a = ${fmt(b - a)}`, { fill: 'b', weight: 600 })); } },
        { text: ' = −(a − b)', say: ({ a, b }) => `a − b = ${fmt(a - b)}: the same size, pointing the other way. Subtraction isn’t commutative.`, draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b, b - a); return S.arrow(X(0), 320, X((a - b) * u), 320, 'a', 4) + S.fade(u, label(X((a - b) / 2), 350, `a − b = ${fmt(a - b)}`, { fill: 'a', weight: 600 })); } },
      ],
      vary: [{ key: 'a', amp: 5, say: 'Vary a: the two arrows are always mirror images of each other.' }],
    }),
    Distance: play({
      intro: 'How far apart are two numbers?',
      backdrop: ({ a, b }) => NL(a, b).svg,
      pieces: [
        { parts: [[1, 'a − b']], hl: ['a', 'b'], say: 'a − b: an arrow from b to a. It can point either way.', draw: ({ a, b }, u) => { const { X } = NL(a, b); return S.circle(X(a), 240, 7, 'a') + S.circle(X(b), 240, 7, 'b') + S.arrow(X(b), 170, X(b + (a - b) * u), 170, 'ink', 4); } },
        { parts: [[0, 'd = |'], [2, '|']], hl: ['res'], say: ({ a, b }) => `| |: the absolute value keeps the size and drops the direction: they are ${fmt(Math.abs(a - b))} apart.`, draw: ({ a, b }, u) => { const { X } = NL(a, b); return S.fade(u, brace(Math.min(X(a), X(b)), Math.max(X(a), X(b)), 300, `d = ${fmt(Math.abs(a - b))}`)); } },
      ],
      vary: [{ key: 'a', amp: 6, say: 'Vary a: as it passes b the arrow flips, but the distance never goes negative.' }],
    }),
    Change: play({
      intro: 'Something starts at x₁ and ends at x₂.',
      backdrop: ({ a, b }) => NL(a, b, a - b).svg,
      pieces: [
        { parts: [[2, ' − x₁']], color: 'b', hl: ['b'], say: ({ b }) => `x₁: the start, ${fmt(b)}.`, draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b); return S.fade(u, S.circle(X(b), 240, 8, 'b') + label(X(b), 214, 'start', { fill: 'b' })); } },
        { parts: [[1, 'x₂']], color: 'a', hl: ['a'], say: ({ a }) => `x₂: the end, ${fmt(a)}.`, draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b); return S.fade(u, S.circle(X(a), 240, 8, 'a') + label(X(a), 214, 'end', { fill: 'a' })); } },
        { parts: [[0, 'Δx = ']], hl: ['res'], say: ({ a, b }) => `Δx: end minus start = ${fmt(a - b)}. ${a - b > 0 ? 'Positive: it went up.' : a - b < 0 ? 'Negative: it went down.' : 'Zero: no change.'}`, draw: ({ a, b }, u) => { const { X } = NL(a, b, a - b); return S.arrow(X(b), 310, X(b + (a - b) * u), 310, 'ink', 4.5) + S.fade(u, label(X((a + b) / 2), 342, `Δx = ${fmt(a - b)}`, { weight: 600, size: 16 })); } },
      ],
      vary: [{ key: 'a', amp: 6, label: 'x₂', say: 'Vary the end: the change grows, shrinks and turns negative when the end drops below the start.' }],
    }),
  });

  // =====================================================================
  // Multiplication
  // =====================================================================

  const gridAt = (a, b, maxW = 560, maxH = 260) => { const cell = Math.min(38, maxW / Math.max(a, 1), maxH / Math.max(b, 1)); return { cell, x0: 400 - (a * cell) / 2, y0: 100 }; };
  reg('multiply', {
    Product: play({
      intro: 'Start from an empty table.',
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: one row of ${fmt(a)} squares.`, draw: ({ a, b }, u) => { const G = gridAt(a, b); return cells(G.x0, G.y0, a, 1, G.cell, 'a-soft', 'a', Math.ceil(u * a - 1e-9)); } },
        { text: ' × b', color: 'b', hl: ['×', 'b'], say: ({ b }) => `× b: copy the row until there are ${fmt(b)} rows.`,
          draw: ({ a, b }, u) => { const G = gridAt(a, b); let s = ''; const rows = u * (b - 1); for (let j = 1; j < b; j++) { const r = clamp01(rows - (j - 1)); if (r > 0) s += cells(G.x0, G.y0 + lerp(j - 1, j, MV.ease(r)) * G.cell, a, 1, G.cell, 'b-soft', 'b', Infinity, r); } return b === 0 ? S.fade(u, label(400, 220, 'Zero rows: nothing at all.', { fill: 'muted', size: 16 })) : s; } },
        { text: ' = ab', hl: ['=', 'res'], say: ({ a, b }) => `= ab: count every square: ${fmt(a * b)}.`, draw: ({ a, b }, u) => { const G = gridAt(a, b); return S.fade(u, label(400, G.y0 + Math.max(1, b) * G.cell + 40, `${fmt(b)} rows of ${fmt(a)} = ${fmt(a * b)}`, { size: 18, weight: 600 })); } },
      ],
    }),
    Commutative: play({
      intro: 'A grid of squares, a wide and b tall.',
      scene: ({ a, b }, h, k, u) => {
        const cell = Math.min(30, 300 / Math.max(a, b, 1)), cx = 400, cy = 230;
        const g = cells(cx - (a * cell) / 2, cy - (b * cell) / 2, a, b, cell, 'a-soft', 'a', Math.ceil(u(0) * a * b - 1e-9));
        return `<g transform="rotate(${90 * u(1)} ${cx} ${cy})">${g}</g>` + S.fade(u(2), label(cx, 405, `${fmt(a)} × ${fmt(b)} = ${fmt(b)} × ${fmt(a)} = ${fmt(a * b)}`, { size: 17, weight: 600 }));
      },
      pieces: [
        { text: 'ab', hl: ['a', 'b'], say: ({ a, b }) => `ab: ${fmt(b)} rows of ${fmt(a)}.` },
        { text: ' = ', say: 'Turn the whole grid a quarter turn…' },
        { text: 'ba', hl: ['res'], say: ({ a, b }) => `…now it’s ${fmt(a)} rows of ${fmt(b)}: the very same squares.` },
      ],
    }),
    Associative: play({
      intro: 'Three factors, a, b and c = 2.',
      values: { c: 2 },
      scene: ({ a, b, c }, h, k, u) => {
        const cell = Math.min(24, 260 / Math.max(b * c, 1), 400 / Math.max(a, 1)), x0 = 400 - (a * cell) / 2, y0 = 90;
        let s = cells(x0, y0, a, b, cell, 'a-soft', 'a', Math.ceil(u(0) * a * b - 1e-9));
        for (let r = 1; r < c; r++) s += S.fade(u(1), cells(x0, y0 + r * b * cell + (1 - u(1)) * 40, a, b, cell, 'b-soft', 'b'));
        s += S.fade(u(2), S.rect(x0, y0, a * cell, b * c * cell, null, 'ink', { 'stroke-width': 2.5 }) + label(x0 - 12, y0 + (b * c * cell) / 2, `b × c = ${fmt(b * c)}`, { anchor: 'end', weight: 600 }) + label(400, y0 + b * c * cell + 30, `${fmt(a)} × ${fmt(b * c)} = ${fmt(a * b * c)}`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { text: '(ab)', hl: ['a', 'b'], say: '(ab): a grid of a by b.' },
        { text: 'c', color: 'c', say: 'c: make c copies of that grid and stack them.' },
        { text: ' = a(bc)', hl: ['res'], say: 'Read the stack the other way: a columns, each b × c tall. Same squares, grouped differently.' },
      ],
    }),
    Distributive: play({
      intro: 'A rectangle a tall, with a width of b + c (c = 3).',
      values: { c: 3 },
      scene: ({ a, b, c }, h, k, u) => {
        const cell = Math.min(30, 560 / Math.max(b + c, 1), 240 / Math.max(a, 1)), x0 = 400 - ((b + c) * cell) / 2, y0 = 110;
        let s = S.rect(x0, y0, (b + c) * cell * u(0), a * cell, 'ink-soft', 'ink', { 'stroke-width': 2 });
        s += S.fade(u(0), label(x0 - 12, y0 + (a * cell) / 2, fmt(a), { anchor: 'end', weight: 600 }));
        s += S.fade(u(1), S.rect(x0, y0, b * cell, a * cell, 'b-soft', 'b', { 'stroke-width': 2 }) + label(x0 + (b * cell) / 2, y0 + (a * cell) / 2 + 5, `ab = ${fmt(a * b)}`, { fill: 'b', weight: 600 }));
        s += S.fade(u(2), S.rect(x0 + b * cell, y0, c * cell, a * cell, 'c-soft', 'c', { 'stroke-width': 2 }) + label(x0 + (b + c / 2) * cell, y0 + (a * cell) / 2 + 5, `ac = ${fmt(a * c)}`, { fill: 'c', weight: 600 }) +
          label(400, y0 + a * cell + 36, `${fmt(a)} × ${fmt(b + c)} = ${fmt(a * b)} + ${fmt(a * c)}`, { size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { text: 'a(b + c)', hl: ['a', 'b'], say: 'a(b + c): one rectangle, a by (b + c).' },
        { text: ' = ab', color: 'b', say: 'Split it at b: the left part is a × b…' },
        { text: ' + ac', color: 'c', say: '…and the right part is a × c. The two areas add up to the whole.' },
      ],
    }),
    'Identity and zero': play({
      intro: 'Multiplying by 1, and by 0.',
      scene: ({ a }, h, k, u) => {
        const cell = Math.min(40, 560 / Math.max(a, 1)), x0 = 400 - (a * cell) / 2;
        let s = cells(x0, 130, a, 1, cell, 'a-soft', 'a', Math.ceil(u(0) * a - 1e-9)) + S.fade(u(0), label(400, 120, `a = ${fmt(a)}`, { fill: 'a' }));
        s += S.fade(u(1), label(400, 210, `× 1: one row of ${fmt(a)} = ${fmt(a)}`, { weight: 600, size: 16 }));
        const hh = cell * (1 - u(2));
        s += S.fade(u(2), Array.from({ length: a }, (_, i) => S.rect(x0 + i * cell + 2, 260 + (cell - hh), cell - 4, Math.max(0, hh - 4), 'c-soft', 'c', { rx: 3 })).join('') + label(400, 330, '× 0: no rows at all = 0', { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: 'a: a row of a squares.' },
        { text: ' × 1 = a', say: '× 1: take the row once. Nothing changes.' },
        { text: ',  a × 0 = 0', say: '× 0: take the row zero times. Everything disappears.' },
      ],
    }),
    Signs: play({
      intro: 'Why is a negative times a negative positive? Take a = 3 and b = 2.',
      values: { sa: 3, sb: 2 },
      backdrop: () => numberLine(-8, 8, 240).svg,
      scene: ({ sa, sb }, h, k, u) => {
        const { X } = numberLine(-8, 8, 240);
        let s = S.fade(u(0), S.arrow(X(0), 180, X(-sb * u(0)), 180, 'b', 4) + label(X(-sb / 2), 164, '−b', { fill: 'b', weight: 600 }));
        if (u(1) > 0) { const tip = -sb * lerp(1, sa, u(1)); s += S.arrow(X(0), 130, X(tip), 130, 'a', 4) + label(X(tip / 2), 114, `× ${sa}: stretched`, { fill: 'a', weight: 600 }); }
        if (u(2) > 0) s += `<g transform="rotate(${180 * u(2)} ${X(0)} 320)">${S.arrow(X(0), 320, X(-sb * sa), 320, 'c', 4)}</g>` + S.fade(u(2), label(X(0), 370, `× (−1): flipped round to +${sa * sb}`, { fill: 'c', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, '(−b)']], color: 'b', say: '(−b): an arrow of length b pointing left.' },
        { parts: [[0, '(−a)']], color: 'a', say: 'Multiplying by −a means: stretch by a…' },
        { parts: [[2, ' = ab']], color: 'c', say: '…and flip to the other side (× −1). Two flips, one in −b and one in −a, point it right again: positive.' },
      ],
    }),
  });

  // =====================================================================
  // Division
  // =====================================================================

  function dealPieces(extraLast) {
    return [
      { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: a pile of ${fmt(a)}.`,
        draw: ({ a, b }, u, U) => {
          let s = '';
          const q = b ? Math.floor(a / b) : 0, moved = U(1);
          for (let i = 0; i < Math.ceil(u * a - 1e-9); i++) {
            const pile = [400 - 9 * 16 + (i % 18) * 16 + 8, 100 + Math.floor(i / 18) * 16];
            const box = i % Math.max(1, b), slot = Math.floor(i / Math.max(1, b));
            const colW = 640 / Math.max(1, b), bx = 80 + box * colW + colW / 2;
            const target = [bx - 16 + (slot % 3) * 16, 238 + Math.floor(slot / 3) * 16];
            const go = b && i < q * b ? clamp01(moved * q * b - i * 0.6) : 0;
            s += S.circle(...lerpPt(pile, target, MV.ease(go)), 6, 'a');
          }
          return s;
        } },
      { text: ' ÷ b', color: 'b', hl: ['÷', 'b'], say: ({ a, b }) => (b ? `÷ b: deal them out into ${fmt(b)} equal groups.${a % b ? ` ${fmt(a % b)} can’t be shared and stay behind.` : ''}` : '÷ 0: there are no groups to deal into.'),
        draw: ({ b }, u) => { if (!b) return S.fade(u, label(400, 260, 'No groups: dividing by zero has no answer.', { fill: 'muted', size: 16 })); let s = ''; const colW = 640 / b; for (let i = 0; i < b; i++) s += S.fade(Math.min(1, u * 3), S.rect(80 + i * colW + 4, 222, colW - 8, 120, null, 'b', { rx: 8, 'stroke-width': 1.5 })); return s; } },
      { text: ' = q', hl: ['=', 'res'], say: ({ a, b }) => (b ? `= q: each group gets ${fmt(a / b)}.` : '= no answer.'),
        draw: ({ a, b }, u) => { if (!b) return ''; let s = ''; const colW = 640 / b; for (let i = 0; i < b; i++) s += S.fade(u, label(80 + i * colW + colW / 2, 366, fmt(Math.floor(a / b)), { weight: 600 })); return s; } },
      ...(extraLast ? [extraLast] : []),
    ];
  }
  reg('divide', {
    Definition: play({
      intro: 'Start with nothing to share.',
      pieces: dealPieces({ text: ' ⇔ q × b = a', say: ({ a, b }) => (b ? `⇔ q × b = a: put the groups back together and you have ${fmt(Math.floor(a / b))} × ${fmt(b)}${a % b ? ` (plus the ${fmt(a % b)} left over)` : ''} = ${fmt(a)} again. Dividing undoes multiplying.` : 'No q makes q × 0 = a.'),
        draw: ({ a, b }, u) => (b ? S.fade(u, label(400, 404, `${fmt(Math.floor(a / b))} × ${fmt(b)}${a % b ? ` + ${fmt(a % b)}` : ''} = ${fmt(a)}`, { size: 17, weight: 600 })) : '') }),
    }),
    'With remainder': play({
      intro: 'A bar a units long.',
      scene: ({ a, b }, h, k, u) => {
        const unit = Math.min(30, 640 / Math.max(a, 1)), x0 = 400 - (a * unit) / 2, y = 150;
        let s = S.rect(x0, y, a * unit * u(0), 40, 'a-soft', 'a', { rx: 4, 'stroke-width': 1.5 }) + S.fade(u(0), label(400, y - 12, `a = ${fmt(a)}`, { fill: 'a', weight: 600 }));
        if (!b) return s + S.fade(u(1), label(400, 300, 'Groups of 0 never use anything up: no answer.', { fill: 'muted', size: 16 }));
        const q = Math.floor(a / b), r = a - q * b;
        for (let g = 0; g < Math.ceil(u(1) * q - 1e-9); g++) s += S.rect(x0 + g * b * unit + 2, y + 50, b * unit - 4, 40, 'b-soft', 'b', { rx: 4, 'stroke-width': 1.5 });
        s += S.fade(u(1), label(400, y + 120, `${fmt(q)} groups of ${fmt(b)}`, { fill: 'b', weight: 600 }));
        if (r) s += S.fade(u(2), S.rect(x0 + q * b * unit + 2, y + 50, r * unit - 4, 40, 'c-soft', 'c', { rx: 4, ...dashed('4 3') }));
        s += S.fade(u(2), label(400, y + 150, `${fmt(a)} = ${fmt(b)} × ${fmt(q)} + ${fmt(r)}`, { size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: 'a: the whole amount.' },
        { text: ' = bq', color: 'b', hl: ['b'], say: 'bq: cut off as many whole groups of b as fit. That’s q of them.' },
        { text: ' + r', color: 'c', say: 'r: what’s left, always less than b. The remainder.' },
      ],
    }),
    Reciprocal: play({
      intro: 'One whole, split into b equal pieces.',
      scene: ({ a, b }, h, k, u) => {
        if (!b) return S.fade(u(0), label(400, 220, 'A whole split into 0 pieces makes no sense: 0 has no reciprocal.', { fill: 'muted', size: 16 }));
        const U = Math.min(220, 640 / Math.max(1, a / b)), x0 = 80;
        let s = S.rect(x0, 110, U, 36, 'ink-soft', 'ink', { rx: 3 }) + label(x0 + U / 2, 100, '1 whole', { fill: 'muted' });
        for (let i = 1; i < b; i++) s += S.fade(u(0), S.line(x0 + (i * U) / b, 110, x0 + (i * U) / b, 146, 'b', 1.5));
        s += S.fade(u(0), S.rect(x0, 110, U / b, 36, 'b', null, { rx: 3, opacity: 0.7 }) + label(x0 + U / b / 2, 166, '1/b', { fill: 'b', weight: 600 }));
        for (let i = 0; i < Math.ceil(u(1) * a - 1e-9); i++) s += S.rect(x0 + (i * U) / b, 230, U / b - 1, 36, 'a-soft', 'a', { rx: 2 });
        s += S.fade(u(1), label(x0, 300, `${fmt(a)} copies of 1/${fmt(b)}`, { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), brace(x0, x0 + (a * U) / b, 330, `= ${fmt(a / b)} wholes = ${fmt(a)} ÷ ${fmt(b)}`));
        return s;
      },
      pieces: [
        { parts: [[3, '(1/b)']], color: 'b', hl: ['b'], say: '1/b: one of b equal pieces of a whole.' },
        { parts: [[2, 'a × ']], color: 'a', hl: ['a'], say: 'a ×: lay a of those pieces end to end.' },
        { parts: [[0, 'a ÷ b'], [1, ' = ']], hl: ['res'], say: 'That’s a ÷ b: dividing by b is the same as multiplying by one b-th.' },
      ],
    }),
    Fractions: play({
      intro: 'How many halves fit in three quarters? (3/4 ÷ 1/2)',
      scene: (q, h, k, u) => {
        const U = 480, x0 = 160;
        let s = S.rect(x0, 120, U, 30, null, 'grid2', { rx: 3 }) + label(x0 - 10, 140, '1', { anchor: 'end', fill: 'muted' });
        s += S.rect(x0, 120, U * 0.75 * u(0), 30, 'a', null, { rx: 3, opacity: 0.75 }) + S.fade(u(0), label(x0 + U * 0.375, 110, '3/4', { fill: 'a', weight: 600 }));
        s += S.fade(u(1), S.rect(x0, 200, U * 0.5 - 2, 30, 'b-soft', 'b', { rx: 3 }) + S.rect(x0 + U * 0.5, 200, U * 0.25 * u(1), 30, 'b-soft', 'b', { rx: 3, ...dashed('4 3') }) + label(x0 + U * 0.25, 252, '1/2', { fill: 'b' }) + label(x0 + U * 0.625, 252, 'half of 1/2', { fill: 'b' }));
        s += S.fade(u(2), label(400, 320, '3/4 ÷ 1/2 = (3 × 2)/(4 × 1) = 6/4 = 1.5', { size: 18, weight: 600 }));
        return s;
      },
      pieces: [
        { text: '(a/b)', color: 'a', say: 'a/b = 3/4: three quarters of a bar.' },
        { text: ' ÷ (c/d)', color: 'b', say: '÷ c/d = 1/2: how many halves fit in it? One whole half, and half of another.' },
        { text: ' = ad/bc', say: 'Flipping the second fraction and multiplying gets the same 1.5 without the picture.' },
      ],
    }),
    Zero: play({
      intro: 'Try to divide a by 0: which number q gives q × 0 = a?',
      scene: ({ a }, h, k, u) => {
        const { X, svg } = numberLine(0, 40, 260);
        let s = svg + S.fade(u(0), S.circle(X(a), 260, 8, 'a') + label(X(a), 234, `a = ${fmt(a)}`, { fill: 'a', weight: 600 }));
        const tries = [1, 5, 50, 1000, 1e6];
        for (let i = 0; i < Math.ceil(u(1) * tries.length - 1e-9); i++) s += label(160 + i * 130, 140, `${MV.compact(tries[i])} × 0 = 0`, { fill: 'b', weight: 600 });
        s += S.fade(u(1), S.circle(X(0), 260, 8, 'b'));
        s += S.fade(u(2), label(400, 340, a ? 'No q ever reaches a: there is no answer.' : 'With a = 0, every q works: there is no single answer.', { size: 16, weight: 600 }));
        return s;
      },
      pieces: [
        { text: 'a', color: 'a', hl: ['a'], say: 'a: the number we want to reach.' },
        { text: ' ÷ 0', color: 'b', hl: ['b'], say: '÷ 0: whatever q you try, q × 0 is still 0.' },
        { text: ' = undefined', say: 'So a ÷ 0 can’t be given any value: it is undefined.' },
      ],
    }),
  });

  // =====================================================================
  // Powers
  // =====================================================================

  const chipRow = (xs, y, items, u) => items.map(([t, col], i) => chip(xs + i * 50, y, t, col, clamp01(u * items.length - i))).join('');
  const powBars = ({ base, n }) => {
    const vals = Array.from({ length: n + 1 }, (_, j) => base ** j), max = Math.max(...vals);
    const slot = 640 / (n + 1), bw = Math.min(50, slot * 0.6);
    return (j, grow, fill, stroke) => { const hgt = Math.max(1.5, (vals[j] / max) * 250) * grow, x = 80 + slot * j + slot / 2; return S.rect(x - bw / 2, 370 - hgt, bw, hgt, fill, stroke, { rx: 3, 'stroke-width': 1.5 }) + (grow >= 1 ? label(x, 362 - hgt, MV.compact(vals[j]), { size: 12, fill: 'muted' }) : ''); };
  };
  reg('power', {
    Definition: play({
      intro: 'Start from 1: nothing multiplied yet.',
      backdrop: () => S.line(60, 370, 740, 370, 'grid2', 1.5),
      pieces: [
        { text: 'b', color: 'a', hl: ['base'], say: ({ base }) => `b: start from 1, then multiply by ${fmt(base)} once.`, draw: (q, u) => { const B = powBars(q); return B(0, Math.min(1, u * 2), 'ink-soft', 'ink') + (q.n >= 1 ? B(1, Math.max(0, u * 2 - 1), 'a-soft', 'a') : ''); } },
        { text: 'ⁿ', color: 'b', hl: ['n'], say: ({ n }) => (n > 1 ? `ⁿ: keep multiplying until there are ${fmt(n)} copies of b.` : n === 1 ? 'ⁿ: one copy is all there is.' : 'ⁿ: zero copies: the answer stays 1.'), draw: (q, u) => { const B = powBars(q); let s = ''; for (let j = 2; j <= q.n; j++) s += B(j, clamp01(u * (q.n - 1) - (j - 2)), 'a-soft', 'a'); return s; } },
        { text: ' = b × b × … × b', hl: ['=', 'res'], say: ({ base, n }) => `= ${fmt(base)}<sup>${n}</sup> = ${fmt(base ** n)}.`, draw: (q, u) => S.fade(u, powBars(q)(q.n, 1, 'ink', null)) },
      ],
      vary: [{ key: 'base', amp: 1.5, min: 0.5, say: 'Vary b: a bigger base makes every step up steeper; a base below 1 makes the bars shrink instead.' }],
    }),
    'Product rule': play({
      intro: 'Count the factors: m = 2 of them, then n = 3 more.',
      pieces: [
        { text: 'bᵐ', color: 'a', say: 'bᵐ: two b’s multiplied.', draw: (q, u, U) => chipRow(150, lerp(150, 260, U(2)), [['b', 'a'], ['b', 'a']], u) },
        { text: ' · bⁿ', color: 'b', say: '· bⁿ: times three more b’s.', draw: (q, u, U) => chipRow(lerp(450, 250, U(2)), lerp(150, 260, U(2)), [['b', 'b'], ['b', 'b'], ['b', 'b']], u) },
        { text: ' = bᵐ⁺ⁿ', say: '= bᵐ⁺ⁿ: slide them together: one row of 2 + 3 = 5 b’s.', draw: (q, u) => S.fade(u, label(400, 340, 'b × b × b × b × b = b⁵', { size: 18, weight: 600 })) },
      ],
    }),
    'Power of a power': play({
      intro: 'A group of m = 2 b’s, taken n = 3 times.',
      pieces: [
        { text: '(bᵐ)', color: 'a', say: '(bᵐ): one group of two b’s.', draw: (q, u) => chipRow(130, 150, [['b', 'a'], ['b', 'a']], u) + S.fade(u, S.rect(100, 120, 110, 60, null, 'a', { rx: 12, ...dashed('4 4') })) },
        { text: 'ⁿ', color: 'b', say: 'ⁿ: three copies of that group.', draw: (q, u) => [1, 2].map((g) => S.fade(clamp01(u * 2 - (g - 1)), chipRow(130 + g * 150, 150, [['b', 'a'], ['b', 'a']], 1) + S.rect(100 + g * 150, 120, 110, 60, null, 'a', { rx: 12, ...dashed('4 4') }))).join('') },
        { text: ' = bᵐⁿ', say: '= bᵐⁿ: 3 groups of 2 is 6 b’s altogether.', draw: (q, u) => S.fade(u, label(330, 260, '(b²)³ = b⁶', { size: 22, weight: 600 })) },
      ],
    }),
    'Power of a product': play({
      intro: 'Take the pair ab, n = 3 times.',
      pieces: [
        { text: '(ab)ⁿ', say: '(ab)ⁿ: three pairs, ab ab ab.', draw: (q, u, U) => { const t = U(1); return [0, 1, 2].map((g) => S.fade(clamp01(u * 3 - g), chip(lerp(150 + g * 120, 200 + g * 50, t), lerp(160, 140, t), 'a', 'a') + chip(lerp(200 + g * 120, 400 + g * 50, t), lerp(160, 140, t), 'b', 'b'))).join(''); } },
        { text: ' = aⁿbⁿ', say: '= aⁿbⁿ: order doesn’t matter in multiplication, so gather the a’s and the b’s.', draw: (q, u) => S.fade(u, label(400, 260, 'a × a × a × b × b × b = a³b³', { size: 18, weight: 600 })) },
      ],
    }),
    'Zero and negative': play({
      intro: 'Walk down the powers, dividing by b each step.',
      scene: ({ base }, h, k, u) => {
        const sup = ['³', '²', '¹', '⁰', '⁻¹', '⁻²'];
        return [3, 2, 1, 0, -1, -2].map((e, i) => {
          const o = i < 3 ? clamp01(u(0) * 3 - i) : i === 3 ? u(1) : clamp01(u(2) * 2 - (i - 4));
          return S.fade(o, label(150 + i * 105, 130 + i * 40, `b${sup[i]} = ${fmt(base ** e, 3)}`, { size: 17, weight: e === 0 ? 600 : 400, fill: e < 0 ? 'c' : e === 0 ? 'ink' : 'a' }) +
            (i ? S.text(100 + i * 105, 112 + i * 40, `÷ ${fmt(base)}`, { fill: 'muted', size: 12 }) : ''));
        }).join('');
      },
      pieces: [
        { text: 'b³, b², b¹', color: 'a', hl: ['base'], say: 'Each step down the powers divides by b.' },
        { text: ',  b⁰ = 1', say: 'One more step: b¹ ÷ b = 1. So b⁰ = 1.' },
        { text: ',  b⁻ⁿ = 1/bⁿ', color: 'c', say: 'Keep going: 1/b, then 1/b². Negative powers are divisions.' },
      ],
      vary: [{ key: 'base', amp: 1.5, min: 0.5, say: 'Vary b: every row changes, but b⁰ stays exactly 1.' }],
    }),
    Roots: play({
      intro: 'A square whose area is b.',
      scene: ({ base }, h, k, u) => {
        const side = Math.sqrt(base) * 60 * u(0);
        let s = S.rect(400 - side / 2, 300 - side, side, side, 'a-soft', 'a', { 'stroke-width': 2 }) + S.fade(u(0), label(400, 300 - side / 2 + 5, `area ${fmt(base)}`, { fill: 'a', weight: 600 }));
        s += S.fade(u(1), S.line(400 - side / 2, 316, 400 + side / 2, 316, 'c', 4) + label(400, 342, `side = √${fmt(base)} = ${fmt(Math.sqrt(base))}`, { fill: 'c', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'b']], color: 'a', hl: ['base'], say: 'b: think of it as the area of a square.' },
        { parts: [[1, '^½ = √b']], color: 'c', say: 'The side is the number which, squared, gives b: the square root, b to the power ½.' },
      ],
      vary: [{ key: 'base', amp: 2, min: 0.5, say: 'Vary b: four times the area only doubles the side.' }],
    }),
    Logarithm: play({
      intro: 'How many times must you multiply by b to reach x?',
      scene: ({ base, n }, h, k, u) => {
        const steps = Math.min(n, 8);
        let s = chip(80, 160, '1', 'ink');
        for (let i = 1; i <= steps; i++) s += S.fade(clamp01(u(0) * steps - (i - 1)), chip(80 + i * 76, 160, '×b', 'a') + label(80 + i * 76, 210, MV.compact(base ** i), { fill: 'muted', size: 12 }));
        s += S.fade(u(1), label(400, 290, `${fmt(base)} multiplied ${fmt(n)} times = ${MV.compact(base ** n)}`, { size: 17, weight: 600 }) + label(400, 330, `log base ${fmt(base)} of ${MV.compact(base ** n)} = ${fmt(n)}`, { size: 17, fill: 'c', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'bⁿ = x']], color: 'a', hl: ['base', 'n'], say: 'bⁿ = x: start at 1 and keep multiplying by b.' },
        { parts: [[0, 'log x = n'], [1, ' ⇔ ']], color: 'c', say: 'logᵦ x = n: the logarithm is simply the count of multiplications.' },
      ],
    }),
  });

  // =====================================================================
  // Straight lines
  // =====================================================================

  // The line is built up from y alone, to y = x, to y = mx, to y = mx + b, and a point rides on it at x.
  const lineScene = ({ m, b, x }, h, k, u) => {
    const G = pl();
    const slope = lerp(1, m, u(2)), lift = b * u(3), f = (t) => slope * t + lift;
    let s = S.fade(u(0), S.line(G.X(0), G.Y(-6), G.X(0), G.Y(6), 'c', 4, { opacity: 1 - 0.6 * u(1) }) + label(G.X(0) + 10, G.Y(5.4), 'y: how high', { fill: 'c', anchor: 'start', weight: 600 }));
    if (u(1) > 0) {
      s += G.clip(G.curve(f, 'ink', 3.5, drawOn(u(1))));
      const y = f(x);
      s += G.clip(S.fade(u(1), S.line(G.X(x), G.Y(0), G.X(x), G.Y(y), 'c', 1.5, dashed('3 4')) + S.line(G.X(0), G.Y(y), G.X(x), G.Y(y), 'c', 1.5, dashed('3 4')) + S.circle(G.X(x), G.Y(y), 7, 'c', 'paper', { 'stroke-width': 2 })));
      s += S.fade(u(1), label(660, 120, `x = ${fmt(x)}`, { anchor: 'start', fill: 'c' }) + label(660, 144, `y = ${fmt(y)}`, { anchor: 'start', fill: 'c', weight: 600 }));
    }
    if (u(3) > 0) s += G.clip(S.arrow(G.X(0), G.Y(0), G.X(0), G.Y(lift), 'b', 3) + S.circle(G.X(0), G.Y(lift), 6, 'b'));
    return G.svg + s;
  };
  reg('linear', {
    'Slope–intercept': play({
      intro: 'An empty grid. x runs across, y runs up.',
      scene: lineScene,
      pieces: [
        { parts: [[0, 'y']], color: 'c', say: 'y: the output, how high a point sits.' },
        { parts: [[1, ' = '], [3, 'x']], say: 'y = x: every point is exactly as high as it is far across. That’s the diagonal line.' },
        { parts: [[2, 'm']], color: 'a', hl: ['m'], say: ({ m }) => `y = mx: multiply by m = ${fmt(m)} and the line tilts. m is the slope: how much y changes for each step in x.` },
        { parts: [[4, ' + b']], color: 'b', hl: ['b'], say: ({ b }) => `+ b: add ${fmt(b)} to every height. The whole line lifts and crosses the y-axis at b.` },
      ],
      vary: [
        { key: 'm', amp: 1.6, say: 'Vary m: the line pivots around the point where it crosses the y-axis.' },
        { key: 'b', amp: 3, say: 'Vary b: the whole line slides up and down without tilting.' },
        { key: 'x', amp: 6, say: 'Vary x: the point rides along the line, and its height y follows: y depends on x.' },
      ],
    }),
    Slope: play({
      intro: 'Two points on the line, 4 apart in x.',
      scene: ({ m, b, x }, h, k, u) => {
        const G = pl(), f = (t) => m * t + b, x1 = x - 2, x2 = x + 2;
        let s = G.svg + G.clip(G.curve(f, 'grid2', 2));
        s += S.fade(u(0), G.clip(S.circle(G.X(x1), G.Y(f(x1)), 6, 'ink') + S.circle(G.X(x2), G.Y(f(x2)), 6, 'ink')));
        if (u(1) > 0) s += G.clip(S.line(G.X(x1), G.Y(f(x1)), G.X(lerp(x1, x2, u(1))), G.Y(f(x1)), 'b', 3.5)) + S.fade(u(1), label(G.X(x), G.Y(f(x1)) + 20, 'run 4', { fill: 'b', weight: 600 }));
        if (u(2) > 0) s += G.clip(S.line(G.X(x2), G.Y(f(x1)), G.X(x2), G.Y(lerp(f(x1), f(x2), u(2))), 'a', 3.5)) + S.fade(u(2), label(G.X(x2) + 10, G.Y((f(x1) + f(x2)) / 2), `rise ${fmt(4 * m)}`, { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(3), label(660, 120, `${fmt(4 * m)} ÷ 4 = ${fmt(m)}`, { anchor: 'start', size: 16, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'm = ']], say: 'm =: pick any two points on the line.' },
        { parts: [[2, ' / (x₂ − x₁)']], color: 'b', say: 'x₂ − x₁: how far across from one to the other, the run.' },
        { parts: [[1, '(y₂ − y₁)']], color: 'a', say: 'y₂ − y₁: how far up, the rise.' },
        { parts: [], say: 'Rise over run is the slope, and it’s the same for any two points.' },
      ],
      vary: [{ key: 'x', amp: 5, say: 'Vary where the points are: the rise and run triangle slides along, and the ratio never changes.' }],
    }),
    'Point–slope': play({
      intro: 'You know one point on the line and its slope.',
      scene: ({ m, b, x }, h, k, u) => {
        const G = pl(), x1 = -3, y1 = m * x1 + b, f = (t) => m * t + b;
        let s = G.svg + S.fade(u(0), G.clip(S.circle(G.X(x1), G.Y(y1), 7, 'ink')) + label(G.X(x1) - 10, G.Y(y1) - 12, '(x₁, y₁)', { anchor: 'end', weight: 600 }));
        if (u(1) > 0) s += G.clip(S.line(G.X(x1), G.Y(y1), G.X(lerp(x1, x, u(1))), G.Y(y1), 'b', 3)) + S.fade(u(1), label(G.X((x1 + x) / 2), G.Y(y1) + 20, 'x − x₁', { fill: 'b' }));
        if (u(2) > 0) s += G.clip(S.line(G.X(x), G.Y(y1), G.X(x), G.Y(lerp(y1, f(x), u(2))), 'a', 3) + S.circle(G.X(x), G.Y(lerp(y1, f(x), u(2))), 6, 'c')) + S.fade(u(2), label(G.X(x) + 10, G.Y((y1 + f(x)) / 2), 'm(x − x₁)', { fill: 'a', anchor: 'start' }));
        s += S.fade(u(3), G.clip(G.curve(f, 'ink', 3)));
        return s;
      },
      pieces: [
        { parts: [[0, 'y − y₁']], say: 'Start at the known point (x₁, y₁).' },
        { parts: [[1, ' = ']], color: 'b', say: 'Walk across to any x: a run of x − x₁.' },
        { parts: [[2, 'm(x − x₁)']], color: 'a', hl: ['m'], say: 'The line rises m for each step across, so it rises m(x − x₁): exactly y − y₁.' },
        { parts: [], say: 'Every point found this way lies on the same line.' },
      ],
      vary: [{ key: 'x', amp: 6, say: 'Vary x: the rise grows in step with the run.' }],
    }),
    'Standard form': play({
      intro: 'The same line, written as Ax + By = C (here A = −m, B = 1, C = b).',
      scene: ({ m, b, x }, h, k, u) => {
        const G = pl(), f = (t) => m * t + b, Ax = -m * x, By = f(x);
        let s = G.svg + G.clip(G.curve(f, 'grid2', 2) + S.circle(G.X(x), G.Y(f(x)), 6, 'c'));
        const bar = (y, val, color, text, uu) => S.fade(uu, S.rect(Math.min(620, 620 + val * 10), y, Math.min(150, Math.abs(val * 10)), 16, color, null, { rx: 3 }) + label(620, y - 6, text, { fill: color, size: 12 }));
        s += S.line(620, 90, 620, 300, 'grid2', 1);
        s += bar(110, Ax, 'a', `Ax = ${fmt(Ax)}`, u(0)) + bar(170, By, 'b', `By = ${fmt(By)}`, u(1)) + bar(250, Ax + By, 'ink', `sum = ${fmt(Ax + By)}`, u(2));
        return s;
      },
      pieces: [
        { parts: [[0, 'Ax']], color: 'a', say: 'Ax: one part, from the point’s x.' },
        { parts: [[1, ' + By']], color: 'b', say: '+ By: another part, from its y.' },
        { parts: [[2, ' = C']], say: '= C: for every point on the line, the two parts always add up to the same C.' },
      ],
      vary: [{ key: 'x', amp: 6, say: 'Vary the point along the line: the two bars change, but their sum stays fixed.' }],
    }),
    Root: play({
      intro: 'Where does the line cross y = 0?',
      scene: ({ m, b }, h, k, u) => {
        const G = pl(), f = (t) => m * t + b;
        let s = G.svg + G.clip(G.curve(f, 'ink', 2.5));
        s += S.fade(u(0), G.clip(S.circle(G.X(0), G.Y(b), 7, 'b')) + label(G.X(0) + 10, G.Y(b) - 10, `starts at height b = ${fmt(b)}`, { fill: 'b', anchor: 'start' }));
        if (m !== 0) {
          const r = -b / m;
          s += G.clip(S.arrow(G.X(0), G.Y(b) + 14, G.X(r * u(1)), G.Y(b) + 14, 'a', 3));
          s += S.fade(u(2), G.clip(S.circle(G.X(r), G.Y(0), 8, 'c')) + label(G.X(Math.max(-12, Math.min(12, r))), G.Y(0) + 26, `x = −b/m = ${fmt(r)}`, { fill: 'c', weight: 600 }));
        } else s += S.fade(u(1), label(400, 390, 'm = 0: a flat line never reaches 0 (unless b = 0).', { fill: 'muted', size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[1, '−b']], color: 'b', hl: ['b'], say: '−b: at x = 0 the line is b high; it needs to lose all of that.' },
        { parts: [[2, ' / m']], color: 'a', hl: ['m'], say: '/ m: it changes by m each step, so it takes b/m steps the other way.' },
        { parts: [[0, 'x = ']], say: 'x = −b/m: there it crosses zero.' },
      ],
      vary: [{ key: 'm', amp: 1.2, min: 0.25, say: 'Vary m: a steeper line reaches zero sooner.' }],
    }),
    'Perpendicular lines': play({
      intro: 'A line with slope m, and the same line turned a quarter turn.',
      scene: ({ m }, h, k, u) => {
        const G = pl();
        let s = G.svg + G.clip(G.curve((t) => m * t, 'a', 3, drawOn(u(0))));
        const ang = Math.atan(m) + (Math.PI / 2) * u(1), m2 = Math.tan(ang);
        if (u(1) > 0 && Math.abs(Math.cos(ang)) > 1e-3) s += G.clip(G.curve((t) => m2 * t, 'b', 3));
        s += S.fade(u(2), label(650, 120, `m₁ = ${fmt(m)}`, { fill: 'a', anchor: 'start' }) + label(650, 144, `m₂ = ${m ? fmt(-1 / m) : 'undefined'}`, { fill: 'b', anchor: 'start' }) + label(650, 172, `m₁ × m₂ = ${m ? '−1' : 'undefined'}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'm₁']], color: 'a', hl: ['m'], say: 'm₁: a line through the origin.' },
        { parts: [[1, 'm₂']], color: 'b', say: 'm₂: turn it a quarter turn. Rise and run swap places, and one changes sign: m₂ = −1/m₁.' },
        { parts: [[2, ' = −1']], say: 'So their slopes always multiply to −1.' },
      ],
      vary: [{ key: 'm', amp: 1.5, min: 0.2, say: 'Vary m: the two lines turn together, always at right angles.' }],
    }),
  });

  // =====================================================================
  // Parabolas
  // =====================================================================

  const parab = (A, B, C) => (x) => A * x * x + B * x + C;
  reg('quadratic', {
    'Standard form': play({
      intro: 'Build a parabola one term at a time.',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl(), A = lerp(1, a, u(1)), B = b * u(2), C = c * u(3);
        return G.svg + G.clip(G.curve(parab(A, B, C), 'ink', 3.5, drawOn(u(0))) + (u(3) > 0 ? S.circle(G.X(0), G.Y(C), 6, 'c') : ''));
      },
      pieces: [
        { parts: [[0, 'y = '], [2, 'x²']], say: 'y = x²: square every x. Negative or positive, the result is never below 0: a U shape.' },
        { parts: [[1, 'a']], color: 'a', hl: ['a'], say: 'a: multiply by a. Bigger a makes it narrower; negative a turns it upside down.' },
        { parts: [[3, ' + bx']], color: 'b', hl: ['b'], say: '+ bx: adding a straight-line term slides the U sideways (and down).' },
        { parts: [[4, ' + c']], color: 'c', hl: ['c'], say: '+ c: add c to every height: the whole curve lifts by c.' },
      ],
      vary: [
        { key: 'a', amp: 1.2, say: 'Vary a: the parabola narrows, widens, and flips upside down as a passes 0.' },
        { key: 'b', amp: 3, say: 'Vary b: the vertex slides along a curved path.' },
        { key: 'c', amp: 3, say: 'Vary c: the whole curve moves straight up and down.' },
      ],
    }),
    'Quadratic formula (Bhaskara)': play({
      intro: 'The roots are where y = ax² + bx + c crosses y = 0.',
      backdrop: () => pl().svg,
      pieces: [
        { parts: [[0, 'x = ']], hl: ['a', 'b', 'c'], say: 'x = …: draw the parabola and look for where it meets the horizontal axis.', draw: ({ a, b, c }, u) => { const G = pl(); return G.clip(G.curve(parab(a, b, c), 'ink', 3, drawOn(u))); } },
        { parts: [[1, '−b/2a']], color: 'b', hl: ['b', 'a'], say: ({ a, b }) => (a ? `−b/2a: the middle of the parabola, its line of symmetry, at x = ${fmt(-b / (2 * a))}. The roots sit evenly either side of it.` : 'With a = 0 there is no parabola, only a line.'),
          draw: ({ a, b }, u) => { if (!a) return ''; const G = pl(), vx = -b / (2 * a); return G.clip(S.line(G.X(vx), G.Y(6), G.X(vx), G.Y(6 - 12 * u), 'b', 2, dashed('5 5')) + S.fade(u, S.circle(G.X(vx), G.Y(0), 6, 'b'))); } },
        { parts: [[2, ' ± √Δ/2a']], color: 'c', hl: ['res'], say: ({ a, b, c }) => { const D = b * b - 4 * a * c; return !a ? 'No roots formula for a line.' : D < 0 ? `± √Δ/2a: Δ = b² − 4ac = ${fmt(D)} is negative, so its square root isn’t a real number: no roots.` : `± √Δ/2a: step ${fmt(Math.sqrt(D) / (2 * Math.abs(a)))} each way from the middle (Δ = ${fmt(D)}). Both steps land on a root.`; },
          draw: ({ a, b, c }, u) => { if (!a) return ''; const G = pl(), vx = -b / (2 * a), D = b * b - 4 * a * c; if (D < 0) return S.fade(u, label(400, 400, 'Δ < 0: the parabola never touches the axis', { fill: 'c', weight: 600 })); const d = (Math.sqrt(D) / (2 * Math.abs(a))) * u; return G.clip(S.arrow(G.X(vx), G.Y(0) - 10, G.X(vx + d), G.Y(0) - 10, 'c', 3) + S.arrow(G.X(vx), G.Y(0) - 10, G.X(vx - d), G.Y(0) - 10, 'c', 3) + S.fade(u, S.circle(G.X(vx + d), G.Y(0), 7, 'c') + S.circle(G.X(vx - d), G.Y(0), 7, 'c'))); } },
      ],
      vary: [{ key: 'c', amp: 3, say: 'Vary c: as the curve rises, the two roots slide together, meet, and vanish when Δ turns negative.' }],
    }),
    Discriminant: play({
      intro: 'One number tells you how many roots there are.',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl(), D = b * b - 4 * a * c, sc = 5;
        let s = G.svg + G.clip(G.curve(parab(a, b, c), 'grid2', 2.5));
        const bar = (y, val, color, text, uu) => S.fade(uu, S.rect(val >= 0 ? 620 : 620 + Math.max(-150, val * sc), y, Math.min(150, Math.abs(val * sc)), 16, color, null, { rx: 3 }) + label(612, y + 13, text, { fill: color, size: 12, anchor: 'end' }));
        s += S.line(620, 90, 620, 240, 'grid2', 1);
        s += bar(110, b * b, 'b', `b² = ${fmt(b * b)}`, u(0)) + bar(150, -4 * a * c, 'a', `−4ac = ${fmt(-4 * a * c)}`, u(1)) + bar(210, D, 'ink', `Δ = ${fmt(D)}`, u(2));
        if (u(2) > 0 && a) {
          const vx = -b / (2 * a);
          if (D >= 0) { const d = Math.sqrt(D) / (2 * Math.abs(a)); s += G.clip(S.circle(G.X(vx - d), G.Y(0), 7, 'c') + S.circle(G.X(vx + d), G.Y(0), 7, 'c')); }
          s += label(680, 270, D > 1e-9 ? 'two roots' : D < -1e-9 ? 'no real roots' : 'one root', { fill: 'c', weight: 600, size: 15 });
        }
        return s;
      },
      pieces: [
        { parts: [[0, 'Δ = '], [1, 'b²']], color: 'b', hl: ['b'], say: 'b²: the square of b, never negative.' },
        { parts: [[2, ' − 4ac']], color: 'a', hl: ['a', 'c'], say: '− 4ac: take away four times a times c.' },
        { parts: [], say: 'Δ: positive gives two roots, zero gives one, negative gives none.' },
      ],
      vary: [{ key: 'c', amp: 3.5, say: 'Vary c: watch Δ cross zero exactly when the roots merge and disappear.' }],
    }),
    'Vertex form': play({
      intro: 'Start from y = ax² sitting at the origin, then move it.',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl();
        if (!a) return G.svg + label(400, 390, 'a = 0: no parabola to move.', { fill: 'muted' });
        const x0 = -b / (2 * a), y0 = c - (b * b) / (4 * a), dx = x0 * u(1), dy = y0 * u(2);
        return G.svg + G.clip(G.curve((x) => a * (x - dx) ** 2 + dy, 'ink', 3.5, drawOn(u(0))) + S.circle(G.X(dx), G.Y(dy), 7, 'c')) + S.fade(u(2), label(650, 120, `vertex (${fmt(x0)}, ${fmt(y0)})`, { fill: 'c', anchor: 'start', weight: 600 }));
      },
      pieces: [
        { parts: [[2, 'a('], [3, 'x'], [5, ')²']], color: 'a', hl: ['a'], say: 'ax²: the basic parabola, its vertex at (0, 0).' },
        { parts: [[4, ' − x₀']], color: 'b', say: 'x − x₀: subtracting x₀ inside slides it right by x₀.' },
        { parts: [[0, 'y'], [1, ' − y₀ = ']], color: 'c', say: 'y − y₀: and lifting by y₀ puts the vertex at (x₀, y₀).' },
      ],
      vary: [{ key: 'a', amp: 1.2, say: 'Vary a: the parabola changes width around a vertex that stays put.' }],
    }),
    Vertex: play({
      intro: 'Where does the parabola turn?',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl(), f = parab(a, b, c);
        let s = G.svg + G.clip(G.curve(f, 'ink', 2.5));
        if (!a) return s;
        const x0 = -b / (2 * a), y0 = f(x0);
        s += G.clip(S.line(G.X(x0), G.Y(6), G.X(x0), G.Y(6 - 12 * u(0)), 'b', 2, dashed('5 5')));
        s += S.fade(u(0), label(G.X(Math.max(-12, Math.min(12, x0))) + 8, G.Y(5.5), `x₀ = ${fmt(x0)}`, { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.fade(u(1), G.clip(S.circle(G.X(x0), G.Y(y0), 8, 'c')) + label(650, 120, `y₀ = ${fmt(y0)}`, { fill: 'c', anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'x₀ = −b/2a']], color: 'b', hl: ['b', 'a'], say: 'x₀ = −b/2a: the line of symmetry, halfway between the roots (or where they would be).' },
        { parts: [[1, ',  y₀ = −Δ/4a']], color: 'c', say: 'y₀: the height of the curve there, the lowest or highest point.' },
      ],
      vary: [{ key: 'b', amp: 3, say: 'Vary b: the vertex moves, and the line of symmetry moves with it.' }],
    }),
    'Factored form': play({
      intro: 'Two straight lines, each crossing zero at a root.',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl(), D = b * b - 4 * a * c;
        if (!a || D < 0) return G.svg + label(400, 390, 'This parabola has no real roots, so it can’t be factored over real numbers.', { fill: 'muted' });
        const x1 = (-b - Math.sqrt(D)) / (2 * a), x2 = (-b + Math.sqrt(D)) / (2 * a);
        let s = G.svg + G.clip(G.curve((x) => x - x1, 'a', 2, { ...drawOn(u(0)), opacity: 1 - 0.6 * u(2) }) + G.curve((x) => x - x2, 'b', 2, { ...drawOn(u(1)), opacity: 1 - 0.6 * u(2) }));
        s += G.clip(S.fade(u(0), S.circle(G.X(x1), G.Y(0), 6, 'a')) + S.fade(u(1), S.circle(G.X(x2), G.Y(0), 6, 'b')));
        if (u(2) > 0) s += G.clip(G.curve((x) => lerp(1, a, u(2)) * (x - x1) * (x - x2), 'ink', 3.5));
        return s;
      },
      pieces: [
        { parts: [[2, '(x − x₁)']], color: 'a', say: '(x − x₁): a line that is zero exactly at the first root.' },
        { parts: [[3, '(x − x₂)']], color: 'b', say: '(x − x₂): a line that is zero at the second root.' },
        { parts: [[0, 'y = '], [1, 'a']], hl: ['a'], say: 'Multiply them (and by a): the product is zero wherever either factor is. That’s the parabola.' },
      ],
      vary: [{ key: 'c', amp: 2, say: 'Vary c: the roots move, and the two lines move with them.' }],
    }),
    Vieta: play({
      intro: 'The two roots, and what they add and multiply to.',
      scene: ({ a, b, c }, h, k, u) => {
        const G = pl(), D = b * b - 4 * a * c;
        let s = G.svg + G.clip(G.curve(parab(a, b, c), 'grid2', 2.5));
        if (!a || D < 0) return s + label(400, 390, 'No real roots here.', { fill: 'muted' });
        const x1 = (-b - Math.sqrt(D)) / (2 * a), x2 = (-b + Math.sqrt(D)) / (2 * a);
        s += G.clip(S.circle(G.X(x1), G.Y(0), 7, 'a') + S.circle(G.X(x2), G.Y(0), 7, 'b'));
        s += S.fade(u(0), label(620, 110, `x₁ + x₂ = ${fmt(x1 + x2)}`, { anchor: 'start', weight: 600 }) + label(620, 132, `−b/a = ${fmt(-b / a)}`, { anchor: 'start', fill: 'b' }));
        s += S.fade(u(1), label(620, 170, `x₁ × x₂ = ${fmt(x1 * x2)}`, { anchor: 'start', weight: 600 }) + label(620, 192, `c/a = ${fmt(c / a)}`, { anchor: 'start', fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'x₁ + x₂ = −b/a']], color: 'b', say: 'Add the roots: always −b/a.' },
        { parts: [[1, ',  x₁x₂ = c/a']], color: 'c', say: 'Multiply them: always c/a. (Expand a(x − x₁)(x − x₂) to see why.)' },
      ],
      vary: [{ key: 'c', amp: 2, say: 'Vary c: the roots move, but the numbers on the right always match.' }],
    }),
  });

  // =====================================================================
  // Square of a sum, difference of squares
  // =====================================================================

  const sq = ({ a, b }) => { const sc = 280 / (a + b); return { A: a * sc, B: b * sc, x0: 400 - ((a + b) * sc) / 2, y0: 96 }; };
  reg('square-of-sum', {
    'Square of a sum': play({
      intro: 'Start from nothing.',
      pieces: [
        { text: '(a', color: 'a', hl: ['a'], say: ({ a }) => `a: a length of ${fmt(a)}.`, draw: (q, u) => { const G = sq(q); return S.line(G.x0, G.y0 - 12, G.x0 + G.A * u, G.y0 - 12, 'a', 4); } },
        { text: ' + b)', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b: add a length of ${fmt(b)} on the end.`, draw: (q, u) => { const G = sq(q); return S.line(G.x0 + G.A, G.y0 - 12, G.x0 + G.A + G.B * u, G.y0 - 12, 'b', 4); } },
        { text: '²', hl: ['res'], say: ({ a, b }) => `²: square the whole length: a square of side ${fmt(a + b)}.`, draw: (q, u) => { const G = sq(q), side = G.A + G.B; return S.rect(G.x0, G.y0, side, side * u, null, 'ink', { 'stroke-width': 2.5 }); } },
        { text: ' = a²', color: 'a', say: ({ a }) => `= a²: inside it, a square of side a: ${fmt(a * a)}.`, draw: (q, u) => { const G = sq(q); return S.fade(u, S.rect(G.x0, G.y0, G.A, G.A, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(G.x0 + G.A / 2, G.y0 + G.A / 2 + 6, 'a²', { fill: 'a', size: 18 })); } },
        { text: ' + 2ab', color: 'c', say: ({ a, b }) => `+ 2ab: two a × b strips: ${fmt(2 * a * b)}.`, draw: (q, u) => { const G = sq(q); return S.fade(u, S.rect(G.x0 + G.A, G.y0, G.B, G.A, 'c-soft', 'c', { 'stroke-width': 1.5 }) + S.rect(G.x0, G.y0 + G.A, G.A, G.B, 'c-soft', 'c', { 'stroke-width': 1.5 })); } },
        { text: ' + b²', color: 'b', say: ({ a, b }) => `+ b²: the corner: ${fmt(b * b)}. Together: ${fmt((a + b) ** 2)}.`, draw: (q, u) => { const G = sq(q); return S.fade(u, S.rect(G.x0 + G.A, G.y0 + G.A, G.B, G.B, 'b-soft', 'b', { 'stroke-width': 1.5 })); } },
      ],
      vary: [
        { key: 'a', amp: 2, min: 1, say: 'Vary a: the a² square and both strips grow; b² stays the same.' },
        { key: 'b', amp: 2, min: 1, say: 'Vary b: now the corner and the strips change.' },
      ],
    }),
    'Square of a difference': play({
      intro: 'A square of side a. We want the square of side a − b inside it.',
      scene: (q, h, k, u) => {
        const a = q.a, b = Math.min(q.b, q.a), sc = 280 / a, A = a * sc, B = b * sc, x0 = 400 - A / 2, y0 = 96;
        let s = S.rect(x0, y0, A, A * u(0), 'ink-soft', 'ink', { 'stroke-width': 2 });
        s += S.fade(u(1), S.rect(x0 + A - B, y0, B, A, 'c-soft', 'c', { 'stroke-width': 1.5, ...dashed('5 4') }) + S.rect(x0, y0 + A - B, A, B, 'c-soft', 'c', { 'stroke-width': 1.5, ...dashed('5 4') }));
        s += S.fade(u(2), S.rect(x0 + A - B, y0 + A - B, B, B, 'b', null, { opacity: 0.55 }) + S.rect(x0, y0, A - B, A - B, 'a-soft', 'a', { 'stroke-width': 2.5 }) + label(x0 + (A - B) / 2, y0 + (A - B) / 2 + 6, `(a − b)² = ${fmt((a - b) ** 2)}`, { fill: 'a', weight: 600 }));
        return s;
      },
      pieces: [
        { text: '(a − b)² = a²', hl: ['a'], say: 'a²: the big square.' },
        { text: ' − 2ab', color: 'c', hl: ['b'], say: '− 2ab: cut off a strip a × b down the side and another along the bottom.' },
        { text: ' + b²', color: 'b', say: '+ b²: the corner was cut away twice, so add one copy back. What remains is the (a − b)² square.' },
      ],
    }),
    'Cube of a sum': play({
      intro: 'A cube of side a + b, split into eight boxes.',
      scene: ({ a, b }, h, k, u) => {
        const sc = 150 / (a + b), A = a * sc, B = b * sc, x0 = 200, y0 = 370;
        const box = (ix, iy, iz, w, hh, d, fill, stroke) => iso(x0 + ix + iz * 0.62, y0 - iy - iz * 0.42, w, hh, d, fill, stroke);
        let s = S.fade(u(0), box(0, 0, 0, A, A, A, 'a-soft', 'a'));
        s += S.fade(u(1), box(A + 20, 0, 0, B, A, A, 'c-soft', 'c') + box(0, A + 20, 0, A, B, A, 'c-soft', 'c') + box(0, 0, A + 20, A, A, B, 'c-soft', 'c'));
        s += S.fade(u(2), box(A + 20, A + 20, 0, B, B, A, 'b-soft', 'b') + box(A + 20, 0, A + 20, B, A, B, 'b-soft', 'b') + box(0, A + 20, A + 20, A, B, B, 'b-soft', 'b'));
        s += S.fade(u(3), box(A + 20, A + 20, A + 20, B, B, B, 'ink-soft', 'ink'));
        s += S.fade(u(3), label(620, 200, `${fmt(a ** 3)} + ${fmt(3 * a * a * b)} + ${fmt(3 * a * b * b)} + ${fmt(b ** 3)}`, { weight: 600 }) + label(620, 226, `= ${fmt((a + b) ** 3)} = (a + b)³`, { weight: 600 }));
        return s;
      },
      pieces: [
        { text: '(a + b)³ = a³', color: 'a', say: 'a³: the big corner cube.' },
        { text: ' + 3a²b', color: 'c', say: '3a²b: three slabs, each a × a × b.' },
        { text: ' + 3ab²', color: 'b', say: '3ab²: three rods, each a × b × b.' },
        { text: ' + b³', say: 'b³: the small corner cube. Eight pieces fill the big cube: 1, 3, 3, 1.' },
      ],
    }),
  });

  reg('difference-of-squares', {
    'Difference of squares': play({
      intro: 'Start from nothing.',
      scene: ({ a, b: b0 }, h, k, u) => {
        const b = Math.min(b0, a), sc = Math.min(290 / a, 620 / (2 * a + b)), d = a - b, A = a * sc, Bs = b * sc, Ds = d * sc, x0 = 70, y0 = 96, x1 = x0 + A + 60;
        let s = S.fade(u(0), S.rect(x0, y0, A, A * u(0), 'a-soft', 'a', { 'stroke-width': 1.5 }));
        if (u(1) > 0) s += S.rect(x0 + Ds, y0 + Ds, Bs, Bs, 'card', 'b', { 'stroke-width': 1.5, ...dashed('5 5') });
        if (d > 0 && u(2) > 0) {
          const stripAt = lerpPt([x0, y0], [x1, y0], u(2));
          s += S.rect(stripAt[0], stripAt[1], A, Ds, 'a-soft', 'a', { 'stroke-width': 1.5 });
          const c = lerpPt([x0 + Ds / 2, y0 + Ds + Bs / 2], [x1 + A + Bs / 2, y0 + Ds / 2], u(2));
          s += `<g transform="translate(${c[0]} ${c[1]}) rotate(${90 * u(2)})">${S.rect(-Ds / 2, -Bs / 2, Ds, Bs, 'c-soft', 'c', { 'stroke-width': 1.5 })}</g>`;
          s += S.fade(u(2), label(x1 + (A + Bs) / 2, y0 + Ds + 30, `a + b = ${fmt(a + b)}`, { weight: 600 }));
        }
        if (d > 0) s += S.fade(u(3), label(x1 + A + Bs + 14, y0 + Ds / 2 + 5, `a − b = ${fmt(d)}`, { anchor: 'start', weight: 600 }) + S.rect(x1, y0, A + Bs, Ds, null, 'ink', { 'stroke-width': 2.5 }));
        return s;
      },
      pieces: [
        { text: 'a²', color: 'a', hl: ['a'], say: ({ a }) => `a²: a square of side ${fmt(a)}.` },
        { text: ' − b²', color: 'b', hl: [MINUS, 'b'], say: '− b²: cut a b × b square out of the corner.' },
        { text: ' = (a + b)', say: '= (a + b): move the leftover pieces into one row, a + b wide.' },
        { text: '(a − b)', hl: ['res'], say: '(a − b): and a − b tall. One rectangle.' },
      ],
      vary: [{ key: 'b', amp: 2, min: 0, max: (q) => q.a, say: 'Vary b: a bigger corner leaves a wider, thinner rectangle.' }],
    }),
    'Difference of cubes': play({
      intro: 'A cube of side a with a cube of side b cut from its corner.',
      scene: ({ a, b: b0 }, h, k, u) => {
        const b = Math.min(b0, a), sc = 160 / a, A = a * sc, B = b * sc, D = A - B, x0 = 200, y0 = 370;
        let s = S.fade(u(0) * (1 - u(2) * 0.85), iso(x0, y0, A, A, A, 'ink-soft', 'ink'));
        s += S.fade(u(1) * (1 - u(2)), iso(x0 + D, y0 - D, B, B, B, 'b', 'b'));
        s += S.fade(u(2), iso(x0, y0, D, A, A, 'a-soft', 'a'));
        s += S.fade(u(3), iso(x0 + D + 40, y0, B, D, A, 'c-soft', 'c'));
        s += S.fade(u(4), iso(x0 + D + 40, y0 - D - 30, B, B, D, 'b-soft', 'b'));
        s += S.fade(u(4), label(620, 220, '(a − b)a² + (a − b)ab + (a − b)b²', { weight: 600 }) + label(620, 246, `= ${fmt(a ** 3 - b ** 3)} = a³ − b³`, { weight: 600 }));
        return s;
      },
      pieces: [
        { text: 'a³', hl: ['a'], say: 'a³: a cube of side a.' },
        { text: ' − b³', color: 'b', hl: ['b'], say: '− b³: remove a small cube from the corner. Three slabs remain, each a − b thick.' },
        { text: ' = (a − b)(a²', color: 'a', say: 'Slab one: (a − b) × a × a.' },
        { text: ' + ab', color: 'c', say: 'Slab two: (a − b) × a × b.' },
        { text: ' + b²)', color: 'b', say: 'Slab three: (a − b) × b × b. All three share the factor a − b.' },
      ],
    }),
    General: play({
      intro: 'Walk from aⁿ down to bⁿ (here n = 3), swapping one a for a b each step.',
      scene: ({ a, b: b0 }, h, k, u) => {
        const b = Math.min(b0, a), vals = [a ** 3, a * a * b, a * b * b, b ** 3], max = Math.max(...vals, 1);
        const X = (v) => 80 + (v / max) * 640;
        let s = S.line(80, 260, 720, 260, 'grid2', 2);
        const names = ['a³', 'a²b', 'ab²', 'b³'];
        vals.forEach((v, i) => { s += S.fade(clamp01(u(0) * 4 - i), S.circle(X(v), 260, 7, 'ink') + label(X(v), 290 + (i % 2) * 20, names[i], { size: 13 })); });
        for (let i = 0; i < 3; i++) s += S.fade(clamp01(u(1) * 3 - i), S.arrow(X(vals[i]), 210 - i * 26, X(vals[i + 1]), 210 - i * 26, 'c', 3) + label((X(vals[i]) + X(vals[i + 1])) / 2, 200 - i * 26, ['(a − b)a²', '(a − b)ab', '(a − b)b²'][i], { fill: 'c', size: 12 }));
        s += S.fade(u(2), label(400, 360, `the three gaps add up to a³ − b³ = ${fmt(a ** 3 - b ** 3)}`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { text: 'aⁿ − bⁿ', hl: ['a', 'b'], say: 'Mark aⁿ, then swap one a for a b at a time until you reach bⁿ.' },
        { text: ' = (a − b)(', color: 'c', say: 'Each step is a gap with a factor of (a − b) in it.' },
        { text: 'aⁿ⁻¹ + … + bⁿ⁻¹)', say: 'Add the gaps: the whole distance aⁿ − bⁿ is (a − b) times the sum.' },
      ],
    }),
  });
})();
