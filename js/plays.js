// "Play formula": each topic's main formula, built on the display one piece at a time.
// A play lists its pieces in the order they're built. Each piece has its text (and where that text sits in
// the formula, if it isn't built left to right), a caption, highlight keys, and a drawing that grows with
// its own progress u. The math plays use the topic's current numbers; the physics ones use fixed examples.
(() => {
  'use strict';
  const { S, fmt, seg, lin, lerp, lerpPt, dashed, drawOn, morph, numberLine, plane, fit, sfx, pitch, note, MINUS } = MV;
  const resolve = (x, p) => (typeof x === 'function' ? x(p) : x);
  const strip = (t) => t.replace(/<[^>]+>/g, '');
  const label = (x, y, str, o = {}) => S.text(x, y, str, { size: 14, ...o });
  const shape = (P, pts, fill, stroke, extra = {}) => S.poly(pts.map(([x, y]) => P(x, y)), fill, stroke, { 'stroke-width': 2, ...extra });
  const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
  // Piecewise-linear map, used to drive an existing topic animation from the play's clock.
  const remap = (k, pts) => {
    for (let i = 1; i < pts.length; i++) {
      const [a0, b0] = pts[i - 1], [a1, b1] = pts[i];
      if (k <= a1) return lerp(b0, b1, a1 > a0 ? (k - a0) / (a1 - a0) : 1);
    }
    return pts[pts.length - 1][1];
  };
  const topicDraw = (id) => (p, h, k) => MV.topics.find((t) => t.id === id).draw(p, h, { k, t: 0 });

  function play(name, spec) {
    const pieces = spec.pieces, n = pieces.length;
    const start = (i) => 0.04 + (0.9 * i) / n, stop = (i) => 0.04 + (0.9 * (i + 1)) / n;
    const parts = [];
    pieces.forEach((pc, i) => {
      for (const [pos, text] of pc.parts || [[i, pc.text]]) parts.push({ pos, text, i, color: pc.color || 'ink' });
    });
    parts.sort((x, y) => x.pos - y.pos);
    return {
      name,
      build: spec.build ?? Math.max(6, 2.6 * n + 1.5),
      preview: parts.map((x) => [x.pos, strip(x.text), x.i]),
      steps: (p) => [
        { at: 0, hl: [], say: resolve(spec.intro, p) || 'Start from nothing.' },
        ...pieces.map((pc, i) => ({ at: start(i), hl: pc.hl || [], say: resolve(pc.say, p) })),
      ],
      sfx: (p) => [
        ...pieces.map((pc, i) => sfx.pop(start(i), note(2 * i + 4))),
        ...pieces.flatMap((pc, i) => (pc.sound ? pc.sound(p, start(i), stop(i)) : [sfx.glide(start(i) + 0.01, start(i) + (stop(i) - start(i)) * 0.7, pitch(2 * i), pitch(2 * i + 5))])),
        sfx.chime(0.96, note(2 * n + 4)),
      ],
      draw(p, h, { k }) {
        const u = (i) => seg(k, start(i), start(i) + (stop(i) - start(i)) * 0.8);
        const newest = pieces.reduce((m, _, i) => (k >= start(i) ? i : m), -1);
        let s = '<text x="400" y="46" text-anchor="middle" class="m" font-size="30" font-style="italic">' +
          parts.map((x) => `<tspan style="fill:var(--${x.i === newest ? 'c' : x.color});opacity:${seg(k, start(x.i), start(x.i) + 0.03).toFixed(3)}" font-weight="${x.i === newest ? 600 : 400}">${x.text}</tspan>`).join('') +
          '</text>';
        if (spec.backdrop) s += S.fade(seg(k, 0, 0.04), spec.backdrop(p));
        if (spec.scene) s += spec.scene(p, h, k, u, start, stop);
        else pieces.forEach((pc, i) => { if (pc.draw) s += pc.draw(p, u(i), u, k); });
        return s;
      },
    };
  }

  const P = (MV.plays = {});

  // ---------------------------------------------------------------------
  // Operations
  // ---------------------------------------------------------------------

  const lineFor = (...vals) => numberLine(-(Math.max(10, ...vals.map(Math.abs)) + 1), Math.max(10, ...vals.map(Math.abs)) + 1, 270);

  P.add = play('a + b = c', {
    intro: 'Start from an empty number line.',
    backdrop: ({ a, b }) => lineFor(a, b, a + b).svg,
    pieces: [
      { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: an arrow from 0, ${fmt(Math.abs(a))} steps ${a >= 0 ? 'right' : 'left'}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a + b); return S.arrow(X(0), 210, X(a * u), 210, 'a', 4) + S.fade(u, label(X(a / 2), 194, fmt(a), { fill: 'a', weight: 600 })); } },
      { text: ' + b', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b: start where a ended and go ${fmt(Math.abs(b))} more ${b >= 0 ? 'right' : 'left'}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a + b); return S.line(X(a), 270, X(a), 140, 'grid2', 1, dashed('3 5')) + S.arrow(X(a), 150, X(a + b * u), 150, 'b', 4) + S.fade(u, label(X(a + b / 2), 134, fmt(b), { fill: 'b', weight: 600 })); } },
      { text: ' = c', hl: ['=', 'res'], say: ({ a, b }) => `= c: the whole trip, from 0 straight to ${fmt(a + b)}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a + b); return S.arrow(X(0), 340, X((a + b) * u), 340, 'ink', 4.5) + S.fade(u, label(X((a + b) / 2), 372, `c = ${fmt(a + b)}`, { weight: 600, size: 16 }) + S.circle(X(a + b), 270, 7, 'ink')); } },
    ],
  });

  P.subtract = play('a − b = c', {
    intro: 'Start from an empty number line.',
    backdrop: ({ a, b }) => lineFor(a, b, a - b).svg,
    pieces: [
      { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: an arrow from 0 to ${fmt(a)}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a - b); return S.arrow(X(0), 210, X(a * u), 210, 'a', 4) + S.fade(u, label(X(a / 2), 194, fmt(a), { fill: 'a', weight: 600 })); } },
      { text: ' − b', color: 'b', hl: [MINUS, 'b'], say: ({ b }) => `− b: from the tip, step ${fmt(Math.abs(b))} back${b < 0 ? ' (backwards from a negative: forwards)' : ''}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a - b); return S.line(X(a), 270, X(a), 140, 'grid2', 1, dashed('3 5')) + S.arrow(X(a), 150, X(a - b * u), 150, 'b', 4) + S.fade(u, label(X(a - b / 2), 134, fmt(-b), { fill: 'b', weight: 600 })); } },
      { text: ' = c', hl: ['=', 'res'], say: ({ a, b }) => `= c: you end up at ${fmt(a - b)}.`,
        draw: ({ a, b }, u) => { const { X } = lineFor(a, b, a - b); return S.arrow(X(0), 340, X((a - b) * u), 340, 'ink', 4.5) + S.fade(u, label(X((a - b) / 2), 372, `c = ${fmt(a - b)}`, { weight: 600, size: 16 }) + S.circle(X(a - b), 270, 7, 'ink')); } },
    ],
  });

  const gridFor = ({ a, b }) => { const cell = Math.min(38, 560 / Math.max(a, 1), 250 / Math.max(b, 1)); return { cell, x0: 400 - (a * cell) / 2, y0: 92 }; };
  P.multiply = play('a × b = ab', {
    intro: 'Start from an empty table.',
    pieces: [
      { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: one row of ${fmt(a)} squares.`,
        draw: ({ a, b }, u) => {
          const { cell, x0, y0 } = gridFor({ a, b });
          let s = '';
          for (let i = 0; i < Math.ceil(u * a - 1e-9); i++) s += S.rect(x0 + i * cell + 2, y0 + 2, cell - 4, cell - 4, 'a-soft', 'a', { rx: 4, 'stroke-width': 1.5 });
          return s + S.fade(u, label(x0 - 12, y0 + cell / 2 + 5, fmt(a), { fill: 'a', anchor: 'end', weight: 600 }));
        } },
      { text: ' × b', color: 'b', hl: ['×', 'b'], say: ({ b }) => `× b: copy that row until there are ${fmt(b)} rows.`,
        draw: ({ a, b }, u) => {
          const { cell, x0, y0 } = gridFor({ a, b });
          let s = '';
          const rows = u * (b - 1);
          for (let j = 1; j < b; j++) {
            const r = Math.max(0, Math.min(1, rows - (j - 1)));
            if (r <= 0) continue;
            const y = y0 + lerp(j - 1, j, MV.ease(r)) * cell;
            for (let i = 0; i < a; i++) s += S.rect(x0 + i * cell + 2, y + 2, cell - 4, cell - 4, 'b-soft', 'b', { rx: 4, 'stroke-width': 1.2, opacity: r });
          }
          if (b === 0) s += label(400, 220, 'Zero rows: nothing at all.', { fill: 'muted', size: 16 });
          return s + S.fade(u, S.line(x0 + a * cell + 14, y0, x0 + a * cell + 14, y0 + Math.max(1, b) * cell, 'b', 3) + label(x0 + a * cell + 24, y0 + (b * cell) / 2 + 5, `${fmt(b)} rows`, { fill: 'b', anchor: 'start', weight: 600 }));
        } },
      { text: ' = ab', hl: ['=', 'res'], say: ({ a, b }) => `= ab: count every square: ${fmt(a * b)}.`,
        draw: ({ a, b }, u) => { const { cell, y0 } = gridFor({ a, b }); return S.fade(u, label(400, y0 + Math.max(1, b) * cell + 44, `${fmt(b)} × ${fmt(a)} = ${fmt(a * b)} squares`, { size: 18, weight: 600 })); } },
    ],
  });

  P.divide = play('a ÷ b = q', {
    intro: 'Start with nothing to share.',
    pieces: [
      { text: 'a', color: 'a', hl: ['a'], say: ({ a }) => `a: a pile of ${fmt(a)}.`,
        draw: ({ a, b }, u, U) => {
          let s = '';
          const q = b ? Math.floor(a / b) : 0, moved = U(1);
          for (let i = 0; i < Math.ceil(u * a - 1e-9); i++) {
            const pile = [400 - 9 * 16 + (i % 18) * 16 + 8, 100 + Math.floor(i / 18) * 16];
            const box = i % Math.max(1, b), slot = Math.floor(i / Math.max(1, b));
            const colW = 640 / Math.max(1, b), bx = 80 + box * colW + colW / 2;
            const target = [bx - 16 + (slot % 3) * 16, 238 + Math.floor(slot / 3) * 16];
            const go = b && i < q * b ? Math.max(0, Math.min(1, moved * q * b - i * 0.6)) : 0;
            const [x, y] = lerpPt(pile, target, MV.ease(Math.min(1, go)));
            s += S.circle(x, y, 6, 'a');
          }
          return s;
        } },
      { text: ' ÷ b', color: 'b', hl: ['÷', 'b'], say: ({ a, b }) => (b ? `÷ b: deal them out into ${fmt(b)} equal groups.${a % b ? ` ${fmt(a % b)} can’t be shared and stay in the pile.` : ''}` : '÷ 0: there are no groups to deal into, so it has no answer.'),
        draw: ({ b }, u) => {
          if (!b) return S.fade(u, label(400, 260, 'No groups: dividing by zero is undefined.', { fill: 'muted', size: 16 }));
          let s = '';
          const colW = 640 / b;
          for (let i = 0; i < b; i++) s += S.fade(Math.min(1, u * 3), S.rect(80 + i * colW + 4, 222, colW - 8, 120, null, 'b', { rx: 8, 'stroke-width': 1.5 }));
          return s;
        } },
      { text: ' = q', hl: ['=', 'res'], say: ({ a, b }) => (b ? `= q: each group gets ${fmt(a / b)}.` : '= undefined.'),
        draw: ({ a, b }, u) => {
          if (!b) return '';
          let s = '';
          const colW = 640 / b;
          for (let i = 0; i < b; i++) s += S.fade(u, label(80 + i * colW + colW / 2, 366, fmt(Math.floor(a / b)), { weight: 600 }));
          return s + S.fade(u, label(400, 400, `${fmt(a)} ÷ ${fmt(b)} = ${fmt(a / b)}`, { size: 17, weight: 600 }));
        } },
    ],
  });

  const powBars = ({ base, n }) => {
    const vals = Array.from({ length: n + 1 }, (_, j) => base ** j), max = Math.max(...vals);
    const slot = 640 / (n + 1), bw = Math.min(50, slot * 0.6);
    return { vals, bar: (j, grow, fill, stroke) => { const hgt = Math.max(1.5, (vals[j] / max) * 260) * grow, x = 80 + slot * j + slot / 2; return S.rect(x - bw / 2, 370 - hgt, bw, hgt, fill, stroke, { rx: 3, 'stroke-width': 1.5 }) + (grow >= 1 ? label(x, 362 - hgt, MV.compact(vals[j]), { size: 12, fill: 'muted' }) : ''); } };
  };
  P.power = play('bⁿ = b × b × … × b', {
    intro: 'Start from 1: nothing multiplied yet.',
    backdrop: () => S.line(60, 370, 740, 370, 'grid2', 1.5),
    pieces: [
      { text: 'b', color: 'a', hl: ['base'], say: ({ base }) => `b: start from 1, then multiply by ${fmt(base)} once.`,
        draw: (p, u) => { const B = powBars(p); return B.bar(0, Math.min(1, u * 2), 'ink-soft', 'ink') + (p.n >= 1 ? B.bar(1, Math.max(0, u * 2 - 1), 'a-soft', 'a') : ''); } },
      { text: 'ⁿ', color: 'b', hl: ['n'], say: ({ base, n }) => (n > 1 ? `ⁿ: keep going until there are ${fmt(n)} copies of ${fmt(base)} multiplied together.` : n === 1 ? 'ⁿ: here n = 1, so one copy is all there is.' : 'ⁿ: here n = 0: no multiplications at all, so the answer stays 1.'),
        draw: (p, u) => { const B = powBars(p); let s = ''; for (let j = 2; j <= p.n; j++) s += B.bar(j, Math.max(0, Math.min(1, u * (p.n - 1) - (j - 2))), 'a-soft', 'a'); return s; } },
      { text: ' = b × b × … × b', hl: ['=', 'res'], say: ({ base, n }) => `= ${fmt(base)}<sup>${n}</sup> = ${fmt(base ** n)}.`,
        draw: (p, u) => { const B = powBars(p); return S.fade(u, B.bar(p.n, 1, 'ink', null)) + S.fade(u, label(400, 404, `${fmt(p.base)}${p.n ? ` multiplied ${fmt(p.n)} time${p.n === 1 ? '' : 's'}` : ' to the power 0'} = ${fmt(p.base ** p.n)}`, { size: 16, weight: 600 })); } },
    ],
  });

  // ---------------------------------------------------------------------
  // Algebra
  // ---------------------------------------------------------------------

  const pl = () => plane({ cx: 400, cy: 240, unit: 26, xr: 13, yr: 6.2 });

  P.linear = play('y = mx + b', {
    intro: 'Start from an empty grid.',
    backdrop: () => pl().svg,
    pieces: [
      { parts: [[0, 'y = '], [1, 'mx']], color: 'a', hl: ['m'], say: ({ m }) => `y = mx: a straight line through the origin, rising ${fmt(m)} for every step right.`,
        draw: ({ m }, u, U) => { const G = pl(); return G.clip(G.curve((t) => m * t, 'a', U(1) > 0 ? 2 : 3, { ...drawOn(u), ...(U(1) > 0 ? dashed('5 5') : {}) })); } },
      { parts: [[2, ' + b']], color: 'b', hl: ['b'], say: ({ b }) => `+ b: lift every point of the line by ${fmt(b)}.`,
        draw: ({ m, b }, u) => { const G = pl(); const sft = b * u; return G.clip(G.curve((t) => m * t + sft, 'ink', 3.5) + S.arrow(G.X(0), G.Y(0), G.X(0), G.Y(sft), 'b', 3) + S.circle(G.X(0), G.Y(sft), 6, 'b')) + S.fade(u, label(G.X(0) + 12, G.Y(b) - 10, `b = ${fmt(b)}`, { fill: 'b', anchor: 'start', weight: 600 })); } },
    ],
  });

  P.quadratic = play('x = −b/2a ± √Δ/2a', {
    intro: 'The roots are where the parabola y = ax² + bx + c crosses y = 0.',
    backdrop: () => pl().svg,
    pieces: [
      { parts: [[0, 'x = ']], hl: ['a', 'b', 'c'], say: 'x = …: draw the parabola and look for where it meets the horizontal axis.',
        draw: ({ a, b, c }, u) => { const G = pl(); return G.clip(G.curve((x) => a * x * x + b * x + c, 'ink', 3, drawOn(u))); } },
      { parts: [[1, '−b/2a']], color: 'b', hl: ['b', 'a'], say: ({ a, b }) => (a ? `−b / 2a: the middle of the parabola, its axis of symmetry, at x = ${fmt(-b / (2 * a))}.` : 'With a = 0 there is no parabola, only a line.'),
        draw: ({ a, b }, u) => { if (!a) return ''; const G = pl(), vx = -b / (2 * a); return G.clip(S.line(G.X(vx), G.Y(6.2), G.X(vx), G.Y(6.2 - 12.4 * u), 'b', 2, dashed('5 5')) + S.fade(u, S.circle(G.X(vx), G.Y(0), 6, 'b'))) + S.fade(u, label(G.X(vx) + 8, G.Y(0) + 22, fmt(vx), { fill: 'b', anchor: 'start', weight: 600 })); } },
      { parts: [[2, ' ± √Δ/2a']], color: 'c', hl: ['res'], say: ({ a, b, c }) => { const D = b * b - 4 * a * c; return !a ? '' : D < 0 ? `± √Δ / 2a: Δ = b² − 4ac = ${fmt(D)} is negative, so its square root isn’t a real number: no roots.` : `± √Δ / 2a: step ${fmt(Math.sqrt(D) / (2 * Math.abs(a)))} each way from the middle (Δ = b² − 4ac = ${fmt(D)}). Both land on a root.`; },
        draw: ({ a, b, c }, u) => {
          if (!a) return '';
          const G = pl(), vx = -b / (2 * a), D = b * b - 4 * a * c;
          if (D < 0) return S.fade(u, label(400, 400, 'Δ < 0: the parabola never touches the axis', { fill: 'c', size: 15, weight: 600 }));
          const d = (Math.sqrt(D) / (2 * Math.abs(a))) * u;
          return G.clip(S.arrow(G.X(vx), G.Y(0) - 10, G.X(vx + d), G.Y(0) - 10, 'c', 3) + S.arrow(G.X(vx), G.Y(0) - 10, G.X(vx - d), G.Y(0) - 10, 'c', 3) +
            S.fade(u, S.circle(G.X(vx + d), G.Y(0), 7, 'c') + S.circle(G.X(vx - d), G.Y(0), 7, 'c')));
        } },
    ],
  });

  const sqSum = ({ a, b }) => { const sc = 290 / (a + b); return { sc, A: a * sc, B: b * sc, x0: 400 - ((a + b) * sc) / 2, y0: 92 }; };
  P['square-of-sum'] = play('(a + b)² = a² + 2ab + b²', {
    intro: 'Start from nothing.',
    pieces: [
      { text: '(a', color: 'a', hl: ['a'], say: ({ a }) => `a: a length of ${fmt(a)}.`,
        draw: (p, u) => { const G = sqSum(p); return S.line(G.x0, G.y0 - 12, G.x0 + G.A * u, G.y0 - 12, 'a', 4) + S.fade(u, label(G.x0 + G.A / 2, G.y0 - 22, fmt(p.a), { fill: 'a' })); } },
      { text: ' + b)', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b: add a length of ${fmt(b)} on the end.`,
        draw: (p, u) => { const G = sqSum(p); return S.line(G.x0 + G.A, G.y0 - 12, G.x0 + G.A + G.B * u, G.y0 - 12, 'b', 4) + S.fade(u, label(G.x0 + G.A + G.B / 2, G.y0 - 22, fmt(p.b), { fill: 'b' })); } },
      { text: '²', hl: ['res'], say: ({ a, b }) => `²: square the whole length: a square of side ${fmt(a + b)}.`,
        draw: (p, u) => { const G = sqSum(p), side = G.A + G.B; return S.rect(G.x0, G.y0, side, side * u, null, 'ink', { 'stroke-width': 2.5 }); } },
      { text: ' = a²', color: 'a', say: ({ a }) => `= a²: inside it, a square of side a: ${fmt(a * a)}.`,
        draw: (p, u) => { const G = sqSum(p); return S.fade(u, S.rect(G.x0, G.y0, G.A, G.A, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(G.x0 + G.A / 2, G.y0 + G.A / 2 + 6, 'a²', { fill: 'a', size: 18 })); } },
      { text: ' + 2ab', color: 'c', say: ({ a, b }) => `+ 2ab: two a × b strips: ${fmt(2 * a * b)}.`,
        draw: (p, u) => { const G = sqSum(p); return S.fade(u, S.rect(G.x0 + G.A, G.y0, G.B, G.A, 'c-soft', 'c', { 'stroke-width': 1.5 }) + S.rect(G.x0, G.y0 + G.A, G.A, G.B, 'c-soft', 'c', { 'stroke-width': 1.5 }) +
          label(G.x0 + G.A + G.B / 2, G.y0 + G.A / 2 + 6, 'ab', { fill: 'c' }) + label(G.x0 + G.A / 2, G.y0 + G.A + G.B / 2 + 6, 'ab', { fill: 'c' })); } },
      { text: ' + b²', color: 'b', say: ({ a, b }) => `+ b²: the corner square: ${fmt(b * b)}. Together they fill (a + b)² = ${fmt((a + b) ** 2)}.`,
        draw: (p, u) => { const G = sqSum(p); return S.fade(u, S.rect(G.x0 + G.A, G.y0 + G.A, G.B, G.B, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(G.x0 + G.A + G.B / 2, G.y0 + G.A + G.B / 2 + 6, 'b²', { fill: 'b' })); } },
    ],
  });

  P['difference-of-squares'] = play('a² − b² = (a + b)(a − b)', {
    intro: 'Start from nothing.',
    scene({ a, b }, h, k, u) {
      const sc = Math.min(290 / a, 620 / (2 * a + b)), d = a - b, A = a * sc, Bs = b * sc, Ds = d * sc;
      const x0 = 70, y0 = 92, x1 = x0 + A + 60;
      const u0 = u(0), u1 = u(1), u2 = u(2), u3 = u(3);
      let s = S.fade(u0, S.rect(x0, y0, A, A * u0, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(x0 + A / 2, y0 - 10, fmt(a), { fill: 'a' }));
      if (u1 > 0) s += S.rect(x0 + Ds, y0 + Ds, Bs, Bs, 'card', 'b', { 'stroke-width': 1.5, ...dashed('5 5') }) + S.fade(u1, label(x0 + Ds + Bs / 2, y0 + Ds + Bs / 2 + 6, 'b²', { fill: 'b' }));
      if (d > 0 && u2 > 0) {
        s += S.rect(x0, y0, A, Ds, null, 'grid2', dashed('4 4')) + S.rect(x0, y0 + Ds, Ds, Bs, null, 'grid2', dashed('4 4'));
        const strip = lerpPt([x0, y0], [x1, y0], u2);
        s += S.rect(strip[0], strip[1], A, Ds, 'a-soft', 'a', { 'stroke-width': 1.5 });
        const c = lerpPt([x0 + Ds / 2, y0 + Ds + Bs / 2], [x1 + A + Bs / 2, y0 + Ds / 2], u2);
        s += `<g transform="translate(${c[0]} ${c[1]}) rotate(${90 * u2})">${S.rect(-Ds / 2, -Bs / 2, Ds, Bs, 'c-soft', 'c', { 'stroke-width': 1.5 })}</g>`;
        s += S.fade(u2, S.line(x1, y0 + Ds + 14, x1 + A + Bs, y0 + Ds + 14, 'ink', 2) + label(x1 + (A + Bs) / 2, y0 + Ds + 36, `a + b = ${fmt(a + b)}`, { weight: 600 }));
      } else if (u1 > 0 && d <= 0) {
        s += S.fade(u1, label(560, 200, 'a = b: nothing is left', { fill: 'muted', size: 15 }));
      }
      if (d > 0) s += S.fade(u3, S.line(x1 + A + Bs + 14, y0, x1 + A + Bs + 14, y0 + Ds, 'ink', 2) + label(x1 + A + Bs + 24, y0 + Ds / 2 + 5, `a − b = ${fmt(d)}`, { anchor: 'start', weight: 600 }) +
        S.rect(x1, y0, A + Bs, Ds, null, 'ink', { 'stroke-width': 2.5 }));
      return s;
    },
    pieces: [
      { text: 'a²', color: 'a', hl: ['a'], say: ({ a }) => `a²: a square of side ${fmt(a)}.` },
      { text: ' − b²', color: 'b', hl: [MINUS, 'b'], say: ({ b }) => `− b²: cut a ${fmt(b)} × ${fmt(b)} square out of the corner.` },
      { text: ' = (a + b)', hl: ['='], say: ({ a, b }) => `= (a + b): move the two leftover pieces into one row, ${fmt(a + b)} wide.` },
      { text: '(a − b)', hl: ['res'], say: ({ a, b }) => `(a − b): and ${fmt(a - b)} tall. One rectangle: ${fmt(a * a - b * b)}.` },
    ],
  });

  // ---------------------------------------------------------------------
  // Trigonometry
  // ---------------------------------------------------------------------

  // Squares on the sides of the triangle inside the unit circle: sin² + cos² = 1 is Pythagoras.
  const circleTri = ({ t }) => {
    const th = (t * Math.PI) / 180, c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)), R = 120;
    const Pt = (x, y) => [210 + x * R, 250 - y * R];
    return { c, s, Pt, R };
  };
  P['unit-circle'] = play('sin²θ + cos²θ = 1', {
    intro: 'A circle of radius 1, and a radius at the angle θ, folded into the first quarter.',
    backdrop: (p) => {
      const { c, s, Pt, R } = circleTri(p);
      return S.circle(210, 250, R, null, 'grid2', { 'stroke-width': 1.5 }) + S.poly([Pt(0, 0), Pt(c, 0), Pt(c, s)], 'ink-soft', null) +
        S.line(...Pt(0, 0), ...Pt(c, s), 'ink', 2.5) + label(...Pt(c / 2 - 0.12, s / 2 + 0.06), '1', { weight: 600 });
    },
    pieces: [
      { text: 'sin²θ', color: 'b', hl: ['t', 'res'], say: ({ t }) => `sin²θ: the height of the radius is sin θ = ${fmt(Math.abs(Math.sin((t * Math.PI) / 180)), 3)}. Build a square on it.`,
        draw: (p, u) => { const { c, s, Pt } = circleTri(p); return S.line(...Pt(c, 0), ...Pt(c, s), 'b', 4) + shape(Pt, [[c, 0], [c, s], [c + s * u, s], [c + s * u, 0]], 'b-soft', 'b', { 'stroke-width': 1.5 }) + S.fade(u, label(600, 160, `sin²θ = ${fmt(s * s, 3)}`, { fill: 'b', size: 16, anchor: 'start' })); } },
      { text: ' + cos²θ', color: 'a', hl: ['cos'], say: ({ t }) => `+ cos²θ: the width is cos θ = ${fmt(Math.abs(Math.cos((t * Math.PI) / 180)), 3)}. Build a square on that too.`,
        draw: (p, u) => { const { c, s, Pt } = circleTri(p); return S.line(...Pt(0, 0), ...Pt(c, 0), 'a', 4) + shape(Pt, [[0, 0], [c, 0], [c, -c * u], [0, -c * u]], 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.fade(u, label(600, 200, `cos²θ = ${fmt(c * c, 3)}`, { fill: 'a', size: 16, anchor: 'start' })); } },
      { text: ' = 1', hl: ['='], say: 'The square on the radius has area 1 × 1. By Pythagoras the two small squares add up to exactly that, at every angle.',
        draw: (p, u) => { const { c, s, Pt } = circleTri(p); const n = [-s * u, c * u]; return shape(Pt, [[0, 0], [c, s], plus([c, s], n), n], 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.fade(u, S.line(600, 218, 760, 218, 'ink', 1.5) + label(600, 244, `sum = ${fmt(c * c + s * s, 3)}`, { size: 16, anchor: 'start', weight: 600 })); } },
    ],
  });

  P.pythagoras = play('a² + b² = c²', {
    intro: 'A right triangle with legs a and b.',
    scene: (p, h, k, u, start, stop) => topicDraw('pythagoras')(p, h, remap(k, [[0, 0], [start(0), 0.12], [stop(0), 0.26], [stop(1), 0.42], [start(2) + (stop(2) - start(2)) * 0.25, 0.56], [stop(2), 1], [1, 1]])),
    pieces: [
      { text: 'a²', color: 'a', hl: ['a'], say: ({ a }) => `a²: a square on side a, area ${fmt(a * a)}.` },
      { text: ' + b²', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b²: a square on side b, area ${fmt(b * b)}.` },
      { text: ' = c²', hl: ['=', 'res'], say: ({ a, b }) => `= c²: pour both into the square on the long side. They fill it exactly: ${fmt(a * a + b * b)}.` },
    ],
  });

  const rtGeom = ({ t, h }) => {
    const th = (t * Math.PI) / 180, sc = 30, adj = h * Math.cos(th) * sc, opp = h * Math.sin(th) * sc;
    const ax = 280 - adj / 2, ay = 230 + opp / 2;
    return { th, adj, opp, A: [ax, ay], B: [ax + adj, ay], C: [ax + adj, ay - opp] };
  };
  P['right-triangle'] = play('sin θ = opp / hyp', {
    intro: 'A right triangle.',
    backdrop: (p) => { const G = rtGeom(p); return S.poly([G.A, G.B, G.C], 'ink-soft', 'grid2', { 'stroke-width': 1.5 }); },
    pieces: [
      { text: 'sin θ', color: 'c', hl: ['t'], say: ({ t }) => `sin θ: pick the ${fmt(t, 0)}° corner.`,
        draw: (p, u) => { const G = rtGeom(p), ar = 40; return S.path(`M${G.A[0] + ar} ${G.A[1]} A${ar} ${ar} 0 0 0 ${G.A[0] + ar * Math.cos(G.th)} ${G.A[1] - ar * Math.sin(G.th)}`, 'c', 3, drawOn(u)) + S.fade(u, label(G.A[0] + 54, G.A[1] - 10, `${fmt(p.t, 0)}°`, { fill: 'c', anchor: 'start', weight: 600 })); } },
      { text: ' = opp', color: 'b', hl: ['opp'], say: 'opp: the side across from that corner.',
        draw: (p, u) => { const G = rtGeom(p); return S.line(...G.B, G.B[0], lerp(G.B[1], G.C[1], u), 'b', 5) + S.fade(u, label(G.B[0] + 12, (G.B[1] + G.C[1]) / 2 + 5, `opp ${fmt(G.opp / 30)}`, { fill: 'b', anchor: 'start', weight: 600 })); } },
      { text: ' / hyp', hl: ['h'], say: 'hyp: the longest side. Divide one by the other…',
        draw: (p, u) => { const G = rtGeom(p); return S.line(...G.A, lerp(G.A[0], G.C[0], u), lerp(G.A[1], G.C[1], u), 'ink', 5) + S.fade(u, label((G.A[0] + G.C[0]) / 2 - 16, (G.A[1] + G.C[1]) / 2 - 12, `hyp ${fmt(p.h)}`, { anchor: 'end', weight: 600 })); } },
      { text: ' ≈ ratio', hl: ['res'], say: ({ t }) => `…lay them side by side: the opposite is ${fmt(Math.sin((t * Math.PI) / 180), 3)} of the hypotenuse. That fraction is sin θ.`,
        draw: (p, u) => {
          const G = rtGeom(p), len = 230, x = 520, frac = Math.sin(G.th);
          return S.fade(u, S.rect(x, 200, len, 18, 'ink-soft', 'ink', { rx: 3, 'stroke-width': 1.5 }) + S.rect(x, 200, len * frac * u, 18, 'b', null, { rx: 3 }) +
            label(x, 190, 'hypotenuse', { anchor: 'start', fill: 'muted', size: 12 }) + label(x + len / 2, 250, `opp ÷ hyp = ${fmt(frac, 3)}`, { size: 16, weight: 600 }));
        } },
    ],
  });

  // ---------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------

  const sweepMap = (start, stop) => [[0, 0], [start(0), 0.06], [stop(0), 0.26], [start(1), 0.28], [start(1) + (stop(1) - start(1)) * 0.35, 0.42], [stop(1), 0.94], [stop(2), 1], [1, 1]];
  P.rectangle = play('A = w × h', {
    intro: 'Start from a single point.',
    scene: (p, h, k, u, start, stop) => topicDraw('rectangle')(p, h, remap(k, sweepMap(start, stop))),
    pieces: [
      { parts: [[1, 'w']], color: 'a', hl: ['w'], say: ({ w }) => `w: stretch the point into a base ${fmt(w)} long.` },
      { parts: [[2, ' × h']], color: 'b', hl: ['×', 'ht'], say: ({ ht }) => `× h: raise a height of ${fmt(ht)}, and sweep the base up through it, one row at a time.` },
      { parts: [[0, 'A = ']], hl: ['=', 'res'], say: ({ w, ht }) => `A =: the area swept out, ${fmt(w * ht)} square units.` },
    ],
  });

  P.square = play('A = s²', {
    intro: 'Start from a single point.',
    scene: (p, h, k, u, start, stop) => topicDraw('square')(p, h, remap(k, sweepMap(start, stop))),
    pieces: [
      { parts: [[1, 's']], color: 'a', hl: ['s'], say: ({ s }) => `s: a side ${fmt(s)} long.` },
      { parts: [[2, '²']], hl: ['sq'], say: ({ s }) => `²: the same length again, straight up, and sweep: ${fmt(s)} rows of ${fmt(s)}.` },
      { parts: [[0, 'A = ']], hl: ['=', 'res'], say: ({ s }) => `A =: ${fmt(s * s)} square units.` },
    ],
  });

  P.parallelogram = play('A = b × h', {
    intro: 'Start from nothing.',
    scene({ b, ht, off }, h, k, u) {
      const { P: Pt } = fit(0, b + off, -0.3, ht + 0.4, { x: 80, y: 90, w: 640, h: 290 }, 55);
      const u0 = u(0), u1 = u(1), u2 = u(2), o = off * (1 - u2);
      let s = S.line(...Pt(0, 0), ...Pt(b * u0, 0), 'a', 4) + S.fade(u0, label(...Pt(b / 2, 0).map((v, i) => v + (i ? 24 : 0)), fmt(b), { fill: 'a', weight: 600 }));
      if (u1 > 0) {
        s += S.line(...Pt(off, 0), ...Pt(off, ht * u1), 'b', 2, dashed('5 5')) + S.fade(u1, label(...Pt(off, ht / 2).map((v, i) => v + (i ? 0 : 10)), fmt(ht), { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.fade(u1, shape(Pt, [[0, 0], [b, 0], [b + o, ht], [o, ht]], u2 > 0 ? 'ink-soft' : null, 'ink', { 'stroke-width': 2.5 }));
      }
      if (u2 > 0) s += S.fade(u2, label(...Pt(b / 2, ht / 2), `${fmt(b)} × ${fmt(ht)} = ${fmt(b * ht)}`, { size: 17, weight: 600 }));
      return s;
    },
    pieces: [
      { parts: [[1, 'b']], color: 'a', hl: ['b'], say: ({ b }) => `b: a base of ${fmt(b)}.` },
      { parts: [[2, ' × h']], color: 'b', hl: ['×', 'ht'], say: ({ ht }) => `× h: the top side, ${fmt(ht)} above it, slanted sideways.` },
      { parts: [[0, 'A = ']], hl: ['=', 'res'], say: 'A =: slide the top straight over. Every slice keeps its length, so the area doesn’t change: it’s the rectangle b × h.' },
    ],
  });

  P.trapezoid = play('A = ½(a + b)h', {
    intro: 'A trapezoid, with parallel sides a and b, a height h apart.',
    scene({ a, b, ht }, h, k, u) {
      const sc = Math.min(36, 300 / (a + b), 250 / ht), base = 360, lx = 60, rx = 420, d = ((b - a) / 2) * sc;
      const u0 = u(0), u1 = u(1), u2 = u(2), u3 = u(3);
      let s = S.fade(seg(k, 0, 0.04), S.poly([[lx, base], [lx + b * sc, base], [lx + d + a * sc, base - ht * sc], [lx + d, base - ht * sc]], 'ink-soft', 'ink', { 'stroke-width': 2 }) +
        label(lx + (b * sc) / 2, base + 22, `b = ${fmt(b)}`, { fill: 'b' }) + label(lx + d + (a * sc) / 2, base - ht * sc - 10, `a = ${fmt(a)}`, { fill: 'a' }));
      // On the right: a laid end to end with b, then the rectangle (a + b) × h, then its half.
      s += S.line(rx, base, rx + a * sc * u0, base, 'a', 5);
      s += S.line(rx + a * sc, base, rx + a * sc + b * sc * u1, base, 'b', 5);
      s += S.fade(u1, label(rx + ((a + b) * sc) / 2, base + 24, `a + b = ${fmt(a + b)}`, { weight: 600 }));
      if (u2 > 0) s += S.rect(rx, base - ht * sc * u2, (a + b) * sc, ht * sc * u2, null, 'ink', { 'stroke-width': 2 }) + S.fade(u2, label(rx + (a + b) * sc + 10, base - (ht * sc) / 2, `h = ${fmt(ht)}`, { anchor: 'start', fill: 'c', weight: 600 }));
      if (u3 > 0) {
        // The slanted cut splits the rectangle into two trapezoids with sides a and b: each one is half.
        s += S.fade(u3, S.poly([[rx, base], [rx + b * sc, base], [rx + a * sc, base - ht * sc], [rx, base - ht * sc]], 'c-soft', 'c', { 'stroke-width': 2 }));
        s += S.line(rx + b * sc, base, lerp(rx + b * sc, rx + a * sc, u3), lerp(base, base - ht * sc, u3), 'c', 3);
        s += S.fade(u3, label(rx + ((a + b) * sc) / 2, base - ht * sc - 14, `half of ${fmt((a + b) * ht)} = ${fmt(((a + b) / 2) * ht)}`, { weight: 600, size: 16 }));
      }
      return s;
    },
    pieces: [
      { parts: [[1, '(a']], color: 'a', hl: ['a'], say: ({ a }) => `(a: take the top side, ${fmt(a)}…` },
      { parts: [[2, ' + b)']], color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b): …and put the bottom side, ${fmt(b)}, on the end of it.` },
      { parts: [[3, 'h']], color: 'c', hl: ['ht'], say: ({ a, b, ht }) => `h: raise that combined base by the height: a rectangle (a + b) × h = ${fmt((a + b) * ht)}.` },
      { parts: [[0, 'A = ½']], hl: ['½', '=', 'res'], say: 'A = ½: one slanted cut splits the rectangle into two trapezoids with sides a and b. Each is exactly half.' },
    ],
  });

  const circ = ({ r }) => { const sc = Math.min(26, 110 / r); return { R: r * sc, cx: 210, cy: 250 }; };
  P.circle = play('A = πr²', {
    intro: 'Start from nothing.',
    pieces: [
      { parts: [[0, 'A = ']], hl: [], say: 'A =: the area inside a circle.',
        draw: (p, u) => { const { R, cx, cy } = circ(p); return S.circle(cx, cy, R, 'ink-soft', 'ink', { 'stroke-width': 2, ...drawOn(u) }); } },
      { parts: [[2, 'r']], color: 'a', hl: ['r'], say: ({ r }) => `r: the radius, ${fmt(r)}.`,
        draw: (p, u) => { const { R, cx, cy } = circ(p); return S.line(cx, cy, cx + R * u, cy, 'a', 4) + S.fade(u, label(cx + R / 2, cy + 22, `r = ${fmt(p.r)}`, { fill: 'a', weight: 600 })); } },
      { parts: [[3, '²']], color: 'b', hl: ['sq'], say: ({ r }) => `²: a square on the radius, r × r = ${fmt(r * r)}. It covers a corner of the circle and pokes out.`,
        draw: (p, u) => { const { R, cx, cy } = circ(p); return S.rect(cx, cy - R * u, R, R * u, 'b-soft', 'b', { 'stroke-width': 2 }); } },
      { parts: [[1, 'π']], color: 'c', hl: ['π', 'res'], say: ({ r }) => `π: about 3.14 of those squares hold exactly as much as the circle: π × ${fmt(r * r)} = ${fmt(Math.PI * r * r)}.`,
        draw: (p, u) => {
          const { R, cy } = circ(p), x0 = 420;
          let s = '';
          for (let i = 0; i < 4; i++) {
            const w = i < 3 ? R : R * (Math.PI - 3), ui = Math.max(0, Math.min(1, u * 4 - i));
            if (ui > 0) s += S.fade(ui, S.rect(x0 + i * (R + 6), cy - R, w, R, 'b-soft', 'b', { 'stroke-width': 1.5 }) + (i < 3 ? label(x0 + i * (R + 6) + R / 2, cy - R / 2 + 5, String(i + 1), { fill: 'b', weight: 600 }) : ''));
          }
          return s + S.fade(u, label(x0 + 1.6 * R, cy + 30, `3.14… squares = the circle`, { fill: 'c', weight: 600, size: 15 }));
        } },
    ],
  });

  const polyG = ({ n, s }) => {
    const Rr = s / (2 * Math.sin(Math.PI / n)), ap = s / (2 * Math.tan(Math.PI / n)), Pm = n * s;
    const sc2 = Math.min(30, 90 / Rr), cx = 150, cy = 170;
    const V = (i) => { const phi = Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n; return [cx + Rr * sc2 * Math.cos(phi), cy + Rr * sc2 * Math.sin(phi)]; };
    const sc = Math.min(40, 600 / Pm, 150 / ap), x0 = 400 - (Pm * sc) / 2, base = 380;
    return { ap, Pm, V, cx, cy, sc, x0, base };
  };
  P.polygon = play('A = ½ × P × a', {
    intro: 'A regular polygon.',
    backdrop: (p) => { const G = polyG(p); return S.poly(Array.from({ length: p.n }, (_, i) => G.V(i)), 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.line(G.cx, G.cy, ...lerpPt(G.V(p.n - 1), G.V(p.n), 0.5), 'c', 2, dashed('4 4')); },
    pieces: [
      { parts: [[2, 'P']], color: 'b', hl: ['n', 's'], say: ({ n, s }) => `P: unroll the perimeter, ${fmt(n, 0)} sides of ${fmt(s)}, into one line: ${fmt(n * s)}.`,
        draw: (p, u) => { const G = polyG(p); let o = ''; for (let i = 0; i < p.n; i++) { const ui = Math.max(0, Math.min(1, u * p.n - i)); if (ui > 0) o += S.line(G.x0 + i * p.s * G.sc + 1, G.base, G.x0 + (i + ui) * p.s * G.sc - 1, G.base, i % 2 ? 'b' : 'a', 5); } return o + S.fade(u, label(400, G.base + 24, `P = ${fmt(G.Pm)}`, { fill: 'b', weight: 600 })); } },
      { parts: [[3, ' × a']], color: 'c', hl: ['ap'], say: ({ n, s }) => `× a: raise it by the apothem, ${fmt(s / (2 * Math.tan(Math.PI / n)))}: a rectangle P × a.`,
        draw: (p, u) => { const G = polyG(p); const hh = G.ap * G.sc * u; return S.rect(G.x0, G.base - hh, G.Pm * G.sc, hh, null, 'ink', { 'stroke-width': 2 }) + S.fade(u, label(G.x0 - 10, G.base - hh / 2 + 5, 'a', { fill: 'c', anchor: 'end', weight: 600 })); } },
      { parts: [[0, 'A = '], [1, '½ × ']], hl: ['½', '=', 'res'], say: ({ n, s }) => `½: the polygon’s ${fmt(n, 0)} triangles stand in the rectangle, point up. They fill exactly half of it: ${fmt(0.5 * n * s * (s / (2 * Math.tan(Math.PI / n))))}.`,
        draw: (p, u) => { const G = polyG(p); let o = ''; const hh = G.ap * G.sc; for (let i = 0; i < p.n; i++) { const ui = Math.max(0, Math.min(1, u * p.n - i)); if (ui <= 0) continue; const xa = G.x0 + i * p.s * G.sc, xb = xa + p.s * G.sc; o += S.fade(ui, S.poly([[xa, G.base], [xb, G.base], [(xa + xb) / 2, G.base - hh]], 'c-soft', 'c', { 'stroke-width': 1.5 })); } return o; } },
    ],
  });

  // Every triangle: base, height, then the top corner slides over the end of the base. Same base, same height,
  // same area, and now it's plainly half of the rectangle.
  function triPlay(name, get) {
    return play(name, {
      intro: 'Start from nothing.',
      scene(p, h, k, u) {
        const { b, ht, px, bl, hl } = get(p);
        const xs = [0, b, px], { P: Pt } = fit(Math.min(...xs) - 0.3, Math.max(...xs) + 0.3, -0.3, ht + 0.4, { x: 80, y: 88, w: 640, h: 290 }, 55);
        const u0 = u(0), u1 = u(1), u2 = u(2);
        const apex = [lerp(px, 0, u2), ht * u1];
        let s = S.line(...Pt(0, 0), ...Pt(b * u0, 0), 'a', 4) + S.fade(u0, label(...Pt(b / 2, 0).map((v, i) => v + (i ? 24 : 0)), `${bl} = ${fmt(b)}`, { fill: 'a', weight: 600 }));
        if (u1 > 0) {
          s += S.fade(u1, S.rect(...Pt(0, ht), Pt(b, 0)[0] - Pt(0, 0)[0], Pt(0, 0)[1] - Pt(0, ht)[1], null, 'grid2', { 'stroke-width': 1.5, ...dashed('5 5') }));
          s += shape(Pt, [[0, 0], [b, 0], apex], 'ink-soft', 'ink', { 'stroke-width': 2.5 });
          s += S.line(...Pt(apex[0], 0), ...Pt(...apex), 'b', 2, dashed('4 4')) + S.fade(u1, label(...Pt(apex[0], ht / 2).map((v, i) => v + (i ? 0 : 10)), `${hl} = ${fmt(ht)}`, { fill: 'b', anchor: 'start', weight: 600 }));
          if (u1 >= 1 && (px < 0 || px > b) && u2 < 1) s += S.line(...Pt(px < 0 ? 0 : b, 0), ...Pt(apex[0], 0), 'muted', 1.5, dashed('3 5'));
        }
        if (u2 > 0) s += S.fade(u2, S.line(...Pt(b, 0), ...Pt(0, ht), 'c', 2.5) + S.rect(...Pt(0, ht), Pt(b, 0)[0] - Pt(0, 0)[0], Pt(0, 0)[1] - Pt(0, ht)[1], null, 'ink', { 'stroke-width': 2 }) +
          label(...Pt(b * 0.3, ht * 0.3), `½ × ${fmt(b)} × ${fmt(ht)} = ${fmt(0.5 * b * ht)}`, { size: 16, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, get({}).bl || 'b']], color: 'a', hl: [get.keys[0]], say: (p) => `${get(p).bl}: the base, ${fmt(get(p).b)}.` },
        { parts: [[3, ` × ${get({}).hl || 'h'}`]], color: 'b', hl: ['×', get.keys[1]], say: (p) => `× ${get(p).hl}: raise the top corner to a height of ${fmt(get(p).ht)}. The dashed box is ${get(p).bl} × ${get(p).hl}.` },
        { parts: [[0, 'A = '], [1, '½ × ']], hl: ['½', '=', 'res'], say: 'A = ½: slide the top corner along to sit above the end of the base. Same base, same height, same area, and now it’s clearly half the box.' },
      ],
    });
  }
  const tri = (keys, fn) => Object.assign(fn, { keys });
  P['tri-any'] = triPlay('A = ½ × b × h', tri(['b', 'ht'], ({ b = 0, ht = 0, px = 0 }) => ({ b, ht, px, bl: 'b', hl: 'h' })));
  P['tri-acute'] = triPlay('A = ½ × b × h', tri(['b', 'ht'], ({ b = 0, ht = 0, px = 0 }) => ({ b, ht, px, bl: 'b', hl: 'h' })));
  P['tri-obtuse'] = triPlay('A = ½ × b × h', tri(['b', 'ht'], ({ b = 0, ht = 0, e = 0 }) => ({ b, ht, px: b + e, bl: 'b', hl: 'h' })));
  P['tri-right'] = triPlay('A = ½ × a × b', tri(['a', 'b'], ({ a = 0, b = 0 }) => ({ b: a, ht: b, px: 0, bl: 'a', hl: 'b' })));

  // Isosceles height by Pythagoras on one half: the square on the leg, minus the square on half the base,
  // leaves exactly the square on the height.
  P['tri-isosceles'] = play('h = √(l² − (b/2)²)', {
    intro: 'Half of the isosceles triangle: a right triangle with the leg l as its long side.',
    scene({ b, l }, hh, k, u) {
      const p = b / 2, q = Math.sqrt(Math.max(0, l * l - p * p));
      const { P: Pt } = fit(-q, p + q, -p, q + p, { x: 140, y: 80, w: 520, h: 320 }, 40);
      const B = [p, 0], C = [0, q], n = [q, p], dir = [-p / l, q / l];
      const H = [p + dir[0] * (p * p) / l, dir[1] * (p * p) / l];
      const rectB = [B, H, plus(H, n), plus(B, n)], rectC = [H, C, plus(C, n), plus(H, n)];
      const u0 = u(0), u1 = u(1), u2 = u(2);
      let s = S.fade(seg(k, 0, 0.04), shape(Pt, [[0, 0], B, C], 'paper', 'ink', { 'stroke-width': 2.5 }) + label(...Pt(p / 2, 0).map((v, i) => v + (i ? 20 : 0)), 'b/2', { fill: 'a' }) + label(...Pt(0, q / 2).map((v, i) => v + (i ? 0 : -8)), 'h', { fill: 'c', anchor: 'end' }));
      if (u0 > 0) s += shape(Pt, [B, C, plus(C, [q * u0, p * u0]), plus(B, [q * u0, p * u0])], u1 > 0 ? null : 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.fade(u0, label(...Pt(p / 2 + q / 2, q / 2 + p / 2), `l² = ${fmt(l * l)}`, { size: 15, weight: 600 }));
      if (u1 > 0) {
        s += shape(Pt, [[0, 0], B, [p, -p * u1], [0, -p * u1]], 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.fade(u1, label(...Pt(p / 2, -p / 2), `${fmt(p * p)}`, { fill: 'a' }));
        s += S.fade(1 - u2, shape(Pt, rectB, null, 'a', { 'stroke-width': 1.5, ...dashed('4 4') }));
        s += shape(Pt, rectC, u2 > 0 ? null : 'c-soft', 'c', { 'stroke-width': 1.5 });
      }
      if (u2 > 0) {
        s += shape(Pt, MV.morph(rectC, [[0, 0], C, [-q, q], [-q, 0]], u2), 'c-soft', 'c', { 'stroke-width': 1.5 });
        s += S.line(...Pt(0, 0), ...Pt(0, q), 'c', 5) + S.fade(u2, label(...Pt(-q / 2, q / 2), `h² = ${fmt(q * q)}`, { fill: 'c', size: 15, weight: 600 }) + label(...Pt(-q / 2, -0.3 * p).map((v, i) => v + (i ? 10 : 0)), `h = √${fmt(q * q)} = ${fmt(q)}`, { size: 16, weight: 600 }));
      }
      return s;
    },
    pieces: [
      { parts: [[2, 'l²']], hl: ['l'], say: ({ l }) => `l²: a square on the leg l: ${fmt(l * l)}.` },
      { parts: [[3, ' − (b/2)²']], color: 'a', hl: ['b'], say: ({ b }) => `− (b/2)²: the square on half the base is ${fmt((b / 2) ** 2)}. Take that much away; what’s left is the part on the other side of the dashed line.` },
      { parts: [[0, 'h = '], [1, '√('], [4, ')']], color: 'c', hl: ['hgt', 'res'], say: ({ b, l }) => `h = √: what’s left is exactly a square on the height. Its side is the height: ${fmt(Math.sqrt(l * l - (b * b) / 4))}.` },
    ],
  });

  P['tri-equilateral'] = play('A = (√3/4) × s²', {
    intro: 'Start from nothing.',
    scene({ s }, hh, k, u) {
      const sc = Math.min(40, 280 / s), S2 = s * sc, x0 = 400 - S2 / 2, base = 380;
      const u0 = u(0), u1 = u(1), u2 = u(2);
      let o = S.line(x0, base, x0 + S2 * u0, base, 'a', 4) + S.fade(u0, label(400, base + 24, `s = ${fmt(s)}`, { fill: 'a', weight: 600 }));
      if (u1 > 0) o += S.rect(x0, base - S2 * u1, S2, S2 * u1, 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.fade(u1, label(x0 + S2 + 10, base - S2 / 2, `s² = ${fmt(s * s)}`, { fill: 'a', anchor: 'start', weight: 600 }));
      if (u2 > 0) o += S.fade(u2, S.poly([[x0, base], [x0 + S2, base], [x0 + S2 / 2, base - S2 * (Math.sqrt(3) / 2) * u2]], 'c-soft', 'c', { 'stroke-width': 2.5 }) +
        label(400, base - S2 - 16, `the triangle is 43.3% of the square: ${fmt((Math.sqrt(3) / 4) * s * s)}`, { fill: 'c', weight: 600, size: 15 }));
      return o;
    },
    pieces: [
      { parts: [[2, ' s']], color: 'a', hl: ['s'], say: ({ s }) => `s: a side of ${fmt(s)}.` },
      { parts: [[3, '²']], color: 'a', hl: ['sq'], say: ({ s }) => `²: the square on that side, ${fmt(s * s)}.` },
      { parts: [[0, 'A = '], [1, '(√3/4) ×']], color: 'c', hl: ['=', 'res'], say: 'A = √3/4: the equilateral triangle on the same side fits inside, and covers √3/4 ≈ 0.433 of the square.' },
    ],
  });

  // Heron's formula keeps its own hand-built play.
  if (MV.demos?.heron) {
    P['tri-scalene'] = { ...MV.demos.heron, name: 'Heron’s formula', preview: [[0, 'A = √(', 5], [1, 's', 0], [2, '(s − a)', 1], [3, '(s − b)', 2], [4, '(s − c)', 3], [5, ')', 5]] };
  }

  // ---------------------------------------------------------------------
  // Physics (fixed example numbers)
  // ---------------------------------------------------------------------

  const NL10 = () => numberLine(0, 10, 280, 80, 720);
  P['p-add'] = play('x = x₁ + x₂', {
    intro: 'Two moves along a line: 3 m, then 4 m.',
    backdrop: () => NL10().svg + label(720, 330, 'metres', { fill: 'muted', size: 11, anchor: 'end' }),
    pieces: [
      { parts: [[1, 'x₁']], color: 'a', say: 'x₁: the first move, 3 m.', draw: (p, u) => { const { X } = NL10(); return S.arrow(X(0), 220, X(3 * u), 220, 'a', 4) + S.fade(u, label(X(1.5), 204, '3 m', { fill: 'a', weight: 600 })); } },
      { parts: [[2, ' + x₂']], color: 'b', say: 'x₂: the second move, 4 m, starting where the first ended.', draw: (p, u) => { const { X } = NL10(); return S.arrow(X(3), 160, X(3 + 4 * u), 160, 'b', 4) + S.fade(u, label(X(5), 144, '4 m', { fill: 'b', weight: 600 })); } },
      { parts: [[0, 'x = ']], say: 'x =: the total, 7 m. Same kind of quantity, same unit, so the sizes simply add.', draw: (p, u) => { const { X } = NL10(); return S.arrow(X(0), 350, X(7 * u), 350, 'ink', 4.5) + S.fade(u, label(X(3.5), 380, 'x = 7 m', { weight: 600, size: 16 })); } },
    ],
  });

  P['p-sub'] = play('Δx = x₂ − x₁', {
    intro: 'Something moves from 2 m to 7 m.',
    backdrop: () => NL10().svg,
    pieces: [
      { parts: [[2, ' − x₁']], color: 'b', say: 'x₁: where it started, 2 m.', draw: (p, u) => { const { X } = NL10(); return S.fade(u, S.circle(X(2), 280, 9, 'b') + label(X(2), 254, 'start, 2 m', { fill: 'b', weight: 600 })); } },
      { parts: [[1, 'x₂']], color: 'a', say: 'x₂: where it ended, 7 m.', draw: (p, u) => { const { X } = NL10(); return S.fade(u, S.circle(X(7), 280, 9, 'a') + label(X(7), 254, 'end, 7 m', { fill: 'a', weight: 600 })); } },
      { parts: [[0, 'Δx = ']], say: 'Δx =: the change is end minus start: 5 m, and positive, so it moved forward.', draw: (p, u) => { const { X } = NL10(); return S.arrow(X(2), 340, X(2 + 5 * u), 340, 'ink', 4.5) + S.fade(u, label(X(4.5), 372, 'Δx = 5 m', { weight: 600, size: 16 })); } },
    ],
  });

  const vt = () => { const X = (t) => 110 + t * 100, Y = (v) => 370 - v * 26; return { X, Y, axes: S.line(X(0), Y(0), X(6.3), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(11), 'grid2', 1.5) + label(X(6.3), Y(0) + 22, 'time (s)', { fill: 'muted', size: 12, anchor: 'end' }) + label(X(0) + 6, Y(11), 'speed (m/s)', { fill: 'muted', size: 12, anchor: 'start' }) }; };
  P['p-mul'] = play('d = v × t', {
    intro: 'A speed against time graph, for something moving steadily at 4 m/s.',
    backdrop: () => vt().axes,
    pieces: [
      { parts: [[1, 'v']], color: 'a', say: 'v: a steady 4 m/s, a flat line.', draw: (p, u) => { const { X, Y } = vt(); return S.line(X(0), Y(4), X(6 * u), Y(4), 'a', 3.5) + S.fade(u, label(X(0) - 10, Y(4) + 5, '4', { fill: 'a', anchor: 'end', weight: 600 })); } },
      { parts: [[2, ' × t']], color: 'b', say: '× t: keep it up for 5 s. Each second adds a 4 m strip.', draw: (p, u) => { const { X, Y } = vt(); let s = S.rect(X(0), Y(4), X(5 * u) - X(0), Y(0) - Y(4), 'b-soft', null); for (let i = 1; i < 5 * u; i++) s += S.line(X(i), Y(0), X(i), Y(4), 'b', 1, { opacity: 0.5 }); return s + S.fade(u, label(X(2.5), Y(0) + 22, '5 s', { fill: 'b', weight: 600 })); } },
      { parts: [[0, 'd = ']], say: 'd =: the area under the line is the distance: 4 × 5 = 20 m.', draw: (p, u) => { const { X, Y } = vt(); return S.fade(u, S.rect(X(0), Y(4), X(5) - X(0), Y(0) - Y(4), null, 'ink', { 'stroke-width': 2 }) + label(X(2.5), Y(2) + 6, 'd = 20 m', { size: 18, weight: 600 })); } },
    ],
  });

  P['p-div'] = play('ρ = m / V', {
    intro: 'A 12 kg block that takes up 4 litres.',
    pieces: [
      { parts: [[1, 'm']], color: 'a', say: 'm: 12 kg of mass, all in one pile.',
        draw: (p, u, U) => { let s = ''; const go = U(1); for (let i = 0; i < Math.ceil(12 * u - 1e-9); i++) { const pile = [328 + (i % 6) * 24, 110 + Math.floor(i / 6) * 24]; const cube = i % 4, slot = Math.floor(i / 4); const tgt = [190 + cube * 140 + slot * 22, 300]; s += S.circle(...lerpPt(pile, tgt, MV.ease(Math.max(0, Math.min(1, go * 1.6 - i * 0.05)))), 8, 'a'); } return s; } },
      { parts: [[2, ' / V']], color: 'b', say: '/ V: share it out evenly over the 4 litres.',
        draw: (p, u) => { let s = ''; for (let i = 0; i < 4; i++) s += S.fade(Math.min(1, u * 2), S.rect(160 + i * 140, 260, 110, 80, null, 'b', { rx: 6, 'stroke-width': 2 }) + label(215 + i * 140, 360, '1 litre', { fill: 'b', size: 12 })); return s; } },
      { parts: [[0, 'ρ = ']], say: 'ρ =: each litre holds 3 kg. That’s the density, 3 kg per litre.',
        draw: (p, u) => S.fade(u, label(400, 400, 'ρ = 12 ÷ 4 = 3 kg per litre', { size: 18, weight: 600 })) },
    ],
  });

  const vtFall = () => { const X = (t) => 120 + t * 150, Y = (v) => 380 - v * 9; return { X, Y, axes: S.line(X(0), Y(0), X(3.4), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(32), 'grid2', 1.5) + label(X(3.4), Y(0) + 22, 'time (s)', { fill: 'muted', size: 12, anchor: 'end' }) + label(X(0) + 6, Y(32), 'speed (m/s)', { fill: 'muted', size: 12, anchor: 'start' }) }; };
  P['p-pow'] = play('d = ½ g t²', {
    intro: 'A falling ball’s speed against time (g = 9.8 m/s², for 3 s).',
    backdrop: () => vtFall().axes,
    pieces: [
      { parts: [[2, 'g ']], color: 'a', say: 'g: every second, the speed grows by 9.8 m/s. A straight line, rising.', draw: (p, u) => { const { X, Y } = vtFall(); return S.line(X(0), Y(0), X(3 * u), Y(9.8 * 3 * u), 'a', 3.5); } },
      { parts: [[3, 't²']], color: 'b', say: 't²: after t = 3 s the speed is g × t = 29.4 m/s. The box t by gt has area g × t × t = g t².', draw: (p, u) => { const { X, Y } = vtFall(); return S.fade(u, S.rect(X(0), Y(29.4), X(3) - X(0), Y(0) - Y(29.4), null, 'b', { 'stroke-width': 2, ...dashed('5 5') }) + label(X(3) + 8, Y(29.4) + 5, 'gt', { fill: 'b', anchor: 'start', weight: 600 }) + label(X(1.5), Y(0) + 22, 't', { fill: 'b', weight: 600 })); } },
      { parts: [[1, '½ ']], color: 'c', say: '½: the distance is the area under the line: the triangle, exactly half the box.', draw: (p, u) => { const { X, Y } = vtFall(); return S.fade(u, S.poly([[X(0), Y(0)], [X(3), Y(0)], [X(3), Y(29.4)]], 'c-soft', 'c', { 'stroke-width': 2 })); } },
      { parts: [[0, 'd = ']], say: 'd =: ½ × 9.8 × 3² = 44.1 m. Double the time and the triangle is four times bigger.', draw: (p, u) => { const { X, Y } = vtFall(); return S.fade(u, label(X(2), Y(8), 'd = 44.1 m', { size: 18, weight: 600 })); } },
    ],
  });

  const puck = (x, y, ghost) => (ghost ? S.rect(x - 22, y - 26, 44, 26, null, 'grid2', { rx: 8, 'stroke-width': 1.5 }) : S.rect(x - 22, y - 26, 44, 26, 'ink', null, { rx: 8 }));
  P['n-first'] = play('ΣF = 0 ⇒ Δv = 0', {
    intro: 'A puck, already sliding to the right.',
    backdrop: () => S.line(60, 300, 740, 300, 'grid2', 1.5),
    pieces: [
      { parts: [[0, 'ΣF']], color: 'a', say: 'ΣF: add up every force on it. Here, two equal pushes in opposite directions.', draw: (p, u, U) => { const o = 1 - U(1); return S.fade(o, S.arrow(200, 260, 200 + 90 * u, 260, 'a', 4) + S.arrow(140, 260, 140 - 90 * u, 260, 'b', 4)) + puck(170, 300); } },
      { parts: [[1, ' = 0']], hl: [], say: '= 0: they cancel. The net force is zero.', draw: (p, u) => S.fade(u * (1 - seg(u, 0.7, 1)), label(170, 230, 'net force 0', { size: 15, weight: 600 })) },
      { parts: [[2, ' ⇒ Δv = 0']], color: 'c', say: '⇒ Δv = 0: so its velocity doesn’t change. Equal gaps, every half second, forever.', draw: (p, u) => { let s = ''; const steps = Math.floor(u * 8); for (let i = 1; i <= steps; i++) s += puck(170 + i * 64, 300, i < steps); return s; } },
    ],
  });

  P['n-second'] = play('F = m × a', {
    intro: 'A block of 3 kg, to be given an acceleration of 2 m/s².',
    backdrop: () => S.line(60, 330, 740, 330, 'grid2', 1.5),
    pieces: [
      { parts: [[1, 'm']], color: 'b', say: 'm: the mass, 3 kg: three 1 kg blocks.', draw: (p, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.fade(Math.max(0, Math.min(1, u * 3 - i)), S.rect(170 + i * 52, 278, 48, 50, 'b-soft', 'b', { rx: 4, 'stroke-width': 1.5 }) + label(194 + i * 52, 308, '1 kg', { fill: 'b', size: 12 })); return s; } },
      { parts: [[2, ' × a']], color: 'a', say: '× a: each kilogram needs 1 N for every 1 m/s² of acceleration: 2 N each to reach 2 m/s².', draw: (p, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.arrow(194 + i * 52 - 30, 250, 194 + i * 52 - 30 + 50 * u, 250, 'a', 3); return s + S.fade(u, label(220, 230, '2 N on each kilogram', { fill: 'a', size: 13 })); } },
      { parts: [[0, 'F = ']], say: 'F =: lay the three pushes end to end: one push of 3 × 2 = 6 N moves the whole block.', draw: (p, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.arrow(170 + i * 52, 380, 170 + i * 52 + 50 * u, 380, 'ink', 3.5); return s + S.fade(u, label(248, 410, 'F = 3 × 2 = 6 N', { size: 17, weight: 600 })); } },
    ],
  });

  P['n-third'] = play('F(A→B) = −F(B→A)', {
    intro: 'Two blocks touching: A on the left, B on the right.',
    backdrop: () => S.line(120, 320, 680, 320, 'grid2', 1.5) + S.rect(290, 240, 110, 80, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 }) + label(345, 286, 'A', { fill: 'b', size: 18, weight: 600 }) + S.rect(400, 220, 140, 100, 'c-soft', 'c', { rx: 4, 'stroke-width': 2 }) + label(470, 276, 'B', { fill: 'c', size: 18, weight: 600 }),
    pieces: [
      { parts: [[0, 'F(A→B)']], color: 'a', say: 'F(A→B): A pushes on B, to the right.', draw: (p, u) => S.arrow(404, 200, 404 + 130 * u, 200, 'a', 4.5) + S.fade(u, label(470, 186, '6 N on B', { fill: 'a', weight: 600 })) },
      { parts: [[1, ' = −']], say: '= −: the reply is the same size, flipped round…', draw: (p, u) => S.fade(u * (1 - seg(u, 0.8, 1)), S.line(400, 150, 400, 340, 'c', 2, dashed('4 4'))) },
      { parts: [[2, 'F(B→A)']], color: 'a', say: 'F(B→A): …B pushes back on A with exactly the same 6 N, to the left. Each force acts on a different block.', draw: (p, u) => S.arrow(396, 200, 396 - 130 * u, 200, 'a', 4.5) + S.fade(u, label(330, 186, '6 N on A', { fill: 'a', weight: 600 })) },
    ],
  });
})();
