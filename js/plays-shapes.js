// "Show formula" plays for trigonometry and geometry. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, seg, lin, lerp, lerpPt, clamp01, dashed, drawOn, fit, morph } = MV;
  const { play, label, shape, plus, remap, topicDraw, brace, cells, iso, reg } = MV.playKit;
  const rad = (d) => (d * Math.PI) / 180;

  // =====================================================================
  // Sine and cosine
  // =====================================================================

  const UC = { cx: 230, cy: 250, R: 120 };
  const ucBase = (t, extra = '') => {
    const th = rad(t), px = UC.cx + UC.R * Math.cos(th), py = UC.cy - UC.R * Math.sin(th);
    return { th, px, py, svg: S.line(UC.cx - 140, UC.cy, UC.cx + 140, UC.cy, 'grid2', 1.5) + S.line(UC.cx, UC.cy - 140, UC.cx, UC.cy + 140, 'grid2', 1.5) + S.circle(UC.cx, UC.cy, UC.R, null, 'grid2', { 'stroke-width': 1.5 }) + extra };
  };
  const tri = ({ t }) => { const th = rad(t), c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)); return { c, s, Pt: (x, y) => [210 + x * 120, 250 - y * 120] }; };

  reg('unit-circle', {
    'Point on the circle': play({
      intro: 'A circle of radius 1, centred where the axes cross.',
      scene: ({ t }, h, k, u) => {
        const tt = t * u(0), B = ucBase(tt);
        let s = B.svg + S.line(UC.cx, UC.cy, B.px, B.py, 'ink', 2.5) + S.circle(B.px, B.py, 7, 'c');
        s += S.fade(u(1), S.line(UC.cx, UC.cy + 3, B.px, UC.cy + 3, 'a', 5) + S.line(B.px, UC.cy, B.px, B.py, 'grid2', 1, dashed('3 4')) + label(520, 150, `across: cos θ = ${fmt(Math.cos(B.th), 3)}`, { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), S.line(B.px, UC.cy, B.px, B.py, 'b', 5) + label(520, 180, `up: sin θ = ${fmt(Math.sin(B.th), 3)}`, { fill: 'b', anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'P']], color: 'c', hl: ['t'], say: ({ t }) => `P: turn a radius through θ = ${fmt(t, 0)}° and mark where it ends.` },
        { parts: [[1, ' = ('], [2, 'cos θ']], color: 'a', hl: ['cos'], say: 'cos θ: how far across that point is.' },
        { parts: [[3, ', sin θ'], [4, ')']], color: 'b', hl: ['res'], say: 'sin θ: how far up. Together they are the point’s coordinates.' },
      ],
      vary: [{ key: 't', amp: 140, label: 'θ', say: 'Vary θ: as the point goes round, its across and up values swing between −1 and 1.' }],
    }),
    'Pythagorean identity': play({
      intro: 'A circle of radius 1, and a radius at the angle θ, folded into the first quarter.',
      backdrop: (q) => { const { c, s, Pt } = tri(q); return S.circle(210, 250, 120, null, 'grid2', { 'stroke-width': 1.5 }) + S.poly([Pt(0, 0), Pt(c, 0), Pt(c, s)], 'ink-soft', null) + S.line(...Pt(0, 0), ...Pt(c, s), 'ink', 2.5) + label(...Pt(c / 2 - 0.12, s / 2 + 0.06), '1', { weight: 600 }); },
      pieces: [
        { text: 'sin²θ', color: 'b', hl: ['t', 'res'], say: 'sin²θ: the height of the radius is sin θ. Build a square on it.', draw: (q, u) => { const { c, s, Pt } = tri(q); return S.line(...Pt(c, 0), ...Pt(c, s), 'b', 4) + shape(Pt, [[c, 0], [c, s], [c + s * u, s], [c + s * u, 0]], 'b-soft', 'b', { 'stroke-width': 1.5 }) + S.fade(u, label(600, 160, `sin²θ = ${fmt(s * s, 3)}`, { fill: 'b', size: 16, anchor: 'start' })); } },
        { text: ' + cos²θ', color: 'a', hl: ['cos'], say: 'cos²θ: the width is cos θ. Build a square on that too.', draw: (q, u) => { const { c, Pt } = tri(q); return S.line(...Pt(0, 0), ...Pt(c, 0), 'a', 4) + shape(Pt, [[0, 0], [c, 0], [c, -c * u], [0, -c * u]], 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.fade(u, label(600, 200, `cos²θ = ${fmt(c * c, 3)}`, { fill: 'a', size: 16, anchor: 'start' })); } },
        { text: ' = 1', say: 'The square on the radius has area 1 × 1. By Pythagoras the two small squares add up to exactly that, at every angle.', draw: (q, u) => { const { c, s, Pt } = tri(q); const n = [-s * u, c * u]; return shape(Pt, [[0, 0], [c, s], plus([c, s], n), n], 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.fade(u, S.line(600, 218, 760, 218, 'ink', 1.5) + label(600, 244, `sum = ${fmt(c * c + s * s, 3)}`, { size: 16, anchor: 'start', weight: 600 })); } },
      ],
      vary: [{ key: 't', amp: 70, label: 'θ', say: 'Vary θ: one square grows as the other shrinks, and they always add up to 1.' }],
    }),
    Tangent: play({
      intro: 'A radius at angle θ, and a vertical line touching the circle on the right.',
      scene: ({ t }, h, k, u) => {
        const B = ucBase(t), tn = Math.tan(B.th), R = UC.R;
        let s = B.svg + S.line(UC.cx + R, UC.cy - 140, UC.cx + R, UC.cy + 140, 'grid2', 1.5, dashed('4 4'));
        s += S.line(UC.cx, UC.cy, B.px, B.py, 'ink', 2.5);
        if (Math.cos(B.th) > 0.15 && Math.abs(tn) < 2.2) s += S.fade(u(0), S.line(UC.cx, UC.cy, UC.cx + R, UC.cy - R * tn, 'c', 2.5) + S.line(UC.cx + R, UC.cy, UC.cx + R, UC.cy - R * tn, 'c', 5) + label(UC.cx + R + 10, UC.cy - (R * tn) / 2, `tan θ = ${fmt(tn, 3)}`, { fill: 'c', anchor: 'start', weight: 600 }));
        s += S.fade(u(1), S.line(B.px, UC.cy, B.px, B.py, 'b', 4) + label(520, 300, `sin θ = ${fmt(Math.sin(B.th), 3)}`, { fill: 'b', anchor: 'start' }));
        s += S.fade(u(2), S.line(UC.cx, UC.cy + 3, B.px, UC.cy + 3, 'a', 4) + label(520, 326, `cos θ = ${fmt(Math.cos(B.th), 3)}`, { fill: 'a', anchor: 'start' }) + label(520, 356, `sin ÷ cos = ${Math.abs(Math.cos(B.th)) < 1e-6 ? 'undefined' : fmt(tn, 3)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'tan θ']], color: 'c', say: 'tan θ: extend the radius until it hits the vertical line: how high it hits is the tangent.' },
        { parts: [[1, ' = sin θ']], color: 'b', say: 'sin θ: the height of the small triangle inside the circle.' },
        { parts: [[2, ' / cos θ']], color: 'a', say: '/ cos θ: the small triangle and the big one have the same shape, so height ÷ width matches: sin θ ÷ cos θ.' },
      ],
      vary: [{ key: 't', amp: 30, min: 5, max: 80, label: 'θ', say: 'Vary θ: near 90° the radius points almost straight up and the tangent shoots off to infinity.' }],
    }),
    Symmetry: play({
      intro: 'An angle θ, and the same angle measured the other way, −θ.',
      scene: ({ t }, h, k, u) => {
        const B = ucBase(t), mirrorY = UC.cy + (UC.cy - B.py);
        let s = B.svg + S.line(UC.cx, UC.cy, B.px, B.py, 'ink', 2.5) + S.circle(B.px, B.py, 7, 'c');
        s += S.fade(u(0), S.line(UC.cx, UC.cy, B.px, mirrorY, 'ink', 2.5, dashed('5 4')) + S.circle(B.px, mirrorY, 7, 'b'));
        s += S.fade(u(1), S.line(B.px, UC.cy, B.px, B.py, 'b', 4) + S.line(B.px + 6, UC.cy, B.px + 6, mirrorY, 'b', 4, { opacity: 0.6 }) + label(520, 150, `sin(−θ) = ${fmt(-Math.sin(B.th), 3)}: flipped`, { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), S.line(UC.cx, UC.cy + 3, B.px, UC.cy + 3, 'a', 5) + label(520, 180, `cos(−θ) = ${fmt(Math.cos(B.th), 3)}: the same`, { fill: 'a', anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'θ and −θ']], say: 'Turning the other way is a mirror image across the horizontal axis.' },
        { parts: [[1, ':  sin(−θ) = −sin θ']], color: 'b', say: 'The mirror flips the height: sine changes sign.' },
        { parts: [[2, ',  cos(−θ) = cos θ']], color: 'a', say: 'The across distance is untouched: cosine stays the same.' },
      ],
      vary: [{ key: 't', amp: 70, label: 'θ', say: 'Vary θ: the two points move as mirror images.' }],
    }),
    Shift: play({
      intro: 'One full turn, unrolled into waves.',
      scene: ({ t }, h, k, u) => {
        const X = (d) => 100 + (d / 450) * 620, Y = (v) => 240 - v * 110;
        const wave = (fn, shift, from = 0, to = 450) => { let d = ''; for (let x = from, i = 0; x <= to; x += 3, i++) d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(fn(rad(x + shift))).toFixed(1)} `; return d; };
        let s = S.line(X(0), Y(0), X(450), Y(0), 'grid2', 1.5);
        for (const d of [90, 180, 270, 360]) s += label(X(d), Y(0) + 20, `${d}°`, { fill: 'muted', size: 11 });
        s += S.path(wave(Math.cos, 0), 'a', 3, drawOn(u(0)));
        s += S.fade(u(1), S.path(wave(Math.sin, 90 * u(2)), 'b', 3, dashed('6 5')));
        s += S.fade(u(2), label(400, 390, 'sin, shifted 90° to the left, lands exactly on cos', { weight: 600 }));
        s += S.line(X(t), Y(1.1), X(t), Y(-1.1), 'c', 1.5, { opacity: 0.6 });
        return s;
      },
      pieces: [
        { parts: [[0, 'cos θ']], color: 'a', say: 'cos θ: starts at its highest, 1.' },
        { parts: [[1, ' = sin(θ']], color: 'b', say: 'sin θ: the same wave, but starting from 0, a quarter turn behind.' },
        { parts: [[2, ' + 90°)']], color: 'c', say: '+ 90°: slide the sine wave a quarter turn earlier, and it sits exactly on the cosine.' },
      ],
    }),
    Radians: play({
      intro: 'A circle, and its radius.',
      scene: (q, h, k, u) => {
        const { cx, cy, R } = UC;
        let s = S.circle(cx, cy, R, null, 'grid2', { 'stroke-width': 1.5 }) + S.line(cx, cy, cx + R, cy, 'a', 3);
        const n = 2 * Math.PI, shown = u(0) + u(1) * (n - 1);
        for (let i = 0; i < Math.ceil(shown - 1e-9); i++) {
          const a0 = i, a1 = Math.min(i + 1, shown);
          const p0 = [cx + R * Math.cos(a0), cy - R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), cy - R * Math.sin(a1)];
          s += S.path(`M${p0[0]} ${p0[1]} A${R} ${R} 0 0 0 ${p1[0]} ${p1[1]}`, i % 2 ? 'b' : 'a', 6) + (a1 - a0 > 0.5 ? label(cx + (R + 22) * Math.cos(a0 + 0.5), cy - (R + 22) * Math.sin(a0 + 0.5) + 5, String(i + 1), { size: 12, weight: 600 }) : '');
        }
        s += S.fade(u(0), label(520, 150, '1 radian: an arc as long as the radius', { anchor: 'start', fill: 'a' }));
        s += S.fade(u(2), label(520, 190, '6.28… radii fit round the circle', { anchor: 'start', weight: 600 }) + label(520, 216, '2π radians = 360°,  1 rad ≈ 57.3°', { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, '1 rad']], color: 'a', say: 'Bend the radius onto the circle: the angle it covers is 1 radian.' },
        { parts: [[1, ' × 2π']], color: 'b', say: 'Keep laying radius-lengths round the edge: a bit more than six fit, 2π of them.' },
        { parts: [[2, ' = 360°']], say: 'A full turn is 360°, so 2π radians = 360°.' },
      ],
    }),
  });

  // =====================================================================
  // Pythagorean theorem
  // =====================================================================

  const pyFit = (a, b) => fit(-b, a + b, -a, a + b, { x: 60, y: 70, w: 420, h: 330 }, 40);
  reg('pythagoras', {
    'Pythagorean theorem': play({
      intro: 'A right triangle with legs a and b.',
      scene: (q, h, k, u, start, stop) => topicDraw('pythagoras')(q, h, remap(k, [[0, 0], [start(0), 0.12], [stop(0), 0.26], [stop(1), 0.42], [start(2) + (stop(2) - start(2)) * 0.25, 0.56], [stop(2), 1], [1, 1]])),
      pieces: [
        { text: 'a²', color: 'a', hl: ['a'], say: ({ a }) => `a²: a square on side a, area ${fmt(a * a)}.` },
        { text: ' + b²', color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b²: a square on side b, area ${fmt(b * b)}.` },
        { text: ' = c²', hl: ['=', 'res'], say: ({ a, b }) => `= c²: pour both into the square on the long side. They fill it exactly: ${fmt(a * a + b * b)}.` },
      ],
      vary: [
        { key: 'a', amp: 2, min: 1, say: 'Vary a: the a² square and its share of the big square change together.' },
        { key: 'b', amp: 2, min: 1, say: 'Vary b: the same with b. The two shares always fill the big square.' },
      ],
    }),
    'Long side': play({
      intro: 'Two squares, of side a and side b.',
      scene: ({ a, b }, h, k, u) => {
        const c = Math.hypot(a, b), sc = Math.min(22, 200 / c), base = 360;
        const A = a * sc, B = b * sc, C = c * sc, m = u(1);
        let s = S.fade(1 - m, S.rect(120, base - A * u(0), A, A * u(0), 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.rect(140 + A, base - B * u(0), B, B * u(0), 'b-soft', 'b', { 'stroke-width': 1.5 }));
        s += S.fade(u(0) * (1 - m), label(120 + A / 2, base + 22, `a² = ${fmt(a * a)}`, { fill: 'a' }) + label(140 + A + B / 2, base + 22, `b² = ${fmt(b * b)}`, { fill: 'b' }));
        if (m > 0) s += S.rect(lerp(120, 200, m), base - C, C, C, 'ink-soft', 'ink', { 'stroke-width': 2, opacity: m }) + S.fade(m, label(200 + C / 2, base - C / 2, `${fmt(a * a + b * b)}`, { weight: 600 }));
        if (u(2) > 0) {
          s += S.line(200, base + 14, 200 + C * u(2), base + 14, 'c', 5) + S.fade(u(2), label(200 + C / 2, base + 38, `side √${fmt(a * a + b * b)} = ${fmt(c)}`, { fill: 'c', weight: 600 }));
          const ox = 500, oy = base, P = (x, y) => [ox + x * sc, oy - y * sc];
          s += S.fade(u(2), S.poly([P(0, 0), P(a, 0), P(0, b)], 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.line(...P(a, 0), ...P(0, b), 'c', 4) + label(...P(a / 2 + 0.6, b / 2 + 0.6), 'c', { fill: 'c', weight: 600 }));
        }
        return s;
      },
      pieces: [
        { parts: [[2, 'a² + b²']], hl: ['a', 'b'], say: 'a² + b²: the two squares’ areas, added.' },
        { parts: [[1, '√('], [3, ')']], say: 'Squeeze that total area into one square: √ gives its side.' },
        { parts: [[0, 'c = ']], color: 'c', hl: ['res'], say: 'That side is exactly the long side of the right triangle.' },
      ],
      vary: [{ key: 'a', amp: 2, min: 1, say: 'Vary a: the combined square, and so c, grows with it.' }],
    }),
    'Short side': play({
      intro: 'You know the long side c and one leg b. What is the other leg?',
      scene: ({ a, b }, h, k, u) => {
        const c = Math.hypot(a, b), sc = Math.min(22, 220 / c), C = c * sc, B = b * sc, A = a * sc, x0 = 140, base = 370;
        let s = S.rect(x0, base - C * u(0), C, C * u(0), 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.fade(u(0), label(x0 + C / 2, base + 22, `c² = ${fmt(c * c)}`));
        s += S.fade(u(1), S.rect(x0, base - B, B, B, 'b', null, { opacity: 0.55 }) + label(x0 + B / 2, base - B / 2 + 5, `− b² = ${fmt(b * b)}`, { fill: 'paper', size: 12, weight: 600 }));
        if (u(2) > 0) s += S.rect(x0 + C + 60, base - A * u(2), A, A * u(2), 'a-soft', 'a', { 'stroke-width': 2 }) + S.fade(u(2), label(x0 + C + 60 + A / 2, base + 22, `left over ${fmt(a * a)}, side ${fmt(a)}`, { fill: 'a', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'c²']], say: 'c²: the square on the long side.' },
        { parts: [[3, ' − b²']], color: 'b', hl: ['b'], say: '− b²: take away the square on the known leg.' },
        { parts: [[0, 'a = '], [1, '√('], [4, ')']], color: 'a', hl: ['a'], say: 'a = √: what’s left is the square on the other leg; its side is a.' },
      ],
      vary: [{ key: 'b', amp: 2, min: 1, say: 'Vary b: the more of c² the known leg takes, the less is left for a.' }],
    }),
    Distance: play({
      intro: 'Two points on a grid.',
      scene: ({ a, b }, h, k, u) => {
        const { P } = fit(-1, a + 1, -1, b + 1, { x: 140, y: 80, w: 420, h: 300 }, 30);
        let s = '';
        for (let i = 0; i <= a; i++) s += S.line(...P(i, 0), ...P(i, b), 'grid', 1);
        for (let j = 0; j <= b; j++) s += S.line(...P(0, j), ...P(a, j), 'grid', 1);
        s += S.circle(...P(0, 0), 7, 'ink') + S.circle(...P(a, b), 7, 'ink') + label(...P(0, 0).map((v, i) => v + (i ? 22 : -10)), '(x₁, y₁)', { anchor: 'end' }) + label(...P(a, b).map((v, i) => v + (i ? -12 : 10)), '(x₂, y₂)', { anchor: 'start' });
        s += S.line(...P(0, 0), ...lerpPt(P(0, 0), P(a, 0), u(0)), 'a', 4) + S.fade(u(0), label(...P(a / 2, 0).map((v, i) => v + (i ? 22 : 0)), `x₂ − x₁ = ${fmt(a)}`, { fill: 'a', weight: 600 }));
        s += S.line(...P(a, 0), ...lerpPt(P(a, 0), P(a, b), u(1)), 'b', 4) + S.fade(u(1), label(...P(a, b / 2).map((v, i) => v + (i ? 0 : 10)), `y₂ − y₁ = ${fmt(b)}`, { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.line(...P(0, 0), ...lerpPt(P(0, 0), P(a, b), u(2)), 'c', 4) + S.fade(u(2), label(600, 200, `d = √(${fmt(a)}² + ${fmt(b)}²) = ${fmt(Math.hypot(a, b))}`, { fill: 'c', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, '(x₂ − x₁)²']], color: 'a', hl: ['a'], say: 'x₂ − x₁: how far across.' },
        { parts: [[2, ' + (y₂ − y₁)²']], color: 'b', hl: ['b'], say: 'y₂ − y₁: how far up. Together they make the legs of a right triangle.' },
        { parts: [[0, 'd = √('], [3, ')']], color: 'c', say: 'd: the straight-line distance is that triangle’s long side, by Pythagoras.' },
      ],
      vary: [{ key: 'b', amp: 3, min: 1, say: 'Vary how far up the second point is: the distance changes, always √(across² + up²).' }],
    }),
    'Law of cosines': play({
      intro: 'Two sides a and b with an angle C between them, not necessarily 90°.',
      values: { C: 70 },
      scene: ({ a, b, C }, h, k, u) => {
        const th = rad(C), c2 = a * a + b * b - 2 * a * b * Math.cos(th);
        const pts = [[0, 0], [a, 0], [b * Math.cos(th), b * Math.sin(th)]];
        const { P } = fit(Math.min(0, pts[2][0]), Math.max(a, pts[2][0]), 0, Math.max(1, pts[2][1]), { x: 60, y: 90, w: 380, h: 280 }, 30);
        let s = S.poly(pts.map((p) => P(...p)), 'ink-soft', null) + S.line(...P(0, 0), ...P(a, 0), 'a', 4) + S.line(...P(0, 0), ...P(...pts[2]), 'b', 4) + S.line(...P(a, 0), ...P(...pts[2]), 'c', 4);
        s += S.path(`M${P(0.15 * a, 0)} A20 20 0 0 0 ${P(...pts[2].map((v) => (v * 0.15 * a) / b))}`, 'ink', 1.5) + label(...P(0, 0).map((v, i) => v + (i ? -8 : 30)), `C = ${fmt(C, 0)}°`, { anchor: 'start', size: 12 });
        const sc = 1.6, bar = (y, val, color, text, uu) => S.fade(uu, S.rect(520, y, Math.max(0, Math.min(230, val * sc)), 18, color, null, { rx: 3 }) + label(520, y - 6, text, { fill: color, size: 12, anchor: 'start' }));
        s += bar(120, a * a + b * b, 'ink', `a² + b² = ${fmt(a * a + b * b)}`, u(0)) + bar(180, Math.abs(2 * a * b * Math.cos(th)), 'b', `${Math.cos(th) >= 0 ? '−' : '+'} 2ab cos C = ${fmt(Math.abs(2 * a * b * Math.cos(th)))}`, u(1)) + bar(240, c2, 'c', `c² = ${fmt(c2)}`, u(2));
        return s;
      },
      pieces: [
        { parts: [[0, 'c² = '], [1, 'a² + b²']], say: 'a² + b²: what c² would be if C were a right angle.' },
        { parts: [[2, ' − 2ab cos C']], color: 'b', say: '− 2ab cos C: a correction. Narrower than 90° and c shrinks; wider and cos C goes negative, so c grows.' },
        { parts: [], color: 'c', say: 'c²: the true square on the third side.' },
      ],
      vary: [{ key: 'C', amp: 60, min: 15, max: 165, label: 'C', color: 'c', say: 'Vary the angle C: at exactly 90° the correction vanishes and it’s Pythagoras.' }],
    }),
  });

  // =====================================================================
  // Right-triangle ratios
  // =====================================================================

  const rt = ({ t, h }) => { const th = rad(t), sc = 30, adj = h * Math.cos(th) * sc, opp = h * Math.sin(th) * sc, ax = 260 - adj / 2, ay = 240 + opp / 2; return { th, adj, opp, A: [ax, ay], B: [ax + adj, ay], C: [ax + adj, ay - opp] }; };
  const SIDES = {
    opp: { color: 'b', name: 'opposite', draw: (G, u) => S.line(...G.B, G.B[0], lerp(G.B[1], G.C[1], u), 'b', 6) },
    adj: { color: 'a', name: 'adjacent', draw: (G, u) => S.line(...G.A, lerp(G.A[0], G.B[0], u), G.A[1], 'a', 6) },
    hyp: { color: 'ink', name: 'hypotenuse', draw: (G, u) => S.line(...G.A, lerp(G.A[0], G.C[0], u), lerp(G.A[1], G.C[1], u), 'ink', 6) },
  };
  const lenOf = (G, key) => ({ opp: G.opp, adj: G.adj, hyp: Math.hypot(G.adj, G.opp) })[key] / 30;
  function ratioPlay(fn, num, den, value) {
    return play({
      intro: 'A right triangle with an angle θ at the left corner.',
      backdrop: (q) => { const G = rt(q); return S.poly([G.A, G.B, G.C], 'ink-soft', 'grid2', { 'stroke-width': 1.5 }) + S.path(`M${G.A[0] + 40} ${G.A[1]} A40 40 0 0 0 ${G.A[0] + 40 * Math.cos(G.th)} ${G.A[1] - 40 * Math.sin(G.th)}`, 'c', 3); },
      pieces: [
        { parts: [[0, `${fn} θ`]], color: 'c', hl: ['t'], say: ({ t }) => `${fn} θ: for the ${fmt(t, 0)}° corner…`, draw: () => '' },
        { parts: [[1, ` = ${num}`]], color: SIDES[num].color, say: `…take the ${SIDES[num].name} side…`, draw: (q, u) => { const G = rt(q); return SIDES[num].draw(G, u) + S.fade(u, label(560, 140, `${SIDES[num].name} ${fmt(lenOf(G, num))}`, { fill: SIDES[num].color, anchor: 'start', weight: 600 })); } },
        { parts: [[2, ` / ${den}`]], color: SIDES[den].color, hl: den === 'hyp' ? ['h'] : [], say: `…and divide by the ${SIDES[den].name}.`, draw: (q, u) => { const G = rt(q); return SIDES[den].draw(G, u) + S.fade(u, label(560, 166, `${SIDES[den].name} ${fmt(lenOf(G, den))}`, { fill: SIDES[den].color, anchor: 'start', weight: 600 })); } },
        { parts: [], hl: ['res'], say: 'Lay the two sides side by side: the fraction of one in the other is the ratio.',
          draw: (q, u) => { const G = rt(q), n = lenOf(G, num), d = lenOf(G, den), L = 220 * Math.min(1, 1 / Math.max(1, n / d)), x = 540; return S.fade(u, S.rect(x, 240, L, 16, 'ink-soft', SIDES[den].color === 'ink' ? 'ink' : SIDES[den].color, { rx: 3 }) + S.rect(x, 266, Math.min(240, (L * n) / d) * u, 16, SIDES[num].color, null, { rx: 3 }) + label(x, 310, `= ${fmt(value(G.th), 3)}`, { anchor: 'start', size: 18, weight: 600 })); } },
      ],
      vary: [
        { key: 'h', amp: 3, min: 1, label: 'hypotenuse', say: 'Vary the size: the whole triangle grows and shrinks, but the ratio stays the same. It depends only on the angle.' },
        { key: 't', amp: 25, min: 5, max: 85, label: 'θ', say: 'Vary θ: now the shape changes, and so does the ratio.' },
      ],
    });
  }
  reg('right-triangle', {
    Sine: ratioPlay('sin', 'opp', 'hyp', Math.sin),
    Cosine: ratioPlay('cos', 'adj', 'hyp', Math.cos),
    Tangent: ratioPlay('tan', 'opp', 'adj', Math.tan),
    Complement: play({
      intro: 'The two acute angles of a right triangle add up to 90°.',
      scene: (q, h, k, u) => {
        const G = rt(q);
        let s = S.poly([G.A, G.B, G.C], 'ink-soft', 'grid2', { 'stroke-width': 1.5 }) + S.path(`M${G.A[0] + 40} ${G.A[1]} A40 40 0 0 0 ${G.A[0] + 40 * Math.cos(G.th)} ${G.A[1] - 40 * Math.sin(G.th)}`, 'c', 3) + label(G.A[0] + 54, G.A[1] - 8, 'θ', { fill: 'c', anchor: 'start' });
        s += S.fade(u(0), SIDES.opp.draw(G, 1) + SIDES.hyp.draw(G, 1) + label(560, 140, `sin θ = opp/hyp = ${fmt(Math.sin(G.th), 3)}`, { anchor: 'start', fill: 'b', weight: 600 }));
        s += S.fade(u(1), S.circle(...G.C, 30, null, 'a', { 'stroke-width': 3, 'stroke-dasharray': '6 4' }) + label(G.C[0] + 14, G.C[1] - 10, '90° − θ', { fill: 'a', anchor: 'start', weight: 600 }) + label(560, 180, 'from the top corner, that same side is the adjacent', { anchor: 'start', fill: 'a', size: 12 }) + label(560, 206, `cos(90° − θ) = ${fmt(Math.cos(Math.PI / 2 - G.th), 3)}`, { anchor: 'start', fill: 'a', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'sin θ']], color: 'b', hl: ['t'], say: 'sin θ: opposite over hypotenuse, seen from the bottom corner.' },
        { parts: [[1, ' = cos(90° − θ)']], color: 'a', say: 'Stand at the other corner, whose angle is 90° − θ: the same side is now beside you, so the same ratio is its cosine.' },
      ],
      vary: [{ key: 't', amp: 25, min: 5, max: 85, label: 'θ', say: 'Vary θ: the two corners trade, and the two numbers always match.' }],
    }),
    Inverse: play({
      intro: 'You know two sides. What is the angle?',
      scene: (q, h, k, u) => {
        const G = rt(q), r = G.opp / Math.hypot(G.adj, G.opp);
        let s = S.poly([G.A, G.B, G.C], 'ink-soft', 'grid2', { 'stroke-width': 1.5 }) + SIDES.opp.draw(G, 1) + SIDES.hyp.draw(G, 1);
        s += S.fade(u(0), label(560, 140, `opp ÷ hyp = ${fmt(r, 3)}`, { anchor: 'start', weight: 600 }));
        const sweep = G.th * u(1);
        if (u(1) > 0) s += S.path(`M${G.A[0] + 44} ${G.A[1]} A44 44 0 0 0 ${G.A[0] + 44 * Math.cos(sweep)} ${G.A[1] - 44 * Math.sin(sweep)}`, 'c', 4) + label(560, 180, `the angle whose sine is ${fmt(r, 3)}: ${fmt((sweep * 180) / Math.PI, 1)}°`, { anchor: 'start', fill: 'c', weight: 600 });
        return s;
      },
      pieces: [
        { parts: [[1, 'arcsin(opp / hyp)']], hl: ['opp', 'h'], say: 'Measure the two sides and divide: that’s the sine of the angle.' },
        { parts: [[0, 'θ = ']], color: 'c', hl: ['t'], say: 'θ = arcsin(…): run the sine backwards to find the angle that gives that ratio.' },
      ],
      vary: [{ key: 't', amp: 25, min: 5, max: 85, label: 'θ', say: 'Vary the triangle’s shape: the ratio changes and the recovered angle follows it.' }],
    }),
  });

  // =====================================================================
  // Rectangle and square
  // =====================================================================

  const sweepMap = (start, stop) => [[0, 0], [start(0), 0.06], [stop(0), 0.26], [start(1), 0.28], [start(1) + (stop(1) - start(1)) * 0.35, 0.42], [stop(1), 0.94], [stop(2), 1], [1, 1]];
  // Unroll a closed shape's sides into one straight line: lengths, colours.
  function unroll(lens, colors, u, y = 360) {
    const total = lens.reduce((x, v) => x + v, 0), sc = Math.min(40, 620 / total), x0 = 400 - (total * sc) / 2;
    let s = '', pos = 0;
    lens.forEach((len, i) => {
      const ui = clamp01(u * lens.length - i);
      if (ui > 0) s += S.line(x0 + pos * sc + 2, y, x0 + (pos + len * ui) * sc - 2, y, colors[i], 6) + (ui >= 1 ? label(x0 + (pos + len / 2) * sc, y - 12, fmt(len), { fill: colors[i], size: 12 }) : '');
      pos += len;
    });
    return { s, total, sc, x0 };
  }
  const rectFig = (w, hh) => { const sc = Math.min(30, 300 / w, 180 / hh); return S.rect(400 - (w * sc) / 2, 90, w * sc, hh * sc, 'ink-soft', 'ink', { 'stroke-width': 2 }); };

  reg('rectangle', {
    Area: play({
      intro: 'Start from a single point.',
      scene: (q, h, k, u, start, stop) => topicDraw('rectangle')(q, h, remap(k, sweepMap(start, stop))),
      pieces: [
        { parts: [[1, 'w']], color: 'a', hl: ['w'], say: ({ w }) => `w: stretch the point into a base ${fmt(w)} long.` },
        { parts: [[2, ' × h']], color: 'b', hl: ['×', 'ht'], say: ({ ht }) => `× h: raise a height of ${fmt(ht)}, and sweep the base up through it, one row at a time.` },
        { parts: [[0, 'A = ']], hl: ['=', 'res'], say: ({ w, ht }) => `A =: the area swept out, ${fmt(w * ht)} square units.` },
      ],
      vary: [
        { key: 'w', amp: 3, min: 1, say: 'Vary w: every row gets longer or shorter.' },
        { key: 'ht', amp: 2, min: 1, label: 'h', say: 'Vary h: rows are added or taken away.' },
      ],
    }),
    Perimeter: play({
      intro: 'Walk all the way round the rectangle.',
      scene: ({ w, ht }, h, k, u) => rectFig(w, ht) + unroll([w, ht, w, ht], ['a', 'b', 'a', 'b'], lerp(0, 0.5, u(0)) + lerp(0, 0.5, u(1))).s + S.fade(u(1), label(400, 410, `P = ${fmt(2 * (w + ht))}`, { size: 17, weight: 600 })),
      pieces: [
        { parts: [[1, 'w + h']], hl: ['w', 'ht'], say: 'w + h: a base and a side, laid end to end.' },
        { parts: [[0, 'P = 2('], [2, ')']], say: '2(…): the other base and side are the same again, so double it.' },
      ],
      vary: [{ key: 'w', amp: 3, min: 1, say: 'Vary w: two of the four pieces change.' }],
    }),
    Diagonal: play({
      intro: 'A rectangle, cut corner to corner.',
      scene: ({ w, ht }, h, k, u) => {
        const { P } = fit(-ht, w, -w, ht, { x: 120, y: 80, w: 400, h: 320 }, 30);
        let s = shape(P, [[0, 0], [w, 0], [w, ht], [0, ht]], 'ink-soft', 'ink');
        s += S.fade(u(0), shape(P, [[0, 0], [w, 0], [w, -w], [0, -w]], 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(...P(w / 2, -w / 2), `w² = ${fmt(w * w)}`, { fill: 'a' }));
        s += S.fade(u(1), shape(P, [[0, 0], [0, ht], [-ht, ht], [-ht, 0]], 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(...P(-ht / 2, ht / 2), `h² = ${fmt(ht * ht)}`, { fill: 'b' }));
        s += S.line(...P(w, 0), ...lerpPt(P(w, 0), P(0, ht), u(2)), 'c', 4) + S.fade(u(2), label(600, 200, `d = √${fmt(w * w + ht * ht)} = ${fmt(Math.hypot(w, ht))}`, { fill: 'c', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'w²']], color: 'a', hl: ['w'], say: 'w²: a square on the base.' },
        { parts: [[3, ' + h²']], color: 'b', hl: ['ht'], say: '+ h²: a square on the side. Base and side meet at a right angle…' },
        { parts: [[0, 'd = '], [1, '√('], [4, ')']], color: 'c', say: '…so by Pythagoras the diagonal is √(w² + h²).' },
      ],
      vary: [{ key: 'ht', amp: 2, min: 1, label: 'h', say: 'Vary h: the diagonal stretches with it.' }],
    }),
  });

  reg('square', {
    Area: play({
      intro: 'Start from a single point.',
      scene: (q, h, k, u, start, stop) => topicDraw('square')(q, h, remap(k, sweepMap(start, stop))),
      pieces: [
        { parts: [[1, 's']], color: 'a', hl: ['s'], say: ({ s }) => `s: a side ${fmt(s)} long.` },
        { parts: [[2, '²']], hl: ['sq'], say: ({ s }) => `²: the same length again, straight up, and sweep: ${fmt(s)} rows of ${fmt(s)}.` },
        { parts: [[0, 'A = ']], hl: ['=', 'res'], say: ({ s }) => `A =: ${fmt(s * s)} square units.` },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary s: twice the side gives four times the area.' }],
    }),
    Perimeter: play({
      intro: 'Walk round the square.',
      scene: ({ s }, h, k, u) => rectFig(s, s) + unroll([s, s, s, s], ['a', 'a', 'a', 'a'], u(0)).s + S.fade(u(1), label(400, 410, `P = 4 × ${fmt(s)} = ${fmt(4 * s)}`, { size: 17, weight: 600 })),
      pieces: [
        { parts: [[1, 's']], color: 'a', hl: ['s'], say: 's: lay the four equal sides end to end.' },
        { parts: [[0, 'P = 4']], say: '4s: four of them.' },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary s: the perimeter grows in step, four times as fast.' }],
    }),
    Diagonal: play({
      intro: 'A square and its diagonal.',
      scene: ({ s }, h, k, u) => {
        const { P } = fit(-s / 2, s * 1.5, -s / 2, s * 1.5, { x: 140, y: 80, w: 360, h: 320 }, 40);
        let o = shape(P, [[0, 0], [s, 0], [s, s], [0, s]], 'a-soft', 'a') + S.line(...P(0, 0), ...lerpPt(P(0, 0), P(s, s), u(0)), 'c', 4);
        o += S.fade(u(1), shape(P, [[0, 0], [s, s], [0, 2 * s], [-s, s]], 'c-soft', 'c', { 'stroke-width': 2 }) + S.line(...P(0, 0), ...P(0, 2 * s), 'c', 1, dashed('3 4')) + S.line(...P(s, s), ...P(-s, s), 'c', 1, dashed('3 4')));
        o += S.fade(u(1), label(600, 150, '4 half-squares = 2 squares', { fill: 'c', anchor: 'start', weight: 600 }));
        o += S.fade(u(2), label(600, 190, `d² = 2s², so d = s√2 = ${fmt(s * Math.SQRT2)}`, { anchor: 'start', weight: 600 }));
        return o;
      },
      pieces: [
        { parts: [[0, 'd']], color: 'c', say: 'd: the diagonal, corner to corner.' },
        { parts: [[1, ' = s']], color: 'a', hl: ['s'], say: 'Build a square on the diagonal: it’s made of four half-squares, so its area is 2s².' },
        { parts: [[2, '√2']], say: 'Its side, the diagonal, is the square root of 2s²: s√2.' },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary s: the diagonal is always 1.414… times the side.' }],
    }),
    'Side from area': play({
      intro: 'An area of A square units.',
      scene: ({ s }, h, k, u) => {
        const A = s * s, cell = Math.min(36, 280 / s), side = s * cell, x0 = 400 - side / 2, y0 = 100;
        let o = S.rect(x0, y0, side, side * u(0), 'a-soft', 'a', { 'stroke-width': 2 }) + S.fade(u(0), label(400, y0 + side / 2, `A = ${fmt(A)}`, { fill: 'a', weight: 600 }));
        o += S.fade(u(1), S.line(x0, y0 + side + 16, x0 + side, y0 + side + 16, 'c', 5) + label(400, y0 + side + 40, `s = √${fmt(A)} = ${fmt(s)}`, { fill: 'c', weight: 600, size: 16 }));
        return o;
      },
      pieces: [
        { parts: [[2, 'A']], color: 'a', say: 'A: shape the area into a square.' },
        { parts: [[0, 's = '], [1, '√']], color: 'c', hl: ['s'], say: 's = √A: its side is the number that, times itself, gives A.' },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary the area: the side grows much more slowly.' }],
    }),
  });

  // =====================================================================
  // Parallelogram and trapezoid
  // =====================================================================

  reg('parallelogram', {
    Area: play({
      intro: 'Start from nothing.',
      scene: ({ b, ht, off }, h, k, u) => {
        const { P } = fit(-0.5, b + 10.5, -0.3, ht + 0.4, { x: 60, y: 90, w: 680, h: 290 }, 50);
        const o = off * (1 - u(2));
        let s = S.line(...P(0, 0), ...P(b * u(0), 0), 'a', 4) + S.fade(u(0), label(...P(b / 2, 0).map((v, i) => v + (i ? 24 : 0)), fmt(b), { fill: 'a', weight: 600 }));
        if (u(1) > 0) s += S.line(...P(off, 0), ...P(off, ht * u(1)), 'b', 2, dashed('5 5')) + S.fade(u(1), label(...P(off, ht / 2).map((v, i) => v + (i ? 0 : 10)), fmt(ht), { fill: 'b', anchor: 'start', weight: 600 }) + shape(P, [[0, 0], [b, 0], [b + o, ht], [o, ht]], u(2) > 0 ? 'ink-soft' : null, 'ink', { 'stroke-width': 2.5 }));
        s += S.fade(u(2), label(...P(b / 2, ht / 2), `${fmt(b)} × ${fmt(ht)} = ${fmt(b * ht)}`, { size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'b']], color: 'a', hl: ['b'], say: ({ b }) => `b: a base of ${fmt(b)}.` },
        { parts: [[2, ' × h']], color: 'b', hl: ['×', 'ht'], say: ({ ht }) => `× h: the top side, ${fmt(ht)} straight above it, slid sideways.` },
        { parts: [[0, 'A = ']], hl: ['=', 'res'], say: 'A =: slide the top straight over. Every slice keeps its length, so the area doesn’t change: the rectangle b × h.' },
      ],
      vary: [{ key: 'off', amp: 3, min: 0, label: 'slant', say: 'Vary the slant: the shape leans, the area stays exactly the same.' }],
    }),
    'From two sides': play({
      intro: 'A parallelogram with sides a and b, and the angle θ between them.',
      scene: ({ b, ht, off }, h, k, u) => {
        const a = Math.hypot(off, ht), th = Math.atan2(ht, off);
        const { P } = fit(-0.5, b + off + 0.5, -0.3, ht + 0.4, { x: 60, y: 90, w: 600, h: 290 }, 50);
        let s = shape(P, [[0, 0], [b, 0], [b + off, ht], [off, ht]], 'ink-soft', 'grid2') + S.line(...P(0, 0), ...P(b, 0), 'b', 4) + S.line(...P(0, 0), ...P(off, ht), 'a', 4);
        s += S.fade(u(0), S.path(`M${P(1, 0)} A30 30 0 0 0 ${P(Math.cos(th), Math.sin(th))}`, 'c', 2.5) + label(...P(1.2, 0.3), `θ = ${fmt((th * 180) / Math.PI, 0)}°`, { fill: 'c', anchor: 'start', size: 12 }));
        s += S.line(...P(off, ht), ...lerpPt(P(off, ht), P(off, 0), u(1)), 'c', 2.5, dashed('5 4')) + S.fade(u(1), label(...P(off, ht / 2).map((v, i) => v + (i ? 0 : 8)), `a sin θ = ${fmt(a * Math.sin(th))}`, { fill: 'c', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), label(680, 380, `A = ${fmt(b)} × ${fmt(a)} × ${fmt(Math.sin(th), 3)} = ${fmt(b * ht)}`, { anchor: 'end', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'ab']], hl: ['b'], say: 'ab: the two sides, meeting at the angle θ.' },
        { parts: [[2, ' sin θ']], color: 'c', say: 'sin θ: the slanted side a rises a sin θ: that’s the height.' },
        { parts: [[0, 'A = ']], hl: ['res'], say: 'A = base × height = b × a sin θ.' },
      ],
      vary: [{ key: 'off', amp: 3, min: 0, label: 'slant', say: 'Vary the slant: a and θ both change, but a sin θ, the height, stays put.' }],
    }),
    Perimeter: play({
      intro: 'Walk round the parallelogram.',
      scene: ({ b, ht, off }, h, k, u) => { const a = Math.hypot(off, ht); return unroll([b, a, b, a], ['b', 'a', 'b', 'a'], lerp(0, 0.5, u(0)) + lerp(0, 0.5, u(1))).s + S.fade(u(1), label(400, 410, `P = 2(${fmt(a)} + ${fmt(b)}) = ${fmt(2 * (a + b))}`, { size: 17, weight: 600 })); },
      pieces: [
        { parts: [[1, 'a + b']], say: 'a + b: one slanted side and one base, end to end.' },
        { parts: [[0, 'P = 2('], [2, ')']], say: '2(…): opposite sides are equal, so double it.' },
      ],
    }),
  });

  reg('trapezoid', {
    Area: play({
      intro: 'A trapezoid, with parallel sides a and b, a height h apart.',
      scene: ({ a, b, ht }, h, k, u) => {
        const sc = Math.min(32, 300 / (a + b), 230 / ht), base = 370, lx = 60, rx = 410, d = ((b - a) / 2) * sc;
        let s = S.fade(seg(k, 0, 0.04), S.poly([[lx, base], [lx + b * sc, base], [lx + d + a * sc, base - ht * sc], [lx + d, base - ht * sc]], 'ink-soft', 'ink', { 'stroke-width': 2 }));
        s += S.line(rx, base, rx + a * sc * u(0), base, 'a', 5);
        s += S.line(rx + a * sc, base, rx + a * sc + b * sc * u(1), base, 'b', 5) + S.fade(u(1), label(rx + ((a + b) * sc) / 2, base + 24, `a + b = ${fmt(a + b)}`, { weight: 600 }));
        if (u(2) > 0) s += S.rect(rx, base - ht * sc * u(2), (a + b) * sc, ht * sc * u(2), null, 'ink', { 'stroke-width': 2 }) + S.fade(u(2), label(rx + (a + b) * sc + 10, base - (ht * sc) / 2, `h = ${fmt(ht)}`, { anchor: 'start', fill: 'c', weight: 600 }));
        if (u(3) > 0) s += S.fade(u(3), S.poly([[rx, base], [rx + b * sc, base], [rx + a * sc, base - ht * sc], [rx, base - ht * sc]], 'c-soft', 'c', { 'stroke-width': 2 }) + label(rx + ((a + b) * sc) / 2, base - ht * sc - 14, `half of ${fmt((a + b) * ht)} = ${fmt(((a + b) / 2) * ht)}`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, '(a']], color: 'a', hl: ['a'], say: ({ a }) => `(a: take the top side, ${fmt(a)}…` },
        { parts: [[2, ' + b)']], color: 'b', hl: ['+', 'b'], say: ({ b }) => `+ b): …and put the bottom side, ${fmt(b)}, on the end of it.` },
        { parts: [[3, 'h']], color: 'c', hl: ['ht'], say: 'h: raise that combined base by the height: a rectangle (a + b) × h.' },
        { parts: [[0, 'A = ½']], hl: ['½', '=', 'res'], say: 'A = ½: one slanted cut splits the rectangle into two trapezoids, each with parallel sides a and b. One is exactly half.' },
      ],
      vary: [{ key: 'a', amp: 2, min: 1, say: 'Vary the top side: the area changes by half as much as the side does, times h.' }],
    }),
    Midsegment: play({
      intro: 'Join the midpoints of the two slanted sides.',
      scene: ({ a, b, ht }, h, k, u) => {
        const sc = Math.min(40, 400 / Math.max(a, b), 240 / ht), base = 360, d = ((b - a) / 2) * sc, x0 = 230 - (b * sc) / 2;
        const L = [x0 + d / 2, base - (ht * sc) / 2], R = [x0 + b * sc - d / 2, base - (ht * sc) / 2];
        let s = S.poly([[x0, base], [x0 + b * sc, base], [x0 + d + a * sc, base - ht * sc], [x0 + d, base - ht * sc]], 'ink-soft', 'ink', { 'stroke-width': 2 });
        s += S.fade(u(0), S.circle(...L, 6, 'c') + S.circle(...R, 6, 'c'));
        s += S.line(...L, ...lerpPt(L, R, u(1)), 'c', 4);
        const bar = (y, len, color, text) => S.rect(520, y, len * 18, 14, color, null, { rx: 3 }) + label(520, y - 6, text, { fill: color, size: 12, anchor: 'start' });
        s += S.fade(u(2), bar(150, a, 'a', `a = ${fmt(a)}`) + bar(200, b, 'b', `b = ${fmt(b)}`) + bar(260, (a + b) / 2, 'c', `m = (a + b)/2 = ${fmt((a + b) / 2)}`));
        return s;
      },
      pieces: [
        { parts: [[0, 'm']], color: 'c', say: 'm: mark the middle of each slanted side.' },
        { parts: [[1, ' = ']], say: 'Join them: the midsegment, halfway up.' },
        { parts: [[2, '(a + b)/2']], hl: ['a', 'b'], say: 'Halfway between the top and the bottom, its length is halfway between a and b: their average.' },
      ],
      vary: [{ key: 'a', amp: 2, min: 1, say: 'Vary the top: the midsegment moves half as much.' }],
    }),
    'Area from the midsegment': play({
      intro: 'A trapezoid and its midsegment m.',
      scene: ({ a, b, ht }, h, k, u) => {
        const sc = Math.min(40, 500 / Math.max(a, b), 240 / ht), base = 360, d = ((b - a) / 2) * sc, x0 = 400 - (b * sc) / 2, m = ((a + b) / 2) * sc, mx = 400 - m / 2;
        let s = S.poly([[x0, base], [x0 + b * sc, base], [x0 + d + a * sc, base - ht * sc], [x0 + d, base - ht * sc]], 'ink-soft', 'ink', { 'stroke-width': 2 });
        s += S.fade(u(0), S.line(mx, base - (ht * sc) / 2, mx + m, base - (ht * sc) / 2, 'c', 4));
        s += S.fade(u(1), S.rect(mx, base - ht * sc, m, ht * sc, null, 'c', { 'stroke-width': 2.5, ...dashed('6 4') }) + label(400, base + 24, 'the corner bits that stick out fill the gaps exactly', { fill: 'c', size: 13 }));
        s += S.fade(u(2), label(400, 100, `A = ${fmt((a + b) / 2)} × ${fmt(ht)} = ${fmt(((a + b) / 2) * ht)}`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'm']], color: 'c', say: 'm: the midsegment.' },
        { parts: [[2, ' × h']], hl: ['ht'], say: 'Draw a rectangle m wide and h tall: the triangles it cuts off at the bottom corners match the gaps at the top.' },
        { parts: [[0, 'A = ']], hl: ['res'], say: 'So the trapezoid has the same area as the rectangle: m × h.' },
      ],
    }),
  });

  // =====================================================================
  // Circle and polygon
  // =====================================================================

  reg('circle', {
    Area: play({
      intro: 'A circle of radius r.',
      scene: (q, h, k, u, start, stop) => topicDraw('circle')(q, h, remap(k, [[0, 0], [start(0), 0], [stop(0), 0.22], [stop(1), 0.88], [stop(2), 1], [1, 1]])),
      pieces: [
        { parts: [[2, 'r']], color: 'a', hl: ['r'], say: ({ r }) => `r: draw the circle by swinging a radius of ${fmt(r)} all the way round.` },
        { parts: [[1, 'π']], hl: ['π', 'C'], say: 'π r: slice it into thin wedges and lay them out, alternating up and down. Half the crust, π r, ends up along the top and half along the bottom.' },
        { parts: [[0, 'A = '], [3, '²']], hl: ['sq', '=', 'res'], say: 'A = πr²: the wedges make a near-rectangle π r long and r tall, so the area is π r × r.' },
      ],
      vary: [{ key: 'r', amp: 1.5, min: 1, say: 'Vary r: the strip gets both longer and taller, so the area grows with r squared.' }],
    }),
    Circumference: play({
      intro: 'Roll the circle along the ground for one full turn.',
      scene: ({ r }, h, k, u) => {
        const sc = Math.min(30, 95 / r), R = r * sc, ground = 330, x0 = 90, roll = 2 * Math.PI * R * u(0), ang = u(0) * 2 * Math.PI;
        let s = S.line(60, ground, 760, ground, 'grid2', 1.5) + S.line(x0, ground, x0 + roll, ground, 'c', 5);
        const cx = x0 + roll, cy = ground - R;
        s += S.circle(cx, cy, R, 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.circle(cx - R * Math.sin(ang), cy + R * Math.cos(ang), 6, 'c');
        s += S.fade(u(0), label(x0 + roll / 2, ground + 26, `C = ${fmt(2 * Math.PI * r)}`, { fill: 'c', weight: 600 }));
        for (let i = 0; i < 3; i++) s += S.fade(clamp01(u(1) * 4 - i), S.line(x0 + i * 2 * R + 2, ground + 46, x0 + (i + 1) * 2 * R - 2, ground + 46, 'a', 5));
        s += S.fade(clamp01(u(1) * 4 - 3), S.line(x0 + 6 * R + 2, ground + 46, x0 + 2 * Math.PI * R, ground + 46, 'a', 5) + label(x0 + Math.PI * R, ground + 72, `3.14… diameters of ${fmt(2 * r)}`, { fill: 'a', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'C']], color: 'c', say: 'C: one full turn of rolling lays the circumference flat on the ground.' },
        { parts: [[1, ' = 2πr = πd']], color: 'a', hl: ['r'], say: 'Lay diameters along it: a little more than 3 fit, π of them. So C = π × d = 2πr.' },
      ],
      vary: [{ key: 'r', amp: 1, min: 1, say: 'Vary r: a bigger wheel covers proportionally more ground per turn.' }],
    }),
    'Area from circumference': play({
      intro: 'Suppose you only know the distance round, C.',
      scene: ({ r }, h, k, u) => {
        const sc = Math.min(28, 110 / r), R = r * sc, C = 2 * Math.PI * r;
        let s = S.circle(200, 240, R, 'ink-soft', 'ink', { 'stroke-width': 2 });
        s += S.fade(u(0), label(420, 150, `C = ${fmt(C)}`, { fill: 'c', anchor: 'start', weight: 600 }));
        s += S.fade(u(1), S.line(200, 240, 200 + R, 240, 'a', 4) + label(420, 190, `r = C/2π = ${fmt(r)}`, { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), label(420, 240, `A = π(C/2π)² = C²/4π = ${fmt(Math.PI * r * r)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'C²']], color: 'c', say: 'C: the circumference you measured.' },
        { parts: [[3, ' / 4π']], color: 'a', say: 'Recover the radius: r = C ÷ 2π.' },
        { parts: [[0, 'A'], [1, ' = ']], hl: ['res'], say: 'Put it into πr²: π × (C/2π)² simplifies to C²/4π.' },
      ],
      vary: [{ key: 'r', amp: 1.5, min: 1, say: 'Vary the size: double the circumference gives four times the area.' }],
    }),
    'Sector area': play({
      intro: 'A slice of the circle with angle θ (in radians).',
      values: { th: 1.4 },
      scene: ({ r, th }, h, k, u) => {
        const sc = Math.min(28, 130 / r), R = r * sc, cx = 220, cy = 240, t = th * u(0);
        let s = S.circle(cx, cy, R, null, 'grid2', { 'stroke-width': 1.5 }) + S.line(cx, cy, cx + R, cy, 'a', 3);
        if (t > 0.01) s += S.path(`M${cx} ${cy} L${cx + R} ${cy} A${R} ${R} 0 ${t > Math.PI ? 1 : 0} 0 ${cx + R * Math.cos(t)} ${cy - R * Math.sin(t)} Z`, 'c', 2, { fill: 'c-soft' });
        s += S.fade(u(1), label(440, 170, `fraction of the circle: θ/2π = ${fmt(th / (2 * Math.PI), 3)}`, { anchor: 'start' }));
        s += S.fade(u(2), label(440, 210, `× πr² = ½r²θ = ${fmt(0.5 * r * r * th)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'θ']], color: 'c', say: 'θ: the slice’s angle.' },
        { parts: [[1, '½'], [2, 'r²']], color: 'a', hl: ['r'], say: 'A full turn is 2π, so the slice is θ/2π of the whole circle.' },
        { parts: [[0, 'A = ']], hl: ['res'], say: 'Take that fraction of πr²: θ/2π × πr² = ½r²θ.' },
      ],
      vary: [{ key: 'th', amp: 1.2, min: 0.1, max: 6.2, label: 'θ', color: 'c', say: 'Vary θ: the slice’s area grows in step with its angle.' }],
    }),
    'Arc length': play({
      intro: 'An arc cut out by the angle θ (in radians).',
      values: { th: 1.4 },
      scene: ({ r, th }, h, k, u) => {
        const sc = Math.min(28, 130 / r), R = r * sc, cx = 220, cy = 240, t = th * u(1);
        let s = S.circle(cx, cy, R, null, 'grid2', { 'stroke-width': 1.5 }) + S.fade(u(0), S.line(cx, cy, cx + R, cy, 'a', 4) + label(cx + R / 2, cy + 20, `r = ${fmt(r)}`, { fill: 'a' }));
        if (t > 0.01) s += S.path(`M${cx + R} ${cy} A${R} ${R} 0 ${t > Math.PI ? 1 : 0} 0 ${cx + R * Math.cos(t)} ${cy - R * Math.sin(t)}`, 'c', 6);
        s += S.fade(u(1), label(440, 170, `each radian of arc is one radius long`, { anchor: 'start' }) + label(440, 206, `s = ${fmt(r)} × ${fmt(th)} = ${fmt(r * th)}`, { anchor: 'start', weight: 600, fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[1, 'r']], color: 'a', hl: ['r'], say: 'r: the radius.' },
        { parts: [[0, 's = '], [2, 'θ']], color: 'c', say: 'Bend radius-lengths round the edge: an angle of θ radians takes θ of them. So the arc is r × θ.' },
      ],
      vary: [{ key: 'th', amp: 1.2, min: 0.1, max: 6.2, label: 'θ', color: 'c', say: 'Vary θ: the arc grows in step with the angle.' }],
    }),
  });

  const polyG = ({ n, s }) => {
    const Rr = s / (2 * Math.sin(Math.PI / n)), ap = s / (2 * Math.tan(Math.PI / n)), Pm = n * s;
    const sc2 = Math.min(30, 100 / Rr), cx = 160, cy = 190;
    const V = (i) => { const phi = Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n; return [cx + Rr * sc2 * Math.cos(phi), cy + Rr * sc2 * Math.sin(phi)]; };
    const sc = Math.min(40, 600 / Pm, 140 / ap), x0 = 400 - (Pm * sc) / 2, base = 390;
    return { Rr, ap, Pm, V, cx, cy, sc, x0, base, sc2 };
  };
  const polyShape = (G, n) => S.poly(Array.from({ length: n }, (_, i) => G.V(i)), 'ink-soft', 'ink', { 'stroke-width': 2 });
  // The central triangle under the bottom side, halved: a right triangle with angle 180°/n at the centre.
  const halfTri = (G, n) => { const mid = lerpPt(G.V(n - 1), G.V(n), 0.5); return { mid, corner: G.V(n) }; };

  reg('polygon', {
    Area: play({
      intro: 'A regular polygon.',
      backdrop: (q) => { const G = polyG(q); return polyShape(G, q.n) + S.line(G.cx, G.cy, ...halfTri(G, q.n).mid, 'c', 2, dashed('4 4')); },
      pieces: [
        { parts: [[2, 'P']], color: 'b', hl: ['n', 's'], say: ({ n, s }) => `P: unroll the perimeter, ${fmt(n, 0)} sides of ${fmt(s)}, into one line.`,
          draw: (q, u) => { const G = polyG(q); let o = ''; for (let i = 0; i < q.n; i++) { const ui = clamp01(u * q.n - i); if (ui > 0) o += S.line(G.x0 + i * q.s * G.sc + 1, G.base, G.x0 + (i + ui) * q.s * G.sc - 1, G.base, i % 2 ? 'b' : 'a', 5); } return o; } },
        { parts: [[3, ' × a']], color: 'c', hl: ['ap'], say: '× a: raise it by the apothem: a rectangle P × a.',
          draw: (q, u) => { const G = polyG(q); return S.rect(G.x0, G.base - G.ap * G.sc * u, G.Pm * G.sc, G.ap * G.sc * u, null, 'ink', { 'stroke-width': 2 }); } },
        { parts: [[0, 'A = '], [1, '½ × ']], hl: ['½', '=', 'res'], say: 'Each of the polygon’s triangles has base s and height a: half of its own s × a box. Stood up along the line, they fill exactly half the rectangle.',
          draw: (q, u) => { const G = polyG(q), hh = G.ap * G.sc; let o = ''; for (let i = 0; i < q.n; i++) { const ui = clamp01(u * q.n - i); if (ui <= 0) continue; const xa = G.x0 + i * q.s * G.sc, xb = xa + q.s * G.sc; o += S.fade(ui, S.line(xa, G.base, xa, G.base - hh, 'grid2', 1, dashed('3 3')) + S.poly([[xa, G.base], [xb, G.base], [(xa + xb) / 2, G.base - hh]], 'c-soft', 'c', { 'stroke-width': 1.5 })); } return o; } },
      ],
      vary: [{ key: 's', amp: 1.5, min: 1, say: 'Vary the side: both the line and the apothem grow, so the area grows with the square.' }],
    }),
    Apothem: play({
      intro: 'One of the polygon’s triangles, cut in half.',
      scene: (q, h, k, u) => {
        const G = polyG(q), { mid, corner } = halfTri(G, q.n);
        let s = polyShape(G, q.n) + S.fade(u(0), S.poly([[G.cx, G.cy], mid, corner], 'c-soft', 'c', { 'stroke-width': 2 }) + label(...corner.map((v, i) => v + (i ? 18 : 0)), 's/2', { fill: 'b', size: 12 }));
        s += S.fade(u(1), S.line(G.cx, G.cy, ...mid, 'c', 4) + label(420, 150, `angle at the centre: 180°/${fmt(q.n, 0)} = ${fmt(180 / q.n, 1)}°`, { anchor: 'start' }));
        s += S.fade(u(2), label(420, 190, `tan(${fmt(180 / q.n, 1)}°) = (s/2) ÷ a`, { anchor: 'start' }) + label(420, 220, `a = ${fmt(q.s / 2)} ÷ ${fmt(Math.tan(Math.PI / q.n), 3)} = ${fmt(G.ap)}`, { anchor: 'start', weight: 600, fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[2, 's']], color: 'b', hl: ['s'], say: 's/2: half a side, opposite the centre angle.' },
        { parts: [[3, ' / (2 tan(180°/n))']], hl: ['n'], say: 'The centre angle is 360°/n; half of it is 180°/n, in a right triangle.' },
        { parts: [[0, 'a = '], [1, '']], color: 'c', hl: ['ap'], say: 'tan of that angle is (s/2) ÷ a, so a = s / (2 tan(180°/n)).' },
      ],
      vary: [{ key: 's', amp: 1.5, min: 1, say: 'Vary the side: the apothem scales with it.' }],
    }),
    'Area from the side': play({
      intro: 'Combine the two formulas.',
      scene: (q, h, k, u) => {
        const G = polyG(q);
        let s = polyShape(G, q.n);
        s += S.fade(u(0), label(420, 140, `A = ½ × P × a,  P = ns`, { anchor: 'start' }));
        s += S.fade(u(1), label(420, 176, `a = s / (2 tan(180°/n))`, { anchor: 'start', fill: 'c' }));
        s += S.fade(u(2), label(420, 220, `A = ns² / (4 tan(180°/n)) = ${fmt((q.n * q.s * q.s) / (4 * Math.tan(Math.PI / q.n)))}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'A = '], [1, 'ns²']], hl: ['n', 's'], say: 'Start from ½ × perimeter × apothem, with perimeter = ns.' },
        { parts: [[2, ' / (4 tan(180°/n))']], color: 'c', say: 'Swap in the apothem formula…' },
        { parts: [], hl: ['res'], say: '…and the area comes straight from the number of sides and their length.' },
      ],
      vary: [{ key: 's', amp: 1.5, min: 1, say: 'Vary the side: the area grows with s².' }],
    }),
    Circumradius: play({
      intro: 'The circle through all the corners.',
      scene: (q, h, k, u) => {
        const G = polyG(q), { mid, corner } = halfTri(G, q.n);
        let s = polyShape(G, q.n) + S.circle(G.cx, G.cy, G.Rr * G.sc2 * u(0), null, 'grid2', { 'stroke-width': 1.5, ...dashed('4 4') });
        s += S.fade(u(1), S.poly([[G.cx, G.cy], mid, corner], 'c-soft', 'c', { 'stroke-width': 2 }) + S.line(G.cx, G.cy, ...corner, 'a', 4));
        s += S.fade(u(2), label(420, 170, `sin(180°/n) = (s/2) ÷ R`, { anchor: 'start' }) + label(420, 200, `R = ${fmt(G.Rr)}`, { anchor: 'start', weight: 600, fill: 'a' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'R']], color: 'a', say: 'R: centre to a corner, the radius of the circle through the corners.' },
        { parts: [[1, ' = s']], hl: ['s'], say: 'In the half-triangle, R is the long side and s/2 is opposite the centre angle…' },
        { parts: [[2, ' / (2 sin(180°/n))']], hl: ['n'], say: '…so sin(180°/n) = (s/2) ÷ R, and R = s / (2 sin(180°/n)).' },
      ],
    }),
    'Interior angle': play({
      intro: 'Split the polygon into triangles from one corner.',
      scene: (q, h, k, u) => {
        const G = polyG(q), n = q.n;
        let s = polyShape(G, n);
        for (let i = 1; i < n - 1; i++) s += S.fade(clamp01(u(0) * (n - 2) - (i - 1)), S.poly([G.V(0), G.V(i), G.V(i + 1)], i % 2 ? 'a-soft' : 'b-soft', i % 2 ? 'a' : 'b', { 'stroke-width': 1.5 }));
        s += S.fade(u(1), label(420, 160, `${fmt(n - 2, 0)} triangles × 180° = ${fmt((n - 2) * 180, 0)}°`, { anchor: 'start' }));
        s += S.fade(u(2), label(420, 200, `shared by ${fmt(n, 0)} corners: ${fmt(((n - 2) * 180) / n, 1)}° each`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, '(n − 2)']], hl: ['n'], say: 'From one corner, draw lines to all the others: n − 2 triangles.' },
        { parts: [[1, ' × 180°']], say: 'Each triangle’s angles add to 180°, and together they make up all the polygon’s corners.' },
        { parts: [[2, ' / n']], say: 'Shared equally between n corners.' },
      ],
    }),
  });

  // =====================================================================
  // Triangles
  // =====================================================================

  // Base, then base × height is a rectangle (nothing else yet), then ½ cuts it along the diagonal,
  // then the top corner slides to where the real triangle's top is: same base, same height, same area.
  function triPlay(get, names = { b: 'b', h: 'h' }) {
    return play({
      intro: 'Start from nothing.',
      scene(q, hh, k, u) {
        const { b, ht, px } = get(q), slides = Math.abs(px) > 1e-6;
        const xs = [0, b, px], { P } = fit(Math.min(...xs) - 0.3, Math.max(...xs) + 0.3, -0.3, ht + 0.4, { x: 80, y: 90, w: 640, h: 285 }, 55);
        let s = S.line(...P(0, 0), ...P(b * u(0), 0), 'a', 4) + S.fade(u(0), label(...P(b / 2, 0).map((v, i) => v + (i ? 24 : 0)), `${names.b} = ${fmt(b)}`, { fill: 'a', weight: 600 }));
        if (u(1) > 0) {
          const top = ht * u(1);
          s += shape(P, [[0, 0], [b, 0], [b, top], [0, top]], u(2) > 0 ? null : 'b-soft', 'b', { 'stroke-width': 2 });
          s += S.fade(u(1), label(...P(b, ht / 2).map((v, i) => v + (i ? 0 : 10)), `${names.h} = ${fmt(ht)}`, { fill: 'b', anchor: 'start', weight: 600 }) + label(...P(b / 2, ht / 2), `${names.b} × ${names.h} = ${fmt(b * ht)}`, { fill: 'b', weight: 600 }));
        }
        if (u(2) > 0) {
          s += S.fade(u(2), shape(P, [[0, 0], [b, 0], [0, ht]], 'c-soft', 'c') + S.line(...P(b, 0), ...lerpPt(P(b, 0), P(0, ht), u(2)), 'c', 3));
          s += S.fade(u(2) * (1 - u(3) * 0.6), label(...P(b * 0.3, ht * 0.3), `½ × ${fmt(b * ht)} = ${fmt(0.5 * b * ht)}`, { weight: 600 }));
        }
        if (slides && u(3) > 0) {
          const ax = lerp(0, px, u(3));
          if (px < 0 || px > b) s += S.line(...P(px < 0 ? 0 : b, 0), ...P(ax, 0), 'muted', 1.5, dashed('3 5'));
          s += shape(P, [[0, 0], [b, 0], [ax, ht]], 'ink-soft', 'ink', { 'stroke-width': 2.5 }) + S.line(...P(ax, 0), ...P(ax, ht), 'b', 1.5, dashed('4 4'));
          s += S.fade(u(3), label(...P((b + px) / 3, ht / 3), `still ${fmt(0.5 * b * ht)}`, { weight: 600 }));
        }
        return s;
      },
      pieces: [
        { parts: [[2, names.b]], color: 'a', hl: [get.keys[0]], say: (q) => `${names.b}: the base, ${fmt(get(q).b)}.` },
        { parts: [[3, ` × ${names.h}`]], color: 'b', hl: ['×', get.keys[1]], say: (q) => `× ${names.h}: multiplying the base by the height ${fmt(get(q).ht)} sweeps out a rectangle, ${fmt(get(q).b * get(q).ht)}.` },
        { parts: [[0, 'A = '], [1, '½ × ']], color: 'c', hl: ['½', '=', 'res'], say: 'A = ½: cut the rectangle corner to corner. Each half is a triangle with the same base and height.' },
        { parts: [], say: (q) => (Math.abs(get(q).px) > 1e-6 ? 'Slide the top corner along to where this triangle’s top is. Same base, same height, so the same area (shearing never changes area).' : 'This one already has its top corner above the end of the base.') },
      ],
      vary: get.vary || [],
    });
  }
  const tg = (keys, fn, vary) => Object.assign(fn, { keys, vary });

  // A triangle's three sides, squared, compared: is the biggest square more or less than the other two?
  function testPlay(sign) {
    return play({
      intro: 'Compare the square on the longest side with the squares on the other two.',
      scene: ({ b, ht, px = 0, e = 0 }, h, k, u) => {
        const X = e ? b + e : px, aa = Math.hypot(b - X, ht), bb = Math.hypot(X, ht), c = b;
        const sides = [['b', c], ['a', aa], ['c', bb]].sort((x, y) => y[1] - x[1]);
        const big = sides[0][1], s1 = sides[1][1], s2 = sides[2][1];
        const sc = 160 / (big * big), bar = (y, len, color, text, uu) => S.fade(uu, S.rect(120, y, len * sc * 3, 22, color, null, { rx: 3 }) + label(120, y - 8, text, { anchor: 'start', fill: color, size: 13 }));
        let s = bar(140, big * big, 'ink', `longest side squared: ${fmt(big * big)}`, u(0));
        s += bar(210, s1 * s1, 'a', `the other two squared: ${fmt(s1 * s1)}`, u(1)) + S.fade(u(1), S.rect(120 + s1 * s1 * sc * 3, 210, s2 * s2 * sc * 3, 22, 'b', null, { rx: 3 }) + label(120 + (s1 * s1 + s2 * s2) * sc * 3 + 8, 226, `= ${fmt(s1 * s1 + s2 * s2)}`, { anchor: 'start', size: 13 }));
        const lt = big * big < s1 * s1 + s2 * s2 - 1e-9;
        s += S.fade(u(2), label(120, 290, lt ? 'Less: every angle is acute.' : big * big > s1 * s1 + s2 * s2 + 1e-9 ? 'More: the angle opposite the longest side is obtuse.' : 'Equal: a right angle.', { anchor: 'start', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'c²']], say: 'c²: the square on the longest side.' },
        { parts: [[1, ` ${sign} `], [2, 'a² + b²']], hl: ['px'], say: 'a² + b²: the squares on the other two sides, added.' },
        { parts: [], say: 'If they matched, it would be a right triangle. Here they don’t, and which way they differ tells you the kind of triangle.' },
      ],
      vary: [{ key: sign === '<' ? 'ht' : 'e', amp: 2, min: 0.5, say: 'Vary the shape and watch the comparison.' }],
    });
  }

  reg('tri-any', {
    Area: triPlay(tg(['b', 'ht'], ({ b, ht, px }) => ({ b, ht, px }), [{ key: 'px', amp: 4, label: 'top corner', say: 'Vary where the top corner is: the triangle leans, but its area never changes.' }])),
    'Two sides and the angle': play({
      intro: 'Two sides of the triangle, b along the bottom and the slanted side, with angle C between them.',
      scene: ({ b, ht, px }, h, k, u) => {
        const L = Math.hypot(px, ht), C = Math.atan2(ht, px);
        const xs = [0, b, px], { P } = fit(Math.min(...xs) - 0.3, Math.max(...xs) + 0.3, -0.3, ht + 0.4, { x: 60, y: 90, w: 520, h: 285 }, 50);
        let s = shape(P, [[0, 0], [b, 0], [px, ht]], 'ink-soft', 'grid2') + S.line(...P(0, 0), ...P(b, 0), 'b', 4) + S.line(...P(0, 0), ...P(px, ht), 'a', 4);
        s += S.fade(u(0), label(620, 140, `sides ${fmt(b)} and ${fmt(L)}`, { anchor: 'start' }) + S.path(`M${P(0.8, 0)} A24 24 0 0 0 ${P(0.8 * Math.cos(C), 0.8 * Math.sin(C))}`, 'c', 2.5));
        s += S.line(...P(px, ht), ...lerpPt(P(px, ht), P(px, 0), u(1)), 'c', 2.5, dashed('5 4')) + S.fade(u(1), label(620, 170, `height = ${fmt(L)} × sin C = ${fmt(L * Math.sin(C))}`, { anchor: 'start', fill: 'c' }));
        s += S.fade(u(2), label(620, 210, `A = ½ × ${fmt(b)} × ${fmt(L * Math.sin(C))} = ${fmt(0.5 * b * ht)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'ab']], hl: ['b'], say: 'ab: the two sides that meet at the angle C.' },
        { parts: [[2, ' sin C']], color: 'c', say: 'sin C: the slanted side rises its length × sin C: that’s the height.' },
        { parts: [[0, 'A = ½']], hl: ['res'], say: 'A = ½ × base × height = ½ab sin C.' },
      ],
      vary: [{ key: 'px', amp: 3, label: 'top corner', say: 'Vary the top corner: the side and the angle both change, and their product with sin C stays the height.' }],
    }),
    Shoelace: play({
      intro: 'A triangle on a grid, with corners at known coordinates.',
      scene: ({ b, ht, px }, h, k, u) => {
        const x0 = Math.min(0, px), x1 = Math.max(b, px), { P } = fit(x0 - 0.3, x1 + 0.3, -0.3, ht + 0.3, { x: 80, y: 90, w: 460, h: 285 }, 50);
        const box = [[x0, 0], [x1, 0], [x1, ht], [x0, ht]];
        let s = shape(P, [[0, 0], [b, 0], [px, ht]], 'ink-soft', 'ink', { 'stroke-width': 2.5 });
        s += S.fade(u(0), shape(P, box, null, 'grid2', { 'stroke-width': 1.5, ...dashed('5 4') }) + label(620, 140, `box: ${fmt(x1 - x0)} × ${fmt(ht)} = ${fmt((x1 - x0) * ht)}`, { anchor: 'start' }));
        const corners = [[[0, 0], [px, ht], [x0, ht], [x0, 0]], [[b, 0], [px, ht], [x1, ht], [x1, 0]]];
        s += S.fade(u(1), corners.map((c) => shape(P, c, 'c-soft', 'c', { 'stroke-width': 1.5 })).join('') + label(620, 170, `minus the corner pieces: ${fmt((x1 - x0) * ht - 0.5 * b * ht)}`, { anchor: 'start', fill: 'c' }));
        s += S.fade(u(2), label(620, 210, `= ${fmt(0.5 * b * ht)}`, { anchor: 'start', weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, '½|x₁(y₂ − y₃) + …']], say: 'Draw the box around the triangle.' },
        { parts: [[2, '|']], color: 'c', say: 'Take away the right-angled pieces in the corners.' },
        { parts: [[0, 'A = ']], hl: ['res'], say: 'What’s left is the triangle. The shoelace formula does exactly this subtraction, using only the corners’ coordinates.' },
      ],
    }),
    Angles: play({
      intro: 'A triangle with its three corners marked.',
      scene: ({ b, ht, px }, h, k, u) => {
        const A = [0, 0], B = [b, 0], C = [px, ht], xs = [0, b, px];
        const { P } = fit(Math.min(...xs) - 0.3, Math.max(...xs) + 0.3, -0.3, ht + 0.4, { x: 60, y: 90, w: 400, h: 260 }, 45);
        const ang = (p, q, r) => { const a1 = Math.atan2(q[1] - p[1], q[0] - p[0]), a2 = Math.atan2(r[1] - p[1], r[0] - p[0]); return [a1, a2]; };
        const wedge = (cx, cy, a0, a1, color, R = 34) => {
          let d1 = a1 - a0; while (d1 < 0) d1 += 2 * Math.PI; while (d1 > 2 * Math.PI) d1 -= 2 * Math.PI;
          if (d1 > Math.PI) { [a0, a1] = [a1, a0]; d1 = 2 * Math.PI - d1; }
          return S.path(`M${cx} ${cy} L${cx + R * Math.cos(a0)} ${cy - R * Math.sin(a0)} A${R} ${R} 0 0 0 ${cx + R * Math.cos(a0 + d1)} ${cy - R * Math.sin(a0 + d1)} Z`, color, 1.5, { fill: `${color}-soft` });
        };
        let s = shape(P, [A, B, C], 'ink-soft', 'ink');
        const [a1, a2] = ang(A, B, C), [b1, b2] = ang(B, C, A), [c1, c2] = ang(C, A, B);
        const sizes = [[a1, a2], [b1, b2], [c1, c2]].map(([x, y]) => { let d = y - x; while (d < 0) d += 2 * Math.PI; return d > Math.PI ? 2 * Math.PI - d : d; });
        const target = [600, 300];
        let at = 0;
        [[A, a1, a2, 'a'], [B, b1, b2, 'b'], [C, c1, c2, 'c']].forEach(([p, x, y, col], i) => {
          const from = P(...p), mv = u(1), pos = lerpPt(from, target, mv);
          const startAng = lerp(Math.min(x, y), at, mv);
          s += wedge(pos[0], pos[1], mv > 0 ? startAng : x, mv > 0 ? startAng + sizes[i] : y, col);
          at += sizes[i];
        });
        s += S.fade(u(1), S.line(470, 300, 730, 300, 'ink', 2));
        s += S.fade(u(2), label(600, 350, `${fmt((sizes[0] * 180) / Math.PI, 0)}° + ${fmt((sizes[1] * 180) / Math.PI, 0)}° + ${fmt((sizes[2] * 180) / Math.PI, 0)}° = 180°`, { weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'α + β + γ']], say: 'α, β, γ: the three corner angles.' },
        { parts: [[1, ' = ']], say: 'Tear the corners off and put them side by side at one point…' },
        { parts: [[2, '180°']], say: '…they make a straight line: 180°, for every triangle.' },
      ],
      vary: [{ key: 'px', amp: 4, label: 'top corner', say: 'Vary the shape: the corners change, but they always line up into a straight angle.' }],
    }),
  });

  reg('tri-acute', {
    Area: triPlay(tg(['b', 'ht'], ({ b, ht, px }) => ({ b, ht, px }), [{ key: 'ht', amp: 2, min: 1, label: 'h', say: 'Vary the height: the area grows in step with it.' }])),
    'Acute test': testPlay('<'),
  });

  reg('tri-right', {
    Area: triPlay(tg(['a', 'b'], ({ a, b }) => ({ b: a, ht: b, px: 0 }), [{ key: 'b', amp: 2, min: 1, say: 'Vary the upright leg: the triangle stays half of the a × b rectangle.' }]), { b: 'a', h: 'b' }),
    Pythagoras: MV.plays.pythagoras['Pythagorean theorem'],
    'Height to the long side': play({
      intro: 'A right triangle, and the height dropped onto its long side.',
      scene: ({ a, b }, h, k, u) => {
        const c = Math.hypot(a, b), { P } = fit(-0.3, a + 0.3, -0.3, b + 0.3, { x: 80, y: 90, w: 420, h: 290 }, 50);
        const t = (a * a) / (c * c), foot = [a - a * t, b * t];
        let s = shape(P, [[0, 0], [a, 0], [0, b]], 'ink-soft', 'ink');
        s += S.fade(u(0), label(620, 140, `½ × a × b = ${fmt(0.5 * a * b)}`, { anchor: 'start', fill: 'a' }));
        s += S.line(...P(0, 0), ...lerpPt(P(0, 0), P(...foot), u(1)), 'c', 3, dashed('5 4')) + S.fade(u(1), label(620, 170, `½ × c × h = the same area`, { anchor: 'start', fill: 'c' }));
        s += S.fade(u(2), label(620, 210, `h = ab ÷ c = ${fmt((a * b) / c)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'ab']], hl: ['a', 'b'], say: 'The area using the legs: ½ab.' },
        { parts: [[2, ' / c']], color: 'c', say: 'The same area using the long side as base: ½ × c × h.' },
        { parts: [[0, 'h = ']], hl: ['res'], say: 'Set them equal: ½ab = ½ch, so h = ab/c.' },
      ],
      vary: [{ key: 'b', amp: 2, min: 1, say: 'Vary a leg: the height to the long side follows.' }],
    }),
    Circumradius: play({
      intro: 'The circle through all three corners.',
      scene: ({ a, b }, h, k, u) => {
        const c = Math.hypot(a, b), { P, sc } = fit(-c / 2 + a / 2 - 0.2, a / 2 + c / 2 + 0.2, b / 2 - c / 2 - 0.2, b / 2 + c / 2 + 0.2, { x: 120, y: 80, w: 380, h: 320 }, 40);
        let s = shape(P, [[0, 0], [a, 0], [0, b]], 'ink-soft', 'ink');
        s += S.fade(u(0), S.circle(...P(a / 2, b / 2), 6, 'c'));
        s += S.circle(...P(a / 2, b / 2), (c / 2) * sc * u(1), null, 'c', { 'stroke-width': 2 });
        s += S.fade(u(2), label(600, 200, `R = c/2 = ${fmt(c / 2)}`, { anchor: 'start', weight: 600, fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'R']], color: 'c', say: 'Mark the middle of the long side.' },
        { parts: [[1, ' = c']], say: 'A circle centred there, with radius half the long side, passes through all three corners (Thales’ theorem).' },
        { parts: [[2, ' / 2']], hl: ['res'], say: 'So the circumradius is just half the hypotenuse.' },
      ],
    }),
  });

  reg('tri-obtuse', {
    Area: triPlay(tg(['b', 'ht'], ({ b, ht, e }) => ({ b, ht, px: b + e }), [{ key: 'e', amp: 2, min: 0.5, label: 'overhang', say: 'Vary the overhang: the triangle stretches further out, but the area doesn’t change.' }])),
    'As a difference': play({
      intro: 'An obtuse triangle sits inside a big right triangle.',
      scene: (q, h, k, u, start, stop) => topicDraw('tri-obtuse')(q, h, remap(k, [[0, 0], [start(0), 0.34], [stop(0), 0.62], [stop(1), 0.92], [stop(2), 1], [1, 1]])),
      pieces: [
        { parts: [[1, '½(b + e)h']], hl: ['big'], say: 'The big right triangle: base b + e, height h.' },
        { parts: [[2, ' − ½eh']], color: 'c', hl: ['small'], say: 'Take away the small right triangle at the end: base e, height h.' },
        { parts: [[0, 'A = ']], hl: ['res'], say: 'The overhang e cancels: ½bh.' },
      ],
    }),
    'Obtuse test': testPlay('>'),
  });

  // Isosceles height, by Pythagoras on half the triangle.
  const isoHalf = ({ b, l }) => { const p = b / 2, q2 = Math.sqrt(Math.max(0, l * l - p * p)); return { p, q: q2 }; };
  reg('tri-isosceles', {
    Area: triPlay(tg(['b', 'hgt'], (q) => { const { p, q: H } = isoHalf(q); return { b: q.b, ht: H, px: p }; }, [{ key: 'l', amp: 2, say: 'Vary the equal sides: taller sides, taller triangle, bigger area.' }])),
    Height: play({
      intro: 'Cut the triangle down the middle: each half is a right triangle with long side l and short side b/2.',
      scene: (q0, hh, k, u) => {
        const { p, q } = isoHalf(q0), l = q0.l;
        const { P } = fit(-q - 0.2, p + q + 0.2, -p - 0.2, q + p + 0.2, { x: 80, y: 80, w: 460, h: 320 }, 40);
        let s = shape(P, [[0, 0], [p, 0], [0, q]], 'paper', 'ink', { 'stroke-width': 2.5 }) + shape(P, [[0, 0], [-p, 0], [0, q]], null, 'grid2', dashed('4 4'));
        const n = [q, p];
        s += S.fade(u(0), shape(P, [[p, 0], [0, q], plus([0, q], n), plus([p, 0], n)], 'ink-soft', 'ink', { 'stroke-width': 1.5 }) + label(...P(p / 2 + q / 2, q / 2 + p / 2), `l² = ${fmt(l * l)}`, { weight: 600 }));
        s += S.fade(u(1), shape(P, [[0, 0], [p, 0], [p, -p], [0, -p]], 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(...P(p / 2, -p / 2), `(b/2)² = ${fmt(p * p)}`, { fill: 'a', size: 12 }));
        s += S.fade(u(1), label(620, 140, `l² − (b/2)² = ${fmt(l * l - p * p)}`, { anchor: 'start' }) + label(620, 162, 'what’s left is the square on h', { anchor: 'start', fill: 'muted', size: 12 }));
        s += S.fade(u(2), shape(P, [[0, 0], [0, q], [-q, q], [-q, 0]], 'c-soft', 'c', { 'stroke-width': 1.5 }) + S.line(...P(0, 0), ...P(0, q), 'c', 5) + label(620, 200, `h = √${fmt(q * q)} = ${fmt(q)}`, { anchor: 'start', weight: 600, fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'l²']], hl: ['l'], say: 'l²: the square on the long side of the half-triangle.' },
        { parts: [[3, ' − (b/2)²']], color: 'a', hl: ['b'], say: 'By Pythagoras, l² = (b/2)² + h². Take the square on b/2 away from l²…' },
        { parts: [[0, 'h = '], [1, '√('], [4, ')']], color: 'c', hl: ['hgt', 'res'], say: '…and what’s left is h². Its square root is the height.' },
      ],
      vary: [{ key: 'l', amp: 2, say: 'Vary the equal sides: longer sides, more left over, taller height.' }],
    }),
    'Area from the sides': play({
      intro: 'Put the height formula into ½ × base × height.',
      scene: (q0, hh, k, u) => {
        const { p, q } = isoHalf(q0), b = q0.b, l = q0.l;
        const { P } = fit(-0.3, b + 0.3, -0.3, q + 0.3, { x: 60, y: 90, w: 380, h: 280 }, 40);
        let s = shape(P, [[0, 0], [b, 0], [p, q]], 'ink-soft', 'ink') + S.line(...P(p, 0), ...P(p, q), 'c', 2, dashed('4 4'));
        s += S.fade(u(0), label(480, 140, `A = ½ × b × h`, { anchor: 'start' }));
        s += S.fade(u(1), label(480, 174, `h = √(l² − b²/4) = ${fmt(q)}`, { anchor: 'start', fill: 'c' }));
        s += S.fade(u(2), label(480, 214, `A = (b/4)√(4l² − b²) = ${fmt((b / 4) * Math.sqrt(Math.max(0, 4 * l * l - b * b)))}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'A = '], [1, '(b/4)']], hl: ['b'], say: 'Start from ½ × b × h.' },
        { parts: [[2, '√(4l² − b²)']], color: 'c', hl: ['l'], say: 'Replace h with √(l² − b²/4) and tidy up: ½b × ½√(4l² − b²).' },
        { parts: [], hl: ['res'], say: 'So the area comes from the two side lengths alone.' },
      ],
    }),
  });

  // Equilateral: the √3 comes from the height, by Pythagoras on half the triangle.
  reg('tri-equilateral', {
    Area: play({
      intro: 'An equilateral triangle: all three sides are s.',
      scene: ({ s }, hh, k, u) => {
        const H = (Math.sqrt(3) / 2) * s, { P } = fit(-0.3, s + 0.3, -0.3, H + 0.3, { x: 60, y: 90, w: 380, h: 290 }, 50);
        let o = shape(P, [[0, 0], [s, 0], [s / 2, H]], 'ink-soft', 'ink');
        o += S.line(...P(0, 0), ...P(s * u(0), 0), 'a', 5) + S.fade(u(0), label(...P(s / 2, 0).map((v, i) => v + (i ? 24 : 0)), `s = ${fmt(s)}`, { fill: 'a', weight: 600 }));
        o += S.line(...P(s / 2, 0), ...lerpPt(P(s / 2, 0), P(s / 2, H), u(1)), 'c', 4, dashed('5 4')) + S.fade(u(1), label(470, 130, 'height, by Pythagoras on one half:', { anchor: 'start', size: 13 }) + label(470, 156, 'h² = s² − (s/2)² = ¾s²', { anchor: 'start', fill: 'c' }) + label(470, 182, `h = (√3/2)s = ${fmt(H)}`, { anchor: 'start', fill: 'c', weight: 600 }));
        o += S.fade(u(2), shape(P, [[0, 0], [s, 0], [s, H], [0, H]], null, 'grid2', { 'stroke-width': 1.5, ...dashed('5 4') }) + label(470, 226, `the triangle is half the box s × h`, { anchor: 'start', size: 13 }) + label(470, 252, `A = ½ × s × (√3/2)s = (√3/4)s² = ${fmt((Math.sqrt(3) / 4) * s * s)}`, { anchor: 'start', weight: 600 }));
        return o;
      },
      pieces: [
        { parts: [[3, 's²']], color: 'a', hl: ['s'], say: 's: the base.' },
        { parts: [[1, '(√3']], color: 'c', hl: ['hgt'], say: '√3: the height. Half the triangle is a right triangle with long side s and short side s/2, so h² = s² − s²/4 = ¾s² and h = (√3/2)s.' },
        { parts: [[0, 'A = '], [2, '/4) × ']], hl: ['res'], say: '/4: area = ½ × base × height = ½ × s × (√3/2)s = (√3/4)s². That’s where the √3/4 comes from.' },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary s: every equilateral triangle has the same shape, so its area is always the same fraction of s².' }],
    }),
    Height: play({
      intro: 'Cut the equilateral triangle down the middle.',
      scene: ({ s }, hh, k, u) => {
        const H = (Math.sqrt(3) / 2) * s, { P } = fit(-0.3, s + 0.3, -0.3, H + 0.3, { x: 60, y: 90, w: 380, h: 290 }, 50);
        let o = shape(P, [[0, 0], [s, 0], [s / 2, H]], 'ink-soft', 'ink');
        o += S.fade(u(0), shape(P, [[s / 2, 0], [s, 0], [s / 2, H]], 'c-soft', 'c') + label(470, 140, `long side s = ${fmt(s)}, short side s/2 = ${fmt(s / 2)}`, { anchor: 'start' }));
        o += S.fade(u(1), label(470, 176, `h² = s² − (s/2)² = ${fmt(0.75 * s * s)}`, { anchor: 'start', fill: 'c' }));
        o += S.line(...P(s / 2, 0), ...lerpPt(P(s / 2, 0), P(s / 2, H), u(2)), 'c', 5) + S.fade(u(2), label(470, 212, `h = √3/2 × s = ${fmt(H)}`, { anchor: 'start', weight: 600, fill: 'c' }));
        return o;
      },
      pieces: [
        { parts: [[2, 's']], hl: ['s'], say: 'Half the triangle is a right triangle with long side s and short side s/2.' },
        { parts: [[1, '(√3/2)']], color: 'c', say: 'Pythagoras: h² = s² − (s/2)² = ¾s², so h = √(3/4) × s = (√3/2)s.' },
        { parts: [[0, 'h = ']], hl: ['hgt'], say: 'About 0.866 of the side.' },
      ],
      vary: [{ key: 's', amp: 2, min: 1, say: 'Vary s: the height stays 0.866 of it.' }],
    }),
    Perimeter: play({
      intro: 'Walk round the triangle.',
      scene: ({ s }, hh, k, u) => unroll([s, s, s], ['a', 'a', 'a'], u(0)).s + S.fade(u(1), label(400, 410, `P = 3 × ${fmt(s)} = ${fmt(3 * s)}`, { size: 17, weight: 600 })),
      pieces: [
        { parts: [[1, 's']], color: 'a', hl: ['s'], say: 's: three equal sides, end to end.' },
        { parts: [[0, 'P = 3']], say: '3s.' },
      ],
    }),
    'Circumradius and inradius': play({
      intro: 'The circle through the corners, and the circle touching the sides.',
      scene: ({ s }, hh, k, u) => {
        const H = (Math.sqrt(3) / 2) * s, R = s / Math.sqrt(3), r = R / 2;
        const { P, sc } = fit(-0.3 - (R - s / 2), s + 0.3 + (R - s / 2), -0.3, H + 0.3, { x: 100, y: 80, w: 360, h: 320 }, 40);
        const C = [s / 2, r];
        let o = shape(P, [[0, 0], [s, 0], [s / 2, H]], 'ink-soft', 'ink') + S.fade(u(0), S.circle(...P(...C), 5, 'ink'));
        o += S.circle(...P(...C), R * sc * u(0), null, 'a', { 'stroke-width': 2 }) + S.fade(u(0), label(490, 160, `R = s/√3 = ${fmt(R)}`, { anchor: 'start', fill: 'a', weight: 600 }));
        o += S.circle(...P(...C), r * sc * u(1), null, 'c', { 'stroke-width': 2 }) + S.fade(u(1), label(490, 196, `r = s/(2√3) = ${fmt(r)}, half of R`, { anchor: 'start', fill: 'c', weight: 600 }));
        return o;
      },
      pieces: [
        { parts: [[0, 'R = s/√3']], color: 'a', say: 'R: the centre is two-thirds of the way down the height, so R = ⅔ × (√3/2)s = s/√3.' },
        { parts: [[1, ',  r = s/(2√3)']], color: 'c', say: 'r: the remaining third, half of R.' },
      ],
    }),
  });

  reg('tri-scalene', {
    ...(MV.demos?.heron ? { 'Heron’s formula': { ...MV.demos.heron, preview: [[0, 'A = √(', 5], [1, 's', 0], [2, '(s − a)', 1], [3, '(s − b)', 2], [4, '(s − c)', 3], [5, ')', 5]] } } : {}),
    'Semi-perimeter': play({
      intro: 'The three sides, laid end to end.',
      scene: ({ a, b, c }, hh, k, u) => {
        const U = unroll([a, b, c], ['a', 'b', 'c'], u(0), 200);
        let s = U.s;
        s += S.fade(u(1), S.line(U.x0, 260, U.x0 + ((a + b + c) / 2) * U.sc * u(1), 260, 'ink', 6) + label(U.x0 + ((a + b + c) / 4) * U.sc, 290, `s = ${fmt((a + b + c) / 2)}`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, '(a + b + c)']], hl: ['a', 'b', 'c'], say: 'a + b + c: the perimeter, all the way round.' },
        { parts: [[0, 's = '], [2, '/2']], say: '/2: fold it in half: the semi-perimeter.' },
      ],
      vary: [{ key: 'a', amp: 1.5, say: 'Vary a side: s changes by half as much.' }],
    }),
    'Base and height': triPlay(tg(['c', 'b'], ({ a, b, c }) => { const x = (c * c + b * b - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x)); return { b: c, ht: y, px: x }; }), { b: 'c', h: 'h' }),
    'Foot of the height': play({
      intro: 'The height splits the base c into two parts, x and c − x.',
      scene: ({ a, b, c }, hh, k, u) => {
        const x = (c * c + b * b - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x));
        const { P } = fit(Math.min(0, x) - 0.3, Math.max(c, x) + 0.3, -0.3, y + 0.3, { x: 60, y: 90, w: 380, h: 280 }, 45);
        let s = shape(P, [[0, 0], [c, 0], [x, y]], 'ink-soft', 'ink') + S.line(...P(x, 0), ...P(x, y), 'grid2', 1.5, dashed('4 4'));
        s += S.fade(u(0), S.line(...P(0, 0), ...P(x, 0), 'b', 4) + label(480, 140, `left part: h² = b² − x²`, { anchor: 'start', fill: 'b' }));
        s += S.fade(u(1), S.line(...P(x, 0), ...P(c, 0), 'a', 4) + label(480, 170, `right part: h² = a² − (c − x)²`, { anchor: 'start', fill: 'a' }));
        s += S.fade(u(2), label(480, 210, `set equal: x = (c² + b² − a²)/2c = ${fmt(x)}`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, '(c² + b² − a²)']], hl: ['b'], say: 'Pythagoras in the left right triangle: h² = b² − x².' },
        { parts: [[2, ' / 2c']], hl: ['a'], say: 'And in the right one: h² = a² − (c − x)².' },
        { parts: [[0, 'x = ']], hl: ['c'], say: 'Both equal h², so set them equal and solve: x = (c² + b² − a²)/2c.' },
      ],
      vary: [{ key: 'a', amp: 1.5, say: 'Vary a: the foot slides along the base.' }],
    }),
    'Triangle inequality': play({
      intro: 'Can three lengths always make a triangle?',
      scene: ({ a, b, c }, hh, k, u) => {
        const { P } = fit(-b - 0.5, c + a + 0.5, -0.5, Math.max(a, b) + 0.5, { x: 60, y: 90, w: 680, h: 290 }, 40);
        let s = S.line(...P(0, 0), ...P(c, 0), 'c', 5);
        s += S.path(`M${P(b, 0)} A${b * 40} ${b * 40} 0 0 0 ${P(b * Math.cos(Math.PI * 0.95), b * Math.sin(Math.PI * 0.95))}`, 'b', 1.5, { opacity: 0.6 });
        s += S.path(`M${P(c - a, 0)} A${a * 40} ${a * 40} 0 0 1 ${P(c + a * Math.cos(Math.PI * 0.05), a * Math.sin(Math.PI * 0.05))}`, 'a', 1.5, { opacity: 0.6 });
        const ok = a < b + c && b < a + c && c < a + b;
        s += S.fade(u(1), label(400, 390, ok ? 'The arcs cross: each side is shorter than the other two together, so a triangle exists.' : 'The arcs miss: one side is too long to be bridged by the other two.', { weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'a']], color: 'a', hl: ['a'], say: 'Swing arcs of radius b and a from the two ends of side c.' },
        { parts: [[1, ' < b + c']], hl: ['b', 'c'], say: 'They can only meet if each side is shorter than the other two put together.' },
      ],
      vary: [{ key: 'c', amp: 3, say: 'Vary c: make it too long and the other two can’t reach across.' }],
    }),
  });
})();
