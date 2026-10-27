// Mechanics, part 1: describing motion. Loaded before newton.js so the section reads in learning order.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, M, sfx, pitch, note } = MV;
  const { caption, label, path, cart, graph } = MV.phys;
  const G = 'Mechanics';
  const op = (s) => `<span class="op">${s}</span>`;

  // =====================================================================
  // Uniform and uniformly varied motion
  // =====================================================================

  const T_RUN = 6;
  const motionConcept = {
    id: 'concept',
    label: 'Steady and accelerating',
    lede: 'Uniform motion covers equal distances in equal times. Uniformly varied motion changes its speed by the same amount every second.',
    build: 3.2,
    params: {
      v: { value: 4, min: 1, max: 8, step: 0.5, color: 'a', label: 'steady speed in m/s' },
      a: { value: 1.5, min: 0.5, max: 3, step: 0.25, color: 'b', label: 'acceleration in m/s²' },
    },
    sim: { duration: () => T_RUN },
    formula: (p, h) => `${h.v('s')}${op('=')}${h.n('v')}${op('×')}${h.v('t')}`,
    aside: ({ v, a }, h) => `<div>Accelerating from rest: ${h.v('v')} = ${h.n('a')}${h.v('t')}, ${h.v('s')} = ½ × ${h.val('a')} × ${h.v('t')}². After ${T_RUN} s: ${h.c('a', fmt(v * T_RUN), 'sa')} m against ${h.c('b', fmt(0.5 * a * T_RUN * T_RUN), 'sb')} m.</div>`,
    readout: ({ v, a }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('steady', fmt(v * t, 1), 'm', 'a') + h.ro('accelerating', fmt(0.5 * a * t * t, 1), 'm', 'b') + h.ro('its speed', fmt(a * t, 1), 'm/s', 'b'),
    steps: [
      { at: 0, hl: [], say: 'Two cars on a start line, with a ruler along each lane.' },
      { at: 0.3, hl: ['v'], say: ({ v }) => `The top car moves at a steady ${fmt(v)} m/s: uniform motion. Every second it covers the same ${fmt(v)} m.` },
      { at: 0.62, hl: ['a'], say: ({ a }) => `The bottom car starts from rest and gains ${fmt(a)} m/s every second: uniformly varied motion. Its speed grows in a straight line, so each second it covers more than the last.` },
    ],
    sfx: ({ v, a }) => [sfx.pop(0.3, note(5)), sfx.glide(0.32, 0.55, pitch(v), pitch(v)), sfx.pop(0.62, note(2)), sfx.glide(0.64, 0.9, pitch(0), pitch(4 * a)), sfx.chime(0.95, note(7))],
    simSay: ({ v, a }, h, { t }) => (t < 1.2
      ? 'Faint copies mark each second. Watch the gaps between them.'
      : `Top: every gap is ${fmt(v)} m, the same each second. Bottom: the gaps grow ${fmt(a / 2)}, ${fmt(1.5 * a)}, ${fmt(2.5 * a)} m… in the ratio 1 : 3 : 5 : 7, because the speed keeps climbing.`),
    simSfx: ({ v, a }) => Array.from({ length: T_RUN }, (_, i) => [sfx.tick(i + 1, pitch(v)), sfx.tick(i + 1.03, pitch(2 * Math.min(12, a * (i + 1))))]).flat(),
    draw({ v, a }, h, { k, t }) {
      const far = Math.max(v * T_RUN, 0.5 * a * T_RUN * T_RUN), X = (x) => 90 + (x / far) * 620;
      const lanes = [[160, (tt) => v * tt, () => v, 'a', 'steady'], [350, (tt) => 0.5 * a * tt * tt, (tt) => a * tt, 'b', 'accelerating']];
      const u0 = seg(k, 0, 0.28), u1 = seg(k, 0.3, 0.58), u2 = seg(k, 0.62, 0.92);
      let s = S.fade(u0, S.line(90, 70, 90, 380, 'muted', 1.5, dashed('4 5')) + caption(96, 66, 'start'));
      lanes.forEach(([y, pos, speed, col, name], li) => {
        const u = li ? u2 : u1;
        s += S.fade(u0, S.line(60, y, 760, y, 'grid2', 1.5) + caption(60, y - 64, name));
        const step = far > 60 ? 10 : 5;
        for (let m = 0; m <= far + 1e-9; m += step) s += S.fade(u0, S.line(X(m), y + 4, X(m), y + 10, 'grid2', 1.5) + S.text(X(m), y + 24, `${m}`, { fill: 'muted', size: 10 }));
        // Snapshots each second, with the distance covered in that second under the gap.
        for (let n = 1; n <= Math.floor(t + 1e-9); n++) {
          s += S.rect(X(pos(n)) - 2, y - 30, 4, 24, 'grid2', null);
          const mid = (X(pos(n - 1)) + X(pos(n))) / 2;
          s += S.text(mid, y + 44, fmt(pos(n) - pos(n - 1), 1), { fill: col, size: 11, weight: 600 });
        }
        const x = X(pos(t));
        s += S.fade(u || 0.3, cart(x, y, 46, col, '', pos(t) / 0.3));
        const sp = speed(t), L = Math.min(110, sp * 12) * (t > 0 ? 1 : u);
        if (L > 2) s += S.arrow(x + 4, y - 44, x + 4 + L, y - 44, col, 3) + S.text(x + 8 + L, y - 40, `${fmt(sp, 1)} m/s`, { fill: col, size: 11, anchor: 'start' });
      });
      return s;
    },
    theory: [
      ['Uniform motion', `In <em>uniform motion</em> the velocity is constant, so the position grows by the same amount every second: ${M('s = s_0 + vt')}. The graph of position against time is a straight line whose slope is the speed.`],
      ['Uniformly varied motion', `When the acceleration ${M('a')} is constant, the velocity changes by the same amount every second, ${M('v = v_0 + at')}. The position then follows ${M('s = s_0 + v_0 t + ½at^2')}: the ${M('½at^2')} term is the extra distance gained because the car is getting faster. Starting from rest, the distances covered in successive seconds go 1 : 3 : 5 : 7, as Galileo found by rolling balls down ramps.`],
      ['Torricelli’s equation', `Eliminate the time between the two equations and you get ${M('v^2 = v_0^2 + 2aΔs')}. It's handy when you know distances but not times, for example how far a car needs to stop from a given speed.`],
      ['Average speed', `With constant acceleration the velocity changes evenly, so the average velocity is exactly halfway between the start and end velocities: ${M('v_{avg} = (v_0 + v)/2')}. Multiply it by the time and you get the distance.`],
    ],
    practice: null,
  };

  // Braking: the car keeps its speed for the reaction time, then slows at a steady rate.
  const HAZARD = 60;
  const brake = ({ v, tr, a }) => {
    const ms = v / 3.6, dr = ms * tr, db = (ms * ms) / (2 * a), D = dr + db;
    const pos = (t) => (t < tr ? ms * t : t < tr + ms / a ? dr + ms * (t - tr) - 0.5 * a * (t - tr) ** 2 : D);
    const speed = (t) => (t < tr ? ms : Math.max(0, ms - a * (t - tr)));
    // If the hazard is closer than the stopping distance, find when and how fast the car reaches it.
    let hitT = Infinity, hitV = 0;
    if (D > HAZARD) {
      if (dr >= HAZARD) { hitT = HAZARD / ms; hitV = ms; } else { const rem = HAZARD - dr; hitV = Math.sqrt(ms * ms - 2 * a * rem); hitT = tr + (ms - hitV) / a; }
    }
    return { ms, dr, db, D, pos, speed, hitT, hitV };
  };
  const exBraking = {
    id: 'braking',
    label: 'Braking distance',
    lede: 'A ball rolls into the road 60 m ahead. Before the brakes even start, the car travels on at full speed while the driver reacts.',
    build: 1,
    compact: true,
    params: {
      v: { value: 72, min: 36, max: 126, step: 9, color: 'a', label: 'speed in km/h', digits: 0 },
      tr: { value: 1, min: 0.5, max: 2.5, step: 0.25, color: 'b', label: 'reaction time in seconds' },
      a: { value: 6, min: 3, max: 9, step: 0.5, color: 'c', label: 'braking deceleration in m/s²' },
    },
    sim: { duration: (p) => { const b = brake(p); return Math.min(12, Math.min(b.hitT, p.tr + b.ms / p.a) + 1.2); } },
    formula: (p, h) => { const b = brake(p); return `${h.v('d')}${op('=')}${h.c('a', fmt(b.ms, 1), 'ms')}${op('×')}${h.n('tr')}${op('+')}${h.frac(`${h.c('a', fmt(b.ms, 1), 'ms')}²`, `2${op('×')}${h.n('a')}`)}${op('=')}${h.r(b.D, 1)}${h.unit('m')}`; },
    aside: (p, h) => { const b = brake(p); return `<div>${h.n('v')} km/h is ${h.c('a', fmt(b.ms, 1), 'ms')} m/s. Reacting: ${h.c('b', fmt(b.dr, 1), 'dr')} m. Braking: ${h.c('c', fmt(b.db, 1), 'db')} m. ${b.D > HAZARD ? `<b>It reaches the ball at ${fmt(b.hitV * 3.6, 0)} km/h.</b>` : `It stops ${fmt(HAZARD - b.D, 1)} m short of the ball.`}</div>`; },
    readout: (p, h, { t }) => { const b = brake(p); return h.ro('time', fmt(t, 1), 's') + h.ro('speed', fmt(b.speed(Math.min(t, b.hitT)) * 3.6, 0), 'km/h') + h.ro('distance', fmt(b.pos(Math.min(t, b.hitT)), 1), 'm'); },
    steps: [{ at: 0, hl: [], say: 'A car on a straight road. A ball has just rolled out 60 m ahead.' }],
    simSay: (p, h, { t }) => {
      const b = brake(p);
      if (t >= b.hitT) return `The car hasn’t stopped in time. Its stopping distance is ${fmt(b.D, 0)} m but the ball was only 60 m away.`;
      if (t < p.tr) return `Reaction time: the driver sees the ball, but the foot hasn’t reached the brake yet. The car covers ${fmt(b.ms, 1)} m every second at full speed.`;
      if (b.speed(t) > 0) return `Braking: the speed drops by ${fmt(p.a)} m/s every second. Braking distance grows with the square of the speed.`;
      return `Stopped. Reacting took ${fmt(b.dr, 1)} m and braking ${fmt(b.db, 1)} m.`;
    },
    simSfx: (p) => { const b = brake(p); return [sfx.tick(0.02, note(9)), sfx.swoosh(p.tr, Math.min(b.hitT, p.tr + b.ms / p.a)), ...(b.hitT < Infinity ? [sfx.thud(b.hitT)] : [sfx.chime(p.tr + b.ms / p.a, note(4))])]; },
    draw(p, h, { k, t }) {
      const b = brake(p), far = Math.max(b.D, HAZARD) + 8, X = (x) => 60 + (x / far) * 680, y = 330;
      const tt = Math.min(t, b.hitT), x = b.pos(tt);
      let s = S.fade(seg(k, 0, 0.6), S.rect(40, y - 2, 720, 50, 'ink-soft', null, { rx: 4 }) + S.line(40, y + 23, 760, y + 23, 'paper', 2, dashed('16 14')));
      // The ball, waiting in the road.
      s += S.circle(X(HAZARD) + 12, y + 12, 9, 'c') + S.text(X(HAZARD) + 12, y + 42, 'ball, 60 m', { fill: 'c', size: 11 });
      // Reaction and braking distances, painted as the car covers them.
      const reach = Math.min(x, b.dr);
      s += S.rect(X(0), y + 54, X(reach) - X(0), 10, 'b', null, { rx: 2 });
      if (x > b.dr) s += S.rect(X(b.dr), y + 54, X(x) - X(b.dr), 10, 'c', null, { rx: 2 });
      if (t >= p.tr) s += S.text((X(0) + X(b.dr)) / 2, y + 80, `reacting ${fmt(b.dr, 1)} m`, { fill: 'b', size: 11, weight: 600 });
      if (t >= p.tr + 0.3 && x > b.dr) s += S.text((X(b.dr) + X(x)) / 2, y + 80, `braking ${fmt(x - b.dr, 1)} m`, { fill: 'c', size: 11, weight: 600 });
      // The car, brake lights on while braking.
      const cx = X(x) + 10, braking = tt >= p.tr && b.speed(tt) > 0;
      s += S.rect(cx - 56, y - 10, 56, 22, 'a', null, { rx: 6 }) + S.rect(cx - 44, y - 24, 30, 16, 'a', null, { rx: 5 }) + S.circle(cx - 44, y + 14, 7, 'ink') + S.circle(cx - 12, y + 14, 7, 'ink');
      if (braking) s += S.rect(cx - 60, y - 6, 6, 8, 'c', null, { rx: 2 });
      if (t >= b.hitT) s += S.text(X(HAZARD), y - 40, `hit at ${fmt(b.hitV * 3.6, 0)} km/h`, { fill: 'c', size: 14, weight: 600 });
      // Speed against time: the area under it is the distance (rectangle while reacting, triangle while braking).
      const tStop = p.tr + b.ms / p.a;
      const Gr = graph({ x0: 440, x1: 760, y0: 220, y1: 60, tMax: Math.max(4, tStop + 0.5), vMax: 36, vLabel: 'speed (m/s)' });
      s += S.fade(seg(k, 0, 0.6), Gr.s);
      const tr2 = Math.min(tt, p.tr);
      s += S.rect(Gr.X(0), Gr.Y(b.ms), Gr.X(tr2) - Gr.X(0), Gr.Y(0) - Gr.Y(b.ms), 'b-soft', null);
      if (tt > p.tr) s += S.poly([[Gr.X(p.tr), Gr.Y(0)], [Gr.X(p.tr), Gr.Y(b.ms)], [Gr.X(tt), Gr.Y(b.speed(tt))], [Gr.X(tt), Gr.Y(0)]], 'c-soft', null);
      s += S.path(path(60, (u) => { const q = u * tt; return [Gr.X(q), Gr.Y(b.speed(q))]; }), 'ink', 2.5);
      s += S.fade(seg(k, 0, 0.6), caption(60, 120, 'The shaded area under the speed graph') + caption(60, 138, 'is the distance travelled.'));
      return s;
    },
    theory: [
      ['Two distances', `Stopping takes two stages. During the <em>reaction time</em> ${M('t_r')} the car keeps its speed and covers ${M('v t_r')}. Then the brakes give a deceleration ${M('a')}, and by Torricelli's equation the car needs ${M('v^2/2a')} to stop. The stopping distance is ${M('d = v t_r + v^2/2a')}.`],
      ['Speed is squared', `The braking distance grows with the <em>square</em> of the speed: twice as fast needs four times the braking distance. Going from 50 to 70 km/h roughly doubles it. A wet road halves the deceleration and doubles the braking distance again.`],
      ['Reaction time', `An alert driver reacts in about 0.7 to 1 s; tired, drunk or looking at a phone, 2 s or more. Every extra second at 90 km/h is another 25 m covered before the brakes even start.`],
    ],
    practice: (p, h) => { const b = brake(p); return [
      `At ${h.val('v')} km/h, every 0.25 s of extra reaction time costs ${h.r(b.ms * 0.25, 1)} m.`,
      `At double the speed, ${fmt(2 * p.v)} km/h, the braking distance would be ${h.r(4 * b.db, 0)} m, four times as far.`,
    ]; },
  };

  MV.register({ realm: 'phys', id: 'm-motion', group: G, symbol: '→', title: 'Uniform and varied motion', modes: [motionConcept, exBraking] });

  // =====================================================================
  // Graphs of motion
  // =====================================================================

  const TG = 8;
  const range = (f, T) => { let lo = 0, hi = 0; for (let i = 0; i <= 80; i++) { const y = f((i / 80) * T); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
  // Shaded area between a velocity curve and the axis up to time t: above in cobalt, below in rose.
  function areaUnder(Gr, vel, t, n = 60) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * t, t1 = ((i + 1) / n) * t, v0 = vel(t0), v1 = vel(t1);
      s += S.poly([[Gr.X(t0), Gr.Y(0)], [Gr.X(t0), Gr.Y(v0)], [Gr.X(t1), Gr.Y(v1)], [Gr.X(t1), Gr.Y(0)]], (v0 + v1) >= 0 ? 'a-soft' : 'c-soft', null);
    }
    return s;
  }

  const graphsConcept = {
    id: 'concept',
    label: 'Slope and area',
    lede: 'The steepness of a position graph is the velocity. The area under a velocity graph is how far the object moved.',
    build: 3.6,
    compact: true,
    params: {
      v0: { value: 3, min: -3, max: 6, step: 0.5, color: 'a', label: 'starting velocity in m/s' },
      a: { value: -0.75, min: -2, max: 2, step: 0.25, color: 'b', label: 'acceleration in m/s²' },
    },
    sim: { duration: () => TG },
    formula: (p, h) => `${h.v('Δx')}${op('=')}${h.n('v0')}${op('×')}${TG}${op('+')}½${op('×')}${h.n('a')}${op('×')}${TG}²${op('=')}${h.r(p.v0 * TG + 0.5 * p.a * TG * TG, 1)}${h.unit('m')}`,
    aside: ({ v0, a }, h) => `<div>Velocity after ${TG} s: ${h.v('v')} = ${h.val('v0')} + ${h.val('a')} × ${TG} = ${h.c('ink', fmt(v0 + a * TG), 'vend')} m/s, the end of the straight line.</div>`,
    readout: ({ v0, a }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('x', fmt(v0 * t + 0.5 * a * t * t, 1), 'm', 'ink') + h.ro('v', fmt(v0 + a * t, 1), 'm/s', 'a'),
    steps: [
      { at: 0, hl: [], say: 'A cart on a track. Its position x is measured from the 0 mark; right is positive.' },
      { at: 0.22, hl: ['v0', 'a'], say: 'Position against time. Where the curve is steep the cart is fast; where it’s flat the cart is momentarily still.' },
      { at: 0.5, hl: ['a'], say: 'Velocity against time: a straight line, because the acceleration is constant. Its slope is the acceleration.' },
      { at: 0.76, hl: ['res'], say: 'The area between the velocity line and the axis is the displacement. Area below the axis counts as negative: the cart going backwards.' },
    ],
    sfx: ({ v0, a }) => [sfx.pop(0.22, note(4)), sfx.curve(0.24, 0.48, Array.from({ length: 20 }, (_, i) => { const t = (i / 19) * TG; return pitch(2 * (v0 * t + 0.5 * a * t * t) / 4); })),
      sfx.pop(0.5, note(6)), sfx.glide(0.52, 0.72, pitch(3 * v0), pitch(3 * (v0 + a * TG))), sfx.swoosh(0.76, 0.95)],
    simSay: ({ v0, a }, h, { t }) => {
      const v = v0 + a * t;
      if (Math.abs(v) < 0.15) return 'Velocity zero: the position graph is flat right here, at its turning point.';
      return v > 0 ? `Moving forward at ${fmt(v, 1)} m/s: the tangent to the position curve slopes up by exactly that much per second, and the area builds up above the axis.`
        : `Moving backwards at ${fmt(-v, 1)} m/s: the position curve slopes down and the new area is below the axis, taking away from the displacement.`;
    },
    simSfx: ({ v0, a }) => [sfx.curve(0, TG, Array.from({ length: 40 }, (_, i) => pitch(3 * (v0 + (a * i * TG) / 39))))],
    draw({ v0, a }, h, { k, t }) {
      const x = (tt) => v0 * tt + 0.5 * a * tt * tt, vel = (tt) => v0 + a * tt;
      const [lo, hi] = range(x, TG), span = Math.max(4, hi - lo), XT = (v) => 100 + ((v - lo) / span) * 600;
      const u0 = seg(k, 0, 0.2), u1 = seg(k, 0.22, 0.46), u2 = seg(k, 0.5, 0.72), u3 = seg(k, 0.76, 0.96);
      const tt = t > 0 ? t : 0;
      // Track and cart.
      let s = S.fade(u0, S.line(80, 100, 720, 100, 'grid2', 1.5) + S.line(XT(0), 92, XT(0), 108, 'ink', 2) + S.text(XT(0), 124, '0', { fill: 'muted', size: 11 }) + caption(80, 50, 'track'));
      const cx = XT(x(tt));
      s += S.fade(u0, S.rect(cx - 16, 78, 32, 18, 'ink', null, { rx: 4 }) + S.circle(cx - 9, 98, 4, 'ink') + S.circle(cx + 9, 98, 4, 'ink'));
      const vv = vel(tt);
      if (Math.abs(vv) > 0.1) s += S.fade(u0, S.arrow(cx, 66, cx + vv * 14, 66, 'a', 2.5));
      // Position graph with the tangent at the current time.
      const P = graph({ x0: 70, x1: 370, y0: 390, y1: 190, tMax: TG, vMax: Math.max(hi, 1) + 0.5, vMin: Math.min(lo, 0) - 0.5, vLabel: 'position x (m)' });
      const V = graph({ x0: 450, x1: 760, y0: 390, y1: 190, tMax: TG, vMax: Math.max(v0, v0 + a * TG, 1) + 0.5, vMin: Math.min(v0, v0 + a * TG, 0) - 0.5, vLabel: 'velocity v (m/s)' });
      s += S.fade(u1, P.s) + S.fade(u2, V.s);
      s += S.path(path(80, (u) => [P.X(u * TG), P.Y(x(u * TG))]), 'ink', 1.5, { opacity: 0.35, ...MV.drawOn(u1) });
      s += S.path(path(10, (u) => [V.X(u * TG), V.Y(vel(u * TG))]), 'a', 1.5, { opacity: 0.35, ...MV.drawOn(u2) });
      // Built ending: show the whole area; while running, the area up to now.
      const shown = t > 0 ? tt : TG * u3;
      if (shown > 0) s += areaUnder(V, vel, shown);
      if (t > 0) {
        s += S.path(path(60, (u) => [P.X(u * tt), P.Y(x(u * tt))]), 'ink', 3) + S.path(path(4, (u) => [V.X(u * tt), V.Y(vel(u * tt))]), 'a', 3);
        const px = P.X(tt), py = P.Y(x(tt)), dt = 1.2;
        s += S.line(P.X(tt - dt), P.Y(x(tt) - vv * dt), P.X(tt + dt), P.Y(x(tt) + vv * dt), 'a', 1.5, dashed('5 4')) + S.circle(px, py, 5, 'ink');
        s += S.circle(V.X(tt), V.Y(vv), 5, 'a');
        s += S.text(P.X(0) + 8, P.Y(Math.max(hi, 1)) + 4, `slope = v = ${fmt(vv, 1)} m/s`, { fill: 'a', size: 11, anchor: 'start', weight: 600 });
      }
      if (shown > 0) s += S.text(V.X(0) + 8, 206, `area = Δx = ${fmt(x(shown), 1)} m`, { fill: 'ink', size: 11, anchor: 'start', weight: 600 });
      return s;
    },
    theory: [
      ['Slope of a position graph', `On a graph of position against time, the velocity is how fast the position changes: the slope of the curve, ${M('v = Δx/Δt')}. A straight line means a constant velocity; a curve that gets steeper means speeding up; a flat stretch means the object is at rest. Where the curve peaks and turns, the velocity is momentarily zero.`],
      ['Slope of a velocity graph', `In the same way, the slope of a velocity–time graph is the acceleration, ${M('a = Δv/Δt')}. For uniformly varied motion it's a straight line; for uniform motion it's flat.`],
      ['Area under a velocity graph', `Over a short time ${M('Δt')} the object moves ${M('v·Δt')}: a thin strip of the area under the velocity graph. Add all the strips and the total area is the displacement. For a straight line the area is a trapezoid, ${M('Δx = (v_0 + v)t/2')}, which is the same as ${M('v_0 t + ½at^2')}. Area below the axis is negative: motion backwards.`],
      ['Displacement and distance', `Displacement is the change in position and can cancel out; distance travelled is everything covered and can't. A cart that goes 10 m forward and 10 m back has a displacement of 0 but has travelled 20 m: the areas above and below the axis are equal.`],
    ],
    practice: null,
  };

  // A round trip: speed up, cruise, brake, wait at the shop, then walk back at a steady pace.
  const trip = ({ vmax, c }) => {
    const t1 = 2, t2 = t1 + c, t3 = t2 + 2, t4 = t3 + 2;
    const d1 = vmax, d2 = d1 + vmax * c, d3 = d2 + vmax, back = vmax / 2, t5 = t4 + d3 / back;
    const vel = (t) => (t < t1 ? (vmax * t) / t1 : t < t2 ? vmax : t < t3 ? vmax * (1 - (t - t2) / 2) : t < t4 ? 0 : t < t5 ? -back : 0);
    const pos = (t) => (t < t1 ? (vmax * t * t) / 4 : t < t2 ? d1 + vmax * (t - t1) : t < t3 ? d2 + vmax * (t - t2) - (vmax / 4) * (t - t2) ** 2 : t < t4 ? d3 : Math.max(0, d3 - back * (t - t4)));
    return { t1, t2, t3, t4, t5, d3, vel, pos, back };
  };
  const exTrip = {
    id: 'trip',
    label: 'A round trip',
    lede: 'Cycle to the shop, wait, and walk the bike home. The graphs tell the whole story, including that you ended up where you began.',
    build: 1,
    params: {
      vmax: { value: 6, min: 3, max: 8, step: 0.5, color: 'a', label: 'cycling speed in m/s' },
      c: { value: 3, min: 1, max: 5, step: 0.5, color: 'b', label: 'seconds at full speed' },
    },
    sim: { duration: (p) => trip(p).t5 + 0.5 },
    formula: (p, h) => { const T = trip(p); return `${h.c('a', fmt(T.d3, 0), 'out')}${op('−')}${h.c('c', fmt(T.d3, 0), 'back')}${op('=')}${h.r(0)}${h.unit('m displacement')}`; },
    aside: (p, h) => { const T = trip(p); return `<div>Area above the axis: ${h.c('a', fmt(T.d3, 0), 'out')} m out. Area below: ${h.c('c', fmt(T.d3, 0), 'back')} m back. Distance travelled: ${h.c('ink', fmt(2 * T.d3, 0), 'dist')} m.</div>`; },
    readout: (p, h, { t }) => { const T = trip(p); return h.ro('time', fmt(t, 1), 's') + h.ro('x', fmt(T.pos(t), 1), 'm') + h.ro('v', fmt(T.vel(t), 1), 'm/s', 'a'); },
    steps: [{ at: 0, hl: [], say: 'Home on the left, the shop on the right.' }],
    simSay: (p, h, { t }) => {
      const T = trip(p);
      if (t < T.t1) return 'Speeding up: the position curve bends upward and the velocity line climbs.';
      if (t < T.t2) return 'Full speed: a straight, steep position line and a flat velocity line.';
      if (t < T.t3) return 'Braking: the position curve flattens out as the velocity falls to zero.';
      if (t < T.t4) return 'Waiting at the shop: position flat, velocity zero. No area is added.';
      if (t < T.t5) return 'Walking home: the position falls, so the velocity is negative and the area builds up below the axis.';
      return 'Back home: the area below cancels the area above. Displacement zero, but plenty of distance travelled.';
    },
    simSfx: (p) => { const T = trip(p); return [sfx.glide(0, T.t1, pitch(0), pitch(7)), sfx.tick(T.t2, note(5)), sfx.glide(T.t2, T.t3, pitch(7), pitch(0)), sfx.chime(T.t3 + 0.1, note(7)), sfx.tick(T.t4, note(2)), sfx.chime(T.t5, note(4))]; },
    draw(p, h, { k, t }) {
      const T = trip(p), XT = (v) => 110 + (v / Math.max(T.d3, 1)) * 560;
      let s = S.fade(seg(k, 0, 0.6), S.line(80, 110, 720, 110, 'grid2', 1.5) +
        S.poly([[XT(0) - 22, 110], [XT(0) - 22, 84], [XT(0) - 32, 84], [XT(0), 62], [XT(0) + 32, 84], [XT(0) + 22, 84], [XT(0) + 22, 110]], 'ink-soft', 'ink', { 'stroke-width': 1.5 }) + label(XT(0), 134, 'home', { fill: 'muted', size: 11 }) +
        S.rect(XT(T.d3) - 26, 70, 52, 40, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(XT(T.d3), 134, 'shop', { fill: 'b', size: 11 }));
      const x = XT(T.pos(t)), back = t >= T.t4;
      s += S.circle(x - 9, 102, 7, null, back ? 'c' : 'a', { 'stroke-width': 2 }) + S.circle(x + 9, 102, 7, null, back ? 'c' : 'a', { 'stroke-width': 2 }) + S.line(x - 9, 102, x + 9, 102, back ? 'c' : 'a', 2);
      const P = graph({ x0: 70, x1: 370, y0: 390, y1: 200, tMax: T.t5 + 0.5, vMax: T.d3 * 1.1, vLabel: 'position x (m)' });
      const V = graph({ x0: 450, x1: 760, y0: 390, y1: 200, tMax: T.t5 + 0.5, vMax: p.vmax + 1, vMin: -T.back - 1, vLabel: 'velocity v (m/s)' });
      s += S.fade(seg(k, 0, 0.6), P.s + V.s);
      if (t > 0) {
        s += areaUnder(V, T.vel, Math.min(t, T.t5), 120);
        s += S.path(path(120, (u) => [P.X(u * t), P.Y(T.pos(u * t))]), 'ink', 3) + S.path(path(160, (u) => [V.X(u * t), V.Y(T.vel(u * t))]), 'a', 2.5);
      }
      return s;
    },
    theory: [
      ['Reading the story', `Each stretch of the trip has its own shape. Speeding up: a curve bending upward on the position graph, a rising line on the velocity graph. Cruising: a straight sloped line, and a flat velocity. Waiting: flat position, zero velocity. Coming back: position falling, velocity negative.`],
      ['Areas cancel', `The area under the velocity graph above the axis is the distance out; the area below is the distance back. Their sum, with signs, is the displacement: zero for a round trip. The total area, ignoring signs, is the distance travelled.`],
    ],
    practice: (p, h) => { const T = trip(p); return [
      `The trip out covers ${h.r(T.d3, 0)} m, so the whole journey is ${h.r(2 * T.d3, 0)} m of travel for 0 m of displacement.`,
      `The average velocity for the whole trip is 0; the average speed is ${h.r((2 * T.d3) / T.t5, 2)} m/s.`,
    ]; },
  };

  MV.register({ realm: 'phys', id: 'm-graphs', group: G, symbol: '↗', title: 'Motion graphs', modes: [graphsConcept, exTrip] });
})();
