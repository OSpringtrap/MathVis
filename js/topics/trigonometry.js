(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, drawOn, morph, M, sfx, pitch, note } = MV;
  const G = 'Trigonometry';
  const op = (s) => `<span class="op">${s}</span>`;
  const rad = (deg) => (deg * Math.PI) / 180;

  MV.register({
    id: 'unit-circle',
    group: G,
    symbol: '○',
    title: 'Sine and cosine',
    build: 2.4,
    lede: 'Walk around a circle of radius 1. Cosine is how far across you are, sine is how far up.',
    params: {
      t: { value: 40, min: 0, max: 360, step: 1, color: 'c', label: 'angle in degrees', digits: 0 },
    },
    animate: { param: 't', speed: 45 },
    formula: (p, h) => `sin ${h.n('t')}°${op('=')}${h.c('b', fmt(Math.sin(rad(p.t)), 3))}`,
    aside({ t }, h) {
      const s = Math.sin(rad(t)), c = Math.cos(rad(t));
      const tan = Math.abs(c) < 1e-9 ? 'undefined' : fmt(s / c, 3);
      return `<div>cos ${h.v('θ')} = ${h.c('a', fmt(c, 3), 'cos')}<span class="op"></span> tan ${h.v('θ')} = ${h.r(tan)}</div>` +
        `<div>${h.c('b', `${fmt(s, 3)}²`)} + ${h.c('a', `${fmt(c, 3)}²`)} = ${h.r(1)}</div>`;
    },
    steps: [
      { at: 0, hl: [], say: 'A circle of radius 1, centred where the axes cross.' },
      { at: 0.3, hl: ['t'], say: ({ t }) => `Turn the radius anticlockwise through ${fmt(t, 0)}°. The pitch follows the height of its tip.` },
      { at: 0.85, hl: ['res', 'cos'], say: 'How far up the tip is: the sine. How far across: the cosine. Unrolled, they trace two waves.' },
    ],
    sfx: ({ t }) => [
      sfx.glide(0, 0.3, pitch(-5), pitch(7)),
      sfx.curve(0.3, 0.85, Array.from({ length: 40 }, (_, i) => pitch(12 * Math.sin((t * i * Math.PI) / 39 / 180)))),
      sfx.chime(0.88, pitch(12 * Math.sin(rad(t)))),
    ],
    draw({ t }, h, { k }) {
      const cx = 170, cy = 210, R = 135;
      const u1 = seg(k, 0, 0.3), u2 = seg(k, 0.3, 0.85), u3 = seg(k, 0.85, 1);
      // While building, the radius sweeps from 0° up to the chosen angle.
      const tt = t * u2, th = rad(tt);
      const px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
      let s = '';
      s += S.fade(u1, S.line(cx - R - 18, cy, cx + R + 18, cy, 'grid2', 1.5) + S.line(cx, cy - R - 18, cx, cy + R + 18, 'grid2', 1.5) +
        S.text(cx + R + 26, cy + 5, '1', { fill: 'muted', size: 12 }));
      s += S.circle(cx, cy, R, null, 'grid2', { 'stroke-width': 2, ...drawOn(u1) });
      // Waves, unrolled over one full turn.
      const w0 = 380, w1 = 770, WX = (d) => w0 + (d / 360) * (w1 - w0), WY = (v) => cy - v * R;
      const wave = (fn, from, to) => {
        let d = '';
        for (let x = from; x <= to; x += 2) d += `${x === from ? 'M' : 'L'}${WX(x).toFixed(1)} ${WY(fn(rad(x))).toFixed(1)} `;
        return d;
      };
      let axes = S.line(w0, cy, w1, cy, 'grid2', 1.5) + S.line(w0, cy - R, w0, cy + R, 'grid2', 1.5);
      for (const d of [90, 180, 270, 360]) {
        axes += S.line(WX(d), cy - 5, WX(d), cy + 5, 'grid2', 1.5) + S.text(WX(d), cy + 22, `${d}°`, { fill: 'muted', size: 11 });
      }
      axes += S.path(wave(Math.cos, 0, 360), 'a', 1.5, { opacity: 0.35, ...dashed('4 5') });
      axes += S.path(wave(Math.sin, 0, 360), 'b', 1.5, { opacity: 0.35 });
      s += S.fade(u1, axes);
      if (u2 <= 0) return s;

      const deg = ((tt % 360) + 360) % 360;
      const ar = 30;
      if (tt > 0 && deg === 0) s += S.circle(cx, cy, ar, null, 'c', { 'stroke-width': 2.5 });
      else if (deg > 0) s += S.path(`M${cx + ar} ${cy} A${ar} ${ar} 0 ${deg > 180 ? 1 : 0} 0 ${cx + ar * Math.cos(th)} ${cy - ar * Math.sin(th)}`, 'c', 2.5);
      s += S.line(cx, cy, px, py, 'ink', 2);
      // Label the radius along its length, kept upright whichever way it points.
      const up = Math.cos(th) >= 0, deg2 = -tt; // screen angle of the radius
      const lx = (cx + px) / 2 - Math.sin(th) * 12 * (up ? 1 : -1), ly = (cy + py) / 2 - Math.cos(th) * 12 * (up ? 1 : -1);
      s += S.fade(u3, S.text(lx, ly + 4, 'radius', { size: 13, weight: 600, transform: `rotate(${up ? deg2 : deg2 + 180} ${lx} ${ly})` }));
      s += S.line(cx, cy, px, cy, 'a', 4.5);
      s += S.line(px, cy, px, py, 'b', 4.5);
      s += S.fade(u3, S.text((cx + px) / 2, cy + (Math.sin(th) >= 0 ? 22 : -12), 'cos', { fill: 'a', size: 14, weight: 600 }) +
        S.text(px + (Math.cos(th) >= 0 ? 10 : -10), (cy + py) / 2 + 5, 'sin', { fill: 'b', size: 14, weight: 600, anchor: Math.cos(th) >= 0 ? 'start' : 'end' }));

      const shown = Math.min(deg || (tt > 0 ? 360 : 0), 360);
      if (shown > 0) {
        s += S.path(wave(Math.cos, 0, Math.floor(shown / 2) * 2) + `L${WX(shown)} ${WY(Math.cos(rad(shown)))}`, 'a', 2.5, dashed('4 5'));
        s += S.path(wave(Math.sin, 0, Math.floor(shown / 2) * 2) + `L${WX(shown)} ${WY(Math.sin(rad(shown)))}`, 'b', 3);
      }
      const wx = WX(shown);
      s += S.line(px, py, wx, py, 'muted', 1, dashed('2 5'));
      s += S.line(wx, cy - R, wx, cy + R, 'c', 1, { opacity: 0.6 });
      s += S.circle(wx, WY(Math.cos(th)), 5, 'a');
      s += S.circle(wx, py, 6, 'b');
      s += S.circle(px, py, 6.5, 'ink');
      return s;
    },
    theory: [
      ['The definition', `Measure an angle ${M('θ')} anticlockwise from the positive ${M('x')}-axis and follow it out to the circle of radius 1. The point you reach has coordinates ${M('(cos θ, sin θ)')}. For angles between 0° and 90° this agrees with the right-triangle ratios, but it also works for any angle, including obtuse, reflex and negative ones. That's why sine can be negative: below the axis, "how far up" is a negative number.`],
      ['Degrees and radians', `Mathematicians usually measure angles in <em>radians</em>: the length of arc the angle cuts from the unit circle. A full turn is the whole circumference, ${M('2π')}, so ${M('360° = 2π')} rad and 1 rad ≈ 57.3°. Calculus formulas such as ${M('(sin x)′ = cos x')} are only this simple in radians.`],
      ['The Pythagorean identity', `The point lies on the circle ${M('x^2 + y^2 = 1')}, so ${M('sin^2 θ + cos^2 θ = 1')} for every angle. The tangent is the ratio ${M('tan θ = sin θ / cos θ')}, which is the slope of the radius. It's undefined at 90° and 270°, where the radius is vertical.`],
      ['Symmetry and waves', `After a full turn everything repeats: sine and cosine are <em>periodic</em> with period 360°, or ${M('2π')}. Sine is odd, ${M('sin(−θ) = −sin θ')}, and cosine is even, ${M('cos(−θ) = cos θ')}. The cosine wave is the sine wave shifted a quarter turn: ${M('cos θ = sin(θ + 90°)')}. Unrolled over time, uniform circular motion becomes simple harmonic motion, the basic shape of every vibration.`],
    ],
    practice: ({ t }, h) => {
      const s = Math.sin(rad(t)), c = Math.cos(rad(t));
      return [
        `A Ferris wheel seat ${h.val('t')}° round from the 3 o’clock position, on a 20 m wheel, is ${h.r(20 * s, 1)} m ${s >= 0 ? 'above' : 'below'} the hub.`,
        `Walk 100 m in a direction ${h.val('t')}° anticlockwise from east: you end up ${h.c('a', fmt(100 * c, 1))} m east and ${h.c('b', fmt(100 * s, 1))} m north.`,
        `Anything that goes round and round, like a wheel, a pendulum or household AC power, traces this sine wave over time. Press Play to watch it.`,
        `sin² + cos² = 1 at every angle. It’s Pythagoras on a triangle whose long side is the radius, 1.`,
      ];
    },
  });

  MV.register({
    id: 'pythagoras',
    group: G,
    symbol: '◺',
    title: 'Pythagorean theorem',
    build: 2.6,
    lede: 'In a right triangle, the squares on the two short sides add up to the square on the long side.',
    params: {
      a: { value: 3, min: 1, max: 12, step: 0.5, color: 'a', label: 'side a' },
      b: { value: 4, min: 1, max: 12, step: 0.5, color: 'b', label: 'side b' },
    },
    formula: (p, h) => `${h.n('a')}<sup>2</sup>${op('+')}${h.n('b')}<sup>2</sup>${op('=')}${h.r(Math.hypot(p.a, p.b))}<sup>2</sup>`,
    aside: ({ a, b }, h) =>
      `<div>${h.c('a', fmt(a * a), 'a2')} + ${h.c('b', fmt(b * b), 'b2')} = ${h.c('ink', fmt(a * a + b * b), 'c2')}, so the long side is √${fmt(a * a + b * b)} = ${h.r(Math.hypot(a, b))}</div>`,
    steps: [
      { at: 0, hl: [], say: 'A right triangle with legs a and b. The long side, opposite the right angle, is c.' },
      { at: 0.12, hl: ['a', 'a2'], say: ({ a }) => `Build a square on side a: area ${fmt(a * a)}.` },
      { at: 0.26, hl: ['b', 'b2'], say: ({ b }) => `Build a square on side b: area ${fmt(b * b)}.` },
      { at: 0.42, hl: ['res'], say: 'And an empty square on the long side c.' },
      { at: 0.56, hl: ['a', 'a2', '+'], say: 'Pour the a² square into it: it fills exactly the part on its own side of the dashed line.' },
      { at: 0.74, hl: ['b', 'b2'], say: 'Pour in the b² square: it fills the rest, with nothing left over.' },
      { at: 0.9, hl: ['=', 'res', 'c2'], say: ({ a, b }) => `So a² + b² = c²: ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(a * a + b * b)}.` },
    ],
    // The closing chord plays the three side lengths as frequencies: 3-4-5 is a major triad.
    sfx: ({ a, b }) => {
      const c = Math.hypot(a, b), f = (x) => (660 * x) / c;
      return [
        sfx.tick(0.02, note(0)),
        sfx.glide(0.12, 0.27, f(a) / 2, f(a)),
        sfx.glide(0.26, 0.41, f(b) / 2, f(b)),
        sfx.glide(0.42, 0.54, f(c) / 2, f(c)),
        sfx.whoosh(0.56, 0.74), sfx.whoosh(0.74, 0.9),
        sfx.chord(0.91, [f(a), f(b), f(c)]),
      ];
    },
    draw({ a, b }, h, { k }) {
      const c = Math.hypot(a, b);
      const sc = Math.min(700 / (a + 2 * b), 390 / (2 * a + b));
      const ox = 400 - ((a + 2 * b) * sc) / 2 + b * sc;   // screen x of the right angle
      const oy = 210 - ((2 * a + b) * sc) / 2 + (a + b) * sc; // screen y of the right angle
      const P = (x, y) => [ox + x * sc, oy - y * sc];
      const poly = (pts, fill, stroke, extra = {}) => S.poly(pts.map(([x, y]) => P(x, y)), fill, stroke, { 'stroke-width': 2, ...extra });
      const u0 = seg(k, 0, 0.12), ua = seg(k, 0.12, 0.26), ub = seg(k, 0.26, 0.4), uc = seg(k, 0.42, 0.54);
      const fa = seg(k, 0.56, 0.74), fb = seg(k, 0.74, 0.9), u5 = seg(k, 0.9, 1);

      // The square on c, and the two parts of it that a² and b² fill exactly (split by the altitude from the right angle).
      const P1 = [a, 0], P2 = [0, b], n = [b, a], dir = [-a / c, b / c];
      const H = [a + dir[0] * (a * a) / c, dir[1] * (a * a) / c];
      const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
      const rectA = [P1, H, plus(H, n), plus(P1, n)], rectB = [H, P2, plus(P2, n), plus(H, n)];
      const sqA = [[0, 0], [a, 0], [a, -a], [0, -a]], sqB = [[0, 0], [0, b], [-b, b], [-b, 0]];

      let s = '';
      // The original squares grow outward from their sides, then stay behind as outlines once their copies pour out.
      if (ua > 0) s += poly([[0, 0], [a, 0], [a, -a * ua], [0, -a * ua]], fa > 0 ? null : 'a-soft', 'a', fa > 0 ? dashed('5 5') : {});
      if (ub > 0) s += poly([[0, 0], [0, b], [-b * ub, b], [-b * ub, 0]], fb > 0 ? null : 'b-soft', 'b', fb > 0 ? dashed('5 5') : {});
      if (uc > 0) s += poly([P1, P2, plus(P2, [b * uc, a * uc]), plus(P1, [b * uc, a * uc])], null, 'ink', { 'stroke-width': 2.5 });
      s += S.fade(seg(k, 0.56, 0.62), S.line(...P(...H), ...P(...plus(H, n)), 'ink', 1.5, dashed('4 5')) +
        S.line(...P(0, 0), ...P(...H), 'muted', 1, dashed('2 5')));
      if (fa > 0) s += poly(morph(sqA, rectA, fa), 'a-soft', 'a');
      if (fb > 0) s += poly(morph(sqB, rectB, fb), 'b-soft', 'b');

      // Unit grid inside the leg squares, so whole numbers can be counted.
      const grid = (m, f) => {
        let g = '';
        if (sc < 10 || m !== Math.floor(m)) return g;
        for (let i = 1; i < m; i++) g += f(i);
        return g;
      };
      s += S.fade(seg(k, 0.2, 0.3) * (1 - fa), grid(a, (i) => S.line(...P(i, 0), ...P(i, -a), 'a', 1, { opacity: 0.3 }) + S.line(...P(0, -i), ...P(a, -i), 'a', 1, { opacity: 0.3 })));
      s += S.fade(seg(k, 0.34, 0.44) * (1 - fb), grid(b, (i) => S.line(...P(0, i), ...P(-b, i), 'b', 1, { opacity: 0.3 }) + S.line(...P(-i, 0), ...P(-i, b), 'b', 1, { opacity: 0.3 })));

      s += S.fade(u0, S.poly([P(0, 0), P(a, 0), P(0, b)], 'paper', 'ink', { 'stroke-width': 2.5 }));
      const m = 12 / sc;
      s += S.fade(u0, S.path(`M${P(m, 0)} L${P(m, m)} L${P(0, m)}`, 'ink', 1.5));
      s += S.fade(u0, S.text(...P(a / 2, 0).map((v, i) => v + (i ? -8 : 0)), 'a', { fill: 'a', math: true, italic: true, size: 15 }) +
        S.text(...P(0, b / 2).map((v, i) => v + (i ? 5 : 10)), 'b', { fill: 'b', math: true, italic: true, size: 15, anchor: 'start' }) +
        S.text(...P(a / 2, b / 2).map((v, i) => v + (i ? -6 : -6)), 'c', { math: true, italic: true, size: 15, anchor: 'end' }));
      const label = ([x, y], str, color, size = 20) => S.text(x, y + size / 3, str, { fill: color, math: true, italic: true, size });
      s += S.fade(seg(k, 0.22, 0.28), label(P(a / 2, -a / 2), `a² = ${fmt(a * a)}`, 'a', Math.min(20, (a * sc) / 4.5)));
      s += S.fade(seg(k, 0.36, 0.42), label(P(-b / 2, b / 2), `b² = ${fmt(b * b)}`, 'b', Math.min(20, (b * sc) / 4.5)));
      s += S.fade(u5, label(P((a + b) / 2, (a + b) / 2), `c² = ${fmt(c * c)}`, 'ink', Math.min(22, (c * sc) / 5)));
      return s;
    },
    theory: [
      ['The statement', `In a triangle with a right angle, call the two sides that form it the <em>legs</em> ${M('a')} and ${M('b')}, and the side opposite it the <em>hypotenuse</em> ${M('c')}. Then ${M('a^2 + b^2 = c^2')}. The converse also holds: if three lengths satisfy the equation, the triangle they make has a right angle. Builders have used this to set out square corners for thousands of years.`],
      ['A proof by rearrangement', `Put four copies of the triangle inside a square of side ${M('a + b')}, with their hypotenuses forming a tilted square of side ${M('c')} in the middle. Counting the area two ways gives ${M('(a + b)^2 = c^2 + 4 · ab/2')}. Expanding the left side (see Square of a sum) gives ${M('a^2 + 2ab + b^2 = c^2 + 2ab')}, and the ${M('2ab')} cancels. Hundreds of other proofs are known.`],
      ['Whole-number triangles', `Triples of whole numbers that fit, like (3, 4, 5), (5, 12, 13) and (8, 15, 17), are <em>Pythagorean triples</em>. Every one comes from two whole numbers ${M('m > n')} as ${M('(m^2 − n^2, 2mn, m^2 + n^2)')}, possibly scaled. A Babylonian tablet, Plimpton 322, lists such triples from around 1800 BCE.`],
      ['Distance', `On a grid, the straight-line distance between ${M('(x_1, y_1)')} and ${M('(x_2, y_2)')} is the hypotenuse of a right triangle: ${M('d = √((x_2 − x_1)^2 + (y_2 − y_1)^2)')}. For triangles without a right angle the <em>law of cosines</em>, ${M('c^2 = a^2 + b^2 − 2ab cos C')}, adds a correction term that vanishes when ${M('C')} = 90°.`],
    ],
    practice: ({ a, b }, h) => {
      const c = Math.hypot(a, b);
      return [
        `Walk ${h.val('a')} blocks east and ${h.val('b')} blocks north: as the crow flies, you’re ${h.r(c)} blocks from where you started.`,
        `A ladder reaching ${h.val('b')} m up a wall, with its foot ${h.val('a')} m out, must be ${h.r(c)} m long.`,
        `Builders check corners with 3, 4 and 5: mark 3 m along one wall and 4 m along the other. If the gap measures exactly 5 m, the corner is square.`,
        `Two forces at right angles, ${h.val('a')} N and ${h.val('b')} N, combine into a single pull of ${h.r(c)} N.`,
      ];
    },
  });

  MV.register({
    id: 'right-triangle',
    group: G,
    symbol: '∠',
    title: 'Right-triangle ratios',
    lede: 'Fix an angle and every right triangle with it has the same proportions. Sine, cosine and tangent name those ratios.',
    params: {
      t: { value: 35, min: 5, max: 85, step: 1, color: 'c', label: 'angle in degrees', digits: 0 },
      h: { value: 8, min: 1, max: 10, step: 0.5, color: 'ink', label: 'hypotenuse length' },
    },
    formula: (p, h) => {
      const opp = p.h * Math.sin(rad(p.t));
      return `sin ${h.n('t')}°${op('=')}${h.frac(h.c('b', fmt(opp), 'opp'), h.n('h'))}${op('=')}${h.r(Math.sin(rad(p.t)), 3)}`;
    },
    steps: [
      { at: 0, hl: ['t'], say: ({ t }) => `Stand at the ${fmt(t, 0)}° corner. The side running along beside you is the adjacent.` },
      { at: 0.25, hl: ['opp'], say: 'The side across from the angle is the opposite.' },
      { at: 0.5, hl: ['h'], say: 'The longest side, facing the right angle, is the hypotenuse.' },
      { at: 0.75, hl: ['t', 'res'], say: ({ t, h: hy }) => `sin ${fmt(t, 0)}° = opposite ÷ hypotenuse = ${fmt(hy * Math.sin(rad(t)))} ÷ ${fmt(hy)} = ${fmt(Math.sin(rad(t)), 3)}. Change the hypotenuse: the ratio stays.` },
    ],
    sfx: ({ t, h: hy }) => {
      const f = (x) => 220 + 60 * x;
      return [
        sfx.glide(0, 0.24, f(0), f(hy * Math.cos(rad(t)))),
        sfx.glide(0.25, 0.49, f(0), f(hy * Math.sin(rad(t)))),
        sfx.glide(0.5, 0.74, f(0), f(hy)),
        sfx.chime(0.8, pitch(12 * Math.sin(rad(t)))),
      ];
    },
    aside(p, h) {
      const th = rad(p.t), opp = p.h * Math.sin(th), adj = p.h * Math.cos(th);
      const H = h.val('h');
      return `<div>cos ${h.v('θ')} = ${h.frac(h.c('a', 'adjacent'), 'hypotenuse')} = ${h.frac(h.c('a', fmt(adj)), H)} = ${h.r(Math.cos(th), 3)}</div>` +
        `<div>tan ${h.v('θ')} = ${h.frac(h.c('b', 'opposite'), h.c('a', 'adjacent'))} = ${h.frac(h.c('b', fmt(opp)), h.c('a', fmt(adj)))} = ${h.r(Math.tan(th), 3)}</div>`;
    },
    draw(p, h, { k }) {
      const th = rad(p.t), sc = 34;
      const adj = p.h * Math.cos(th) * sc, opp = p.h * Math.sin(th) * sc;
      const ax = 400 - adj / 2 - 40, ay = 210 + opp / 2;
      const A = [ax, ay], B = [ax + adj, ay], C = [ax + adj, ay - opp];
      // Adjacent, then opposite, then the hypotenuse closes the triangle.
      const u1 = seg(k, 0, 0.25), u2 = seg(k, 0.25, 0.5), u3 = seg(k, 0.5, 0.75), u4 = seg(k, 0.75, 1);
      let s = S.fade(u3, S.poly([A, B, C], 'ink-soft', null));
      s += S.line(...A, lerp(A[0], B[0], u1), ay, 'a', 4);
      if (u2 > 0) s += S.line(...B, B[0], lerp(B[1], C[1], u2), 'b', 4);
      if (u3 > 0) s += S.line(...C, lerp(C[0], A[0], u3), lerp(C[1], A[1], u3), 'ink', 4);
      const m = Math.min(14, adj / 3, opp / 3);
      s += S.fade(u2, S.path(`M${B[0] - m} ${B[1]} V${B[1] - m} H${B[0]}`, 'ink', 1.5));
      const ar = 44;
      s += S.path(`M${ax + ar} ${ay} A${ar} ${ar} 0 0 0 ${ax + ar * Math.cos(th)} ${ay - ar * Math.sin(th)}`, 'c', 2.5, drawOn(u4));
      s += S.fade(u4, S.text(ax + (ar + 16) * Math.cos(th / 2), ay - (ar + 16) * Math.sin(th / 2) + 5, `${fmt(p.t, 0)}°`, { fill: 'c', size: 14, weight: 600, anchor: 'start' }));
      s += S.fade(u1, S.text(ax + adj / 2, ay + 26, `adjacent ${fmt(adj / sc)}`, { fill: 'a', size: 14 }));
      s += S.fade(u2, S.text(B[0] + 14, ay - opp / 2 + 5, `opposite ${fmt(opp / sc)}`, { fill: 'b', size: 14, anchor: 'start' }));
      const nx = -Math.sin(th), ny = -Math.cos(th);
      s += S.fade(u3, S.text(ax + adj / 2 + nx * 18, ay - opp / 2 + ny * 18, `hypotenuse ${fmt(p.h)}`, { size: 14, anchor: 'end' }));
      return s;
    },
    theory: [
      ['The definitions', `In a right triangle, pick one of the two acute angles and call it ${M('θ')}. Relative to it, the side across from it is the <em>opposite</em>, the leg beside it is the <em>adjacent</em>, and the longest side is the <em>hypotenuse</em>. Then ${M('sin θ')} = opposite / hypotenuse, ${M('cos θ')} = adjacent / hypotenuse and ${M('tan θ')} = opposite / adjacent. SOH-CAH-TOA is the usual way to remember them.`],
      ['Why only the angle matters', `Change the hypotenuse above and every side scales by the same factor, so the ratios don't move. All right triangles with the same angle ${M('θ')} are <em>similar</em>: scaled copies of one another. That's what makes sine, cosine and tangent functions of the angle alone, and it's why a table of them (or a calculator) can solve any right triangle.`],
      ['Complements', `The two acute angles add to 90°. The side opposite one is adjacent to the other, so ${M('sin θ = cos(90° − θ)')}. That's where the name comes from: the <em>co</em>-sine is the sine of the <em>complementary</em> angle. The reciprocals have names too: ${M('csc θ = 1/sin θ')}, ${M('sec θ = 1/cos θ')} and ${M('cot θ = 1/tan θ')}.`],
      ['Running it backwards', `Knowing two sides, the inverse functions recover the angle: ${M('θ')} = arcsin(opposite / hypotenuse), and likewise arccos and arctan. Surveyors, navigators and game engines use this constantly to turn measured lengths into directions.`],
    ],
    practice: (p, h) => {
      const th = rad(p.t), opp = p.h * Math.sin(th), adj = p.h * Math.cos(th);
      return [
        `A ${h.val('h')} m ladder leaning at ${h.val('t')}° to the ground reaches ${h.c('b', fmt(opp))} m up the wall, with its foot ${h.c('a', fmt(adj))} m out.`,
        `A ramp at ${h.val('t')}° rises ${h.r(Math.tan(th))} m for every metre forward. Wheelchair ramps stay under about 5°.`,
        `With the sun ${h.val('t')}° above the horizon, a 10 m tree casts a shadow ${h.r(10 / Math.tan(th))} m long.`,
        `On a slope of ${h.val('t')}°, ${h.r(Math.sin(th) * 100, 0)}% of an object’s weight pulls it downhill. That’s why steep roads are harder to climb.`,
      ];
    },
  });
})();
