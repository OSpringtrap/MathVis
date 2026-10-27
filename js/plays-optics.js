// "Show formula" plays for Optics. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, lerp, clamp01, dashed } = MV;
  const { play, label, reg } = MV.playKit;
  const { path, graph } = MV.phys;
  const O = MV.phys.optics;
  const RAD = Math.PI / 180;
  const work = (x, y, list, o = {}) => list.map(([text, u, col], i) => S.fade(u, label(x, y + i * 28, text, { anchor: 'start', size: 16, fill: col || 'ink', ...o }))).join('');
  // Build progress for a ray diagram from three pieces: object, rays, image.
  const rdK = (u) => 0.2 * u(0) + 0.62 * u(1) + 0.18 * u(2);

  // =====================================================================
  // Mirrors
  // =====================================================================

  reg('o-mirrors', {
    'Law of reflection': play({
      own: true, values: { th: 35 },
      intro: 'A snooker ball bouncing off the cushion, and a beam of light off a mirror: the same rule.',
      scene: ({ th }, h, k, u) => {
        const mx = 400, my = 330, L = 230, r = th * RAD;
        let s = S.line(140, my, 660, my, 'ink', 4);
        for (let x = 150; x < 660; x += 22) s += S.line(x, my + 3, x - 8, my + 13, 'grid2', 1.5);
        s += S.line(mx, my, mx, my - 260, 'muted', 1.5, dashed('5 5')) + label(mx, my - 268, 'normal', { fill: 'muted', size: 11 });
        const a = [mx - L * Math.sin(r), my - L * Math.cos(r)], b = [mx + L * Math.sin(r), my - L * Math.cos(r)];
        s += S.fade(u(0), S.line(...a, mx, my, 'c', 3) + S.path(`M${mx} ${my - 60} A60 60 0 0 0 ${mx - 60 * Math.sin(r)} ${my - 60 * Math.cos(r)}`, 'a', 2) + label(mx - 80 * Math.sin(r / 2), my - 80 * Math.cos(r / 2), `θi ${fmt(th, 0)}°`, { fill: 'a', weight: 600, size: 13 }));
        s += S.fade(u(1), S.line(mx, my, ...b, 'c', 3) + S.path(`M${mx} ${my - 60} A60 60 0 0 1 ${mx + 60 * Math.sin(r)} ${my - 60 * Math.cos(r)}`, 'a', 2) + label(mx + 80 * Math.sin(r / 2), my - 80 * Math.cos(r / 2), `θr ${fmt(th, 0)}°`, { fill: 'a', weight: 600, size: 13 }));
        s += S.fade(u(2), label(400, 390, 'mirror images of each other across the normal', { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'θ_i']], color: 'a', say: 'θ_i: the incoming angle, measured from the normal (the line square to the mirror).' },
        { parts: [[0, 'θ_r']], color: 'a', say: 'θ_r: the outgoing angle, on the other side of the normal.' },
        { parts: [[1, ' = ']], say: '=: they’re always equal. The path out is the mirror image of the path in.' },
      ],
      vary: [{ key: 'th', amp: 30, min: 2, max: 80, label: 'θ_i', color: 'a', say: 'Vary the angle: the reflected beam swings by exactly the same amount the other way.' }],
    }),
    'Plane mirror': play({
      own: true, values: { d: 2 },
      intro: 'A candle in front of a mirror. Where does its reflection seem to be?',
      scene: ({ d }, h, k, u) => {
        const mx = 400, sc = 70, y = 320, cx = mx - d * sc, ix = mx + d * sc;
        let s = S.line(mx, 60, mx, 380, 'ink', 4);
        const candle = (x, ghost) => S.rect(x - 8, y - 50, 16, 50, ghost ? null : 'b-soft', 'b', { 'stroke-width': 1.5, ...(ghost ? dashed('3 3') : {}) }) + S.poly([[x, y - 72], [x - 7, y - 54], [x + 7, y - 54]], ghost ? null : 'c', 'c');
        s += S.fade(u(0), candle(cx, false) + S.line(cx, y + 20, mx, y + 20, 'b', 2) + label((cx + mx) / 2, y + 40, `d_o = ${fmt(d)} m`, { fill: 'b', size: 13, weight: 600 }));
        const eyes = [[mx - 1.3 * sc, 150], [mx - 0.6 * sc, 110]];
        eyes.forEach((e) => { const t = (mx - e[0]) / (ix - e[0]), P = [mx, e[1] + (y - 64 - e[1]) * t]; s += S.fade(u(1), S.line(cx, y - 64, ...P, 'b', 2) + S.line(...P, ...e, 'b', 2) + S.line(...P, ix, y - 64, 'c', 1.5, dashed('5 5')) + S.circle(...e, 5, 'ink')); });
        s += S.fade(u(2), candle(ix, true) + S.line(mx, y + 20, ix, y + 20, 'c', 2) + label((mx + ix) / 2, y + 40, `d_i = ${fmt(d)} m`, { fill: 'c', size: 13, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'd_o']], color: 'b', say: 'd_o: the candle stands this far in front of the mirror.' },
        { parts: [[1, ' = ']], say: 'From wherever you look, the reflected rays, traced back in straight lines, all meet at one point behind the glass.' },
        { parts: [[0, 'd_i']], color: 'c', say: 'd_i: that point is exactly as far behind as the candle is in front. The mirror is a line of symmetry.' },
      ],
      vary: [{ key: 'd', amp: 1.4, min: 0.5, max: 3.5, label: 'd_o', color: 'b', say: 'Vary the distance: step back and your reflection steps back too.' }],
    }),
    'Focal length': play({
      own: true, values: { R: 6, y: 1 },
      intro: 'A concave mirror is a slice of a sphere of radius R. Where do parallel rays end up?',
      scene: ({ R, y }, h, k, u) => {
        const sc = 45, Cx = 160, ay = 220, X = (x) => Cx + x * sc, Y = (v) => ay - v * sc;
        let s = S.line(40, ay, 760, ay, 'grid2', 1.5) + S.path(path(40, (q) => { const a = (-0.55 + 1.1 * q); return [X(R * Math.cos(a)), Y(R * Math.sin(a))]; }), 'ink', 4);
        s += S.fade(u(0), S.circle(X(0), ay, 5, 'ink') + label(X(0), ay + 22, 'C, the centre', { size: 12, weight: 600 }) + S.line(X(0), ay, X(R), ay, 'b', 2.5) + label(X(R / 2), ay - 10, `R = ${fmt(R)}`, { fill: 'b', size: 13, weight: 600 }));
        // A parallel ray at height y: it hits where the normal is the radius, and reflects through (almost) R/2.
        const yy = Math.min(y, R * 0.9), phi = Math.asin(yy / R), P = [R * Math.cos(phi), yy];
        const n = [Math.cos(phi), Math.sin(phi)], dir = [1, 0], dot = dir[0] * n[0] + dir[1] * n[1], r = [dir[0] - 2 * dot * n[0], dir[1] - 2 * dot * n[1]];
        const tAxis = -P[1] / r[1], cross = P[0] + r[0] * tAxis;
        s += S.fade(u(1), S.line(40, Y(yy), X(P[0]), Y(P[1]), 'c', 2.5) + S.line(X(0), ay, X(P[0]), Y(P[1]), 'muted', 1.2, dashed('4 4')) + S.line(X(P[0]), Y(P[1]), X(cross - 0.6), Y(P[1] + r[1] * ((cross - 0.6 - P[0]) / r[0])), 'c', 2.5) + label(X(P[0]) - 70, Y(P[1]) - 30, 'normal = radius', { fill: 'muted', size: 11 }));
        s += S.fade(u(2), S.circle(X(R / 2), ay, 5, 'a') + label(X(R / 2), ay + 22, `F at R/2 = ${fmt(R / 2)}`, { fill: 'a', size: 13, weight: 600 }) + label(560, 90, `this ray crosses at ${fmt(cross, 2)}`, { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'R']], color: 'b', say: 'R: the radius of the sphere the mirror is cut from. Every normal to the mirror points at the centre C.' },
        { parts: [[3, '/2']], color: 'c', say: '/2: a ray parallel to the axis reflects symmetrically about that normal. For rays close to the axis, the geometry puts the crossing halfway to C.' },
        { parts: [[0, 'f'], [1, ' = ']], color: 'a', say: 'f =: that crossing point is the focus. All near-axis parallel rays meet there.' },
      ],
      vary: [{ key: 'y', amp: 3.5, min: 0.2, max: 5, label: 'ray height', color: 'c', say: 'Vary the ray’s height: near the axis it hits R/2; far out it crosses closer to the mirror. That blurring is called spherical aberration.' }],
    }),
    'Mirror equation': play({
      own: true, values: { d: 4, f: 1.5 },
      intro: 'A concave mirror and a candle. Three easy rays find the image.',
      scene: ({ d, f }, h, k, u) => {
        const img = O.image(f, d);
        return O.rayDiagram({ f, d, mirror: true, k: rdK(u), id: 'pl-me' }) + S.fade(u(2), label(640, 70, img ? `1/${fmt(f)} − 1/${fmt(d)} = 1/${fmt(img.di)}` : 'at the focus: no image', { weight: 600, size: 14 }));
      },
      pieces: [
        { parts: [[2, '1/d_o']], color: 'b', say: '1/d_o: the object’s distance. Light leaves it spreading out.' },
        { parts: [[3, ' + 1/d_i']], say: 'The parallel ray goes through F, the centre ray bounces symmetrically, the focal ray comes back parallel. They meet at the image, d_i from the mirror.' },
        { parts: [[0, '1/f'], [1, ' = ']], color: 'a', say: '1/f =: whatever the object distance, the reciprocals always add to 1/f. The spreading the mirror undoes is fixed by its curve.' },
      ],
      vary: [{ key: 'd', amp: 2.6, min: 0.6, max: 6.5, label: 'd_o', color: 'b', say: 'Slide the candle: far away the image sits near F; closer than F, it jumps behind the mirror and grows (a make-up mirror).' }],
    }),
    Magnification: play({
      own: true, values: { d: 3, f: 1.2 },
      intro: 'How big is the image? Look at the ray through the middle of the mirror.',
      scene: ({ d, f }, h, k, u) => {
        const img = O.image(f, d), sc = 50, ax = 420, ay = 220, ho = 1.3;
        let s = O.rayDiagram({ f, d, mirror: true, k: 0.2, id: 'pl-mg' });
        if (!img) return s;
        const hi = img.m * ho, ox = ax - d * sc, ix = ax - img.di * sc;
        s += S.fade(u(0), S.poly([[ax, ay], [ox, ay], [ox, ay - ho * sc]], 'b-soft', 'b', { 'stroke-width': 2 }) + label((ax + ox) / 2, ay + 20, `d_o = ${fmt(d)}`, { fill: 'b', size: 12 }));
        s += S.fade(u(1), S.poly([[ax, ay], [ix, ay], [ix, ay - hi * sc]], 'c-soft', 'c', { 'stroke-width': 2 }) + label((ax + ix) / 2, ay + (hi < 0 ? -10 : 20), `d_i = ${fmt(img.di)}`, { fill: 'c', size: 12 }));
        s += S.fade(u(3), label(640, 70, `m = −${fmt(img.di)} ÷ ${fmt(d)} = ${fmt(img.m)}`, { weight: 600, size: 15 }) + label(640, 96, img.m < 0 ? 'negative: upside down' : 'positive: upright', { size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'd_i']], color: 'c', say: 'd_i: the ray to the centre reflects at the same angle, making two similar triangles: one for the object, one for the image.' },
        { parts: [[4, '/d_o']], color: 'b', say: '/d_o: similar triangles: heights are in the same ratio as distances, h_i/h_o = d_i/d_o.' },
        { parts: [[2, '−']], say: '−: the image is on the other side of the axis, upside down, hence the minus sign.' },
        { parts: [[0, 'm'], [1, ' = ']], say: 'm =: the magnification. |m| > 1 bigger, < 1 smaller; negative means inverted.' },
      ],
      vary: [{ key: 'd', amp: 1.5, min: 1.4, max: 5, label: 'd_o', color: 'b', say: 'Vary the distance: move toward the focus and the image races away and grows.' }],
    }),
  });

  // =====================================================================
  // Refraction
  // =====================================================================

  reg('o-refraction', {
    'Refractive index': play({
      own: true, values: { n: 1.5 },
      intro: 'Two light pulses race for one nanosecond: one through vacuum, one through glass.',
      scene: ({ n }, h, k, u) => {
        const x0 = 100, L = 600, t = Math.max(u(0), u(1));
        let s = S.rect(x0, 130, L, 50, 'ink-soft', null, { rx: 4, opacity: 0.4 }) + label(x0 - 10, 160, 'vacuum', { anchor: 'end', size: 12 }) + S.rect(x0, 240, L, 50, 'a-soft', 'a', { rx: 4 }) + label(x0 - 10, 270, `n = ${fmt(n)}`, { anchor: 'end', size: 12, fill: 'a' });
        s += S.circle(x0 + L * t, 155, 9, 'c') + S.circle(x0 + (L / n) * t, 265, 9, 'c');
        s += S.fade(u(0), label(x0 + L, 120, 'c: 30 cm per nanosecond', { anchor: 'end', size: 12 }));
        s += S.fade(u(1), label(x0 + L / n, 230, `v: ${fmt(30 / n, 1)} cm`, { size: 12, weight: 600 }));
        s += S.fade(u(2), label(400, 350, `n = 30 ÷ ${fmt(30 / n, 1)} = ${fmt(n)}`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'c']], say: 'c: in vacuum, light covers 30 cm every nanosecond.' },
        { parts: [[3, '/v']], color: 'a', say: '/v: inside glass it’s slowed, constantly absorbed and re-emitted by the atoms.' },
        { parts: [[0, 'n'], [1, ' = ']], color: 'a', say: 'n =: the refractive index is how many times slower: water 1.33, glass 1.5, diamond 2.42.' },
      ],
      vary: [{ key: 'n', amp: 0.7, min: 1, max: 2.42, label: 'n', color: 'a', say: 'Vary n: the higher the index, the further behind the second pulse falls.' }],
    }),
    'Snell’s law': play({
      own: true, values: { th1: 50, n1: 1, n2: 1.5 },
      intro: 'A wavefront, like a line of marchers, crossing from fast ground to slow ground at an angle.',
      scene: ({ th1, n1, n2 }, h, k, u) => {
        const by = 230, r1 = th1 * RAD, s2 = (n1 * Math.sin(r1)) / n2, r2 = Math.asin(Math.min(1, s2)), AB = 260, A = [270, by], B = [270 + AB, by];
        let s = S.rect(40, 40, 720, by - 40, 'b-soft', null, { opacity: 0.4 }) + S.rect(40, by, 720, 380 - by, 'c-soft', null, { opacity: 0.5 }) + S.line(40, by, 760, by, 'ink', 1.5);
        // Front arriving: A has just touched; the other end is still v₁t away from B.
        const d1 = AB * Math.sin(r1), d2 = AB * Math.sin(r2);
        const top = [B[0] - d1 * Math.sin(r1), by - d1 * Math.cos(r1)];
        s += S.fade(u(0), S.line(...A, ...top, 'b', 4) + S.line(...top, ...B, 'b', 2, dashed('5 4')) + label(top[0] + 10, (top[1] + by) / 2 - 10, `v₁t (∝ 1/n₁)`, { fill: 'b', size: 12, anchor: 'start' }) + label(A[0] - 10, by - 10, 'A', { weight: 600, anchor: 'end' }) + label(B[0] + 10, by - 10, 'B', { weight: 600, anchor: 'start' }) + label(top[0] - 20, top[1], 'sin θ₁ = v₁t ÷ AB', { fill: 'b', size: 12, anchor: 'end' }));
        // Meanwhile A's end has gone v₂t into the slow side.
        const low = [A[0] + d2 * Math.sin(r2), by + d2 * Math.cos(r2)];
        s += S.fade(u(2), S.line(...A, ...low, 'c', 2, dashed('5 4')) + S.line(...low, ...B, 'c', 4) + label(low[0] - 10, (low[1] + by) / 2 + 10, `v₂t`, { fill: 'c', size: 12, anchor: 'end' }) + label(low[0] + 30, low[1] + 30, 'sin θ₂ = v₂t ÷ AB', { fill: 'c', size: 12, anchor: 'start' }));
        s += S.fade(u(1), label(620, 70, 'same AB, same t:', { size: 13 }) + label(620, 96, 'sin θ₁ / v₁ = sin θ₂ / v₂', { size: 14, weight: 600 }));
        s += S.fade(u(2), label(620, 124, 'and 1/v = n/c, so', { size: 13 }) + label(620, 150, 'n₁ sin θ₁ = n₂ sin θ₂', { size: 15, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'n₁ sin θ₁']], color: 'b', say: 'The front reaches the boundary at A first. While its far end travels v₁t to B, the geometry says sin θ₁ = v₁t ÷ AB.' },
        { parts: [[1, ' = ']], say: 'In that same time t, the A end moves only v₂t into the slow side, so the front swings round.' },
        { parts: [[2, 'n₂ sin θ₂']], color: 'c', say: 'sin θ₂ = v₂t ÷ AB. Divide one by the other, use v = c/n, and you get Snell’s law.' },
      ],
      vary: [{ key: 'th1', amp: 30, min: 5, max: 80, label: 'θ₁', color: 'b', say: 'Vary the angle: the front always pivots so that n sin θ matches on both sides.' }],
    }),
    Wavelength: play({
      own: true, values: { n1: 1, n2: 1.5 },
      intro: 'A wave crossing into slower glass, straight on.',
      scene: ({ n1, n2 }, h, k, u) => {
        const bx = 400, l1 = 80 / n1, l2 = (80 * n1) / n2 / n1, y = 220, ph = k * 30;
        let s = S.rect(bx, 100, 360, 240, 'c-soft', null, { opacity: 0.5 }) + label(580, 360, `n₂ = ${fmt(n2)}`, { fill: 'c', size: 12 }) + label(220, 360, `n₁ = ${fmt(n1)}`, { fill: 'b', size: 12 });
        s += S.path(path(120, (q) => { const x = 40 + q * 360; return [x, y - 50 * Math.sin((2 * Math.PI * (x - bx)) / l1 - ph)]; }), 'b', 2.5);
        s += S.path(path(160, (q) => { const x = bx + q * 360; return [x, y - 50 * Math.sin((2 * Math.PI * (x - bx)) / l2 - ph)]; }), 'c', 2.5);
        s += S.fade(u(0), S.line(bx - l1, y + 70, bx, y + 70, 'b', 3) + label(bx - l1 / 2, y + 92, `λ₁ = ${fmt(l1 / 160, 2)} µm`, { fill: 'b', size: 12 }));
        s += S.fade(u(1), label(bx, 84, 'same number of crests per second on both sides', { size: 12 }));
        s += S.fade(u(2), S.line(bx, y + 70, bx + l2, y + 70, 'c', 3) + label(bx + l2 / 2, y + 92, `λ₂ = ${fmt(l2 / 160, 2)} µm`, { fill: 'c', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'λ₁']], color: 'b', say: 'λ₁: the wavelength before the boundary.' },
        { parts: [[3, ' n₁/n₂']], say: 'n₁/n₂: crests can’t pile up or vanish at the boundary, so the frequency stays the same. But the wave goes slower, so each crest is closer behind the last.' },
        { parts: [[0, 'λ₂'], [1, ' = ']], color: 'c', say: 'λ₂ =: the wavelength shrinks by the ratio of the indices. The colour, set by frequency, doesn’t change.' },
      ],
      vary: [{ key: 'n2', amp: 0.7, min: 1, max: 2.42, label: 'n₂', color: 'c', say: 'Vary the second material: denser, more squashed waves.' }],
    }),
    'Apparent depth': play({
      own: true, values: { d: 2, n: 1.33 },
      intro: 'Look straight down at a coin in water.',
      scene: ({ d, n }, h, k, u) => {
        const sy = 120, sc = 100, cx = 300, coinY = sy + d * sc, appY = sy + (d / n) * sc, a1 = 0.1, a2 = Math.asin(n * Math.sin(a1)), x = (coinY - sy) * Math.tan(a1);
        let s = S.rect(40, sy, 720, 290, 'a-soft', null) + S.line(40, sy, 760, sy, 'a', 2) + S.el('ellipse', { cx, cy: coinY, rx: 16, ry: 5, fill: 'b', stroke: 'b' });
        s += S.fade(u(0), S.line(cx, coinY, cx + x, sy, 'b', 2) + S.line(cx, coinY, cx - x, sy, 'b', 2) + S.line(cx + 40, sy, cx + 40, coinY, 'b', 1.5) + label(cx + 48, (sy + coinY) / 2, `d = ${fmt(d)} m`, { fill: 'b', size: 13, anchor: 'start' }));
        s += S.fade(u(1), S.line(cx + x, sy, cx + x + 120 * Math.sin(a2), sy - 120 * Math.cos(a2), 'b', 2) + S.line(cx - x, sy, cx - x - 120 * Math.sin(a2), sy - 120 * Math.cos(a2), 'b', 2) + S.line(cx + x, sy, cx, appY, 'c', 1.5, dashed('4 4')) + S.line(cx - x, sy, cx, appY, 'c', 1.5, dashed('4 4')) + label(560, 160, 'same spot x on the surface:', { size: 13 }) + label(560, 186, 'x = d tan θ₁ = d′ tan θ₂', { size: 13 }) + label(560, 212, 'small angles: tan ≈ sin, ratio = n', { size: 13 }));
        s += S.fade(u(2), S.el('ellipse', { cx, cy: appY, rx: 16, ry: 5, fill: null, stroke: 'c', 'stroke-width': 2, 'stroke-dasharray': '3 3' }) + label(cx - 30, appY + 4, `d′ = ${fmt(d / n)} m`, { fill: 'c', anchor: 'end', size: 13, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'd']], color: 'b', say: 'd: the coin’s real depth. Two rays leave it, close to straight up.' },
        { parts: [[3, '/n']], say: '/n: at the surface they bend away from the normal, spreading more. Traced back, they meet higher up.' },
        { parts: [[0, 'd′'], [1, ' = ']], color: 'c', say: 'd′ =: the coin seems to be at depth d/n: in water, three quarters of the real depth.' },
      ],
      vary: [{ key: 'n', amp: 0.6, min: 1, max: 2.42, label: 'n', color: 'c', say: 'Vary the liquid’s index: the denser it is optically, the shallower things look.' }],
    }),
  });

  // =====================================================================
  // Total internal reflection
  // =====================================================================

  reg('o-tir', {
    'Critical angle': play({
      own: true, values: { n1: 1.5, n2: 1 },
      intro: 'Light leaving glass for air. Find the angle where the escaping ray just skims the surface.',
      scene: ({ n1, n2 }, h, k, u) => {
        const cx = 400, cy = 170, L = 220, c = Math.asin(Math.min(1, n2 / n1));
        let s = S.rect(40, cy, 720, 220, 'c-soft', null, { opacity: 0.5 }) + S.line(cx, 40, cx, 390, 'muted', 1.5, dashed('5 5'));
        s += S.line(cx - L * Math.sin(c), cy + L * Math.cos(c), cx, cy, 'a', 3) + S.fade(u(1), S.line(cx, cy, cx + 300, cy - 2, 'a', 3) + label(cx + 300, cy - 12, 'skims along: θ₂ = 90°, sin 90° = 1', { fill: 'a', size: 12, anchor: 'end' }));
        s += S.fade(u(0), label(560, 260, `n₁ = ${fmt(n1)}`, { fill: 'c', size: 13 }) + label(560, 90, `n₂ = ${fmt(n2)}`, { fill: 'b', size: 13 }));
        s += work(80, 70, [['Snell: n₁ sin θ_c = n₂ sin 90°', u(1)], [`sin θ_c = ${fmt(n2)} ÷ ${fmt(n1)} = ${fmt(n2 / n1, 3)}`, u(2), 'c'], [`θ_c = ${fmt(c / RAD, 1)}°`, u(2), 'c']]);
        return s;
      },
      pieces: [
        { parts: [[3, 'n₂/n₁']], color: 'c', say: 'n₂/n₁: going from dense to less dense, the ray bends away from the normal.' },
        { parts: [[0, 'sin θ_c'], [1, ' = ']], say: 'At the critical angle the outgoing ray bends all the way to 90°. Put θ₂ = 90° into Snell’s law, and sin 90° = 1.' },
        { parts: [], say: 'So sin θ_c is simply the ratio of the indices. Any steeper and no light gets out.' },
      ],
      vary: [{ key: 'n1', amp: 0.8, min: 1.05, max: 2.42, label: 'n₁', color: 'c', say: 'Vary the dense material: diamond (2.42) traps light past just 24°, which is why it sparkles.' }],
    }),
    'Total reflection': play({
      own: true, values: { th: 30 },
      intro: 'How much light reflects at a glass–air surface, as the angle grows?',
      scene: ({ th }, h, k, u) => {
        const Gr = graph({ x0: 110, x1: 700, y0: 370, y1: 120, tMax: 90, vMax: 100, tLabel: 'angle inside the glass (°)', vLabel: 'reflected (%)' });
        const c = Math.asin(1 / 1.5) / RAD, R = (a) => O.reflectance(1.5, 1, a) * 100;
        let s = Gr.s + S.path(path(180, (q) => [Gr.X(q * 89.9), Gr.Y(R(q * 89.9))]), 'c', 2.5);
        s += S.fade(u(0), S.line(Gr.X(c), Gr.Y(0), Gr.X(c), Gr.Y(100), 'ink', 1.5, dashed('5 4')) + label(Gr.X(c), 108, `θ_c = ${fmt(c, 1)}°`, { weight: 600, size: 13 }));
        s += S.fade(u(1), S.rect(Gr.X(c), Gr.Y(100), Gr.X(90) - Gr.X(c), Gr.Y(0) - Gr.Y(100), 'c-soft', null, { opacity: 0.5 }) + label((Gr.X(c) + Gr.X(90)) / 2, Gr.Y(50), '100 % reflected', { fill: 'c', weight: 600 }));
        s += S.circle(Gr.X(th), Gr.Y(R(th)), 7, 'a') + label(Gr.X(th) + 10, Gr.Y(R(th)) - 10, `${fmt(R(th), 0)} %`, { fill: 'a', size: 13, anchor: 'start', weight: 600 });
        return s;
      },
      pieces: [
        { parts: [[0, 'θ > θ_c']], say: 'Below θ_c most light gets out and only a little reflects.' },
        { parts: [[1, ' ⇒ 100 % reflected']], color: 'c', say: 'Past θ_c there is no refracted ray at all: every bit of light reflects. A perfect mirror, better than any silvering.' },
      ],
      vary: [{ key: 'th', amp: 40, min: 0, max: 89, label: 'θ', color: 'a', say: 'Sweep the angle: the reflection creeps up slowly, then snaps to 100 % at the critical angle.' }],
    }),
  });

  // =====================================================================
  // Lenses
  // =====================================================================

  reg('o-lenses', {
    'Thin lens': play({
      own: true, values: { d: 4, f: 1.5 },
      intro: 'A converging lens and a candle. Three easy rays find the image.',
      scene: ({ d, f }, h, k, u) => {
        const img = O.image(f, d);
        return O.rayDiagram({ f, d, k: rdK(u), id: 'pl-tl' }) + S.fade(u(2), label(640, 70, img ? `1/${fmt(f)} − 1/${fmt(d)} = 1/${fmt(img.di)}` : 'at the focus: no image', { weight: 600, size: 14 }));
      },
      pieces: [
        { parts: [[2, '1/d_o']], color: 'b', say: '1/d_o: light from the candle arrives spreading out; the closer the candle, the more it spreads.' },
        { parts: [[3, ' + 1/d_i']], say: 'The lens bends the rays so they converge again: parallel ray through F, centre ray straight on, focal ray out parallel. They meet at d_i.' },
        { parts: [[0, '1/f'], [1, ' = ']], color: 'a', say: '1/f =: the lens adds a fixed amount of bending, 1/f. Spreading in plus converging out always add to it.' },
      ],
      vary: [{ key: 'd', amp: 2.6, min: 0.6, max: 6.5, label: 'd_o', color: 'b', say: 'Slide the candle: as it approaches F the image rushes off to infinity; inside F, the lens becomes a magnifying glass.' }],
    }),
    Magnification: play({
      own: true, values: { d: 2.4, f: 1.5 },
      intro: 'How big is the image? Follow the ray straight through the centre.',
      scene: ({ d, f }, h, k, u) => {
        const img = O.image(f, d), sc = 50, ax = 420, ay = 220, ho = 1.3;
        let s = O.rayDiagram({ f, d, k: 0.2, id: 'pl-lm' });
        if (!img) return s;
        const hi = img.m * ho, ox = ax - d * sc, ix = ax + img.di * sc;
        s += S.fade(u(0), S.line(ox, ay - ho * sc, ix, ay - hi * sc, 'c', 2) + S.poly([[ax, ay], [ox, ay], [ox, ay - ho * sc]], 'b-soft', 'b', { 'stroke-width': 2 }));
        s += S.fade(u(1), S.poly([[ax, ay], [ix, ay], [ix, ay - hi * sc]], 'c-soft', 'c', { 'stroke-width': 2 }) + S.arrow(ix, ay, ix, ay - hi * sc, 'ink', 3));
        s += S.fade(u(2), label(640, 70, `h_i/h_o = −${fmt(img.di)} ÷ ${fmt(d)} = ${fmt(img.m)}`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'h_i/h_o']], color: 'b', say: 'h_i/h_o: compare the image’s height with the object’s. The ray through the centre goes straight, making two similar triangles.' },
        { parts: [[3, ' = −d_i/d_o']], color: 'c', say: '−d_i/d_o: similar triangles have their sides in the same ratio. The image is on the other side of the axis, so it’s negative: upside down.' },
        { parts: [[0, 'm'], [1, ' = ']], say: 'm =: the magnification.' },
      ],
      vary: [{ key: 'd', amp: 0.8, min: 1.7, max: 4, label: 'd_o', color: 'b', say: 'Vary the distance: between f and 2f the image is bigger than the object, beyond 2f it’s smaller. A projector and a camera.' }],
    }),
    Power: play({
      own: true, values: { f: 0.5 },
      intro: 'Strong lenses bend light sharply; weak ones gently.',
      scene: ({ f }, h, k, u) => {
        const ax = 300, ay = 220, sc = 300, P = 1 / f;
        let s = S.line(40, ay, 760, ay, 'grid2', 1.5) + S.path(`M${ax} ${ay - 110} Q${ax - 10 - P * 3} ${ay} ${ax} ${ay + 110} Q${ax + 10 + P * 3} ${ay} ${ax} ${ay - 110}`, 'ink', 2, { fill: 'a-soft' });
        [-80, -40, 40, 80].forEach((y) => { s += S.line(60, ay + y, ax, ay + y, 'a', 2) + S.fade(u(0), S.line(ax, ay + y, Math.min(780, ax + f * sc * 1.6), ay + y - (y / (f * sc)) * Math.min(780 - ax, f * sc * 1.6), 'a', 2)); });
        s += S.fade(u(0), S.circle(ax + f * sc, ay, 5, 'ink') + label(ax + f * sc, ay + 22, `f = ${fmt(f, 2)} m`, { weight: 600, size: 13 }));
        s += S.fade(u(1), label(620, 90, `P = 1 ÷ ${fmt(f, 2)} = ${fmt(P, 1)} D`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, '1/f']], color: 'a', say: '1/f: the shorter the focal length, the more sharply the lens bends the light.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'a', say: 'P =: so opticians use the reciprocal, the power, in dioptres (1/metres). A +4 D reading lens has f = 25 cm. Diverging lenses have negative power.' },
      ],
      vary: [{ key: 'f', amp: 0.35, min: 0.2, max: 1.2, label: 'f', color: 'a', say: 'Vary f: halve it and the power doubles.' }],
    }),
    'Lenses together': play({
      own: true, values: { P1: 2, P2: 2 },
      intro: 'Two thin lenses pressed together act as one.',
      scene: ({ P1, P2 }, h, k, u) => {
        const ax = 280, ay = 220, sc = 300, P = P1 + P2;
        let s = S.line(40, ay, 760, ay, 'grid2', 1.5);
        const lens = (x, p, col) => S.path(`M${x} ${ay - 100} Q${x - Math.sign(p) * (6 + Math.abs(p) * 3)} ${ay} ${x} ${ay + 100} Q${x + Math.sign(p) * (6 + Math.abs(p) * 3)} ${ay} ${x} ${ay - 100}`, col, 2, { fill: `${col}-soft` });
        s += S.fade(u(0), lens(ax - 8, P1, 'a'));
        s += S.fade(u(1), lens(ax + 8, P2, 'b'));
        const Pshown = P1 * u(0) + P2 * u(1);
        [-70, -35, 35, 70].forEach((y) => { const slope = -(y / sc) * Pshown * 0.5, L = 460; s += S.line(60, ay + y, ax, ay + y, 'c', 2) + S.line(ax, ay + y, ax + L, ay + y + slope * L * 0.6, 'c', 2); });
        s += S.fade(u(2), label(620, 90, `${fmt(P1)} + ${fmt(P2)} = ${fmt(P)} D`, { weight: 600, size: 18 }) + label(620, 116, P > 0 ? `f = ${fmt(1 / P, 2)} m` : P < 0 ? 'net diverging' : 'no net bending', { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'P₁']], color: 'a', say: 'P₁: the first lens bends the light by its power.' },
        { parts: [[3, ' + P₂']], color: 'b', say: '+ P₂: the second adds its own bending on top.' },
        { parts: [[0, 'P'], [1, ' = ']], say: 'P =: powers simply add. That’s exactly how glasses work: they add to (or take away from) the eye’s own power.' },
      ],
      vary: [{ key: 'P2', amp: 4, min: -4, max: 4, label: 'P₂', color: 'b', say: 'Vary the second lens: make it negative and it cancels some of the first.' }],
    }),
  });

  // =====================================================================
  // Vision
  // =====================================================================

  const eyeScene = (m, u, eyeLen, chartErr, id) => O.drawEye(m, { u, eyeLen }) + O.chart(700, 150, chartErr, id);
  reg('o-vision', {
    Focusing: play({
      own: true, values: { d: 0.5 },
      intro: 'A normal eye: 60 dioptres relaxed focuses distant things onto the retina.',
      scene: ({ d }, h, k, u) => {
        const m = O.eyeModel({ Vr: 60, relax: 60, acc: 4, d, Pg: 0 });
        let s = eyeScene(m, 1, 0, m.err, 'pv-f');
        s += S.fade(u(0), label(60, 362, 'retina needs the light to converge at 60 D', { anchor: 'start', size: 13 }));
        s += S.fade(u(1), label(60, 386, `object at ${fmt(d, 2)} m: light arrives spreading by 1/d = ${fmt(1 / d, 1)} D`, { anchor: 'start', size: 13, fill: 'b' }));
        s += S.fade(u(2), label(60, 410, `eye must reach 60 + ${fmt(1 / d, 1)} = ${fmt(60 + 1 / d, 1)} D ${60 + 1 / d > 64 ? '(beyond its 64 D max: blurred)' : ''}`, { anchor: 'start', size: 13, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'P_retina']], say: 'P_retina: the power that lands parallel light exactly on the retina, about 60 D.' },
        { parts: [[3, ' + 1/d']], color: 'b', say: '+ 1/d: light from something close arrives spreading out by 1/d dioptres, which the eye must also undo.' },
        { parts: [[0, 'P_eye'], [1, ' = ']], color: 'a', say: 'P_eye =: so the lens thickens. Its range (about 4 D when young) sets the nearest sharp distance: 25 cm.' },
      ],
      vary: [{ key: 'd', amp: 0.4, min: 0.1, max: 2, label: 'd', color: 'b', say: 'Bring the page closer: past 25 cm the eye runs out of power and the letters blur.' }],
    }),
    'Short sight': play({
      own: true, values: { dfar: 0.33 },
      intro: 'A short-sighted eye can only focus things nearer than its far point.',
      scene: ({ dfar }, h, k, u) => {
        const ax = 380, ay = 220, sc = 300, P = -1 / dfar;
        let s = S.line(40, ay, 760, ay, 'grid2', 1.5) + S.path(`M${ax - 10} ${ay - 100} Q${ax + 6} ${ay} ${ax - 10} ${ay + 100} L${ax + 10} ${ay + 100} Q${ax - 6} ${ay} ${ax + 10} ${ay - 100} Z`, 'a', 2, { fill: 'a-soft' });
        const vx = ax - dfar * sc;
        s += S.fade(u(0), S.circle(vx, ay, 6, 'c') + label(vx, ay + 24, `far point ${fmt(dfar, 2)} m`, { fill: 'c', size: 12 }));
        [-70, -35, 35, 70].forEach((y) => { s += S.line(40, ay + y, ax, ay + y, 'b', 2); s += S.fade(u(1), S.line(ax, ay + y, 760, ay + y + (y / (dfar * sc)) * (760 - ax), 'b', 2) + S.line(ax, ay + y, vx, ay, 'c', 1.2, dashed('4 4'))); });
        s += S.fade(u(1), label(560, 110, 'parallel light leaves as if from the far point', { size: 13 }));
        s += S.fade(u(2), label(560, 140, `P = −1 ÷ ${fmt(dfar, 2)} = ${fmt(P, 1)} D`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'd_far']], color: 'c', say: 'd_far: beyond this distance the eye can’t focus. Distant objects send parallel light, which it can’t handle.' },
        { parts: [[2, '−1/']], color: 'a', say: '−1/: a diverging lens spreads parallel light so it seems to come from the far point, which the eye can focus.' },
        { parts: [[0, 'P'], [1, ' = ']], say: 'P =: the lens’s focus must sit at the far point, so its power is −1/d_far.' },
      ],
      vary: [{ key: 'dfar', amp: 0.3, min: 0.12, max: 1.5, label: 'd_far', color: 'c', say: 'Vary the far point: the closer it is, the more short-sighted, and the stronger the lens needed.' }],
    }),
    'Long sight': play({
      own: true, values: { dnear: 1 },
      intro: 'A long-sighted eye can’t focus closer than its near point, say 1 m. You want to read at 25 cm.',
      scene: ({ dnear }, h, k, u) => {
        const X = (v) => 400 + v * 70, y = 230;
        let s = S.line(X(-5), y, X(1), y, 'ink', 2);
        for (let v = -5; v <= 1; v++) s += S.line(X(v), y - 6, X(v), y + 6, 'ink', 1.5) + label(X(v), y + 24, `${v} D`, { fill: 'muted', size: 11 });
        s += label(X(-5) - 10, y + 4, 'light arriving:', { anchor: 'end', size: 12, fill: 'muted' });
        s += S.fade(u(0), S.circle(X(-4), y, 8, 'b') + label(X(-4), y - 20, 'page at 25 cm: −1/0.25 = −4', { fill: 'b', size: 12 }));
        s += S.fade(u(1), S.circle(X(-1 / dnear), y, 8, 'c') + label(X(-1 / dnear), y + 50, `near point: −1/${fmt(dnear, 2)} = ${fmt(-1 / dnear, 2)}`, { fill: 'c', size: 12 }));
        s += S.fade(u(2), S.arrow(X(-4), y - 40, X(-1 / dnear), y - 40, 'a', 3) + label((X(-4) + X(-1 / dnear)) / 2, y - 54, `the lens adds ${fmt(4 - 1 / dnear, 2)} D`, { fill: 'a', weight: 600, size: 14 }));
        return s;
      },
      pieces: [
        { parts: [[2, '1/0.25']], color: 'b', say: '1/0.25: light from a page at 25 cm arrives with −4 D of spread, too much for this eye.' },
        { parts: [[3, ' − 1/d_near']], color: 'c', say: '− 1/d_near: the eye can only cope with light spreading like it comes from its near point.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'a', say: 'P =: a converging lens makes up the difference, moving the page’s light to look like it’s at the near point.' },
      ],
      vary: [{ key: 'dnear', amp: 1, min: 0.3, max: 3, label: 'd_near', color: 'c', say: 'Vary the near point: the further it recedes, the stronger the reading glasses.' }],
    }),
    'Glasses add': play({
      own: true, values: { Pg: -1 },
      intro: 'A short-sighted eye: 60 D, but its retina needs 57 D. Choose the glasses.',
      scene: ({ Pg }, h, k, u) => {
        const m = { P: 60, err: 60 + Pg - 57, Vobj: 0 };
        let s = O.drawEye(m, { u: 1, eyeLen: 36 }) + O.chart(700, 150, m.err, 'pv-g');
        if (Pg !== 0) s += S.path(`M${O.FRONT - 70} ${O.CY - 70} Q${O.FRONT - 70 - Math.sign(Pg) * 18} ${O.CY} ${O.FRONT - 70} ${O.CY + 70}`, 'a', 2.5);
        s += S.fade(u(0), label(60, 362, 'eye: 60 D', { anchor: 'start', size: 14 }));
        s += S.fade(u(1), label(180, 362, `glasses: ${fmt(Pg)} D`, { anchor: 'start', size: 14, fill: 'a' }));
        s += S.fade(u(2), label(60, 392, `total ${fmt(60 + Pg)} D (needs 57)`, { anchor: 'start', size: 16, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'P_eye']], say: 'P_eye: the eye’s own focusing.' },
        { parts: [[3, ' + P_glasses']], color: 'a', say: '+ P_glasses: thin lenses close together just add their powers.' },
        { parts: [[0, 'P_total'], [1, ' = ']], say: 'P_total =: when the total matches what the retina needs, the image is sharp.' },
      ],
      vary: [{ key: 'Pg', amp: 2.5, min: -4, max: 1, label: 'P_glasses', color: 'a', say: 'Dial the glasses: at exactly −3 D the letters snap into focus.' }],
    }),
  });
})();
