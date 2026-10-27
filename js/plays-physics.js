// "Show formula" plays for PhysVis. Each uses its own example numbers (`own: true`), so it reads the same
// whichever example the topic is showing. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, seg, lerp, lerpPt, clamp01, dashed, drawOn, numberLine } = MV;
  const { play, label, iso, reg } = MV.playKit;

  const NL12 = () => numberLine(0, 12, 260, 80, 720);
  const box = (cx, y, w, h, color = 'b', text) => S.rect(cx - w / 2, y - h, w, h, `${color}-soft`, color, { rx: 5, 'stroke-width': 2 }) + (text ? label(cx, y - h / 2 + 5, text, { fill: color, size: 13, weight: 600 }) : '');
  const arrowL = (x1, y, x2, color, text, w = 4) => (Math.abs(x2 - x1) < 1 ? '' : S.arrow(x1, y, x2, y, color, w)) + (text ? label((x1 + x2) / 2, y - 12, text, { fill: color, weight: 600, size: 13 }) : '');
  const figure = (x, y, color, k = 1) => S.line(x, y - 22 * k, x - 9 * k, y, color, 3.5) + S.line(x, y - 22 * k, x + 9 * k, y, color, 3.5) + S.line(x, y - 22 * k, x, y - 42 * k, color, 4) + S.line(x - 12 * k, y - 34 * k, x + 12 * k, y - 34 * k, color, 3) + S.circle(x, y - 51 * k, 8 * k, color);

  // =====================================================================
  // Operations
  // =====================================================================

  reg('p-add', {
    Total: play({
      own: true, values: { x1: 3, x2: 4 },
      intro: 'Two moves along a line, measured in metres.',
      backdrop: () => NL12().svg + label(720, 310, 'metres', { fill: 'muted', size: 11, anchor: 'end' }),
      pieces: [
        { parts: [[1, 'x₁']], color: 'a', say: ({ x1 }) => `x₁: the first move, ${fmt(x1)} m.`, draw: ({ x1 }, u) => { const { X } = NL12(); return arrowL(X(0), 200, X(x1 * u), 'a', u >= 1 ? `${fmt(x1)} m` : ''); } },
        { parts: [[2, ' + x₂']], color: 'b', say: ({ x2 }) => `+ x₂: the second move, ${fmt(x2)} m, starting where the first ended.`, draw: ({ x1, x2 }, u) => { const { X } = NL12(); return arrowL(X(x1), 150, X(x1 + x2 * u), 'b', u >= 1 ? `${fmt(x2)} m` : ''); } },
        { parts: [[0, 'x = ']], say: ({ x1, x2 }) => `x =: the total, ${fmt(x1 + x2)} m. Same kind of quantity, same unit, so the sizes simply add.`, draw: ({ x1, x2 }, u) => { const { X } = NL12(); return arrowL(X(0), 330, X((x1 + x2) * u), 'ink', u >= 1 ? `x = ${fmt(x1 + x2)} m` : '', 4.5); } },
      ],
      vary: [{ key: 'x2', amp: 3, min: 0.5, label: 'x₂', color: 'b', say: 'Vary the second move: the total changes by exactly the same amount.' }],
    }),
    'Net force': play({
      own: true, values: { F1: 5, F2: -2 },
      intro: 'A box with two forces on it. Right is positive.',
      backdrop: () => S.line(120, 320, 680, 320, 'grid2', 1.5) + box(400, 320, 90, 70, 'ink', 'box'),
      pieces: [
        { parts: [[1, 'F₁']], color: 'a', say: ({ F1 }) => `F₁: a push of ${fmt(F1)} N.`, draw: ({ F1 }, u) => arrowL(455, 250, 455 + F1 * 24 * u, 'a', `${fmt(F1)} N`) },
        { parts: [[2, ' + F₂']], color: 'b', say: ({ F2 }) => `+ F₂: a second force of ${fmt(F2)} N${F2 < 0 ? ', pointing left' : ''}. Add it with its sign.`, draw: ({ F2 }, u) => arrowL(345, 290, 345 + F2 * 24 * u, 'b', `${fmt(F2)} N`) },
        { parts: [[0, 'F_net = ']], say: ({ F1, F2 }) => `F_net: the total, ${fmt(F1 + F2)} N. Only this net force changes the box’s motion.`, draw: ({ F1, F2 }, u) => arrowL(400, 180, 400 + (F1 + F2) * 24 * u, 'ink', `net ${fmt(F1 + F2)} N`, 5) },
      ],
      vary: [{ key: 'F2', amp: 7, label: 'F₂', color: 'b', say: 'Vary F₂: when it points against F₁ it cancels part of it; equal and opposite, and the net is zero.' }],
    }),
    Velocities: play({
      own: true, values: { vw: 1.5, vb: 1 },
      intro: 'Someone walking on a moving walkway.',
      backdrop: () => S.rect(100, 300, 600, 16, 'ink-soft', 'grid2', { rx: 8 }) + figure(300, 300, 'ink'),
      pieces: [
        { parts: [[1, 'v_walk']], color: 'a', say: ({ vw }) => `v_walk: their walking speed, ${fmt(vw)} m/s, relative to the belt.`, draw: ({ vw }, u) => arrowL(300, 200, 300 + vw * 80 * u, 'a', `${fmt(vw)} m/s`) },
        { parts: [[2, ' + v_belt']], color: 'b', say: ({ vb }) => `+ v_belt: the belt itself carries them ${fmt(vb)} m/s.`, draw: ({ vw, vb }, u) => arrowL(300 + vw * 80, 200, 300 + (vw + vb * u) * 80, 'b', `${fmt(vb)} m/s`) },
        { parts: [[0, 'v_ground = ']], say: ({ vw, vb }) => `v_ground: relative to the ground they move at ${fmt(vw + vb)} m/s.`, draw: ({ vw, vb }, u) => arrowL(300, 150, 300 + (vw + vb) * 80 * u, 'ink', `${fmt(vw + vb)} m/s over the ground`, 5) },
      ],
      vary: [{ key: 'vb', amp: 2.5, label: 'v_belt', color: 'b', say: 'Vary the belt: running backwards, it cancels some of the walking speed.' }],
    }),
    Superposition: play({
      own: true, values: { A1: 2, A2: 1.5 },
      intro: 'Two overlapping bumps, like two ripples on water.',
      backdrop: () => S.line(70, 300, 730, 300, 'grid2', 1.5),
      scene: ({ A1, A2 }, h, k, u) => {
        const X = (x) => 70 + x * 66, Y = (v) => 300 - v * 45;
        const g1 = (x) => A1 * Math.exp(-((x - 4) ** 2) / 1.2), g2 = (x) => A2 * Math.exp(-((x - 6) ** 2) / 1.2);
        const path = (f) => Array.from({ length: 101 }, (_, i) => { const x = i / 10; return `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`; }).join(' ');
        let s = S.path(path(g1), 'a', 2.5, { ...drawOn(u(0)), ...(u(2) > 0 ? dashed('5 4') : {}) }) + S.path(path(g2), 'b', 2.5, { ...drawOn(u(1)), ...(u(2) > 0 ? dashed('5 4') : {}) });
        for (let i = 0; i <= 20; i++) {
          const x = i / 2, ui = clamp01(u(2) * 20 - i);
          if (ui > 0) s += S.line(X(x), Y(0), X(x), Y(g1(x) * ui), 'a', 3, { opacity: 0.6 }) + S.line(X(x), Y(g1(x) * ui), X(x), Y((g1(x) + g2(x)) * ui), 'b', 3, { opacity: 0.6 });
        }
        if (u(2) >= 1) s += S.path(path((x) => g1(x) + g2(x)), 'ink', 3.5);
        return s;
      },
      pieces: [
        { parts: [[1, 'y₁']], color: 'a', say: 'y₁: the first bump.' },
        { parts: [[2, ' + y₂']], color: 'b', say: '+ y₂: a second bump, overlapping it.' },
        { parts: [[0, 'y = ']], say: 'y =: at every point, stack one height on the other. The result is their sum: superposition.' },
      ],
      vary: [{ key: 'A2', amp: 3, label: 'height of y₂', color: 'b', say: 'Vary the second bump: turn it upside down and it cancels part of the first.' }],
    }),
  });

  reg('p-sub', {
    Change: play({
      own: true, values: { x1: 2, x2: 7 },
      intro: 'Something moves along a line.',
      backdrop: () => NL12().svg,
      pieces: [
        { parts: [[2, ' − x₁']], color: 'b', say: ({ x1 }) => `x₁: where it started, ${fmt(x1)} m.`, draw: ({ x1 }, u) => { const { X } = NL12(); return S.fade(u, S.circle(X(x1), 260, 9, 'b') + label(X(x1), 234, 'start', { fill: 'b', weight: 600 })); } },
        { parts: [[1, 'x₂']], color: 'a', say: ({ x2 }) => `x₂: where it ended, ${fmt(x2)} m.`, draw: ({ x2 }, u) => { const { X } = NL12(); return S.fade(u, S.circle(X(x2), 260, 9, 'a') + label(X(x2), 234, 'end', { fill: 'a', weight: 600 })); } },
        { parts: [[0, 'Δx = ']], say: ({ x1, x2 }) => `Δx =: end minus start, ${fmt(x2 - x1)} m. The sign says which way it went.`, draw: ({ x1, x2 }, u) => { const { X } = NL12(); return arrowL(X(x1), 330, X(x1 + (x2 - x1) * u), 'ink', u >= 1 ? `Δx = ${fmt(x2 - x1)} m` : '', 4.5); } },
      ],
      vary: [{ key: 'x2', amp: 4, min: 0, max: 12, label: 'x₂', color: 'a', say: 'Vary the end: when it finishes behind the start, the change is negative.' }],
    }),
    'Relative velocity': play({
      own: true, values: { vA: 30, vB: 22 },
      intro: 'Car A behind truck B on a road, both moving right.',
      backdrop: () => S.line(80, 300, 720, 300, 'grid2', 1.5) + S.rect(150, 270, 50, 22, 'a', null, { rx: 4 }) + S.rect(470, 252, 80, 40, 'b', null, { rx: 4 }) + label(175, 316, 'A', { fill: 'a' }) + label(510, 316, 'B', { fill: 'b' }),
      pieces: [
        { parts: [[1, 'v_A']], color: 'a', say: ({ vA }) => `v_A: car A moves at ${fmt(vA)} m/s.`, draw: ({ vA }, u) => arrowL(200, 230, 200 + vA * 6 * u, 'a', `${fmt(vA)} m/s`) },
        { parts: [[2, ' − v_B']], color: 'b', say: ({ vB }) => `− v_B: truck B moves at ${fmt(vB)} m/s. Ride along with B: subtract its speed from everything.`, draw: ({ vB }, u) => arrowL(550, 210, 550 + vB * 6 * u, 'b', `${fmt(vB)} m/s`) },
        { parts: [[0, 'v_AB = ']], say: ({ vA, vB }) => `v_AB: seen from B, A approaches at only ${fmt(vA - vB)} m/s.`, draw: ({ vA, vB }, u) => arrowL(200, 170, 200 + (vA - vB) * 6 * u, 'ink', `${fmt(vA - vB)} m/s, seen from B`, 5) },
      ],
      vary: [{ key: 'vB', amp: 14, min: 0, label: 'v_B', color: 'b', say: 'Vary B’s speed: if B goes faster than A, the relative velocity turns negative and A falls behind.' }],
    }),
    'Net of opposing pulls': play({
      own: true, values: { F1: 6, F2: 4 },
      intro: 'A rope pulled from both ends.',
      backdrop: () => S.line(160, 260, 640, 260, 'ink', 3) + S.rect(394, 250, 12, 20, 'c', null, { rx: 3 }),
      pieces: [
        { parts: [[1, 'F₁']], color: 'a', say: ({ F1 }) => `F₁: ${fmt(F1)} N pulling right.`, draw: ({ F1 }, u) => arrowL(640, 260, 640 + F1 * 14 * u, 'a', `${fmt(F1)} N`) },
        { parts: [[2, ' − F₂']], color: 'b', say: ({ F2 }) => `− F₂: ${fmt(F2)} N pulling left, against it.`, draw: ({ F2 }, u) => arrowL(160, 260, 160 - F2 * 14 * u, 'b', `${fmt(F2)} N`) },
        { parts: [[0, 'F_net = ']], say: ({ F1, F2 }) => `F_net: what’s left over, ${fmt(F1 - F2)} N, moves the rope.`, draw: ({ F1, F2 }, u) => arrowL(400, 200, 400 + (F1 - F2) * 20 * u, 'ink', `net ${fmt(F1 - F2)} N`, 5) },
      ],
      vary: [{ key: 'F2', amp: 4, min: 0, label: 'F₂', color: 'b', say: 'Vary F₂: when the two pulls are equal, the net is zero and nothing moves.' }],
    }),
  });

  const vt = (vmax = 11, tmax = 6.3) => { const X = (t) => 110 + t * (600 / tmax), Y = (v) => 370 - v * (270 / vmax); return { X, Y, axes: S.line(X(0), Y(0), X(tmax), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(vmax), 'grid2', 1.5) + label(X(tmax), Y(0) + 22, 'time (s)', { fill: 'muted', size: 12, anchor: 'end' }) + label(X(0) + 6, Y(vmax), 'speed (m/s)', { fill: 'muted', size: 12, anchor: 'start' }) }; };

  reg('p-mul', {
    Proportionality: play({
      own: true, values: { kk: 1.5, x: 2 },
      intro: 'One quantity that is always k times another.',
      scene: ({ kk, x }, h, k, u) => {
        const X = (v) => 120 + v * 70, Y = (v) => 370 - v * 26;
        let s = S.line(X(0), Y(0), X(8), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(11), 'grid2', 1.5);
        s += S.fade(u(0), S.circle(X(x), Y(0), 6, 'a') + label(X(x), Y(0) + 22, `x = ${fmt(x)}`, { fill: 'a' }));
        s += S.line(X(0), Y(0), X(lerp(0, 8, u(1))), Y(kk * lerp(0, 8, u(1))), 'ink', 3);
        s += S.fade(u(2), S.line(X(x), Y(0), X(x), Y(kk * x), 'a', 2, dashed('3 4')) + S.circle(X(x), Y(kk * x), 6, 'a') + label(X(x) + 8, Y(kk * x) - 8, `y = ${fmt(kk * x)}`, { fill: 'a', anchor: 'start' }) +
          S.line(X(2 * x), Y(0), X(2 * x), Y(2 * kk * x), 'b', 2, dashed('3 4')) + S.circle(X(2 * x), Y(2 * kk * x), 6, 'b') + label(X(2 * x) + 8, Y(2 * kk * x) - 8, `double x: y = ${fmt(2 * kk * x)}`, { fill: 'b', anchor: 'start' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'x']], color: 'a', say: 'x: the input.' },
        { parts: [[1, 'k']], say: 'k: multiply by a fixed number k. The graph is a straight line through 0.' },
        { parts: [[0, 'y = ']], say: 'y =: double x and y doubles; triple x and y triples. That’s proportionality.' },
      ],
      vary: [{ key: 'kk', amp: 0.8, min: 0.3, label: 'k', color: 'c', say: 'Vary k: the line gets steeper, but doubling still doubles.' }],
    }),
    Distance: play({
      own: true, values: { v: 4, t: 5 },
      intro: 'A speed against time graph, for something moving steadily.',
      backdrop: () => vt().axes,
      pieces: [
        { parts: [[1, 'v']], color: 'a', say: ({ v }) => `v: a steady ${fmt(v)} m/s, a flat line.`, draw: ({ v }, u) => { const { X, Y } = vt(); return S.line(X(0), Y(v), X(6 * u), Y(v), 'a', 3.5); } },
        { parts: [[2, ' × t']], color: 'b', say: ({ v, t }) => `× t: keep it up for ${fmt(t)} s. Each second adds another ${fmt(v)} m strip.`, draw: ({ v, t }, u) => { const { X, Y } = vt(); let s = S.rect(X(0), Y(v), X(t * u) - X(0), Y(0) - Y(v), 'b-soft', null); for (let i = 1; i < t * u; i++) s += S.line(X(i), Y(0), X(i), Y(v), 'b', 1, { opacity: 0.5 }); return s; } },
        { parts: [[0, 'd = ']], say: ({ v, t }) => `d =: all the strips together, ${fmt(v)} × ${fmt(t)} = ${fmt(v * t)} m.`, draw: ({ v, t }, u) => { const { X, Y } = vt(); return S.fade(u, S.rect(X(0), Y(v), X(t) - X(0), Y(0) - Y(v), null, 'ink', { 'stroke-width': 2 }) + label(X(t / 2), Y(v / 2) + 6, `d = ${fmt(v * t)} m`, { size: 17, weight: 600 })); } },
      ],
      vary: [{ key: 'v', amp: 3, min: 0.5, label: 'v', color: 'a', say: 'Vary the speed: every strip gets taller, and the distance grows in step.' }],
    }),
    Spring: play({
      own: true, values: { kk: 4, x: 1.5 },
      intro: 'A block on a spring, at rest in the middle.',
      scene: ({ kk, x }, h, k, u) => {
        const wall = 90, rest = 340, sc = 70, bx = rest + x * sc * u(0), y = 230;
        let d = `M${wall} ${y}`;
        for (let i = 1; i < 24; i++) d += ` L${(wall + ((bx - wall) * i) / 24).toFixed(1)} ${y + (i % 2 ? -14 : 14)}`;
        let s = S.rect(wall - 16, y - 70, 16, 140, 'ink-soft', null) + S.path(d + ` L${bx} ${y}`, 'a', 2) + S.rect(bx, y - 30, 60, 60, 'b-soft', 'b', { rx: 4 }) + S.line(rest + 30, y - 60, rest + 30, y + 40, 'muted', 1, dashed('3 4'));
        s += S.fade(u(0), label(rest + 30, y + 60, `stretch x = ${fmt(x)}`, { fill: 'c' }));
        s += S.fade(u(1), arrowL(bx + 30, y - 48, bx + 30 - kk * x * 14 * u(1), 'ink', `pull ${fmt(-kk * x)} N`));
        s += S.fade(u(2), label(620, 120, `F = −${fmt(kk)} × ${fmt(x)} = ${fmt(-kk * x)} N`, { weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'x']], color: 'c', say: 'x: pull the block out a distance x.' },
        { parts: [[1, '−'], [2, 'k']], say: '−k: the spring pulls back, k newtons for every metre of stretch, against the stretch (the minus).' },
        { parts: [[0, 'F = ']], say: 'F =: twice the stretch, twice the pull.' },
      ],
      vary: [{ key: 'x', amp: 2.2, label: 'x', color: 'c', say: 'Vary the stretch: squash the spring and the force flips to push outward.' }],
    }),
    Units: play({
      own: true,
      intro: 'Units multiply like numbers.',
      scene: (q, h, k, u) => {
        let s = S.fade(u(0), S.line(120, 330, 120 + 3 * 60, 330, 'a', 5) + label(210, 354, '3 m', { fill: 'a', weight: 600 }));
        s += S.fade(u(1), S.line(120, 330, 120, 330 - 2 * 60, 'b', 5) + label(100, 270, '2 m', { fill: 'b', anchor: 'end', weight: 600 }));
        s += S.fade(u(2), S.rect(120, 210, 180, 120, 'c-soft', 'c', { 'stroke-width': 2 }) + label(210, 276, '3 m × 2 m = 6 m²', { fill: 'c', weight: 600 }) + label(560, 180, 'm/s × s = m', { weight: 600, size: 18 }) + label(560, 214, 'N × m = N·m', { weight: 600, size: 18 }) + label(560, 248, 'kg × m/s² = N', { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[1, '[a]']], color: 'a', say: '[a]: a length in metres.' },
        { parts: [[2, '[b]']], color: 'b', say: '[b]: another length in metres.' },
        { parts: [[0, '[ab] = ']], color: 'c', say: 'Multiply the quantities and you multiply their units too: metres × metres = square metres, an area. The unit tells you what kind of thing the answer is.' },
      ],
    }),
  });

  reg('p-div', {
    Rate: play({
      own: true, values: { amt: 12, per: 3 },
      intro: 'A tank fills with 12 litres over 3 minutes.',
      scene: ({ amt, per }, h, k, u) => {
        const unit = 40, x0 = 400 - (amt * unit) / 2 / 1.2;
        let s = S.rect(x0, 160, amt * (unit / 1.2) * u(0), 40, 'a-soft', 'a', { rx: 4 }) + S.fade(u(0), label(400, 150, `${fmt(amt)} litres`, { fill: 'a', weight: 600 }));
        for (let i = 0; i < per; i++) s += S.fade(clamp01(u(1) * per - i), S.rect(x0 + (i * amt * (unit / 1.2)) / per + 2, 220, (amt * (unit / 1.2)) / per - 4, 40, 'b-soft', 'b', { rx: 4 }) + label(x0 + ((i + 0.5) * amt * (unit / 1.2)) / per, 245, `minute ${i + 1}`, { fill: 'b', size: 12 }));
        s += S.fade(u(2), label(400, 310, `${fmt(amt)} ÷ ${fmt(per)} = ${fmt(amt / per)} litres per minute`, { size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'amount']], color: 'a', say: 'amount: the total, 12 litres.' },
        { parts: [[3, ' / unit']], color: 'b', say: '/ unit: share it over the 3 minutes it took.' },
        { parts: [[0, 'rate'], [1, ' = ']], say: 'rate: how much in each one minute. “Per” always means “divided by”.' },
      ],
      vary: [{ key: 'per', amp: 1.5, min: 1, label: 'minutes', color: 'b', say: 'Vary the time: the same amount over more minutes is a slower rate.' }],
    }),
    Acceleration: play({
      own: true, values: { F: 12, m: 3 },
      intro: 'The same push on different masses.',
      scene: ({ F, m }, h, k, u) => {
        const side = 30 + m * 10;
        let s = S.line(120, 330, 680, 330, 'grid2', 1.5) + box(300, 330, side, side, 'b', `${fmt(m)} kg`);
        s += S.fade(u(0), arrowL(300 - side / 2 - 10 - F * 5, 330 - side / 2, 300 - side / 2 - 4, 'a', `${fmt(F)} N`));
        s += S.fade(u(1), label(560, 160, `mass ${fmt(m)} kg`, { fill: 'b', anchor: 'start' }));
        s += S.fade(u(2), arrowL(300, 330 - side - 30, 300 + (F / m) * 22, 'ink', `a = ${fmt(F / m)} m/s²`, 5));
        return s;
      },
      pieces: [
        { parts: [[1, 'F']], color: 'a', say: 'F: a push of 12 N.' },
        { parts: [[2, '/m']], color: 'b', say: '/m: on a block of mass m.' },
        { parts: [[0, 'a = ']], say: 'a =: the acceleration is the push shared over the mass.' },
      ],
      vary: [{ key: 'm', amp: 2.5, min: 0.5, label: 'm', color: 'b', say: 'Vary the mass: a heavier block gets less acceleration from the same push. Double the mass, half the acceleration.' }],
    }),
    Density: play({
      own: true,
      intro: 'A 12 kg block that takes up 4 litres.',
      pieces: [
        { parts: [[1, 'm']], color: 'a', say: 'm: 12 kg of mass, all in one pile.', draw: (q, u, U) => { let s = ''; const go = U(1); for (let i = 0; i < Math.ceil(12 * u - 1e-9); i++) { const pile = [328 + (i % 6) * 24, 110 + Math.floor(i / 6) * 24]; const tgt = [190 + (i % 4) * 140 + Math.floor(i / 4) * 22, 300]; s += S.circle(...lerpPt(pile, tgt, MV.ease(clamp01(go * 1.6 - i * 0.05))), 8, 'a'); } return s; } },
        { parts: [[2, ' / V']], color: 'b', say: '/ V: share it out evenly over the 4 litres.', draw: (q, u) => { let s = ''; for (let i = 0; i < 4; i++) s += S.fade(Math.min(1, u * 2), S.rect(160 + i * 140, 260, 110, 80, null, 'b', { rx: 6, 'stroke-width': 2 }) + label(215 + i * 140, 360, '1 litre', { fill: 'b', size: 12 })); return s; } },
        { parts: [[0, 'ρ = ']], say: 'ρ =: each litre holds 3 kg. That’s the density, 3 kg per litre.', draw: (q, u) => S.fade(u, label(400, 400, 'ρ = 12 ÷ 4 = 3 kg per litre', { size: 18, weight: 600 })) },
      ],
    }),
    'Inverse proportion': play({
      own: true, values: { kk: 12, x: 3 },
      intro: 'A fixed area k = 12, shaped into rectangles.',
      scene: ({ kk, x }, h, k, u) => {
        const sc = 26, base = 370, x0 = 120, hgt = kk / x;
        let s = S.line(x0, base, 720, base, 'grid2', 1.5) + S.line(x0, base, x0, 70, 'grid2', 1.5);
        s += S.fade(u(0), S.line(x0, base + 14, x0 + x * sc, base + 14, 'a', 4) + label(x0 + (x * sc) / 2, base + 34, `x = ${fmt(x)}`, { fill: 'a' }));
        s += S.fade(u(1), S.rect(x0, base - hgt * sc, x * sc, hgt * sc, 'c-soft', 'c', { 'stroke-width': 2 }) + label(x0 + (x * sc) / 2, base - (hgt * sc) / 2, `area ${fmt(kk)}`, { fill: 'c', weight: 600 }));
        s += S.fade(u(2), S.circle(x0 + x * sc, base - hgt * sc, 6, 'ink') + label(x0 + x * sc + 10, base - hgt * sc - 8, `y = ${fmt(hgt)}`, { anchor: 'start', weight: 600 }) +
          S.path(Array.from({ length: 60 }, (_, i) => { const xx = 0.6 + i * 0.35; return `${i ? 'L' : 'M'}${(x0 + xx * sc).toFixed(1)} ${(base - Math.min(12, kk / xx) * sc).toFixed(1)}`; }).join(' '), 'ink', 1.5, { opacity: 0.5 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'x']], color: 'a', say: 'x: the width of the rectangle.' },
        { parts: [[1, 'k / ']], color: 'c', say: 'k /: the area is fixed at k, so the height must be k ÷ x.' },
        { parts: [[0, 'y = ']], say: 'y =: wider means flatter. Double x and y halves. That’s inverse proportion.' },
      ],
      vary: [{ key: 'x', amp: 2.2, min: 1, label: 'x', color: 'a', say: 'Vary x: the rectangle trades width for height, always keeping the same area. Its corner traces the curve.' }],
    }),
  });

  // Free fall, built from a real drop: speed grows steadily, average speed is half the final speed,
  // and distance = average speed × time.
  const fallScene = ({ g, t }, h, k, u) => {
    const col = 220, top = 70, Dmax = 0.5 * g * 4.6 * 4.6, sc = 300 / Dmax;
    const tt = t * u(0), d = 0.5 * g * tt * tt, v = g * tt;
    let s = S.line(col - 40, top - 10, col + 40, top - 10, 'ink', 3) + S.line(col, top, col, top + 300, 'grid', 1, dashed('3 5'));
    for (let n = 1; n <= Math.floor(tt + 1e-9); n++) {
      const dn = 0.5 * g * n * n;
      s += S.circle(col, top + dn * sc, 10, null, 'grid2', { 'stroke-width': 1.5 }) + label(col - 24, top + dn * sc + 4, `${n} s`, { fill: 'muted', size: 11, anchor: 'end' });
    }
    s += S.circle(col, top + d * sc, 12, 'a');
    s += label(col - 50, top - 6, `t = ${fmt(tt, 1)} s`, { anchor: 'end', weight: 600 });
    // Speed bar on the right: grows g every second.
    const bx = 480, by = 370, vs = 260 / (g * 4.6);
    s += S.line(bx - 20, by, bx + 220, by, 'grid2', 1.5) + label(bx + 30, by + 20, 'speed', { fill: 'muted', size: 12 });
    s += S.rect(bx, by - v * vs, 60, v * vs, 'a-soft', 'a', { 'stroke-width': 1.5 });
    for (let n = 1; n <= Math.floor(tt + 1e-9); n++) s += S.line(bx, by - g * n * vs, bx + 60, by - g * n * vs, 'a', 1, { opacity: 0.5 }) + label(bx - 6, by - g * n * vs + 4, `+${fmt(g)}`, { fill: 'a', size: 10, anchor: 'end' });
    s += S.fade(u(1), label(bx + 30, by - v * vs - 10, `v = gt = ${fmt(g * t, 1)} m/s`, { fill: 'a', weight: 600, size: 13 }));
    // Average speed: halfway between 0 and gt.
    s += S.fade(u(2), S.rect(bx + 90, by - (v / 2) * vs, 60, (v / 2) * vs, 'c-soft', 'c', { 'stroke-width': 1.5 }) + S.line(bx, by - (v / 2) * vs, bx + 150, by - (v / 2) * vs, 'c', 1.5, dashed('4 4')) + label(bx + 120, by - (v / 2) * vs - 10, `average ½gt = ${fmt(v / 2, 1)}`, { fill: 'c', weight: 600, size: 12 }));
    // Distance: average speed × time.
    s += S.fade(u(3), S.line(col + 34, top, col + 34, top + d * sc, 'ink', 2.5) + label(col + 44, top + (d * sc) / 2, `d = ${fmt(v / 2, 1)} × ${fmt(t, 1)} = ${fmt(d, 1)} m`, { anchor: 'start', weight: 600 }));
    return s;
  };
  reg('p-pow', {
    Scaling: play({
      own: true,
      intro: 'Double the size of a line, a square and a cube.',
      scene: (q, h, k, u) => {
        const L = 40;
        let s = S.fade(u(0), S.line(100, 160, 100 + L, 160, 'ink', 6) + S.line(200, 160, 200 + 2 * L, 160, 'a', 6) + label(320, 166, 'length × 2', { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(1), S.rect(100, 270 - L, L, L, 'ink-soft', 'ink', { 'stroke-width': 1.5 }) + [0, 1, 2, 3].map((i) => S.rect(200 + (i % 2) * L, 270 - 2 * L + Math.floor(i / 2) * L, L, L, 'b-soft', 'b', { 'stroke-width': 1.5, opacity: clamp01(u(1) * 4 - i) })).join('') + label(320, 250, 'area × 4 = 2²', { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.fade(u(2), iso(470, 370, L, L, L, 'ink-soft', 'ink') + iso(580, 370, 2 * L, 2 * L, 2 * L, 'c-soft', 'c') + label(620, 250, 'volume × 8 = 2³', { fill: 'c', anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'y ∝ x']], color: 'a', say: 'Power 1: a length doubles when the size doubles.' },
        { parts: [[1, 'ⁿ']], color: 'b', say: 'Power 2: an area quadruples: 2 × 2.' },
        { parts: [], color: 'c', say: 'Power 3: a volume goes up 8 times: 2 × 2 × 2. The power says how strongly the quantity responds to size.' },
      ],
    }),
    Doubling: play({
      own: true, values: { x: 1.5, n: 2 },
      intro: 'y = xⁿ, with n = 2.',
      scene: ({ x, n }, h, k, u) => {
        const X = (v) => 110 + v * 75, Y = (v) => 370 - v * 9;
        let s = S.line(X(0), Y(0), X(7), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(32), 'grid2', 1.5);
        s += S.path(Array.from({ length: 80 }, (_, i) => { const v = (i / 79) * 5.6; return `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(v ** n).toFixed(1)}`; }).join(' '), 'grid2', 2);
        s += S.fade(u(0), S.circle(X(x), Y(x ** n), 7, 'a') + S.line(X(x), Y(0), X(x), Y(x ** n), 'a', 2, dashed('3 4')) + label(X(x) + 10, Y(x ** n) - 8, `y(x) = ${fmt(x ** n)}`, { fill: 'a', anchor: 'start' }));
        s += S.fade(u(1), S.circle(X(2 * x), Y((2 * x) ** n), 7, 'b') + S.line(X(2 * x), Y(0), X(2 * x), Y((2 * x) ** n), 'b', 2, dashed('3 4')) + label(X(2 * x) + 10, Y((2 * x) ** n) - 8, `y(2x) = ${fmt((2 * x) ** n)}`, { fill: 'b', anchor: 'start' }));
        s += S.fade(u(2), label(620, 120, `${fmt((2 * x) ** n)} ÷ ${fmt(x ** n)} = ${fmt(2 ** n)} = 2²`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'y(x)']], color: 'a', say: 'y(x): the output at some x.' },
        { parts: [[0, 'y(2x)']], color: 'b', say: 'y(2x): the output at double that x.' },
        { parts: [[1, ' = 2ⁿ ']], say: '= 2ⁿ ×: the ratio is always 2ⁿ, wherever you start.' },
      ],
      vary: [{ key: 'x', amp: 1, min: 0.5, label: 'x', color: 'a', say: 'Vary x: both points move, and the ratio stays exactly 4.' }],
    }),
    'Free fall': play({
      own: true, values: { g: 9.8, t: 3 },
      intro: 'Drop a ball and start a stopwatch.',
      scene: fallScene,
      pieces: [
        { parts: [[2, 'g']], color: 'a', say: ({ g }) => `g: falling, the ball gains speed steadily: ${fmt(g)} m/s more every second.` },
        { parts: [[3, 't']], color: 'a', say: ({ g, t }) => `t: after t = ${fmt(t)} s its speed is g × t = ${fmt(g * t, 1)} m/s.` },
        { parts: [[1, '½ ']], color: 'c', say: 'It started at 0 and grew evenly to g t, so on average it was going half that fast: ½ g t.' },
        { parts: [[0, 'd = '], [4, '²']], say: ({ g, t }) => `d =: distance = average speed × time = ½ g t × t = ½ g t². Here ${fmt(0.5 * g * t * t, 1)} m.` },
      ],
      vary: [{ key: 't', amp: 1.5, min: 0.5, label: 't', color: 'a', say: 'Vary the time: twice as long means twice the average speed for twice the time, so four times the drop.' }],
    }),
    'Inverse square': play({
      own: true, values: { r: 2 },
      intro: 'Light from a small source, passing through a square window.',
      scene: ({ r }, h, k, u) => {
        const sx = 80, sy = 220, U = 120, half = 26;
        let s = S.circle(sx, sy, 10, 'b') + S.line(sx, sy, sx + 4.2 * U, sy - half * 4.2, 'grid2', 1, dashed('4 4')) + S.line(sx, sy, sx + 4.2 * U, sy + half * 4.2, 'grid2', 1, dashed('4 4'));
        s += S.fade(u(0), S.line(sx + U, sy - half, sx + U, sy + half, 'ink', 4) + label(sx + U, sy + half + 20, '1 tile at distance 1', { size: 12 }));
        s += S.fade(u(1), S.line(sx + r * U, sy - half * r, sx + r * U, sy + half * r, 'c', 4) + label(sx + r * U, sy + half * r + 20, `distance ${fmt(r)}`, { fill: 'c', size: 12 }));
        const box = 150, gx = 600, gy = 120, tile = box / 4, shown = r * tile;
        let f = S.rect(gx, gy, shown, shown, 'b', null, { opacity: Math.min(0.9, 0.85 / (r * r)) + 0.05 });
        for (let i = 0; i <= Math.ceil(r); i++) { const v = Math.min(shown, i * tile); f += S.line(gx + v, gy, gx + v, gy + shown, 'grid2', 1) + S.line(gx, gy + v, gx + shown, gy + v, 'grid2', 1); }
        s += S.fade(u(1), f);
        s += S.fade(u(2), label(gx, gy + shown + 24, `${fmt(r * r)} tiles share the light: each gets 1/${fmt(r * r)}`, { anchor: 'start', weight: 600, size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'I']], color: 'b', say: 'I: at distance 1 the light covers one tile.' },
        { parts: [[1, ' ∝ 1/']], color: 'c', say: 'Twice as far, the patch is twice as wide and twice as tall…' },
        { parts: [[2, 'r²']], say: '…so the same light is spread over r × r = r² tiles, and each gets 1/r² of it.' },
      ],
      vary: [{ key: 'r', amp: 1.5, min: 1, max: 4, label: 'r', color: 'c', say: 'Vary the distance: the lit patch grows with r², and each tile dims to match.' }],
    }),
    'Square–cube law': play({
      own: true, values: { L: 1 },
      intro: 'A cube, scaled up.',
      scene: ({ L }, h, k, u) => {
        const s0 = 50 * L;
        let s = iso(300 - s0 / 2, 330, s0, s0, s0, 'c-soft', 'c');
        s += S.fade(u(0), label(560, 160, `side × ${fmt(L)}`, { anchor: 'start', weight: 600 }));
        s += S.fade(u(1), label(560, 196, `surface × ${fmt(L * L)}  (L²)`, { anchor: 'start', fill: 'b', weight: 600 }));
        s += S.fade(u(2), label(560, 232, `volume and weight × ${fmt(L ** 3)}  (L³)`, { anchor: 'start', fill: 'c', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'scale L']], say: 'Scale every length by L.' },
        { parts: [[1, ':  A ∝ L²']], color: 'b', say: 'Areas, like the surface, grow as L².' },
        { parts: [[2, ',  V ∝ L³']], color: 'c', say: 'Volumes, and so weights, grow as L³: faster. That’s why big animals need thick legs.' },
      ],
      vary: [{ key: 'L', amp: 1, min: 0.5, label: 'L', color: 'c', say: 'Vary the scale: the volume races ahead of the surface.' }],
    }),
  });

  // =====================================================================
  // Newton's laws
  // =====================================================================

  const puck = (x, y, ghost) => (ghost ? S.rect(x - 22, y - 26, 44, 26, null, 'grid2', { rx: 8, 'stroke-width': 1.5 }) : S.rect(x - 22, y - 26, 44, 26, 'ink', null, { rx: 8 }));

  reg('n-first', {
    'First law': play({
      own: true,
      intro: 'A puck, already sliding to the right.',
      backdrop: () => S.line(60, 300, 740, 300, 'grid2', 1.5),
      pieces: [
        { parts: [[0, 'ΣF']], color: 'a', say: 'ΣF: add up every force on it. Here, two equal pushes in opposite directions.', draw: (q, u, U) => S.fade(1 - U(1), S.arrow(200, 260, 200 + 90 * u, 260, 'a', 4) + S.arrow(140, 260, 140 - 90 * u, 260, 'b', 4)) + puck(170, 300) },
        { parts: [[1, ' = 0']], say: '= 0: they cancel. The net force is zero.', draw: (q, u) => S.fade(u * (1 - seg(u, 0.7, 1)), label(170, 230, 'net force 0', { size: 15, weight: 600 })) },
        { parts: [[2, ' ⇒ Δv = 0']], color: 'c', say: '⇒ Δv = 0: so its velocity doesn’t change. Equal gaps, every half second, forever.', draw: (q, u) => { let s = ''; const steps = Math.floor(u * 8); for (let i = 1; i <= steps; i++) s += puck(170 + i * 64, 300, i < steps); return s; } },
      ],
    }),
    Momentum: play({
      own: true, values: { m: 2, v: 3 },
      intro: 'A sliding puck with no force on it.',
      scene: ({ m, v }, h, k, u) => {
        const w = 30 + m * 10;
        let s = S.line(60, 300, 740, 300, 'grid2', 1.5) + S.rect(200 - w / 2, 300 - 30, w, 30, 'b', null, { rx: 6 }) + label(200, 290, `${fmt(m)} kg`, { fill: 'paper', size: 12, weight: 600 });
        s += S.fade(u(1), arrowL(200, 240, 200 + v * 30, 'a', `${fmt(v)} m/s`));
        s += S.fade(u(2), S.rect(480, 200, m * v * 18, 22, 'c', null, { rx: 3 }) + label(480, 190, `p = ${fmt(m)} × ${fmt(v)} = ${fmt(m * v)} kg·m/s`, { anchor: 'start', fill: 'c', weight: 600 }) + label(480, 250, 'no force, so p never changes', { anchor: 'start', fill: 'muted', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'm']], color: 'b', say: 'm: the mass.' },
        { parts: [[3, 'v']], color: 'a', say: 'v: its velocity.' },
        { parts: [[0, 'p'], [1, ' = ']], color: 'c', say: 'p = mv: the momentum, “how much motion” it carries. With no net force it stays constant.' },
      ],
      vary: [{ key: 'v', amp: 2, label: 'v', color: 'a', say: 'Vary the speed: momentum grows in step with it.' }],
    }),
    'Balanced forces': play({
      own: true, values: { W: 20 },
      intro: 'A book resting on a table.',
      scene: ({ W }, h, k, u) => {
        let s = S.rect(200, 300, 400, 14, 'ink-soft', 'ink', { rx: 3 }) + S.rect(340, 260, 120, 40, 'b-soft', 'b', { rx: 4 }) + label(400, 286, 'book', { fill: 'b', size: 12 });
        s += S.fade(u(0), S.arrow(380, 280, 380, 280 + W * 4 * u(0), 'a', 4) + label(372, 290 + W * 2, `weight ${fmt(W)} N`, { fill: 'a', anchor: 'end', size: 12 }));
        s += S.fade(u(1), S.arrow(420, 280, 420, 280 - W * 4 * u(1), 'c', 4) + label(428, 270 - W * 2, `table pushes up ${fmt(W)} N`, { fill: 'c', anchor: 'start', size: 12 }));
        s += S.fade(u(2), label(400, 400, 'they add to zero: the book stays put', { weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'F₁']], color: 'a', say: 'F₁: gravity pulls the book down.' },
        { parts: [[1, ' + F₂']], color: 'c', say: '+ F₂: the table pushes up exactly as hard.' },
        { parts: [[2, ' + … = 0']], say: '= 0: the forces cancel, so the book’s motion doesn’t change: it stays at rest.' },
      ],
      vary: [{ key: 'W', amp: 10, min: 5, label: 'weight', color: 'a', say: 'Vary the weight: the table pushes back harder too, always matching it.' }],
    }),
  });

  reg('n-second', {
    'Second law': play({
      own: true,
      intro: 'A block of 3 kg, to be given an acceleration of 2 m/s².',
      backdrop: () => S.line(60, 330, 740, 330, 'grid2', 1.5),
      pieces: [
        { parts: [[1, 'm']], color: 'b', say: 'm: the mass, 3 kg: three 1 kg blocks.', draw: (q, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.fade(clamp01(u * 3 - i), S.rect(170 + i * 52, 278, 48, 50, 'b-soft', 'b', { rx: 4, 'stroke-width': 1.5 }) + label(194 + i * 52, 308, '1 kg', { fill: 'b', size: 12 })); return s; } },
        { parts: [[2, ' × a']], color: 'a', say: '× a: each kilogram needs 1 N for every 1 m/s² of acceleration: 2 N each to reach 2 m/s².', draw: (q, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.arrow(194 + i * 52 - 30, 250, 194 + i * 52 - 30 + 50 * u, 250, 'a', 3); return s + S.fade(u, label(220, 230, '2 N on each kilogram', { fill: 'a', size: 13 })); } },
        { parts: [[0, 'F = ']], say: 'F =: lay the three pushes end to end: one push of 3 × 2 = 6 N moves the whole block.', draw: (q, u) => { let s = ''; for (let i = 0; i < 3; i++) s += S.arrow(170 + i * 52, 380, 170 + i * 52 + 50 * u, 380, 'ink', 3.5); return s + S.fade(u, label(248, 410, 'F = 3 × 2 = 6 N', { size: 17, weight: 600 })); } },
      ],
    }),
    Acceleration: MV.plays['p-div'].Acceleration,
    'General form': play({
      own: true, values: { F: 4, dt: 3 },
      intro: 'Push a cart with a steady force for a few seconds.',
      scene: ({ F, dt }, h, k, u) => {
        const X = (t) => 140 + t * 120, Y = (p) => 360 - p * 14;
        let s = S.line(X(0), Y(0), X(4.5), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(18), 'grid2', 1.5) + label(X(4.5), Y(0) + 22, 'time (s)', { fill: 'muted', size: 12, anchor: 'end' }) + label(X(0) + 6, Y(18), 'momentum', { fill: 'muted', size: 12, anchor: 'start' });
        const t = dt * u(0);
        s += S.line(X(0), Y(0), X(t), Y(F * t), 'a', 3.5);
        for (let n = 1; n <= Math.floor(t + 1e-9); n++) s += S.line(X(n), Y(F * (n - 1)), X(n), Y(F * n), 'b', 3) + label(X(n) + 6, Y(F * (n - 0.5)), `+${fmt(F)}`, { fill: 'b', size: 11, anchor: 'start' });
        s += S.fade(u(1), label(600, 140, `Δp = ${fmt(F * dt)} over Δt = ${fmt(dt)} s`, { anchor: 'start' }));
        s += S.fade(u(2), label(600, 176, `F = ${fmt(F * dt)} ÷ ${fmt(dt)} = ${fmt(F)} N`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'Δp']], color: 'a', say: 'Δp: while the force acts, the cart’s momentum grows by the same amount every second.' },
        { parts: [[2, '/Δt']], color: 'b', say: '/Δt: divide the total change by the time it took…' },
        { parts: [[0, 'F = ']], say: 'F =: …and you get the force: force is the rate at which momentum changes.' },
      ],
      vary: [{ key: 'F', amp: 2, min: 1, label: 'F', color: 'b', say: 'Vary the force: a bigger force piles up momentum faster.' }],
    }),
    'Steady acceleration': play({
      own: true, values: { v0: 2, a: 3, t: 4 },
      intro: 'A cart already moving, then speeding up steadily.',
      scene: ({ v0, a, t }, h, k, u) => {
        const bx = 140, by = 370, vs = 18;
        let s = S.line(bx - 20, by, 720, by, 'grid2', 1.5);
        s += S.fade(u(0), S.rect(bx, by - v0 * vs, 60, v0 * vs, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(bx + 30, by + 20, 'start', { fill: 'muted', size: 12 }) + label(bx + 30, by - v0 * vs - 8, `v₀ = ${fmt(v0)}`, { fill: 'b', size: 12 }));
        for (let n = 1; n <= t; n++) {
          const o = clamp01(u(1) * t - (n - 1)), x = bx + n * 120;
          s += S.fade(o, S.rect(x, by - v0 * vs, 60, v0 * vs, 'b-soft', 'b', { 'stroke-width': 1.5 }) + S.rect(x, by - (v0 + a * n) * vs, 60, a * n * vs, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(x + 30, by + 20, `${n} s`, { fill: 'muted', size: 12 }) + label(x + 30, by - (v0 + a * n) * vs - 8, fmt(v0 + a * n), { size: 12 }));
        }
        s += S.fade(u(2), label(400, 90, `v = ${fmt(v0)} + ${fmt(a)} × ${fmt(t)} = ${fmt(v0 + a * t)} m/s`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[1, 'v₀']], color: 'b', say: 'v₀: the speed it starts with.' },
        { parts: [[2, ' + at']], color: 'a', say: '+ at: each second adds a more, so after t seconds it has gained a × t.' },
        { parts: [[0, 'v = ']], say: 'v =: the speed now: what it started with, plus what it gained.' },
      ],
      vary: [{ key: 'a', amp: 2, min: 0, label: 'a', color: 'a', say: 'Vary the acceleration: the blocks added each second grow or shrink.' }],
    }),
    'Apparent weight': play({
      own: true, values: { m: 70, a: 2, g: 9.8 },
      intro: 'You on a scale, in a lift that is speeding up.',
      scene: ({ m, a, g }, h, k, u) => {
        const cx = 260, floor = 340, f = 0.18;
        let s = S.rect(cx - 90, 80, 180, floor - 80, null, 'ink', { 'stroke-width': 2, rx: 6 }) + S.rect(cx - 30, floor - 10, 60, 10, 'ink-soft', 'ink') + figure(cx, floor - 10, 'ink', 1.2);
        s += S.fade(u(0), S.arrow(cx + 50, floor - 80, cx + 50, floor - 80 + m * g * f * 0.5, 'a', 3) + label(cx + 58, floor - 80 + m * g * f * 0.25, `mg = ${fmt(m * g, 0)} N`, { fill: 'a', anchor: 'start', size: 12 }));
        s += S.fade(u(1), S.arrow(cx - 60, floor - 10, cx - 60, floor - 10 - m * a * f * 0.5, 'b', 3) + label(560, 150, `extra to accelerate: ma = ${fmt(m * a, 0)} N`, { fill: 'b', anchor: 'start' }));
        s += S.fade(u(2), label(560, 190, `scale reads N = ${fmt(m * (g + a), 0)} N`, { anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'g']], color: 'a', say: 'g: standing still, the scale must hold up your weight, m × g.' },
        { parts: [[4, ' + a'], [2, '('], [5, ')']], color: 'b', say: '+ a: to also accelerate you upward at a, the floor must push an extra m × a.' },
        { parts: [[0, 'N = '], [1, 'm']], say: 'N = m(g + a): the scale reads more while the lift speeds up, and less while it slows down.' },
      ],
      vary: [{ key: 'a', amp: 4, label: 'a', color: 'b', say: 'Vary the lift’s acceleration: going negative (slowing down on the way up) makes you feel lighter.' }],
    }),
    Newton: play({
      own: true,
      intro: 'A 1 kg block, pushed with 1 newton.',
      scene: (q, h, k, u) => {
        let s = S.line(60, 330, 740, 330, 'grid2', 1.5) + box(160, 330, 60, 50, 'b', '1 kg') + S.fade(u(0), arrowL(80, 305, 126, 'a', '1 N'));
        for (let n = 1; n <= 3; n++) s += S.fade(clamp01(u(1) * 3 - (n - 1)), label(280 + n * 120, 300, `after ${n} s: ${n} m/s`, { size: 13 }));
        s += S.fade(u(2), label(400, 120, '1 N gives 1 kg an extra 1 m/s every second', { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, '1 N']], color: 'a', say: '1 N: a push of one newton…' },
        { parts: [[1, ' = 1 kg']], color: 'b', say: '…on one kilogram…' },
        { parts: [[2, '·m/s²']], say: '…speeds it up by 1 m/s every second. That’s what a newton is defined to be.' },
      ],
    }),
  });

  reg('n-third', {
    'Third law': play({
      own: true,
      intro: 'Two blocks touching: A on the left, B on the right.',
      backdrop: () => S.line(120, 320, 680, 320, 'grid2', 1.5) + S.rect(290, 240, 110, 80, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 }) + label(345, 286, 'A', { fill: 'b', size: 18, weight: 600 }) + S.rect(400, 220, 140, 100, 'c-soft', 'c', { rx: 4, 'stroke-width': 2 }) + label(470, 276, 'B', { fill: 'c', size: 18, weight: 600 }),
      pieces: [
        { parts: [[0, 'F(A→B)']], color: 'a', say: 'F(A→B): A pushes on B, to the right.', draw: (q, u) => S.arrow(404, 200, 404 + 130 * u, 200, 'a', 4.5) + S.fade(u, label(470, 186, '6 N on B', { fill: 'a', weight: 600 })) },
        { parts: [[1, ' = −']], say: '= −: the reply is the same size, flipped round…', draw: (q, u) => S.fade(u * (1 - seg(u, 0.8, 1)), S.line(400, 150, 400, 340, 'c', 2, dashed('4 4'))) },
        { parts: [[2, 'F(B→A)']], color: 'a', say: 'F(B→A): …B pushes back on A with exactly the same 6 N, to the left. Each force acts on a different block.', draw: (q, u) => S.arrow(396, 200, 396 - 130 * u, 200, 'a', 4.5) + S.fade(u, label(330, 186, '6 N on A', { fill: 'a', weight: 600 })) },
      ],
    }),
    Momentum: play({
      own: true, values: { mA: 50, mB: 80, J: 150 },
      intro: 'Two skaters push apart from rest.',
      scene: ({ mA, mB, J }, h, k, u) => {
        const vA = J / mA, vB = J / mB;
        let s = S.rect(80, 320, 640, 12, 'a-soft', null, { rx: 6, opacity: 0.5 }) + figure(360, 320, 'a', 0.7 + mA / 160) + figure(440, 320, 'b', 0.7 + mB / 160);
        s += S.fade(u(0), arrowL(360, 200, 360 - vA * 50, 'a', `${fmt(vA)} m/s`) + label(360, 340, `${fmt(mA)} kg`, { fill: 'a', size: 12 }));
        s += S.fade(u(1), arrowL(440, 170, 440 + vB * 50, 'b', `${fmt(vB)} m/s`) + label(440, 340, `${fmt(mB)} kg`, { fill: 'b', size: 12 }));
        s += S.fade(u(2), label(400, 100, `${fmt(mA)} × ${fmt(vA)} = ${fmt(mB)} × ${fmt(vB)} = ${fmt(J)} kg·m/s`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'm_A v_A']], color: 'a', say: 'm_A v_A: the lighter skater’s momentum after the push.' },
        { parts: [[1, ' = '], [2, 'm_B v_B']], color: 'b', say: 'm_B v_B: the heavier one’s. Equal forces for equal times give equal momentum, in opposite directions.' },
        { parts: [], say: 'So the lighter skater moves faster: speed is momentum shared over mass.' },
      ],
      vary: [{ key: 'mB', amp: 30, min: 30, label: 'm_B', color: 'b', say: 'Vary the heavier skater’s mass: their speed drops so the momentum still matches.' }],
    }),
    Accelerations: play({
      own: true, values: { mA: 2, mB: 6, F: 6 },
      intro: 'The same force, equal and opposite, on two different masses.',
      scene: ({ mA, mB, F }, h, k, u) => {
        const sA = 40 + mA * 8, sB = 40 + mB * 8, cx = 400, by = 300;
        let s = S.line(80, by, 720, by, 'grid2', 1.5) + box(cx - sA / 2, by, sA, sA, 'b', `${fmt(mA)} kg`) + box(cx + sB / 2, by, sB, sB, 'c', `${fmt(mB)} kg`);
        s += S.fade(u(0), arrowL(cx, by - Math.max(sA, sB) - 20, cx - Math.min(260, (F / mA) * 30) * u(0), 'b', `a_A = ${fmt(F / mA)}`));
        s += S.fade(u(1), arrowL(cx, by - Math.max(sA, sB) - 50, cx + Math.min(260, (F / mB) * 30) * u(1), 'c', `a_B = ${fmt(F / mB)}`));
        s += S.fade(u(2), label(400, 380, `a_A ÷ a_B = ${fmt(F / mA / (F / mB))} = m_B ÷ m_A`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'a_A']], color: 'b', say: 'a_A: A’s acceleration, F ÷ m_A.' },
        { parts: [[1, ' / a_B']], color: 'c', say: 'a_B: B’s, F ÷ m_B, from the same size of force.' },
        { parts: [[2, ' = m_B / m_A']], say: 'Divide them and the force cancels: the accelerations are in the inverse ratio of the masses.' },
      ],
      vary: [{ key: 'mA', amp: 1.5, min: 0.5, label: 'm_A', color: 'b', say: 'Vary A’s mass: lighter, and A shoots off faster.' }],
    }),
  });

})();
