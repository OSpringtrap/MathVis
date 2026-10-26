(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, niceStep, M, MINUS, sfx, pitch, note } = MV;
  const G = 'Newton’s laws';
  const op = (s) => `<span class="op">${s}</span>`;
  const G_ACC = 9.8;

  // ---------- Small props ----------

  const caption = (x, y, text) => S.text(x, y, text, { anchor: 'start', fill: 'muted', size: 13 });
  const wheels = (xs, y, spin) => xs.map((x) =>
    S.circle(x, y - 6, 6.5, 'ink') + S.line(x, y - 6, x + 5 * Math.cos(spin), y - 6 + 5 * Math.sin(spin), 'paper', 1.5)).join('');
  const figure = (x, y, color, scale = 1) => {
    const k = scale;
    return S.line(x, y - 22 * k, x - 9 * k, y, color, 3.5) + S.line(x, y - 22 * k, x + 9 * k, y, color, 3.5) +
      S.line(x, y - 22 * k, x, y - 42 * k, color, 4) + S.line(x - 12 * k, y - 34 * k, x + 12 * k, y - 34 * k, color, 3) +
      S.circle(x, y - 51 * k, 8 * k, color);
  };
  // Time graph: returns mapping functions plus its axes.
  function graph({ x0 = 90, x1 = 740, y0 = 390, y1 = 230, tMax, vMax, vMin = 0, tLabel = 'time (s)', vLabel }) {
    const X = (t) => x0 + (t / tMax) * (x1 - x0), Y = (v) => y0 - ((v - vMin) / (vMax - vMin)) * (y0 - y1);
    let s = '';
    const ts = niceStep(tMax / 8), vs = niceStep((vMax - vMin) / 4);
    for (let t = 0; t <= tMax + 1e-9; t += ts) s += S.line(X(t), y0, X(t), y1, 'grid', 1) + S.text(X(t), y0 + 18, fmt(t), { fill: 'muted', size: 11 });
    for (let v = Math.ceil(vMin / vs) * vs; v <= vMax + 1e-9; v += vs) s += S.line(x0, Y(v), x1, Y(v), 'grid', 1) + S.text(x0 - 8, Y(v) + 4, fmt(v), { fill: 'muted', size: 11, anchor: 'end' });
    s += S.line(x0, y0, x1, y0, 'grid2', 1.5) + S.line(x0, y0, x0, y1, 'grid2', 1.5);
    s += S.text(x1, y0 + 34, tLabel, { fill: 'muted', size: 12, anchor: 'end' }) + S.text(x0, y1 - 10, vLabel, { fill: 'muted', size: 12, anchor: 'start' });
    return { X, Y, s };
  }
  const path = (n, f) => Array.from({ length: n + 1 }, (_, i) => { const [x, y] = f(i / n); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ');

  // =====================================================================
  // First law
  // =====================================================================

  const firstConcept = {
    id: 'concept',
    label: 'The law',
    lede: 'An object keeps doing what it’s doing, staying still or moving at a steady speed in a straight line, unless a force makes it change.',
    build: 1.2,
    params: {
      v: { value: 4, min: 1, max: 6, step: 0.5, color: 'a', label: 'starting speed in m/s' },
      f: { value: 1.5, min: 0, max: 3, step: 0.25, color: 'b', label: 'friction on the lower puck in newtons' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('F')}${op('=')}0${op('⇒')}${h.v('v')}${op('=')}${h.n('v')}${h.unit('m/s, unchanged')}`,
    aside: ({ v, f }, h) => (f > 0
      ? `<div>On the floor, a friction force of ${h.n('f')} N takes ${fmt(f)} m/s off its speed every second: it stops after ${h.c('ink', fmt(v / f))} s.</div>`
      : `<div>Friction ${h.n('f')}: no force on either puck, so both keep going exactly alike.</div>`),
    readout: ({ v, f }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('ice puck', fmt(v), 'm/s', 'a') + h.ro('floor puck', fmt(Math.max(0, v - f * t), 2), 'm/s', 'b'),
    steps: [{ at: 0, hl: [], say: 'Two identical pucks get the same shove: one on smooth ice, one on a rough floor. Faint copies mark every half second.' }],
    simSay: ({ v, f }, h, { t }) => {
      if (f === 0) return 'No force acts on either puck, so neither changes: equal gaps, every half second, for both.';
      return t < v / f
        ? `Ice: no force, so the speed stays ${fmt(v)} m/s and the gaps stay equal. Floor: friction is a force, so that puck slows and its gaps shrink.`
        : 'The floor puck has stopped. The ice puck carries on at the same speed, and would forever if nothing got in its way.';
    },
    // The ice puck ticks a steady rhythm; the floor puck's ticks bunch up and stop.
    simSfx: ({ v, f }) => {
      const ev = [];
      for (let t = 0.5; t < 6; t += 0.5) ev.push(sfx.tick(t, note(7)));
      const stop = f > 0 ? v / f : 6;
      for (let t = 0.5; t < Math.min(6, stop); t += 0.5) ev.push(sfx.tick(t + 0.02, note(2)));
      if (f > 0 && stop < 6) ev.push(sfx.thud(stop));
      return ev;
    },
    draw({ v, f }, h, { k, t }) {
      const X = (m) => 60 + m * 19, y1 = 150, y2 = 320;
      const stop = f > 0 ? v / f : Infinity;
      const xf = (tt) => (tt < stop ? v * tt - 0.5 * f * tt * tt : (v * v) / (2 * f));
      let s = S.fade(seg(k, 0, 0.6),
        caption(60, y1 - 70, 'Smooth ice: no force') + S.rect(X(0), y1, X(36) - X(0), 10, 'a-soft', null, { rx: 3 }) +
        caption(60, y2 - 70, 'Rough floor: friction pushes back') + S.rect(X(0), y2, X(36) - X(0), 10, 'b-soft', null, { rx: 3 }));
      for (let m = 0; m <= 36; m += 6) s += S.fade(seg(k, 0, 0.6), S.text(X(m), y2 + 30, `${m} m`, { fill: 'muted', size: 11 }));
      const puck = (x, y, color, ghost) => (ghost
        ? S.rect(x - 17, y - 20, 34, 20, null, 'grid2', { rx: 6, 'stroke-width': 1.5 })
        : S.rect(x - 17, y - 20, 34, 20, color, null, { rx: 6 }));
      for (let tau = 0.5; tau < t - 1e-9; tau += 0.5) s += puck(X(v * tau), y1, 'a', true) + (tau < stop ? puck(X(xf(tau)), y2, 'b', true) : '');
      const xi = X(v * t), xb = X(xf(t)), vb = Math.max(0, v - f * t);
      s += puck(xi, y1, 'a') + S.arrow(xi, y1 - 34, xi + v * 12, y1 - 34, 'a', 3);
      s += puck(xb, y2, 'b');
      if (vb > 0) s += S.arrow(xb, y2 - 34, xb + vb * 12, y2 - 34, 'b', 3);
      if (vb > 0 && f > 0) s += S.arrow(xb - 18, y2 - 10, xb - 18 - f * 16, y2 - 10, 'c', 3) + S.text(xb - 22 - f * 16, y2 - 16, 'friction', { fill: 'c', size: 11, anchor: 'end' });
      return s;
    },
    theory: [
      ['The law', `Newton's first law: an object stays at rest, or keeps moving in a straight line at a steady speed, unless a net force acts on it. In symbols, ${M('ΣF = 0 ⇒ Δv = 0')}: if all the forces add up to zero, the velocity doesn't change. This tendency to keep doing the same thing is called <em>inertia</em>.`],
      ['Forces change motion, they don’t cause it', `For two thousand years people followed Aristotle in thinking that moving things need a push to keep moving. Galileo and Newton saw that this is backwards: motion carries on by itself. A force is needed only to <em>change</em> motion, to start it, stop it, speed it up, slow it down or turn it. The puck on the floor stops not because its "push runs out" but because friction is a force acting on it.`],
      ['Why it isn’t obvious', `On Earth, friction and air resistance are almost everywhere, so things seem to slow down "naturally". Take them away, on ice, on an air-hockey table, or in space, and objects glide on and on. The Voyager probes, launched in 1977, are still coasting out of the solar system at about 17 km/s with their engines off.`],
      ['Balanced forces', `"No net force" doesn't mean no forces. A book on a table has gravity pulling down and the table pushing up; a car cruising at a steady speed has the engine's push balancing drag. Whenever the forces cancel, the motion stays exactly as it is.`],
    ],
    practice: null,
  };

  const exBus = {
    id: 'bus',
    label: 'Braking bus',
    lede: 'When a bus brakes, a loose bag slides forward. Nothing pushes it forward: it simply keeps the speed the bus had.',
    build: 1,
    params: {
      v: { value: 12, min: 5, max: 20, step: 1, color: 'a', label: 'bus speed in m/s' },
      d: { value: 4, min: 2, max: 8, step: 0.5, color: 'b', label: 'braking in m/s²' },
    },
    sim: {
      duration: ({ v, d }) => {
        const tb = v / d, gap = 6;
        const th = 0.5 * d * tb * tb >= gap ? Math.sqrt((2 * gap) / d) : tb + (gap - 0.5 * d * tb * tb) / v;
        return Math.min(10, Math.max(tb, th) + 1);
      },
    },
    formula: (p, h) => `${h.v('F')}<sub>bag</sub>${op('=')}0${op('⇒')}${h.v('v')}<sub>bag</sub>${op('=')}${h.n('v')}${h.unit('m/s')}`,
    aside: ({ v, d }, h) => `<div>The bus brakes at ${h.n('d')} m/s² and stops in ${h.c('ink', fmt(v / d))} s. The bag, with nothing slowing it, doesn’t.</div>`,
    readout: ({ v, d }, h, { t }) => h.ro('bus', fmt(Math.max(0, v - d * t), 1), 'm/s', 'b') + h.ro('bag', fmt(bagState(v, d, t).speed, 1), 'm/s', 'a'),
    steps: [{ at: 0, hl: [], say: 'A bus driving along. A passenger is belted in; a bag sits loose on a slippery floor.' }],
    simSay: ({ v, d }, h, { t }) => (bagState(v, d, t).hit
      ? 'The bag hits the front wall: only now does a force act on it, and it stops.'
      : 'The brakes push back on the bus and on the belted passenger. Nothing pushes back on the bag, so it keeps its speed and slides forward.'),
    simSfx: ({ v, d }) => [sfx.swoosh(0, Math.min(2, v / d)), sfx.thud(bagState(v, d, 0).hitTime)],
    draw({ v, d }, h, { k, t }) {
      const sc = 40, front = 640, rear = front - 12 * sc, y = 300;
      const tb = v / d, xb = t < tb ? v * t - 0.5 * d * t * t : (v * v) / (2 * d);
      const bag = bagState(v, d, t);
      let s = S.fade(seg(k, 0, 0.6), S.line(40, y + 22, 760, y + 22, 'grid2', 1.5) + caption(40, 60, 'Seen from beside the bus, moving with it'));
      // Road markings slide back as the bus moves forward.
      for (let g = Math.floor((xb - 20) / 4) * 4; g < xb + 20; g += 4) {
        const x = 400 + (g - xb) * sc;
        if (x > 40 && x < 740) s += S.line(x, y + 36, Math.min(760, x + 2 * sc), y + 36, 'grid2', 3);
      }
      s += S.rect(rear, y - 150, front - rear, 150, 'b-soft', 'b', { rx: 14, 'stroke-width': 2 });
      s += S.rect(front - 60, y - 130, 46, 50, 'card', 'b', { rx: 6, 'stroke-width': 1.5 });
      s += wheels([rear + 70, front - 70], y + 22, xb / 0.5);
      // Belted passenger stays in the seat.
      s += S.rect(rear + 150, y - 70, 40, 60, 'ink-soft', null, { rx: 6 }) + figure(rear + 175, y - 10, 'ink', 0.9) + S.line(rear + 160, y - 45, rear + 185, y - 20, 'c', 3);
      // The loose bag slides forward relative to the bus.
      const bx = front - 6 * sc + bag.rel * sc;
      s += S.rect(bx - 18, y - 30, 36, 30, 'a', null, { rx: 6 });
      if (!bag.hit && bag.speed > 0) s += S.arrow(bx, y - 44, bx + Math.min(60, bag.relSpeed * 10), y - 44, 'a', 2.5);
      s += S.text(bx, y - 52 - (bag.hit ? 0 : 6), 'bag', { fill: 'a', size: 12, weight: 600 });
      if (t < tb) s += S.arrow(rear - 10, y - 100, rear - 10 - d * 10, y - 100, 'c', 3) + S.text(rear - 14 - d * 10, y - 108, 'braking', { fill: 'c', size: 11, anchor: 'end' });
      return s;
    },
    theory: [
      ['Who gets pushed', `The brakes push back on the wheels, the bus pushes back on the belted passenger through the belt, and so both slow down. The bag on a slippery floor has no such force, so by the first law it keeps moving at the bus's original speed. To the people inside, it looks like the bag is "thrown forward", but really the bus is slowing down around it.`],
      ['Why seat belts', `In a crash, a car can stop in a fraction of a second. An unbelted passenger keeps going at the car's old speed until something, the dashboard or windscreen, stops them over a very short distance. A seat belt applies the stopping force earlier, over a longer distance, and to the strong parts of the body.`],
    ],
    practice: ({ v }, h) => [
      `At ${h.val('v')} m/s (${h.r(v * 3.6, 0)} km/h), an unbelted passenger keeps that speed when the car stops, the same as falling from ${h.r((v * v) / (2 * G_ACC), 1)} m.`,
      `Pull a tablecloth fast enough and the dishes stay put: the cloth's brief grip isn't enough force to get them moving.`,
    ],
  };
  function bagState(v, d, t) {
    const tb = v / d, gap = 6;
    const relAt = (tt) => (tt < tb ? 0.5 * d * tt * tt : 0.5 * d * tb * tb + v * (tt - tb));
    const hitTime = 0.5 * d * tb * tb >= gap ? Math.sqrt((2 * gap) / d) : tb + (gap - 0.5 * d * tb * tb) / v;
    if (t >= hitTime) return { rel: gap, hit: true, hitTime, speed: Math.max(0, v - d * t), relSpeed: 0 };
    return { rel: relAt(t), hit: false, hitTime, speed: v, relSpeed: t < tb ? d * t : v };
  }

  const exProbe = {
    id: 'probe',
    label: 'Coasting in space',
    lede: 'Far out in space there’s no friction and no air. Fire the engine briefly and the probe keeps the speed it gained, forever.',
    build: 1,
    params: {
      F: { value: 3, min: 1, max: 5, step: 0.5, color: 'a', label: 'engine push' },
      burn: { value: 2, min: 1, max: 4, step: 0.5, color: 'b', label: 'burn time in seconds' },
    },
    sim: { duration: () => 10 },
    formula: (p, h) => `${h.n('F')}${op('×')}${h.n('burn')}${op('=')}${h.r(p.F * p.burn)}${h.unit('m/s, kept for good')}`,
    aside: () => `<div class="note">Speed gained while the engine pushes (for a probe of mass 1). After that, no force: no change.</div>`,
    readout: ({ F, burn }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('engine', t < burn ? 'on' : 'off') + h.ro('speed', fmt(F * Math.min(t, burn), 1), 'm/s'),
    steps: [{ at: 0, hl: [], say: 'A probe at rest, far from any planet.' }],
    simSay: ({ F, burn }, h, { t }) => (t < burn
      ? 'The engine pushes, so the speed climbs: the gaps between the snapshots grow.'
      : `Engine off. No force at all, so the speed stays at ${fmt(F * burn)} m/s: equal gaps, every second, forever.`),
    simSfx: ({ burn }) => [sfx.whoosh(0, burn), ...Array.from({ length: 9 }, (_, i) => sfx.tick(i + 1, note(i + 1 <= burn ? 2 : 7)))],
    draw({ F, burn }, h, { k, t }) {
      const xAt = (tt) => (tt < burn ? 0.5 * F * tt * tt : 0.5 * F * burn * burn + F * burn * (tt - burn));
      const sc = 660 / xAt(10), X = (x) => 60 + x * sc, y = 150;
      let s = '';
      for (let i = 0; i < 40; i++) {
        const sx = 40 + ((i * 197) % 720), sy = 30 + ((i * 89) % 200);
        s += S.circle(sx, sy, (i % 3) * 0.6 + 0.8, 'muted', null, { opacity: 0.6 });
      }
      s = S.fade(seg(k, 0, 0.6), s);
      const probe = (x, ghost) => (ghost
        ? S.poly([[x - 16, y - 10], [x + 14, y], [x - 16, y + 10]], null, 'grid2', { 'stroke-width': 1.5 })
        : S.poly([[x - 16, y - 10], [x + 14, y], [x - 16, y + 10]], 'ink', null) + S.line(x - 22, y - 14, x - 22, y + 14, 'muted', 2));
      for (let tau = 1; tau < t - 1e-9; tau += 1) s += probe(X(xAt(tau)), true);
      const x = X(xAt(t));
      if (t < burn) s += S.poly([[x - 16, y - 7], [x - 34 - 8 * Math.sin(t * 40), y], [x - 16, y + 7]], 'b', null);
      s += probe(x, false);
      const G2 = graph({ y0: 395, y1: 250, tMax: 10, vMax: Math.max(5, F * burn * 1.2), vLabel: 'speed (m/s)' });
      s += S.fade(seg(k, 0, 0.6), G2.s);
      s += S.path(path(80, (u) => { const tt = u * t; return [G2.X(tt), G2.Y(F * Math.min(tt, burn))]; }), 'ink', 3);
      s += S.line(G2.X(burn), G2.Y(0), G2.X(burn), G2.Y(F * burn), 'b', 1, dashed('3 4'));
      s += S.text(G2.X(burn) + 6, G2.Y(0) - 8, 'engine off', { fill: 'b', size: 11, anchor: 'start' });
      return s;
    },
    theory: [
      ['Nothing to slow it down', `In deep space there's no road, no air and nothing to rub against. Once the engine stops pushing, the net force on the probe is (almost) zero, so its velocity stays the same. The flat line on the speed graph is the first law made visible.`],
      ['Why engines aren’t needed to keep going', `Spacecraft burn their engines only to change speed or direction, never to keep moving. The Voyager 1 probe has been coasting since its last planetary flyby in 1980 and is now more than 24 billion km away.`],
    ],
    practice: ({ F, burn }, h) => [
      `A ${h.val('burn')} s burn at a push of ${h.val('F')} leaves the probe moving at ${h.r(F * burn)} m/s. In a day it coasts ${h.r(F * burn * 86.4, 0)} km.`,
      `An astronaut who lets go of a spanner on a spacewalk sees it drift away at a steady speed, never slowing down.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'n-first', group: G, symbol: 'Ⅰ', title: 'First law: inertia', modes: [firstConcept, exBus, exProbe] });

  // =====================================================================
  // Second law
  // =====================================================================

  const secondConcept = {
    id: 'concept',
    label: 'The law',
    lede: 'A net force makes an object accelerate. The bigger the force, the bigger the acceleration; the bigger the mass, the smaller.',
    build: 3.4,
    params: {
      F: { value: 10, min: 1, max: 20, step: 1, color: 'a', label: 'net force in newtons' },
      m: { value: 4, min: 1, max: 10, step: 0.5, color: 'b', label: 'mass in kilograms' },
    },
    formula: (p, h) => `${h.v('a')}${op('=')}${h.n('F')}${op('÷')}${h.n('m')}${op('=')}${h.r(p.F / p.m)}${h.unit('m/s²')}`,
    aside: ({ F, m }, h) => `<div>Or the usual way round: ${h.v('F')} = ${h.v('m')}${h.v('a')}, ${h.val('m')} × ${h.c('ink', fmt(F / m), 'acc')} = ${h.val('F')}</div>`,
    steps: [
      { at: 0, hl: ['F'], say: ({ F }) => `A net force of ${fmt(F)} N pushes on a box.` },
      { at: 0.2, hl: ['m'], say: ({ m }) => `The box has a mass of ${fmt(m)} kg: how strongly it resists a change in its motion.` },
      { at: 0.36, hl: ['÷', '=', 'res', 'acc'], say: ({ F, m }) => `The acceleration is the force divided by the mass: ${fmt(F)} ÷ ${fmt(m)} = ${fmt(F / m)} m/s². Every second, it gains ${fmt(F / m)} m/s.` },
      { at: 0.56, hl: ['F'], say: 'On the graph: for this mass, acceleration rises in a straight line with force. Double the force, double the acceleration.' },
      { at: 0.78, hl: ['m'], say: 'The dashed lines are twice the mass (shallower) and half the mass (steeper): the same force gets half or double the acceleration.' },
    ],
    sfx: ({ F, m }) => [sfx.glide(0, 0.18, pitch(0), pitch(F)), sfx.thud(0.22), sfx.glide(0.36, 0.52, pitch(0), pitch(2 * Math.min(12, F / m))),
      sfx.curve(0.56, 0.76, Array.from({ length: 20 }, (_, i) => pitch((i / 19) * 20 / m))), sfx.chime(0.8, note(7))],
    draw({ F, m }, h, { k }) {
      const a = F / m, side = 40 + m * 7, bx = 210, by = 300;
      const u1 = seg(k, 0, 0.18), u2 = seg(k, 0.2, 0.32), u3 = seg(k, 0.36, 0.52);
      let s = caption(60, 40, 'A force on a mass');
      s += S.line(60, by, 420, by, 'grid2', 1.5);
      s += S.fade(u2 || 0.25, S.rect(bx - side / 2, by - side, side, side, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 }) +
        S.text(bx, by - side / 2 + 5, `${fmt(m)} kg`, { fill: 'b', size: 13, weight: 600 }));
      const left = bx - side / 2;
      if (u1 > 0) s += S.arrow(left - 12 - F * 7 * u1, by - side / 2, left - 4, by - side / 2, 'a', 4) +
        S.fade(u1, S.text(left - 14 - F * 3.5, by - side / 2 - 14, `F = ${fmt(F)} N`, { fill: 'a', size: 13, weight: 600 }));
      if (u3 > 0) s += S.arrow(bx, by - side - 26, bx + Math.min(180, a * 14) * u3, by - side - 26, 'ink', 4) +
        S.fade(u3, S.text(bx, by - side - 40, `a = ${fmt(a)} m/s²`, { size: 13, weight: 600, anchor: 'start' }));

      // Acceleration against force for this mass, twice it and half it.
      const gx = (f) => 480 + f * 13.5, gy = (acc) => 360 - acc * 14;
      const u4 = seg(k, 0.56, 0.76), u5 = seg(k, 0.78, 0.95);
      let g = S.fade(seg(k, 0.5, 0.56), caption(470, 40, 'Acceleration against force') +
        S.line(gx(0), gy(0), gx(20.5), gy(0), 'grid2', 1.5) + S.line(gx(0), gy(0), gx(0), gy(20), 'grid2', 1.5) +
        S.text(gx(20.5), gy(0) + 18, 'force (N)', { fill: 'muted', size: 11, anchor: 'end' }) + S.text(gx(0) + 6, gy(20), 'acceleration', { fill: 'muted', size: 11, anchor: 'start' }));
      const lineFor = (mass) => { const fEnd = Math.min(20, 20 * mass); return [gx(0), gy(0), gx(fEnd), gy(fEnd / mass)]; };
      if (u4 > 0) { const [x0, y0, x1, y1] = lineFor(m); g += S.line(x0, y0, lerp(x0, x1, u4), lerp(y0, y1, u4), 'ink', 3); }
      g += S.fade(u5, S.line(...lineFor(2 * m), 'muted', 1.5, dashed('5 4')) + S.line(...lineFor(m / 2), 'muted', 1.5, dashed('5 4')) +
        S.text(gx(20) + 4, gy(20 / (2 * m)) + 4, '2m', { fill: 'muted', size: 11, anchor: 'start' }) +
        S.text(...(() => { const f = Math.min(20, 10 * m); return [gx(f) + 4, gy(f / (m / 2)) + 4]; })(), 'm/2', { fill: 'muted', size: 11, anchor: 'start' }));
      g += S.fade(u4, S.circle(gx(F), gy(a), 6, 'a') + S.text(gx(F) + 8, gy(a) - 8, `${fmt(m)} kg`, { size: 11, anchor: 'start' }));
      return s + g;
    },
    theory: [
      ['The law', `Newton's second law: the acceleration of an object is the net force on it divided by its mass, ${M('a = F/m')}, or as it's usually written, ${M('F = ma')}. The force here is the <em>net</em> force, all the forces on the object added up with their directions. If they cancel, the second law gives ${M('a = 0')}, which is the first law.`],
      ['Mass as inertia', `Mass measures how strongly an object resists changes to its motion. The same push gives a light object a big acceleration and a heavy one a small acceleration. That's why the same engine moves a motorbike briskly and a lorry slowly.`],
      ['Units', `Force is measured in newtons. One newton is exactly the force that gives one kilogram an acceleration of one metre per second per second: 1 N = 1 kg·m/s². An apple weighs about 1 N.`],
      ['Steady force, steady acceleration', `If the force stays constant, so does the acceleration, and the speed grows in a straight line: ${M('v = v_0 + at')}. In its most general form the law says force equals the rate of change of momentum, ${M('F = Δp/Δt')}, which also covers things like rockets whose mass changes as they burn fuel.`],
    ],
    practice: null,
  };

  const exRace = {
    id: 'race',
    label: 'Same push, different mass',
    lede: 'Two carts get exactly the same push. One is twice as heavy, so it gets half the acceleration and falls behind.',
    build: 1,
    params: {
      F: { value: 8, min: 2, max: 20, step: 1, color: 'a', label: 'push on each cart in newtons' },
      m: { value: 2, min: 1, max: 10, step: 0.5, color: 'b', label: 'mass of the lighter cart in kilograms' },
    },
    sim: { duration: () => 5 },
    formula: (p, h) => `${h.n('F')}${op('÷')}${h.n('m')}${op('=')}${h.r(p.F / p.m)}${h.unit('m/s²')}`,
    aside: ({ F, m }, h) => `<div>The heavy cart: ${h.val('F')} ÷ ${h.c('c', fmt(2 * m))} = ${h.c('c', fmt(F / (2 * m)))} m/s², half as much</div>`,
    readout: ({ F, m }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('light', fmt((F / m) * t, 1), 'm/s', 'b') + h.ro('heavy', fmt((F / (2 * m)) * t, 1), 'm/s', 'c'),
    steps: [{ at: 0, hl: [], say: 'Two carts on the start line. The lower one carries twice the load.' }],
    simSay: ({ F, m }, h, { t }) => `Same force on both. The light cart gains ${fmt(F / m)} m/s every second, the heavy one only ${fmt(F / (2 * m))}: after ${fmt(t, 1)} s it has gone exactly half as far.`,
    simSfx: () => Array.from({ length: 4 }, (_, i) => sfx.tick(i + 1, note(i + 2))),
    draw({ F, m }, h, { k, t }) {
      const a1 = F / m, a2 = a1 / 2, far = 0.5 * a1 * 25, sc = 620 / far, X = (x) => 80 + x * sc;
      const lanes = [[150, a1, m, 'b'], [300, a2, 2 * m, 'c']];
      let s = S.fade(seg(k, 0, 0.6), S.line(80, 60, 80, 330, 'muted', 1.5, dashed('4 5')) + caption(90, 56, 'start'));
      for (const [y, acc, mass, col] of lanes) {
        s += S.fade(seg(k, 0, 0.6), S.line(60, y, 760, y, 'grid2', 1.5));
        for (let tau = 1; tau < t - 1e-9; tau++) s += S.rect(X(0.5 * acc * tau * tau) - 2, y - 30, 4, 22, 'grid2', null);
        const x = X(0.5 * acc * t * t), w = 34 + mass * 2;
        s += S.rect(x - w, y - 34, w, 24, col, null, { rx: 4 }) + wheels([x - w + 8, x - 8], y, (0.5 * acc * t * t) / 0.3);
        s += S.arrow(x - w - 10 - F * 3, y - 22, x - w - 3, y - 22, 'a', 3);
        s += S.text(x - w / 2, y - 42, `${fmt(mass)} kg`, { fill: col, size: 12, weight: 600 });
        s += S.text(x + 8, y - 16, `${fmt(0.5 * acc * t * t, 1)} m`, { size: 12, anchor: 'start' });
      }
      return s;
    },
    theory: [
      ['Halving the acceleration', `Both carts feel the same force ${M('F')}. The second law divides it by each one's mass: ${M('a = F/m')} for the light cart and ${M('F/2m')} for the heavy one. With half the acceleration, the heavy cart gains speed half as fast and, starting together, covers exactly half the distance in any given time.`],
    ],
    practice: ({ F, m }, h) => [
      `A loaded lorry with the same engine as an empty one accelerates more slowly: same force, more mass.`,
      `With a push of ${h.val('F')} N, a ${h.val('m')} kg cart reaches ${h.r((F / m) * 5, 1)} m/s in 5 s; the ${fmt(2 * m)} kg cart only ${h.r((F / (2 * m)) * 5, 1)} m/s.`,
    ],
  };

  // Lift: speed up for 2 s, cruise 3 s, slow down 2 s, then rest.
  const liftAcc = (acc, t) => (t < 2 ? acc : t < 5 ? 0 : t < 7 ? -acc : 0);
  const liftV = (acc, t) => (t < 2 ? acc * t : t < 5 ? 2 * acc : t < 7 ? 2 * acc - acc * (t - 5) : 0);
  const liftY = (acc, t) => {
    if (t < 2) return 0.5 * acc * t * t;
    if (t < 5) return 2 * acc + 2 * acc * (t - 2);
    if (t < 7) { const u = t - 5; return 8 * acc + 2 * acc * u - 0.5 * acc * u * u; }
    return 10 * acc;
  };

  const exLift = {
    id: 'lift',
    label: 'Bathroom scale in a lift',
    lede: 'Stand on a scale in a lift. While the lift speeds up going up, the floor has to push you harder, and the scale reads more.',
    build: 1,
    params: {
      m: { value: 70, min: 40, max: 100, step: 5, color: 'a', label: 'your mass in kilograms', digits: 0 },
      acc: { value: 2, min: 0.5, max: 4, step: 0.5, color: 'b', label: 'the lift’s acceleration in m/s²' },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.n('m')}${op('×')}(9.8${op('+')}${h.n('acc')})${op('=')}${h.r(p.m * (G_ACC + p.acc), 0)}${h.unit('N while speeding up')}`,
    aside: ({ m, acc }, h) => `<div>Standing still: ${h.val('m')} × 9.8 = ${h.c('ink', fmt(m * G_ACC, 0))} N. Slowing down at the top: ${h.val('m')} × (9.8 − ${h.val('acc')}) = ${h.c('ink', fmt(m * (G_ACC - acc), 0))} N.</div>`,
    readout: ({ m, acc }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('scale', fmt(m * (G_ACC + liftAcc(acc, t)), 0), 'N') + h.ro('as kilograms', fmt((m * (G_ACC + liftAcc(acc, t))) / G_ACC, 1), 'kg', 'a'),
    steps: [{ at: 0, hl: [], say: 'You stand on a bathroom scale on the lift floor.' }],
    simSay: ({ acc }, h, { t }) => (t < 2 ? 'Speeding up: the floor must push you up harder than gravity pulls you down, so the scale reads more.'
      : t < 5 ? 'Steady speed: no acceleration, so the push just balances your weight. The scale reads normally, even though you’re moving.'
        : t < 7 ? 'Slowing down: the floor pushes less than your weight, so the scale reads less. You feel lighter.'
          : 'Stopped: back to your normal reading.'),
    simSfx: () => [sfx.thud(0.02), sfx.tick(2, note(5)), sfx.tick(5, note(2)), sfx.chime(7, note(4))],
    draw({ m, acc }, h, { k, t }) {
      const top = 40, bottom = 380, carH = 110, rise = 10 * acc, sc = (bottom - top - carH) / rise;
      const y = liftY(acc, t), carBottom = bottom - y * sc, carTop = carBottom - carH, cx = 210;
      const reading = m * (G_ACC + liftAcc(acc, t));
      let s = S.fade(seg(k, 0, 0.6), S.rect(cx - 90, top, 180, bottom - top, null, 'grid2', { 'stroke-width': 2 }) +
        S.line(cx, top, cx, carTop, 'muted', 1.5));
      s += S.rect(cx - 70, carTop, 140, carH, 'card', 'ink', { rx: 6, 'stroke-width': 2 });
      s += S.rect(cx - 30, carBottom - 12, 60, 8, 'ink-soft', 'ink', { rx: 2 });
      s += figure(cx, carBottom - 12, 'a', 1.15);
      s += S.rect(cx - 26, carTop + 8, 52, 18, 'ink', null, { rx: 3 }) + S.text(cx, carTop + 21, `${fmt(reading, 0)} N`, { fill: 'paper', size: 11, weight: 600 });
      // Forces on you: weight down, the scale's push up.
      const fScale = 0.07;
      s += S.arrow(cx + 50, carBottom - 40, cx + 50, carBottom - 40 + m * G_ACC * fScale, 'c', 3) + S.text(cx + 58, carBottom - 40 + m * G_ACC * fScale, 'weight', { fill: 'c', size: 10, anchor: 'start' });
      s += S.arrow(cx - 50, carBottom - 14, cx - 50, carBottom - 14 - reading * fScale, 'a', 3) + S.text(cx - 58, carBottom - 14 - reading * fScale, 'scale', { fill: 'a', size: 10, anchor: 'end' });
      const Gr = graph({ x0: 400, x1: 760, y0: 380, y1: 90, tMax: 8, vMax: m * (G_ACC + 4) * 1.05, vMin: m * (G_ACC - 4) * 0.9, vLabel: 'scale reading (N)' });
      s += S.fade(seg(k, 0, 0.6), Gr.s + S.line(Gr.X(0), Gr.Y(m * G_ACC), Gr.X(8), Gr.Y(m * G_ACC), 'muted', 1, dashed('4 4')) + S.text(Gr.X(8), Gr.Y(m * G_ACC) - 6, 'your weight', { fill: 'muted', size: 11, anchor: 'end' }));
      s += S.path(path(160, (u) => { const tt = u * t; return [Gr.X(tt), Gr.Y(m * (G_ACC + liftAcc(acc, tt)))]; }), 'a', 2.5);
      return s;
    },
    theory: [
      ['What a scale measures', `A bathroom scale measures how hard it has to push up on you. Two forces act on you: gravity pulling down with your weight ${M('mg')}, and the scale pushing up with ${M('N')}. By the second law their difference makes you accelerate: ${M('N − mg = ma')}, so ${M('N = m(g + a)')}.`],
      ['Heavier and lighter', `Speeding up on the way up (${M('a')} positive), the scale must push more than your weight, and it reads high. Moving at a steady speed (${M('a = 0')}), it reads your normal weight, however fast you go. Slowing down at the top (${M('a')} negative), it reads low. If the cable snapped and the lift fell freely, ${M('a = −g')} and the scale would read zero: weightlessness.`],
    ],
    practice: ({ m, acc }, h) => [
      `A ${h.val('m')} kg person in a lift speeding up at ${h.val('acc')} m/s² feels as heavy as ${h.r((m * (G_ACC + acc)) / G_ACC, 1)} kg.`,
      `Astronauts on the space station are in free fall around the Earth, which is why a scale there would read zero.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'n-second', group: G, symbol: 'Ⅱ', title: 'Second law: F = ma', modes: [secondConcept, exRace, exLift] });

  // =====================================================================
  // Third law
  // =====================================================================

  const thirdConcept = {
    id: 'concept',
    label: 'The law',
    lede: 'Forces come in pairs. If A pushes on B, B pushes back on A just as hard, in the opposite direction.',
    build: 3.6,
    params: {
      F: { value: 6, min: 1, max: 10, step: 0.5, color: 'a', label: 'push in newtons' },
      mA: { value: 2, min: 1, max: 10, step: 0.5, color: 'b', label: 'mass of A in kilograms' },
      mB: { value: 6, min: 1, max: 10, step: 0.5, color: 'c', label: 'mass of B in kilograms' },
    },
    formula: (p, h) => `${h.v('F')}<sub>A on B</sub>${op('=')}${MINUS}${h.v('F')}<sub>B on A</sub>${op('=')}${h.n('F')}${h.unit('N')}`,
    aside: ({ F, mA, mB }, h) =>
      `<div>${h.v('a')}<sub>A</sub> = ${h.val('F')} ÷ ${h.n('mA')} = ${h.c('b', fmt(F / mA), 'aA')}, ${h.v('a')}<sub>B</sub> = ${h.val('F')} ÷ ${h.n('mB')} = ${h.c('c', fmt(F / mB), 'aB')} m/s²</div>`,
    steps: [
      { at: 0, hl: ['mA', 'mB'], say: 'Two blocks, A and B, side by side.' },
      { at: 0.16, hl: ['F'], say: ({ F }) => `A pushes on B with ${fmt(F)} N, to the right.` },
      { at: 0.34, hl: [MINUS, 'F'], say: ({ F }) => `At the same moment, B pushes back on A with exactly ${fmt(F)} N, to the left. Listen: the two forces sound the same.` },
      { at: 0.52, hl: [], say: 'The pair never cancels out, because the two forces act on different objects: one on A, one on B.' },
      { at: 0.7, hl: ['aA', 'aB'], say: ({ F, mA, mB }) => `Equal forces, different masses: A accelerates at ${fmt(F / mA)} m/s², B at ${fmt(F / mB)} m/s². The lighter one moves off faster.` },
    ],
    sfx: ({ F, mA, mB }) => [sfx.thud(0.02), sfx.glide(0.16, 0.3, pitch(0), pitch(F)), sfx.glide(0.34, 0.48, pitch(0), pitch(F)), sfx.tick(0.55, note(4)),
      sfx.glide(0.7, 0.84, pitch(0), pitch(2 * Math.min(12, F / mA))), sfx.glide(0.78, 0.92, pitch(0), pitch(2 * Math.min(12, F / mB)))],
    draw({ F, mA, mB }, h, { k }) {
      const sA = 40 + mA * 8, sB = 40 + mB * 8, cx = 400, by = 260;
      const u0 = seg(k, 0, 0.14), u1 = seg(k, 0.16, 0.3), u2 = seg(k, 0.34, 0.48), u3 = seg(k, 0.52, 0.66), u4 = seg(k, 0.7, 0.92);
      let s = S.fade(u0, S.line(80, by, 720, by, 'grid2', 1.5) +
        S.rect(cx - sA, by - sA, sA, sA, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 }) + S.text(cx - sA / 2, by - sA / 2 + 5, `A, ${fmt(mA)} kg`, { fill: 'b', size: 12, weight: 600 }) +
        S.rect(cx, by - sB, sB, sB, 'c-soft', 'c', { rx: 4, 'stroke-width': 2 }) + S.text(cx + sB / 2, by - sB / 2 + 5, `B, ${fmt(mB)} kg`, { fill: 'c', size: 12, weight: 600 }));
      const L = F * 14, yF = by - Math.min(sA, sB) / 2;
      if (u1 > 0) s += S.arrow(cx + 4, yF - 10, cx + 4 + L * u1, yF - 10, 'a', 4) + S.fade(u1, S.text(cx + 8 + L / 2, yF - 22, `${fmt(F)} N on B`, { fill: 'a', size: 12, weight: 600 }));
      if (u2 > 0) s += S.arrow(cx - 4, yF + 10, cx - 4 - L * u2, yF + 10, 'a', 4) + S.fade(u2, S.text(cx - 8 - L / 2, yF + 30, `${fmt(F)} N on A`, { fill: 'a', size: 12, weight: 600 }));
      s += S.fade(u3, S.text(400, 70, 'Equal size. Opposite directions. On different objects.', { size: 15, weight: 600 }));
      if (u4 > 0) {
        s += S.arrow(cx - sA / 2, by + 34, cx - sA / 2 - Math.min(300, (F / mA) * 30) * u4, by + 34, 'b', 3.5);
        s += S.arrow(cx + sB / 2, by + 34, cx + sB / 2 + Math.min(300, (F / mB) * 30) * u4, by + 34, 'c', 3.5);
        s += S.fade(u4, S.text(cx - sA / 2, by + 58, `a = ${fmt(F / mA)}`, { fill: 'b', size: 12, anchor: 'end' }) + S.text(cx + sB / 2, by + 58, `a = ${fmt(F / mB)}`, { fill: 'c', size: 12, anchor: 'start' }));
      }
      return s;
    },
    theory: [
      ['The law', `Newton's third law: when one object exerts a force on another, the second exerts a force on the first that is equal in size and opposite in direction, ${M('F_{AB} = −F_{BA}')}. Forces are never one-sided; they are interactions between two objects, and they always come in these pairs.`],
      ['Why the pair doesn’t cancel', `The two forces in a pair act on different objects, so they never appear in the same object's force total. B's push on A affects only A's motion; A's push on B affects only B's. That's why a horse can pull a cart: the cart pulls back on the horse equally, but the horse also pushes on the ground, and the ground pushes it forward.`],
      ['Equal forces, unequal effects', `Equal forces don't mean equal accelerations. By the second law each object accelerates at ${M('F/m')}, so the lighter one gets the bigger acceleration. When you jump, you push the Earth down as hard as it pushes you up, but the Earth's mass is so enormous that its acceleration is immeasurably small.`],
      ['Momentum', `Because the forces are equal and opposite and act for the same time, each object gains the same amount of momentum ${M('p = mv')} in opposite directions. The total stays the same: this is <em>conservation of momentum</em>, and it follows directly from the third law.`],
    ],
    practice: null,
  };

  const PUSH = 0.5; // seconds the skaters push for
  const exSkaters = {
    id: 'skaters',
    label: 'Skaters pushing apart',
    lede: 'Two skaters stand face to face and push. Each pushes the other equally hard, yet the lighter one glides away faster.',
    build: 1,
    params: {
      mA: { value: 50, min: 30, max: 100, step: 5, color: 'a', label: 'left skater’s mass in kilograms', digits: 0 },
      mB: { value: 80, min: 30, max: 100, step: 5, color: 'b', label: 'right skater’s mass in kilograms', digits: 0 },
      F: { value: 300, min: 100, max: 500, step: 25, color: 'c', label: 'push in newtons', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.n('mA')}${op('×')}${h.c('a', fmt((p.F * PUSH) / p.mA))}${op('=')}${h.n('mB')}${op('×')}${h.c('b', fmt((p.F * PUSH) / p.mB))}${op('=')}${h.r(p.F * PUSH, 0)}${h.unit('kg·m/s')}`,
    aside: ({ F }, h) => `<div>Both feel ${h.n('F')} N for ${PUSH} s, so both gain the same momentum, mass × speed, in opposite directions.</div>`,
    readout: ({ mA, mB, F }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('left', fmt((F * Math.min(t, PUSH)) / mA, 2), 'm/s', 'a') + h.ro('right', fmt((F * Math.min(t, PUSH)) / mB, 2), 'm/s', 'b'),
    steps: [{ at: 0, hl: [], say: 'Two skaters at rest, hands together.' }],
    simSay: ({ mA, mB, F }, h, { t }) => (t < PUSH
      ? `They push: ${fmt(F)} N on each, in opposite directions.`
      : `Hands apart: no more force, so each glides at a steady speed (first law). The ${mA < mB ? 'left' : mA > mB ? 'right' : ''} skater${mA === mB ? 's move at the same speed' : ', being lighter, is faster'}.`),
    simSfx: () => [sfx.thud(0.02), sfx.swoosh(0.1, 1.5), ...Array.from({ length: 5 }, (_, i) => sfx.tick(i + 1, note(4)))],
    draw({ mA, mB, F }, h, { k, t }) {
      const pos = (m, tt) => { const a = F / m; return tt < PUSH ? 0.5 * a * tt * tt : 0.5 * a * PUSH * PUSH + a * PUSH * (tt - PUSH); };
      const far = Math.max(pos(mA, 6), pos(mB, 6), 3), sc = 320 / far, cx = 400, y = 300;
      let s = S.fade(seg(k, 0, 0.6), S.rect(50, y, 700, 14, 'a-soft', null, { rx: 7, opacity: 0.6 }) + S.line(cx, y - 120, cx, y, 'grid2', 1, dashed('3 5')));
      for (let tau = 1; tau < t - 1e-9; tau++) s += S.circle(cx - 18 - pos(mA, tau) * sc, y - 8, 3, 'grid2') + S.circle(cx + 18 + pos(mB, tau) * sc, y - 8, 3, 'grid2');
      const xa = cx - 18 - pos(mA, t) * sc, xb = cx + 18 + pos(mB, t) * sc;
      s += figure(xa, y, 'a', 0.7 + mA / 160) + figure(xb, y, 'b', 0.7 + mB / 160);
      if (t < PUSH) {
        s += S.arrow(xa + 6, y - 64, xa + 6 - F * 0.18, y - 64, 'c', 3.5) + S.arrow(xb - 6, y - 64, xb - 6 + F * 0.18, y - 64, 'c', 3.5);
        s += S.text(cx, y - 84, `${fmt(F)} N each way`, { fill: 'c', size: 12, weight: 600 });
      } else {
        const va = (F * PUSH) / mA, vb = (F * PUSH) / mB;
        s += S.arrow(xa, y - 100, xa - va * 22, y - 100, 'a', 3) + S.arrow(xb, y - 100, xb + vb * 22, y - 100, 'b', 3);
        s += S.text(xa, y - 112, `${fmt(va)} m/s`, { fill: 'a', size: 12, weight: 600 }) + S.text(xb, y - 112, `${fmt(vb)} m/s`, { fill: 'b', size: 12, weight: 600 });
      }
      return s;
    },
    theory: [
      ['Pushing off', `When the skaters push, each one's hands push on the other: a third-law pair, equal and opposite. Both forces last the same time, so both skaters gain the same momentum (mass × velocity) in opposite directions. Their total momentum was zero before and is still zero after: ${M('m_A v_A = m_B v_B')}.`],
      ['Lighter means faster', `With equal momentum, speed is inversely proportional to mass: the lighter skater moves off faster. A 50 kg skater pushing off an 80 kg one ends up 1.6 times faster.`],
    ],
    practice: ({ mA, mB }, h) => [
      `With masses ${h.val('mA')} and ${h.val('mB')} kg, the speeds are in the ratio ${h.r(mB / mA)} to 1, the masses' ratio turned upside down.`,
      `A swimmer pushes off the pool wall; the wall pushes back just as hard, and the swimmer shoots forward.`,
    ],
  };

  const exRocket = {
    id: 'rocket',
    label: 'Rocket launch',
    lede: 'A rocket pushes hot gas down out of its engine. The gas pushes the rocket up just as hard. That push is what lifts it.',
    build: 1,
    params: {
      T: { value: 25, min: 10, max: 40, step: 1, color: 'a', label: 'thrust in kilonewtons', digits: 0 },
      m: { value: 1.5, min: 1, max: 3, step: 0.1, color: 'b', label: 'rocket mass in tonnes' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.n('T')}${op(MINUS)}${h.n('m')}${op('×')}9.8${op('=')}${h.r(p.T - p.m * G_ACC, 1)}${h.unit('kN up')}`,
    aside: ({ T, m }) => `<div class="note">The engine pushes the exhaust down with the thrust; the exhaust pushes the rocket up with the same thrust. ${T > m * G_ACC ? 'It’s more than the weight, so the rocket lifts off.' : 'It’s not more than the weight, so the rocket stays on the pad.'}</div>`,
    readout: ({ T, m }, h, { t }) => { const a = Math.max(0, (T - m * G_ACC) / m); return h.ro('time', fmt(t, 1), 's') + h.ro('height', fmt(0.5 * a * t * t, 0), 'm') + h.ro('speed', fmt(a * t, 1), 'm/s'); },
    steps: [{ at: 0, hl: [], say: 'A rocket on the launch pad, engine lit.' }],
    simSay: ({ T, m }) => (T > m * G_ACC
      ? `The rocket pushes gas down with ${fmt(T)} kN; the gas pushes it up with ${fmt(T)} kN. That beats its ${fmt(m * G_ACC, 1)} kN weight, so it accelerates upward.`
      : `The gas pushes up with ${fmt(T)} kN, but the rocket weighs ${fmt(m * G_ACC, 1)} kN: not enough to lift off.`),
    simSfx: ({ T, m }) => (T > m * G_ACC ? [sfx.whoosh(0, 2), sfx.whoosh(2, 4), sfx.whoosh(4, 6)] : [sfx.whoosh(0, 2), sfx.thud(1)]),
    draw({ T, m }, h, { k, t }) {
      const a = Math.max(0, (T - m * G_ACC) / m), maxH = Math.max(1, 0.5 * a * 36), sc = 200 / maxH;
      const ground = 380, cx = 300, base = ground - 20 - 0.5 * a * t * t * sc;
      let s = S.fade(seg(k, 0, 0.6), S.line(40, ground, 560, ground, 'ink', 2) + S.rect(cx - 50, ground - 20, 100, 20, 'ink-soft', null));
      // Exhaust: puffs pushed down and out, flickering.
      for (let i = 0; i < 14; i++) {
        const age = ((t * 3 + i / 14) % 1), r = 4 + age * 14;
        s += S.circle(cx + Math.sin(i * 2.1) * age * 26, base + 10 + age * 70, r, 'b', null, { opacity: 0.45 * (1 - age) });
      }
      s += S.poly([[cx - 10, base], [cx, base + 22 + 6 * Math.sin(t * 50)], [cx + 10, base]], 'b', null);
      s += S.rect(cx - 16, base - 90, 32, 90, 'card', 'ink', { rx: 4, 'stroke-width': 2 }) + S.poly([[cx - 16, base - 90], [cx, base - 120], [cx + 16, base - 90]], 'ink', null);
      s += S.poly([[cx - 16, base - 20], [cx - 30, base], [cx - 16, base]], 'ink', null) + S.poly([[cx + 16, base - 20], [cx + 30, base], [cx + 16, base]], 'ink', null);
      // The third-law pair, plus the weight.
      const L = T * 2.4;
      s += S.arrow(cx + 40, base - 20, cx + 40, base - 20 - L, 'a', 3.5) + S.text(cx + 48, base - 20 - L / 2, `gas pushes rocket up: ${fmt(T)} kN`, { fill: 'a', size: 12, anchor: 'start', weight: 600 });
      s += S.arrow(cx - 40, base + 10, cx - 40, base + 10 + L * 0.6, 'c', 3.5) + S.text(cx - 48, base + 10 + L * 0.3, `rocket pushes gas down: ${fmt(T)} kN`, { fill: 'c', size: 12, anchor: 'end', weight: 600 });
      s += S.arrow(cx, base - 60, cx, base - 60 + m * G_ACC * 2.4, 'muted', 2) + S.text(cx + 6, base - 60 + m * G_ACC * 2.4, 'weight', { fill: 'muted', size: 11, anchor: 'start' });
      // Height against time on the right.
      const Gr = graph({ x0: 600, x1: 760, y0: 380, y1: 90, tMax: 6, vMax: Math.max(5, maxH), tLabel: 's', vLabel: 'height (m)' });
      s += S.fade(seg(k, 0, 0.6), Gr.s);
      s += S.path(path(60, (u) => { const tt = u * t; return [Gr.X(tt), Gr.Y(0.5 * a * tt * tt)]; }), 'ink', 2.5);
      return s;
    },
    theory: [
      ['Pushing on the exhaust', `A rocket carries its own push-off material. The engine forces hot gas out of the nozzle at high speed: that's a force by the rocket on the gas, downward. By the third law, the gas pushes on the rocket with an equal force upward, the <em>thrust</em>. Rockets don't push against the ground or the air, which is why they work in the vacuum of space.`],
      ['Lift-off', `Two forces act on the rocket itself: thrust up and its weight down. Only when the thrust is bigger than the weight is there a net upward force (second law), and the rocket leaves the pad. As it burns fuel it gets lighter, so the same thrust gives a growing acceleration.`],
    ],
    practice: ({ T, m }, h) => [
      `With ${h.val('T')} kN of thrust and a ${h.val('m')} t rocket, the net push is ${h.r(T - m * G_ACC, 1)} kN, an acceleration of ${h.r(Math.max(0, (T - m * G_ACC) / m), 1)} m/s².`,
      `Let go of a blown-up balloon and it shoots around the room: it pushes air out the back, and the air pushes it forward.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'n-third', group: G, symbol: 'Ⅲ', title: 'Third law: pairs', modes: [thirdConcept, exSkaters, exRocket] });
})();
