// "Show formula" plays for the Mechanics section. Each one builds its formula from a concrete example,
// then swings a variable so you can see what it does. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, lerp, clamp01, dashed, numberLine } = MV;
  const { play, label, reg } = MV.playKit;
  const { graph, block, cart, figure, bar, path, spring } = MV.phys;
  const g = 9.8;
  // Lines of working that appear one by one.
  const work = (x, y, list, o = {}) => list.map(([text, u, col], i) => S.fade(u, label(x, y + i * 28, text, { anchor: 'start', size: 16, fill: col || 'ink', ...o }))).join('');
  const arrowL = (x1, y, x2, color, text, w = 4) => (Math.abs(x2 - x1) < 1 ? '' : S.arrow(x1, y, x2, y, color, w)) + (text ? label((x1 + x2) / 2, y - 12, text, { fill: color, weight: 600, size: 13 }) : '');
  const vtAxes = (o = {}) => graph({ x0: 110, x1: 700, y0: 380, y1: 110, tMax: 6, vMax: 12, vLabel: 'speed (m/s)', ...o });

  // =====================================================================
  // Uniform and varied motion
  // =====================================================================

  reg('m-motion', {
    'Uniform motion': play({
      own: true, values: { s0: 2, v: 3, t: 4 },
      intro: 'A cyclist riding at a steady speed along a road with distance marks.',
      scene: ({ s0, v, t }, h, k, u) => {
        const NL = numberLine(0, 20, 300, 60, 740), X = NL.X;
        let s = NL.svg + label(740, 340, 'metres from the mark', { fill: 'muted', size: 11, anchor: 'end' });
        s += S.fade(u(0), S.circle(X(s0), 300, 8, 'b') + label(X(s0), 270, `start ${fmt(s0)} m`, { fill: 'b', weight: 600 }));
        s += S.fade(u(1), arrowL(X(s0), 220, X(s0 + v), 'a', `${fmt(v)} m in 1 s`));
        const n = u(2) * t;
        for (let i = 0; i < Math.ceil(n - 1e-9); i++) { const f = Math.min(1, n - i); s += S.arrow(X(s0 + i * v), 170, X(s0 + (i + f) * v), 170, 'a', 3) + S.fade(f >= 1 ? 1 : 0, label(X(s0 + (i + 0.5) * v), 156, `${i + 1} s`, { fill: 'a', size: 11 })); }
        s += S.fade(u(3), S.circle(X(Math.min(20, s0 + v * t)), 300, 9, 'ink') + label(X(Math.min(20, s0 + v * t)), 386, `s = ${fmt(s0)} + ${fmt(v)} × ${fmt(t)} = ${fmt(s0 + v * t)} m`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 's₀']], color: 'b', say: ({ s0 }) => `s₀: where the cyclist starts, ${fmt(s0)} m past the mark.` },
        { parts: [[3, ' + v']], color: 'a', say: ({ v }) => `v: every second they move another ${fmt(v)} m.` },
        { parts: [[4, 't']], color: 'a', say: ({ t, v }) => `t: after ${fmt(t)} seconds, that’s ${fmt(t)} equal steps of ${fmt(v)} m: v × t.` },
        { parts: [[0, 's'], [1, ' = ']], say: 's =: the position is where they started plus how far they’ve gone.' },
      ],
      vary: [{ key: 'v', amp: 1.2, min: 1, label: 'v', color: 'a', say: 'Vary the speed: every step stretches, and the cyclist ends further along.' }],
    }),
    Velocity: play({
      own: true, values: { v0: 2, a: 2, t: 4 },
      intro: 'A car’s speedometer, checked once a second while it accelerates.',
      scene: ({ v0, a, t }, h, k, u) => {
        const bx = 110, by = 380, vs = 22;
        let s = S.line(80, by, 740, by, 'grid2', 1.5);
        s += S.fade(u(0), S.rect(bx, by - v0 * vs, 64, v0 * vs, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(bx + 32, by + 20, 'start', { fill: 'muted', size: 12 }) + label(bx + 32, by - v0 * vs - 8, `v₀ = ${fmt(v0)}`, { fill: 'b', size: 13 }));
        for (let n = 1; n <= t; n++) {
          const o = clamp01(u(1) * t * 1.2 - (n - 1)), x = bx + n * 130;
          s += S.fade(o, S.rect(x, by - v0 * vs, 64, v0 * vs, 'b-soft', 'b', { 'stroke-width': 1.5 }));
          for (let j = 0; j < n; j++) s += S.fade(o, S.rect(x, by - (v0 + a * (j + 1)) * vs, 64, a * vs, 'a-soft', 'a', { 'stroke-width': 1.5 }));
          s += S.fade(o, label(x + 32, by + 20, `${n} s`, { fill: 'muted', size: 12 }) + label(x + 32, by - (v0 + a * n) * vs - 8, fmt(v0 + a * n), { size: 13 }));
        }
        s += S.fade(u(2), label(400, 110, `v = ${fmt(v0)} + ${fmt(a)} × ${fmt(t)} = ${fmt(v0 + a * t)} m/s`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'v₀']], color: 'b', say: ({ v0 }) => `v₀: it’s already doing ${fmt(v0)} m/s when we start the clock.` },
        { parts: [[3, ' + a'], [4, 't']], color: 'a', say: ({ a }) => `+ at: each second adds another ${fmt(a)} m/s block. After t seconds: t blocks, a × t.` },
        { parts: [[0, 'v'], [1, ' = ']], say: 'v =: the speed now is the starting speed plus everything gained.' },
      ],
      vary: [{ key: 'a', amp: 1, min: 0.5, label: 'a', color: 'a', say: 'Vary the acceleration: the blocks added each second grow or shrink.' }],
    }),
    Position: play({
      own: true, values: { s0: 0, v0: 3, a: 1.2, t: 5 },
      intro: 'A speed-against-time graph of a car speeding up steadily. Distance is the area under it.',
      scene: ({ v0, a, t }, h, k, u) => {
        const Gr = vtAxes();
        let s = Gr.s + S.path(path(4, (x) => [Gr.X(x * 6), Gr.Y(v0 + a * x * 6)]), 'ink', 2.5);
        s += S.fade(u(1), S.rect(Gr.X(0), Gr.Y(v0), Gr.X(t * u(1)) - Gr.X(0), Gr.Y(0) - Gr.Y(v0), 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(Gr.X(t / 2), Gr.Y(v0 / 2) + 5, `v₀t = ${fmt(v0 * t)} m`, { fill: 'b', weight: 600 }));
        s += S.fade(u(2), S.poly([[Gr.X(0), Gr.Y(v0)], [Gr.X(t), Gr.Y(v0)], [Gr.X(t), Gr.Y(v0 + a * t * u(2))]], 'a-soft', 'a', { 'stroke-width': 1.5 }) +
          label(Gr.X(t) + 8, Gr.Y(v0 + (a * t) / 2), `extra speed at = ${fmt(a * t)}`, { fill: 'a', size: 12, anchor: 'start' }) + label(Gr.X(t * 0.66), Gr.Y(v0 + a * t * 0.3) + 4, `½·t·at = ${fmt(0.5 * a * t * t)} m`, { fill: 'a', weight: 600, size: 13 }));
        s += S.fade(u(0), label(Gr.X(0) + 10, 140, 's₀: where it started (here 0)', { fill: 'muted', anchor: 'start', size: 13 }));
        s += S.fade(u(3), label(560, 140, `s = ${fmt(v0 * t + 0.5 * a * t * t)} m`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 's₀']], color: 'muted', say: 's₀: the starting position. Distance travelled gets added to it.' },
        { parts: [[3, ' + v₀t']], color: 'b', say: 'v₀t: if it kept its starting speed, it would cover v₀ × t, the rectangle.' },
        { parts: [[4, ' + ½at²']], color: 'a', say: 'But its speed grew by a × t. The extra area is a triangle: half of t times at, ½at².' },
        { parts: [[0, 's'], [1, ' = ']], say: 's =: the total area is the distance: rectangle plus triangle.' },
      ],
      vary: [{ key: 'a', amp: 1, min: 0, label: 'a', color: 'a', say: 'Vary the acceleration: only the triangle changes, and it grows with t², not t.' }],
    }),
    Torricelli: play({
      own: true, values: { v0: 2, a: 1.5, ds: 20 },
      intro: 'Find the final speed from a distance alone, without ever knowing the time.',
      scene: ({ v0, a, ds }, h, k, u) => {
        const v = Math.sqrt(v0 * v0 + 2 * a * ds), t = (v - v0) / a;
        const Gr = graph({ x0: 100, x1: 400, y0: 380, y1: 120, tMax: Math.max(6, t * 1.1), vMax: 14, vLabel: 'speed (m/s)' });
        let s = Gr.s + S.poly([[Gr.X(0), Gr.Y(0)], [Gr.X(0), Gr.Y(v0)], [Gr.X(t), Gr.Y(v)], [Gr.X(t), Gr.Y(0)]], 'c-soft', 'c', { 'stroke-width': 1.5, opacity: Math.max(0.2, u(0)) });
        s += S.fade(u(0), label(Gr.X(t / 2), Gr.Y(v / 3), `Δs = ${fmt(ds)} m`, { fill: 'c', weight: 600 }));
        s += work(440, 150, [
          ['area: Δs = (v₀ + v)/2 × t', u(0), 'c'],
          ['time to gain speed: t = (v − v₀)/a', u(1), 'a'],
          ['so 2aΔs = (v + v₀)(v − v₀)', u(1), 'a'],
          ['= v² − v₀²', u(2), 'b'],
          [`v² = ${fmt(v0 * v0)} + 2 × ${fmt(a)} × ${fmt(ds)} = ${fmt(v * v, 1)}`, u(3)],
          [`v = ${fmt(v)} m/s`, u(3)],
        ]);
        return s;
      },
      pieces: [
        { parts: [[4, 'Δs']], color: 'c', say: 'Δs: the distance is the area under the speed graph: average speed × time.' },
        { parts: [[3, ' + 2a']], color: 'a', say: '2a: the time is the speed gained divided by a. Substitute it and multiply both sides by 2a.' },
        { parts: [[2, 'v₀²']], color: 'b', say: '(v + v₀)(v − v₀) is v² − v₀²: a difference of squares.' },
        { parts: [[0, 'v²'], [1, ' = ']], say: 'v² =: the time has dropped out completely.' },
      ],
      vary: [{ key: 'ds', amp: 15, min: 2, label: 'Δs', color: 'c', say: 'Vary the distance: four times the distance only doubles the gain in v² — speed grows like a square root.' }],
    }),
    'Stopping distance': play({
      own: true, values: { v: 20, tr: 1, a: 6 },
      intro: 'A car at 20 m/s (72 km/h) has to stop. Its speed graph tells the whole story.',
      scene: ({ v, tr, a }, h, k, u) => {
        const tb = v / a, Gr = graph({ x0: 100, x1: 700, y0: 380, y1: 120, tMax: 6.5, vMax: 32, vLabel: 'speed (m/s)' });
        let s = Gr.s;
        s += S.fade(u(0), S.rect(Gr.X(0), Gr.Y(v), Gr.X(tr) - Gr.X(0), Gr.Y(0) - Gr.Y(v), 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(Gr.X(tr / 2), Gr.Y(v / 2), `${fmt(v * tr)} m`, { fill: 'b', weight: 600 }) + label(Gr.X(tr / 2), Gr.Y(v) - 10, 'reacting', { fill: 'b', size: 12 }));
        s += S.fade(u(1), S.poly([[Gr.X(tr), Gr.Y(0)], [Gr.X(tr), Gr.Y(v)], [Gr.X(tr + tb * u(1)), Gr.Y(v - a * tb * u(1))], [Gr.X(tr + tb * u(1)), Gr.Y(0)]], 'c-soft', 'c', { 'stroke-width': 1.5 }) +
          label(Gr.X(tr + tb / 3), Gr.Y(v / 3), `½ × ${fmt(tb, 2)} s × ${fmt(v)} = ${fmt((v * v) / (2 * a), 1)} m`, { fill: 'c', weight: 600, size: 12, anchor: 'start' }) + label(Gr.X(tr + tb / 2) + 30, Gr.Y(v / 2) - 20, `braking for v/a = ${fmt(tb, 2)} s`, { fill: 'c', size: 12, anchor: 'start' }));
        s += S.fade(u(2), label(400, 100, `d = ${fmt(v * tr)} + ${fmt((v * v) / (2 * a), 1)} = ${fmt(v * tr + (v * v) / (2 * a), 1)} m`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'vt_r']], color: 'b', say: ({ v, tr }) => `vt_r: while the driver reacts, ${fmt(tr)} s, the car keeps ${fmt(v)} m/s. A rectangle of area v × t_r.` },
        { parts: [[3, ' + v²/2a']], color: 'c', say: 'v²/2a: then it slows to zero in a time v/a. The triangle’s area is ½ × (v/a) × v = v²/2a.' },
        { parts: [[0, 'd'], [1, ' = ']], say: 'd =: total stopping distance, rectangle plus triangle.' },
      ],
      vary: [{ key: 'v', amp: 9, min: 8, max: 30, label: 'v', color: 'a', say: 'Vary the speed: the rectangle grows in step with v, but the triangle grows with v², both taller and wider.' }],
    }),
  });

  // =====================================================================
  // Motion graphs
  // =====================================================================

  reg('m-graphs', {
    'Velocity is slope': play({
      own: true, values: { t0: 2, dt: 2 },
      intro: 'A position–time graph of a ball rolling down a slope: x = 0.5t².',
      scene: ({ t0, dt }, h, k, u) => {
        const x = (t) => 0.5 * t * t, Gr = graph({ x0: 110, x1: 520, y0: 380, y1: 110, tMax: 6, vMax: 18, vLabel: 'position x (m)' });
        let s = Gr.s + S.path(path(60, (q) => [Gr.X(q * 6), Gr.Y(x(q * 6))]), 'ink', 2.5);
        const t1 = t0 + dt, p0 = [Gr.X(t0), Gr.Y(x(t0))], p1 = [Gr.X(t1), Gr.Y(x(t1))];
        s += S.fade(u(0), S.line(p1[0], p0[1], p1[0], p1[1], 'a', 3) + label(p1[0] + 8, (p0[1] + p1[1]) / 2, `Δx = ${fmt(x(t1) - x(t0))} m`, { fill: 'a', anchor: 'start', weight: 600 }) + S.circle(...p0, 5, 'ink') + S.circle(...p1, 5, 'ink'));
        s += S.fade(u(1), S.line(p0[0], p0[1], p1[0], p0[1], 'b', 3) + label((p0[0] + p1[0]) / 2, p0[1] + 20, `Δt = ${fmt(dt)} s`, { fill: 'b', weight: 600 }));
        const slope = (x(t1) - x(t0)) / dt;
        s += S.fade(u(2), S.line(Gr.X(t0 - 1), Gr.Y(x(t0) - slope), Gr.X(Math.min(6, t1 + 1)), Gr.Y(x(t0) + slope * (Math.min(6, t1 + 1) - t0)), 'c', 2, dashed('6 4')) +
          label(560, 170, `v = ${fmt(x(t1) - x(t0))} ÷ ${fmt(dt)} = ${fmt(slope)} m/s`, { anchor: 'start', weight: 600 }) + label(560, 200, `true speed at t = ${fmt(t0)}: ${fmt(t0)} m/s`, { anchor: 'start', fill: 'muted', size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'Δx']], color: 'a', say: 'Δx: between two moments, the ball moved this much: the rise of the graph.' },
        { parts: [[3, '/Δt']], color: 'b', say: '/Δt: in this much time: the run.' },
        { parts: [[0, 'v'], [1, ' = ']], say: 'v =: rise over run is the slope, the average velocity over that interval.' },
      ],
      vary: [{ key: 'dt', amp: 1.9, min: 0.05, label: 'Δt', color: 'b', say: 'Shrink Δt: the line through the two points becomes the tangent, and its slope becomes the velocity at that instant.' }],
    }),
    'Acceleration is slope': play({
      own: true, values: { v0: 2, a: 1.5 },
      intro: 'A velocity–time graph of a car speeding up steadily.',
      scene: ({ v0, a }, h, k, u) => {
        const Gr = vtAxes({ vMax: 14 }), v = (t) => v0 + a * t, t0 = 1, t1 = 4;
        let s = Gr.s + S.path(path(4, (q) => [Gr.X(q * 6), Gr.Y(Math.min(14, v(q * 6)))]), 'a', 2.5);
        s += S.fade(u(0), S.line(Gr.X(t1), Gr.Y(v(t0)), Gr.X(t1), Gr.Y(v(t1)), 'a', 3) + label(Gr.X(t1) + 8, Gr.Y((v(t0) + v(t1)) / 2), `Δv = ${fmt(v(t1) - v(t0))} m/s`, { fill: 'a', anchor: 'start', weight: 600 }));
        s += S.fade(u(1), S.line(Gr.X(t0), Gr.Y(v(t0)), Gr.X(t1), Gr.Y(v(t0)), 'b', 3) + label(Gr.X((t0 + t1) / 2), Gr.Y(v(t0)) + 20, 'Δt = 3 s', { fill: 'b', weight: 600 }));
        s += S.fade(u(2), label(400, 100, `a = ${fmt(v(t1) - v(t0))} ÷ 3 = ${fmt(a)} m/s²`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'Δv']], color: 'a', say: 'Δv: how much the speed went up.' },
        { parts: [[3, '/Δt']], color: 'b', say: '/Δt: over how long.' },
        { parts: [[0, 'a'], [1, ' = ']], say: 'a =: the steepness of the velocity graph is the acceleration. A straight line means it’s constant.' },
      ],
      vary: [{ key: 'a', amp: 1.4, label: 'a', color: 'a', say: 'Vary a: steeper line, faster speed-up. Negative a tilts it down: braking.' }],
    }),
    'Displacement is area': play({
      own: true, values: { n: 4 },
      intro: 'A runner whose speed changes. How far did they go in 6 s?',
      scene: ({ n }, h, k, u) => {
        const Gr = vtAxes({ vMax: 8 }), v = (t) => 2 + 3 * Math.sin((t / 6) * Math.PI) + 0.3 * t, N = Math.max(1, Math.round(n));
        let s = Gr.s + S.path(path(80, (q) => [Gr.X(q * 6), Gr.Y(v(q * 6))]), 'ink', 2.5), total = 0;
        for (let i = 0; i < N; i++) {
          const t0 = (i * 6) / N, w = 6 / N, vm = v(t0 + w / 2), o = clamp01(u(0) * N * 1.1 - i);
          total += vm * w;
          s += S.fade(o, S.rect(Gr.X(t0), Gr.Y(vm), Gr.X(t0 + w) - Gr.X(t0), Gr.Y(0) - Gr.Y(vm), 'a-soft', 'a', { 'stroke-width': 1.2 }));
          if (N <= 8) s += S.fade(o, label(Gr.X(t0 + w / 2), Gr.Y(vm / 2) + 4, fmt(vm * w, 1), { fill: 'a', size: 11 }));
        }
        s += S.fade(u(1), label(560, 120, `${N} strips add to ${fmt(total, 2)} m`, { weight: 600, size: 15 }) + label(560, 146, `exact area: ${fmt(12 + 36 / Math.PI + 5.4, 2)} m`, { fill: 'muted', size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'area under v(t)']], color: 'a', say: 'Chop the time into short pieces. In each, the runner moves (speed) × (time): a thin strip of area.' },
        { parts: [[0, 'Δx'], [1, ' = ']], say: 'Δx =: add up all the strips and you get the distance: the area under the curve.' },
      ],
      vary: [{ key: 'n', amp: 14, min: 2, max: 18, label: 'strips', color: 'a', say: 'More, thinner strips: the staircase hugs the curve and the total closes in on the exact area.' }],
    }),
    'Trapezoid area': play({
      own: true, values: { v0: 2, a: 1.2, t: 5 },
      intro: 'Constant acceleration: a straight speed line. The area under it is a trapezoid.',
      scene: ({ v0, a, t }, h, k, u) => {
        const v = v0 + a * t, Gr = graph({ x0: 90, x1: 520, y0: 380, y1: 110, tMax: t + 0.6, vMax: 17, vLabel: 'speed (m/s)' });
        const trap = [[Gr.X(0), Gr.Y(0)], [Gr.X(0), Gr.Y(v0)], [Gr.X(t), Gr.Y(v)], [Gr.X(t), Gr.Y(0)]];
        let s = Gr.s + S.poly(trap, 'a-soft', 'a', { 'stroke-width': 2 });
        // A copy turned half a turn and stacked on top: v thick at the start, v₀ thick at the end, so v₀ + v tall everywhere.
        const flip = [[Gr.X(0), Gr.Y(v0)], [Gr.X(0), Gr.Y(v0 + v)], [Gr.X(t), Gr.Y(v0 + v)], [Gr.X(t), Gr.Y(v)]];
        s += S.fade(u(0), label(Gr.X(0) - 8, Gr.Y(v0), `v₀ ${fmt(v0)}`, { fill: 'b', anchor: 'end', size: 12 }) + label(Gr.X(t) + 6, Gr.Y(v) + 4, `v ${fmt(v)}`, { fill: 'a', size: 12, anchor: 'start' }));
        s += S.fade(u(1), S.poly(flip, 'b-soft', 'b', { 'stroke-width': 2, ...dashed('5 4') }) + label(Gr.X(t) + 6, Gr.Y(v0 + v) + 4, `v₀ + v = ${fmt(v0 + v)} everywhere`, { fill: 'b', size: 12, anchor: 'start' }));
        s += S.fade(u(1), S.line(Gr.X(0), Gr.Y(0) + 26, Gr.X(t), Gr.Y(0) + 26, 'b', 2) + label(Gr.X(t / 2), Gr.Y(0) + 44, `t = ${fmt(t)} s`, { fill: 'b', size: 12 }));
        s += S.fade(u(2), label(660, 140, `two trapezoids: (${fmt(v0)} + ${fmt(v)}) × ${fmt(t)}`, { size: 14, anchor: 'middle' }) + label(660, 168, `one: ÷ 2 = ${fmt(((v0 + v) * t) / 2, 1)} m`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[2, '(v₀ + v)']], color: 'a', say: '(v₀ + v): the two parallel sides of the trapezoid, the starting and ending speeds.' },
        { parts: [[3, 't']], color: 'b', say: 't: its width. Turn a copy upside down and stack it on top: together they make a rectangle v₀ + v tall and t wide.' },
        { parts: [[4, '/2'], [0, 'Δx'], [1, ' = ']], say: '/2: our area is half of that: the average speed (v₀ + v)/2 times the time.' },
      ],
      vary: [{ key: 'a', amp: 0.9, min: 0, label: 'a', color: 'a', say: 'Vary the acceleration: the sloped top tilts, and the average speed moves with it.' }],
    }),
  });

  // =====================================================================
  // Newton's laws in action
  // =====================================================================

  const floor = (y) => S.line(60, y, 740, y, 'ink', 2) + Array.from({ length: 17 }, (_, i) => S.line(80 + i * 40, y + 2, 70 + i * 40, y + 12, 'grid2', 1.5)).join('');

  reg('m-forces', {
    'Kinetic friction': play({
      own: true, values: { N: 50, mu: 0.4 },
      intro: 'A crate sliding across the floor. Up close, both surfaces are bumpy.',
      scene: ({ N, mu }, h, k, u) => {
        const y = 300, cx = 330;
        let s = floor(y) + block(cx, y, 120, 80, 'b', 'crate');
        s += S.arrow(cx + 60, y - 40, cx + 150, y - 40, 'ink', 2.5) + label(cx + 160, y - 36, 'sliding', { anchor: 'start', size: 12, fill: 'muted' });
        // Zoomed-in bumps: pressed together harder means more interlocking.
        const zx = 560, zy = 150, depth = 4 + N * 0.12;
        let teeth = '', base = '';
        for (let i = 0; i < 10; i++) { teeth += `L${zx + i * 16 + 8} ${zy + depth} L${zx + i * 16 + 16} ${zy}`; base += `L${zx + i * 16 + 8} ${zy + 28 - depth} L${zx + i * 16 + 16} ${zy + 28}`; }
        s += S.fade(u(0), S.circle(cx - 40, y, 30, null, 'muted', { 'stroke-width': 1, ...dashed('3 3') }) + S.line(cx - 12, y - 14, zx - 10, zy + 14, 'muted', 1, dashed('3 3')) +
          S.path(`M${zx} ${zy}${teeth}`, 'b', 2) + S.path(`M${zx} ${zy + 28}${base}`, 'ink', 2) + label(zx + 80, zy - 14, 'up close', { fill: 'muted', size: 11 }));
        s += S.fade(u(0), S.arrow(cx, y - 84 - N * 1.2, cx, y - 84, 'ink', 3) + label(cx - 10, y - 90 - N * 0.6, `pressed down: N = ${fmt(N)} N`, { anchor: 'end', size: 12 }));
        s += S.fade(u(1), label(560, 230, `rough as μ = ${fmt(mu)}`, { fill: 'c', size: 13 }));
        s += S.fade(u(2), arrowL(cx - 60, y - 12, cx - 60 - mu * N * 3 * u(2), 'c', `f = ${fmt(mu)} × ${fmt(N)} = ${fmt(mu * N)} N`));
        return s;
      },
      pieces: [
        { parts: [[3, 'N']], say: 'N: the harder the surfaces are pressed together, the deeper the bumps interlock.' },
        { parts: [[2, 'μ_k ']], color: 'c', say: 'μ_k: how rough the pair of surfaces is: the fraction of N that friction becomes. Ice on steel ≈ 0.03, rubber on dry road ≈ 0.7.' },
        { parts: [[0, 'f_k'], [1, ' = ']], color: 'c', say: 'f_k =: sliding friction is that fraction of the normal force, pointing against the motion.' },
      ],
      vary: [{ key: 'N', amp: 35, min: 10, label: 'N', color: 'ink', say: 'Vary N (load the crate): the friction grows in proportion.' }],
    }),
    'Static friction': play({
      own: true, values: { F: 10, max: 30 },
      intro: 'Push a heavy wardrobe, gently at first.',
      scene: ({ F, max }, h, k, u) => {
        const y = 300, cx = 330, f = Math.min(F, max), slides = F > max;
        let s = floor(y) + block(cx + (slides ? (F - max) * 3 : 0), y, 110, 140, 'b', 'wardrobe');
        const bx = cx + (slides ? (F - max) * 3 : 0);
        s += arrowL(bx - 55 - F * 3, y - 70, bx - 55, 'a', `push ${fmt(F)} N`);
        // Friction acts along the floor, against the push.
        if (f > 0) s += S.fade(u(0), S.arrow(bx + 30, y + 26, bx + 30 - f * 3, y + 26, 'c', 4) + label(bx + 30 - f * 1.5, y + 50, `friction ${fmt(f)} N`, { fill: 'c', weight: 600, size: 13 }));
        const Gr = graph({ x0: 520, x1: 760, y0: 380, y1: 200, tMax: 50, vMax: 40, tLabel: 'push (N)', vLabel: 'friction (N)', ticks: false });
        s += S.fade(u(1), S.line(Gr.X(0), Gr.Y(max), Gr.X(50), Gr.Y(max), 'c', 1.5, dashed('5 4')) + label(Gr.X(50), Gr.Y(max) - 6, `μ_s N = ${fmt(max)} N`, { fill: 'c', size: 11, anchor: 'end' }));
        s += S.fade(u(0), Gr.s + S.path(path(60, (q) => { const P = q * 50; return [Gr.X(P), Gr.Y(Math.min(P, max))]; }), 'c', 2.5) + S.circle(Gr.X(Math.min(50, F)), Gr.Y(f), 6, 'a'));
        s += S.fade(u(2), label(330, 110, slides ? 'too much: it breaks free and slides!' : 'friction matches the push: no movement', { weight: 600, fill: slides ? 'a' : 'ink' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'f_s']], color: 'c', say: 'f_s: push gently and friction pushes back exactly as hard. Nothing moves.' },
        { parts: [[1, ' ≤ '], [2, 'μ_s N']], color: 'c', say: '≤ μ_s N: but there’s a limit. Static friction can grow only up to μ_s × N.' },
        { parts: [], say: 'Push past the limit and the wardrobe lurches into motion.' },
      ],
      vary: [{ key: 'F', amp: 30, min: 0, max: 45, label: 'push', color: 'a', say: 'Vary the push: friction follows it up to the dashed limit, then the wardrobe slides.' }],
    }),
    'Net force': play({
      own: true, values: { F: 40, f: 15, m: 10 },
      intro: 'Pulling a sledge over snow: your pull forward, friction back.',
      scene: ({ F, f, m }, h, k, u) => {
        const y = 300, cx = 360;
        let s = floor(y) + block(cx, y, 120, 60, 'b', `${fmt(m)} kg`);
        s += S.fade(u(0), arrowL(cx + 60, y - 30, cx + 60 + F * 4 * u(0), 'a', `F = ${fmt(F)} N`));
        s += S.fade(u(1), arrowL(cx - 60, y - 10, cx - 60 - f * 4 * u(1), 'c', `f = ${fmt(f)} N`));
        s += S.fade(u(2), arrowL(cx - (F - f) * 2, y - 120, cx + (F - f) * 2, 'ink', `net ${fmt(F - f)} N`, 5) + label(cx, y - 160, `a = ${fmt(F - f)} ÷ ${fmt(m)} = ${fmt((F - f) / m)} m/s²`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'F']], color: 'a', say: 'F: your pull.' },
        { parts: [[1, ' − f']], color: 'c', say: '− f: friction points the other way, so it subtracts.' },
        { parts: [[2, ' = ma']], say: '= ma: only what’s left over, the net force, accelerates the sledge.' },
      ],
      vary: [{ key: 'F', amp: 25, min: 0, label: 'F', color: 'a', say: 'Vary your pull: when it drops to friction’s size the net force is zero, and the sledge just keeps its speed.' }],
    }),
    'Connected blocks': play({
      own: true, values: { F: 24, mA: 4, mB: 2 },
      intro: 'Two blocks tied by a rope, pulled along a smooth floor.',
      scene: ({ F, mA, mB }, h, k, u) => {
        const y = 300, wA = 50 + mA * 8, wB = 50 + mB * 8, xA = 470, xB = xA - wA / 2 - 70 - wB / 2;
        let s = floor(y) + block(xA, y, wA, 70, 'b', `${fmt(mA)} kg`) + block(xB, y, wB, 70, 'c', `${fmt(mB)} kg`) + S.line(xB + wB / 2, y - 35, xA - wA / 2, y - 35, 'ink', 2.5);
        s += S.fade(u(0), arrowL(xA + wA / 2, y - 35, xA + wA / 2 + F * 5, 'a', `F = ${fmt(F)} N`));
        s += S.fade(u(1), S.rect(xB - wB / 2 - 12, y - 90, xA + wA / 2 - xB + wB / 2 + 24, 104, null, 'ink', { rx: 10, 'stroke-width': 2, ...dashed('6 5') }) + label((xA + xB) / 2, y - 100, `one body of ${fmt(mA + mB)} kg`, { weight: 600 }));
        s += S.fade(u(2), label(400, 110, `a = ${fmt(F)} ÷ ${fmt(mA + mB)} = ${fmt(F / (mA + mB))} m/s²`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'F']], color: 'a', say: 'F: the only outside push along the floor.' },
        { parts: [[3, '/(m_A + m_B)']], color: 'b', say: '/(m_A + m_B): the rope makes them move together, so treat them as one body with both masses.' },
        { parts: [[0, 'a'], [1, ' = ']], say: 'a =: the shared acceleration. The rope’s pulls are internal and cancel out.' },
      ],
      vary: [{ key: 'mB', amp: 3, min: 0.5, label: 'm_B', color: 'c', say: 'Vary the back block: more mass to drag, smaller acceleration for both.' }],
    }),
    'Rope tension': play({
      own: true, values: { a: 4, mB: 2 },
      intro: 'Look at the back block on its own. Only the rope pulls it forward.',
      scene: ({ a, mB }, h, k, u) => {
        const y = 300, wB = 60 + mB * 10, xB = 280;
        let s = floor(y) + block(xB, y, wB, 70, 'c', `${fmt(mB)} kg`) + S.line(xB + wB / 2, y - 35, xB + wB / 2 + 160, y - 35, 'ink', 2.5) + label(xB + wB / 2 + 170, y - 31, '→ to the front block', { anchor: 'start', size: 12, fill: 'muted' });
        s += S.fade(u(0), arrowL(xB - 60, y - 110, xB + 60, 'muted', `must accelerate at a = ${fmt(a)} m/s²`, 3));
        s += S.fade(u(2), arrowL(xB + wB / 2, y - 55, xB + wB / 2 + mB * a * 12 * u(2), 'ink', `T = ${fmt(mB)} × ${fmt(a)} = ${fmt(mB * a)} N`));
        s += S.fade(u(1), label(xB, y + 40, 'nothing else pushes it along', { fill: 'muted', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'a']], say: 'a: the back block has to keep up with the front one.' },
        { parts: [[2, 'm_B ']], color: 'c', say: 'm_B: its own mass is all the rope has to move.' },
        { parts: [[0, 'T'], [1, ' = ']], say: 'T =: by the second law, the rope must pull with m_B × a, no more, no less.' },
      ],
      vary: [{ key: 'mB', amp: 2.5, min: 0.5, label: 'm_B', color: 'c', say: 'Vary the back block: a heavier one needs a tighter rope for the same acceleration.' }],
    }),
    Ramp: play({
      own: true, values: { th: 30, mu: 0.2 },
      intro: 'A box on a slope. Split its weight into two parts.',
      scene: ({ th, mu }, h, k, u) => {
        const r = (th * Math.PI) / 180, x0 = 120, y0 = 380, L = 420, top = [x0, y0 - L * Math.sin(r)], bot = [x0 + L * Math.cos(r), y0];
        let s = S.poly([[x0, y0], top, bot], 'ink-soft', 'ink', { 'stroke-width': 2 });
        const bx = lerp(top[0], bot[0], 0.45), by = lerp(top[1], bot[1], 0.45), nx = Math.sin(r), ny = -Math.cos(r), cx = bx + nx * 22, cy = by + ny * 22;
        s += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${th})">${S.rect(-30, -22, 60, 44, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 })}</g>`;
        const W = 110, par = W * Math.sin(r), perp = W * Math.cos(r), ax = Math.cos(r), ay = Math.sin(r);
        s += S.fade(u(0), S.arrow(cx, cy, cx, cy + W, 'ink', 3) + label(cx - 8, cy + W + 6, 'g (per kg)', { anchor: 'end', size: 12 }));
        s += S.fade(u(1), S.arrow(cx, cy, cx + ax * par, cy + ay * par, 'b', 3.5) + label(cx + ax * par + 8, cy + ay * par, 'g sin θ: down the slope', { fill: 'b', size: 12, anchor: 'start', weight: 600 }) + S.line(cx, cy + W, cx + ax * par, cy + ay * par, 'muted', 1, dashed('3 3')));
        s += S.fade(u(2), S.line(cx, cy, cx - nx * perp, cy - ny * perp, 'muted', 2, dashed('4 3')) + label(cx - nx * perp - 6, cy - ny * perp + 14, 'g cos θ: into the slope', { fill: 'muted', size: 12, anchor: 'end' }) +
          S.arrow(cx, cy, cx - ax * mu * perp, cy - ay * mu * perp, 'c', 3.5) + label(cx - ax * mu * perp - 6, cy - ay * mu * perp - 8, 'friction μ g cos θ', { fill: 'c', size: 12, anchor: 'end' }));
        s += S.fade(u(3), label(560, 120, `a = 9.8 × (${fmt(Math.sin(r), 2)} − ${fmt(mu)} × ${fmt(Math.cos(r), 2)}) = ${fmt(Math.max(0, g * (Math.sin(r) - mu * Math.cos(r))))} m/s²`, { weight: 600, size: 15 }));
        s += label(x0 + L * Math.cos(r) - 60, y0 - 10, `${fmt(th, 0)}°`, { fill: 'a', weight: 600 });
        return s;
      },
      pieces: [
        { parts: [[2, 'g']], say: 'g: every kilogram is pulled straight down with 9.8 N.' },
        { parts: [[3, '(sin θ']], color: 'b', say: 'sin θ: the part of that pull that points along the slope. Flat ground: sin 0° = 0; a cliff: sin 90° = 1.' },
        { parts: [[4, ' − μ cos θ)']], color: 'c', say: '− μ cos θ: the part pressing into the slope sets the friction, which pulls back up the slope.' },
        { parts: [[0, 'a'], [1, ' = ']], say: 'a =: what’s left accelerates the box. No m anywhere: the mass cancels.' },
      ],
      vary: [{ key: 'th', amp: 22, min: 5, max: 70, label: 'θ', color: 'a', say: 'Vary the angle: steeper means more pull along the slope and less pressing into it, so less friction too.' }],
    }),
    'Lift cable': play({
      own: true, values: { m: 800, a: 1.5 },
      intro: 'A lift of 800 kg on its cable, about to speed up going up.',
      scene: ({ m, a }, h, k, u) => {
        const cx = 200, top = 100, carTop = 230;
        let s = S.circle(cx, top, 12, null, 'ink', { 'stroke-width': 2 }) + S.line(cx, top + 12, cx, carTop, 'ink', 2.5) + S.rect(cx - 70, carTop, 140, 110, 'b-soft', 'b', { rx: 6, 'stroke-width': 2 }) + label(cx, carTop + 60, `${fmt(m)} kg`, { fill: 'b', weight: 600 });
        const sc = 0.016, bx = 470, by = 380;
        s += S.fade(u(0), S.rect(bx, by - m * g * sc, 70, m * g * sc, 'ink-soft', 'ink', { 'stroke-width': 1.5 }) + label(bx + 35, by - (m * g * sc) / 2, `mg ${fmt(m * g, 0)}`, { size: 12 }) + label(bx + 35, by + 20, 'to hold it', { fill: 'muted', size: 11 }));
        const ma = m * a;
        s += S.fade(u(1), S.rect(bx, by - m * g * sc - Math.max(0, ma) * sc, 70, Math.abs(ma) * sc, a >= 0 ? 'a-soft' : 'c-soft', a >= 0 ? 'a' : 'c', { 'stroke-width': 1.5 }) +
          label(bx + 90, by - m * g * sc - (ma * sc) / 2, `${a >= 0 ? '+' : '−'} ma ${fmt(Math.abs(ma), 0)}`, { fill: a >= 0 ? 'a' : 'c', size: 12, anchor: 'start' }));
        s += S.fade(u(2), S.arrow(cx + 40, carTop, cx + 40, carTop - m * (g + a) * 0.012, 'a', 3.5) + label(560, 130, `T = ${fmt(m)} × (9.8 + ${fmt(a)}) = ${fmt(m * (g + a), 0)} N`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'g']], say: 'g: just to hold the lift still, the cable pulls m × g, its weight.' },
        { parts: [[4, ' + a)']], color: 'a', say: '+ a: to speed it up as well, the cable pulls an extra m × a on top.' },
        { parts: [[2, 'm(']], color: 'b', say: 'm(…): both parts are proportional to the mass, so it multiplies the bracket.' },
        { parts: [[0, 'T'], [1, ' = ']], say: 'T =: the cable’s tension.' },
      ],
      vary: [{ key: 'a', amp: 3, label: 'a', color: 'a', say: 'Vary a: negative when the lift slows on the way up, and the cable pulls less than the weight.' }],
    }),
  });

  // =====================================================================
  // Work and energy
  // =====================================================================

  reg('m-energy', {
    Work: play({
      own: true, values: { F: 30, d: 6 },
      intro: 'Push a trolley with a steady force for some distance.',
      scene: ({ F, d }, h, k, u) => {
        const y = 200, X = (m) => 100 + m * 50;
        let s = S.line(60, y, 740, y, 'ink', 2) + S.rect(X(d * u(1)) , y - 40, 60, 34, 'b-soft', 'b', { rx: 5, 'stroke-width': 2 }) + S.circle(X(d * u(1)) + 14, y - 3, 5, 'ink') + S.circle(X(d * u(1)) + 46, y - 3, 5, 'ink');
        s += S.fade(u(0), arrowL(X(d * u(1)) - 50, y - 24, X(d * u(1)) - 2, 'a', `${fmt(F)} N`));
        s += S.fade(u(1), S.line(X(0), y + 20, X(d * u(1)), y + 20, 'b', 3) + label(X((d * u(1)) / 2), y + 40, `d = ${fmt(d * u(1), 1)} m`, { fill: 'b', weight: 600 }));
        const Gr = graph({ x0: 100, x1: 700, y0: 390, y1: 260, tMax: 12, vMax: 60, tLabel: 'distance (m)', vLabel: 'force (N)', ticks: false });
        s += Gr.s + S.fade(u(0), S.line(Gr.X(0), Gr.Y(F), Gr.X(12), Gr.Y(F), 'a', 2));
        s += S.fade(u(2), S.rect(Gr.X(0), Gr.Y(F), Gr.X(d) - Gr.X(0), Gr.Y(0) - Gr.Y(F), 'c-soft', 'c', { 'stroke-width': 1.5 }) + label(Gr.X(d / 2), Gr.Y(F / 2) + 5, `W = ${fmt(F * d)} J`, { fill: 'c', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'F']], color: 'a', say: 'F: a steady push of 30 N.' },
        { parts: [[3, 'd']], color: 'b', say: 'd: kept up over this distance.' },
        { parts: [[0, 'W'], [1, ' = ']], color: 'c', say: 'W =: the work, the energy handed over, is force × distance: the area of the rectangle under the force graph.' },
      ],
      vary: [{ key: 'd', amp: 5, min: 1, label: 'd', color: 'b', say: 'Vary the distance: twice as far, twice the work.' }],
    }),
    'Kinetic energy': play({
      own: true, values: { m: 10, v: 6 },
      intro: 'How much work does it take to get a 10 kg trolley from rest up to speed v?',
      scene: ({ m, v }, h, k, u) => {
        let s = work(80, 130, [
          ['push with any force F: a = F/m', u(0), 'b'],
          ['distance to reach v (Torricelli): d = v²/2a', u(1), 'a'],
          ['work: W = F × d = ma × v²/2a', u(2)],
          ['the a cancels: W = ½mv²', u(2), 'c'],
        ]);
        const bx = 620, by = 380, E = 0.5 * m * v * v;
        s += S.fade(u(3), bar(bx, by, E, 200 / (0.5 * 10 * 100), 'c', 'kinetic energy', `${fmt(E, 0)} J`, 60));
        s += S.fade(u(3), label(400, 360, `½ × ${fmt(m)} × ${fmt(v)}² = ${fmt(E, 0)} J`, { weight: 600, size: 17 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'm']], color: 'b', say: 'm: a heavier trolley needs more force for the same acceleration.' },
        { parts: [[4, 'v²']], color: 'a', say: 'v²: and the distance needed to reach speed v grows with v², by Torricelli’s equation.' },
        { parts: [[2, '½']], color: 'c', say: '½: work = force × distance = ma × v²/2a. The a cancels, leaving ½mv², however gently or hard you push.' },
        { parts: [[0, 'E_k'], [1, ' = ']], color: 'c', say: 'E_k =: that work is now stored in the motion: kinetic energy.' },
      ],
      vary: [{ key: 'v', amp: 4, min: 1, label: 'v', color: 'a', say: 'Vary the speed: double it and the energy quadruples. That’s why crashes at speed are so much worse.' }],
    }),
    'Potential energy': play({
      own: true, values: { m: 5, h: 3 },
      intro: 'Lift a 5 kg box straight up onto a shelf.',
      scene: ({ m, h: ht }, h, k, u) => {
        const floorY = 380, sc = 50, x = 260, lift = ht * sc * u(2);
        let s = S.line(60, floorY, 500, floorY, 'ink', 2) + S.rect(x + 50, floorY - ht * sc, 140, 8, 'ink-soft', 'ink');
        s += block(x, floorY - lift, 60, 50, 'b', `${fmt(m)} kg`);
        s += S.fade(u(1), S.arrow(x - 50, floorY - lift - 25, x - 50, floorY - lift - 25 - 50, 'a', 3) + label(x - 58, floorY - lift - 50, `lift with mg = ${fmt(m * g)} N`, { fill: 'a', anchor: 'end', size: 12 }));
        s += S.fade(u(2), S.line(x + 220, floorY, x + 220, floorY - ht * sc, 'c', 2) + label(x + 228, floorY - (ht * sc) / 2, `h = ${fmt(ht)} m`, { fill: 'c', anchor: 'start', weight: 600 }));
        s += S.fade(u(3), label(620, 140, `W = ${fmt(m * g)} × ${fmt(ht)} = ${fmt(m * g * ht)} J`, { weight: 600, size: 16 }) + label(620, 168, 'stored, ready to fall back', { fill: 'muted', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'm']], color: 'b', say: 'm: the box’s mass.' },
        { parts: [[3, 'g']], color: 'a', say: 'g: to lift it steadily you push up with its weight, mg.' },
        { parts: [[4, 'h']], color: 'c', say: 'h: over the height h. Work = force × distance = mgh.' },
        { parts: [[0, 'E_p'], [1, ' = ']], say: 'E_p =: that work isn’t lost; it’s stored in the height. Let go and gravity gives it all back as motion.' },
      ],
      vary: [{ key: 'h', amp: 2, min: 0.5, label: 'h', color: 'c', say: 'Vary the height: higher shelf, more stored energy, in proportion.' }],
    }),
    'Elastic energy': play({
      own: true, values: { kk: 200, x: 0.3 },
      intro: 'Squeeze a spring. The further you push, the harder it pushes back.',
      scene: ({ kk, x }, h, k, u) => {
        const Gr = graph({ x0: 110, x1: 520, y0: 380, y1: 120, tMax: 0.6, vMax: 130, tLabel: 'compression x (m)', vLabel: 'force (N)', ticks: false });
        let s = Gr.s + S.fade(u(0), S.path(path(4, (q) => [Gr.X(q * 0.6), Gr.Y(Math.min(130, kk * q * 0.6))]), 'ink', 2.5) + label(Gr.X(0.02), Gr.Y(125), `F = kx, k = ${fmt(kk)} N/m`, { size: 12, anchor: 'start' }));
        s += S.fade(u(1), S.line(Gr.X(x), Gr.Y(0), Gr.X(x), Gr.Y(kk * x), 'a', 2, dashed('4 4')) + label(Gr.X(x), Gr.Y(0) + 20, `x = ${fmt(x)}`, { fill: 'a', size: 12 }) + label(Gr.X(x) + 6, Gr.Y(kk * x) - 6, `kx = ${fmt(kk * x)} N`, { size: 12, anchor: 'start' }));
        s += S.fade(u(2), S.poly([[Gr.X(0), Gr.Y(0)], [Gr.X(x), Gr.Y(kk * x)], [Gr.X(x), Gr.Y(0)]], 'c-soft', 'c', { 'stroke-width': 1.5 }) + S.rect(Gr.X(0), Gr.Y(kk * x), Gr.X(x) - Gr.X(0), Gr.Y(0) - Gr.Y(kk * x), null, 'muted', { 'stroke-width': 1, ...dashed('3 3') }));
        s += S.fade(u(3), label(640, 160, `½ × ${fmt(x)} × ${fmt(kk * x)}`, { size: 15 }) + label(640, 190, `= ${fmt(0.5 * kk * x * x, 1)} J`, { weight: 600, size: 18 }));
        s += spring(560, 300, 560 + 180 - x * 200, 'ink', 9, 12) + S.rect(560 + 180 - x * 200, 276, 30, 48, 'b-soft', 'b', { 'stroke-width': 2 }) + S.rect(548, 260, 12, 80, 'ink-soft', null);
        return s;
      },
      pieces: [
        { parts: [[3, 'k']], say: 'k: the spring’s stiffness. Its push grows in a straight line with the squeeze: F = kx.' },
        { parts: [[4, 'x²']], color: 'a', say: 'x: squeeze it by x. Work is the area under the force line, but the force wasn’t constant: it grew from 0 to kx.' },
        { parts: [[2, '½']], color: 'c', say: '½: the area is a triangle, half of the rectangle x × kx.' },
        { parts: [[0, 'E_e'], [1, ' = ']], color: 'c', say: 'E_e =: the energy stored in the spring, ½kx².' },
      ],
      vary: [{ key: 'x', amp: 0.25, min: 0.05, label: 'x', color: 'a', say: 'Vary the squeeze: the triangle grows in both width and height, so the energy grows with x².' }],
    }),
    Conservation: play({
      own: true, values: { pos: -1 },
      intro: 'A ball rolling in a smooth bowl, 2 kg, released from 5 m up.',
      scene: ({ pos }, h, k, u) => {
        const cx = 260, base = 370, H = 5, sc = 50, m = 2;
        const x = Math.max(-1, Math.min(1, pos)), y = H * x * x;
        let s = S.path(path(60, (q) => { const xx = -1.1 + 2.2 * q; return [cx + xx * 190, base - H * xx * xx * sc]; }), 'ink', 3);
        s += S.circle(cx + x * 190, base - y * sc - 12, 12, 'a');
        const PE = m * g * y, KE = m * g * H - PE, bs = 260 / (m * g * H), bx = 560, by = 370;
        s += S.fade(u(0), S.rect(bx, by - PE * bs, 70, PE * bs, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(bx + 35, by + 18, 'mgh', { fill: 'b', size: 12, weight: 600 }));
        s += S.fade(u(1), S.rect(bx, by - PE * bs - KE * bs, 70, KE * bs, 'a-soft', 'a', { 'stroke-width': 1.5 }) + (KE * bs > 14 ? label(bx + 80, by - PE * bs - (KE * bs) / 2 + 4, '½mv²', { fill: 'a', size: 12, weight: 600, anchor: 'start' }) : ''));
        s += S.fade(u(2), S.line(bx - 20, by - 260, bx + 90, by - 260, 'ink', 2, dashed('6 4')) + label(bx + 96, by - 256, `always ${fmt(m * g * H, 0)} J`, { size: 12, anchor: 'start', weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'mgh']], color: 'b', say: 'mgh: at the rim, all the energy is height.' },
        { parts: [[0, '½mv²'], [1, ' + ']], color: 'a', say: '½mv²: lower down, some has turned into motion.' },
        { parts: [[4, ' = const']], say: '= const: stacked together, the two always make the same total. Energy changes form; it doesn’t vanish.' },
      ],
      vary: [{ key: 'pos', amp: 1, min: -1, max: 1, label: 'position', color: 'a', say: 'Roll the ball across the bowl: the colours trade places, but the stack never changes height.' }],
    }),
    'Speed from height': play({
      own: true, values: { h: 5 },
      intro: 'Drop an apple from height h. How fast is it going at the bottom?',
      scene: ({ h: ht }, h, k, u) => {
        const floorY = 380, sc = 30, x = 160;
        let s = S.line(60, floorY, 300, floorY, 'ink', 2) + S.line(x + 40, floorY, x + 40, floorY - ht * sc, 'c', 2) + label(x + 48, floorY - (ht * sc) / 2, `h = ${fmt(ht)} m`, { fill: 'c', anchor: 'start', size: 13 });
        s += S.circle(x, floorY - ht * sc * (1 - u(2)) - 12, 12, 'a');
        s += work(340, 140, [
          ['top: all height, mgh', u(0), 'b'],
          ['bottom: all motion, ½mv²', u(0), 'a'],
          ['mgh = ½mv²', u(1)],
          ['cancel m:  v² = 2gh', u(2), 'c'],
          [`v = √(2 × 9.8 × ${fmt(ht)}) = ${fmt(Math.sqrt(2 * g * ht))} m/s`, u(2)],
        ]);
        return s;
      },
      pieces: [
        { parts: [[3, '(2gh)']], color: 'b', say: 'Energy at the top, mgh, equals energy at the bottom, ½mv².' },
        { parts: [[2, '√']], color: 'c', say: 'Every term has m, so it cancels: v² = 2gh. Take the square root.' },
        { parts: [[0, 'v'], [1, ' = ']], say: 'v =: an apple and a melon dropped from the same height land at the same speed.' },
      ],
      vary: [{ key: 'h', amp: 4, min: 0.5, label: 'h', color: 'c', say: 'Vary the height: four times higher only doubles the speed.' }],
    }),
  });

  // =====================================================================
  // Momentum and collisions
  // =====================================================================

  reg('m-momentum', {
    Momentum: play({
      own: true, values: { m: 2, v: 5 },
      intro: 'A football and a slow-rolling medicine ball. Which is harder to stop?',
      scene: ({ m, v }, h, k, u) => {
        const y = 230;
        let s = S.line(60, y, 740, y, 'grid2', 1.5) + S.circle(200, y - 26, 26, 'b-soft', 'b', { 'stroke-width': 2 }) + label(200, y - 22, `${fmt(m)} kg`, { fill: 'b', size: 12, weight: 600 });
        s += S.fade(u(1), S.arrow(232, y - 26, 232 + v * 20, y - 26, 'a', 3.5) + label(232 + v * 10, y - 40, `${fmt(v)} m/s`, { fill: 'a', size: 12 }));
        s += S.fade(u(2), S.rect(120, 300, m * v * 20, 26, 'c', null, { rx: 3 }) + label(120, 290, `p = ${fmt(m)} × ${fmt(v)} = ${fmt(m * v)} kg·m/s`, { fill: 'c', anchor: 'start', weight: 600 }) +
          S.rect(120, 356, 10 * 20, 26, 'grid2', null, { rx: 3 }) + label(120, 346, 'a 10 kg medicine ball at 1 m/s: 10 kg·m/s', { fill: 'muted', anchor: 'start', size: 12 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'm']], color: 'b', say: 'm: more mass, more to stop.' },
        { parts: [[3, 'v']], color: 'a', say: 'v: faster, more to stop. Direction counts: velocity has a sign.' },
        { parts: [[0, 'p'], [1, ' = ']], color: 'c', say: 'p =: momentum, “quantity of motion”: mass × velocity.' },
      ],
      vary: [{ key: 'v', amp: 5, min: -4, label: 'v', color: 'a', say: 'Vary the velocity: negative means moving left, and the momentum points left too.' }],
    }),
    Conservation: play({
      own: true, values: { m1: 2, v1: 4, m2: 3, v2: -1 },
      intro: 'Two carts on a smooth track, about to collide (and bounce).',
      scene: ({ m1, v1, m2, v2 }, h, k, u) => {
        const P = m1 * v1 + m2 * v2, w1 = (P - m2 * (v1 - v2)) / (m1 + m2), w2 = (P + m1 * (v1 - v2)) / (m1 + m2);
        const tt = u(1) * 2, after = u(2);
        const y = 180, w1x = 40 + m1 * 10, w2x = 40 + m2 * 10;
        const e1 = after > 0 ? w1 * after * 1.2 : v1 * (tt - 2) * 0.9, e2 = after > 0 ? w2 * after * 1.2 : v2 * (tt - 2) * 0.9;
        let s = S.line(60, y, 740, y, 'grid2', 1.5) + cart(400 + e1 * 30, y, w1x, 'a', `${fmt(m1)} kg`) + cart(400 + e2 * 30 + w2x, y, w2x, 'b', `${fmt(m2)} kg`);
        const pb = 14, row = (y0, a, b, title, o) => S.fade(o, label(100, y0 - 14, title, { anchor: 'start', size: 13, fill: 'muted' }) + S.line(400, y0 - 6, 400, y0 + 50, 'muted', 1) +
          S.rect(Math.min(400, 400 + a * pb), y0, Math.abs(a * pb), 14, 'a', null, { rx: 2 }) + S.rect(Math.min(400, 400 + b * pb), y0 + 16, Math.abs(b * pb), 14, 'b', null, { rx: 2 }) +
          S.rect(Math.min(400, 400 + (a + b) * pb), y0 + 34, Math.abs((a + b) * pb), 14, 'ink', null, { rx: 2 }) + label(400 + (a + b) * pb + 8, y0 + 46, `total ${fmt(a + b)}`, { size: 12, anchor: 'start' }));
        s += row(250, m1 * v1, m2 * v2, `before: ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × (${fmt(v2)})`, u(0));
        s += row(340, m1 * w1, m2 * w2, `after: ${fmt(m1)} × ${fmt(w1)} + ${fmt(m2)} × (${fmt(w2)})`, u(2));
        return s;
      },
      pieces: [
        { parts: [[0, 'm₁v₁ + m₂v₂']], color: 'a', say: 'Before: each cart’s momentum, added with signs. The black bar is the total.' },
        { parts: [[1, ' = ']], say: '=: during the crash, each cart pushes the other equally hard for the same time. What one gains, the other loses.' },
        { parts: [[2, 'm₁v₁′ + m₂v₂′']], color: 'b', say: 'After: the shares have changed completely, but the total bar is exactly the same length.' },
      ],
      vary: [{ key: 'm2', amp: 2, min: 0.5, label: 'm₂', color: 'b', say: 'Vary the second cart’s mass: the outcome changes, the before and after totals always match.' }],
    }),
    'Sticking together': play({
      own: true, values: { m1: 1000, v1: 20, m2: 1500, v2: 0 },
      intro: 'A car runs into a parked van and they lock together.',
      scene: ({ m1, v1, m2, v2 }, h, k, u) => {
        const P = m1 * v1 + m2 * v2, M = m1 + m2, vf = P / M, y = 200;
        const hit = u(1) > 0, xs = 380;
        let s = S.line(60, y, 740, y, 'grid2', 1.5);
        const together = hit ? u(2) * 120 : 0, carX = xs + (hit ? together : -(1 - u(0)) * 160);
        s += cart(carX, y, 70, 'a', 'car') + cart(xs + 110 + together, y, 110, 'b', 'van');
        const shift = together;
        s += S.fade(u(0), label(200, 270, `momentum: ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × ${fmt(v2)} = ${fmt(P)} kg·m/s`, { anchor: 'start', size: 14 }));
        s += S.fade(u(1), S.rect(xs + shift - 74, y - 44, 188, 52, null, 'ink', { rx: 8, ...dashed('5 4') }) + label(200, 304, `now one body of ${fmt(M)} kg`, { anchor: 'start', size: 14, fill: 'b' }));
        s += S.fade(u(2), label(200, 344, `v′ = ${fmt(P)} ÷ ${fmt(M)} = ${fmt(vf)} m/s`, { anchor: 'start', size: 17, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, '(m₁v₁ + m₂v₂)']], color: 'a', say: 'The total momentum before the crash. Nothing outside acts along the road, so it survives the crash unchanged.' },
        { parts: [[3, '/(m₁ + m₂)']], color: 'b', say: 'Afterwards it’s carried by one combined body with both masses.' },
        { parts: [[0, 'v′'], [1, ' = ']], say: 'v′ =: so the wreck moves at total momentum ÷ total mass.' },
      ],
      vary: [{ key: 'm2', amp: 1200, min: 100, label: 'm₂', color: 'b', say: 'Vary the van’s mass: a heavier van means a slower wreck.' }],
    }),
    Impulse: play({
      own: true, values: { F: 40, dt: 0.5 },
      intro: 'Kick a ball: a big force for a short time.',
      scene: ({ F, dt }, h, k, u) => {
        const Gr = graph({ x0: 100, x1: 480, y0: 380, y1: 120, tMax: 1.5, vMax: 120, vLabel: 'force (N)', ticks: false });
        let s = Gr.s;
        s += S.fade(u(0), S.line(Gr.X(0.2), Gr.Y(F), Gr.X(0.2 + dt * Math.max(u(1), 0.05)), Gr.Y(F), 'a', 3) + label(Gr.X(0.2) - 6, Gr.Y(F) + 4, `F = ${fmt(F)} N`, { fill: 'a', anchor: 'end', size: 12 }));
        s += S.fade(u(1), S.rect(Gr.X(0.2), Gr.Y(F), Gr.X(0.2 + dt) - Gr.X(0.2), Gr.Y(0) - Gr.Y(F), 'c-soft', 'c', { 'stroke-width': 1.5 }) + label(Gr.X(0.2 + dt / 2), Gr.Y(0) + 20, `Δt = ${fmt(dt)} s`, { fill: 'b', size: 12 }));
        s += S.fade(u(2), bar(620, 380, F * dt, 200 / 60, 'c', 'momentum gained', `${fmt(F * dt)} kg·m/s`, 60) + label(560, 120, `${fmt(F)} × ${fmt(dt)} = ${fmt(F * dt)}`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'F']], color: 'a', say: 'F: the force while the foot touches the ball.' },
        { parts: [[1, 'Δt']], color: 'b', say: 'Δt: how long it lasts. The area of the force–time rectangle is the impulse.' },
        { parts: [[2, ' = Δp']], color: 'c', say: '= Δp: the impulse is exactly the ball’s change in momentum (it’s just F = ma written with momentum).' },
      ],
      vary: [{ key: 'dt', amp: 0.4, min: 0.05, label: 'Δt', color: 'b', say: 'Vary the contact time: follow through for longer and the same force gives more momentum. Airbags use it backwards: more time, less force.' }],
    }),
  });
})();
