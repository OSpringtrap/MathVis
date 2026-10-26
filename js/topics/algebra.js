(() => {
  'use strict';
  const { S, fmt, dashed, plane, MINUS, seg, lerp, lerpPt, drawOn, M, sfx, pitch, note } = MV;
  // Sonify a curve: sample y across the plane and turn each height into a pitch.
  const curveTones = (f, xr = 12.6) => Array.from({ length: 48 }, (_, i) => pitch(Math.max(-24, Math.min(24, 2 * f(-xr + (2 * xr * i) / 47)))));
  const G = 'Algebra';
  const op = (s) => `<span class="op">${s}</span>`;

  MV.register({
    id: 'linear',
    group: G,
    symbol: '╱',
    title: 'Straight lines',
    lede: 'Start somewhere, then change by the same amount at every step. That steady change draws a straight line.',
    params: {
      m: { value: 0.5, min: -4, max: 4, step: 0.25, color: 'a', label: 'slope m' },
      b: { value: 1, min: -6, max: 6, step: 0.5, color: 'b', label: 'intercept b' },
      x: { value: 4, min: -10, max: 10, step: 0.5, color: 'c', label: 'x' },
    },
    formula: (p, h) => `${h.v('y')}${op('=')}${h.n('m')}${h.v('x')}${h.signed('b')}`,
    aside: ({ m, b, x }, h) =>
      `<div>When ${h.v('x')} = ${h.n('x')}, ${h.v('y')} = ${h.val('m')} × ${h.val('x')} + ${h.val('b')} = ${h.r(m * x + b)}</div>`,
    steps: [
      { at: 0, hl: [], say: 'Plot every point where y = mx + b, from left to right. Listen: the pitch follows the height.' },
      { at: 0.4, hl: ['b'], say: ({ b }) => `At x = 0 the line passes through ${fmt(b)}, the intercept b.` },
      { at: 0.5, hl: ['x'], say: 'From any point, take one step to the right…' },
      { at: 0.65, hl: ['m'], say: ({ m }) => `…and the line ${m >= 0 ? 'rises' : 'falls'} by ${fmt(Math.abs(m))}. That’s the slope m, the same everywhere.` },
      { at: 0.8, hl: ['x', 'res'], say: ({ m, b, x }) => `At x = ${fmt(x)}: y = ${fmt(m)} × ${fmt(x)} + ${fmt(b)} = ${fmt(m * x + b)}.` },
    ],
    sfx: ({ m, b, x }) => [
      sfx.curve(0, 0.4, curveTones((t) => m * t + b)),
      sfx.tick(0.42, pitch(2 * b)),
      sfx.glide(0.5, 0.64, pitch(2 * (m * x + b)), pitch(2 * (m * x + b))),
      sfx.glide(0.65, 0.79, pitch(2 * (m * x + b)), pitch(2 * (m * x + b + m))),
      sfx.chime(0.84, pitch(Math.max(-12, Math.min(12, 2 * (m * x + b))))),
    ],
    draw({ m, b, x }, h, { k }) {
      const P = plane();
      const f = (t) => m * t + b, y = f(x);
      const u1 = seg(k, 0, 0.4), u2 = seg(k, 0.4, 0.5), u3 = seg(k, 0.5, 0.65), u4 = seg(k, 0.65, 0.8), u5 = seg(k, 0.8, 1);
      let inner = P.curve(f, 'ink', 3, drawOn(u1));
      inner += S.fade(u2, S.circle(P.X(0), P.Y(b), 6, 'b'));
      // Slope triangle: one step right, then m up.
      inner += S.line(P.X(x), P.Y(y), P.X(x + u3), P.Y(y), 'muted', 2, dashed('4 4'));
      inner += S.fade(u3, S.text(P.X(x + 0.5), P.Y(y) + (m >= 0 ? 18 : -9), '1', { fill: 'muted', size: 13 }));
      if (u4 > 0) {
        inner += S.line(P.X(x + 1), P.Y(y), P.X(x + 1), P.Y(y + m * u4), 'a', 3.5);
        inner += S.fade(u4, S.text(P.X(x + 1) + 9, P.Y(y + m / 2) + 5, fmt(m), { fill: 'a', size: 15, anchor: 'start', weight: 600 }));
      }
      // Drop lines from the point to both axes.
      inner += S.fade(u5,
        S.line(P.X(x), P.Y(0), P.X(x), P.Y(y), 'c', 1.5, dashed('3 5')) +
        S.line(P.X(0), P.Y(y), P.X(x), P.Y(y), 'c', 1.5, dashed('3 5')) +
        S.circle(P.X(x), P.Y(y), 7, 'c', 'paper', { 'stroke-width': 2 }));
      return P.svg + P.clip(inner);
    },
    theory: [
      ['Slope and intercept', `${M('y = mx + b')} is the <em>slope–intercept form</em> of a line. The intercept ${M('b')} is the value of ${M('y')} when ${M('x = 0')}, where the line crosses the vertical axis. The slope ${M('m')} is the rate of change: between any two points on the line, ${M('m = Δy / Δx = (y_2 − y_1) / (x_2 − x_1)')}. "Rise over run" is the same everywhere along the line, and that constancy is exactly what makes it straight.`],
      ['Reading the slope', `A positive ${M('m')} rises to the right, a negative one falls, and ${M('m = 0')} is flat. A vertical line ${M('x = c')} has no slope at all (it would need ${M('Δx = 0')} in the denominator), so it can't be written in this form. Unless the slope is 0, the line crosses the horizontal axis once, at the <em>root</em> ${M('x = −b / m')}.`],
      ['Other forms', `The <em>point–slope form</em> ${M('y − y_1 = m(x − x_1)')} builds a line through a known point. The <em>standard form</em> ${M('Ax + By = C')} also covers vertical lines. Two lines are parallel when their slopes are equal, and perpendicular when their slopes multiply to ${M('−1')}.`],
      ['Why it matters', `A function is linear exactly when equal steps in ${M('x')} always give equal steps in ${M('y')}. In calculus, the derivative of ${M('mx + b')} is ${M('m')} everywhere. Every smooth curve looks like a straight line if you zoom in far enough, which is why lines are the first approximation to almost everything.`],
    ],
    practice: ({ m, b, x }, h) => {
      const y = m * x + b;
      return [
        m >= 0
          ? `A phone plan costs $${h.val('b')} a month plus $${h.val('m')} per GB. Using ${h.val('x')} GB costs $${h.r(y)}.`
          : `A tank starts with ${h.val('b')} L and drains ${h.val('m', -m)} L per minute. After ${h.val('x')} minutes it holds ${h.r(y)} L.`,
        `The slope ${h.val('m')} is the steady rate: one step to the right always moves the line ${m >= 0 ? 'up' : 'down'} by ${h.val('m', Math.abs(m))}.`,
        `The intercept ${h.val('b')} is where you start, at ${h.v('x')} = 0. It’s where the line crosses the vertical axis.`,
        `In physics, position at constant speed is a line: ${h.v('x')} = ${h.v('x')}₀ + ${h.v('v')}${h.v('t')}. The slope is the speed.`,
      ];
    },
  });

  MV.register({
    id: 'quadratic',
    group: G,
    symbol: '∪',
    title: 'Parabolas',
    lede: 'Add an x² term and the line bends into a curve that turns around once, at its vertex.',
    params: {
      a: { value: 0.5, min: -3, max: 3, step: 0.1, color: 'a', label: 'a, the x² coefficient' },
      b: { value: -1, min: -8, max: 8, step: 0.5, color: 'b', label: 'b, the x coefficient' },
      c: { value: -3, min: -6, max: 6, step: 0.5, color: 'c', label: 'c, the constant' },
    },
    formula: (p, h) => `${h.v('y')}${op('=')}${h.n('a')}${h.v('x')}<sup>2</sup>${h.signed('b')}${h.v('x')}${h.signed('c')}`,
    aside({ a, b, c }, h) {
      if (a === 0) return `<div class="note">With a = 0 the x² term vanishes, and what’s left is a straight line.</div>`;
      const A = h.c('a', 'a'), B = h.c('b', 'b'), C = h.c('c', 'c');
      const D = b * b - 4 * a * c;
      let roots;
      if (D > 1e-9) {
        const r1 = (-b - Math.sqrt(D)) / (2 * a), r2 = (-b + Math.sqrt(D)) / (2 * a);
        roots = `crosses zero at ${h.v('x')} = ${h.r(Math.min(r1, r2))} and ${h.v('x')} = ${h.r(Math.max(r1, r2))}`;
      } else if (D >= -1e-9) {
        roots = `touches zero once, at ${h.v('x')} = ${h.r(-b / (2 * a))}`;
      } else {
        roots = `never crosses zero, because b² − 4ac = ${fmt(D)} is negative`;
      }
      return `<div>${h.v('x')} = ${h.frac(`${MINUS}${B} ± √(${B}² ${MINUS} 4${A}${C})`, `2${A}`)}</div>` +
        `<div class="note">The curve ${roots}.</div>`;
    },
    steps: ({ a, b, c }) => [
      { at: 0, hl: ['a'], say: 'Plot y = ax² + bx + c from left to right. The pitch follows the height: hear it turn around.' },
      ...(a !== 0 ? [
        { at: 0.45, hl: ['b', 'a'], say: `It’s symmetric about the line x = −b ÷ 2a = ${fmt(-b / (2 * a))}.` },
        { at: 0.6, hl: ['res'], say: b * b - 4 * a * c >= 0 ? 'Where the curve meets y = 0 are the roots, given by the formula above.' : 'This one never reaches y = 0, so it has no real roots.' },
        { at: 0.75, hl: [], say: `The vertex: the ${a > 0 ? 'lowest' : 'highest'} point, where the curve turns.` },
      ] : []),
      { at: 0.88, hl: ['c'], say: ({ c }) => `At x = 0 only c is left: the curve crosses the vertical axis at ${fmt(c)}.` },
    ],
    sfx: ({ a, b, c }) => {
      const ev = [sfx.curve(0, 0.45, curveTones((x) => a * x * x + b * x + c))];
      if (a !== 0 && b * b - 4 * a * c >= 0) ev.push(sfx.pop(0.62, note(5)), sfx.pop(0.68, note(7)));
      if (a !== 0) ev.push(sfx.chime(0.77, note(3)));
      ev.push(sfx.tick(0.9, pitch(2 * c)));
      return ev;
    },
    draw({ a, b, c }, h, { k }) {
      const P = plane();
      const f = (x) => a * x * x + b * x + c;
      const u1 = seg(k, 0, 0.45), u2 = seg(k, 0.45, 0.6), u3 = seg(k, 0.6, 0.75), u4 = seg(k, 0.75, 0.88), u5 = seg(k, 0.88, 1);
      let inner = '';
      if (a !== 0) {
        const vx = -b / (2 * a), vy = f(vx);
        inner += S.fade(u2, S.line(P.X(vx), P.Y(P.yr), P.X(vx), P.Y(-P.yr), 'muted', 1.5, dashed('3 6')));
        inner += P.curve(f, 'ink', 3, drawOn(u1));
        const D = b * b - 4 * a * c;
        if (D >= 0) {
          for (const r of new Set([(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)])) {
            inner += S.fade(u3, S.circle(P.X(r), P.Y(0), 6 * (0.5 + u3 / 2), 'ink'));
          }
        }
        inner += S.fade(u4, S.circle(P.X(vx), P.Y(vy), 7, 'paper', 'ink', { 'stroke-width': 2.5 }) +
          S.text(P.X(vx), P.Y(vy) + (a > 0 ? 26 : -16), 'vertex', { fill: 'muted', size: 13 }));
      } else {
        inner += P.curve(f, 'ink', 3, drawOn(u1));
      }
      inner += S.fade(u5, S.circle(P.X(0), P.Y(c), 6, 'c'));
      return P.svg + P.clip(inner);
    },
    theory: [
      ['The shape', `A <em>quadratic function</em> ${M('y = ax^2 + bx + c')} with ${M('a ≠ 0')} always draws a parabola. Its graph is symmetric about the vertical line ${M('x = −b / 2a')}, the <em>axis of symmetry</em>, which passes through the vertex. The sign of ${M('a')} decides whether it opens up (a minimum) or down (a maximum). Its size decides how fast it widens: the curve is just ${M('y = x^2')} stretched vertically by ${M('a')}, then shifted.`],
      ['Completing the square', `Any quadratic can be rewritten in <em>vertex form</em>, ${M('y = a(x − h)^2 + k')}, where ${M('h = −b / 2a')} and ${M('k = c − b^2 / 4a')}. The trick is to add and subtract ${M('(b / 2a)^2')} so that part of the expression becomes a perfect square. In this form the vertex ${M('(h, k)')} can be read straight off.`],
      ['The quadratic formula', `Completing the square on ${M('ax^2 + bx + c = 0')} and solving gives ${M('x = (−b ± √(b^2 − 4ac)) / 2a')}. The quantity under the root, the <em>discriminant</em> ${M('Δ = b^2 − 4ac')}, decides everything. If ${M('Δ > 0')} there are two real roots. If ${M('Δ = 0')} there is one double root, where the vertex sits on the axis. If ${M('Δ < 0')} there are no real roots, only a pair of complex ones.`],
      ['Hidden relationships', `If the roots are ${M('r_1')} and ${M('r_2')}, then ${M('ax^2 + bx + c = a(x − r_1)(x − r_2)')}. Expanding gives <em>Vieta's formulas</em>: ${M('r_1 + r_2 = −b / a')} and ${M('r_1 r_2 = c / a')}. Unlike a line, whose steps in ${M('y')} are constant, a parabola's steps grow steadily. Their <em>second differences</em> are constant and equal to ${M('2a')}.`],
    ],
    practice: ({ a, b, c }, h) => {
      const vx = a ? -b / (2 * a) : 0, vy = a * vx * vx + b * vx + c;
      return [
        a === 0
          ? `Set ${h.val('a')} to anything but zero to bring the curve back.`
          : `The vertex sits at ${h.v('x')} = ${h.r(vx)}, where ${h.v('y')} = ${h.r(vy)}. It’s the ${a > 0 ? 'lowest' : 'highest'} point, because ${h.val('a')} is ${a > 0 ? 'positive and the curve opens upward' : 'negative and the curve opens downward'}.`,
        `A ball thrown upward at 15 m/s from a height of 2 m follows ${h.v('h')} = −4.9${h.v('t')}² + 15${h.v('t')} + 2. It peaks at ${h.r(2 + 15 ** 2 / (4 * 4.9))} m after ${h.r(15 / 9.8)} s.`,
        `A larger ${h.val('a', Math.abs(a))} squeezes the curve narrower. ${h.val('c')} lifts or lowers the whole curve, and is where it crosses the vertical axis.`,
        `Revenue often looks like this: raise the price too far and sales drop. The vertex is the price that earns the most.`,
      ];
    },
  });

  MV.register({
    id: 'square-of-sum',
    group: G,
    symbol: '□',
    title: 'Square of a sum',
    build: 2.6,
    lede: 'Why (a + b)² isn’t a² + b². Build the square and two extra rectangles appear.',
    params: {
      a: { value: 3, min: 1, max: 8, step: 0.5, color: 'a', label: 'a' },
      b: { value: 2, min: 1, max: 8, step: 0.5, color: 'b', label: 'b' },
    },
    formula: (p, h) => `(${h.n('a')}${op('+')}${h.n('b')})<sup>2</sup>${op('=')}${h.r((p.a + p.b) ** 2)}`,
    aside: ({ a, b }, h) =>
      `<div>= ${h.c('a', 'a²', 'a2')} + ${h.c('c', '2ab', 'ab')} + ${h.c('b', 'b²', 'b2')} = ${h.c('a', fmt(a * a), 'a2')} + ${h.c('c', fmt(2 * a * b), 'ab')} + ${h.c('b', fmt(b * b), 'b2')}</div>`,
    steps: [
      { at: 0, hl: ['a', 'a2'], say: ({ a }) => `A square of side ${fmt(a)}: area a² = ${fmt(a * a)}.` },
      { at: 0.25, hl: ['+', 'b', 'ab'], say: ({ a, b }) => `Widen it by ${fmt(b)}: a new strip, a × b = ${fmt(a * b)}.` },
      { at: 0.42, hl: ['b', 'ab'], say: ({ a, b }) => `Make it ${fmt(b)} taller too: another a × b = ${fmt(a * b)}.` },
      { at: 0.65, hl: ['b', 'b2'], say: ({ b }) => `The corner left over is b × b = ${fmt(b * b)}.` },
      { at: 0.82, hl: ['=', 'res'], say: ({ a, b }) => `Four pieces fill the big square: a² + 2ab + b² = ${fmt((a + b) ** 2)}.` },
    ],
    sfx: ({ a, b }) => [
      sfx.glide(0, 0.25, pitch(0), pitch(4)),
      sfx.whoosh(0.25, 0.46), sfx.tick(0.46, note(4)),
      sfx.whoosh(0.42, 0.63), sfx.tick(0.63, note(5)),
      sfx.glide(0.65, 0.82, pitch(7), pitch(12)),
      sfx.chime(0.86, pitch(12)),
    ],
    draw({ a, b }, h, { k }) {
      const sc = 330 / (a + b), A = a * sc, B = b * sc, x0 = 90, y0 = 52;
      const piece = (x, y, w, hgt, fill, stroke, label, value) => {
        let s = S.rect(x + 1, y + 1, w - 2, hgt - 2, fill, stroke, { rx: 3, 'stroke-width': 1.5 });
        const big = Math.min(w, hgt) >= 46;
        s += S.text(x + w / 2, y + hgt / 2 + (big ? -2 : 6), label, { fill: stroke, math: true, size: big ? 22 : 16, italic: true });
        if (big) s += S.text(x + w / 2, y + hgt / 2 + 20, fmt(value), { fill: stroke, size: 13 });
        return s;
      };
      // a² grows from its corner, the two ab strips slide in, then b² fills the last corner.
      const u1 = seg(k, 0, 0.25), u2 = seg(k, 0.25, 0.48), u3 = seg(k, 0.42, 0.65), u4 = seg(k, 0.65, 0.82), u5 = seg(k, 0.82, 1);
      let s = '';
      if (u1 > 0) s += piece(x0, y0, A * u1, A * u1, 'a-soft', 'a', 'a²', a * a);
      s += S.fade(u2, piece(x0 + A + (1 - u2) * 120, y0, B, A, 'c-soft', 'c', 'ab', a * b));
      s += S.fade(u3, piece(x0, y0 + A + (1 - u3) * 80, A, B, 'c-soft', 'c', 'ab', a * b));
      if (u4 > 0) s += piece(x0 + A, y0 + A, B * u4, B * u4, 'b-soft', 'b', 'b²', b * b);
      // Side lengths.
      s += S.fade(u1, S.line(x0, y0 - 12, x0 + A - 3, y0 - 12, 'a', 3) + S.text(x0 + A / 2, y0 - 22, fmt(a), { fill: 'a', size: 14 }) +
        S.line(x0 - 12, y0, x0 - 12, y0 + A - 3, 'a', 3) + S.text(x0 - 22, y0 + A / 2 + 5, fmt(a), { fill: 'a', size: 14, anchor: 'end' }));
      s += S.fade(u4, S.line(x0 + A + 3, y0 - 12, x0 + A + B, y0 - 12, 'b', 3) + S.text(x0 + A + B / 2, y0 - 22, fmt(b), { fill: 'b', size: 14 }) +
        S.line(x0 - 12, y0 + A + 3, x0 - 12, y0 + A + B, 'b', 3) + S.text(x0 - 22, y0 + A + B / 2 + 5, fmt(b), { fill: 'b', size: 14, anchor: 'end' }));
      // Tally on the right, one line per piece as it arrives.
      const tx = 500;
      const row = (y, label, value, color) =>
        S.text(tx, y, label, { fill: color, math: true, size: 22, anchor: 'start', italic: true }) +
        S.text(tx + 200, y, fmt(value), { fill: color, size: 18, anchor: 'end' });
      s += S.fade(u1, row(130, 'a²', a * a, 'a')) + S.fade(u2, row(172, 'ab', a * b, 'c')) +
        S.fade(u3, row(214, 'ab', a * b, 'c')) + S.fade(u4, row(256, 'b²', b * b, 'b'));
      s += S.fade(u5, S.line(tx, 278, tx + 200, 278, 'ink', 1.5) +
        S.text(tx, 312, `(a + b)²`, { math: true, size: 22, anchor: 'start', italic: true }) +
        S.text(tx + 200, 312, fmt((a + b) ** 2), { size: 18, anchor: 'end', weight: 600 }));
      return s;
    },
    theory: [
      ['The algebra', `Squaring means multiplying by itself, so ${M('(a + b)^2 = (a + b)(a + b)')}. The distributive law multiplies every term of the first bracket by every term of the second: ${M('a·a + a·b + b·a + b·b')}. Since ${M('ab = ba')}, the middle terms combine into ${M('2ab')}, giving ${M('(a + b)^2 = a^2 + 2ab + b^2')}.`],
      ['The geometry', `The picture is the same calculation drawn as areas, and it's how the Greeks wrote it (Euclid, <em>Elements</em> II.4). A square of side ${M('a + b')} splits into a square ${M('a^2')}, a square ${M('b^2')}, and two rectangles of ${M('a × b')}. The rectangles are the part that's easy to forget. Writing ${M('(a + b)^2 = a^2 + b^2')} is a mistake common enough to have a nickname, the "freshman's dream".`],
      ['Related identities', `Replacing ${M('b')} with ${M('−b')} gives ${M('(a − b)^2 = a^2 − 2ab + b^2')}. Higher powers follow the <em>binomial theorem</em>: ${M('(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3')}, and in general the coefficients are the rows of Pascal's triangle, 1 2 1, 1 3 3 1, 1 4 6 4 1, …`],
    ],
    practice: ({ a, b }, h) => [
      `A common slip is writing (${h.val('a')} + ${h.val('b')})² = ${h.val('a')}² + ${h.val('b')}² = ${fmt(a * a + b * b)}. That misses the two rectangles, ${h.c('c', fmt(2 * a * b))}.`,
      `Widen a ${h.val('a')} m square patio by ${h.val('b')} m on two sides and it grows from ${fmt(a * a)} m² to ${h.r((a + b) ** 2)} m², not ${fmt(a * a + b * b)} m².`,
      `Mental maths: 31² = (30 + 1)² = 900 + 60 + 1 = ${h.r(961)}.`,
    ],
  });

  MV.register({
    id: 'difference-of-squares',
    group: G,
    symbol: '◱',
    title: 'Difference of squares',
    build: 3,
    lede: 'Cut a small square from the corner of a big one, slide one piece over, and the rest becomes a rectangle.',
    params: {
      a: { value: 7, min: 2, max: 10, step: 0.5, color: 'a', label: 'big square side a' },
      b: { value: 3, min: 0, max: 10, step: 0.5, color: 'b', label: 'small square side b' },
    },
    constrain: (p) => ({ ...p, b: Math.min(p.b, p.a) }),
    formula: (p, h) =>
      `${h.n('a')}<sup>2</sup>${op(MINUS)}${h.n('b')}<sup>2</sup>${op('=')}${h.r(p.a * p.a - p.b * p.b)}`,
    aside: ({ a, b }, h) =>
      `<div>= (${h.val('a')} + ${h.val('b')})(${h.val('a')} ${MINUS} ${h.val('b')}) = ${h.c('ink', fmt(a + b), 'w')} × ${h.c('ink', fmt(a - b), 'ht')}</div>`,
    steps: ({ a, b }) => [
      { at: 0, hl: ['a'], say: `Start with a square of side ${fmt(a)}: area ${fmt(a * a)}.` },
      { at: 0.22, hl: [MINUS, 'b'], say: `Cut a ${fmt(b)} × ${fmt(b)} square from the corner. What’s left is a² − b².` },
      ...(a > b ? [
        { at: 0.45, hl: [], say: 'Move the strip across, and turn the lower block a quarter turn to stand beside it.' },
        { at: 0.85, hl: ['=', 'res', 'w', 'ht'], say: `One rectangle, ${fmt(a + b)} wide and ${fmt(a - b)} tall: (a + b)(a − b) = ${fmt(a * a - b * b)}.` },
      ] : []),
    ],
    sfx: [sfx.tick(0.04, note(0)), sfx.snip(0.24), sfx.pop(0.32, note(9)), sfx.whoosh(0.45, 0.85), sfx.chime(0.88, note(5))],
    draw({ a, b }, h, { k }) {
      const sc = Math.min(320 / a, 640 / (2 * a + b)), d = a - b;
      const A = a * sc, Bs = b * sc, Ds = d * sc;
      const x0 = 50, y0 = 60, x1 = x0 + A + 70;
      const u1 = seg(k, 0, 0.2), u2 = seg(k, 0.22, 0.4), u3 = seg(k, 0.45, 0.85), u4 = seg(k, 0.85, 1);
      let s = '';
      // The whole a² square, then the b² corner is cut away.
      s += S.fade(u1, S.rect(x0, y0, A, A, null, 'a', { 'stroke-width': 1.5, ...dashed('5 5') }) +
        S.text(x0 + A / 2, y0 - 14, `${fmt(a)}`, { fill: 'a', size: 14 }) +
        S.text(x0 - 10, y0 + A / 2 + 5, `${fmt(a)}`, { fill: 'a', size: 14, anchor: 'end' }));
      s += S.fade(u1 * (1 - u2), S.rect(x0 + Ds, y0 + Ds, Bs, Bs, 'b-soft', 'b', { 'stroke-width': 1.5 }));
      s += S.fade(u2, S.rect(x0 + Ds, y0 + Ds, Bs, Bs, null, 'b', { 'stroke-width': 1.5, ...dashed('5 5') }) +
        (Bs > 30 ? S.text(x0 + Ds + Bs / 2, y0 + Ds + Bs / 2 + 6, 'b²', { fill: 'b', math: true, italic: true, size: 18 }) : ''));
      if (d <= 0) {
        return s + S.fade(u2, S.text(x1 + 120, y0 + A / 2, 'Nothing left: a² − a² = 0', { fill: 'muted', size: 15 }));
      }
      // The two remaining pieces travel to the right; the lower one turns a quarter turn on the way.
      const strip = lerpPt([x0, y0], [x1, y0], u3);
      s += S.fade(u1, S.rect(strip[0], strip[1], A, Ds, 'a-soft', 'a', { 'stroke-width': 1.5 }));
      const c0 = [x0 + Ds / 2, y0 + Ds + Bs / 2], c1 = [x1 + A + Bs / 2, y0 + Ds / 2];
      const c = lerpPt(c0, c1, u3);
      s += S.fade(u1, `<g transform="translate(${c[0]} ${c[1]}) rotate(${90 * u3})">` +
        S.rect(-Ds / 2, -Bs / 2, Ds, Bs, 'c-soft', 'c', { 'stroke-width': 1.5 }) + '</g>');
      if (u3 > 0) s += S.arrow(x0 + A + 16, y0 + Ds / 2, x0 + A + 16 + (x1 - x0 - A - 32) * u3, y0 + Ds / 2, 'muted', 2);
      s += S.fade(u4,
        S.line(x1, y0 + Ds + 14, x1 + A + Bs, y0 + Ds + 14, 'ink', 1.5) +
        S.text(x1 + (A + Bs) / 2, y0 + Ds + 36, `a + b = ${fmt(a + b)}`, { size: 14 }) +
        S.line(x1 + A + Bs + 14, y0, x1 + A + Bs + 14, y0 + Ds, 'ink', 1.5) +
        S.text(x1 + A + Bs + 24, y0 + Ds / 2 + 5, `a − b = ${fmt(d)}`, { size: 14, anchor: 'start' }));
      return s;
    },
    theory: [
      ['The identity', `${M('a^2 − b^2 = (a + b)(a − b)')}. Expanding the right-hand side gives ${M('a^2 − ab + ab − b^2')}, and the two middle terms cancel. Reading it from left to right is <em>factoring</em>, turning a difference into a product. That's useful because a product is zero exactly when one of its factors is.`],
      ['The picture', `Remove the ${M('b × b')} corner from an ${M('a × a')} square. The L-shape that's left splits into a strip ${M('a')} wide and ${M('a − b')} tall, and a block ${M('b')} wide and ${M('a − b')} tall. Both share the height ${M('a − b')}, so they join side by side into one rectangle of width ${M('a + b')}.`],
      ['Where it shows up', `Factoring: ${M('x^2 − 9 = (x + 3)(x − 3)')}, so the roots are ±3. Removing roots from denominators: ${M('(√p − √q)(√p + √q) = p − q')}. Mental arithmetic: multiply two numbers that sit evenly around a round number. It also generalizes: ${M('a^n − b^n = (a − b)(a^{n−1} + a^{n−2}b + … + b^{n−1})')}.`],
    ],
    practice: ({ a, b }, h) => [
      `Cut a ${h.val('b')} m square from the corner of a ${h.val('a')} m square sheet, and ${h.r(a * a - b * b)} m² remains, enough to make a ${fmt(a + b)} × ${fmt(a - b)} rectangle.`,
      `Mental maths: 49 × 51 = (50 − 1)(50 + 1) = 50² − 1² = ${h.r(2499)}.`,
      `Factoring works backwards from the picture: x² − 9 = (x + 3)(x − 3).`,
    ],
  });
})();
