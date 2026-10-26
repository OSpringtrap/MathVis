(() => {
  'use strict';
  const { S, fmt, dashed, seg, lin, lerp, lerpPt, rot, drawOn, fit, ease, centroid, M, sfx, pitch, note } = MV;
  const G = 'Geometry', TRI = 'Triangles';
  const op = (s) => `<span class="op">${s}</span>`;
  const HALF = '<span class="op hf">½</span>';
  const PI = '<span class="op hf">π</span>';

  // Screen-space polygon from world points.
  const shape = (P, pts, fill, stroke, extra = {}) => S.poly(pts.map(([x, y]) => P(x, y)), fill, stroke, { 'stroke-width': 2, ...extra });
  // A line from p toward q, drawn u of the way.
  const grow = (P, p, q, u, color, w = 3.5, extra = {}) => (u <= 0 ? '' : S.line(...P(...p), ...P(...lerpPt(p, q, u)), color, w, extra));
  const label = (P, [x, y], str, o = {}) => { const [sx, sy] = P(x, y); return S.text(sx + (o.dx || 0), sy + (o.dy || 0), str, { size: 14, ...o }); };
  // Point reflection through c, turned 180·u degrees on the way.
  const turn = (pts, c, u) => pts.map((p) => rot(p, c, 180 * u));
  const shift = (pts, [dx, dy]) => pts.map(([x, y]) => [x + dx, y + dy]);
  // An arc of radius r around centre c (world), spanning angles a0..a1 (radians), as a path.
  const arc = (P, c, r, a0, a1) => {
    let d = '';
    for (let i = 0; i <= 32; i++) {
      const a = lerp(a0, a1, i / 32), [x, y] = P(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a));
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return d;
  };
  const rightMark = (P, corner, dirA, dirB, size) => {
    const p1 = [corner[0] + dirA[0] * size, corner[1] + dirA[1] * size];
    const p2 = [p1[0] + dirB[0] * size, p1[1] + dirB[1] * size];
    const p3 = [corner[0] + dirB[0] * size, corner[1] + dirB[1] * size];
    return S.path(`M${P(...p1)} L${P(...p2)} L${P(...p3)}`, 'ink', 1.5);
  };
  // A cut: a bright line with a soft glow, drawn on from one end.
  const slash = (P, from, to, u) => (u <= 0 ? '' :
    S.line(...P(...from), ...P(...lerpPt(from, to, u)), 'c', 10, { opacity: 0.18 }) +
    S.line(...P(...from), ...P(...lerpPt(from, to, u)), 'c', 2.5));

  // A copy turns half a turn to complete a bigger shape, the bigger shape is cut back in half,
  // and the copy leaves. What remains is the original, and it's exactly half of the bigger shape.
  function doubleAndHalve(P, orig, pivot, cut, whole, k, ph) {
    const uT = seg(k, ...ph.turn), uW = seg(k, ...ph.whole), uS = seg(k, ...ph.slash), uL = seg(k, ...ph.leave);
    const c0 = centroid(orig), c1 = centroid(turn(orig, pivot, 1));
    const away = [(c1[0] - c0[0]) * 0.9 * uL, (c1[1] - c0[1]) * 0.9 * uL];
    let s = S.fade(uW * (1 - uL), shape(P, whole, null, 'ink', { 'stroke-width': 2.5 }));
    s += S.fade(seg(k, ph.turn[0], ph.turn[0] + 0.04) * (1 - uL), shape(P, shift(turn(orig, pivot, uT), away), 'c-soft', 'c', { 'stroke-width': 1.5 }));
    s += S.fade(1 - uL, slash(P, cut[0], cut[1], uS));
    return s;
  }
  const HALVE = { turn: [0.42, 0.6], whole: [0.6, 0.66], slash: [0.7, 0.78], leave: [0.8, 0.92] };
  const halveSfx = [sfx.whoosh(0.42, 0.6), sfx.tick(0.61, note(7)), sfx.snip(0.7), sfx.snip(0.75), sfx.swoosh(0.8, 0.92)];

  // A dot becomes a base, a perpendicular height rises, then the base sweeps upward one unit at a time.
  function sweepRect(cols, rows, k, heightColor) {
    const unit = Math.min(52, 600 / cols, 280 / rows);
    const W = cols * unit, H = rows * unit, x0 = (800 - W) / 2, yB = 205 + H / 2;
    const u0 = seg(k, 0, 0.06), u1 = seg(k, 0.06, 0.26), u2 = seg(k, 0.28, 0.42), u3 = lin(k, 0.46, 0.94), u4 = seg(k, 0.94, 1);
    const f = u3 * rows, whole = Math.floor(f + 1e-9);
    const swept = Math.min(rows, whole + ease(f - whole));
    const top = yB - swept * unit;
    let s = '';
    if (swept > 0) {
      s += S.rect(x0, top, W, swept * unit, 'ink-soft');
      for (let j = 1; j < rows && j <= swept + 1e-9; j++) s += S.line(x0, yB - j * unit, x0 + W, yB - j * unit, 'grid2', 1);
      for (let i = 1; i < cols; i++) s += S.line(x0 + i * unit, yB, x0 + i * unit, top, 'grid2', 1);
      s += S.line(x0 + W, yB, x0 + W, top, 'grid2', 1.5);
      s += S.line(x0, top, x0 + W, top, u3 < 1 ? 'a' : 'grid2', u3 < 1 ? 3 : 1.5);
      if (u3 < 1) s += S.text(x0 + W + 14, top + 5, `${fmt(Math.min(whole, rows) * cols, 1)}`, { anchor: 'start', size: 15, weight: 600 });
    }
    s += S.line(x0, yB, x0 + W * u1, yB, 'a', 4);
    if (u2 > 0) s += S.line(x0, yB, x0, yB - H * u2, heightColor, 4);
    s += S.fade(u0, S.circle(x0, yB, 6, 'ink'));
    s += S.fade(u1, S.text(x0 + W / 2, yB + 28, fmt(cols), { fill: 'a', size: 15 }));
    s += S.fade(u2, S.text(x0 - 14, yB - H / 2 + 5, fmt(rows), { fill: heightColor, size: 15, anchor: 'end' }));
    s += S.fade(u4, S.text(x0 + W / 2, yB - H / 2 + 6, `${fmt(cols * rows)} square units`, { size: 17, weight: 600 }));
    return s;
  }
  // The base rises in pitch as it stretches; every completed row adds a note.
  const sweepSfx = (cols, rows) => {
    const ev = [sfx.tick(0.01, note(0)), sfx.glide(0.06, 0.26, pitch(0), pitch(Math.min(14, cols * 1.5))), sfx.glide(0.28, 0.42, pitch(0), pitch(Math.min(14, rows * 2)))];
    for (let j = 1; j <= Math.ceil(rows); j++) ev.push(sfx.pop(0.46 + (0.48 * Math.min(j, rows)) / rows - 0.005, note(j + 1)));
    ev.push(sfx.chime(0.95, note(8)));
    return ev;
  };
  const sweepSteps = (wKey, hKey) => [
    { at: 0, hl: [], say: 'Start from a single point.' },
    { at: 0.06, hl: [wKey], say: ({ [wKey]: w }) => `Stretch it into a base ${fmt(w)} units long.` },
    { at: 0.28, hl: [hKey], say: ({ [hKey]: ht }) => `Raise a height of ${fmt(ht)}, straight up from the base.` },
    { at: 0.46, hl: ['×'], say: ({ [wKey]: w }) => `Sweep the base upward. Every unit it climbs adds another row of ${fmt(w)} unit squares.` },
    { at: 0.94, hl: ['=', 'res'], say: ({ [wKey]: w, [hKey]: ht }) => `${fmt(ht)} rows of ${fmt(w)}: the area is ${fmt(w * ht)} square units.` },
  ];

  MV.register({
    id: 'rectangle',
    group: G,
    symbol: '▭',
    title: 'Rectangle',
    build: 3.4,
    lede: 'A base swept straight up through a height. Every unit it climbs adds one more row of unit squares.',
    params: {
      w: { value: 6, min: 1, max: 12, step: 0.5, color: 'a', label: 'base' },
      ht: { value: 4, min: 1, max: 7, step: 0.5, color: 'b', label: 'height' },
    },
    formula: (p, h) => `${h.n('w')}${op('×')}${h.n('ht')}${op('=')}${h.r(p.w * p.ht)}`,
    aside: ({ w, ht }, h) => `<div>${h.v('A')} = base × height, perimeter = 2(${h.val('w')} + ${h.val('ht')}) = ${h.c('ink', fmt(2 * (w + ht)))}</div>`,
    steps: sweepSteps('w', 'ht'),
    sfx: ({ w, ht }) => sweepSfx(w, ht),
    draw: ({ w, ht }, h, { k }) => sweepRect(w, ht, k, 'b'),
    theory: [
      ['Area as counting', `Area measures how many unit squares fit inside a shape. A rectangle ${M('w')} units wide and ${M('h')} units tall holds ${M('h')} rows of ${M('w')} squares, so ${M('A = w × h')}, measured in <em>square units</em> (m², cm²…). For lengths that aren't whole numbers, the same formula holds by cutting the unit square into smaller and smaller pieces.`],
      ['Area as sweeping', `The animation shows a second way to see it. Slide the base straight up, perpendicular to itself, through a distance ${M('h')}, and the region it passes over has area base × distance. This "sweeping" idea underlies Cavalieri's principle and, later, the integral in calculus, which adds up thin strips.`],
      ['Perimeter and the best rectangle', `The perimeter is ${M('2(w + h)')}. For a fixed perimeter, the rectangle with the largest area is the square. Write the sides as ${M('m + d')} and ${M('m − d')}: the area is ${M('m^2 − d^2')} (see Difference of squares), which is largest when ${M('d = 0')}. The diagonal, by Pythagoras, is ${M('√(w^2 + h^2)')}.`],
    ],
    practice: ({ w, ht }, h) => [
      `A room ${h.val('w')} m by ${h.val('ht')} m needs ${h.r(w * ht)} m² of carpet and ${h.r(2 * (w + ht))} m of skirting board.`,
      `A screen ${h.val('w')} by ${h.val('ht')} has a diagonal of ${h.r(Math.hypot(w, ht))}. TV sizes are quoted by their diagonal.`,
      `Doubling both sides quadruples the area: ${h.val('w', 2 * w)} × ${h.val('ht', 2 * ht)} = ${h.r(4 * w * ht)}.`,
    ],
  });

  MV.register({
    id: 'square',
    group: G,
    symbol: '■',
    title: 'Square',
    build: 3.2,
    lede: 'A rectangle whose height equals its base. Its area is the side times itself, which is why x² is called “x squared”.',
    params: {
      s: { value: 4, min: 1, max: 7, step: 0.5, color: 'a', label: 'side' },
    },
    formula: (p, h) => `${h.n('s')}<sup data-k="sq">2</sup>${op('=')}${h.r(p.s * p.s)}`,
    aside: ({ s }, h) => `<div>= ${h.val('s')} × ${h.val('s')}, perimeter 4 × ${h.val('s')} = ${h.c('ink', fmt(4 * s))}, diagonal ${h.val('s')}√2 = ${h.c('ink', fmt(s * Math.SQRT2))}</div>`,
    steps: [
      { at: 0, hl: [], say: 'Start from a single point.' },
      { at: 0.06, hl: ['s'], say: ({ s }) => `Stretch it into a side ${fmt(s)} long.` },
      { at: 0.28, hl: ['s'], say: ({ s }) => `Raise the same length, ${fmt(s)}, straight up.` },
      { at: 0.46, hl: ['sq'], say: ({ s }) => `Sweep the side upward: ${fmt(s)} rows of ${fmt(s)}. Multiplying a number by itself is “squaring” it.` },
      { at: 0.94, hl: ['=', 'res'], say: ({ s }) => `The area is ${fmt(s)}² = ${fmt(s * s)} square units.` },
    ],
    sfx: ({ s }) => sweepSfx(s, s),
    draw: ({ s }, h, { k }) => sweepRect(s, s, k, 'a'),
    theory: [
      ['Area', `A square of side ${M('s')} is a rectangle with ${M('w = h = s')}, so ${M('A = s^2')}. This is literally where the word "squared" comes from: the Greeks thought of ${M('x^2')} as the area of a square on a line of length ${M('x')}. In the same way ${M('x^3')}, "cubed", is the volume of a cube.`],
      ['Scaling', `Multiply every length by ${M('k')} and the area is multiplied by ${M('k^2')}. A square twice as wide covers four times the ground, and three times as wide covers nine. This <em>square law</em> applies to every shape, not just squares: areas grow with the square of length.`],
      ['Diagonal and perimeter', `The perimeter is ${M('4s')}. The diagonal splits the square into two right isosceles triangles, so by Pythagoras it is ${M('√(s^2 + s^2) = s√2')}. The irrationality of √2, the fact that it isn't any fraction, was discovered from exactly this figure.`],
    ],
    practice: ({ s }, h) => [
      `A ${h.val('s')} m square garden covers ${h.r(s * s)} m². Making it twice as wide gives ${h.r(4 * s * s)} m², four times as much.`,
      `A square sheet of side ${h.val('s')} cut corner to corner gives two triangles with a long side of ${h.r(s * Math.SQRT2)}.`,
      `Paper sizes like A4 keep the ratio √2 so that folding in half gives the same shape, half the area.`,
    ],
  });

  MV.register({
    id: 'parallelogram',
    group: G,
    symbol: '▱',
    title: 'Parallelogram',
    build: 3.6,
    lede: 'Slide the top of a rectangle sideways and the area stays the same. Cut off one end, move it across, and the rectangle comes back.',
    params: {
      b: { value: 6, min: 2, max: 10, step: 0.5, color: 'a', label: 'base' },
      ht: { value: 4, min: 1, max: 6, step: 0.5, color: 'b', label: 'height' },
      off: { value: 2, min: 0, max: 10, step: 0.5, color: 'c', label: 'slant offset' },
    },
    constrain: (p) => ({ ...p, off: Math.min(p.off, p.b) }),
    formula: (p, h) => `${h.n('b')}${op('×')}${h.n('ht')}${op('=')}${h.r(p.b * p.ht)}`,
    aside: ({ b, ht, off }, h) =>
      `<div>Slant the top by ${h.n('off')} and the area doesn’t change. The slanted side is ${h.c('ink', fmt(Math.hypot(off, ht)))}, but only the height counts.</div>`,
    steps: [
      { at: 0, hl: ['b'], say: ({ b }) => `A parallelogram on a base of ${fmt(b)}.` },
      { at: 0.2, hl: ['ht'], say: ({ ht }) => `Its height is ${fmt(ht)}: measured straight up, not along the slanted side.` },
      { at: 0.3, hl: ['off'], say: 'Cut straight down from the top corner…' },
      { at: 0.4, hl: [], say: '…and slide the triangle you cut off across to the other end.' },
      { at: 0.66, hl: ['b', '×', 'ht'], say: ({ b, ht }) => `It fits exactly: now it’s a ${fmt(b)} × ${fmt(ht)} rectangle.` },
      { at: 0.82, hl: ['=', 'res'], say: ({ b, ht }) => `Slide it back. Same pieces, same area: ${fmt(b * ht)}.` },
    ],
    sfx: [sfx.tick(0.02, note(0)), sfx.glide(0.2, 0.3, pitch(0), pitch(7)), sfx.snip(0.31), sfx.snip(0.36), sfx.whoosh(0.4, 0.66), sfx.chime(0.68, note(7)), sfx.swoosh(0.82, 0.94), sfx.tick(0.95, note(9))],
    draw({ b, ht, off }, h, { k }) {
      const { P } = fit(0, b + off, -0.2, ht, { x: 60, y: 50, w: 680, h: 290 }, 55);
      const u1 = seg(k, 0, 0.18), u2 = seg(k, 0.2, 0.3), uCut = seg(k, 0.3, 0.38);
      const uMove = seg(k, 0.4, 0.66) - seg(k, 0.82, 0.94), uRect = seg(k, 0.66, 0.72) * (1 - seg(k, 0.8, 0.84)), uEnd = seg(k, 0.94, 1);
      let s = '';
      s += S.fade(u1, shape(P, [[off, 0], [b, 0], [b + off, ht], [off, ht]], 'ink-soft', null, { 'stroke-width': 0 }));
      s += S.fade(u1 * (1 - uRect), shape(P, [[0, 0], [b, 0], [b + off, ht], [off, ht]], null, 'a'));
      if (off > 0) {
        const dx = b * uMove;
        if (uMove > 0.01) s += shape(P, [[0, 0], [off, 0], [off, ht]], null, 'c', { 'stroke-width': 1.5, ...dashed('5 5') });
        s += S.fade(u1, shape(P, [[dx, 0], [off + dx, 0], [off + dx, ht]], uCut > 0 ? 'c-soft' : 'ink-soft', uCut > 0 ? 'c' : null, { 'stroke-width': 1.5 }));
        s += S.fade(1 - seg(k, 0.4, 0.46), slash(P, [off, ht], [off, 0], uCut));
      }
      s += grow(P, [off, ht], [off, 0], u2, 'b', 2, dashed('5 5'));
      s += S.fade(u2, label(P, [off, ht / 2], fmt(ht), { fill: 'b', anchor: 'start', dx: 8 }));
      s += S.fade(u1, label(P, [b / 2, 0], fmt(b), { fill: 'a', dy: 24 }));
      s += S.fade(uRect, shape(P, [[off, 0], [b + off, 0], [b + off, ht], [off, ht]], null, 'ink', { 'stroke-width': 2.5 }) +
        label(P, [off + b / 2, ht / 2], `${fmt(b)} × ${fmt(ht)} = ${fmt(b * ht)}`, { size: 17, weight: 600, dy: 6 }));
      s += S.fade(uEnd, label(P, [(b + off) / 2, ht / 2], `area ${fmt(b * ht)}`, { size: 17, weight: 600, dy: 6 }));
      return s;
    },
    theory: [
      ['Base times height', `A parallelogram has two pairs of parallel sides. Its area is ${M('A = b × h')}, where ${M('h')} is the <em>perpendicular</em> height, the straight-up distance between the parallel sides, not the length of the slanted side. The animation shows why: the triangle cut from one end fits exactly into the gap at the other, turning the shape into a ${M('b × h')} rectangle.`],
      ['Shearing keeps area', `Sliding the top edge along its own line is a <em>shear</em>. Every horizontal slice keeps its length ${M('b')}, so the total area can't change. This is Cavalieri's principle: two shapes whose slices at every height have equal lengths have equal areas. The same idea shows that a slanted stack of coins has the same volume as a straight one.`],
      ['Using the sides instead', `If you know the two side lengths ${M('a')} and ${M('b')} and the angle ${M('θ')} between them, the height is ${M('a sin θ')}, so ${M('A = ab sin θ')}. The area is largest when ${M('θ')} = 90°, the rectangle, and shrinks to zero as the parallelogram is squashed flat.`],
    ],
    practice: ({ b, ht, off }, h) => [
      `A slanted parking bay ${h.val('b')} m wide along the kerb and ${h.val('ht')} m deep takes up ${h.r(b * ht)} m², the same as a straight one.`,
      `A deck of cards pushed sideways still has the same volume: each card keeps its size.`,
      `The slanted side here is ${h.r(Math.hypot(off, ht))}. Multiplying it by the base, ${h.r(b * Math.hypot(off, ht))}, would overestimate the area.`,
    ],
  });

  MV.register({
    id: 'trapezoid',
    group: G,
    symbol: '⏢',
    title: 'Trapezoid',
    build: 3.8,
    compact: true,
    lede: 'Two parallel sides of different lengths. Turn a copy half a turn and the pair makes a parallelogram; cut it back in half and you have the area.',
    params: {
      a: { value: 3, min: 1, max: 8, step: 0.5, color: 'a', label: 'top side' },
      b: { value: 7, min: 1, max: 10, step: 0.5, color: 'b', label: 'bottom side' },
      ht: { value: 4, min: 1, max: 6, step: 0.5, color: 'c', label: 'height' },
    },
    formula: (p, h) => `${HALF}${op('×')}(${h.n('a')}${op('+')}${h.n('b')})${op('×')}${h.n('ht')}${op('=')}${h.r(((p.a + p.b) / 2) * p.ht)}`,
    aside: ({ a, b }, h) => `<div>The average of the parallel sides, ${h.c('ink', fmt((a + b) / 2))}, times the height</div>`,
    steps: [
      { at: 0, hl: ['a', 'b'], say: ({ a, b }) => `A trapezoid: parallel sides ${fmt(a)} and ${fmt(b)}.` },
      { at: 0.2, hl: ['ht'], say: ({ ht }) => `They’re ${fmt(ht)} apart: the height.` },
      { at: 0.42, hl: ['+'], say: 'Turn a copy half a turn around the middle of the slanted side…' },
      { at: 0.6, hl: ['a', '+', 'b', '×', 'ht'], say: ({ a, b, ht }) => `…together they make a parallelogram with base ${fmt(a)} + ${fmt(b)}: area ${fmt((a + b) * ht)}.` },
      { at: 0.7, hl: ['½'], say: 'Cut along the join: the trapezoid is exactly half of it.' },
      { at: 0.92, hl: ['=', 'res'], say: ({ a, b, ht }) => `½ × (${fmt(a)} + ${fmt(b)}) × ${fmt(ht)} = ${fmt(((a + b) / 2) * ht)}.` },
    ],
    sfx: [sfx.tick(0.02, note(0)), sfx.glide(0.2, 0.3, pitch(0), pitch(5)), ...halveSfx, sfx.chime(0.93, note(7))],
    draw({ a, b, ht }, h, { k }) {
      const d = (b - a) / 2;
      const T = [[0, 0], [b, 0], [d + a, ht], [d, ht]];
      const Mid = [(b + d + a) / 2, ht / 2];
      const xs = [0, b, d, d + a, a + b, a + b + d];
      const { P } = fit(Math.min(...xs), Math.max(...xs) + 1.5, -0.6, ht + 0.4, { x: 50, y: 50, w: 700, h: 290 }, 50);
      const u1 = seg(k, 0, 0.18), u2 = seg(k, 0.2, 0.3), uW = seg(k, 0.6, 0.66) * (1 - seg(k, 0.8, 0.86)), uEnd = seg(k, 0.92, 1);
      let s = '';
      s += S.fade(u1, shape(P, T, 'ink-soft', 'ink'));
      s += S.fade(u1, label(P, [d + a / 2, ht], fmt(a), { fill: 'a', dy: -10 }) + label(P, [b / 2, 0], fmt(b), { fill: 'b', dy: 24 }));
      s += grow(P, [d, ht], [d, 0], u2, 'c', 2, dashed('5 5'));
      s += S.fade(u2, label(P, [d, ht / 2], fmt(ht), { fill: 'c', anchor: 'end', dx: -8 }));
      s += doubleAndHalve(P, T, Mid, [[b, 0], [d + a, ht]], [[0, 0], [a + b, 0], [a + b + d, ht], [d, ht]], k, HALVE);
      s += S.fade(uW, label(P, [(a + b) / 2, 0], `a + b = ${fmt(a + b)}`, { dy: 44 }) +
        label(P, [(a + b + d) / 2, ht], `${fmt(a + b)} × ${fmt(ht)} = ${fmt((a + b) * ht)}`, { size: 15, weight: 600, dy: -14 }));
      s += S.fade(uEnd, label(P, [b / 2, ht / 2], `half: ${fmt(((a + b) / 2) * ht)}`, { size: 16, weight: 600, dy: 5 }));
      return s;
    },
    theory: [
      ['The formula', `A trapezoid (a trapezium in British English) has one pair of parallel sides, ${M('a')} and ${M('b')}, a distance ${M('h')} apart. Its area is ${M('A = ½(a + b)h')}: the average of the parallel sides, times the height.`],
      ['Why: two copies', `Turn a copy of the trapezoid half a turn about the midpoint of one slanted side. Its long side lands on top next to the short side, and its short side lands at the bottom next to the long side. Together they make a parallelogram with base ${M('a + b')} and height ${M('h')}, so one trapezoid is half of ${M('(a + b)h')}.`],
      ['Special cases', `When ${M('a = b')} the trapezoid is a parallelogram and the formula becomes ${M('bh')}. When ${M('a = 0')} it's a triangle and the formula becomes ${M('½bh')}. The segment joining the midpoints of the slanted sides, the <em>midsegment</em>, has length exactly ${M('(a + b)/2')}. The <em>trapezoidal rule</em> for estimating areas under curves uses this shape.`],
    ],
    practice: ({ a, b, ht }, h) => [
      `A garden bed ${h.val('a')} m wide at the back and ${h.val('b')} m at the front, ${h.val('ht')} m deep, needs ${h.r(((a + b) / 2) * ht)} m² of mulch.`,
      `The cross-section of a ditch or a dam is often a trapezoid. Multiply its area by the length to get a volume of earth or water.`,
      `Make the top side equal to the bottom and you get a parallelogram; shrink it toward 0 and you approach a triangle.`,
    ],
  });

  MV.register({
    id: 'circle',
    group: G,
    symbol: '●',
    title: 'Circle',
    build: 3.8,
    lede: 'Slice a circle into thin wedges and lay them head to tail. They make a shape that’s nearly a rectangle, half the circumference long and one radius tall.',
    params: {
      r: { value: 4, min: 1, max: 6, step: 0.25, color: 'a', label: 'radius' },
    },
    formula: (p, h) => `${PI}${op('×')}${h.n('r')}<sup data-k="sq">2</sup>${op('=')}${h.r(Math.PI * p.r * p.r)}`,
    aside: ({ r }, h) => `<div>circumference 2π${h.val('r')} = ${h.c('ink', fmt(2 * Math.PI * r), 'C')}; half of it, π${h.val('r')} = ${h.c('ink', fmt(Math.PI * r), 'half')}, is the strip’s length</div>`,
    steps: [
      { at: 0, hl: ['r'], say: ({ r }) => `A circle of radius ${fmt(r)}.` },
      { at: 0.22, hl: [], say: 'Slice it into 24 thin wedges, like a pizza.' },
      { at: 0.34, hl: ['C'], say: 'Lay them out head to tail, alternating up and down. Half the crust ends up on top, half on the bottom.' },
      { at: 0.88, hl: ['π', 'half', 'r', 'sq', '=', 'res'], say: ({ r }) => `Nearly a rectangle: πr = ${fmt(Math.PI * r)} long and r = ${fmt(r)} tall. So the area is πr × r = πr².` },
    ],
    sfx: () => {
      const ev = [sfx.glide(0, 0.22, pitch(-5), pitch(7))];
      for (let i = 0; i < 24; i++) ev.push(sfx.tick(0.22 + (0.1 * i) / 24, note(14 + (i % 5))));
      // Every wedge leaving the circle makes a little pop, climbing up the scale.
      for (let i = 0; i < 24; i++) ev.push(sfx.pop(0.34 + i * 0.012, note(8 + (i % 10))));
      ev.push(sfx.chime(0.9, note(5)));
      return ev;
    },
    draw({ r }, h, { k }) {
      const sc = 20, R = r * sc, N = 24, half = Math.PI / N;
      const cx = 155, cy = 210, x0 = 330, chord = 2 * R * Math.sin(half), ch = R * Math.cos(half);
      const yb = cy + R / 2;
      const u1 = seg(k, 0, 0.22), u2 = seg(k, 0.22, 0.32), u4 = seg(k, 0.88, 1);
      const wedge = `M0 0 L${(-R * Math.sin(half)).toFixed(2)} ${(-ch).toFixed(2)} A${R} ${R} 0 0 1 ${(R * Math.sin(half)).toFixed(2)} ${(-ch).toFixed(2)} Z`;
      let s = '';
      s += S.circle(cx, cy, R, null, 'a', { 'stroke-width': 2, ...drawOn(u1), opacity: seg(k, 0.34, 0.5) ? 1 - 0.6 * seg(k, 0.34, 0.5) : 1 });
      if (u1 < 1) s += S.line(cx, cy, cx + R * Math.cos(2 * Math.PI * u1), cy + R * Math.sin(2 * Math.PI * u1), 'a', 2);
      for (let i = 0; i < N; i++) {
        const u = seg(k, 0.34 + i * 0.012, 0.6 + i * 0.012);
        const alpha = (i * 360) / N, odd = i % 2 === 1, j = Math.floor(i / 2);
        const target = odd ? [x0 + (j + 1) * chord, yb - ch] : [x0 + (j + 0.5) * chord, yb];
        let tr = odd ? 180 : 0;
        tr += 360 * Math.round((alpha - tr) / 360);
        const [tx, ty] = lerpPt([cx, cy], target, u), angle = lerp(alpha, tr, u);
        s += S.fade(u2, `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${angle.toFixed(2)})">` +
          S.path(wedge, odd ? 'c' : 'a', 1, { fill: odd ? 'c-soft' : 'a-soft' }) + '</g>');
      }
      const L = (N / 2) * chord;
      s += S.fade(u4, S.line(x0, yb + 18, x0 + L, yb + 18, 'ink', 1.5) +
        S.text(x0 + L / 2, yb + 40, `πr = ${fmt(Math.PI * r)}`, { size: 14 }) +
        S.line(x0 - 14, yb, x0 - 14, yb - R, 'a', 2.5) +
        S.text(x0 - 22, yb - R / 2 + 5, `r = ${fmt(r)}`, { fill: 'a', size: 14, anchor: 'end' }) +
        S.text(x0 + L / 2, yb - R - 18, `≈ ${fmt(Math.PI * r)} × ${fmt(r)} = ${fmt(Math.PI * r * r)}`, { size: 16, weight: 600 }));
      return s;
    },
    theory: [
      ['π', `Every circle's circumference divided by its diameter gives the same number, ${M('π')} ≈ 3.14159. So ${M('C = πd = 2πr')}. π is <em>irrational</em> (no fraction equals it, proved by Lambert in 1761) and <em>transcendental</em> (it isn't the root of any polynomial with whole-number coefficients, proved by Lindemann in 1882). That second fact settled the ancient problem of "squaring the circle" with ruler and compass: it's impossible.`],
      ['Why πr²', `Cut the circle into ${M('N')} equal wedges and lay them alternately point-up and point-down. The curved edges, half the circumference each, become the long sides, of length ${M('πr')}. The straight edges become the short sides, of length ${M('r')}. As ${M('N')} grows the shape approaches a true rectangle, so ${M('A = πr × r = πr^2')}. Making this "as ${M('N')} grows" precise is exactly what limits in calculus are for.`],
      ['Archimedes', `Around 250 BCE Archimedes trapped π between the perimeters of polygons with 96 sides drawn inside and outside a circle. He proved that π lies between 3 10/71 and 3 1/7, and showed that a circle's area equals a right triangle with legs ${M('r')} and ${M('C')}, which is the same as ${M('½ × 2πr × r')}.`],
      ['Parts of a circle', `A sector with angle ${M('θ')} (in radians) is the fraction ${M('θ / 2π')} of the circle, so its area is ${M('½r^2θ')} and its arc length is ${M('rθ')}. Areas scale with the square of the radius: double the radius, four times the area.`],
    ],
    practice: ({ r }, h) => [
      `A pizza with a ${h.val('r')}-inch radius has ${h.r(Math.PI * r * r)} square inches of pizza. One with twice the radius has four times as much.`,
      `Walking once round a circular track of radius ${h.val('r', r * 10)} m covers 2π × ${fmt(r * 10)} = ${h.r(2 * Math.PI * r * 10)} m.`,
      `Two 10-inch pizzas (157 in²) are less pizza than one 16-inch pizza (201 in²). Area grows with the square of size.`,
    ],
  });

  MV.register({
    id: 'polygon',
    group: G,
    symbol: '⬡',
    title: 'Regular polygon',
    build: 3,
    compact: true,
    lede: 'Equal sides and equal angles. It splits into identical triangles around the centre, and with more sides it hugs a circle.',
    params: {
      n: { value: 6, min: 3, max: 12, step: 1, color: 'a', label: 'number of sides', digits: 0 },
      s: { value: 3, min: 1, max: 5, step: 0.5, color: 'b', label: 'side length' },
    },
    formula: (p, h) => {
      const ap = p.s / (2 * Math.tan(Math.PI / p.n));
      return `${HALF}${op('×')}${h.n('n')}${op('×')}${h.n('s')}${op('×')}${h.c('c', fmt(ap), 'ap')}${op('=')}${h.r(0.5 * p.n * p.s * ap)}`;
    },
    aside: ({ n, s }, h) =>
      `<div>${HALF} × perimeter × ${h.c('c', 'apothem')}, where the apothem is ${h.val('s')} ÷ (2 tan(180° ÷ ${h.val('n')})) = ${h.c('c', fmt(s / (2 * Math.tan(Math.PI / n))))}</div>`,
    steps: [
      { at: 0, hl: ['n'], say: ({ n }) => `Split the polygon into ${fmt(n, 0)} identical triangles that meet at the centre.` },
      { at: 0.68, hl: ['ap'], say: 'Each triangle is as tall as the apothem: centre to the middle of a side.' },
      { at: 0.8, hl: ['½', 's', '×', 'ap'], say: ({ n, s }) => `Each triangle is ½ × ${fmt(s)} × ${fmt(s / (2 * Math.tan(Math.PI / n)))}; ${fmt(n, 0)} of them make the whole.` },
      { at: 0.92, hl: ['=', 'res'], say: 'Compare the two circles: the polygon sits between them, closer with every extra side.' },
    ],
    sfx: ({ n }) => [
      ...Array.from({ length: n }, (_, i) => sfx.pop((0.65 * i) / n, note(i))),
      sfx.glide(0.68, 0.8, pitch(0), pitch(5)),
      sfx.chime(0.85, note(n)),
    ],
    draw({ n, s }, h, { k }) {
      const R = s / (2 * Math.sin(Math.PI / n)), ap = s / (2 * Math.tan(Math.PI / n));
      const sc = Math.min(34, 165 / R), cx = 230, cy = 210;
      const V = (i) => {
        const phi = Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n;
        return [cx + R * sc * Math.cos(phi), cy + R * sc * Math.sin(phi)];
      };
      let out = S.fade(seg(k, 0, 0.15), S.circle(cx, cy, R * sc, null, 'grid2', { 'stroke-width': 1.5, ...dashed('4 6') }));
      out += S.fade(seg(k, 0.85, 0.95), S.circle(cx, cy, ap * sc, null, 'grid2', { 'stroke-width': 1.5, ...dashed('2 4') }));
      for (let i = 0; i < n; i++) {
        const u = seg(k, (0.65 * i) / n, (0.65 * (i + 1)) / n);
        if (u <= 0) continue;
        const p1 = lerpPt([cx, cy], V(i), u), p2 = lerpPt([cx, cy], V(i + 1), u);
        out += S.poly([[cx, cy], p1, p2], i % 2 ? 'a-soft' : 'ink-soft', 'a', { 'stroke-width': 1.5 });
      }
      const u5 = seg(k, 0.68, 0.8), u6 = seg(k, 0.8, 1);
      const mid = lerpPt(V(n - 1), V(n), 0.5);
      if (u5 > 0) out += S.line(cx, cy, ...lerpPt([cx, cy], mid, u5), 'c', 2.5, dashed('5 4'));
      out += S.fade(u5, S.text(cx + 8, (cy + mid[1]) / 2 + 4, 'apothem', { fill: 'c', size: 13, anchor: 'start' }));
      out += S.fade(u6, S.line(...V(n - 1), ...V(n), 'b', 4) + S.text(mid[0], mid[1] + 24, `s = ${fmt(s)}`, { fill: 'b', size: 14 }));
      const tx = 470, tri = 0.5 * s * ap;
      const row = (y, a, b, color = 'ink', w) =>
        S.text(tx, y, a, { anchor: 'start', size: 16, fill: color }) + S.text(tx + 280, y, b, { anchor: 'end', size: 16, fill: color, weight: w });
      out += S.fade(u6, row(130, `${fmt(n, 0)} triangles`, '', 'a') +
        row(170, 'each: ½ × s × apothem', fmt(tri)) +
        row(210, `all ${fmt(n, 0)} together`, fmt(n * tri), 'ink', 600));
      out += S.fade(seg(k, 0.88, 1), S.line(tx, 236, tx + 280, 236, 'grid2', 1) +
        row(266, 'circle through the corners', fmt(Math.PI * R * R), 'muted') +
        row(296, 'circle inside the sides', fmt(Math.PI * ap * ap), 'muted'));
      return out;
    },
    theory: [
      ['Triangles around a centre', `A regular polygon with ${M('n')} sides of length ${M('s')} splits into ${M('n')} identical isosceles triangles meeting at its centre. Each has base ${M('s')} and height equal to the <em>apothem</em> ${M('a')}, the distance from the centre to the middle of a side. So ${M('A = n × ½sa')} = ½ × perimeter × apothem.`],
      ['Finding the apothem', `Each central triangle has apex angle ${M('360° / n')}. Halving it gives a right triangle with angle ${M('180° / n')}, opposite side ${M('s/2')} and adjacent side ${M('a')}, so ${M('tan(180°/n) = (s/2)/a')} and ${M('a = s / (2 tan(180°/n))')}. The interior angle at each corner is ${M('(n − 2) × 180° / n')}: 60° for a triangle, 90° for a square, 120° for a hexagon.`],
      ['Approaching the circle', `As ${M('n')} grows, the perimeter approaches the circumference ${M('2πr')} and the apothem approaches the radius ${M('r')}. The formula ½ × perimeter × apothem then becomes ${M('½ × 2πr × r = πr^2')}. Compare the two circle areas listed beside the drawing: the polygon's area sits between them, and the gap closes as you add sides.`],
    ],
    practice: ({ n }, h) => [
      `Bees build hexagonal cells: of the three regular shapes that tile a flat surface (triangles, squares and hexagons), the hexagon encloses the most area for its perimeter.`,
      `A stop sign is a regular octagon. With 0.31 m sides it has an area of ${h.r(2 * (1 + Math.SQRT2) * 0.31 * 0.31)} m².`,
      `With ${h.val('n')} sides the interior angles are ${h.r(((n - 2) * 180) / n, 1)}° each.`,
    ],
  });

  // ---------- Triangles ----------

  MV.register({
    id: 'tri-any',
    group: G,
    sub: TRI,
    symbol: '△',
    title: 'Any triangle',
    build: 3.8,
    lede: 'Every triangle is half of a parallelogram: turn a copy half a turn and the two fit together. Cut them apart again and the triangle keeps exactly half.',
    params: {
      b: { value: 6, min: 2, max: 10, step: 0.5, color: 'a', label: 'base' },
      ht: { value: 4, min: 1, max: 7, step: 0.5, color: 'b', label: 'height' },
      px: { value: 2, min: -3, max: 12, step: 0.5, color: 'c', label: 'position of the top corner' },
    },
    formula: (p, h) => `${HALF}${op('×')}${h.n('b')}${op('×')}${h.n('ht')}${op('=')}${h.r(0.5 * p.b * p.ht)}`,
    aside({ b, ht, px }, h) {
      const angA = Math.atan2(ht, px), angB = Math.atan2(ht, b - px), angC = Math.PI - angA - angB;
      const big = (Math.max(angA, angB, angC) * 180) / Math.PI;
      const kind = Math.abs(big - 90) < 0.5 ? 'right' : big > 90 ? 'obtuse' : 'acute';
      return `<div>Move the top corner to ${h.n('px')}: the area stays the same. Right now the triangle is ${h.c('ink', kind)}.</div>`;
    },
    steps: [
      { at: 0, hl: ['b'], say: ({ b }) => `A base of ${fmt(b)}.` },
      { at: 0.12, hl: ['ht', 'px'], say: ({ ht }) => `Raise the top corner to a height of ${fmt(ht)}.` },
      { at: 0.28, hl: [], say: 'Join it to both ends of the base.' },
      { at: 0.42, hl: [], say: 'Turn a copy half a turn around the middle of the right-hand side…' },
      { at: 0.6, hl: ['b', '×', 'ht'], say: ({ b, ht }) => `…the two make a parallelogram: ${fmt(b)} × ${fmt(ht)} = ${fmt(b * ht)}.` },
      { at: 0.7, hl: ['½'], say: 'Cut along the diagonal and take the copy away: the triangle is exactly half.' },
      { at: 0.92, hl: ['=', 'res'], say: ({ b, ht }) => `½ × ${fmt(b)} × ${fmt(ht)} = ${fmt(0.5 * b * ht)}.` },
    ],
    sfx: [sfx.glide(0, 0.12, pitch(0), pitch(5)), sfx.glide(0.12, 0.28, pitch(0), pitch(9)), sfx.tick(0.3, note(5)), ...halveSfx, sfx.chime(0.93, note(7))],
    draw({ b, ht, px }, h, { k }) {
      const A = [0, 0], B = [b, 0], C = [px, ht], Mid = [(b + px) / 2, ht / 2];
      const xs = [0, b, px, b + px];
      const { P } = fit(Math.min(...xs), Math.max(...xs), -0.3, ht + 0.4, { x: 60, y: 46, w: 680, h: 300 }, 50);
      const u1 = seg(k, 0, 0.12), u2 = seg(k, 0.12, 0.28), u3 = seg(k, 0.28, 0.38), uEnd = seg(k, 0.92, 1);
      let s = '';
      s += S.fade(u3, shape(P, [A, B, C], 'ink-soft', null));
      s += grow(P, A, B, u1, 'a');
      s += S.fade(u1, label(P, [b / 2, 0], fmt(b), { fill: 'a', dy: 24 }));
      if (u2 > 0) {
        const Cu = [px, ht * u2];
        if (px < 0 || px > b) s += S.line(...P(px < 0 ? 0 : b, 0), ...P(px, 0), 'muted', 1.5, dashed('3 5'));
        s += S.line(...P(px, 0), ...P(...Cu), 'b', 2, dashed('5 5'));
        s += S.circle(...P(...Cu), 6, 'c');
        s += S.fade(u2, label(P, [px, ht / 2], fmt(ht), { fill: 'b', anchor: 'start', dx: 8 }));
      }
      s += grow(P, A, C, u3, 'ink', 2.5) + grow(P, B, C, u3, 'ink', 2.5);
      s += doubleAndHalve(P, [A, B, C], Mid, [B, C], [A, B, [b + px, ht], C], k, HALVE);
      s += S.fade(seg(k, 0.6, 0.66) * (1 - seg(k, 0.8, 0.86)), label(P, [(b + px) / 2, ht], `parallelogram ${fmt(b)} × ${fmt(ht)} = ${fmt(b * ht)}`, { dy: -14, size: 14, weight: 600 }));
      s += S.fade(uEnd, label(P, [(b + px) / 3, ht / 3], `${fmt(0.5 * b * ht)}`, { size: 17, weight: 600, dy: 6 }));
      return s;
    },
    theory: [
      ['Half of base times height', `For any triangle, ${M('A = ½bh')}. Any side can serve as the base ${M('b')}; the height ${M('h')} is then the perpendicular distance from the opposite corner to the line containing that base. Two copies of a triangle, one turned half a turn about the midpoint of a side, always form a parallelogram with area ${M('bh')}.`],
      ['Sliding the top corner', `Move the top corner along a line parallel to the base and the base and height don't change, so neither does the area. That's the shear principle again (see Parallelogram). It works even when the corner moves past the end of the base and the height falls outside the triangle.`],
      ['Other formulas', `Knowing two sides and the angle between them: ${M('A = ½ab sin C')}. Knowing all three sides: Heron's formula (see Scalene). Knowing the corners' coordinates: ${M('A = ½|x_1(y_2 − y_3) + x_2(y_3 − y_1) + x_3(y_1 − y_2)|')}, the "shoelace" formula. They all agree because they all measure the same base and height in different ways.`],
      ['Kinds of triangle', `By angles, a triangle is <em>acute</em> (all under 90°), <em>right</em> (one exactly 90°) or <em>obtuse</em> (one over 90°). By sides it's <em>equilateral</em> (all equal), <em>isosceles</em> (two equal) or <em>scalene</em> (none equal). Its three angles always add to 180°. The pages that follow look at each kind.`],
    ],
    practice: ({ b, ht }, h) => [
      `A triangular sail with a ${h.val('b')} m foot and ${h.val('ht')} m height has ${h.r(0.5 * b * ht)} m² of cloth.`,
      `Surveyors measure irregular plots by splitting them into triangles and adding up ½ × base × height for each one.`,
      `In 3D graphics every surface is made of triangles. Their areas decide how lighting and textures are spread.`,
    ],
  });

  MV.register({
    id: 'tri-acute',
    group: G,
    sub: TRI,
    symbol: '▲',
    title: 'Acute',
    build: 3.8,
    lede: 'Every angle is under 90°, so the height lands inside the base. The rectangle around the triangle is exactly twice its size.',
    params: {
      b: { value: 7, min: 2, max: 10, step: 0.5, color: 'a', label: 'base' },
      ht: { value: 4, min: 1, max: 7, step: 0.5, color: 'b', label: 'height' },
      px: { value: 3, min: 0.5, max: 9.5, step: 0.5, color: 'c', label: 'foot of the height' },
    },
    constrain: (p) => ({ ...p, px: Math.min(Math.max(p.px, 0.5), p.b - 0.5) }),
    formula: (p, h) => `${HALF}${op('×')}${h.n('b')}${op('×')}${h.n('ht')}${op('=')}${h.r(0.5 * p.b * p.ht)}`,
    aside({ b, ht, px }, h) {
      const topAcute = ht * ht > px * (b - px);
      return `<div>Height falls ${h.n('px')} along the base. ` +
        (topAcute ? 'All three angles are under 90°.' : `<span class="note">The top angle is now 90° or more (h² ≤ ${fmt(px)} × ${fmt(b - px)}), but the area rule still holds.</span>`) + '</div>';
    },
    steps: [
      { at: 0, hl: ['b', 'ht'], say: ({ b, ht }) => `Draw the ${fmt(b)} × ${fmt(ht)} rectangle around the triangle.` },
      { at: 0.15, hl: [], say: 'The triangle touches the top edge at one point.' },
      { at: 0.3, hl: ['px'], say: 'Drop the height: it splits the triangle into two right triangles.' },
      { at: 0.42, hl: [], say: 'Turn a copy of each half over into the empty corner beside it…' },
      { at: 0.6, hl: ['b', '×', 'ht'], say: ({ b, ht }) => `…they fill the rectangle exactly: ${fmt(b * ht)}.` },
      { at: 0.7, hl: ['½'], say: 'Cut along the triangle’s sides and take the copies away: the triangle is half the rectangle.' },
      { at: 0.92, hl: ['=', 'res'], say: ({ b, ht }) => `½ × ${fmt(b)} × ${fmt(ht)} = ${fmt(0.5 * b * ht)}.` },
    ],
    sfx: [sfx.glide(0, 0.15, pitch(0), pitch(7)), sfx.tick(0.2, note(5)), sfx.glide(0.3, 0.38, pitch(9), pitch(2)), ...halveSfx, sfx.chime(0.93, note(7))],
    draw({ b, ht, px }, h, { k }) {
      const A = [0, 0], B = [b, 0], C = [px, ht], F = [px, 0];
      const { P } = fit(-0.3, b + 0.3, -0.3, ht + 0.6, { x: 60, y: 46, w: 680, h: 300 }, 55);
      const u1 = seg(k, 0, 0.15), u2 = seg(k, 0.15, 0.28), u3 = seg(k, 0.3, 0.38);
      const uT = seg(k, 0.42, 0.6), uW = seg(k, 0.6, 0.66), uS = seg(k, 0.7, 0.78), uL = seg(k, 0.8, 0.92), uEnd = seg(k, 0.92, 1);
      let s = S.fade(u1 * (1 - uW * 0.6), shape(P, [A, B, [b, ht], [0, ht]], null, 'grid2', dashed('5 5')));
      s += S.fade(u2, shape(P, [A, B, C], 'ink-soft', 'ink', { 'stroke-width': 2.5 }));
      s += grow(P, C, F, u3, 'b', 2, dashed('5 5'));
      s += S.fade(u3, rightMark(P, F, [1, 0], [0, 1], 0.3));
      // Each half of the triangle turns over into the empty corner beside it, then leaves sideways.
      const left = turn([A, F, C], [px / 2, ht / 2], uT), right = turn([F, B, C], [(px + b) / 2, ht / 2], uT);
      const fadeIn = seg(k, 0.42, 0.46) * (1 - uL);
      s += S.fade(fadeIn, shape(P, shift(left, [-1.2 * uL, 0]), 'c-soft', 'c', { 'stroke-width': 1.5 }) +
        shape(P, shift(right, [1.2 * uL, 0]), 'c-soft', 'c', { 'stroke-width': 1.5 }));
      s += S.fade(uW * (1 - uL), shape(P, [A, B, [b, ht], [0, ht]], null, 'ink', { 'stroke-width': 2.5 }));
      s += S.fade(1 - uL, slash(P, A, C, uS) + slash(P, B, C, uS));
      s += S.fade(u1, label(P, [b / 2, 0], fmt(b), { fill: 'a', dy: 24 }) + label(P, [b, ht / 2], fmt(ht), { fill: 'b', dx: 10, anchor: 'start' }));
      s += S.fade(uW * (1 - uL), label(P, [b / 2, ht], `rectangle ${fmt(b * ht)}`, { dy: -14, weight: 600 }));
      s += S.fade(uEnd, label(P, [px, ht / 3], fmt(0.5 * b * ht), { weight: 600, size: 17, dy: 6 }));
      return s;
    },
    theory: [
      ['What makes it acute', `All three angles are less than 90°. With base ${M('b')} and the height's foot a distance ${M('x')} along it, the base angles are acute exactly when ${M('0 < x < b')}, and the top angle is acute when ${M('h^2 > x(b − x)')}. Equivalently, for every side ${M('c')}, ${M('c^2 < a^2 + b^2')}: Pythagoras with the inequality pointing one way.`],
      ['Half the rectangle', `Draw the rectangle ${M('b × h')} around the triangle. The height splits both into two parts, and each part of the rectangle is cut diagonally in half by a side of the triangle. So the triangle is exactly half: ${M('½bh')}. The animation turns a copy of each half into the empty corner beside it, then cuts them away again.`],
      ['Centres', `In an acute triangle all three heights meet at a point inside it (the <em>orthocentre</em>). The centre of the circle through all three corners (the <em>circumcentre</em>) is inside it too. Both move outside once an angle becomes obtuse.`],
    ],
    practice: ({ b, ht }, h) => [
      `A roof gable ${h.val('b')} m wide and ${h.val('ht')} m tall needs ${h.r(0.5 * b * ht)} m² of cladding.`,
      `Cut a rectangular sheet ${h.val('b')} by ${h.val('ht')} into this triangle and exactly half, ${h.r(0.5 * b * ht)}, is offcut.`,
    ],
  });

  MV.register({
    id: 'tri-right',
    group: G,
    sub: TRI,
    symbol: '◺',
    title: 'Right',
    build: 3.6,
    lede: 'One angle is exactly 90°, so the two short sides are already a base and a height. Two copies make a rectangle.',
    params: {
      a: { value: 6, min: 1, max: 10, step: 0.5, color: 'a', label: 'base leg' },
      b: { value: 4, min: 1, max: 7, step: 0.5, color: 'b', label: 'upright leg' },
    },
    formula: (p, h) => `${HALF}${op('×')}${h.n('a')}${op('×')}${h.n('b')}${op('=')}${h.r(0.5 * p.a * p.b)}`,
    aside: ({ a, b }, h) => `<div>The long side is √(${h.val('a')}² + ${h.val('b')}²) = ${h.c('ink', fmt(Math.hypot(a, b)))}</div>`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `A base leg of ${fmt(a)}…` },
      { at: 0.12, hl: ['b'], say: ({ b }) => `…and an upright leg of ${fmt(b)}, at a right angle. The legs are already a base and a height.` },
      { at: 0.24, hl: [], say: 'The long side closes the triangle.' },
      { at: 0.42, hl: [], say: 'Turn a copy half a turn around the middle of the long side…' },
      { at: 0.6, hl: ['a', '×', 'b'], say: ({ a, b }) => `…together: a ${fmt(a)} × ${fmt(b)} rectangle, ${fmt(a * b)}.` },
      { at: 0.7, hl: ['½'], say: 'Cut along the diagonal and take the copy away: the triangle is half.' },
      { at: 0.92, hl: ['=', 'res'], say: ({ a, b }) => `½ × ${fmt(a)} × ${fmt(b)} = ${fmt(0.5 * a * b)}.` },
    ],
    sfx: [sfx.glide(0, 0.12, pitch(0), pitch(7)), sfx.glide(0.12, 0.24, pitch(0), pitch(5)), sfx.glide(0.24, 0.36, pitch(5), pitch(12)), ...halveSfx, sfx.chime(0.93, note(7))],
    draw({ a, b }, h, { k }) {
      const A = [0, 0], B = [a, 0], C = [0, b];
      const { P } = fit(-0.3, a + 0.3, -0.3, b + 0.6, { x: 60, y: 46, w: 680, h: 300 }, 55);
      const u1 = seg(k, 0, 0.12), u2 = seg(k, 0.12, 0.24), u3 = seg(k, 0.24, 0.36), uEnd = seg(k, 0.92, 1);
      let s = S.fade(u3, shape(P, [A, B, C], 'ink-soft', null));
      s += grow(P, A, B, u1, 'a') + grow(P, A, C, u2, 'b') + grow(P, B, C, u3, 'ink', 2.5);
      s += S.fade(u2, rightMark(P, A, [1, 0], [0, 1], Math.min(0.35, a / 5, b / 5)));
      s += S.fade(u1, label(P, [a / 2, 0], fmt(a), { fill: 'a', dy: 24 })) + S.fade(u2, label(P, [0, b / 2], fmt(b), { fill: 'b', dx: -10, anchor: 'end' }));
      s += doubleAndHalve(P, [A, B, C], [a / 2, b / 2], [B, C], [A, B, [a, b], C], k, HALVE);
      s += S.fade(seg(k, 0.6, 0.66) * (1 - seg(k, 0.8, 0.86)), label(P, [a / 2, b], `rectangle ${fmt(a * b)}`, { dy: -14, weight: 600 }));
      s += S.fade(uEnd, label(P, [a / 3, b / 3], fmt(0.5 * a * b), { weight: 600, size: 17, dy: 6 }));
      return s;
    },
    theory: [
      ['Legs as base and height', `The sides that meet at the right angle, the <em>legs</em>, are perpendicular, so either can be the base and the other is the height: ${M('A = ½ab')}. Two copies, one turned half a turn about the middle of the long side, make an ${M('a × b')} rectangle.`],
      ['The hypotenuse', `The side opposite the right angle is the longest, ${M('c = √(a^2 + b^2)')} (see Pythagorean theorem). Its height, measured from the right-angle corner, is ${M('ab / c')}: equate the two ways of computing the area, ${M('½ab = ½ch')}.`],
      ['Thales', `The midpoint of the hypotenuse is the same distance from all three corners, so the circle through them has the hypotenuse as a diameter. Conversely, any triangle drawn in a semicircle with the diameter as one side has a right angle opposite it (Thales' theorem). That's why the rectangle in the animation has the hypotenuse as its diagonal.`],
    ],
    practice: ({ a, b }, h) => [
      `A ramp rising ${h.val('b')} m over ${h.val('a')} m has a triangular side panel of ${h.r(0.5 * a * b)} m².`,
      `Cut a ${h.val('a')} by ${h.val('b')} sandwich corner to corner: each half is ${h.r(0.5 * a * b)}, with a ${h.r(Math.hypot(a, b))} cut edge.`,
      `Set squares used in technical drawing are right triangles, usually 45-45-90 or 30-60-90.`,
    ],
  });

  MV.register({
    id: 'tri-obtuse',
    group: G,
    sub: TRI,
    symbol: '◿',
    title: 'Obtuse',
    build: 3.6,
    compact: true,
    lede: 'One angle is over 90°, so the height falls outside the triangle. The area is a big right triangle minus a small one.',
    params: {
      b: { value: 4, min: 1, max: 8, step: 0.5, color: 'a', label: 'base' },
      ht: { value: 3, min: 1, max: 6, step: 0.5, color: 'b', label: 'height' },
      e: { value: 3, min: 0.5, max: 6, step: 0.5, color: 'c', label: 'overhang past the base' },
    },
    formula: (p, h) => `${HALF}${op('×')}${h.n('b')}${op('×')}${h.n('ht')}${op('=')}${h.r(0.5 * p.b * p.ht)}`,
    aside: ({ b, ht, e }, h) =>
      `<div>= ${h.c('ink', `${HALF} × (${fmt(b)} + `, 'big')}${h.n('e')}${h.c('ink', `) × ${fmt(ht)}`, 'big')} ${op(MV.MINUS)} ${h.c('c', `½ × ${fmt(e)} × ${fmt(ht)}`, 'small')} = ${fmt(0.5 * (b + e) * ht)} ${MV.MINUS} ${fmt(0.5 * e * ht)}</div>`,
    steps: [
      { at: 0, hl: ['b'], say: ({ b }) => `A base of ${fmt(b)}.` },
      { at: 0.14, hl: ['e'], say: ({ e }) => `The top corner hangs ${fmt(e)} past the end, so extend the base line to reach under it.` },
      { at: 0.24, hl: ['ht'], say: ({ ht }) => `The height, ${fmt(ht)}, drops outside the triangle.` },
      { at: 0.34, hl: [], say: 'The obtuse triangle itself.' },
      { at: 0.5, hl: ['big'], say: ({ b, e, ht }) => `It sits inside a big right triangle: ½ × ${fmt(b + e)} × ${fmt(ht)} = ${fmt(0.5 * (b + e) * ht)}…` },
      { at: 0.64, hl: ['small', MV.MINUS], say: ({ e, ht }) => `…minus the small right triangle at the end: ½ × ${fmt(e)} × ${fmt(ht)} = ${fmt(0.5 * e * ht)}.` },
      { at: 0.9, hl: ['½', 'b', 'ht', '=', 'res'], say: ({ b, ht }) => `The overhang cancels out: ½ × ${fmt(b)} × ${fmt(ht)} = ${fmt(0.5 * b * ht)}.` },
    ],
    sfx: [sfx.glide(0, 0.14, pitch(0), pitch(5)), sfx.glide(0.14, 0.24, pitch(5), pitch(9)), sfx.glide(0.24, 0.34, pitch(9), pitch(2)), sfx.tick(0.4, note(4)),
      sfx.glide(0.5, 0.62, pitch(0), pitch(12)), sfx.snip(0.66), sfx.swoosh(0.76, 0.92), sfx.chime(0.93, note(7))],
    draw({ b, ht, e }, h, { k }) {
      const A = [0, 0], B = [b, 0], F = [b + e, 0], C = [b + e, ht];
      const { P } = fit(0, b + e, -ht * 0.6, ht + 0.4, { x: 60, y: 40, w: 680, h: 330 }, 50);
      const u1 = seg(k, 0, 0.14), u2 = seg(k, 0.14, 0.24), u3 = seg(k, 0.24, 0.34), u4 = seg(k, 0.34, 0.46);
      const u5 = seg(k, 0.5, 0.62), u6 = seg(k, 0.64, 0.72), u7 = seg(k, 0.76, 0.92), u8 = seg(k, 0.9, 1);
      let s = '';
      s += S.fade(u5 * (1 - u8 * 0.75), shape(P, [A, F, C], 'ink-soft', 'ink', { 'stroke-width': 1.5, ...dashed('6 4') }));
      s += S.fade(u4, shape(P, [A, B, C], 'a-soft', 'ink', { 'stroke-width': 2.5 }));
      s += grow(P, A, B, u1, 'a');
      s += grow(P, B, F, u2, 'muted', 1.5, dashed('3 5'));
      s += grow(P, F, C, u3, 'b', 2, dashed('5 5'));
      s += S.fade(u3, rightMark(P, F, [-1, 0], [0, 1], 0.3));
      // The small right triangle is the part to take away: it's marked, cut, and drops out.
      const drop = -ht * 0.55 * u7;
      s += S.fade(u6 * (1 - u7), shape(P, [[b, drop], [b + e, drop], [b + e, ht + drop]], 'c-soft', 'c', { 'stroke-width': 1.5 }));
      s += S.fade(1 - u7, slash(P, B, C, u6));
      s += S.fade(u1, label(P, [b / 2, 0], fmt(b), { fill: 'a', dy: 24 }));
      s += S.fade(u2, label(P, [b + e / 2, 0], fmt(e), { fill: 'c', dy: -8 }));
      s += S.fade(u3, label(P, [b + e, ht / 2], fmt(ht), { fill: 'b', dx: 10, anchor: 'start' }));
      s += S.fade(u8, label(P, [(b + e) / 2, ht], `${fmt(0.5 * (b + e) * ht)} − ${fmt(0.5 * e * ht)} = ${fmt(0.5 * b * ht)}`, { dy: -14, weight: 600, size: 15 }));
      return s;
    },
    theory: [
      ['What makes it obtuse', `One angle is greater than 90°. Then the side opposite it, ${M('c')}, satisfies ${M('c^2 > a^2 + b^2')}. The law of cosines ${M('c^2 = a^2 + b^2 − 2ab cos C')} shows why: ${M('cos C')} is negative for obtuse angles, so the correction is added rather than subtracted.`],
      ['A height outside', `The height from the top corner meets the line of the base beyond its end, so you have to extend the base (dashed) to draw it. The formula ${M('½bh')} still works. The triangle is a big right triangle with base ${M('b + e')} minus a small one with base ${M('e')}, both with height ${M('h')}: ${M('½(b + e)h − ½eh = ½bh')}. The overhang cancels.`],
      ['Centres outside', `In an obtuse triangle the three heights, extended, meet outside the triangle, and so does the centre of the circle through its corners. Only one angle can be obtuse, because the three add to 180°.`],
    ],
    practice: ({ b, ht }, h) => [
      `A lean-to roof panel with a ${h.val('b')} m bottom edge reaching ${h.val('ht')} m high still covers ${h.r(0.5 * b * ht)} m², however far the top corner overhangs.`,
      `Lengthen the overhang and the triangle gets longer and thinner, but its area doesn’t change.`,
    ],
  });

  // Isosceles and equilateral share one construction: compass arcs from both ends,
  // then one half flips over to make a rectangle, and flips back.
  function isoBuild(base, leg, k) {
    const H = Math.sqrt(Math.max(0, leg * leg - (base * base) / 4));
    const A = [0, 0], B = [base, 0], C = [base / 2, H], F = [base / 2, 0];
    const { P, sc } = fit(-0.2, base + 0.2, -0.2, H + 0.6, { x: 60, y: 40, w: 680, h: 310 }, 50);
    const u1 = seg(k, 0, 0.12), u2 = lin(k, 0.12, 0.28), u3 = lin(k, 0.28, 0.44), u4 = seg(k, 0.44, 0.54);
    const u5 = seg(k, 0.56, 0.64), uF = seg(k, 0.66, 0.78) - seg(k, 0.88, 0.98), uR = seg(k, 0.78, 0.82) * (1 - seg(k, 0.86, 0.88)), uEnd = seg(k, 0.96, 1);
    const angA = Math.atan2(H, base / 2), spread = Math.min(0.45, 1.2 / ((leg * sc) / 40));
    let s = S.fade(u4, shape(P, [A, F, C], 'ink-soft', null));
    s += grow(P, A, B, u1, 'a');
    s += S.path(arc(P, A, leg, angA - spread, angA + spread), 'b', 1.5, { ...drawOn(u2), opacity: 1 - u5 * 0.75 });
    s += S.path(arc(P, B, leg, Math.PI - angA + spread, Math.PI - angA - spread), 'b', 1.5, { ...drawOn(u3), opacity: 1 - u5 * 0.75 });
    if (u2 > 0 && u2 < 1) s += S.line(...P(...A), ...P(leg * Math.cos(angA - spread + 2 * spread * u2), leg * Math.sin(angA - spread + 2 * spread * u2)), 'b', 1, dashed('3 4'));
    if (u3 > 0 && u3 < 1) s += S.line(...P(...B), ...P(base + leg * Math.cos(Math.PI - angA + spread - 2 * spread * u3), leg * Math.sin(Math.PI - angA + spread - 2 * spread * u3)), 'b', 1, dashed('3 4'));
    s += S.fade(seg(k, 0.42, 0.46), S.circle(...P(...C), 5, 'ink'));
    s += grow(P, A, C, u4, 'b', 3) + grow(P, B, C, u4, 'b', 3);
    s += grow(P, C, F, u5, 'c', 2, dashed('5 5'));
    s += S.fade(u5, rightMark(P, F, [-1, 0], [0, 1], Math.min(0.3, base / 6)));
    // The right half flips over onto the left, making a rectangle half as wide, then flips back.
    const flip = ([x, y]) => [x - (base / 2) * uF, H / 2 + (y - H / 2) * (1 - 2 * uF)];
    if (uF > 0.01) s += shape(P, [F, B, C], null, 'c', { 'stroke-width': 1.5, ...dashed('5 5') });
    s += S.fade(u4, shape(P, [F, B, C].map(flip), uF > 0.01 ? 'c-soft' : 'ink-soft', uF > 0.01 ? 'c' : null, { 'stroke-width': 1.5 }));
    s += S.fade(uR, shape(P, [A, F, C, [0, H]], null, 'ink', { 'stroke-width': 2.5 }) +
      label(P, [base / 4, H], `${fmt(base / 2)} × ${fmt(H)} = ${fmt((base / 2) * H)}`, { dy: -14, weight: 600 }));
    s += S.fade(u1, label(P, [base / 2, 0], fmt(base), { fill: 'a', dy: 24 }));
    s += S.fade(u4, label(P, [base * 0.75, H / 2], fmt(leg), { fill: 'b', dx: 12, anchor: 'start' }));
    s += S.fade(u5, label(P, [base / 2, H * 0.45], `h = ${fmt(H)}`, { fill: 'c', dx: 8, anchor: 'start' }));
    s += S.fade(uEnd, label(P, [base / 2, H], `area ${fmt((base / 2) * H)}`, { dy: -14, weight: 600 }));
    return s;
  }
  const isoSfx = [sfx.glide(0, 0.12, pitch(0), pitch(7)), sfx.glide(0.12, 0.28, pitch(2), pitch(9)), sfx.glide(0.28, 0.44, pitch(9), pitch(2)), sfx.pop(0.44, note(9)),
    sfx.glide(0.56, 0.64, pitch(9), pitch(0)), sfx.whoosh(0.66, 0.78), sfx.chime(0.8, note(5)), sfx.swoosh(0.88, 0.98)];

  MV.register({
    id: 'tri-isosceles',
    group: G,
    sub: TRI,
    symbol: 'Δ',
    title: 'Isosceles',
    build: 3.8,
    lede: 'Two equal sides. Swing equal arcs from both ends of the base to find the top, then fold one half over to make a rectangle.',
    params: {
      b: { value: 6, min: 1, max: 10, step: 0.5, color: 'a', label: 'base' },
      l: { value: 5, min: 1, max: 10, step: 0.5, color: 'b', label: 'equal sides' },
    },
    constrain: (p) => ({ ...p, l: Math.max(p.l, p.b / 2 + 0.25) }),
    formula: (p, h) => {
      const H = Math.sqrt(p.l * p.l - (p.b * p.b) / 4);
      return `${HALF}${op('×')}${h.n('b')}${op('×')}${h.c('c', fmt(H), 'hgt')}${op('=')}${h.r(0.5 * p.b * H)}`;
    },
    aside: ({ b, l }, h) =>
      `<div>Equal sides ${h.n('l')}, so the height is √(${h.val('l')}² − (${h.val('b')} ÷ 2)²) = ${h.c('c', fmt(Math.sqrt(l * l - (b * b) / 4)), 'hgt')}</div>`,
    steps: [
      { at: 0, hl: ['b'], say: ({ b }) => `A base of ${fmt(b)}.` },
      { at: 0.12, hl: ['l'], say: ({ l }) => `Swing an arc of radius ${fmt(l)} from each end: every point on it is ${fmt(l)} away.` },
      { at: 0.44, hl: [], say: 'Where the arcs cross is the top corner, the same distance from both ends.' },
      { at: 0.56, hl: ['hgt'], say: 'The height splits it into two mirror-image halves.' },
      { at: 0.66, hl: ['½'], say: ({ b }) => `Flip one half over: a rectangle half as wide as the base, ${fmt(b / 2)}.` },
      { at: 0.78, hl: ['½', 'b', '×', 'hgt'], say: ({ b, l }) => `Rectangle: ${fmt(b / 2)} × ${fmt(Math.sqrt(l * l - (b * b) / 4))}.` },
      { at: 0.88, hl: ['=', 'res'], say: ({ b, l }) => `Flip it back: the triangle has the same area, ${fmt(0.5 * b * Math.sqrt(l * l - (b * b) / 4))}.` },
    ],
    sfx: isoSfx,
    draw: ({ b, l }, h, { k }) => isoBuild(b, l, k),
    theory: [
      ['Two equal sides', `An isosceles triangle has two equal sides, the <em>legs</em>, meeting at the <em>apex</em>. The third side is the base. Euclid's fifth proposition, nicknamed the <em>pons asinorum</em> or "bridge of asses", proves that the two base angles are equal too.`],
      ['The height from Pythagoras', `The line from the apex straight down to the base is an axis of symmetry: it meets the base at a right angle, exactly in the middle. Each half is a right triangle with hypotenuse ${M('l')} and one leg ${M('b/2')}, so ${M('h = √(l^2 − (b/2)^2)')} and ${M('A = ½bh = (b/4)√(4l^2 − b^2)')}. The legs must be longer than half the base, or the arcs never meet.`],
      ['The construction', `The arcs are compass strokes: every point on an arc is exactly ${M('l')} from its centre. The apex has to be ${M('l')} from both ends of the base, so it's where the two arcs cross. Folding one half over shows the triangle has the same area as a rectangle ${M('b/2')} wide and ${M('h')} tall.`],
    ],
    practice: ({ b, l }, h) => {
      const H = Math.sqrt(l * l - (b * b) / 4);
      return [
        `An A-frame roof with ${h.val('l')} m rafters on a ${h.val('b')} m span rises ${h.c('c', fmt(H))} m and has a ${h.r(0.5 * b * H)} m² gable end.`,
        `A coat hanger, a slice of pie and the front of a tent are all close to isosceles triangles.`,
      ];
    },
  });

  MV.register({
    id: 'tri-equilateral',
    group: G,
    sub: TRI,
    symbol: '▵',
    title: 'Equilateral',
    build: 3.8,
    lede: 'All three sides equal, all three angles 60°. It’s the first construction in Euclid: two circles through each other’s centres.',
    params: {
      s: { value: 6, min: 1, max: 10, step: 0.5, color: 'a', label: 'side' },
    },
    formula: (p, h) => `${h.frac('√3', '4')}${op('×')}${h.n('s')}<sup data-k="sq">2</sup>${op('=')}${h.r((Math.sqrt(3) / 4) * p.s * p.s)}`,
    aside: ({ s }, h) =>
      `<div>height = ${h.frac('√3', '2')} × ${h.val('s')} = ${h.c('c', fmt((Math.sqrt(3) / 2) * s), 'hgt')}, so the area is ${HALF} × ${h.val('s')} × ${h.c('c', fmt((Math.sqrt(3) / 2) * s), 'hgt')}</div>`,
    steps: [
      { at: 0, hl: ['s'], say: ({ s }) => `A side of ${fmt(s)}.` },
      { at: 0.12, hl: ['s'], say: ({ s }) => `From each end, swing an arc with that same radius, ${fmt(s)}.` },
      { at: 0.44, hl: [], say: 'They cross at the third corner: all three sides are equal.' },
      { at: 0.56, hl: ['hgt'], say: ({ s }) => `The height is √3/2 × ${fmt(s)} = ${fmt((Math.sqrt(3) / 2) * s)}, by Pythagoras on one half.` },
      { at: 0.66, hl: ['½'], say: 'Flip one half over: a rectangle half a side wide.' },
      { at: 0.78, hl: ['s', 'hgt'], say: ({ s }) => `${fmt(s / 2)} × ${fmt((Math.sqrt(3) / 2) * s)} = √3/4 × ${fmt(s)}².` },
      { at: 0.88, hl: ['=', 'res'], say: ({ s }) => `Flip it back: the area is ${fmt((Math.sqrt(3) / 4) * s * s)}.` },
    ],
    sfx: isoSfx,
    draw: ({ s }, h, { k }) => isoBuild(s, s, k),
    theory: [
      ['Euclid I.1', `The very first proposition of Euclid's <em>Elements</em> constructs this triangle. Draw a circle around each end of a segment, with the segment as radius. Where the circles cross is a point at distance ${M('s')} from both ends. All three sides equal ${M('s')}, and by symmetry all three angles are 60°.`],
      ['Height and area', `The height splits the triangle into two 30-60-90 triangles with hypotenuse ${M('s')} and short leg ${M('s/2')}. By Pythagoras ${M('h = √(s^2 − s^2/4) = (√3/2)s ≈ 0.866s')}, so ${M('A = ½ × s × (√3/2)s = (√3/4)s^2 ≈ 0.433s^2')}.`],
      ['Centres coincide', `In an equilateral triangle the heights, the angle bisectors and the lines to the midpoints of the sides are all the same three lines. They meet at a single centre, two-thirds of the way down each height. The circle through the corners has radius ${M('s/√3')}; the circle inside touching the sides has half that.`],
    ],
    practice: ({ s }, h) => [
      `A triangular warning sign with ${h.val('s')} dm sides has an area of ${h.r((Math.sqrt(3) / 4) * s * s)} dm².`,
      `Six equilateral triangles make a regular hexagon, which is why honeycomb and graphene share the same geometry.`,
      `Triangles are rigid: a frame of three bars can’t be pushed out of shape, which is why bridges and cranes are built from them.`,
    ],
  });

  // Heron's formula, built term by term: each new factor adds a dimension to the picture,
  // until the square root brings it back to an area.
  MV.demos = MV.demos || {};
  MV.demos.heron = {
    build: 12,
    steps: ({ a, b, c }) => {
      const s = (a + b + c) / 2, sa = s - a, sb = s - b, sc = s - c, A = Math.sqrt(Math.max(0, s * sa * sb * sc));
      return [
        { at: 0, hl: [], say: 'Start from nothing: Heron’s formula needs only the three sides.' },
        { at: 0.03, hl: ['a', 'b', 'c'], say: `s: lay the three sides end to end, ${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ${fmt(2 * s)}, and fold the line in half. s = ${fmt(s)}.` },
        { at: 0.2, hl: ['a'], say: `s − a: cut a length a off s. What’s left is ${fmt(sa)}.` },
        { at: 0.3, hl: ['a'], say: `s × (s − a): two lengths multiplied make an area, a ${fmt(s)} by ${fmt(sa)} rectangle: ${fmt(s * sa)}.` },
        { at: 0.42, hl: ['b'], say: `× (s − b): a third length, ${fmt(sb)}, pulls the rectangle out into a box. Its volume is ${fmt(s * sa * sb)}.` },
        { at: 0.56, hl: ['c'], say: `× (s − c): there’s no fourth direction to stretch into, so stack ${fmt(sc)} copies of the box: ${fmt(s * sa * sb * sc)} in all.` },
        { at: 0.72, hl: [], say: `√: four lengths multiplied, square-rooted, give back two lengths multiplied: an area. √${fmt(s * sa * sb * sc)} = ${fmt(A)}.` },
        { at: 0.86, hl: ['=', 'res'], say: `That’s the triangle’s area: the square and the triangle cover exactly the same ${fmt(A)} square units.` },
      ];
    },
    sfx: ({ a, b, c }) => {
      const s = (a + b + c) / 2, n = Math.max(1, Math.ceil(s - c - 1e-9));
      return [
        sfx.glide(0.03, 0.1, pitch(0), pitch(12)), sfx.swoosh(0.11, 0.18), sfx.tick(0.19, note(7)),
        sfx.snip(0.22), sfx.glide(0.3, 0.4, pitch(0), pitch(5)), sfx.glide(0.42, 0.54, pitch(5), pitch(9)),
        ...Array.from({ length: n }, (_, i) => sfx.pop(0.58 + (0.12 * i) / n, note(i + 5))),
        sfx.chord(0.74, [pitch(-12), pitch(-5), pitch(0)]), sfx.chime(0.88, note(7)),
      ];
    },
    draw({ a, b, c }, h, { k }) {
      const s = (a + b + c) / 2, sa = s - a, sb = s - b, sc = s - c;
      const A = Math.sqrt(Math.max(0, s * sa * sb * sc));
      const U = Math.min(22, 640 / (a + b + c));
      const fade = (from, to, out0, out1) => seg(k, from, to) * (out0 == null ? 1 : 1 - seg(k, out0, out1));
      let out = '';

      // The formula itself, growing one piece at a time along the top.
      const pieces = [
        ['√(', 0.72, 'ink'], ['s', 0.03, 'ink'], ['(s − a)', 0.2, 'a'], ['(s − b)', 0.42, 'b'], ['(s − c)', 0.56, 'c'], [')', 0.72, 'ink'], [` = ${fmt(A)}`, 0.86, 'ink'],
      ];
      const newest = pieces.filter(([, at]) => k >= at).reduce((m, [, at]) => Math.max(m, at), -1);
      out += `<text x="400" y="40" text-anchor="middle" class="m" font-size="26" font-style="italic">` +
        pieces.map(([t, at, col]) => `<tspan style="fill:var(--${at === newest ? 'c' : col});opacity:${seg(k, at, at + 0.03)}" font-weight="${at === newest ? 600 : 400}">${t}</tspan>`).join('') + '</text>';

      // s: the perimeter laid out, then folded in half.
      const x0 = 400 - (a + b + c) * U / 2, y1 = 92;
      const uLay = lin(k, 0.03, 0.1), uFold = seg(k, 0.11, 0.18), oLine = fade(0.03, 0.05, 0.56, 0.6);
      let line = '', start = 0;
      for (const [len, col] of [[a, 'a'], [b, 'b'], [c, 'c']]) {
        const shown = Math.max(0, Math.min(len, uLay * (a + b + c) - start));
        if (shown > 0) line += S.line(x0 + start * U, y1, x0 + (start + shown) * U, y1, col, 5, { opacity: 1 - 0.75 * uFold });
        start += len;
      }
      if (uFold > 0) {
        line += S.line(x0, y1 + 14, x0 + lerp(2 * s, s, uFold) * U, y1 + 14, 'ink', 5);
        line += S.fade(seg(k, 0.15, 0.19), S.text(x0 + (s * U) / 2, y1 + 36, `s = ${fmt(s)}`, { size: 14, weight: 600 }));
      }
      out += S.fade(oLine, line);

      // s − a: cut a off s.
      const y2 = 150, uCut = seg(k, 0.2, 0.28), oCut = fade(0.2, 0.22, 0.3, 0.34);
      out += S.fade(oCut, S.line(x0, y2, x0 + s * U, y2, 'grid2', 5) +
        S.line(x0 + sa * U, y2, x0 + s * U, y2, 'a', 5, { opacity: 1 - uCut, ...dashed('4 4') }) +
        S.line(x0, y2, x0 + sa * U, y2, 'a', 6) +
        S.fade(uCut, S.text(x0 + (sa * U) / 2, y2 - 12, `s − a = ${fmt(sa)}`, { fill: 'a', size: 13, weight: 600 })));

      // s × (s − a): a rectangle; × (s − b): a box.
      const rx = 400 - (s * U) / 2 - 40, ry = 190, W = s * U, Hh = sa * U * seg(k, 0.3, 0.4);
      const depth = sb * U * 0.55 * seg(k, 0.42, 0.54), dx = depth * 0.85, dy = -depth * 0.6;
      const oBox = fade(0.3, 0.32, 0.56, 0.6);
      let box = S.rect(rx, ry, W, Hh, 'a-soft', 'a', { 'stroke-width': 1.5 });
      if (depth > 0) {
        box += S.poly([[rx, ry], [rx + dx, ry + dy], [rx + W + dx, ry + dy], [rx + W, ry]], 'b-soft', 'b', { 'stroke-width': 1.5 });
        box += S.poly([[rx + W, ry], [rx + W + dx, ry + dy], [rx + W + dx, ry + Hh + dy], [rx + W, ry + Hh]], 'b-soft', 'b', { 'stroke-width': 1.5 });
      }
      box += S.fade(seg(k, 0.36, 0.4), S.text(rx + W / 2, ry + Hh / 2 + 5, `${fmt(s * sa)}`, { size: 14, weight: 600 }));
      box += S.fade(seg(k, 0.5, 0.54), S.text(rx + W + dx + 10, ry + dy + 4, `× ${fmt(sb)} = ${fmt(s * sa * sb)}`, { fill: 'b', size: 14, weight: 600, anchor: 'start' }));
      out += S.fade(oBox, box);

      // × (s − c): copies of the box, side by side.
      const n = sc, whole = Math.ceil(n - 1e-9), oCopies = fade(0.56, 0.58, 0.72, 0.76);
      const bw = W + sb * U * 0.55 * 0.85, f = Math.min(0.6, 660 / (whole * (bw + 14)));
      let copies = '';
      for (let i = 0; i < whole; i++) {
        const u = seg(k, 0.58 + (0.12 * i) / whole, 0.6 + (0.12 * (i + 1)) / whole);
        if (u <= 0) continue;
        const part = Math.min(1, n - i), cx = 400 - (whole * (bw + 14) * f) / 2 + i * (bw + 14) * f, cy = 230;
        const w = W * f * part, hh = sa * U * f, d = sb * U * 0.55 * f, ddx = d * 0.85, ddy = -d * 0.6;
        copies += S.fade(u, S.rect(cx, cy, w, hh, 'c-soft', 'c', { 'stroke-width': 1.2 }) +
          S.poly([[cx, cy], [cx + ddx, cy + ddy], [cx + w + ddx, cy + ddy], [cx + w, cy]], 'c-soft', 'c', { 'stroke-width': 1.2 }) +
          S.poly([[cx + w, cy], [cx + w + ddx, cy + ddy], [cx + w + ddx, cy + hh + ddy], [cx + w, cy + hh]], 'c-soft', 'c', { 'stroke-width': 1.2 }));
      }
      copies += S.fade(seg(k, 0.66, 0.7), S.text(400, 330, `${fmt(n)} boxes of ${fmt(s * sa * sb)} = ${fmt(s * sa * sb * sc)}`, { fill: 'c', size: 15, weight: 600 }));
      out += S.fade(oCopies, copies);

      // √: back to an area, a square; then the triangle with the same area beside it.
      const side = Math.sqrt(A) * U * seg(k, 0.74, 0.84), sqx = 250 - side / 2, sqy = 250 - side / 2;
      if (side > 0) out += S.rect(sqx, sqy, side, side, 'ink-soft', 'ink', { 'stroke-width': 2 });
      out += S.fade(seg(k, 0.8, 0.85), S.text(250, 250 + Math.sqrt(A) * U / 2 + 24, `square: ${fmt(A)}`, { size: 14, weight: 600 }));
      const tx = (c * c + b * b - a * a) / (2 * c), ty = Math.sqrt(Math.max(0, b * b - tx * tx));
      const ox = 560 - (c * U) / 2, oy = 250 + (ty * U) / 2, uT = seg(k, 0.86, 0.96);
      if (uT > 0) {
        const pts = [[ox, oy], [ox + c * U, oy], [ox + tx * U, oy - ty * U]];
        out += S.fade(uT, S.poly(pts, 'ink-soft', 'ink', { 'stroke-width': 2 }) +
          S.line(...pts[0], ...pts[1], 'c', 3) + S.line(...pts[1], ...pts[2], 'a', 3) + S.line(...pts[2], ...pts[0], 'b', 3) +
          S.text(ox + (c * U) / 2, oy + 24, `triangle: ${fmt(A)}`, { size: 14, weight: 600 }));
      }
      return out;
    },
  };

  MV.register({
    id: 'tri-scalene',
    group: G,
    sub: TRI,
    symbol: '◬',
    title: 'Scalene',
    build: 3.8,
    compact: true,
    lede: 'No two sides equal. Three lengths fix the triangle completely, and Heron’s formula finds its area from them alone.',
    params: {
      a: { value: 5, min: 1, max: 10, step: 0.5, color: 'a', label: 'side a' },
      b: { value: 6, min: 1, max: 10, step: 0.5, color: 'b', label: 'side b' },
      c: { value: 7, min: 1, max: 10, step: 0.5, color: 'c', label: 'side c, the base' },
    },
    constrain(p, key) {
      const q = { ...p };
      const [u, v] = ['a', 'b', 'c'].filter((x) => x !== key).map((x) => q[x]);
      q[key] = Math.min(u + v - 0.5, Math.max(Math.abs(u - v) + 0.5, q[key]));
      return q;
    },
    formula(p, h) {
      const s = (p.a + p.b + p.c) / 2;
      const area = Math.sqrt(Math.max(0, s * (s - p.a) * (s - p.b) * (s - p.c)));
      return `√(${h.v('s')}(${h.v('s')}${op(MV.MINUS)}${h.n('a')})(${h.v('s')}${op(MV.MINUS)}${h.n('b')})(${h.v('s')}${op(MV.MINUS)}${h.n('c')}))${op('=')}${h.r(area)}`;
    },
    aside: ({ a, b, c }, h) => {
      const s = (a + b + c) / 2;
      return `<div>${h.v('s')} = (${h.val('a')} + ${h.val('b')} + ${h.val('c')}) ÷ 2 = ${h.c('ink', fmt(s), 'semi')}, half the perimeter</div>`;
    },
    steps: [
      { at: 0, hl: ['c'], say: ({ c }) => `Lay down side c = ${fmt(c)} as the base.` },
      { at: 0.13, hl: ['b'], say: ({ b }) => `Every point ${fmt(b)} from the left end lies on this arc…` },
      { at: 0.32, hl: ['a'], say: ({ a }) => `…and every point ${fmt(a)} from the right end lies on this one.` },
      { at: 0.51, hl: [], say: 'The top corner must be on both: where they cross. Three sides allow only one triangle.' },
      { at: 0.68, hl: ['semi'], say: 'Heron’s formula needs only the sides: first halve the perimeter to get s.' },
      { at: 0.82, hl: ['=', 'res'], say: ({ a, b, c }) => { const s = (a + b + c) / 2; return `√(s(s − a)(s − b)(s − c)) = ${fmt(Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))))}, the same as ½ × base × the dashed height.`; } },
    ],
    sfx: [sfx.glide(0, 0.13, pitch(0), pitch(7)), sfx.glide(0.13, 0.32, pitch(4), pitch(9)), sfx.glide(0.32, 0.51, pitch(9), pitch(4)), sfx.pop(0.52, note(10)),
      sfx.tick(0.6, note(5)), sfx.glide(0.68, 0.8, pitch(9), pitch(0)), sfx.chime(0.85, note(7))],
    draw({ a, b, c }, h, { k }) {
      const x = (c * c + b * b - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x));
      const A = [0, 0], B = [c, 0], C = [x, y];
      const { P } = fit(Math.min(0, x) - 0.5, Math.max(c, x) + 0.5, -0.3, y + 0.6, { x: 60, y: 40, w: 680, h: 310 }, 50);
      const u1 = seg(k, 0, 0.13), u2 = lin(k, 0.13, 0.32), u3 = lin(k, 0.32, 0.51), u4 = seg(k, 0.53, 0.64), u5 = seg(k, 0.68, 0.8), u6 = seg(k, 0.82, 1);
      const angA = Math.atan2(y, x), angB = Math.atan2(y, x - c), spread = 0.35;
      let s = S.fade(u4, shape(P, [A, B, C], 'ink-soft', null));
      s += grow(P, A, B, u1, 'c');
      // Compass: radius b from A, then radius a from B. The top corner is where the arcs cross.
      s += S.path(arc(P, A, b, angA - spread, angA + spread), 'b', 1.5, { ...drawOn(u2), opacity: 1 - u4 * 0.7 });
      s += S.path(arc(P, B, a, angB + spread, angB - spread), 'a', 1.5, { ...drawOn(u3), opacity: 1 - u4 * 0.7 });
      if (u2 > 0 && u2 < 1) { const t = angA - spread + 2 * spread * u2; s += S.line(...P(...A), ...P(b * Math.cos(t), b * Math.sin(t)), 'b', 1, dashed('3 4')); }
      if (u3 > 0 && u3 < 1) { const t = angB + spread - 2 * spread * u3; s += S.line(...P(...B), ...P(c + a * Math.cos(t), a * Math.sin(t)), 'a', 1, dashed('3 4')); }
      s += S.fade(seg(k, 0.5, 0.55), S.circle(...P(...C), 5, 'ink'));
      s += grow(P, A, C, u4, 'b', 3) + grow(P, B, C, u4, 'a', 3);
      if (u5 > 0) {
        if (x < 0 || x > c) s += S.line(...P(x < 0 ? 0 : c, 0), ...P(x, 0), 'muted', 1.5, dashed('3 5'));
        s += grow(P, C, [x, 0], u5, 'ink', 1.5, dashed('5 5'));
      }
      s += S.fade(u1, label(P, [c / 2, 0], `c = ${fmt(c)}`, { fill: 'c', dy: 24 }));
      s += S.fade(u4, label(P, [x / 2, y / 2], `b = ${fmt(b)}`, { fill: 'b', dx: -12, anchor: 'end' }) +
        label(P, [(x + c) / 2, y / 2], `a = ${fmt(a)}`, { fill: 'a', dx: 12, anchor: 'start' }));
      s += S.fade(u6, label(P, [x, y], `height ${fmt(y)}, area ½ × ${fmt(c)} × ${fmt(y)} = ${fmt(0.5 * c * y)}`, { dy: -16, weight: 600 }));
      return s;
    },
    theory: [
      ['Three sides decide everything', `A triangle can be built from three lengths only if each is shorter than the other two combined, the <em>triangle inequality</em>: ${M('a < b + c')}, ${M('b < a + c')}, ${M('c < a + b')}. (The numbers here are kept inside those limits.) When it holds, the triangle is unique up to position, the SSS rule. That's why the compass construction always finds exactly one top corner above the base.`],
      ['Heron’s formula', `With the semi-perimeter ${M('s = (a + b + c)/2')}, the area is ${M('A = √(s(s − a)(s − b)(s − c))')}. Hero of Alexandria gave it around 60 CE. It needs no angles or heights at all. As a check, it agrees with ½ × base × height, where the height comes from the law of cosines.`],
      ['Where the height lands', `With base ${M('c')}, the foot of the height is ${M('x = (c^2 + b^2 − a^2)/(2c)')} from the left end, and ${M('h = √(b^2 − x^2)')}. If ${M('x')} falls outside the base, the triangle is obtuse. A scalene triangle can be acute, right (3-4-5) or obtuse; "scalene" only says that no two sides match.`],
    ],
    practice: ({ a, b, c }, h) => {
      const s = (a + b + c) / 2, area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
      return [
        `A triangular field with fences of ${h.val('a')}, ${h.val('b')} and ${h.val('c')} (in tens of metres) covers ${h.r(area * 100)} m². You only need a tape measure, no angles.`,
        `Land surveyors triangulate: measure the sides of a network of triangles and Heron’s formula gives every piece of the area.`,
        `Try 3, 4 and 5: s = 6 and the area is √(6 × 3 × 2 × 1) = 6, a right triangle.`,
      ];
    },
  });
})();
