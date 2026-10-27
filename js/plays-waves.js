// "Show formula" plays for Waves. The build progress k also drives the wave motion, so waves keep moving
// while each formula is built. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, lerp, clamp01, dashed } = MV;
  const { play, label, reg } = MV.playKit;
  const { path, graph } = MV.phys;
  const TAU = 2 * Math.PI, RAD = Math.PI / 180;
  const work = (x, y, list, o = {}) => list.map(([text, u, col], i) => S.fade(u, label(x, y + i * 28, text, { anchor: 'start', size: 16, fill: col || 'ink', ...o }))).join('');
  const rope = (x0, x1, y, A, lamPx, ph, col = 'ink', w = 3) => S.path(path(200, (u) => { const x = lerp(x0, x1, u); return [x, y - A * Math.sin(TAU * (x - x0) / lamPx - ph)]; }), col, w);
  const bracket = (x1, x2, y, text, col) => S.line(x1, y, x2, y, col, 2) + S.line(x1, y - 6, x1, y + 6, col, 2) + S.line(x2, y - 6, x2, y + 6, col, 2) + label((x1 + x2) / 2, y - 10, text, { fill: col, size: 13, weight: 600 });

  // =====================================================================
  // The wave equation
  // =====================================================================

  reg('w-equation', {
    'Wave speed': play({
      own: true, values: { lam: 2, f: 0.5 },
      intro: 'A wave on a rope. Ruler marks every metre.',
      scene: ({ lam, f }, h, k, u) => {
        const sc = 55, x0 = 60, y = 220, lp = lam * sc, ph = TAU * f * k * 30;
        let s = rope(x0, 740, y, 50, lp, ph);
        for (let m = 0; m <= 12; m++) s += S.line(x0 + m * sc, 300, x0 + m * sc, 308, 'grid2', 1.5);
        const c1 = x0 + lp / 4 + (((ph / TAU) % 1) * lp);
        s += S.fade(u(0), bracket(c1, c1 + lp, y - 78, `λ = ${fmt(lam)} m`, 'a'));
        const dx = x0 + 3 * sc;
        s += S.fade(u(1), S.circle(dx, y - 50 * Math.sin(TAU * (dx - x0) / lp - ph), 8, 'b') + label(dx, 340, `${fmt(f)} bobs every second`, { fill: 'b', size: 13 }));
        s += S.fade(u(2), S.arrow(300, 380, 300 + lam * f * sc, 380, 'c', 3) + label(560, 120, `${fmt(lam)} m per bob × ${fmt(f)} bobs/s = ${fmt(lam * f)} m/s`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'λ']], color: 'a', say: 'λ: crest to crest, the wavelength.' },
        { parts: [[3, 'f']], color: 'b', say: 'f: a point on the rope bobs up and down f times a second.' },
        { parts: [[0, 'v'], [1, ' = ']], color: 'c', say: 'v =: each bob, the pattern moves on one wavelength. f bobs a second means λ × f metres a second.' },
      ],
      vary: [{ key: 'f', amp: 0.4, min: 0.1, label: 'f', color: 'b', say: 'Vary f with the same λ: the wave races along faster.' }],
    }),
    Period: play({
      own: true, values: { f: 4 },
      intro: 'A point on a rope bobbing up and down. How long does each bob take?',
      scene: ({ f }, h, k, u) => {
        const X = (t) => 100 + t * 560, y = 270;
        let s = S.line(X(0), y, X(1), y, 'ink', 2) + label(X(0), y + 24, '0 s', { size: 12 }) + label(X(1), y + 24, '1 s', { size: 12 });
        s += S.fade(u(1), S.path(path(300, (q) => [X(q), y - 60 - 40 * Math.sin(TAU * f * q)]), 'b', 2.5));
        for (let i = 0; i < Math.floor(f + 1e-9); i++) s += S.fade(clamp01(u(1) * f - i), S.line(X(i / f), y - 6, X(i / f), y + 6, 'b', 2) + S.circle(X((i + 0.25) / f), y - 100, 4, 'b'));
        s += S.fade(u(0), label(400, 110, `${fmt(f)} bobs in 1 second`, { fill: 'b', size: 15 }));
        s += S.fade(u(2), bracket(X(0), X(1 / f), y + 50, `T = 1 ÷ ${fmt(f)} = ${fmt(1 / f, 3)} s`, 'a'));
        return s;
      },
      pieces: [
        { parts: [[3, 'f']], color: 'b', say: 'f: how many complete bobs fit into one second.' },
        { parts: [[2, '1/']], say: '1/: share the second out between them…' },
        { parts: [[0, 'T'], [1, ' = ']], color: 'a', say: 'T =: …and each one takes 1/f seconds. Frequency and period are each other’s reciprocals.' },
      ],
      vary: [{ key: 'f', amp: 3, min: 1, max: 8, label: 'f', color: 'b', say: 'Vary f: more bobs a second, each one shorter.' }],
    }),
    'Speed from period': play({
      own: true, values: { lam: 2, T: 2 },
      intro: 'Two snapshots of a wave, one period apart.',
      scene: ({ lam, T }, h, k, u) => {
        const sc = 55, x0 = 60, lp = lam * sc;
        let s = S.fade(u(0), rope(x0, 740, 150, 40, lp, 0, 'muted', 2) + label(x0, 110, 'at t = 0', { anchor: 'start', size: 12, fill: 'muted' }));
        s += S.fade(u(1), rope(x0, 740, 300, 40, lp, TAU * u(1), 'ink', 3) + label(x0, 250, `at t = T = ${fmt(T)} s`, { anchor: 'start', size: 12 }));
        const c = x0 + lp / 4;
        s += S.fade(u(0), S.line(c, 105, c, 345, 'a', 1.5, dashed('4 4')));
        s += S.fade(u(1), S.line(c + lp, 255, c + lp, 345, 'a', 1.5, dashed('4 4')) + bracket(c, c + lp, 360, `moved λ = ${fmt(lam)} m`, 'a'));
        s += S.fade(u(2), label(560, 80, `${fmt(lam)} m in ${fmt(T)} s = ${fmt(lam / T)} m/s`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'λ']], color: 'a', say: 'λ: watch one crest.' },
        { parts: [[3, '/T']], say: '/T: after exactly one period, the crest has moved to where the next crest was: one wavelength.' },
        { parts: [[0, 'v'], [1, ' = ']], say: 'v =: distance ÷ time. Since T = 1/f, this is the same as λf.' },
      ],
      vary: [{ key: 'T', amp: 1.2, min: 0.5, label: 'T', color: 'b', say: 'Vary the period: a slower bob means a slower wave for the same wavelength.' }],
    }),
    'Travelling wave': play({
      own: true, values: { A: 50, lam: 3, f: 0.3, t: 0 },
      intro: 'A formula for the rope’s shape, at every place and every moment.',
      scene: ({ A, lam, f, t }, h, k, u) => {
        const sc = 55, x0 = 60, y = 220, lp = lam * sc;
        let s = S.line(x0, y, 740, y, 'grid2', 1, dashed('3 5'));
        const amp = A * Math.max(0.15, u(0)), shift = TAU * f * t * u(2);
        s += S.path(path(220, (q) => { const x = lerp(x0, 740, q); const ph = TAU * (x - x0) / lp; return [x, y - amp * Math.sin(u(1) > 0 ? ph - shift : 0)]; }), 'ink', 3);
        s += S.fade(u(0), S.line(100, y, 100, y - A, 'b', 2.5) + label(108, y - A / 2, `A = ${fmt(A)}`, { fill: 'b', size: 12, anchor: 'start' }));
        s += S.fade(u(1), bracket(x0, x0 + lp, y + 90, `x/λ: repeats every ${fmt(lam)} m`, 'a'));
        s += S.fade(u(2), label(560, 80, `− ft: slides right by f × t wavelengths (t = ${fmt(t, 1)} s)`, { size: 13, fill: 'c' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'A sin(']], color: 'b', say: 'A sin(…): a sine curve, A high.' },
        { parts: [[3, '2π(x/λ']], color: 'a', say: 'x/λ: counting wavelengths along the rope, so the pattern repeats every λ.' },
        { parts: [[4, ' − ft))']], color: 'c', say: '− ft: as time passes, subtract f t: the whole pattern slides to the right by f t wavelengths.' },
        { parts: [[0, 'y'], [1, ' = ']], say: 'y =: the height of the rope at place x and time t.' },
      ],
      vary: [{ key: 't', amp: 6, min: 0, max: 12, label: 't', color: 'c', say: 'Vary the time: the shape glides along without changing.' }],
    }),
  });

  // =====================================================================
  // Wave phenomena
  // =====================================================================

  // Two waves on one axis, one shifted by the path difference dd (in wavelengths), and their sum.
  const pair = (dd, u, k) => {
    const x0 = 80, x1 = 720, lp = 120, ph = k * 25;
    let s = S.fade(u[0], label(x0, 100, 'wave from source 1', { anchor: 'start', size: 12, fill: 'a' }) + rope(x0, x1, 130, 30, lp, ph, 'a', 2.5));
    s += S.fade(u[1], label(x0, 186, `wave from source 2, ${fmt(dd, 2)} λ further`, { anchor: 'start', size: 12, fill: 'c' }) + rope(x0, x1, 216, 30, lp, ph + TAU * dd, 'c', 2.5));
    s += S.fade(u[2], label(x0, 290, 'sum', { anchor: 'start', size: 12 }) + S.path(path(200, (q) => { const x = lerp(x0, x1, q), a = TAU * (x - x0) / lp - ph; return [x, 330 - 30 * (Math.sin(a) + Math.sin(a - TAU * dd))]; }), 'ink', 3));
    const amp = Math.abs(2 * Math.cos(Math.PI * dd));
    s += S.fade(u[2], label(740, 400, amp > 1.9 ? 'loud: crests meet crests' : amp < 0.15 ? 'silent: crests meet troughs' : `partly: ×${fmt(amp, 2)}`, { anchor: 'end', size: 14, weight: 600 }));
    return s;
  };

  reg('w-phenomena', {
    Reflection: play({
      own: true, values: { th: 35 },
      intro: 'Ripples meeting a straight wall.',
      scene: ({ th }, h, k, u) => {
        const wx = 560, hy = 230, r = th * RAD, L = 260, d = [Math.cos(r), Math.sin(r)];
        let s = S.rect(wx, 60, 14, 340, 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.line(wx - 220, hy, wx, hy, 'muted', 1.5, dashed('5 5'));
        // A few incoming crests along the ray, perpendicular to it.
        for (let i = 1; i <= 4; i++) { const c = [wx - (i * 50) * d[0], hy - (i * 50) * d[1]]; s += S.fade(u(0), S.line(c[0] + d[1] * 40, c[1] - d[0] * 40, c[0] - d[1] * 40, c[1] + d[0] * 40, 'a', 2.5)); }
        s += S.fade(u(0), S.arrow(wx - L * d[0], hy - L * d[1], wx - 4, hy - 2, 'a', 3) + label(wx - 90, hy - 14, `θi ${fmt(th, 0)}°`, { fill: 'a', weight: 600, size: 13 }));
        for (let i = 1; i <= 4; i++) { const c = [wx - (i * 50) * d[0], hy + (i * 50) * d[1]]; s += S.fade(u(1), S.line(c[0] - d[1] * 40, c[1] - d[0] * 40, c[0] + d[1] * 40, c[1] + d[0] * 40, 'c', 2.5)); }
        s += S.fade(u(1), S.arrow(wx, hy, wx - L * d[0], hy + L * d[1], 'c', 3) + label(wx - 90, hy + 26, `θr ${fmt(th, 0)}°`, { fill: 'c', weight: 600, size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'θ_i']], color: 'a', say: 'θ_i: the ripples arrive at an angle to the wall’s normal.' },
        { parts: [[1, ' = ']], say: 'Each part of a crest bounces as it arrives, and the reflected crest leaves at the mirror angle.' },
        { parts: [[0, 'θ_r']], color: 'c', say: 'θ_r: the same angle on the other side. The spacing (wavelength) doesn’t change.' },
      ],
      vary: [{ key: 'th', amp: 25, min: 5, max: 70, label: 'θ_i', color: 'a', say: 'Vary the angle: the reflection swings to match.' }],
    }),
    Refraction: play({
      own: true, values: { th: 40, r: 0.6 },
      intro: 'Ripples crossing from deep to shallow water, where they travel slower.',
      scene: ({ th, r }, h, k, u) => {
        const by = 230, r1 = th * RAD, r2 = Math.asin(Math.sin(r1) * r), cx = 400;
        let s = S.rect(40, 50, 720, by - 50, 'a-soft', null, { opacity: 0.6 }) + S.rect(40, by, 720, 170, 'b-soft', null, { opacity: 0.7 }) + S.line(40, by, 760, by, 'b', 2, dashed('6 4'));
        s += S.line(cx, 60, cx, 400, 'muted', 1.5, dashed('5 5'));
        const L1 = 180, L2 = 160, a1 = [cx - L1 * Math.sin(r1), by - L1 * Math.cos(r1)], a2 = [cx + L2 * Math.sin(r2), by + L2 * Math.cos(r2)];
        s += S.fade(u(0), S.arrow(...a1, cx, by, 'a', 3) + label(a1[0] - 6, a1[1], `v₁, λ₁`, { fill: 'a', anchor: 'end', size: 13, weight: 600 }));
        for (let i = 1; i <= 4; i++) { const c = [cx - i * 40 * Math.sin(r1), by - i * 40 * Math.cos(r1)]; s += S.fade(u(0), S.line(c[0] - 30 * Math.cos(r1), c[1] + 30 * Math.sin(r1), c[0] + 30 * Math.cos(r1), c[1] - 30 * Math.sin(r1), 'a', 2)); }
        s += S.fade(u(1), S.arrow(cx, by, ...a2, 'c', 3) + label(a2[0] + 6, a2[1], `v₂ = ${fmt(r)} v₁`, { fill: 'c', anchor: 'start', size: 13, weight: 600 }));
        for (let i = 1; i <= 4; i++) { const c = [cx + i * 40 * r * Math.sin(r2), by + i * 40 * r * Math.cos(r2)]; s += S.fade(u(1), S.line(c[0] - 30 * Math.cos(r2), c[1] + 30 * Math.sin(r2), c[0] + 30 * Math.cos(r2), c[1] - 30 * Math.sin(r2), 'c', 2)); }
        s += S.fade(u(2), label(620, 90, `sin ${fmt(th, 0)}° ÷ sin ${fmt(r2 / RAD, 1)}° = ${fmt(Math.sin(r1) / Math.sin(r2), 2)}`, { size: 14 }) + label(620, 116, `v₁ ÷ v₂ = ${fmt(1 / r, 2)}`, { size: 14, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'sin θ₁']], color: 'a', say: 'sin θ₁: the crests arrive at an angle, spaced λ₁ apart.' },
        { parts: [[1, '/sin θ₂']], color: 'c', say: '/sin θ₂: in the shallows they’re slower, so closer together; joined up along the boundary, they must turn.' },
        { parts: [[2, ' = v₁/v₂']], say: '= v₁/v₂: the ratio of the sines equals the ratio of the speeds (and of the wavelengths).' },
      ],
      vary: [{ key: 'r', amp: 0.35, min: 0.3, max: 1, label: 'v₂/v₁', color: 'c', say: 'Vary how much slower the shallows are: equal speeds, no bending at all.' }],
    }),
    Diffraction: play({
      own: true, values: { a: 4, lam: 1.5 },
      intro: 'Light or water waves through a narrow gap of width a. Look at the two edges of the gap.',
      scene: ({ a, lam }, h, k, u) => {
        const bx = 200, cy = 220, sc = 30, A = a * sc, th = lam < a ? Math.asin(lam / a) : Math.PI / 2 * 0.95;
        let s = S.rect(bx - 6, 50, 12, cy - A / 2 - 50, 'ink', null) + S.rect(bx - 6, cy + A / 2, 12, 400 - cy - A / 2, 'ink', null);
        const top = [bx, cy - A / 2], bot = [bx, cy + A / 2], dir = [Math.cos(th), Math.sin(th)];
        s += S.fade(u(0), label(bx - 14, cy, `a = ${fmt(a)}`, { anchor: 'end', size: 13, fill: 'a', weight: 600 }) + S.line(bx - 10, top[1], bx - 10, bot[1], 'a', 2));
        s += S.fade(u(1), S.line(...top, top[0] + 500 * dir[0], top[1] + 500 * dir[1], 'c', 2) + S.line(...bot, bot[0] + 500 * dir[0], bot[1] + 500 * dir[1], 'c', 2));
        // Foot of the perpendicular: the extra path of the top ray is a·sin θ.
        const foot = [top[0] + A * Math.sin(th) * dir[0], top[1] + A * Math.sin(th) * dir[1]];
        s += S.fade(u(1), S.line(...bot, ...foot, 'muted', 1.5, dashed('3 3')) + S.line(...top, ...foot, 'b', 4) + label(foot[0] + 8, foot[1] - 8, `extra path a sin θ = ${fmt(a * Math.sin(th), 2)}`, { fill: 'b', size: 12, anchor: 'start' }));
        s += S.fade(u(2), label(560, 100, `first dark direction: a sin θ = λ`, { size: 14 }) + label(560, 126, `θ = ${fmt(th / RAD, 1)}°: the beam spreads this far`, { size: 14, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'λ']], color: 'c', say: 'λ: two rays leave the edges of the gap at an angle θ. One travels further than the other.' },
        { parts: [[4, '/a']], color: 'a', say: '/a: the extra distance is a sin θ. When it equals one wavelength, light from the gap cancels in pairs: the first dark direction.' },
        { parts: [[0, 'sin θ'], [1, ' ≈ ']], say: 'sin θ ≈: so the beam spreads out to about λ/a. A narrow gap or a long wavelength spreads a lot.' },
      ],
      vary: [{ key: 'lam', amp: 1.3, min: 0.3, max: 3.9, label: 'λ', color: 'c', say: 'Vary the wavelength: as it approaches the gap’s width, the spread approaches 90°.' }],
    }),
    'Constructive interference': play({
      own: true, values: { dd: 1 },
      intro: 'Two waves arrive at the same spot after travelling different distances.',
      scene: ({ dd }, h, k, u) => pair(dd, [u(0), u(1), u(2)], k),
      pieces: [
        { parts: [[0, 'Δd']], color: 'a', say: 'Δd: how much further one wave travelled than the other.' },
        { parts: [[1, ' = ']], color: 'c', say: 'If that extra distance is a whole number of wavelengths…' },
        { parts: [[2, 'mλ']], say: 'mλ: …the second wave is shifted by whole cycles: crest still lines up with crest. They add to double height.' },
      ],
      vary: [{ key: 'dd', amp: 1, min: 0, max: 2.5, label: 'Δd (in λ)', color: 'c', say: 'Vary the path difference: loud at 0, 1, 2 wavelengths, silent in between.' }],
    }),
    'Destructive interference': play({
      own: true, values: { dd: 1.5 },
      intro: 'Two waves arrive at the same spot, one half a wavelength behind the other.',
      scene: ({ dd }, h, k, u) => pair(dd, [u(0), u(1), u(2)], k),
      pieces: [
        { parts: [[0, 'Δd']], color: 'a', say: 'Δd: the extra distance travelled by the second wave.' },
        { parts: [[1, ' = ']], color: 'c', say: 'If it’s a whole number of wavelengths plus a half…' },
        { parts: [[2, '(m + ½)λ']], say: '(m + ½)λ: …every crest of one meets a trough of the other. They cancel: silence, or darkness.' },
      ],
      vary: [{ key: 'dd', amp: 1, min: 0, max: 2.5, label: 'Δd (in λ)', color: 'c', say: 'Vary the path difference: the sum fades in and out.' }],
    }),
    'Malus’s law': play({
      own: true, values: { th: 40 },
      intro: 'Vertically polarized light meets a polarizer turned by θ.',
      scene: ({ th }, h, k, u) => {
        const cx = 260, cy = 230, A = 140, r = th * RAD, c = Math.cos(r);
        let s = S.circle(cx, cy, A + 10, null, 'grid2', { 'stroke-width': 1, ...dashed('3 4') });
        s += S.fade(u(0), S.arrow(cx, cy, cx, cy - A, 'b', 4) + label(cx - 10, cy - A + 10, 'I₀: amplitude', { fill: 'b', anchor: 'end', size: 12 }));
        s += S.fade(u(1), S.line(cx - (A + 30) * Math.sin(r), cy + (A + 30) * Math.cos(r), cx + (A + 30) * Math.sin(r), cy - (A + 30) * Math.cos(r), 'a', 2, dashed('6 4')) + label(cx + (A + 40) * Math.sin(r), cy - (A + 40) * Math.cos(r), 'polarizer axis', { fill: 'a', size: 12 }) +
          S.arrow(cx, cy, cx + A * c * Math.sin(r), cy - A * c * Math.cos(r), 'a', 4) + S.line(cx, cy - A, cx + A * c * Math.sin(r), cy - A * c * Math.cos(r), 'muted', 1.5, dashed('3 3')) + label(cx + 20, cy + 30, `passes: × cos ${fmt(th, 0)}° = × ${fmt(c, 2)}`, { fill: 'a', anchor: 'start', size: 13 }));
        s += S.fade(u(2), S.rect(560, 380 - 200, 50, 200, 'b-soft', 'b', { 'stroke-width': 1.5 }) + S.rect(640, 380 - 200 * c * c, 50, 200 * c * c, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(585, 398, 'I₀', { fill: 'b', size: 12 }) + label(665, 398, `${fmt(c * c * 100, 0)} %`, { fill: 'a', size: 12, weight: 600 }) + label(625, 150, 'intensity ∝ amplitude²', { size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'I₀']], color: 'b', say: 'I₀: the light arrives wiggling vertically.' },
        { parts: [[3, ' cos²θ']], color: 'a', say: 'cos θ: only the part of the wiggle along the polarizer’s axis gets through. Intensity goes with amplitude squared: cos²θ.' },
        { parts: [[0, 'I'], [1, ' = ']], say: 'I =: at 0° everything passes; at 90° nothing.' },
      ],
      vary: [{ key: 'th', amp: 45, min: 0, max: 90, label: 'θ', color: 'a', say: 'Turn the polarizer: the light fades smoothly to black at 90°.' }],
    }),
    Resonance: play({
      own: true, values: { f: 0.7 },
      intro: 'A child on a swing (natural frequency 1 push per second) being pushed regularly.',
      scene: ({ f }, h, k, u) => {
        const Gr = graph({ x0: 90, x1: 740, y0: 360, y1: 120, tMax: 12, vMax: 1.2, vMin: -1.2, vLabel: 'swing', tLabel: 'time (s)', ticks: false });
        const Q = 8, amp = 1 / Math.sqrt((1 - f * f) ** 2 + (f / Q) ** 2) / Q;
        let s = Gr.s;
        s += S.fade(u(0), S.path(path(400, (q) => { const t = q * 12; return [Gr.X(t), Gr.Y(Math.max(-1.15, Math.min(1.15, amp * (1 - Math.exp(-t / 3)) * Math.sin(TAU * f * t))))]; }), 'b', 2.5));
        for (let t = 0; t < 12; t += 1 / f) s += S.fade(u(1), S.arrow(Gr.X(t), Gr.Y(1.18), Gr.X(t), Gr.Y(1.02), 'a', 2, 7));
        s += S.fade(u(2), label(560, 90, Math.abs(f - 1) < 0.05 ? 'in step: every push adds energy' : 'out of step: pushes fight the motion half the time', { weight: 600, size: 14 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'f_push']], color: 'a', say: 'f_push: the pushes (arrows) come at their own rhythm.' },
        { parts: [[1, ' = ']], say: 'Each push helps if the swing is moving the same way, and hinders if it’s coming back.' },
        { parts: [[2, 'f₀']], color: 'b', say: 'f₀: push at the swing’s natural frequency and every push helps: the motion grows and grows.' },
      ],
      vary: [{ key: 'f', amp: 0.45, min: 0.3, max: 1.8, label: 'f_push', color: 'a', say: 'Vary the pushing rhythm: only near f₀ does the swinging build up.' }],
    }),
  });

  // =====================================================================
  // Sound
  // =====================================================================

  reg('w-sound', {
    Pitch: play({
      own: true, values: { f: 220 },
      intro: 'The pressure at your ear, over 20 milliseconds.',
      scene: ({ f }, h, k, u) => {
        const x0 = 60, x1 = 740, ms = 20, X = (t) => x0 + (t / ms) * (x1 - x0), T = 1000 / f;
        let s = S.rect(x0, 70, x1 - x0, 240, 'card', 'grid2', { rx: 8 }) + S.path(path(400, (q) => [x0 + q * (x1 - x0), 190 - 80 * Math.sin(TAU * (q * ms) / T - k * 20)]), 'a', 2.5);
        s += S.fade(u(0), bracket(X(T * 0.25 + ((k * 20) / TAU % 1) * T), X(T * 1.25 + ((k * 20) / TAU % 1) * T), 330, `T = ${fmt(T, 2)} ms`, 'b'));
        s += S.fade(u(2), label(400, 380, `f = 1000 ÷ ${fmt(T, 2)} = ${fmt(f, 0)} Hz`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'T']], color: 'b', say: 'T: the time for one full squeeze-and-stretch of the air.' },
        { parts: [[2, '1/']], say: '1/: how many of those fit into a second…' },
        { parts: [[0, 'f'], [1, ' = ']], color: 'a', say: 'f =: …is the frequency, which your ear hears as pitch.' },
      ],
      vary: [{ key: 'f', amp: 200, min: 60, max: 800, label: 'f', color: 'a', say: 'Vary the frequency: the waves squeeze together as the pitch rises.' }],
    }),
    Loudness: play({
      own: true, values: { e: 6 },
      intro: 'Your ear handles sounds from a whisper to a jet. Count powers of ten.',
      scene: ({ e }, h, k, u) => {
        const X = (v) => 80 + v * 50, y = 250, ex = Math.max(0, Math.min(13, e));
        let s = S.line(X(0), y, X(13), y, 'ink', 2);
        [[0, 'quietest you can hear'], [3, 'whisper'], [6, 'conversation'], [8, 'traffic'], [11, 'rock concert'], [13, 'pain']].forEach(([v, name], i) => { s += S.line(X(v), y - 6, X(v), y + 6, 'ink', 1.5) + label(X(v), y + (i % 2 ? 44 : 26), name, { fill: 'muted', size: 11 }); });
        s += S.fade(u(0), S.circle(X(ex), y, 9, 'b') + label(X(ex), y - 26, `I = 10^${fmt(ex, 1)} × I₀`, { fill: 'b', size: 13, weight: 600 }));
        s += S.fade(u(1), label(X(ex), y - 50, `log: ${fmt(ex, 1)} powers of ten`, { size: 12 }));
        s += S.fade(u(2), label(400, 120, `β = 10 × ${fmt(ex, 1)} = ${fmt(10 * ex, 0)} dB`, { weight: 600, size: 18 }) + label(400, 148, 'every +10 dB is 10× the intensity', { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[3, '(I/I₀)']], color: 'b', say: 'I/I₀: how many times more intense than the faintest sound you can hear.' },
        { parts: [[2, 'log']], say: 'log: count the powers of ten in that number. A huge range becomes a short scale.' },
        { parts: [[0, 'β'], [1, ' = 10 ']], color: 'a', say: 'β = 10…: times ten gives decibels. A conversation is a million times the threshold: 60 dB.' },
      ],
      vary: [{ key: 'e', amp: 5, min: 0, max: 13, label: 'powers of ten', color: 'b', say: 'Vary the intensity: a step of 10 dB is ten times the energy, but sounds about twice as loud.' }],
    }),
    Echo: play({
      own: true, values: { t: 2 },
      intro: 'Shout at a cliff and time the echo.',
      scene: ({ t }, h, k, u) => {
        const d = (343 * t) / 2, sc = 560 / 700, x0 = 100, cliff = x0 + d * sc, y = 260;
        let s = S.rect(Math.min(760, cliff), 80, 40, 260, 'ink-soft', 'ink', { 'stroke-width': 2 }) + MV.phys.figure(x0, y + 40, 'a', 1.2);
        const go = clamp01(u(0) * 2), back = clamp01(u(0) * 2 - 1);
        if (go > 0 && go < 1) s += S.path(`M${x0 + 20 + (cliff - x0 - 20) * go} ${y - 30} a 20 30 0 0 1 0 60`, 'b', 3);
        if (back > 0 && back < 1) s += S.path(`M${cliff - (cliff - x0 - 20) * back} ${y - 30} a 20 30 0 0 0 0 60`, 'c', 3);
        s += S.fade(u(0), label(400, 110, `echo after t = ${fmt(t, 1)} s`, { size: 14 }));
        s += S.fade(u(1), label(400, 140, `sound covered v t = ${fmt(343 * t, 0)} m, there and back`, { size: 14 }));
        s += S.fade(u(2), S.line(x0, y + 60, Math.min(760, cliff), y + 60, 'a', 2.5) + label((x0 + Math.min(760, cliff)) / 2, y + 84, `d = ${fmt(d, 0)} m`, { fill: 'a', weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'vt']], color: 'b', say: 'vt: in t seconds, sound at 343 m/s covers v × t.' },
        { parts: [[3, '/2']], color: 'c', say: '/2: but that was a round trip, to the cliff and back.' },
        { parts: [[0, 'd'], [1, ' = ']], color: 'a', say: 'd =: so the cliff is half that distance away. Bats, dolphins, sonar and ultrasound scanners all work this way.' },
      ],
      vary: [{ key: 't', amp: 1.5, min: 0.3, max: 4, label: 't', color: 'b', say: 'Vary the echo time: a longer wait means a farther cliff.' }],
    }),
    Doppler: play({
      own: true, values: { f: 400, M: 0.3 },
      intro: 'A siren moving toward a listener, sending a crest every period T.',
      scene: ({ f, M }, h, k, u) => {
        const y = 220, T = 1, vpx = 120, sx0 = 140, n = 5;
        let s = '';
        for (let i = 0; i < n; i++) { const te = i * T, ex = sx0 + vpx * M * te, r = vpx * (n * T - te); s += S.circle(ex, y, r, null, 'a', { 'stroke-width': 1.5, opacity: 0.6 }); }
        const src = sx0 + vpx * M * n * T;
        s += S.rect(src - 18, y - 10, 36, 20, 'c', null, { rx: 5 });
        // The last two crests: ahead of the source they're (v − v_s)T apart, behind it (v + v_s)T.
        const ahead = vpx * (1 - M) * T, behind = vpx * (1 + M) * T;
        s += S.fade(u(1), bracket(src, src + ahead, y - 60, 'λ′ = (v − v_s)T', 'a') + bracket(src - behind, src, y + 70, '(v + v_s)T', 'muted'));
        s += S.fade(u(2), label(620, 70, `f′ = ${fmt(f)} × 343 ÷ ${fmt(343 * (1 - M), 0)} = ${fmt(f / (1 - M), 0)} Hz`, { weight: 600, size: 14 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'f']], color: 'c', say: 'f: the siren emits f crests a second, one every period T.' },
        { parts: [[3, ' v/(v − v_s)']], color: 'a', say: 'v/(v − v_s): between crests the source moves v_s T forward, so crests ahead are only (v − v_s)T apart.' },
        { parts: [[0, 'f′'], [1, ' = ']], say: 'f′ =: shorter wavelength at the same sound speed means more crests a second: a higher pitch.' },
      ],
      vary: [{ key: 'M', amp: 0.3, min: 0, max: 0.8, label: 'v_s/v', color: 'c', say: 'Vary the source speed: the faster it goes, the more the crests bunch up ahead.' }],
    }),
  });

  // =====================================================================
  // Standing waves
  // =====================================================================

  const loops = (n, x0, len, y, A, ph, closed = false, col = 'ink') => {
    const env = (x) => (closed ? Math.sin(((n * Math.PI) / 2) * ((x - x0) / len)) : Math.sin((n * Math.PI * (x - x0)) / len));
    return S.path(path(200, (q) => { const x = x0 + q * len; return [x, y - A * env(x) * Math.cos(ph)]; }), col, 3) + S.path(path(200, (q) => { const x = x0 + q * len; return [x, y + A * env(x) * Math.cos(ph)]; }), col, 1.2, { opacity: 0.35 });
  };
  const harmonic = (closed, div) => ({ n, L }, h, k, u) => {
    const x0 = 100, len = 600, y = 210, N = Math.round(n);
    let s = (closed === 'tube-open' || closed === 'tube-closed') ? S.line(x0, y - 70, x0 + len, y - 70, 'ink', 3) + S.line(x0, y + 70, x0 + len, y + 70, 'ink', 3) + (closed === 'tube-closed' ? S.line(x0, y - 70, x0, y + 70, 'ink', 6) : '') : S.rect(x0 - 12, y - 80, 12, 160, 'ink-soft', null) + S.rect(x0 + len, y - 80, 12, 160, 'ink-soft', null);
    const env = closed === 'tube-open' ? (x) => Math.cos((N * Math.PI * (x - x0)) / len) : closed === 'tube-closed' ? (x) => Math.sin(((N * Math.PI) / 2) * ((x - x0) / len)) : (x) => Math.sin((N * Math.PI * (x - x0)) / len);
    s += S.path(path(200, (q) => { const x = x0 + q * len; return [x, y - 55 * env(x) * Math.cos(k * 30)]; }), 'ink', 3);
    const lamPx = (div * len) / N;
    s += S.fade(u(0), bracket(x0, x0 + len, y + 110, `L = ${fmt(L)} m`, 'b'));
    s += S.fade(u(1), bracket(x0, x0 + Math.min(len, lamPx), y - 100, `λ = ${div}L/${N} = ${fmt((div * L) / N, 2)} m`, 'a'));
    s += S.fade(u(2), label(400, 400, `f = ${N} × v ÷ (${div} × ${fmt(L)}) Hz`, { size: 14, weight: 600 }));
    return s;
  };
  reg('w-standing', {
    String: play({
      own: true, values: { n: 2, L: 0.65, v: 286 },
      intro: 'A guitar string, fixed at both ends, vibrating in its second harmonic.',
      scene: harmonic(false, 2),
      pieces: [
        { parts: [[3, '/2L']], color: 'b', say: '2L: the ends can’t move, so the string holds whole half-wavelengths: n half-waves in a length L, λ = 2L/n.' },
        { parts: [[2, 'nv']], color: 'a', say: 'nv: frequency = speed ÷ wavelength = v ÷ (2L/n) = nv/2L.' },
        { parts: [[0, 'f_n'], [1, ' = ']], say: 'f_n =: n = 1 is the fundamental; n = 2, 3, 4… the harmonics, whole-number multiples of it.' },
      ],
      vary: [{ key: 'L', amp: 0.3, min: 0.3, max: 1, label: 'L', color: 'b', say: 'Vary the length (pressing a fret): shorter string, higher note.' }],
    }),
    'Open tube': play({
      own: true, values: { n: 2, L: 0.6, v: 343 },
      intro: 'A flute: a tube open at both ends. Air moves most at the open ends.',
      scene: harmonic('tube-open', 2),
      pieces: [
        { parts: [[3, '/2L']], color: 'b', say: '2L: both ends are antinodes, so whole half-wavelengths fit, just like a string: λ = 2L/n.' },
        { parts: [[2, 'nv']], color: 'a', say: 'nv: with v = 343 m/s, the speed of sound in air.' },
        { parts: [[0, 'f_n'], [1, ' = ']], say: 'f_n =: every whole-number harmonic is allowed.' },
      ],
      vary: [{ key: 'L', amp: 0.4, min: 0.2, max: 1.5, label: 'L', color: 'b', say: 'Vary the tube’s length: longer tubes, lower notes, like an organ’s big pipes.' }],
    }),
    'Closed tube': play({
      own: true, values: { n: 3, L: 0.6, v: 343 },
      intro: 'A tube closed at one end: the air there can’t move.',
      scene: harmonic('tube-closed', 4),
      pieces: [
        { parts: [[3, '/4L']], color: 'b', say: '4L: a node at the closed end and an antinode at the open end: the tube holds an odd number of quarter-wavelengths, λ = 4L/n.' },
        { parts: [[2, 'nv']], color: 'a', say: 'nv: frequency = v/λ = nv/4L.' },
        { parts: [[0, 'f_n'], [1, ' = '], [4, ',  n odd']], say: 'n odd: only 1, 3, 5… fit. Even harmonics would need a moving closed end.' },
      ],
      vary: [{ key: 'L', amp: 0.4, min: 0.2, max: 1.5, label: 'L', color: 'b', say: 'Vary the length: blowing over a bottle, pour in water to shorten the air column and the note rises.' }],
    }),
    'Wave speed on a string': play({
      own: true, values: { T: 60, mu: 0.004 },
      intro: 'Pluck a pulse into a stretched string and time it.',
      scene: ({ T, mu }, h, k, u) => {
        const v = Math.sqrt(T / mu), x0 = 80, x1 = 720, y = 230, pos = x0 + ((k * 4 * v / 120) % 1) * (x1 - x0);
        let s = S.rect(x0 - 14, y - 60, 14, 120, 'ink-soft', null) + S.rect(x1, y - 60, 14, 120, 'ink-soft', null);
        s += S.path(path(200, (q) => { const x = lerp(x0, x1, q); return [x, y - 50 * Math.exp(-(((x - pos) / 30) ** 2))]; }), 'ink', 3);
        s += S.fade(u(0), S.arrow(x1 + 20, y, x1 + 70, y, 'a', 3) + label(x1 + 46, y - 14, `T = ${fmt(T)} N`, { fill: 'a', size: 12 }));
        s += S.fade(u(1), label(400, 330, `μ = ${fmt(mu * 1000, 1)} g per metre`, { fill: 'c', size: 13 }));
        s += S.fade(u(2), label(400, 110, `v = √(${fmt(T)} ÷ ${fmt(mu, 3)}) = ${fmt(v, 0)} m/s`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[2, '√(T']], color: 'a', say: 'T: the tension. A tighter string snaps back harder, so the pulse moves faster.' },
        { parts: [[3, '/μ)']], color: 'c', say: 'μ: the mass per metre. A heavier string is sluggish, so the pulse moves slower.' },
        { parts: [[0, 'v'], [1, ' = ']], say: 'v =: tuning pegs change T; thick bass strings have big μ.' },
      ],
      vary: [{ key: 'T', amp: 45, min: 10, max: 120, label: 'T', color: 'a', say: 'Vary the tension: four times as tight is twice as fast, an octave up.' }],
    }),
  });

  // =====================================================================
  // Electromagnetic spectrum
  // =====================================================================

  const { sci } = MV.phys.waves;
  reg('w-spectrum', {
    'Speed of light': play({
      own: true, values: { lg: -6.3 },
      intro: 'Every electromagnetic wave travels at the same speed in a vacuum, c ≈ 3 × 10⁸ m/s.',
      scene: ({ lg }, h, k, u) => {
        const lam = 10 ** lg, f = 3e8 / lam, lamPx = 14 + ((lg + 13) / 17) * 220, band = MV.phys.waves.bandAt(lg);
        const col = band[2] === 'visible light' ? MV.phys.spectral(lam * 1e9) : band[3];
        let s = S.path(path(300, (q) => { const x = 60 + q * 680; return [x, 220 - 50 * Math.sin((TAU * (x - 60)) / lamPx - k * 30)]; }), col, 3);
        s += S.fade(u(0), label(400, 330, `${band[2]}`, { size: 15, weight: 600 }));
        s += S.fade(u(1), label(400, 110, `λ = ${sci(lam)} m`, { size: 15, fill: 'a' }));
        s += S.fade(u(2), label(400, 140, `f = 3 × 10⁸ ÷ λ = ${sci(f)} Hz`, { size: 15, weight: 600, fill: 'b' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'c'], [1, ' = ']], say: 'c: radio, light and X-rays all travel at the same speed in a vacuum.' },
        { parts: [[2, 'λ']], color: 'a', say: 'λ: what differs is the wavelength, from kilometres to smaller than an atom.' },
        { parts: [[3, 'f']], color: 'b', say: 'f: since λ × f is fixed, shorter waves have higher frequencies.' },
      ],
      vary: [{ key: 'lg', amp: 5, min: -12, max: 3, label: 'log₁₀ λ', color: 'a', say: 'Sweep the wavelength: from X-rays to radio, the speed never changes.' }],
    }),
    'Photon energy': play({
      own: true, values: { f: 6e14 },
      intro: 'Light arrives in packets, photons. How much energy does one carry?',
      scene: ({ f }, h, k, u) => {
        const E = (6.626e-34 * f) / 1.602e-19, sc = 60;
        let s = S.fade(u(0), label(80, 120, `f = ${sci(f)} Hz`, { anchor: 'start', size: 15, fill: 'b' }));
        s += S.fade(u(1), label(80, 150, 'h = 6.63 × 10⁻³⁴ J·s, Planck’s constant', { anchor: 'start', size: 14 }));
        s += S.fade(u(2), S.rect(80, 300 - Math.min(5, E) * sc, 40, Math.min(5, E) * sc, 'c-soft', 'c', { 'stroke-width': 1.5 }) + label(140, 300 - Math.min(5, E) * sc - 6, `${fmt(E, 2)} eV per photon`, { fill: 'c', size: 14, weight: 600, anchor: 'start' }) +
          S.line(60, 300 - 3.6 * sc, 740, 300 - 3.6 * sc, 'ink', 1.5, dashed('5 4')) + label(740, 300 - 3.6 * sc - 8, 'enough to break a typical chemical bond (≈ 3.6 eV): UV and beyond', { anchor: 'end', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'h']], say: 'h: Planck’s constant, a tiny number that sets the size of a light packet.' },
        { parts: [[3, 'f']], color: 'b', say: 'f: higher frequency, more energy in every single photon.' },
        { parts: [[0, 'E'], [1, ' = ']], color: 'c', say: 'E =: that’s why UV burns skin and visible light doesn’t, however bright: each UV photon is energetic enough to break molecules.' },
      ],
      vary: [{ key: 'f', amp: 5e14, min: 1e14, max: 1.2e15, label: 'f', color: 'b', say: 'Vary the frequency: from infrared to ultraviolet, the energy per photon climbs past the bond-breaking line.' }],
    }),
    'Energy and wavelength': play({
      own: true, values: { nm: 500 },
      intro: 'Combine E = hf with c = λf.',
      scene: ({ nm }, h, k, u) => {
        const E = 1240 / nm;
        let s = '';
        for (let w = 380; w < 750; w += 5) s += S.rect(100 + (w - 380) * 1.6, 300, 8.5, 30, MV.phys.spectral(w), null);
        s += S.poly([[100 + (Math.max(380, Math.min(749, nm)) - 380) * 1.6, 296], [94 + (Math.max(380, Math.min(749, nm)) - 380) * 1.6, 280], [106 + (Math.max(380, Math.min(749, nm)) - 380) * 1.6, 280]], 'ink', null);
        s += work(100, 110, [['f = c/λ', u(0), 'b'], ['E = hf = hc/λ', u(1)], [`hc ≈ 1240 eV·nm, so E = 1240 ÷ ${fmt(nm, 0)} = ${fmt(E, 2)} eV`, u(2), 'c']]);
        return s;
      },
      pieces: [
        { parts: [[2, 'hc']], say: 'hc: substitute f = c/λ into E = hf.' },
        { parts: [[3, '/λ']], color: 'a', say: '/λ: the energy is inversely proportional to the wavelength.' },
        { parts: [[0, 'E'], [1, ' = ']], color: 'c', say: 'E =: violet photons (400 nm) carry nearly twice the energy of red ones (700 nm).' },
      ],
      vary: [{ key: 'nm', amp: 170, min: 380, max: 749, label: 'λ (nm)', color: 'a', say: 'Sweep across the rainbow: the energy falls as the wavelength grows.' }],
    }),
  });
})();
