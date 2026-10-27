(() => {
  'use strict';
  const { S, fmt, dashed, seg, lin, lerp, lerpPt, drawOn, morph, niceStep, M, MINUS, sfx, pitch, note } = MV;
  const G = 'Operations';
  const op = (s) => `<span class="op">${s}</span>`;
  const HALF = '½';

  // ---------- Little props ----------

  function walker(x, y, phase, color) {
    const sw = Math.sin(phase) * 0.5;
    const leg = (a) => S.line(x, y - 22, x + 22 * Math.sin(a), y - 22 + 22 * Math.cos(a), color, 3.5);
    const arm = (a) => S.line(x, y - 37, x + 16 * Math.sin(a), y - 37 + 16 * Math.cos(a), color, 3);
    return leg(sw) + leg(-sw) + arm(-sw * 0.8) + arm(sw * 0.8) + S.line(x, y - 22, x, y - 40, color, 4) + S.circle(x, y - 50, 8, color);
  }

  const wheels = (xs, y, spin) => xs.map((x) =>
    S.circle(x, y - 6, 6.5, 'ink') + S.line(x, y - 6, x + 5 * Math.cos(spin), y - 6 + 5 * Math.sin(spin), 'paper', 1.5)).join('');

  const car = (rear, y, len, color, spin = 0) =>
    S.rect(rear + len * 0.22, y - 30, len * 0.5, 12, color, null, { rx: 5, opacity: 0.75 }) +
    S.rect(rear, y - 21, len, 13, color, null, { rx: 4 }) + wheels([rear + len * 0.22, rear + len * 0.78], y, spin);

  const truck = (rear, y, len, color, spin = 0) =>
    S.rect(rear, y - 40, len * 0.72, 30, color, null, { rx: 3 }) +
    S.rect(rear + len * 0.75, y - 30, len * 0.25, 20, color, null, { rx: 4, opacity: 0.8 }) +
    wheels([rear + len * 0.15, rear + len * 0.55, rear + len * 0.88], y, spin);

  // A small time graph: returns mapping functions plus its axes.
  function graph({ x0 = 90, x1 = 740, y0 = 390, y1 = 220, tMax, vMax, tLabel = 'time (s)', vLabel, vStep }) {
    const X = (t) => x0 + (t / tMax) * (x1 - x0), Y = (v) => y0 - (v / vMax) * (y0 - y1);
    let s = '';
    const ts = niceStep(tMax / 8), vs = vStep || niceStep(vMax / 4);
    for (let t = 0; t <= tMax + 1e-9; t += ts) s += S.line(X(t), y0, X(t), y1, 'grid', 1) + S.text(X(t), y0 + 18, fmt(t), { fill: 'muted', size: 11 });
    for (let v = 0; v <= vMax + 1e-9; v += vs) s += S.line(x0, Y(v), x1, Y(v), 'grid', 1) + S.text(x0 - 8, Y(v) + 4, fmt(v), { fill: 'muted', size: 11, anchor: 'end' });
    s += S.line(x0, y0, x1, y0, 'grid2', 1.5) + S.line(x0, y0, x0, y1, 'grid2', 1.5);
    s += S.text(x1, y0 + 34, tLabel, { fill: 'muted', size: 12, anchor: 'end' });
    s += S.text(x0, y1 - 10, vLabel, { fill: 'muted', size: 12, anchor: 'start' });
    return { X, Y, s };
  }

  // ---------- + : velocities add ----------

  const exWalkway = {
    id: 'walkway',
    label: 'Moving walkway',
    build: 1.2,
    lede: 'Walk along a moving walkway and the two speeds add: your speed over the ground is your walking speed plus the walkway’s.',
    params: {
      w: { value: 1.5, min: -2, max: 3, step: 0.25, color: 'a', label: 'walking speed in m/s' },
      v: { value: 1, min: -3, max: 3, step: 0.25, color: 'b', label: 'walkway speed in m/s' },
    },
    sim: {
      duration: ({ w, v }) => {
        const fastest = Math.max(Math.abs(w), Math.abs(w + v));
        return fastest < 0.01 ? 8 : Math.min(8, 20 / fastest);
      },
    },
    formula: (p, h) => `${h.n('w')}${h.signed('v')}${op('=')}${h.r(p.w + p.v)}${h.unit('m/s')}`,
    aside: ({ w, v }, h) =>
      `<div>walking speed + walkway speed = speed over the ground</div>`,
    readout: ({ w, v }, h, { t }) =>
      h.ro('time', fmt(t, 1), 's') + h.ro('on the floor', fmt(w * t, 1), 'm', 'a') + h.ro('on the walkway', fmt((w + v) * t, 1), 'm'),
    draw({ w, v }, h, { k, t }) {
      const R = w + v, sc = 30, X = (m) => 40 + m * sc, AS = 22;
      const sg = w >= 0 ? 2 : 22, sb = R >= 0 ? 2 : 22;
      const xg = sg + w * t, xb = sb + R * t;
      const y1 = 180, y2 = 370;
      const u1 = seg(k, 0, 0.6), u2 = seg(k, 0.4, 1);
      let scene = S.text(40, 70, 'On the floor', { anchor: 'start', fill: 'muted', size: 14 });
      scene += S.line(X(0), y1, X(24), y1, 'grid2', 2);
      for (let m = 0; m <= 24; m += 2) scene += S.line(X(m), y1, X(m), y1 + 6, 'grid2', 1.5) + S.text(X(m), y1 + 22, m, { fill: 'muted', size: 11 });
      scene += S.text(40, 258, 'On a moving walkway', { anchor: 'start', fill: 'muted', size: 14 });
      scene += S.rect(X(0), y2, 24 * sc, 16, 'ink-soft', 'grid2', { rx: 8 });
      // Tread lines ride along with the belt.
      const shift = (((v * t) % 1) + 1) % 1;
      for (let m = 0; m < 24; m++) scene += S.line(X(m + shift), y2 + 3, X(m + shift), y2 + 13, 'b', 2, { opacity: 0.55 });
      for (let m = 0; m <= 24; m += 2) scene += S.text(X(m), y2 + 34, m, { fill: 'muted', size: 11 });
      let s = S.fade(u1, scene);

      let actors = S.line(X(sg), y1, X(xg), y1, 'a', 5, { opacity: 0.35 }) + S.line(X(sb), y2, X(xb), y2, 'ink', 5, { opacity: 0.25 });
      actors += walker(X(xg), y1, w * t * 3.2, 'a') + walker(X(xb), y2, w * t * 3.2, 'ink');
      // Velocity arrows, tip to tail: walking, then the belt, then the total.
      actors += S.arrow(X(xg), y1 - 80, X(xg) + w * AS, y1 - 80, 'a', 3) + S.text(X(xg) + w * AS + (w >= 0 ? 8 : -8), y1 - 75, fmt(w), { fill: 'a', size: 13, anchor: w >= 0 ? 'start' : 'end' });
      actors += S.arrow(X(xb), y2 - 80, X(xb) + w * AS, y2 - 80, 'a', 3);
      actors += S.arrow(X(xb) + w * AS, y2 - 80, X(xb) + R * AS, y2 - 80, 'b', 3);
      actors += S.arrow(X(xb), y2 - 96, X(xb) + R * AS, y2 - 96, 'ink', 3.5) + S.text(X(xb) + R * AS + (R >= 0 ? 8 : -8), y2 - 91, fmt(R), { size: 13, weight: 600, anchor: R >= 0 ? 'start' : 'end' });
      return s + S.fade(u2, actors);
    },
    theory: [
      ['Velocity has a direction', `In one dimension a velocity is a signed number: positive means moving right, negative means moving left. Its size, the <em>speed</em>, is measured in metres per second (m/s). Walk at −1 m/s on a belt moving at +1 m/s and you stay put. That's addition with signs, exactly as on the number line.`],
      ['Adding velocities', `Your velocity relative to the ground is your velocity relative to the walkway plus the walkway's velocity relative to the ground: ${M('v_{ground} = v_{walk} + v_{belt}')}. Galileo first described this "addition of velocities" in 1632. It's why a jet with a tailwind arrives early and a swimmer crossing a river drifts downstream.`],
      ['Distances add too', `Over a time ${M('t')}, each walker covers ${M('d = v × t')}. The belt walker covers ${M('(w + v)t = wt + vt')}: the distributive law, read as "the distance I walked plus the distance the floor carried me". The tread lines show the second part: they move exactly as fast as the belt.`],
      ['Units must match', `You can only add quantities measured in the same unit. 1 m/s + 3.6 km/h is 2 m/s, not 4.6 of anything, because 3.6 km/h is 1 m/s. Checking units, called <em>dimensional analysis</em>, catches a huge share of mistakes in physics.`],
      ['Where it breaks', `Simple addition is an approximation that holds at everyday speeds. Near the speed of light ${M('c')}, Einstein's relativity replaces it with ${M('u = (v + w)/(1 + vw/c^2)')}, which never exceeds ${M('c')}. At walking speeds the correction is around one part in ${M('10^{17}')}.`],
    ],
    practice: ({ w, v }, h) => [
      w + v > 0 && w > 0
        ? `On a walkway moving at ${h.val('v')} m/s, walking at ${h.val('w')} m/s gets you along at ${h.r(w + v)} m/s: an 80 m concourse takes ${h.r(80 / (w + v), 0)} s instead of ${h.r(80 / w, 0)} s.`
        : `With these speeds you move at ${h.r(w + v)} m/s over the ground${w + v <= 0 ? ', so you never reach the far end' : ''}.`,
      `A plane flying at 250 m/s through the air, with a 30 m/s tailwind, travels at 280 m/s over the ground; against the wind, 220 m/s.`,
      `Set the walking speed to ${h.c('a', fmt(-v))} m/s and you walk “up the down escalator”, staying in the same place.`,
    ],
  };

  // ---------- − : relative speed ----------

  const GAP = 60;

  const exChase = {
    id: 'chase',
    label: 'Catching up',
    build: 1.2,
    lede: 'A car catching a truck. Seen from the truck, the car only approaches at the difference of their speeds.',
    params: {
      a: { value: 30, min: 0, max: 40, step: 1, color: 'a', label: 'car speed in m/s' },
      b: { value: 22, min: 0, max: 40, step: 1, color: 'b', label: 'truck speed in m/s' },
    },
    sim: { duration: ({ a, b }) => (a - b > 0 ? Math.min(GAP / (a - b), 15) : 8) },
    formula: (p, h) => `${h.n('a')}${op(MINUS)}${h.n('b')}${op('=')}${h.r(p.a - p.b)}${h.unit('m/s')}`,
    aside({ a, b }, h) {
      const r = a - b;
      if (r > 0) return `<div>The ${GAP} m gap closes at ${h.r(r)} m/s, so the car catches up after ${GAP} ÷ ${fmt(r)} = ${h.r(GAP / r)} s</div>`;
      if (r === 0) return `<div>Same speed: the gap stays at ${GAP} m forever</div>`;
      return `<div>The truck is faster: the gap grows by ${h.r(-r)} m every second</div>`;
    },
    readout: ({ a, b }, h, { t }) =>
      h.ro('time', fmt(t, 1), 's') + h.ro('car', fmt(a * t, 0), 'm', 'a') + h.ro('truck', fmt(GAP + b * t, 0), 'm', 'b') +
      h.ro('gap', fmt(Math.max(0, GAP - (a - b) * t), 1), 'm'),
    draw({ a, b }, h, { k, t }) {
      const r = a - b, sc = 7, XT = 560, yRoad = 150;
      const gap = Math.max(0, GAP - r * t);
      const truckWorld = GAP + b * t;
      const S2 = (g) => XT + (g - truckWorld) * sc; // ground position → screen, camera riding on the truck
      const u1 = seg(k, 0, 0.6), u2 = seg(k, 0.4, 1);
      let scene = S.text(40, 40, 'Seen from the truck: the road slides back, the car creeps closer', { anchor: 'start', fill: 'muted', size: 14 });
      scene += S.rect(40, yRoad - 52, 720, 60, 'ink-soft', null, { rx: 4 });
      const first = Math.floor((truckWorld - (XT - 40) / sc) / 6) * 6;
      for (let g = first; S2(g) < 760; g += 6) {
        const x0 = Math.max(40, S2(g)), x1 = Math.min(760, S2(g + 3));
        if (x1 > x0) scene += S.line(x0, yRoad + 14, x1, yRoad + 14, 'grid2', 3);
      }
      let s = S.fade(u1, scene);
      const spin = (a * t) / 0.35;
      let actors = truck(XT, yRoad, 84, 'b', (b * t) / 0.45);
      const carFront = XT - gap * sc;
      if (carFront - 31 >= 40) {
        actors += car(carFront - 31, yRoad, 31, 'a', spin);
        if (gap > 0) actors += S.line(carFront, 74, XT, 74, 'muted', 1.5) + S.line(carFront, 68, carFront, 80, 'muted', 1.5) + S.line(XT, 68, XT, 80, 'muted', 1.5);
        if (XT - carFront > 60) actors += S.text((carFront + XT) / 2, 64, `${fmt(gap, 1)} m`, { size: 13 });
        actors += S.text(carFront - 15, yRoad - 40, `${fmt(a)} m/s`, { fill: 'a', size: 12, weight: 600 });
      } else {
        actors += S.arrow(90, yRoad - 20, 46, yRoad - 20, 'a', 3) + S.text(98, yRoad - 15, `car ${fmt(gap, 0)} m behind`, { fill: 'a', size: 12, anchor: 'start' });
      }
      actors += S.text(XT + 42, yRoad - 50, `${fmt(b)} m/s`, { fill: 'b', size: 12, weight: 600 });
      if (gap === 0) actors += S.text(XT - 60, yRoad + 40, 'caught up', { size: 14, weight: 600 });

      const T = r > 0 ? Math.min(GAP / r, 15) : 8;
      const gMax = Math.max(GAP, GAP - r * T);
      const Gr = graph({ y1: 230, tMax: T, vMax: gMax, vLabel: 'gap (m)' });
      let plot = Gr.s + S.line(Gr.X(0), Gr.Y(GAP), Gr.X(T), Gr.Y(Math.max(0, GAP - r * T)), 'grid2', 1.5, dashed('4 5'));
      plot += S.line(Gr.X(0), Gr.Y(GAP), Gr.X(t), Gr.Y(gap), 'ink', 3) + S.circle(Gr.X(t), Gr.Y(gap), 5, 'ink');
      plot += S.text(Gr.X(T * 0.5) + 8, Gr.Y(GAP - r * T * 0.5) - 10, `slope −${fmt(r)} m/s`, { fill: 'muted', size: 12, anchor: 'start' });
      return s + S.fade(u2, actors) + S.fade(u1, plot);
    },
    theory: [
      ['Relative velocity', `The velocity of A as seen from B is ${M('v_{A rel B} = v_A − v_B')}. From the truck's cab, the car isn't doing ${M('a')} m/s; it's creeping up at ${M('a − b')}. The upper picture is drawn from the truck's point of view, so the truck stays still while the road slides backwards at ${M('b')}.`],
      ['Closing a gap', `The gap changes at the relative speed: ${M('Δx(t) = Δx_0 − (v_A − v_B)t')}. It reaches zero at ${M('t = Δx_0 / (v_A − v_B)')}, provided the difference is positive. That's the graph below: a straight line whose slope is the relative velocity. If the truck is faster, the slope flips sign and the gap grows.`],
      ['Changing frames', `A <em>frame of reference</em> is a point of view from which positions are measured. Subtracting the same velocity from everything switches frames, and the laws of motion look the same in any frame moving at constant velocity (Galilean relativity). That's why you can pour a drink normally on a smoothly cruising plane.`],
      ['Order matters', `Subtraction isn't commutative, and neither is relative velocity: ${M('v_{B rel A} = −v_{A rel B}')}. From the car, the truck approaches at ${M('b − a')}, a negative number, which means moving backwards towards it.`],
    ],
    practice: ({ a, b }, h) => [
      `Overtaking a truck at ${h.val('b')} m/s while doing ${h.val('a')} m/s, you only gain ${h.r(a - b)} m each second. ${a - b > 0 ? `Passing a 20 m truck plus safety gaps takes ${h.r(50 / (a - b), 1)} s.` : 'At that speed you never get past it.'}`,
      `Two trains approaching head-on at 30 m/s each close at 30 − (−30) = 60 m/s: subtracting a negative adds.`,
      `Docking with the space station, both craft move at about 7,660 m/s, but the relative speed at contact is a few centimetres per second.`,
    ],
  };

  // ---------- × : distance = speed × time ----------

  const exDistance = {
    id: 'distance',
    label: 'Distance travelled',
    build: 1.2,
    lede: 'At a steady speed, every second adds the same distance. Distance is speed multiplied by time.',
    params: {
      v: { value: 4, min: 1, max: 10, step: 0.5, color: 'a', label: 'speed in m/s' },
      secs: { value: 6, min: 1, max: 10, step: 1, color: 'b', label: 'time in seconds', digits: 0 },
    },
    sim: { duration: ({ secs }) => secs },
    formula: (p, h) => `${h.n('v')}${op('×')}${h.n('secs')}${op('=')}${h.r(p.v * p.secs)}${h.unit('m')}`,
    aside: ({ v, secs }, h) => `<div>speed × time = distance: ${fmt(secs, 0)} seconds of ${h.val('v')} m each</div>`,
    readout: ({ v }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('distance', fmt(v * t, 1), 'm'),
    draw({ v, secs }, h, { k, t }) {
      const X = (m) => 50 + m * 7, y = 120;
      const u1 = seg(k, 0, 0.6), u2 = seg(k, 0.4, 1);
      let scene = S.line(X(0), y, X(100), y, 'grid2', 2);
      for (let m = 0; m <= 100; m += 10) scene += S.line(X(m), y, X(m), y + 6, 'grid2', 1.5) + S.text(X(m), y + 22, `${m}`, { fill: 'muted', size: 11 });
      scene += S.text(X(100), y + 40, 'metres', { fill: 'muted', size: 11, anchor: 'end' });
      let s = S.fade(u1, scene);
      // A post every whole second, and the v metres covered in between.
      let actors = '';
      const gap = v * 7;
      for (let n = 1; n <= Math.floor(t + 1e-9); n++) {
        actors += S.line(X(v * n), y - 46, X(v * n), y, 'b', 2) + S.poly([[X(v * n), y - 46], [X(v * n) + 9, y - 42], [X(v * n), y - 38]], 'b', null);
        if (gap >= 24) actors += S.text(X(v * n), y - 52, `${n} s`, { fill: 'b', size: 11 });
        if (gap >= 30) actors += S.text(X(v * (n - 0.5)), y + 40 + 14, `+${fmt(v)}`, { fill: 'a', size: 11 });
      }
      actors += car(X(v * t) - 31, y, 31, 'a', (v * t) / 0.35);
      const Gr = graph({ y0: 395, y1: 215, tMax: 10, vMax: 100, vLabel: 'distance (m)', vStep: 20 });
      let plot = Gr.s + S.line(Gr.X(0), Gr.Y(0), Gr.X(t), Gr.Y(v * t), 'ink', 3);
      for (let n = 1; n <= Math.floor(t + 1e-9); n++) plot += S.circle(Gr.X(n), Gr.Y(v * n), 3.5, 'b');
      plot += S.circle(Gr.X(t), Gr.Y(v * t), 5, 'ink');
      if (t >= secs - 1e-9) plot += S.text(Gr.X(t) + 10, Gr.Y(v * t) + 4, `${fmt(v * t)} m`, { size: 13, weight: 600, anchor: 'start' });
      return s + S.fade(u2, actors) + S.fade(u1, plot);
    },
    theory: [
      ['Uniform motion', `Moving at a constant velocity ${M('v')}, position changes by the same amount every second. Starting from ${M('x_0')}, ${M('x(t) = x_0 + vt')}. The distance covered in time ${M('t')} is ${M('d = v × t')}. The posts show it as repeated addition: ${M('t')} seconds, each adding ${M('v')} metres.`],
      ['Units multiply too', `Units follow the same algebra as numbers: (m/s) × s = m. The seconds cancel like a fraction. Checking that the units of an answer come out right is a quick test of whether the formula makes sense.`],
      ['Two graphs, one fact', `On a distance–time graph, constant speed is a straight line through the origin with slope ${M('v')} (see Straight lines). On a speed–time graph it's a flat line at height ${M('v')}, and the distance is the <em>area</em> under it, a rectangle ${M('v × t')} (see Rectangle). That link between slopes and areas is the core idea of calculus.`],
      ['Rearranging', `The same relationship answers three questions: ${M('d = vt')}, ${M('v = d/t')} and ${M('t = d/v')}. Average speed is total distance divided by total time, which isn't the average of the speeds when the times differ.`],
    ],
    practice: ({ v, secs }, h) => [
      `Cycling at ${h.val('v')} m/s (${h.r(v * 3.6, 1)} km/h) for ${h.val('secs')} s covers ${h.r(v * secs)} m.`,
      `Light travels 300,000 km every second, so the 8 min 20 s it takes from the Sun means the Sun is 300,000 × 500 = 150 million km away.`,
      `Thunder: sound covers about 343 m per second, so count the seconds after the flash and multiply. ${h.val('secs')} s means the lightning was ${h.r(343 * secs, 0)} m away.`,
    ],
  };

  // ---------- ÷ : acceleration = force ÷ mass ----------

  const TRACK = 40;

  const exPush = {
    id: 'push',
    label: 'Pushing a cart',
    build: 1.2,
    lede: 'Push with a steady force and a cart speeds up. Dividing the force by the mass tells you how fast it gains speed.',
    params: {
      F: { value: 10, min: 1, max: 20, step: 1, color: 'a', label: 'force in newtons' },
      m: { value: 5, min: 1, max: 20, step: 0.5, color: 'b', label: 'mass in kilograms' },
    },
    sim: { duration: ({ F, m }) => Math.min(Math.sqrt((2 * (TRACK - 4)) / (F / m)), 12) },
    formula: (p, h) => `${h.n('F')}${op('÷')}${h.n('m')}${op('=')}${h.r(p.F / p.m)}${h.unit('m/s²')}`,
    aside: ({ F, m }, h) => `<div>force ÷ mass = acceleration: every second the cart gains ${h.r(F / m)} m/s of speed</div>`,
    readout: ({ F, m }, h, { t }) => {
      const a = F / m;
      return h.ro('time', fmt(t, 1), 's') + h.ro('speed', fmt(a * t, 1), 'm/s') + h.ro('distance', fmt(0.5 * a * t * t, 1), 'm');
    },
    draw({ F, m }, h, { k, t }) {
      const a = F / m, X = (d) => 60 + d * 17, y = 130;
      const T = Math.min(Math.sqrt((2 * (TRACK - 4)) / a), 12);
      const cw = 30 + m * 2.5, ch = 18 + m * 1.3;
      const u1 = seg(k, 0, 0.6), u2 = seg(k, 0.4, 1);
      let scene = S.line(X(0), y, X(TRACK), y, 'grid2', 2);
      for (let d = 0; d <= TRACK; d += 5) scene += S.line(X(d), y, X(d), y + 6, 'grid2', 1.5) + S.text(X(d), y + 22, d, { fill: 'muted', size: 11 });
      scene += S.text(X(TRACK), y + 40, 'metres', { fill: 'muted', size: 11, anchor: 'end' });
      let s = S.fade(u1, scene);
      const cart = (x, ghost) => ghost
        ? S.rect(X(x), y - ch - 8, cw, ch, null, 'grid2', { rx: 3, 'stroke-width': 1.5 })
        : S.rect(X(x), y - ch - 8, cw, ch, 'b', null, { rx: 3 }) + wheels([X(x) + cw * 0.25, X(x) + cw * 0.75], y + 2, (0.5 * a * t * t) / 0.3) +
          (cw > 44 ? S.text(X(x) + cw / 2, y - ch / 2 - 3, `${fmt(m)} kg`, { fill: 'paper', size: 11, weight: 600 }) : '');
      // Snapshots every half second: the gaps between them keep growing.
      let actors = '';
      for (let tau = 0.5; tau < t - 1e-9; tau += 0.5) actors += cart(0.5 * a * tau * tau, true);
      const x = 0.5 * a * t * t;
      actors += cart(x, false);
      actors += S.arrow(X(x) - 10 - F * 4, y - ch / 2 - 8, X(x) - 3, y - ch / 2 - 8, 'a', 3.5);
      actors += S.text(X(x) - 12 - F * 4, y - ch / 2 - 3, `${fmt(F)} N`, { fill: 'a', size: 12, weight: 600, anchor: 'end' });
      const Gr = graph({ y0: 395, y1: 225, tMax: T, vMax: Math.max(1, a * T), vLabel: 'speed (m/s)' });
      let plot = Gr.s + S.line(Gr.X(0), Gr.Y(0), Gr.X(t), Gr.Y(a * t), 'ink', 3) + S.circle(Gr.X(t), Gr.Y(a * t), 5, 'ink');
      plot += S.text(Gr.X(T * 0.55) - 10, Gr.Y(a * T * 0.55) - 10, `slope = ${fmt(a)} m/s²`, { fill: 'muted', size: 12, anchor: 'end' });
      return s + S.fade(u2, actors) + S.fade(u1, plot);
    },
    theory: [
      ['Newton’s second law', `A net force ${M('F')} on a mass ${M('m')} produces an acceleration ${M('a = F / m')}. This is usually written ${M('F = ma')}. Acceleration is the rate at which velocity changes, measured in metres per second, per second: m/s². The force is measured in newtons, where 1 N is the force that accelerates 1 kg by 1 m/s².`],
      ['Inverse proportion', `Because the mass is in the denominator, doubling it halves the acceleration, and tripling it gives a third. Doubling the force doubles the acceleration. Try making both twice as big: the quotient, and the motion, stays the same.`],
      ['Constant acceleration', `With a steady force, speed grows in a straight line, ${M('v = at')} (the lower graph). Distance grows as ${M('d = ½at^2')}: the area of the triangle under that line, ½ × base ${M('t')} × height ${M('at')}. That's why the snapshots, taken every half second, spread further apart each time.`],
      ['What’s left out', `${M('F')} here is the <em>net</em> force: everything pushing minus everything resisting. Real carts have friction and air drag, which grow with speed until they cancel the push. Then the acceleration drops to zero and the cart cruises at a steady top speed.`],
    ],
    practice: ({ F, m }, h) => [
      `A ${h.val('F')} N push on a ${h.val('m')} kg cart gives ${h.r(F / m)} m/s². After 3 s it’s moving at ${h.r((3 * F) / m)} m/s.`,
      `A loaded shopping trolley is harder to get moving than an empty one: same push, more mass, less acceleration.`,
      `A 1,500 kg car with 4,500 N of net driving force accelerates at 3 m/s², reaching 100 km/h (27.8 m/s) in about 9 s.`,
    ],
  };

  // ---------- ^ : falling distance grows with the square of time ----------

  const PLANETS = [[1.62, 'the Moon’s'], [3.71, 'Mars’s'], [9.81, 'Earth’s'], [24.79, 'Jupiter’s']];

  const exFall = {
    id: 'fall',
    label: 'Falling',
    build: 1.2,
    compact: true,
    lede: 'A dropped ball keeps speeding up, so the distance it falls grows with the square of the time.',
    params: {
      g: { value: 9.8, min: 1, max: 25, step: 0.1, color: 'a', label: 'gravity in m/s²', digits: 1 },
      secs: { value: 4, min: 1, max: 6, step: 0.5, color: 'b', label: 'time in seconds' },
    },
    sim: { duration: ({ secs }) => secs },
    formula: (p, h) => `${HALF}${op('×')}${h.n('g')}${op('×')}${h.n('secs')}<sup>2</sup>${op('=')}${h.r(0.5 * p.g * p.secs * p.secs, 1)}${h.unit('m')}`,
    aside({ g, secs }, h) {
      const near = PLANETS.find(([v]) => Math.abs(v - g) < 0.2);
      return `<div>speed when it lands: ${h.val('g')} × ${h.val('secs')} = ${h.r(g * secs, 1)} m/s</div>` +
        (near ? `<div class="note">That’s ${near[1]} gravity.</div>` : '');
    },
    readout: ({ g }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('fallen', fmt(0.5 * g * t * t, 1), 'm') + h.ro('speed', fmt(g * t, 1), 'm/s'),
    draw({ g, secs }, h, { k, t }) {
      const T = secs, D = 0.5 * g * T * T, y0 = 40, yB = 390, sc = (yB - y0) / D, bx = 230;
      const Y = (d) => y0 + d * sc;
      const u1 = seg(k, 0, 0.6), u2 = seg(k, 0.4, 1);
      let scene = S.line(170, y0, 170, yB, 'grid2', 1.5);
      const step = niceStep(D / 7);
      for (let d = 0; d <= D + 1e-9; d += step) scene += S.line(164, Y(d), 170, Y(d), 'grid2', 1.5) + S.text(158, Y(d) + 4, `${fmt(d)} m`, { fill: 'muted', size: 11, anchor: 'end' });
      // Time on the graph runs left to right; distance shares the ruler's scale, so the curve sits level with the ball.
      const gx0 = 360, gx1 = 740, GX = (tt) => gx0 + (tt / T) * (gx1 - gx0);
      scene += S.line(gx0, y0, gx1, y0, 'grid2', 1.5) + S.line(gx0, y0, gx0, yB, 'grid2', 1.5);
      for (let n = 1; n <= T + 1e-9; n++) scene += S.line(GX(n), y0, GX(n), yB, 'grid', 1) + S.text(GX(n), y0 - 8, `${n} s`, { fill: 'muted', size: 11 });
      scene += S.text(gx1, yB + 18, 'distance fallen against time', { fill: 'muted', size: 12, anchor: 'end' });
      let s = S.fade(u1, scene);

      let actors = '';
      for (let tau = 0.5; tau < t - 1e-9; tau += 0.5) {
        actors += S.circle(bx, Y(0.5 * g * tau * tau), 10, null, 'grid2', { 'stroke-width': 1.5 });
      }
      let d = '';
      for (let i = 0; i <= 60; i++) { const tt = (t * i) / 60; d += `${i ? 'L' : 'M'}${GX(tt).toFixed(1)} ${Y(0.5 * g * tt * tt).toFixed(1)} `; }
      if (t > 0) actors += S.path(d, 'ink', 3);
      for (let n = 1; n <= Math.floor(t + 1e-9); n++) {
        const dn = 0.5 * g * n * n;
        actors += S.circle(GX(n), Y(dn), 4, 'b') + S.text(GX(n) + 8, Y(dn) - 6, `${fmt(dn, 1)} m`, { fill: 'b', size: 12, anchor: 'start' });
      }
      const yy = Y(0.5 * g * t * t);
      actors += S.line(bx, yy, GX(t), yy, 'muted', 1, dashed('2 5')) + S.circle(GX(t), yy, 5, 'ink');
      actors += S.circle(bx, yy, 11, 'a');
      return s + S.fade(u2, actors);
    },
    theory: [
      ['Constant acceleration', `Near a planet's surface, and ignoring air, everything falls with the same acceleration ${M('g')}, whatever its mass. On Earth ${M('g')} ≈ 9.81 m/s². Galileo showed this with balls on ramps; on the Moon in 1971, astronaut David Scott dropped a hammer and a feather, and they landed together.`],
      ['Where the square comes from', `Speed grows steadily, ${M('v = gt')}. The distance fallen is the area under that speed–time line, a triangle with base ${M('t')} and height ${M('gt')}: ${M('d = ½ × t × gt = ½gt^2')} (see Any triangle). Doubling the time quadruples the distance, and tripling it multiplies the distance by nine.`],
      ['Galileo’s odd numbers', `The distances after 1, 2, 3, 4 seconds are in the ratio 1 : 4 : 9 : 16, the square numbers. So the distance covered <em>during</em> each successive second goes 1 : 3 : 5 : 7, the odd numbers. Each square is the previous square plus the next odd number. You can see it in the half-second snapshots: equal times, growing gaps.`],
      ['Running it backwards', `To find how long a fall takes, undo the square with a square root: ${M('t = √(2d / g)')}. A 20 m drop on Earth takes about 2 s. Real objects eventually stop speeding up when air resistance balances their weight, at their <em>terminal velocity</em> (about 55 m/s for a skydiver).`],
    ],
    practice: ({ g, secs }, h) => [
      `Drop a stone into a well and hear the splash after ${h.val('secs')} s: the well is about ${h.r(0.5 * g * secs * secs, 0)} m deep (ignoring the time the sound takes to come back).`,
      `On the Moon (g = 1.62), the same ${h.val('secs')} s fall covers only ${h.r(0.5 * 1.62 * secs * secs, 1)} m. On Jupiter (g = 24.8) it would be ${h.r(0.5 * 24.79 * secs * secs, 0)} m.`,
      `Braking distance follows a square law too: twice the speed needs about four times the distance to stop.`,
    ],
  };

  // ---------- Captions and sounds for the examples above ----------

  Object.assign(exWalkway, {
    steps: [{ at: 0, hl: [], say: 'Two walkers set off at the same walking pace: one on the floor, one on the walkway.' }],
    simSay: ({ w, v }, h, { t }) => `Every second, the walkway walker moves ${fmt(w)} (walking) + ${fmt(v)} (belt) = ${fmt(w + v)} m. So far: ${fmt((w + v) * t, 1)} m.`,
    simSfx: ({ w, v }) => {
      const T = exWalkway.sim.duration({ w, v }), ev = [];
      for (let s = 0.5; s < T; s += 0.5) ev.push(sfx.tick(s, note(Math.round(s * 2) % 2 ? 0 : 2)));
      return ev;
    },
  });
  Object.assign(exChase, {
    steps: [{ at: 0, hl: [], say: 'A car 60 m behind a truck, seen from the truck’s point of view.' }],
    simSay: ({ a, b }, h, { t }) => (a - b > 0 && GAP - (a - b) * t <= 0.01
      ? 'Caught up: the gap closed at the difference of the speeds.'
      : `The gap changes by ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)} m every second. It’s now ${fmt(Math.max(0, GAP - (a - b) * t), 1)} m.`),
    simSfx: ({ a, b }) => (a - b > 0 && GAP / (a - b) <= 15 ? [sfx.whoosh(0, Math.min(1.5, GAP / (a - b))), sfx.thud(GAP / (a - b) - 0.01)] : [sfx.whoosh(0, 1.5)]),
  });
  Object.assign(exDistance, {
    steps: [{ at: 0, hl: [], say: 'A car moving at a steady speed. A post goes in every second.' }],
    simSay: ({ v }, h, { t }) => `${fmt(Math.floor(t + 1e-9))} second${Math.floor(t + 1e-9) === 1 ? '' : 's'} of ${fmt(v)} m each: ${fmt(v)} × ${fmt(t, 1)} = ${fmt(v * t, 1)} m.`,
    simSfx: ({ secs }) => Array.from({ length: secs }, (_, i) => sfx.tick(i + 1 - 0.01, note(i))),
  });
  Object.assign(exPush, {
    steps: [{ at: 0, hl: [], say: 'A cart at rest, about to be pushed with a steady force.' }],
    simSay: ({ F, m }, h, { t }) => `${fmt(F)} ÷ ${fmt(m)} = ${fmt(F / m)}: every second it gains ${fmt(F / m)} m/s. Speed now ${fmt((F / m) * t, 1)} m/s.`,
    simSfx: ({ F, m }) => {
      const T = exPush.sim.duration({ F, m }), ev = [];
      for (let tau = 0.5, i = 0; tau < T; tau += 0.5, i++) ev.push(sfx.tick(tau, note(i)));
      return ev;
    },
  });
  Object.assign(exFall, {
    steps: [{ at: 0, hl: [], say: 'A ball about to be dropped. Faint copies mark every half second.' }],
    simSay: ({ g }, h, { t }) => `After ${fmt(t, 1)} s: ½ × ${fmt(g, 1)} × ${fmt(t, 1)}² = ${fmt(0.5 * g * t * t, 1)} m. Twice the time, four times the drop.`,
    // A note every half second, climbing as the ball speeds up.
    simSfx: ({ secs }) => [...Array.from({ length: Math.floor(secs * 2) }, (_, i) => sfx.tick((i + 1) / 2 - 0.01, note(i))), sfx.thud(secs - 0.02)],
  });

  // ---------- Shared bits for the general explanations ----------

  const axis = (y, X, lo, hi, every = 2) => {
    let s = S.line(X(lo), y, X(hi), y, 'grid2', 1.5);
    for (let v = lo; v <= hi; v++) {
      s += S.line(X(v), y - (v % every ? 3 : 6), X(v), y + (v % every ? 3 : 6), v === 0 ? 'ink' : 'grid2', v === 0 ? 2 : 1.2);
      if (v % every === 0) s += S.text(X(v), y + 22, fmt(v), { fill: v === 0 ? 'ink' : 'muted', size: 11 });
    }
    return s;
  };
  const caption = (x, y, text) => S.text(x, y, text, { anchor: 'start', fill: 'muted', size: 13 });

  // ---------- + in general ----------

  const addConcept = {
    id: 'concept',
    label: 'The operation',
    lede: 'Adding combines quantities of the same kind into a total. Directions count: opposite directions partly cancel.',
    build: 3.4,
    params: {
      a: { value: 3, min: -5, max: 5, step: 0.5, color: 'a', label: 'first quantity' },
      b: { value: 2, min: -5, max: 5, step: 0.5, color: 'b', label: 'second quantity' },
    },
    formula: (p, h) => `${h.n('a')}${h.signed('b')}${op('=')}${h.r(p.a + p.b)}`,
    aside: () => `<div class="note">Only quantities of the same kind, in the same unit, can be added. The sign carries the direction.</div>`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `A quantity with a size and a direction: ${fmt(a)}, pointing ${a >= 0 ? 'right' : 'left'}.` },
      { at: 0.18, hl: ['+', 'b'], say: ({ b }) => `Add ${fmt(b)}: place it where the first one ends${b < 0 ? '. It points back, so it takes some away' : ''}.` },
      { at: 0.36, hl: ['=', 'res'], say: ({ a, b }) => `The total runs from the start of one to the end of the other: ${fmt(a + b)}.` },
      { at: 0.5, hl: ['a', 'b'], say: 'Now two effects spread out in space, like two ripples on water…' },
      { at: 0.78, hl: ['+', 'res'], say: '…where they overlap, they add point by point. That rule is called superposition.' },
    ],
    sfx: ({ a, b }) => [
      sfx.glide(0, 0.16, pitch(0), pitch(2 * a)), sfx.glide(0.18, 0.34, pitch(2 * a), pitch(2 * (a + b))), sfx.chime(0.38, pitch(2 * (a + b))),
      sfx.glide(0.5, 0.64, pitch(-3), pitch(2 * a)), sfx.glide(0.62, 0.76, pitch(-3), pitch(2 * b)),
      sfx.curve(0.78, 0.95, Array.from({ length: 30 }, (_, i) => { const x = (10 * i) / 29; return pitch(3 * (a * Math.exp(-((x - 4) ** 2) / 1.2) + b * Math.exp(-((x - 6) ** 2) / 1.2))); })),
    ],
    draw({ a, b }, h, { k }) {
      const X = (v) => 400 + v * 34;
      const u1 = seg(k, 0, 0.16), u2 = seg(k, 0.18, 0.34), u3 = seg(k, 0.36, 0.46);
      let s = caption(60, 26, 'Quantities with a direction add tip to tail');
      s += axis(120, X, -10, 10);
      s += S.arrow(X(0), 86, X(a * u1), 86, 'a', 3.5) + S.fade(u1, S.text(X(a / 2), 74, fmt(a), { fill: 'a', size: 14, weight: 600 }));
      s += S.fade(u2, S.line(X(a), 120, X(a), 50, 'grid2', 1, dashed('3 4')));
      if (u2 > 0) s += S.arrow(X(a), 56, X(a + b * u2), 56, 'b', 3.5) + S.fade(u2, S.text(X(a + b / 2), 44, fmt(b), { fill: 'b', size: 14, weight: 600 }));
      s += S.arrow(X(0), 160, X((a + b) * u3), 160, 'ink', 4) + S.fade(u3, S.text(X((a + b) / 2), 184, `total ${fmt(a + b)}`, { size: 14, weight: 600 }));

      // Two bumps and their point-by-point sum.
      const u4 = seg(k, 0.5, 0.64), u5 = seg(k, 0.62, 0.76), u6 = seg(k, 0.78, 0.95);
      const base = 330, sx = (x) => 60 + x * 68, sy = (v) => base - v * 17;
      const g1 = (x) => a * Math.exp(-((x - 4) ** 2) / 1.2), g2 = (x) => b * Math.exp(-((x - 6) ** 2) / 1.2);
      const path = (f) => Array.from({ length: 101 }, (_, i) => { const x = i / 10; return `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(f(x)).toFixed(1)}`; }).join(' ');
      let low = S.fade(seg(k, 0.46, 0.52), caption(60, 222, 'Effects that overlap add at every point') + S.line(sx(0), base, sx(10), base, 'grid2', 1.5));
      low += S.path(path(g1), 'a', 2, { ...drawOn(u4), ...(u6 > 0 ? dashed('5 4') : {}) });
      low += S.path(path(g2), 'b', 2, { ...drawOn(u5), ...(u6 > 0 ? dashed('5 4') : {}) });
      // Stacked stems: at each point, the amber piece stands on top of the blue one.
      for (let i = 0; i <= 20; i++) {
        const x = i / 2, ui = seg(k, 0.78 + i * 0.006, 0.84 + i * 0.006);
        if (ui <= 0) continue;
        low += S.line(sx(x), sy(0), sx(x), sy(g1(x) * ui), 'a', 3, { opacity: 0.7 }) + S.line(sx(x), sy(g1(x) * ui), sx(x), sy((g1(x) + g2(x)) * ui), 'b', 3, { opacity: 0.7 });
      }
      low += S.path(path((x) => g1(x) + g2(x)), 'ink', 3.5, drawOn(u6));
      return s + low;
    },
    theory: [
      ['Only like with like', `Adding needs quantities of the same kind, measured in the same unit. A length plus a length is a length; a length plus a time means nothing. Before adding, convert units so they match: 1 m + 50 cm is 1.5 m, not 51 of anything. Every term in a correct physics equation has the same unit, a check called <em>dimensional analysis</em>.`],
      ['Direction lives in the sign', `Many physical quantities have a direction as well as a size. Along a line, the direction is the sign: right or up is positive, left or down negative. Adding a negative quantity takes some away, and two equal quantities in opposite directions cancel to zero. In two or three dimensions, the same idea becomes adding <em>vectors</em> tip to tail, or component by component.`],
      ['Totals', `A total is a sum of parts: the whole is the parts added together, wherever they are. Many of physics' deepest laws are statements about sums that never change, <em>conservation laws</em>: the parts can move and change, but their total stays fixed.`],
      ['Superposition', `In many systems, when two causes act at once, the result is simply the sum of what each would do alone. Two overlapping ripples, two sounds, two pushes on the same object: each adds its share, point by point. This <em>superposition principle</em> holds whenever the system is <em>linear</em>, and it's what lets physicists break complicated situations into simple pieces and add the answers.`],
    ],
    practice: null,
  };

  const exPulses = {
    id: 'pulses',
    label: 'Overlapping waves',
    lede: 'Two pulses run along a rope toward each other. Where they overlap, the rope’s height is the sum of both.',
    build: 1,
    params: {
      a: { value: 2, min: -3, max: 3, step: 0.5, color: 'a', label: 'height of the left pulse' },
      b: { value: 1.5, min: -3, max: 3, step: 0.5, color: 'b', label: 'height of the right pulse' },
    },
    sim: { duration: () => 7 },
    formula: (p, h) => `${h.n('a')}${h.signed('b')}${op('=')}${h.r(p.a + p.b)}`,
    aside: () => `<div class="note">The height of the rope where the two peaks meet</div>`,
    readout: ({ a, b }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('height at the middle', fmt(a * Math.exp(-(((10 - (3 + 2 * t)) / 1.1) ** 2)) + b * Math.exp(-(((10 - (17 - 2 * t)) / 1.1) ** 2)), 2)),
    steps: [{ at: 0, hl: [], say: 'A rope with a pulse at each end.' }],
    simSay: ({ a, b }, h, { t }) => (t < 3.1 ? 'The pulses travel toward each other.'
      : t < 3.9 ? `Overlapping: the heights add. ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}${a * b < 0 ? ', so they partly cancel' : ''}.`
        : 'They pass straight through each other, unchanged.'),
    simSfx: ({ a, b }) => [sfx.whoosh(0, 2.5), a * b >= 0 ? sfx.chime(3.45, pitch(3 * (a + b))) : sfx.thud(3.45), sfx.swoosh(4.2, 6.5)],
    draw({ a, b }, h, { k, t }) {
      const X = (x) => 40 + x * 36, y0 = 230, Y = (v) => y0 - v * 36;
      const x1 = 3 + 2 * t, x2 = 17 - 2 * t;
      const g = (x, c, amp) => amp * Math.exp(-(((x - c) / 1.1) ** 2));
      const path = (f) => Array.from({ length: 201 }, (_, i) => { const x = i / 10; return `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`; }).join(' ');
      let s = S.fade(seg(k, 0, 0.6), S.line(X(0), y0, X(20), y0, 'grid', 1, dashed('3 5')) +
        S.rect(X(0) - 14, y0 - 60, 12, 120, 'ink-soft', null, { rx: 3 }) + S.rect(X(20) + 2, y0 - 60, 12, 120, 'ink-soft', null, { rx: 3 }));
      s += S.path(path((x) => g(x, x1, a)), 'a', 2, { ...dashed('5 4'), opacity: 0.8 });
      s += S.path(path((x) => g(x, x2, b)), 'b', 2, { ...dashed('5 4'), opacity: 0.8 });
      s += S.path(path((x) => g(x, x1, a) + g(x, x2, b)), 'ink', 3.5);
      if (t < 3.2) {
        s += S.arrow(X(x1) - 20, Y(a) - 24 * Math.sign(a || 1), X(x1) + 20, Y(a) - 24 * Math.sign(a || 1), 'a', 2.5);
        s += S.arrow(X(x2) + 20, Y(b) - 24 * Math.sign(b || 1), X(x2) - 20, Y(b) - 24 * Math.sign(b || 1), 'b', 2.5);
      }
      const mid = g(10, x1, a) + g(10, x2, b);
      if (t > 2.9 && t < 4.1) s += S.circle(X(10), Y(mid), 6, 'ink') + S.text(X(10) + 12, Y(mid) + (mid >= 0 ? -10 : 18), fmt(mid), { anchor: 'start', size: 14, weight: 600 });
      return s;
    },
    theory: [
      ['Superposition on a rope', `Each pulse is a bump in the rope's height. When two bumps reach the same stretch of rope, the rope can't choose between them: its height there is the sum of the two heights. Same-sign pulses build a taller peak, <em>constructive interference</em>; opposite-sign pulses cancel, <em>destructive interference</em>.`],
      ['Passing through', `Adding doesn't destroy anything. After they overlap, each pulse carries on exactly as it was, because each one's shape was never changed, only added to. Noise-cancelling headphones rely on this: they add a sound wave that is the exact negative of the noise.`],
    ],
    practice: ({ a, b }, h) => [
      `Set the heights to ${h.c('a', '2')} and ${h.c('b', '−2')}: at the moment they meet, the rope is completely flat.`,
      `Two speakers playing the same note can make a room louder in some places and almost silent in others, where their waves add or cancel.`,
    ],
  };

  // ---------- − in general ----------

  const subConcept = {
    id: 'concept',
    label: 'The operation',
    lede: 'Subtracting measures a difference: how much something changed, or how one thing looks when you measure it from another.',
    build: 3.4,
    params: {
      a: { value: 4, min: -6, max: 6, step: 0.5, color: 'a', label: 'final value' },
      b: { value: 1, min: -6, max: 6, step: 0.5, color: 'b', label: 'starting value' },
    },
    formula: (p, h) => `${h.n('a')}${op(MINUS)}${p.b < 0 ? '(' : ''}${h.n('b')}${p.b < 0 ? ')' : ''}${op('=')}${h.r(p.a - p.b)}`,
    aside: () => `<div class="note">final − start = the change. Its sign tells you which way things went.</div>`,
    steps: [
      { at: 0, hl: ['b'], say: ({ b }) => `A starting value: ${fmt(b)}.` },
      { at: 0.14, hl: ['a'], say: ({ a }) => `A final value: ${fmt(a)}.` },
      { at: 0.28, hl: [MINUS, 'res'], say: ({ a, b }) => `The difference is the change, Δ = ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}: ${a - b > 0 ? 'it went up' : a - b < 0 ? 'it went down' : 'no change'}.` },
      { at: 0.5, hl: ['b'], say: ({ b }) => `Now measure everything from ${fmt(b)} instead of from 0…` },
      { at: 0.8, hl: ['=', 'res'], say: ({ a, b }) => `…and the final value sits at ${fmt(a - b)}. Subtracting moves the zero to wherever you stand.` },
    ],
    sfx: ({ a, b }) => [sfx.tick(0.02, pitch(2 * b)), sfx.tick(0.16, pitch(2 * a)), sfx.glide(0.28, 0.44, pitch(2 * b), pitch(2 * a)), sfx.whoosh(0.5, 0.78), sfx.chime(0.82, pitch(2 * (a - b)))],
    draw({ a, b }, h, { k }) {
      const X = (v) => 400 + v * 30;
      const u1 = seg(k, 0, 0.12), u2 = seg(k, 0.14, 0.26), u3 = seg(k, 0.28, 0.44), u4 = seg(k, 0.5, 0.78), u5 = seg(k, 0.8, 0.95);
      let s = caption(60, 26, 'A change: from where it started to where it ended');
      s += axis(120, X, -12, 12);
      s += S.fade(u1, S.circle(X(b), 120, 8, 'b') + S.text(X(b), 96, `start ${fmt(b)}`, { fill: 'b', size: 13 }));
      s += S.fade(u2, S.circle(X(a), 120, 8, 'a') + S.text(X(a), 96, `end ${fmt(a)}`, { fill: 'a', size: 13 }));
      if (u3 > 0) s += S.arrow(X(b), 160, X(b + (a - b) * u3), 160, 'ink', 3.5);
      s += S.fade(u3, S.text(X((a + b) / 2), 184, `Δ = ${fmt(a - b)}`, { size: 14, weight: 600 }));

      // The same two points, re-measured from the starting value.
      let low = S.fade(seg(k, 0.46, 0.52), caption(60, 226, 'The same points, measured from the start instead of from 0') + axis(300, X, -12, 12));
      const pb = X(b - b * u4), pa = X(a - b * u4);
      low += S.fade(seg(k, 0.46, 0.52), S.circle(pb, 300, 8, 'b') + S.circle(pa, 300, 8, 'a'));
      low += S.fade(u4, S.text(pb, 276, 'start', { fill: 'b', size: 13 }));
      if (u5 > 0) low += S.arrow(X(0), 340, X((a - b) * u5), 340, 'ink', 3.5) + S.fade(u5, S.text(X((a - b) / 2), 366, `${fmt(a - b)} from the start`, { size: 14, weight: 600 }));
      return s + low;
    },
    theory: [
      ['Change', `Physics is full of changes, and every one is a subtraction: final value minus starting value, written ${M('Δx = x_{end} − x_{start}')} (Δ, "delta", means "change in"). A positive Δ means the quantity grew, a negative one means it shrank, and the size says by how much. Swapping the order flips the sign: subtraction isn't commutative.`],
      ['Where you put zero', `Many quantities only make sense measured from some reference point: a position, a height, a time, an energy level. Subtracting the reference re-measures everything from it. The difference between two values doesn't depend on where zero is, which is why physics usually cares about differences rather than raw values.`],
      ['Relative quantities', `Subtracting one moving thing's value from another's gives the relative value: how things look from the second one's point of view. Changing your point of view, your <em>frame of reference</em>, is a subtraction applied to everything at once.`],
      ['Net effects', `When two influences pull in opposite directions, the overall effect is their difference, the <em>net</em> amount. Equal and opposite influences give a net of zero: balance, and nothing changes. Differences are also the first step toward rates: divide a change by how long it took (see Division).`],
    ],
    practice: null,
  };

  const exTug = {
    id: 'tug',
    label: 'Tug of war',
    lede: 'Two teams pull on a rope. Only the difference between their pulls, the net pull, moves the rope.',
    build: 1,
    params: {
      a: { value: 6, min: 0, max: 10, step: 0.5, color: 'a', label: 'right team’s pull' },
      b: { value: 4, min: 0, max: 10, step: 0.5, color: 'b', label: 'left team’s pull' },
    },
    sim: { duration: ({ a, b }) => (a === b ? 4 : Math.min(6, Math.sqrt((2 * 3) / (Math.abs(a - b) / 4)))) },
    formula: (p, h) => `${h.n('a')}${op(MINUS)}${h.n('b')}${op('=')}${h.r(p.a - p.b)}`,
    aside: ({ a, b }) => `<div class="note">${a > b ? 'The net pull is to the right.' : a < b ? 'Negative: the net pull is to the left.' : 'Zero net pull: a stalemate.'}</div>`,
    readout: ({ a, b }, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('net pull', fmt(a - b)) + h.ro('rope moved', fmt(Math.max(-3, Math.min(3, (0.5 * (a - b) * t * t) / 4)), 2), 'm'),
    steps: [{ at: 0, hl: [], say: 'Two teams take the strain.' }],
    simSay: ({ a, b }) => (a === b ? 'Equal pulls cancel: the net is zero, so the rope doesn’t move.'
      : `Each team’s pull partly cancels the other’s. What’s left over, ${fmt(Math.abs(a - b))}, drags the rope ${a > b ? 'right' : 'left'}.`),
    simSfx: ({ a, b }) => (a === b ? [] : [sfx.thud(exTug.sim.duration({ a, b }) - 0.02)]),
    draw({ a, b }, h, { k, t }) {
      const net = a - b, x = Math.max(-3, Math.min(3, (0.5 * net * t * t) / 4)), off = x * 60;
      const y = 230, ground = 300;
      let s = S.fade(seg(k, 0, 0.6), S.line(40, ground, 760, ground, 'grid2', 1.5) +
        S.line(400, y - 90, 400, ground, 'muted', 1.5, dashed('4 5')) +
        S.line(220, y - 70, 220, ground, 'grid2', 1.5, dashed('2 5')) + S.line(580, y - 70, 580, ground, 'grid2', 1.5, dashed('2 5')));
      const figure = (fx, dir, color) => {
        const lean = 0.35 * dir;
        const hipX = fx, hipY = ground - 26, headX = fx + Math.sin(lean) * 34, headY = hipY - Math.cos(lean) * 34;
        return S.line(hipX, hipY, fx - 10 * dir, ground, color, 3.5) + S.line(hipX, hipY, fx + 6 * dir, ground, color, 3.5) +
          S.line(hipX, hipY, headX, headY, color, 4) + S.circle(headX + Math.sin(lean) * 9, headY - Math.cos(lean) * 9, 8, color);
      };
      let act = S.line(130 + off, y, 670 + off, y, 'ink', 3);
      for (let i = 0; i < 3; i++) act += figure(120 - i * 30 + off, -1, 'b') + figure(680 + i * 30 + off, 1, 'a');
      act += S.rect(394 + off, y - 8, 12, 16, 'c', null, { rx: 3 });
      act += S.arrow(140 + off, y - 40, 140 + off - b * 9, y - 40, 'b', 3) + S.text(140 + off - b * 4.5, y - 50, fmt(b), { fill: 'b', size: 13, weight: 600 });
      act += S.arrow(660 + off, y - 40, 660 + off + a * 9, y - 40, 'a', 3) + S.text(660 + off + a * 4.5, y - 50, fmt(a), { fill: 'a', size: 13, weight: 600 });
      if (net !== 0) act += S.arrow(400 + off, y - 60, 400 + off + net * 14, y - 60, 'ink', 3.5) + S.text(400 + off + net * 7, y - 72, `net ${fmt(net)}`, { size: 13, weight: 600 });
      return s + S.fade(seg(k, 0.3, 1), act);
    },
    theory: [
      ['Opposite pulls subtract', `Both teams pull on the same rope in opposite directions. Counting right as positive, the left team's pull is negative, so the total is ${M('a + (−b) = a − b')}. Only this <em>net</em> pull changes the rope's motion; the rest is used up cancelling the other team.`],
      ['Balance', `When the pulls are equal, the net is zero and the rope stays still, however hard both teams are pulling. A book on a table, a hanging lamp and a parked car are all in balance like this: large forces are acting, but they cancel.`],
    ],
    practice: ({ a, b }, h) => [
      `Pulls of ${h.val('a')} and ${h.val('b')} leave a net of ${h.r(a - b)}. Make them equal and the rope stops, even though both teams are still pulling hard.`,
      `A plane in level flight has lift balancing weight and thrust balancing drag: the net is zero, so its speed stays steady.`,
    ],
  };

  // ---------- × in general ----------

  const mulConcept = {
    id: 'concept',
    label: 'The operation',
    lede: 'Multiplying scales a quantity, or combines two different quantities into a new kind. Double either factor and the result doubles.',
    build: 3.6,
    params: {
      a: { value: 3, min: 0.5, max: 6, step: 0.5, color: 'a', label: 'first factor' },
      b: { value: 4, min: 0.5, max: 6, step: 0.5, color: 'b', label: 'second factor' },
    },
    formula: (p, h) => `${h.n('a')}${op('×')}${h.n('b')}${op('=')}${h.r(p.a * p.b)}`,
    aside: () => `<div class="note">Units multiply too: (unit of the first) × (unit of the second) is the unit of the result.</div>`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `A steady amount, ${fmt(a)}, kept up…` },
      { at: 0.16, hl: ['×', 'b'], say: ({ b }) => `…over a stretch of ${fmt(b)}.` },
      { at: 0.3, hl: ['×'], say: 'Sweep along the stretch: the product is the area swept out, a steady amount accumulated.' },
      { at: 0.62, hl: ['=', 'res'], say: ({ a, b }) => `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}.` },
      { at: 0.72, hl: ['b'], say: ({ a, b }) => `Double the stretch, double the product; triple it, triple the product: ${fmt(a * b)}, ${fmt(2 * a * b)}, ${fmt(3 * a * b)}. That’s proportionality.` },
    ],
    sfx: ({ a, b }) => [sfx.glide(0, 0.14, pitch(0), pitch(2 * a)), sfx.glide(0.16, 0.28, pitch(0), pitch(2 * b)), sfx.glide(0.3, 0.6, pitch(-5), pitch(7)), sfx.chime(0.64, note(5)),
      sfx.pop(0.74, note(5)), sfx.pop(0.82, note(7)), sfx.pop(0.9, note(9))],
    draw({ a, b }, h, { k }) {
      const X = (v) => 80 + v * 58, Y = (v) => 360 - v * 48;
      const u1 = seg(k, 0, 0.14), u2 = seg(k, 0.16, 0.28), u3 = lin(k, 0.3, 0.6), u4 = seg(k, 0.62, 0.7);
      let s = S.line(X(0), Y(0), X(6.2), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(6.4), 'grid2', 1.5);
      for (let v = 1; v <= 6; v++) s += S.text(X(v), Y(0) + 18, v, { fill: 'muted', size: 11 }) + S.text(X(0) - 8, Y(v) + 4, v, { fill: 'muted', size: 11, anchor: 'end' });
      s += caption(X(0), 34, 'A steady amount, accumulated over a stretch');
      if (u3 > 0) {
        s += S.rect(X(0), Y(a), X(b * u3) - X(0), Y(0) - Y(a), 'ink-soft');
        for (let v = 1; v < b * u3; v++) s += S.line(X(v), Y(0), X(v), Y(a), 'grid2', 1);
        if (u3 < 1) s += S.line(X(b * u3), Y(0), X(b * u3), Y(a), 'b', 2.5);
      }
      s += S.line(X(0), Y(a), X(Math.max(b, 0.01) * Math.max(u1 * 0.15, u2)), Y(a), 'a', 3.5);
      s += S.fade(u1, S.text(X(0) - 8, Y(a) - 10, `${fmt(a)}`, { fill: 'a', size: 14, anchor: 'end', weight: 600 }));
      s += S.line(X(0), Y(0) + 26, X(b * u2), Y(0) + 26, 'b', 3) + S.fade(u2, S.text(X(b / 2), Y(0) + 44, fmt(b), { fill: 'b', size: 14, weight: 600 }));
      s += S.fade(u4, S.line(X(b), Y(0), X(b), Y(a), 'ink', 2) + S.text(X(b / 2), Y(a / 2) + 6, `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}`, { size: 16, weight: 600 }));

      // Proportionality: the product for one, two and three times the second factor.
      const bars = [1, 2, 3], max = 3 * a * b, bx = 520;
      let right = S.fade(seg(k, 0.7, 0.76), caption(bx - 20, 34, 'Double a factor, double the result'));
      bars.forEach((m, i) => {
        const u = seg(k, 0.72 + i * 0.08, 0.8 + i * 0.08);
        if (u <= 0) return;
        const hgt = ((m * a * b) / max) * 260 * u, x = bx + i * 75;
        right += S.rect(x, 360 - hgt, 46, hgt, i ? 'a-soft' : 'ink-soft', i ? 'a' : 'ink', { rx: 3, 'stroke-width': 1.5 }) +
          S.fade(u, S.text(x + 23, 360 - hgt - 8, fmt(m * a * b), { size: 13, weight: 600 }) + S.text(x + 23, 380, `${m === 1 ? '' : m + ' × '}${fmt(b)}`, { fill: 'b', size: 12 }));
      });
      return s + right;
    },
    theory: [
      ['Scaling by a number', `Multiplying by a pure number stretches or shrinks a quantity without changing its kind: × 2 doubles it, × ½ halves it, × (−1) reverses its direction. Most "how many times bigger" questions in physics are this kind of multiplication.`],
      ['Combining different kinds', `Multiplying two different quantities makes a new kind of quantity, and their units multiply as well: metres × metres = square metres, an area. Many physical quantities are defined as products: an amount kept up over a stretch of something else. Because the units multiply, checking them tells you what kind of thing the answer is.`],
      ['Proportionality', `If ${M('y = k × x')} with ${M('k')} fixed, then doubling ${M('x')} doubles ${M('y')} and tripling it triples ${M('y')}. We say ${M('y')} is <em>proportional</em> to ${M('x')}, and ${M('k')} is the constant of proportionality. On a graph, proportionality is a straight line through the origin, with slope ${M('k')}.`],
      ['Accumulation', `A steady amount ${M('a')} kept up over a stretch ${M('b')} adds up to ${M('a × b')}: the area of a rectangle under a flat line. When the amount isn't steady, the total is still the area under its graph, built from many thin rectangles. That idea is the integral in calculus.`],
    ],
    practice: null,
  };

  const exSpring = {
    id: 'spring',
    label: 'Spring force',
    lede: 'A spring pulls back harder the further it’s stretched. The pull is the stiffness multiplied by the stretch.',
    build: 1,
    params: {
      k: { value: 4, min: 1, max: 10, step: 0.5, color: 'a', label: 'stiffness' },
      A: { value: 2, min: 0.5, max: 3, step: 0.25, color: 'b', label: 'starting stretch' },
    },
    sim: { duration: ({ k }) => Math.min(12, (3 * 2 * Math.PI) / Math.sqrt(k)) },
    formula: (p, h) => `${h.n('k')}${op('×')}${h.n('A')}${op('=')}${h.r(p.k * p.A)}`,
    aside: () => `<div class="note">stiffness × stretch = the spring’s pull at full stretch</div>`,
    readout: ({ k, A }, h, { t }) => { const x = A * Math.cos(Math.sqrt(k) * t); return h.ro('time', fmt(t, 1), 's') + h.ro('stretch', fmt(x), '', 'b') + h.ro('pull', fmt(-k * x)); },
    steps: [{ at: 0, hl: [], say: 'A block on a spring, pulled out and about to be let go.' }],
    simSay: ({ k, A }, h, { t }) => { const x = A * Math.cos(Math.sqrt(k) * t); return `Pull = stiffness × stretch = ${fmt(k)} × ${fmt(Math.abs(x))} = ${fmt(k * Math.abs(x))}, always pointing back toward the middle.`; },
    simSfx: ({ k }) => {
      const w = Math.sqrt(k), T = Math.min(12, (6 * Math.PI) / w), ev = [];
      for (let n = 0; (Math.PI / 2 + n * Math.PI) / w < T; n++) ev.push(sfx.tick((Math.PI / 2 + n * Math.PI) / w, note(n % 2 ? 2 : 4)));
      return ev;
    },
    draw({ k, A }, h, { k: kb, t }) {
      const w = Math.sqrt(k), x = A * Math.cos(w * t), F = -k * x;
      const wall = 70, rest = 300, scale = 45, bx = rest + x * scale, y = 210;
      let s = S.fade(seg(kb, 0, 0.6), S.rect(wall - 16, y - 70, 16, 140, 'ink-soft', null) + S.line(40, y + 32, 450, y + 32, 'grid2', 1.5) +
        S.line(rest + 30, y - 60, rest + 30, y + 32, 'muted', 1, dashed('3 5')) + S.text(rest + 30, y + 52, 'rest', { fill: 'muted', size: 11 }));
      // Zigzag spring from the wall to the block.
      const coils = 12, len = bx - wall;
      let d = `M${wall} ${y}`;
      for (let i = 1; i < coils * 2; i++) d += ` L${(wall + (len * i) / (coils * 2)).toFixed(1)} ${y + (i % 2 ? -14 : 14)}`;
      d += ` L${bx} ${y}`;
      s += S.path(d, 'a', 2.2);
      s += S.rect(bx, y - 30, 60, 60, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 });
      if (Math.abs(F) > 0.05) s += S.arrow(bx + 30, y - 46, bx + 30 + F * 7, y - 46, 'ink', 3);
      s += S.text(bx + 30, y - 58, `pull ${fmt(F, 1)}`, { size: 12, weight: 600 });
      // Pull against stretch: a straight line through the origin, slope = stiffness.
      const gx = (v) => 600 + v * 45, gy = (v) => 210 - v * 4.5;
      let g = S.line(gx(-3.3), gy(0), gx(3.3), gy(0), 'grid2', 1.5) + S.line(gx(0), gy(32), gx(0), gy(-32), 'grid2', 1.5);
      g += S.line(gx(-3), gy(3 * k), gx(3), gy(-3 * k), 'a', 2, { opacity: 0.8 });
      g += S.circle(gx(x), gy(F), 6, 'ink');
      g += S.text(gx(3.3), gy(0) + 18, 'stretch', { fill: 'muted', size: 11, anchor: 'end' }) + S.text(gx(0) + 6, gy(31), 'pull', { fill: 'muted', size: 11, anchor: 'start' });
      return s + S.fade(seg(kb, 0.3, 1), g);
    },
    theory: [
      ['Proportional pull', `For a spring, the pull is proportional to the stretch: ${M('F = −kx')}, where ${M('k')} is the stiffness. Twice the stretch gives twice the pull. The minus sign says the pull points back, against the stretch. On the right, pull against stretch is a straight line through the origin, whose steepness is ${M('k')}.`],
      ['Why it bounces', `Let go and the pull speeds the block back toward the middle. It overshoots, compresses the spring, and is pushed back again. Because the pull is proportional to the stretch, every swing takes the same time however far you pull it, which is why springs and pendulums make good clocks.`],
    ],
    practice: ({ k, A }, h) => [
      `With stiffness ${h.val('k')}, stretching by ${h.val('A')} gives a pull of ${h.r(k * A)}; stretching twice as far gives ${h.r(2 * k * A)}.`,
      `A kitchen scale measures weight with a spring: the stretch is proportional to the weight, so the dial can be marked evenly.`,
    ],
  };

  // ---------- ÷ in general ----------

  const divConcept = {
    id: 'concept',
    label: 'The operation',
    lede: 'Dividing tells you how much of one quantity there is for each unit of another: a rate, a density, a share.',
    build: 3.6,
    params: {
      a: { value: 6, min: 1, max: 12, step: 0.5, color: 'a', label: 'amount' },
      b: { value: 3, min: 0.5, max: 6, step: 0.5, color: 'b', label: 'spread over' },
    },
    formula: (p, h) => `${h.n('a')}${op('÷')}${h.n('b')}${op('=')}${h.r(p.a / p.b)}`,
    aside: () => `<div class="note">The word “per” means ÷: so much per unit. Units divide too.</div>`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `An amount: ${fmt(a)}, piled up in one place.` },
      { at: 0.16, hl: ['÷', 'b'], say: ({ b }) => `Spread it evenly over ${fmt(b)} units.` },
      { at: 0.44, hl: ['=', 'res'], say: ({ a, b }) => `Each unit gets the same share: ${fmt(a)} ÷ ${fmt(b)} = ${fmt(a / b)} per unit.` },
      { at: 0.62, hl: ['b'], say: ({ a, b }) => `Spread it wider and each share shrinks: over ${fmt(2 * b)} units it’s only ${fmt(a / (2 * b))}. Double the divisor, halve the result.` },
    ],
    sfx: ({ a, b }) => [sfx.tick(0.02, pitch(2 * a)), sfx.glide(0.16, 0.42, pitch(2 * a), pitch((2 * a) / b)),
      ...Array.from({ length: Math.ceil(b) }, (_, i) => sfx.pop(0.44 + i * 0.025, note(i + 3))), sfx.curve(0.64, 0.95, Array.from({ length: 30 }, (_, i) => pitch(2 * (a / (0.5 + (5.5 * i) / 29)))))],
    draw({ a, b }, h, { k }) {
      const U = 55, Hs = 22, x0 = 70, base = 360;
      const u1 = seg(k, 0, 0.12), u2 = seg(k, 0.16, 0.42), u3 = seg(k, 0.44, 0.56);
      let s = caption(x0, 34, 'The same amount, spread over more room');
      s += S.line(x0, base, x0 + 6.2 * U, base, 'grid2', 1.5);
      for (let v = 0; v <= 6; v++) s += S.line(x0 + v * U, base, x0 + v * U, base + 6, 'grid2', 1.5) + S.text(x0 + v * U, base + 22, v, { fill: 'muted', size: 11 });
      // The pile (1 unit wide, a tall) flows out to b units wide and a/b tall. Its area, the amount, never changes.
      const w = lerp(1, b, u2), hgt = a / w;
      s += S.fade(u1, S.rect(x0, base - hgt * Hs, w * U, hgt * Hs, 'a-soft', 'a', { 'stroke-width': 2 }));
      for (let v = 1; v < w - 1e-6; v++) s += S.fade(u2, S.line(x0 + v * U, base, x0 + v * U, base - hgt * Hs, 'a', 1, { opacity: 0.4 }));
      s += S.fade(u1 * (1 - u2), S.text(x0 + U / 2, base - a * Hs - 10, fmt(a), { fill: 'a', size: 14, weight: 600 }));
      s += S.fade(u2, S.line(x0, base + 34, x0 + b * U * u2, base + 34, 'b', 3) + S.text(x0 + (b * U) / 2, base + 52, `over ${fmt(b)}`, { fill: 'b', size: 13 }));
      s += S.fade(u3, S.rect(x0, base - (a / b) * Hs, Math.min(1, b) * U, (a / b) * Hs, 'ink-soft', 'ink', { 'stroke-width': 2.5 }) +
        S.text(x0 + (Math.min(1, b) * U) / 2, base - (a / b) * Hs - 10, `${fmt(a / b)} per unit`, { size: 14, weight: 600, anchor: 'start' }));

      // a ÷ b as b varies: the curve of inverse proportion.
      const gx = (v) => 500 + v * 42, gy = (v) => 360 - v * 22;
      const u4 = seg(k, 0.62, 0.95);
      let g = S.fade(seg(k, 0.58, 0.64), caption(480, 34, 'The share as the spread grows') +
        S.line(gx(0), gy(0), gx(6.2), gy(0), 'grid2', 1.5) + S.line(gx(0), gy(0), gx(0), gy(13), 'grid2', 1.5));
      const curve = Array.from({ length: 56 }, (_, i) => { const x = 0.5 + i * 0.1; return `${i ? 'L' : 'M'}${gx(x).toFixed(1)} ${gy(Math.min(13, a / x)).toFixed(1)}`; }).join(' ');
      g += S.path(curve, 'ink', 2.5, drawOn(u4));
      g += S.fade(u4, S.circle(gx(b), gy(a / b), 6, 'b') + (2 * b <= 6 ? S.circle(gx(2 * b), gy(a / (2 * b)), 5, null, 'b', { 'stroke-width': 2 }) : '') +
        S.text(gx(6.2), gy(0) + 18, 'spread', { fill: 'muted', size: 11, anchor: 'end' }));
      return s + g;
    },
    theory: [
      ['How much per one', `Division answers "how much of this for each one of that?" Dividing an amount by how far, how long or how big it's spread gives a <em>rate</em> or a <em>density</em>: so much per metre, per second, per litre. Whenever you see the word "per", there's a division.`],
      ['Units divide', `The units divide along with the numbers: metres ÷ seconds is metres per second, kilograms ÷ litres is kilograms per litre. Dividing two quantities of the same kind cancels the units and leaves a pure number, a <em>ratio</em>, such as an efficiency or a scale factor.`],
      ['Inverse proportion', `If ${M('y = a ÷ x')} with ${M('a')} fixed, doubling ${M('x')} halves ${M('y')} and tripling it gives a third. That's <em>inverse proportion</em>, and its graph is the curve on the right: it never reaches zero, and shoots up as ${M('x')} shrinks toward zero.`],
      ['Undoing multiplication', `Division undoes multiplication: if ${M('c = a × b')}, then ${M('a = c ÷ b')}. That's how physics formulas get rearranged to find whichever quantity is unknown. Dividing by zero has no answer: a rate per "nothing" grows without limit, which usually signals the model has broken down.`],
    ],
    practice: null,
  };

  const exFloat = {
    id: 'float',
    label: 'Floating and sinking',
    lede: 'A block’s mass divided by its volume is its density. Compare it with water’s and you know whether it floats.',
    build: 1,
    params: {
      m: { value: 6, min: 1, max: 12, step: 0.5, color: 'a', label: 'mass in kilograms' },
      V: { value: 8, min: 2, max: 12, step: 0.5, color: 'b', label: 'volume in litres' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.n('m')}${op('÷')}${h.n('V')}${op('=')}${h.r(p.m / p.V)}${h.unit('kg per litre')}`,
    aside: ({ m, V }) => `<div class="note">Water has 1 kg in every litre. ${m / V < 1 ? 'Less than that: it floats.' : m / V > 1 ? 'More than that: it sinks.' : 'Exactly that: it hangs in the water.'}</div>`,
    readout: ({ m, V }, h) => h.ro('density', fmt(m / V), 'kg/L', 'ink') + h.ro('under water', `${fmt(Math.min(1, m / V) * 100, 0)}%`),
    steps: [{ at: 0, hl: [], say: 'A block held above a tank of water.' }],
    simSay: ({ m, V }) => (m / V < 1
      ? `Each litre of block has ${fmt(m / V)} kg, less than a litre of water. It floats with ${fmt((m / V) * 100, 0)}% of itself under water: the same fraction as its density.`
      : `Each litre of block has ${fmt(m / V)} kg, more than water’s 1 kg. Water can’t hold it up: it sinks.`),
    simSfx: ({ m, V }) => [sfx.splash(0.32), ...(m / V > 1 ? [sfx.thud(2.2)] : [])],
    draw({ m, V }, h, { k, t }) {
      const rho = m / V, side = 30 * Math.cbrt(V), surface = 200, floor = 380, tankL = 230, tankR = 570;
      const start = 110, sink = rho > 1;
      const eq = sink ? floor : surface + Math.min(1, rho) * side;
      let bottom;
      if (t < 0.32) bottom = start + (surface - start) * (t / 0.32) ** 2;
      else if (sink) bottom = Math.min(floor, surface + (floor - surface) * (1 - Math.exp(-1.6 * (t - 0.32))) * 1.05);
      else bottom = eq + (surface - eq) * Math.exp(-1.3 * (t - 0.32)) * Math.cos(3.2 * (t - 0.32));
      const bx = 400 - side / 2;
      const ripple = t > 0.32 ? 4 * Math.exp(-1.2 * (t - 0.32)) * Math.sin(10 * t) : 0;
      let s = S.fade(seg(k, 0, 0.6), S.path(`M${tankL} 150 V${floor} H${tankR} V150`, 'ink', 2.5));
      s += S.rect(bx, bottom - side, side, side, 'b-soft', 'b', { rx: 3, 'stroke-width': 2 });
      s += S.text(400, bottom - side / 2 + 5, `${fmt(m)} kg`, { fill: 'b', size: 12, weight: 600 });
      s += S.fade(seg(k, 0, 0.6), S.el('path', { d: `M${tankL + 1.5} ${surface} Q 315 ${surface + ripple} 400 ${surface} T ${tankR - 1.5} ${surface} V${floor - 1} H${tankL + 1.5} Z`, fill: 'a-soft', opacity: 0.85 }) +
        S.path(`M${tankL + 1.5} ${surface} Q 315 ${surface + ripple} 400 ${surface} T ${tankR - 1.5} ${surface}`, 'a', 2));
      // Density bars: the block against water.
      const bar = (y, label, v, color) => S.text(610, y, label, { anchor: 'start', size: 13, fill: 'muted' }) +
        S.rect(610, y + 8, Math.min(150, v * 75), 14, color, null, { rx: 3 }) + S.text(610 + Math.min(150, v * 75) + 6, y + 20, `${fmt(v)} kg/L`, { anchor: 'start', size: 12, weight: 600 });
      s += S.fade(seg(k, 0.3, 1), bar(200, 'water', 1, 'a-soft') + bar(250, 'block', rho, 'b-soft'));
      return s;
    },
    theory: [
      ['Density is a division', `Density is mass divided by volume: how many kilograms are packed into each litre (or each cubic metre). A big block can be light for its size and a small one heavy; dividing compares them fairly, per litre.`],
      ['Why it floats', `A floating object pushes aside water until the water it displaces weighs as much as the object (Archimedes' principle). An object with density ${M('ρ')} (kg per litre) floats with the fraction ${M('ρ')} of its volume under water. Ice, at about 0.92 kg/L, floats with 92% hidden: the tip of the iceberg.`],
    ],
    practice: ({ m, V }, h) => [
      `${h.val('m')} kg in ${h.val('V')} litres is ${h.r(m / V)} kg per litre: ${m / V < 1 ? `it floats with ${fmt((m / V) * 100, 0)}% under water` : 'it sinks'}.`,
      `A steel ship floats because its hull encloses lots of air: the ship's total mass divided by its total volume is less than water's density.`,
    ],
  };

  // ---------- ^ in general ----------

  const powConcept = {
    id: 'concept',
    label: 'The operation',
    lede: 'A power says how strongly one quantity responds to another. With y = xⁿ, doubling x multiplies y by 2ⁿ.',
    build: 3.6,
    params: {
      x: { value: 1.5, min: 0.5, max: 3, step: 0.25, color: 'a', label: 'input' },
      n: { value: 2, min: -2, max: 3, step: 1, color: 'b', label: 'power', digits: 0 },
    },
    formula: (p, h) => `${h.n('x')}<sup>${h.n('n')}</sup>${op('=')}${h.r(p.x ** p.n)}`,
    aside: ({ n }, h) => `<div>double the input → the output is multiplied by 2<sup>${fmt(n)}</sup> = ${h.c('ink', fmt(2 ** n), 'ratio')}</div>`,
    steps: [
      { at: 0, hl: ['x'], say: ({ x }) => `An input: ${fmt(x)}.` },
      { at: 0.12, hl: ['n'], say: ({ n }) => (n > 0 ? `The power ${n} means: multiply ${n} copies of the input together.` : n === 0 ? 'Power 0: the output doesn’t depend on the input at all.' : `A negative power ${n} means: divide by ${-n === 1 ? 'the input' : `${-n} copies of the input`}.`) },
      { at: 0.32, hl: ['=', 'res'], say: ({ x, n }) => `For ${fmt(x)}: ${fmt(x)}<sup>${n}</sup> = ${fmt(x ** n)}. The curve shows every input at once.` },
      { at: 0.5, hl: ['x'], say: ({ x }) => `Now double the input, to ${fmt(2 * x)}…` },
      { at: 0.66, hl: ['ratio'], say: ({ n }) => `…and the output is multiplied by 2<sup>${n}</sup> = ${fmt(2 ** n)}. On the right: what that means for a length, an area, a volume, or something spreading out.` },
    ],
    sfx: ({ x, n }) => {
      const copies = Math.round(2 ** Math.abs(n));
      return [sfx.tick(0.02, note(0)), sfx.curve(0.14, 0.44, Array.from({ length: 30 }, (_, i) => pitch(Math.max(-24, Math.min(24, 4 * ((0.25 + (5.9 * i) / 29) ** n)))))),
        sfx.glide(0.5, 0.64, pitch(4 * Math.min(6, x ** n)), pitch(4 * Math.min(6, (2 * x) ** n))),
        ...Array.from({ length: copies }, (_, i) => sfx.pop(0.68 + (0.24 * i) / copies, note(i + 2))), sfx.chime(0.95, note(7))];
    },
    draw({ x, n }, h, { k }) {
      // The vertical scale grows to fit the doubled input's output (up to a point), so both dots stay visible.
      const top = Math.max(8, Math.min(40, 1.15 * Math.max(x ** n, (2 * x) ** n)));
      const X = (v) => 70 + v * 54, Y = (v) => 360 - (v * 300) / top;
      const u1 = seg(k, 0, 0.1), u2 = seg(k, 0.14, 0.44), u3 = seg(k, 0.32, 0.42), u4 = seg(k, 0.5, 0.64);
      let s = S.line(X(0), Y(0), X(6.2), Y(0), 'grid2', 1.5) + S.line(X(0), Y(0), X(0), Y(top), 'grid2', 1.5);
      for (let v = 1; v <= 6; v++) s += S.text(X(v), Y(0) + 18, v, { fill: 'muted', size: 11 });
      const ys = niceStep(top / 4);
      for (let v = ys; v <= top + 1e-9; v += ys) s += S.text(X(0) - 8, Y(v) + 4, fmt(v), { fill: 'muted', size: 11, anchor: 'end' });
      s += caption(X(0), 22, `output = input to the power ${n}`);
      s += `<defs><clipPath id="pow-clip"><rect x="${X(0)}" y="${Y(top)}" width="${X(6.2) - X(0)}" height="${Y(0) - Y(top)}"/></clipPath></defs>`;
      const curve = Array.from({ length: 120 }, (_, i) => { const v = 0.12 + i * 0.05; return `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(Math.min(top * 1.1, v ** n)).toFixed(1)}`; }).join(' ');
      s += `<g clip-path="url(#pow-clip)">${S.path(curve, 'ink', 3, drawOn(u2))}</g>`;
      const pt = (v, color, u) => (v ** n > top ? '' : S.fade(u, S.line(X(v), Y(0), X(v), Y(v ** n), color, 1.5, dashed('3 4')) + S.line(X(0), Y(v ** n), X(v), Y(v ** n), color, 1.5, dashed('3 4')) +
        S.circle(X(v), Y(v ** n), 6.5, color) + S.text(X(v) + 10, Y(v ** n) - 8, fmt(v ** n), { fill: color, size: 13, weight: 600, anchor: 'start' })));
      s += S.fade(u1, S.circle(X(x), Y(0), 6, 'a'));
      s += pt(x, 'a', u3);
      s += pt(2 * x, 'b', u4);
      if (u4 > 0 && (2 * x) ** n > top) s += S.fade(u4, S.text(X(2 * x), Y(top) + 14, `${fmt((2 * x) ** n)} (off the top)`, { fill: 'b', size: 12 }));

      // What doubling a length does, for this power.
      const ox = 460, oy = 230, L = 50;
      const u5 = seg(k, 0.66, 0.72);
      let r = S.fade(u5, caption(ox - 10, 34, n > 0 ? `Double every length: ${2 ** n} copies fit` : n === 0 ? 'Double the length: nothing changes' : `Double the distance: each part gets 1/${2 ** -n}`));
      const pop = (i, count) => seg(k, 0.68 + (0.24 * i) / count, 0.68 + (0.24 * (i + 1)) / count);
      if (n === 1) {
        r += S.fade(u5, S.line(ox, oy, ox + L, oy, 'a', 6));
        for (let i = 0; i < 2; i++) r += S.fade(pop(i, 2), S.line(ox + 110 + i * L, oy, ox + 110 + (i + 1) * L - 3, oy, 'b', 6));
      } else if (n === 2) {
        r += S.fade(u5, S.rect(ox, oy - L, L, L, 'a-soft', 'a', { 'stroke-width': 2 }));
        for (let i = 0; i < 4; i++) r += S.fade(pop(i, 4), S.rect(ox + 100 + (i % 2) * L, oy - L * 2 + Math.floor(i / 2) * L + L, L, L, 'b-soft', 'b', { 'stroke-width': 2 }));
      } else if (n === 3) {
        const cube = (cx, cy, s2, fill, stroke) => {
          const d = s2 * 0.45;
          return S.poly([[cx, cy], [cx + s2, cy], [cx + s2, cy - s2], [cx, cy - s2]], fill, stroke, { 'stroke-width': 1.5 }) +
            S.poly([[cx, cy - s2], [cx + d, cy - s2 - d], [cx + s2 + d, cy - s2 - d], [cx + s2, cy - s2]], fill, stroke, { 'stroke-width': 1.5 }) +
            S.poly([[cx + s2, cy], [cx + s2 + d, cy - d], [cx + s2 + d, cy - s2 - d], [cx + s2, cy - s2]], fill, stroke, { 'stroke-width': 1.5 });
        };
        const c = 34;
        r += S.fade(u5, cube(ox - 10, oy + 20, c, 'a-soft', 'a'));
        const order = [[0, 0, 1], [1, 0, 1], [0, 0, 0], [1, 0, 0], [0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]];
        order.forEach(([i, j, depth], q) => {
          const d = c * 0.45 * depth;
          r += S.fade(pop(q, 8), cube(ox + 90 + i * c + d, oy + 20 - j * c - d, c, 'b-soft', 'b'));
        });
      } else if (n === 0) {
        r += S.fade(u5, S.circle(ox + 25, oy - 25, 22, 'a-soft', 'a', { 'stroke-width': 2 }));
        r += S.fade(pop(0, 1), S.circle(ox + 160, oy - 25, 22, 'b-soft', 'b', { 'stroke-width': 2 }));
      } else {
        // Negative powers: the same amount spread over 2 (n = −1) or 4 (n = −2) cells.
        const cells = 2 ** -n, cols = n === -1 ? 2 : 2, rows = n === -1 ? 1 : 2;
        r += S.fade(u5, S.rect(ox, oy - L, L, L, 'b', null, { opacity: 0.85 }));
        for (let i = 0; i < cells; i++) {
          r += S.fade(pop(i, cells), S.rect(ox + 100 + (i % cols) * L, oy - L * rows + Math.floor(i / cols) * L, L - 2, L - 2, 'b', null, { opacity: 0.85 / cells }) +
            S.text(ox + 100 + (i % cols) * L + L / 2, oy - L * rows + Math.floor(i / cols) * L + L / 2 + 4, `1/${cells}`, { size: 12 }));
        }
      }
      r += S.fade(u5, S.text(ox + 25, oy + 70, 'before', { fill: 'muted', size: 12 }) + S.text(ox + 170, oy + 70, 'after doubling', { fill: 'muted', size: 12 }));
      r += S.fade(seg(k, 0.92, 1), S.text(ox + 120, oy + 110, `× ${fmt(2 ** n)}`, { size: 22, weight: 600 }));
      return s + r;
    },
    theory: [
      ['How strongly one thing depends on another', `When ${M('y')} is proportional to ${M('x^n')}, the power ${M('n')} measures how sensitive ${M('y')} is to ${M('x')}. Multiply ${M('x')} by any factor ${M('f')} and ${M('y')} is multiplied by ${M('f^n')}: with ${M('n = 1')} it keeps pace, with ${M('n = 2')} it races ahead (double in, four times out), with ${M('n = 3')} faster still (eight times). This "how does it scale?" question is one of the first a physicist asks.`],
      ['Lengths, areas and volumes', `Lengths go as the first power of size, areas as the second and volumes as the third. Scale an object up by 2 and its surface grows 4 times but its volume, and so its weight, grows 8 times. This <em>square–cube law</em> is why big animals need thick legs, and why a mouse can fall unhurt where a horse cannot.`],
      ['Negative powers: spreading out', `A negative power means division: ${M('x^{−1} = 1/x')}, ${M('x^{−2} = 1/x^2')}. When something spreads out from a point in all directions, the same amount is shared over an area that grows as distance squared, so the share at each spot falls as ${M('1/distance^2')}, the <em>inverse-square law</em>.`],
      ['Where squares come from', `A square often appears when something that grows steadily is added up over time. The total is the area of a triangle under a steadily rising line, and that area grows as time squared (see Any triangle). Power 0 means no dependence at all, since ${M('x^0 = 1')}, and fractional powers like ${M('x^{1/2} = √x')} undo squaring.`],
    ],
    practice: null,
  };

  const exLight = {
    id: 'light',
    label: 'Spreading light',
    lede: 'Light from a small source spreads out in all directions. At twice the distance, the same light covers four times the area.',
    build: 1,
    params: {
      P: { value: 8, min: 1, max: 10, step: 0.5, color: 'a', label: 'brightness at distance 1' },
      r: { value: 2, min: 1, max: 4, step: 0.5, color: 'b', label: 'distance' },
    },
    sim: { duration: () => 4.6 / 1.3 },
    formula: (p, h) => `${h.n('P')}${op('×')}${h.n('r')}<sup data-k="pw">−2</sup>${op('=')}${h.r(p.P / (p.r * p.r))}`,
    aside: ({ r }, h) => `<div>= ${h.val('P')} ÷ ${h.val('r')}², the light that lands on each tile</div>`,
    readout: ({ P, r }, h, { t }) => h.ro('light has travelled', fmt(Math.min(4.6, 1.3 * t), 1)) + h.ro('per tile at the screen', fmt(P / (r * r)), '', 'b'),
    steps: [{ at: 0, hl: [], say: 'A small light source. The tiles on the right are each the size of the patch the light covers at distance 1.' }],
    simSay: ({ P, r }, h, { t }) => (1.3 * t < r ? 'The light spreads out as it travels…'
      : `At distance ${fmt(r)}, the light covers ${fmt(r * r)} tiles instead of 1. Shared out, each gets ${fmt(P)} ÷ ${fmt(r * r)} = ${fmt(P / (r * r))}.`),
    simSfx: ({ r }) => [1, 2, 3, 4].map((d) => (d === r ? sfx.chime(d / 1.3, pitch(12 - 3 * d)) : sfx.tick(d / 1.3, pitch(12 - 3 * d)))).concat(r % 1 ? [sfx.chime(r / 1.3, pitch(12 - 3 * r))] : []),
    draw({ P, r }, h, { k, t }) {
      const sx = 80, sy = 215, U = 105, half = 22, front = Math.min(4.6, 1.3 * t);
      const X = (d) => sx + d * U;
      let s = S.fade(seg(k, 0, 0.6), S.line(sx, sy, X(4.4), sy - half * 4.4, 'grid2', 1.2, dashed('4 5')) + S.line(sx, sy, X(4.4), sy + half * 4.4, 'grid2', 1.2, dashed('4 5')));
      // The cone of light, filled as far as it has travelled.
      s += S.poly([[sx, sy], [X(front), sy - half * front], [X(front), sy + half * front]], 'b', null, { opacity: 0.12 });
      for (const d of new Set([1, 2, 3, 4, r])) {
        const lit = front >= d, hit = d === r;
        s += S.line(X(d), sy - half * d, X(d), sy + half * d, hit ? 'b' : 'grid2', hit ? 4 : 2, { opacity: lit || hit ? 1 : 0.5 });
        s += S.text(X(d), sy + half * d + 18, `${fmt(d)}`, { fill: hit ? 'b' : 'muted', size: 12, weight: hit ? 600 : null });
      }
      if (front < 4.6) s += S.line(X(front), sy - half * front, X(front), sy + half * front, 'b', 2, { opacity: 0.8 });
      s += S.circle(sx, sy, 10, 'b') + S.circle(sx, sy, 16, null, 'b', { opacity: 0.4, 'stroke-width': 2 });
      // Front view of the screen at distance r: r × r tiles, each lit with the shared light.
      const box = 170, gx = 580, gy = 130, tile = box / 4, n = r, lit = front >= r ? 1 : 0;
      const shown = n * tile;
      let f = S.text(gx, gy - 14, `the screen at distance ${fmt(r)}`, { anchor: 'start', fill: 'muted', size: 12 });
      f += S.rect(gx, gy, shown, shown, 'b', null, { opacity: lit * Math.min(0.9, (0.9 * P) / (r * r) / 10) + 0.04 });
      for (let i = 0; i <= Math.ceil(n); i++) {
        const v = Math.min(shown, i * tile);
        f += S.line(gx + v, gy, gx + v, gy + shown, 'grid2', 1) + S.line(gx, gy + v, gx + shown, gy + v, 'grid2', 1);
      }
      f += S.rect(gx, gy, tile, tile, null, 'ink', { 'stroke-width': 2 });
      f += S.text(gx + tile / 2, gy + tile / 2 + 4, '1', { size: 12, weight: 600 });
      f += S.fade(lit, S.text(gx, gy + shown + 22, `${fmt(r * r)} tiles share the light`, { anchor: 'start', size: 13, weight: 600 }));
      return s + S.fade(seg(k, 0.2, 1), f);
    },
    theory: [
      ['Same light, more area', `Light leaving a small source in all directions forms an ever-widening cone. At distance ${M('r')}, the patch it covers is ${M('r')} times as wide and ${M('r')} times as tall, so ${M('r^2')} times the area. The same light shared over ${M('r^2')} times the area makes each part ${M('1/r^2')} as bright: brightness ∝ ${M('r^{−2}')}.`],
      ['Inverse squares everywhere', `Anything that spreads evenly from a point follows the same rule: the loudness of sound in open air, the strength of radiation, and the pull of gravity and electric charges. Doubling the distance always cuts the effect to a quarter.`],
    ],
    practice: ({ P, r }, h) => [
      `At distance ${h.val('r')}, a source of brightness ${h.val('P')} gives ${h.r(P / (r * r))} per tile. Move to twice the distance and it drops to ${h.r(P / (4 * r * r))}.`,
      `Mars is about 1.5 times further from the Sun than Earth, so it gets only 1 ÷ 1.5² ≈ 44% as much sunlight.`,
    ],
  };

  // ---------- Topics ----------

  MV.register({ realm: 'phys', id: 'p-add', group: G, symbol: '+', title: 'Addition', modes: [addConcept, exWalkway, exPulses] });
  MV.register({ realm: 'phys', id: 'p-sub', group: G, symbol: MINUS, title: 'Subtraction', modes: [subConcept, exChase, exTug] });
  MV.register({ realm: 'phys', id: 'p-mul', group: G, symbol: '×', title: 'Multiplication', modes: [mulConcept, exDistance, exSpring] });
  MV.register({ realm: 'phys', id: 'p-div', group: G, symbol: '÷', title: 'Division', modes: [divConcept, exPush, exFloat] });
  MV.register({ realm: 'phys', id: 'p-pow', group: G, symbol: 'xⁿ', title: 'Powers', modes: [powConcept, exFall, exLight] });
})();
