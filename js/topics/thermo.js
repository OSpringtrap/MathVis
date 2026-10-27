// Heat and thermodynamics: expansion, calorimetry, heat transfer, the first law and heat engines.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, clamp01, M, sfx, pitch, note } = MV;
  const { caption, label, path, graph, bar, thermometer, flame } = MV.phys;
  const GROUP = 'Heat and thermodynamics';
  const op = (s) => `<span class="op">${s}</span>`;

  // Deterministic "random" numbers, so drawings are the same on every frame.
  const rnd = (i, seed = 1) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
  // Bounce between lo and hi: a triangle wave, for particles in a box.
  const tri = (x, lo, hi) => { const L = hi - lo, u = (((x - lo) % (2 * L)) + 2 * L) % (2 * L); return lo + (u <= L ? u : 2 * L - u); };
  // Gas particles in a box, moving at a speed set by the temperature.
  function gas(n, { x0, y0, x1, y1 }, speed, t, seed = 1, hot = 0.5) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = rnd(i, seed) * Math.PI * 2, v = (0.6 + rnd(i, seed + 3)) * speed;
      const x = tri(x0 + rnd(i, seed + 1) * (x1 - x0) + Math.cos(a) * v * t, x0 + 5, x1 - 5), y = tri(y0 + rnd(i, seed + 2) * (y1 - y0) + Math.sin(a) * v * t, y0 + 5, y1 - 5);
      s += S.circle(x, y, 4.5, 'a', null, { opacity: (1 - hot).toFixed(2) }) + S.circle(x, y, 4.5, 'c', null, { opacity: hot.toFixed(2) });
      // A short trail shows the speed.
      s += S.line(x, y, x - Math.cos(a) * v * 0.06, y - Math.sin(a) * v * 0.06, 'muted', 1.5, { opacity: 0.5 });
    }
    return s;
  }
  // Complementary error function (Abramowitz & Stegun 7.1.26), for heat spreading along a rod.
  const erfc = (x) => { const z = Math.abs(x), t = 1 / (1 + 0.3275911 * z); const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z); return x >= 0 ? y : 2 - y; };

  // =====================================================================
  // Thermal expansion
  // =====================================================================

  const expLinear = {
    id: 'linear',
    label: 'Linear',
    lede: 'Heat a metal rod and it gets longer. Not by much, but enough to buckle railway tracks and crack bridges if nobody plans for it.',
    build: 3.4,
    compact: true,
    params: {
      L0: { value: 5, min: 1, max: 10, step: 0.5, color: 'b', label: 'starting length in metres' },
      alpha: { value: 12, min: 1, max: 30, step: 1, color: 'a', label: 'expansion coefficient in millionths per °C (steel 12, aluminium 23)', digits: 0 },
      dT: { value: 100, min: 0, max: 300, step: 10, color: 'c', label: 'temperature rise in °C', digits: 0 },
    },
    animate: { param: 'dT', speed: 60 },
    formula: (p, h) => `${h.v('ΔL')}${op('=')}${h.n('L0')}${op('×')}${h.n('alpha')}×10<sup>−6</sup>${op('×')}${h.n('dT')}${op('=')}${h.r(p.L0 * p.alpha * p.dT * 1e-3, 2)}${h.unit('mm')}`,
    aside: (p, h) => `<div>New length: ${h.v('L')} = ${h.val('L0')} × (1 + ${h.val('alpha')}×10<sup>−6</sup> × ${h.val('dT')}) = ${h.c('ink', fmt(p.L0 * (1 + p.alpha * 1e-6 * p.dT), 5), 'L')} m</div>`,
    steps: [
      { at: 0, hl: ['L0'], say: ({ L0 }) => `A metal rod, ${fmt(L0)} m long at room temperature.` },
      { at: 0.24, hl: ['alpha'], say: ({ alpha }) => `Each metre of this metal grows ${fmt(alpha)} millionths of a metre for every degree it warms: its expansion coefficient α.` },
      { at: 0.5, hl: ['dT'], say: ({ dT }) => `Heat it by ${fmt(dT)} °C. Its atoms jiggle harder and push each other slightly further apart.` },
      { at: 0.76, hl: ['res'], say: (p) => `Every metre, every degree adds up: ΔL = ${fmt(p.L0 * p.alpha * p.dT * 1e-3, 2)} mm. Press play to heat it from 0 to 300 °C.` },
    ],
    sfx: (p) => [sfx.pop(0.02, note(2)), sfx.tick(0.25, note(5)), sfx.glide(0.5, 0.72, pitch(0), pitch(p.dT / 25)), sfx.chime(0.8, note(7))],
    draw(p, h, { k }) {
      const u1 = seg(k, 0.24, 0.46), u2 = seg(k, 0.5, 0.72), u3 = seg(k, 0.76, 0.95);
      const dT = p.dT * u2, dL = p.L0 * p.alpha * 1e-6 * dT, x0 = 70, y = 150, len = p.L0 * 45, ex = 50;
      let s = caption(60, 50, 'The rod (growth drawn 50 times bigger)');
      s += S.rect(x0, y - 16, len, 32, null, 'muted', { 'stroke-width': 1.5, ...dashed('4 4') });
      s += S.rect(x0, y - 16, len + dL * ex * 45, 32, 'b-soft', 'b', { 'stroke-width': 2, rx: 3 }) + S.rect(x0, y - 16, len + dL * ex * 45, 32, 'c', null, { rx: 3, opacity: (0.5 * dT / 300).toFixed(3) });
      s += label(x0 + len / 2, y + 40, `${fmt(p.L0)} m`, { fill: 'b', weight: 600 });
      // Life-size millimetre ruler at the rod's end.
      const rx = 470, ry = 250, mm = 2.5;
      s += S.fade(u1, caption(rx, ry - 50, 'The end of the rod, measured in millimetres') + S.line(rx, ry, rx + 250, ry, 'ink', 1.5));
      for (let m = 0; m <= 100; m += 5) s += S.fade(u1, S.line(rx + m * mm, ry, rx + m * mm, ry - (m % 10 ? 6 : 12), 'ink', 1) + (m % 20 ? '' : label(rx + m * mm, ry + 16, `${m}`, { fill: 'muted', size: 10 })));
      s += S.fade(u1, S.rect(rx - 60, ry - 34, 60 + dL * 1000 * mm, 22, 'b-soft', 'b', { 'stroke-width': 1.5 }) + S.arrow(rx + dL * 1000 * mm, ry - 50, rx + dL * 1000 * mm, ry - 36, 'c', 2));
      s += S.fade(u3, label(rx + 125, ry + 44, `grew ${fmt(dL * 1000, 2)} mm`, { fill: 'c', weight: 600, size: 15 }));
      // Atoms: hotter means bigger jiggles and slightly wider spacing.
      const ay = 345, gap = 34 * (1 + dT / 1500), amp = 2 + dT / 25;
      s += S.fade(u2, caption(60, 300, 'Atoms inside: hotter, they vibrate more and spread out'));
      for (let i = 0; i < 10; i++) { const ax = 80 + i * gap; s += S.fade(u2 || 0.4, S.el('ellipse', { cx: ax, cy: ay, rx: 9 + amp, ry: 9, fill: 'c-soft', opacity: (0.3 + dT / 400).toFixed(2) }) + S.circle(ax, ay, 8, 'b')); }
      s += S.fade(u2, thermometer(740, 290, 70, 0.1 + 0.85 * (dT / 300), 'c', `+${fmt(dT, 0)} °C`));
      return s;
    },
    theory: [
      ['Why things expand', `Atoms in a solid are always vibrating about their places. Heat them and they vibrate harder, and because the forces between atoms push back more strongly when squeezed than when stretched, the average spacing grows. Every dimension of the object gets a little bigger.`],
      ['Linear expansion', `For a rod, the change in length is proportional to the original length and to the temperature change: ${M('ΔL = L_0 α ΔT')}, so ${M('L = L_0(1 + αΔT)')}. The coefficient ${M('α')} depends on the material: about 12 millionths per °C for steel, 23 for aluminium, and only 0.5 for special glass like that in oven dishes.`],
      ['Designing for it', `Bridges have expansion joints, rails were laid with small gaps (modern ones are pre-stretched instead), and power lines sag more in summer. A bimetallic strip, two metals with different ${M('α')} bonded together, bends when heated: it's how many thermostats and old circuit breakers work.`],
    ],
    practice: (p, h) => [
      `A 1 km steel bridge heated by 40 °C grows ${h.r(1000 * 12e-6 * 40 * 100, 0)} cm, which is why it needs expansion joints.`,
      `A glass jar lid stuck? Run hot water over the metal lid: it expands more than the glass and loosens.`,
    ],
  };

  const expSurface = {
    id: 'surface',
    label: 'Surface',
    lede: 'A heated metal plate grows in both directions. The surprise: a hole cut in it grows too, as if it were made of the same metal.',
    build: 2.6,
    compact: true,
    params: {
      a0: { value: 50, min: 10, max: 100, step: 5, color: 'b', label: 'side of the plate in centimetres', digits: 0 },
      alpha: { value: 23, min: 1, max: 30, step: 1, color: 'a', label: 'expansion coefficient in millionths per °C (aluminium 23)', digits: 0 },
      dT: { value: 200, min: 0, max: 300, step: 10, color: 'c', label: 'temperature rise in °C', digits: 0 },
    },
    animate: { param: 'dT', speed: 60 },
    formula: (p, h) => `${h.v('ΔA')}${op('=')}${h.c('b', fmt(p.a0 * p.a0), 'A0')}${op('×')}2${op('×')}${h.n('alpha')}×10<sup>−6</sup>${op('×')}${h.n('dT')}${op('=')}${h.r(p.a0 * p.a0 * 2 * p.alpha * 1e-6 * p.dT, 1)}${h.unit('cm²')}`,
    aside: (p, h) => `<div>Area ${h.n('a0')}² cm². Surface coefficient β = 2α. The hole’s diameter grows by the same fraction, ${fmt(p.alpha * p.dT * 1e-4, 3)} %.</div>`,
    steps: [
      { at: 0, hl: ['a0', 'A0'], say: 'A square metal plate with a round hole in the middle.' },
      { at: 0.35, hl: ['alpha', 'dT'], say: 'Heat it: each side grows by α ΔT of its length, so the area grows by about twice that fraction: β = 2α.' },
      { at: 0.7, hl: ['res'], say: 'The hole grows too, exactly as if it were filled with the same metal. Every distance on the plate scales up together.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.glide(0.35, 0.65, pitch(0), pitch(7)), sfx.chime(0.72, note(7))],
    draw(p, h, { k }) {
      const u = seg(k, 0.35, 0.65), f = 1 + p.alpha * 1e-6 * p.dT * u * 60, side = p.a0 * 3, cx = 260, cy = 220;
      let s = caption(60, 40, 'Growth drawn 60 times bigger');
      s += S.rect(cx - side / 2, cy - side / 2, side, side, null, 'muted', { 'stroke-width': 1.5, ...dashed('4 4') });
      s += S.rect(cx - (side * f) / 2, cy - (side * f) / 2, side * f, side * f, 'b-soft', 'b', { 'stroke-width': 2 }) + S.rect(cx - (side * f) / 2, cy - (side * f) / 2, side * f, side * f, 'c', null, { opacity: (0.4 * u * p.dT / 300).toFixed(3) });
      s += S.circle(cx, cy, side * 0.18 * f, 'card', 'b', { 'stroke-width': 2 }) + S.circle(cx, cy, side * 0.18, null, 'muted', { 'stroke-width': 1.5, ...dashed('3 3') });
      s += S.fade(seg(k, 0.7, 0.9), S.arrow(cx, cy, cx + side * 0.18 * f, cy, 'c', 2) + label(cx + side * 0.09 * f, cy - 8, 'hole grows', { fill: 'c', size: 11 }));
      s += S.fade(seg(k, 0.35, 0.6), label(600, 160, `each side × ${fmt(1 + p.alpha * 1e-6 * p.dT, 5)}`, { size: 14 }) + label(600, 190, `area × ${fmt((1 + p.alpha * 1e-6 * p.dT) ** 2, 5)}`, { size: 14, weight: 600 }) + label(600, 220, `≈ 1 + 2αΔT`, { size: 13, fill: 'muted' }));
      return s;
    },
    theory: [
      ['Two directions', `Each side of a plate grows by the factor ${M('1 + αΔT')}, so the area grows by ${M('(1 + αΔT)^2 ≈ 1 + 2αΔT')} (the squared term is tiny). That's ${M('ΔA = A_0 β ΔT')} with ${M('β = 2α')}.`],
      ['Holes grow too', `Expansion scales every distance in the material, including the distances across a hole. That's why a tight metal ring can be heated to slip it onto a shaft, and why a hot jar lid comes off more easily.`],
    ],
    practice: (p, h) => [`A ${h.val('a0')} cm aluminium baking tray heated by 200 °C grows by ${h.r(p.a0 * p.a0 * 2 * 23e-6 * 200, 1)} cm².`],
  };

  const NECK = 4; // cm² cross-section of the flask's neck
  const expVolume = {
    id: 'volume',
    label: 'Volume',
    lede: 'Liquids expand much more than solids. Warm a flask of liquid and the level climbs the narrow neck: the principle of the thermometer.',
    build: 2.6,
    compact: true,
    params: {
      V0: { value: 1000, min: 200, max: 1000, step: 50, color: 'b', label: 'volume of liquid in cm³', digits: 0 },
      gamma: { value: 11, min: 1, max: 12, step: 0.5, color: 'a', label: 'liquid’s coefficient in ten-thousandths per °C (alcohol 11, water 2)' },
      dT: { value: 40, min: 0, max: 100, step: 5, color: 'c', label: 'temperature rise in °C', digits: 0 },
    },
    animate: { param: 'dT', speed: 20 },
    formula: (p, h) => `${h.v('ΔV')}${op('=')}${h.n('V0')}${op('×')}${h.n('gamma')}×10<sup>−4</sup>${op('×')}${h.n('dT')}${op('=')}${h.r(p.V0 * p.gamma * 1e-4 * p.dT, 1)}${h.unit('cm³')}`,
    aside: (p, h) => { const app = p.V0 * (p.gamma - 0.27) * 1e-4 * p.dT; return `<div>The glass expands too (γ = 0.27×10<sup>−4</sup>), so the level rises by the difference: ${h.c('c', fmt(app, 1), 'app')} cm³, ${h.c('c', fmt(app / NECK, 1), 'rise')} cm up the neck.</div>`; },
    steps: [
      { at: 0, hl: ['V0'], say: 'A glass flask full of liquid, with a narrow neck.' },
      { at: 0.35, hl: ['gamma', 'dT'], say: 'Heat it: volume grows by γ ΔT of itself, with γ ≈ 3α for solids, and much more for liquids.' },
      { at: 0.7, hl: ['app', 'rise'], say: 'The flask grows a little too, but the liquid grows more. The extra squeezes up the narrow neck, where a small volume makes a tall rise.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(2)), sfx.glide(0.35, 0.65, pitch(0), pitch(p.dT / 8)), sfx.chime(0.72, note(7))],
    draw(p, h, { k }) {
      const u = seg(k, 0.35, 0.65), dT = p.dT * u, app = p.V0 * (p.gamma - 0.27) * 1e-4 * dT, rise = app / NECK;
      const cx = 220, bulbY = 250, r = 30 + p.V0 * 0.06, neckTop = 30, base = bulbY - r + 4, sc = Math.min(10, (base - neckTop - 10) / ((p.V0 * 11.73e-4 * 100) / NECK));
      let s = flame(cx, bulbY + r + 46, k * 6, 0.4 + dT / 60, Math.min(1, dT / 10));
      s += S.circle(cx, bulbY, r, 'a-soft', 'ink', { 'stroke-width': 2 }) + S.rect(cx - 9, neckTop, 18, base - neckTop, 'card', 'ink', { 'stroke-width': 2 });
      s += S.circle(cx, bulbY, r - 3, 'a', null, { opacity: 0.55 }) + S.rect(cx - 6, base - rise * sc - 4, 12, rise * sc + 8, 'a', null, { opacity: 0.75 });
      s += S.line(cx + 14, base, cx + 40, base, 'muted', 1, dashed('3 3')) + label(cx + 44, base + 4, 'start level', { fill: 'muted', size: 11, anchor: 'start' });
      if (rise > 0.3) s += S.line(cx + 14, base - rise * sc, cx + 40, base - rise * sc, 'c', 1.5) + label(cx + 44, base - rise * sc + 4, `+${fmt(rise, 1)} cm`, { fill: 'c', size: 12, anchor: 'start', weight: 600 });
      s += S.fade(seg(k, 0.7, 0.9), caption(420, 130, 'Real thermometers work just like this:') + caption(420, 150, 'a big bulb and a very thin tube make a') + caption(420, 170, 'tiny expansion visible.'));
      s += thermometer(560, 230, 110, 0.15 + 0.8 * (dT / 100), 'c', `+${fmt(dT, 0)} °C`);
      return s;
    },
    theory: [
      ['Volume expansion', `A volume grows by ${M('ΔV = V_0 γ ΔT')}. For a solid, ${M('γ ≈ 3α')} because all three dimensions stretch. Liquids expand far more: alcohol about 11×10⁻⁴ per °C, roughly 300 times steel's linear coefficient.`],
      ['Real and apparent', `The container expands too. What you see is the <em>apparent</em> expansion: the liquid's expansion minus the container's. That's why a brim-full car fuel tank can overflow on a hot day.`],
      ['Water is strange', `Water does the opposite between 0 °C and 4 °C: it contracts as it warms, so it's densest at 4 °C. Lakes therefore freeze from the top down, and the 4 °C water at the bottom lets fish survive the winter.`],
    ],
    practice: (p, h) => [`A 50-litre fuel tank filled cold and warmed by 20 °C: petrol (γ ≈ 9.5×10⁻⁴) grows by ${h.r(50 * 9.5e-4 * 20, 2)} litres.`],
  };

  MV.register({ realm: 'phys', id: 't-expansion', group: GROUP, symbol: '↔', title: 'Thermal expansion', modesLabel: null, modes: [expLinear, expSurface, expVolume] });

  // =====================================================================
  // Calorimetry
  // =====================================================================

  const C_ICE = 2100, L_F = 334000, C_W = 4186, L_V = 2256000;
  // Heating curve from ice at −20 °C to all steam: returns stage boundaries (J) and temperature at heat Q.
  const curve = (m) => {
    const q1 = m * C_ICE * 20, q2 = q1 + m * L_F, q3 = q2 + m * C_W * 100, q4 = q3 + m * L_V;
    const T = (Q) => (Q < q1 ? -20 + Q / (m * C_ICE) : Q < q2 ? 0 : Q < q3 ? (Q - q2) / (m * C_W) : 100);
    const stage = (Q) => (Q < q1 ? 0 : Q < q2 ? 1 : Q < q3 ? 2 : Q < q4 ? 3 : 4);
    return { q: [0, q1, q2, q3, q4], T, stage };
  };
  const SIM_C = 10;
  const calorConcept = {
    id: 'concept',
    label: 'Heating curve',
    lede: 'Heat a block of ice steadily. Its temperature climbs, then stalls while it melts, climbs again, then stalls while it boils. Changing state takes a lot of heat.',
    build: 3.8,
    compact: true,
    params: {
      m: { value: 0.5, min: 0.1, max: 2, step: 0.1, color: 'b', label: 'mass in kilograms' },
      P: { value: 2000, min: 500, max: 3000, step: 100, color: 'a', label: 'heater power in watts', digits: 0 },
    },
    sim: { duration: () => SIM_C },
    formula: (p, h) => `${h.v('Q')}${op('=')}${h.n('m')}${op('×')}4186${op('×')}100${op('=')}${h.r((p.m * C_W * 100) / 1000, 0)}${h.unit('kJ')}`,
    aside: (p, h) => `<div>That’s warming the water from 0 to 100 °C. Melting takes ${h.v('mL')} = ${h.val('m')} × 334 = ${h.c('a', fmt((p.m * L_F) / 1000, 0), 'melt')} kJ; boiling ${h.val('m')} × 2256 = ${h.c('c', fmt((p.m * L_V) / 1000, 0), 'boil')} kJ.</div>`,
    readout: (p, h, { t }) => { const c = curve(p.m), Q = (c.q[4] * t) / SIM_C; return h.ro('heat', fmt(Q / 1000, 0), 'kJ') + h.ro('temperature', fmt(c.T(Q), 0), '°C', 'c') + h.ro('heater time', fmt(Q / p.P / 60, 1), 'min'); },
    steps: [
      { at: 0, hl: ['m'], say: ({ m }) => `${fmt(m)} kg of ice from the freezer, at −20 °C.` },
      { at: 0.16, hl: [], say: 'Warming the ice: sensible heat, Q = mcΔT. The temperature rises in a straight line.' },
      { at: 0.36, hl: ['melt'], say: 'At 0 °C it melts. All the heat goes into breaking the crystal apart, not into raising the temperature: latent heat, Q = mL. A flat line.' },
      { at: 0.56, hl: ['m', 'res'], say: 'The water warms from 0 to 100 °C: Q = mcΔT again, with water’s large specific heat.' },
      { at: 0.76, hl: ['boil'], say: 'At 100 °C it boils. Another flat line, and by far the longest: turning water into steam takes almost seven times the heat that warmed it.' },
    ],
    sfx: () => [sfx.pop(0.02, note(0)), sfx.glide(0.16, 0.32, pitch(-5), pitch(0)), sfx.glide(0.36, 0.52, pitch(0), pitch(0)), sfx.glide(0.56, 0.72, pitch(0), pitch(12)), sfx.whoosh(0.76, 0.95)],
    simSay: (p, h, { t }) => { const c = curve(p.m), st = c.stage((c.q[4] * t) / SIM_C); return ['The ice warms up toward 0 °C.', 'Melting: the heater keeps going, the thermometer doesn’t move.', 'All liquid now: the temperature climbs again.', 'Boiling: still 100 °C. The heat carries water molecules off as steam.', 'All boiled away.'][st]; },
    simSfx: (p) => { const c = curve(p.m); return [sfx.curve(0, SIM_C, Array.from({ length: 50 }, (_, i) => pitch(c.T((c.q[4] * i) / 49) / 8))), sfx.splash((c.q[3] / c.q[4]) * SIM_C)]; },
    draw(p, h, { k, t }) {
      const c = curve(p.m), Qmax = c.q[4], Q = (Qmax * t) / SIM_C, st = c.stage(Q), Tn = c.T(Q);
      const Gr = graph({ x0: 380, x1: 760, y0: 380, y1: 90, tMax: Qmax / 1000, vMax: 120, vMin: -30, tLabel: 'heat added (kJ)', vLabel: 'temperature (°C)' });
      let s = Gr.s;
      // Built in four stages, each with its label.
      const names = [['Q = mcΔT', 'b'], ['Q = mL (melting)', 'a'], ['Q = mcΔT', 'b'], ['Q = mL (boiling)', 'c']];
      const at = [0.16, 0.36, 0.56, 0.76];
      for (let i = 0; i < 4; i++) {
        const u = seg(k, at[i], at[i] + 0.16), qa = c.q[i], qb = lerp(qa, c.q[i + 1], u);
        if (u > 0) s += S.line(Gr.X(qa / 1000), Gr.Y(c.T(qa)), Gr.X(qb / 1000), Gr.Y(c.T(Math.min(qb, c.q[i + 1] - 1e-6))), names[i][1], 3);
        const mid = (qa + c.q[i + 1]) / 2000;
        const lx = i < 2 ? Gr.X(qa / 1000) + 8 : Gr.X(mid), ly = i === 0 ? Gr.Y(-10) + 16 : i === 1 ? Gr.Y(0) - 10 : i === 2 ? Gr.Y(50) : Gr.Y(100) - 12;
        s += S.fade(u, label(lx + (i === 2 ? 14 : 0), ly, names[i][0], { fill: names[i][1], size: 11, weight: 600, anchor: i < 3 ? 'start' : 'middle' }));
      }
      if (t > 0) s += S.circle(Gr.X(Q / 1000), Gr.Y(Tn), 6, 'ink');
      // The pot.
      const px = 180, py = 330, w = 180, hh = 120;
      s += S.rect(px - w / 2, py - hh, w, hh, 'card', 'ink', { 'stroke-width': 2.5 }) + flame(px - 40, py + 34, t + k, 1) + flame(px + 40, py + 34, t + k + 1.3, 1);
      const melted = st === 0 ? 0 : st === 1 ? (Q - c.q[1]) / (c.q[2] - c.q[1]) : 1;
      const left = st < 3 ? 1 : st === 3 ? 1 - (Q - c.q[3]) / (c.q[4] - c.q[3]) : 0;
      const waterH = (hh - 20) * 0.6 * melted * left;
      if (waterH > 0.5) s += S.rect(px - w / 2 + 3, py - waterH - 3, w - 6, waterH, 'a-soft', null);
      for (let i = 0; i < 6; i++) { const sz = 34 * (1 - melted) ** 0.6; if (sz > 1) s += S.rect(px - 70 + i * 24, py - 6 - sz - (i % 2) * 22, sz, sz, 'card', 'a', { rx: 4, 'stroke-width': 1.5, transform: `rotate(${(i * 17) % 30 - 15} ${px - 70 + i * 24 + sz / 2} ${py - 30})` }); }
      if (st === 3) for (let i = 0; i < 10; i++) { const ph = (t * 1.4 + rnd(i)) % 1; s += S.circle(px - 70 + rnd(i, 2) * 140, py - 10 - ph * (waterH + 60), 3 + ph * 5, 'muted', null, { opacity: (0.6 * (1 - ph)).toFixed(2) }); }
      s += thermometer(px + w / 2 + 40, 180, 140, (Tn + 30) / 150, 'c', `${fmt(Tn, 0)} °C`);
      s += S.fade(seg(k, 0, 0.14), caption(60, 60, `${fmt(p.m)} kg of water, heated at ${fmt(p.P)} W`));
      return s;
    },
    theory: [
      ['Sensible heat', `Heat that changes an object's temperature is called sensible heat: ${M('Q = mcΔT')}. The <em>specific heat</em> ${M('c')} is the energy needed to warm 1 kg by 1 °C: 4186 J for water, 2100 J for ice, only about 450 J for iron. Water's high specific heat is why the sea warms slowly and moderates coastal climates.`],
      ['Latent heat', `During a change of state the temperature stays fixed while heat goes into rearranging the molecules: ${M('Q = mL')}. Melting ice needs ${M('L_f')} = 334 kJ/kg; boiling water needs ${M('L_v')} ≈ 2256 kJ/kg, which is why steam burns are so severe: it releases all that energy as it condenses on your skin.`],
      ['Heat capacity', `The heat capacity of a whole object, ${M('C = mc')}, says how many joules it takes to warm it by 1 °C. A full swimming pool has an enormous heat capacity: it stays cool on a hot afternoon.`],
    ],
    practice: (p, h) => [
      `With a ${h.val('P')} W heater, warming the water from 0 to 100 °C takes ${h.r((p.m * C_W * 100) / p.P / 60, 1)} min, but boiling it all away takes ${h.r((p.m * L_V) / p.P / 60, 1)} min.`,
      `Sweating cools you by latent heat: each gram of sweat that evaporates carries away about 2.4 kJ.`,
    ],
  };

  const mix = ({ m1, T1, m2, T2 }) => (m1 * T1 + m2 * T2) / (m1 + m2);
  const calorMix = {
    id: 'mix',
    label: 'Mixing water',
    lede: 'Pour hot water into cold. Heat flows from hot to cold until they share one temperature, and the heat lost by one is exactly the heat gained by the other.',
    build: 1,
    compact: true,
    params: {
      m1: { value: 0.3, min: 0.1, max: 1, step: 0.05, color: 'c', label: 'hot water in kilograms' },
      T1: { value: 80, min: 40, max: 100, step: 5, color: 'c', label: 'hot water temperature in °C', digits: 0 },
      m2: { value: 0.5, min: 0.1, max: 1, step: 0.05, color: 'a', label: 'cold water in kilograms' },
      T2: { value: 20, min: 0, max: 35, step: 5, color: 'a', label: 'cold water temperature in °C', digits: 0 },
    },
    sim: { duration: () => 7 },
    formula: (p, h) => `${h.v('T')}${op('=')}${h.frac(`${h.n('m1')}${op('×')}${h.n('T1')}${op('+')}${h.n('m2')}${op('×')}${h.n('T2')}`, `${h.val('m1')}${op('+')}${h.val('m2')}`)}${op('=')}${h.r(mix(p), 1)}${h.unit('°C')}`,
    aside: (p, h) => { const T = mix(p); return `<div>Heat lost by the hot water: ${h.val('m1')} × 4.19 × ${fmt(p.T1 - T, 1)} = ${h.c('c', fmt(p.m1 * 4.186 * (p.T1 - T), 1), 'qh')} kJ. Gained by the cold: ${h.c('a', fmt(p.m2 * 4.186 * (T - p.T2), 1), 'qc')} kJ.</div>`; },
    readout: (p, h, { t }) => { const T = mix(p), f = t < 1.5 ? 0 : 1 - Math.exp(-(t - 1.5) * 1.1); return h.ro('hot', fmt(lerp(p.T1, T, f), 1), '°C', 'c') + h.ro('cold', fmt(lerp(p.T2, T, f), 1), '°C', 'a'); },
    steps: [{ at: 0, hl: [], say: 'A jug of hot water and a glass of cold.' }],
    simSay: (p, h, { t }) => (t < 1.5 ? 'Pour the hot water in.' : 'Heat flows from hot to cold. The hot water cools, the cold water warms, until both reach the same temperature: thermal equilibrium.'),
    simSfx: () => [sfx.splash(0.4), sfx.glide(1.5, 6, pitch(10), pitch(4)), sfx.chime(6.2, note(4))],
    draw(p, h, { k, t }) {
      const T = mix(p), f = t < 1.5 ? 0 : 1 - Math.exp(-(t - 1.5) * 1.1), Th = lerp(p.T1, T, f), Tc = lerp(p.T2, T, f), pour = clamp01(t / 1.5);
      let s = '';
      // Containers: the jug tips and empties into the glass.
      const gx = 260, gy = 360, gw = 120, gh = 150;
      s += S.rect(gx - gw / 2, gy - gh, gw, gh, 'card', 'ink', { 'stroke-width': 2.5 });
      const cold = (p.m2 / 2) * gh * 0.95, hotIn = (p.m1 / 2) * gh * 0.95 * pour;
      s += S.rect(gx - gw / 2 + 3, gy - cold - 3, gw - 6, cold, 'a', null, { opacity: 0.45 });
      if (hotIn > 0.5) s += S.rect(gx - gw / 2 + 3, gy - cold - hotIn - 3, gw - 6, hotIn, 'c', null, { opacity: (0.45 * (1 - f) + 0.1).toFixed(2) });
      if (f > 0) s += S.rect(gx - gw / 2 + 3, gy - cold - hotIn - 3, gw - 6, cold + hotIn, 'b', null, { opacity: (0.35 * f).toFixed(2) });
      const ang = -100 * Math.min(1, t / 0.6) * (t < 1.6 ? 1 : 0);
      if (t < 1.6) s += `<g transform="rotate(${ang.toFixed(1)} 150 120)">${S.rect(100, 120, 90, 110, 'card', 'ink', { 'stroke-width': 2.5 })}${S.rect(103, 120 + 110 - 100 * (p.m1 / 1) * (1 - pour) - 3, 84, 100 * p.m1 * (1 - pour), 'c', null, { opacity: 0.45 })}</g>`;
      s += thermometer(gx + 110, 200, 120, Th / 100, 'c', `${fmt(Th, 0)} °C`) + thermometer(gx + 150, 200, 120, Tc / 100, 'a', `${fmt(Tc, 0)} °C`);
      // Temperatures against time converging.
      const Gr = graph({ x0: 480, x1: 760, y0: 380, y1: 110, tMax: 7, vMax: 100, vLabel: 'temperature (°C)' });
      s += S.fade(seg(k, 0, 0.6), Gr.s + S.line(Gr.X(0), Gr.Y(T), Gr.X(7), Gr.Y(T), 'muted', 1, dashed('4 4')) + label(Gr.X(7), Gr.Y(T) - 6, `equilibrium ${fmt(T, 1)} °C`, { fill: 'muted', size: 11, anchor: 'end' }));
      const at = (tt, a) => { const ff = tt < 1.5 ? 0 : 1 - Math.exp(-(tt - 1.5) * 1.1); return lerp(a, T, ff); };
      if (t > 0) s += S.path(path(80, (u) => [Gr.X(u * t), Gr.Y(at(u * t, p.T1))]), 'c', 2.5) + S.path(path(80, (u) => [Gr.X(u * t), Gr.Y(at(u * t, p.T2))]), 'a', 2.5);
      if (t > 1.5) s += S.arrow(gx - 30, gy - cold - hotIn / 2, gx - 30, gy - cold / 2 + 10, 'b', 3) + label(gx - 40, gy - cold - 10, 'heat', { fill: 'b', size: 11, anchor: 'end' });
      return s;
    },
    theory: [
      ['Equilibrium', `Heat always flows from hotter to colder bodies until they reach the same temperature. With no heat escaping, the heat lost by the hot water equals the heat gained by the cold: ${M('m_1 c (T_1 − T) = m_2 c (T − T_2)')}, or ${M('ΣQ = 0')} counting losses as negative.`],
      ['Weighted average', `For two masses of the same liquid, ${M('c')} cancels and the final temperature is a mass-weighted average: ${M('T = (m_1 T_1 + m_2 T_2)/(m_1 + m_2)')}. More cold water pulls the result closer to the cold temperature. A <em>calorimeter</em>, an insulated cup, uses exactly this to measure specific heats.`],
    ],
    practice: (p, h) => [`To make a 40 °C bath from 70 °C and 20 °C water you need them in the ratio ${h.r((40 - 20) / (70 - 40), 2)} : 1, hot to cold.`],
  };

  MV.register({ realm: 'phys', id: 't-calor', group: GROUP, symbol: 'Q', title: 'Calorimetry', modes: [calorConcept, calorMix] });

  // =====================================================================
  // Heat transfer
  // =====================================================================

  const tempRod = (x0, y, len, frac, label0) => {
    let s = S.rect(x0, y - 9, len, 18, 'ink-soft', 'grid2', { rx: 4, 'stroke-width': 1.5 });
    const n = 40;
    for (let i = 0; i < n; i++) { const f = frac((i + 0.5) / n); if (f > 0.01) s += S.rect(x0 + (i * len) / n, y - 9, len / n + 0.5, 18, 'c', null, { opacity: Math.min(1, f).toFixed(3) }); }
    return s + label(x0 + len + 10, y + 5, label0, { anchor: 'start', size: 12, weight: 600 });
  };
  const transConduction = {
    id: 'conduction',
    label: 'Conduction',
    lede: 'Hold one end of a rod in a flame. Heat creeps along it atom by atom. In metal it races; in wood it barely moves.',
    build: 2.4,
    compact: true,
    params: {
      dT: { value: 80, min: 20, max: 200, step: 10, color: 'c', label: 'how much hotter the flame end is, in °C', digits: 0 },
      L: { value: 20, min: 10, max: 40, step: 5, color: 'b', label: 'rod length in centimetres', digits: 0 },
    },
    sim: { duration: () => 10 },
    formula: (p, h) => `${h.v('Φ')}${op('=')}${h.frac(`50${op('×')}0.0001${op('×')}${h.n('dT')}`, `${h.n('L')}${op('÷')}100`)}${op('=')}${h.r((50 * 1e-4 * p.dT) / (p.L / 100), 2)}${h.unit('W through steel')}`,
    aside: (p, h) => `<div>A 1 cm² rod. Wood (k ≈ 0.15 instead of 50): only ${h.c('b', fmt((0.15 * 1e-4 * p.dT) / (p.L / 100), 4), 'wood')} W.</div>`,
    readout: (p, h, { t }) => { const far = (D) => p.dT * erfc(p.L / (2 * Math.sqrt(D * Math.max(t, 1e-6)))); return h.ro('time', fmt(t * 6, 0), 's') + h.ro('steel far end', `+${fmt(far(40), 0)}`, '°C', 'c') + h.ro('wood far end', `+${fmt(far(0.4), 1)}`, '°C', 'b'); },
    steps: [
      { at: 0, hl: [], say: 'A steel rod and a wooden rod, one end of each in the same flame.' },
      { at: 0.4, hl: ['dT', 'L'], say: 'Heat flows down a temperature difference. The steeper the drop per centimetre (ΔT/L), the faster it flows.' },
      { at: 0.75, hl: ['wood'], say: 'In metals, free electrons carry energy along quickly. Wood has none and is full of air pockets: an insulator.' },
    ],
    sfx: () => [sfx.whoosh(0.02, 0.3), sfx.glide(0.4, 0.7, pitch(0), pitch(7)), sfx.tick(0.76, note(2))],
    simSay: (p, h, { t }) => (t < 3 ? 'The flame end heats up first. Neighbouring atoms jostle each other and pass the energy on.' : 'The steel is hot almost to the far end. The wood is still cool a couple of centimetres from the flame: that’s why pan handles and spoons for cooking are often wooden.'),
    simSfx: () => [sfx.whoosh(0, 3), sfx.whoosh(3, 6), sfx.whoosh(6, 9)],
    draw(p, h, { k, t }) {
      const x0 = 160, len = p.L * 12, rods = [[150, 40, 'steel'], [290, 0.4, 'wood']];
      let s = '';
      for (const [y, D, name] of rods) {
        const fr = (x) => (t <= 0 ? 0 : erfc((x * p.L) / (2 * Math.sqrt(D * t))));
        s += S.fade(seg(k, 0, 0.3), tempRod(x0, y, len, fr, name) + flame(x0 - 4, y + 34, t + (name === 'wood' ? 1.2 : 0), 1.1));
        // Atoms in a zoom strip under each rod, jiggling harder where it's hot.
        for (let i = 0; i < 14; i++) { const xx = x0 + 10 + (i * (len - 20)) / 13, f = fr((xx - x0) / len), j = 1.5 + 6 * f * Math.sin(t * 25 + i * 1.7); s += S.fade(seg(k, 0.4, 0.7), S.circle(xx + j, y + 40, 4, 'b', null, { opacity: 0.4 + 0.6 * f })); }
        s += S.fade(seg(k, 0.4, 0.7), caption(x0 + len + 10, y + 44, 'atoms jiggling'));
      }
      s += S.fade(seg(k, 0.75, 0.95), caption(60, 380, 'Darker rose = hotter. Same flame, same length, same time.'));
      return s;
    },
    theory: [
      ['Conduction', `In a solid, hot atoms vibrate harder and jostle their neighbours, passing energy along without the material itself moving. In metals, free electrons speed this up enormously. The heat flow through a rod is ${M('Φ = kA ΔT/L')}: proportional to the area ${M('A')} and the temperature difference ${M('ΔT')}, inversely to the length ${M('L')}.`],
      ['Conductors and insulators', `The thermal conductivity ${M('k')} is about 400 W/(m·°C) for copper, 50 for steel, 1 for glass, 0.15 for wood and 0.025 for still air. Most good insulators, wool, foam, feathers and double glazing, work by trapping air.`],
      ['Why metal feels cold', `A metal bench and a wooden bench in the same park are at the same temperature, but the metal feels colder: it conducts heat away from your hand much faster.`],
    ],
    practice: (p, h) => [`Double glazing traps a layer of air (k ≈ 0.025), conducting about ${h.r(1 / 0.025, 0)} times less heat than the same thickness of glass.`],
  };

  // Convection: water parcels go round in two loops, rising in the middle and sinking at the walls.
  const transConvection = {
    id: 'convection',
    label: 'Convection',
    lede: 'Heat a pot from below. The warm water expands, becomes lighter and rises; cooler water sinks to take its place. The water itself carries the heat around.',
    build: 2.4,
    compact: true,
    params: {
      dT: { value: 30, min: 5, max: 70, step: 5, color: 'c', label: 'how much warmer the bottom water is, in °C', digits: 0 },
    },
    sim: { duration: () => 10 },
    formula: (p, h) => `${h.v('ρ')}<sub>warm</sub>${op('=')}${h.frac('998', `1${op('+')}0.00021${op('×')}${h.n('dT')}`)}${op('=')}${h.r(998 / (1 + 0.00021 * p.dT), 1)}${h.unit('kg/m³')}`,
    aside: (p, h) => `<div>Cool water: 998 kg/m³. The warm water is ${h.c('c', fmt(998 - 998 / (1 + 0.00021 * p.dT), 1), 'diff')} kg/m³ lighter, so it floats up.</div>`,
    steps: [
      { at: 0, hl: [], say: 'A pot of water on a flame.' },
      { at: 0.35, hl: ['dT'], say: 'Water at the bottom warms and expands: the same mass takes more room, so its density drops.' },
      { at: 0.7, hl: ['res', 'diff'], say: 'Lighter water rises like a balloon; cooler, denser water sinks at the sides. A loop forms: a convection current.' },
    ],
    sfx: () => [sfx.whoosh(0.02, 0.3), sfx.glide(0.35, 0.6, pitch(0), pitch(5)), sfx.swoosh(0.7, 0.95)],
    simSay: () => 'Follow a dot: it warms at the bottom (rose), rises up the middle, cools at the surface (blue) and sinks at the sides. The air in a room does the same around a heater.',
    simSfx: () => [sfx.whoosh(0, 5), sfx.whoosh(5, 10)],
    draw(p, h, { k, t }) {
      const cx = 250, by = 340, w = 300, hh = 220, speed = 0.08 + p.dT / 300;
      let s = S.rect(cx - w / 2, by - hh, w, hh, 'a-soft', 'ink', { 'stroke-width': 2.5 }) + flame(cx - 30, by + 40, t + k, 1.3) + flame(cx + 30, by + 40, t + k + 0.7, 1.3);
      const go = seg(k, 0.35, 0.7);
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 14; i++) {
          // Each parcel goes round an ellipse; angle measured so that it rises near the centre.
          const ph = 2 * Math.PI * (i / 14 + t * speed * go), rx = w / 4 - 14, ry = hh / 2 - 22, ex = cx + side * (w / 4), ey = by - hh / 2;
          // sin(ph) = 1 at the bottom, where the parcel is hottest; it then moves to the centre and rises.
          const x = ex + side * rx * Math.cos(ph), y = ey + ry * Math.sin(ph);
          const hot = clamp01(0.5 + 0.5 * Math.sin(ph + 0.6));
          s += S.circle(x, y, 6, 'a', null, { opacity: (1 - hot).toFixed(2) }) + S.circle(x, y, 6, 'c', null, { opacity: hot.toFixed(2) });
        }
        s += S.fade(seg(k, 0.7, 0.95), S.path(path(30, (u) => { const ph = Math.PI * (0.15 + 1.7 * u); return [cx + side * (w / 4) - side * (w / 4 - 30) * Math.cos(ph), by - hh / 2 - (hh / 2 - 40) * Math.sin(ph)]; }), 'muted', 1.5, dashed('4 4')));
      }
      s += S.fade(seg(k, 0.7, 0.95), label(cx, by - hh - 14, 'cools at the top', { fill: 'a', size: 12 }) + label(cx, by + 70, 'heated at the bottom', { fill: 'c', size: 12 }) +
        caption(470, 140, 'Same idea, everyday:') + caption(470, 165, '· heaters go low, air conditioners high') + caption(470, 190, '· sea breezes by day, land breezes by night') + caption(470, 215, '· the freezer compartment sits at the top'));
      return s;
    },
    theory: [
      ['Convection', `In fluids, liquids and gases, heat is carried by the fluid itself moving. Warmed fluid expands, its density ${M('ρ = m/V')} drops, and buoyancy pushes it up; cooler, denser fluid sinks to replace it, forming a circulating <em>convection current</em>. It can't happen in solids, which can't flow, or in a vacuum, which has no fluid.`],
      ['Where to put heaters', `Because warm air rises, a heater works best near the floor and an air conditioner near the ceiling: each sets up a loop that stirs the whole room. A fridge's freezer is at the top so the cold air it makes sinks through the compartment.`],
      ['Weather', `On a sunny day the land warms faster than the sea, warm air rises over it and cool sea air flows in: a sea breeze. At night it reverses. On a planetary scale, convection drives winds, thunderstorms and ocean currents.`],
    ],
    practice: (p, h) => [`Hot-air balloons fly by convection: air heated by 100 °C is about ${h.r(100 * (1 - 293 / 393), 0)} % less dense than the air around it.`],
  };

  // Radiation: a one-layer greenhouse model. Ts = 255 K × (2 / (2 − ε))^(1/4).
  const surfaceT = (eps) => 255 * Math.pow(2 / (2 - eps), 0.25) - 273;
  const transRadiation = {
    id: 'radiation',
    label: 'Radiation and the greenhouse',
    lede: 'Sunlight crosses empty space to warm the Earth. The warm ground glows back in infrared, and greenhouse gases catch some of that glow on its way out.',
    build: 3,
    compact: true,
    params: {
      eps: { value: 0.78, min: 0, max: 1, step: 0.02, color: 'c', label: 'fraction of infrared the atmosphere absorbs' },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('T')}<sub>surface</sub>${op('=')}255 K${op('×')}(2 ÷ (2 − ${h.n('eps')}))<sup>¼</sup>${op('=')}${h.r(surfaceT(p.eps), 0)}${h.unit('°C')}`,
    aside: (p, h) => `<div>With no greenhouse gases (${h.v('ε')} = 0) the average would be ${h.c('a', '−18', 'cold')} °C. The real Earth is about 15 °C.</div>`,
    readout: (p, h) => h.ro('surface', fmt(surfaceT(p.eps), 0), '°C', 'c'),
    steps: [
      { at: 0, hl: [], say: 'Sunlight, mostly visible light, passes straight through the clear air and warms the ground.' },
      { at: 0.35, hl: [], say: 'The warm ground radiates too, but at its temperature that radiation is infrared: invisible, longer waves.' },
      { at: 0.65, hl: ['eps'], say: 'Water vapour and CO₂ absorb infrared and send part of it back down. The ground ends up warmer than it would be on its own.' },
    ],
    sfx: () => [sfx.chime(0.02, note(9)), sfx.glide(0.35, 0.6, pitch(5), pitch(-5)), sfx.chord(0.66, [note(2), note(4)])],
    simSay: (p) => `About ${fmt(p.eps * 100, 0)} % of the outgoing infrared is caught and half of that sent back down. More greenhouse gas, warmer surface.`,
    simSfx: () => [sfx.whoosh(0, 4), sfx.whoosh(4, 8)],
    draw(p, h, { k, t }) {
      const gy = 340, atmY = 170;
      const wavy = (x1, y1, x2, y2, col, waves, ph, len) => {
        const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        return S.path(path(60, (u) => { const d = u * Math.min(len, L), off = 6 * Math.sin((d / L) * waves * 2 * Math.PI - ph); return [x1 + ux * d - uy * off, y1 + uy * d + ux * off]; }), col, 2.5);
      };
      let s = S.circle(90, 60, 34, 'b', null) + S.rect(40, gy, 720, 60, 'b-soft', null) + label(400, gy + 36, 'ground', { fill: 'b', size: 12 });
      s += S.rect(40, atmY - 30, 720, 60, 'c', null, { opacity: (0.08 + 0.3 * p.eps).toFixed(3) }) + label(740, atmY + 5, 'greenhouse gases', { fill: 'c', size: 12, anchor: 'end' });
      const u0 = seg(k, 0, 0.3), u1 = seg(k, 0.35, 0.6), u2 = seg(k, 0.65, 0.9), ph = t * 8;
      for (let i = 0; i < 3; i++) s += S.fade(u0, wavy(130 + i * 20, 90 + i * 10, 260 + i * 70, gy, 'b', 9, ph, 400 * u0));
      for (let i = 0; i < 3; i++) {
        const x = 420 + i * 90;
        s += S.fade(u1, wavy(x, gy, x + 20, 30, 'c', 3.5, ph, 310 * u1));
        if (p.eps > 0.05) s += S.fade(u2, wavy(x + 10, atmY, x - 10, gy, 'c', 2.5, ph, (gy - atmY) * u2) + S.circle(x + 10, atmY, 5 + 6 * p.eps, 'c', null, { opacity: 0.6 }));
      }
      s += S.fade(u1, label(560, 60, 'infrared escaping', { fill: 'c', size: 12 }));
      s += S.fade(u2, label(560, gy - 20, 'sent back down', { fill: 'c', size: 12 }));
      s += thermometer(60, 230, 80, (surfaceT(p.eps) + 30) / 60, 'c', `${fmt(surfaceT(p.eps), 0)} °C`);
      return s;
    },
    theory: [
      ['Radiation', `Every object emits electromagnetic radiation, and the hotter it is, the more: the power grows with the fourth power of the absolute temperature, ${M('P = σAT^4')}. It's the only way heat crosses a vacuum, which is how the Sun warms us across 150 million km of empty space.`],
      ['Colour of the glow', `Hotter objects emit at shorter wavelengths: ${M('λ_{max} = b/T')}. The Sun, at about 5500 °C, peaks in visible light. The ground, at about 15 °C, peaks in the infrared, around 10 micrometres.`],
      ['The greenhouse effect', `Visible sunlight passes through the atmosphere, but water vapour, CO₂ and methane absorb outgoing infrared and re-emit part of it downward. Without them, Earth would average about −18 °C. Adding more of them strengthens the effect: that's the mechanism behind global warming. A greenhouse or a closed car in the sun traps heat in a similar way, mostly by stopping the warm air from escaping.`],
      ['Light and dark surfaces', `Dark, matte surfaces absorb and emit radiation well; light, shiny ones reflect it. That's why houses in hot climates are painted white and emergency blankets are silvered.`],
    ],
    practice: (p, h) => [`In this simple model, going from ε = 0.78 to 0.80 warms the surface by ${h.r(surfaceT(0.8) - surfaceT(0.78), 1)} °C.`],
  };

  // Vacuum flask: coffee cooling in a mug versus in a flask (Newton's law of cooling).
  const HOURS = 12;
  const transFlask = {
    id: 'flask',
    label: 'Vacuum flask',
    lede: 'A vacuum flask blocks all three ways heat can leave: conduction, convection and radiation. Coffee in it stays hot all day.',
    build: 3.2,
    compact: true,
    params: {
      T0: { value: 90, min: 60, max: 95, step: 5, color: 'c', label: 'starting coffee temperature in °C', digits: 0 },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('T')}${op('=')}20${op('+')}(${h.n('T0')}${op('−')}20)${op('×')}e<sup>−0.03 × ${HOURS}</sup>${op('=')}${h.r(20 + (p.T0 - 20) * Math.exp(-0.03 * HOURS), 0)}${h.unit(`°C after ${HOURS} h`)}`,
    aside: (p, h) => `<div>In an open mug (cooling about 25 times faster) it would be ${h.c('a', fmt(20 + (p.T0 - 20) * Math.exp(-0.75 * HOURS), 0), 'mug')} °C, room temperature.</div>`,
    readout: (p, h, { t }) => { const hr = (t / 8) * HOURS; return h.ro('time', fmt(hr, 1), 'h') + h.ro('flask', fmt(20 + (p.T0 - 20) * Math.exp(-0.03 * hr), 0), '°C', 'c') + h.ro('mug', fmt(20 + (p.T0 - 20) * Math.exp(-0.75 * hr), 0), '°C', 'a'); },
    steps: [
      { at: 0, hl: [], say: 'A vacuum flask, cut in half: a glass bottle inside a glass bottle.' },
      { at: 0.25, hl: [], say: 'Conduction: the gap between the two walls is a vacuum. With no atoms in it, there’s nothing to pass the jiggling on.' },
      { at: 0.5, hl: [], say: 'Convection: no air in the gap to circulate, and the stopper keeps warm air from rising out of the top.' },
      { at: 0.75, hl: [], say: 'Radiation: the walls are silvered like a mirror, reflecting the infrared back into the coffee.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.tick(0.26, note(4)), sfx.tick(0.51, note(5)), sfx.chime(0.76, note(7))],
    simSay: () => 'Twelve hours in eight seconds. The mug loses heat through all three routes and cools within an hour; the flask leaks so little that the coffee is still hot by evening.',
    simSfx: () => [sfx.glide(0, 8, pitch(9), pitch(6))],
    draw(p, h, { k, t }) {
      const cx = 190, top = 70, bot = 380, wo = 120, wi = 96;
      let s = S.rect(cx - wo / 2 - 14, top + 30, wo + 28, bot - top - 30, 'ink-soft', 'ink', { rx: 14, 'stroke-width': 2 });
      s += S.rect(cx - wo / 2, top + 40, wo, bot - top - 54, 'card', 'grid2', { rx: 12 });
      // The vacuum gap, shown as faint dots in between two silvered walls.
      for (let i = 0; i < 16; i++) s += S.circle(cx + (i % 2 ? 1 : -1) * (wo / 2 - 6), top + 60 + i * 18, 1.2, 'muted');
      s += S.rect(cx - wo / 2, top + 40, wo, bot - top - 54, null, 'muted', { rx: 12, 'stroke-width': 3 }) + S.rect(cx - wi / 2, top + 52, wi, bot - top - 78, 'c-soft', 'muted', { rx: 10, 'stroke-width': 3 });
      s += S.rect(cx - 26, top, 52, 56, 'b-soft', 'b', { rx: 6, 'stroke-width': 2 }) + label(cx, top - 8, 'stopper', { fill: 'b', size: 11 });
      const blocked = (x, y, text, u) => S.fade(u, S.arrow(x, y, x + 60, y, 'c', 2.5) + S.line(x + 22, y - 10, x + 38, y + 10, 'ink', 3) + S.line(x + 22, y + 10, x + 38, y - 10, 'ink', 3) + label(x + 70, y + 4, text, { anchor: 'start', size: 12 }));
      s += blocked(cx + 40, 300, 'conduction: vacuum gap', seg(k, 0.25, 0.45));
      s += blocked(cx + 10, top + 20, 'convection: stopper, no air', seg(k, 0.5, 0.7));
      s += blocked(cx + 40, 200, 'radiation: mirrored walls', seg(k, 0.75, 0.95));
      const Gr = graph({ x0: 480, x1: 760, y0: 380, y1: 110, tMax: HOURS, vMax: 100, tLabel: 'hours', vLabel: 'coffee temperature (°C)' });
      s += S.fade(seg(k, 0, 0.3), Gr.s);
      const hr = (t / 8) * HOURS;
      if (t > 0) s += S.path(path(80, (u) => [Gr.X(u * hr), Gr.Y(20 + (p.T0 - 20) * Math.exp(-0.03 * u * hr))]), 'c', 2.5) + S.path(path(80, (u) => [Gr.X(u * hr), Gr.Y(20 + (p.T0 - 20) * Math.exp(-0.75 * u * hr))]), 'a', 2.5) +
        label(Gr.X(hr), Gr.Y(20 + (p.T0 - 20) * Math.exp(-0.03 * hr)) - 8, 'flask', { fill: 'c', size: 11 }) + label(Gr.X(Math.min(hr, 2)), Gr.Y(30) - 6, 'mug', { fill: 'a', size: 11 });
      return s;
    },
    theory: [
      ['Three routes, three defences', `Heat leaves a hot drink by <em>conduction</em> through the walls, <em>convection</em> of the air above and around it, and <em>radiation</em> from its surface. A vacuum flask (Dewar flask) answers each: a vacuum between two glass walls stops conduction and convection across the gap, the stopper stops convection out of the top, and silvered walls reflect radiation back.`],
      ['Works both ways', `The same flask keeps cold drinks cold: it slows heat flowing <em>in</em> just as well. Scientists store liquid nitrogen at −196 °C in big Dewar flasks.`],
      ['Cooling curves', `An object cools faster the hotter it is compared with its surroundings: ${M('T = T_{room} + (T_0 − T_{room}) e^{−kt}')} (Newton's law of cooling). Good insulation makes ${M('k')} small.`],
    ],
    practice: (p, h) => [`After 6 hours the flask coffee is still ${h.r(20 + (p.T0 - 20) * Math.exp(-0.03 * 6), 0)} °C.`],
  };

  MV.register({ realm: 'phys', id: 't-transfer', group: GROUP, symbol: '≋', title: 'Heat transfer', modesLabel: null, modes: [transConduction, transConvection, transRadiation, transFlask] });

  // =====================================================================
  // First law of thermodynamics
  // =====================================================================

  const U0 = 1500; // internal energy of the gas before we start, in joules
  const SIM_F = 6;
  const piston = (cx, by, w, hgt, gasTop, t, hot, speed, seed) => {
    let s = S.line(cx - w / 2, by - hgt, cx - w / 2, by, 'ink', 3) + S.line(cx + w / 2, by - hgt, cx + w / 2, by, 'ink', 3) + S.line(cx - w / 2, by, cx + w / 2, by, 'ink', 3);
    s += S.rect(cx - w / 2 + 2, gasTop, w - 4, by - gasTop - 2, 'c', null, { opacity: (0.06 + 0.2 * hot).toFixed(3) });
    s += gas(22, { x0: cx - w / 2 + 3, y0: gasTop + 2, x1: cx + w / 2 - 3, y1: by - 3 }, speed, t, seed, hot);
    s += S.rect(cx - w / 2 + 3, gasTop - 18, w - 6, 18, 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.rect(cx - 6, gasTop - 70, 12, 52, 'ink-soft', 'ink', { 'stroke-width': 1.5 });
    return s;
  };
  const firstConcept = {
    id: 'concept',
    label: 'Heat, work and internal energy',
    lede: 'Heat a gas under a piston. Part of the heat pushes the piston up (work); the rest stays in the gas as faster-moving molecules (internal energy).',
    build: 3.2,
    params: {
      Q: { value: 600, min: 0, max: 1000, step: 50, color: 'b', label: 'heat added in joules', digits: 0 },
      W: { value: 200, min: 0, max: 1000, step: 50, color: 'a', label: 'work done by the gas in joules', digits: 0 },
    },
    sim: { duration: () => SIM_F },
    formula: (p, h) => `${h.v('ΔU')}${op('=')}${h.n('Q')}${op('−')}${h.n('W')}${op('=')}${h.r(p.Q - p.W, 0)}${h.unit('J')}`,
    aside: (p, h) => `<div>${p.Q - p.W > 0 ? 'More heat in than work out: the gas warms up.' : p.Q - p.W < 0 ? 'More work out than heat in: the gas pays the difference from its own energy and cools down.' : 'All the heat leaves as work: the temperature stays the same.'}</div>`,
    readout: (p, h, { t }) => { const f = clamp01(t / SIM_F); return h.ro('heat in', fmt(p.Q * f, 0), 'J', 'b') + h.ro('work out', fmt(p.W * f, 0), 'J', 'a') + h.ro('ΔU', fmt((p.Q - p.W) * f, 0), 'J', 'c'); },
    steps: [
      { at: 0, hl: [], say: 'Gas trapped under a free piston. Its molecules dart about; their total energy is the internal energy U.' },
      { at: 0.3, hl: ['Q'], say: ({ Q }) => `A flame adds ${fmt(Q)} J of heat Q.` },
      { at: 0.55, hl: ['W'], say: ({ W }) => `The gas pushes the piston up, doing ${fmt(W)} J of work W on the outside world.` },
      { at: 0.78, hl: ['res'], say: (p) => `Energy is conserved: what came in as heat, minus what left as work, stays in the gas. ΔU = ${fmt(p.Q - p.W)} J.` },
    ],
    sfx: (p) => [sfx.pop(0.02, note(2)), sfx.whoosh(0.3, 0.5), sfx.glide(0.55, 0.72, pitch(0), pitch(p.W / 100)), sfx.chime(0.8, note(7))],
    simSay: (p) => (p.Q - p.W >= 0 ? 'Watch the molecules: as the internal energy rises, they move faster. The piston rises as the gas does work.' : 'The gas does more work than the heat supplied, so its molecules slow down: it cools as it expands.'),
    simSfx: (p) => [sfx.whoosh(0, SIM_F), sfx.glide(0, SIM_F, pitch(0), pitch((p.Q - p.W) / 100))],
    draw(p, h, { k, t }) {
      const f = t > 0 ? clamp01(t / SIM_F) : 0, U = U0 + (p.Q - p.W) * f, hot = clamp01((U - 500) / 2500), cx = 200, by = 330, w = 180;
      const gasTop = by - 140 - (p.W / 1000) * 100 * f;
      let s = piston(cx, by, w, 280, gasTop, t + k * 2, hot, 120 * Math.sqrt(U / U0), 3) + flame(cx, by + 44, t + k, 0.6 + p.Q / 800, seg(k, 0.3, 0.5));
      // Energy bars: heat in = work out + change in internal energy.
      const sc = 0.22, bx = 470, by0 = 330, u1 = seg(k, 0.3, 0.5), u2 = seg(k, 0.55, 0.72), u3 = seg(k, 0.78, 0.95);
      s += S.fade(u1, bar(bx, by0, p.Q * Math.max(f, t > 0 ? f : 1), sc, 'b', 'heat in Q', `${fmt(p.Q, 0)} J`, 50));
      s += S.fade(u2, bar(bx + 90, by0, p.W * Math.max(f, t > 0 ? f : 1), sc, 'a', 'work out W', `${fmt(p.W, 0)} J`, 50));
      s += S.fade(u3, bar(bx + 180, by0, (p.Q - p.W) * Math.max(f, t > 0 ? f : 1), sc, 'c', 'ΔU', `${fmt(p.Q - p.W, 0)} J`, 50));
      s += S.fade(u3, label(bx + 90, 60, 'Q = W + ΔU', { weight: 600, size: 16 }));
      s += S.fade(seg(k, 0.55, 0.72), S.arrow(cx + w / 2 + 20, gasTop, cx + w / 2 + 20, gasTop - 50, 'a', 3) + label(cx + w / 2 + 26, gasTop - 30, 'pushes', { fill: 'a', size: 11, anchor: 'start' }));
      return s;
    },
    theory: [
      ['The first law', `The first law of thermodynamics is conservation of energy for heat and work: ${M('ΔU = Q − W')}. ${M('Q')} is the heat added to the system, ${M('W')} the work the system does on its surroundings, and ${M('ΔU')} the change in its internal energy, the total kinetic energy of its molecules for an ideal gas, which is what temperature measures.`],
      ['Signs', `Heat flowing in is positive; heat leaving is negative. Work done <em>by</em> the gas (expanding) is positive; work done <em>on</em> it (being compressed) is negative. With these signs, the law covers every case.`],
      ['Special processes', `<em>Isothermal</em> (constant temperature): ${M('ΔU = 0')}, so ${M('Q = W')}. <em>Adiabatic</em> (no heat exchanged, too fast or too insulated): ${M('Q = 0')}, so ${M('ΔU = −W')}: expanding gas cools, compressed gas heats up. <em>Isochoric</em> (fixed volume): ${M('W = 0')}, so all the heat goes into ${M('U')}. <em>Isobaric</em> (constant pressure): ${M('W = pΔV')}.`],
      ['No free energy', `You can't get more work out of a machine than the energy you put in. The first law rules out every perpetual-motion machine that claims to make energy from nothing.`],
    ],
    practice: null,
  };

  const firstPump = {
    id: 'pump',
    label: 'Bike pump',
    lede: 'Pump up a tyre quickly and the pump gets hot. You do work squeezing the air, there’s no time for heat to escape, so it all becomes internal energy.',
    build: 1,
    params: {
      Won: { value: 150, min: 20, max: 300, step: 10, color: 'a', label: 'work you do squeezing the air, in joules', digits: 0 },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => `${h.v('ΔU')}${op('=')}0${op('−')}(${op('−')}${h.n('Won')})${op('=')}${h.r(p.Won, 0)}${h.unit('J')}`,
    aside: (p, h) => `<div>Adiabatic: no heat in or out (${h.v('Q')} = 0). Work done on the gas counts as negative ${h.v('W')}. For the 0.002 mol of air in a pump, ${h.val('Won')} J heats it by about ${h.c('c', fmt(p.Won / (0.002 * 20.8 * 120), 0), 'dT')} °C (in a real pump the walls soak up most of it).</div>`,
    readout: (p, h, { t }) => h.ro('work done', fmt(p.Won * clamp01(t / 3), 0), 'J', 'a'),
    steps: [{ at: 0, hl: [], say: 'A bike pump, outlet blocked, full of air at room temperature.' }],
    simSay: () => 'You push the handle down: every molecule bouncing off the moving piston comes back faster, like a ball hit by a bat. Faster molecules: hotter air.',
    simSfx: () => [sfx.swoosh(0, 3), sfx.chime(3.1, note(9))],
    draw(p, h, { k, t }) {
      const f = clamp01(t / 3), cx = 250, by = 380, w = 120, hot = clamp01(0.25 + 0.75 * f * (p.Won / 300));
      const gasTop = by - 260 + 150 * f;
      let s = piston(cx, by, w, 280, gasTop, t + k, hot, 110 * (1 + 1.2 * f * (p.Won / 300)), 5);
      s += S.arrow(cx, gasTop - 120, cx, gasTop - 76, 'a', 4) + label(cx + 12, gasTop - 100, 'push', { fill: 'a', anchor: 'start', weight: 600 });
      s += thermometer(cx + w / 2 + 50, 140, 160, 0.2 + 0.7 * f * (p.Won / 300), 'c', f > 0 ? 'heating up' : 'room temp.');
      s += S.fade(seg(k, 0, 0.6), caption(480, 150, 'Q = 0: no time for heat to leave') + caption(480, 175, 'W < 0: work is done on the gas') + caption(480, 200, 'so ΔU = −W > 0: it warms'));
      return s;
    },
    theory: [
      ['Adiabatic compression', `When a gas is squeezed faster than heat can flow out, ${M('Q = 0')} and ${M('ΔU = −W')}. The work you do on it (negative ${M('W')}) becomes internal energy and the gas heats up. Diesel engines use this: they squeeze air so hard and fast that it gets hot enough to ignite the fuel without a spark plug.`],
      ['And the reverse', `A gas that expands quickly does work and cools: an aerosol can gets cold as you spray it, and air rising up a mountain expands and cools, which is why peaks are cold and why clouds form.`],
    ],
    practice: (p, h) => [`A diesel engine squeezes air to about 1/20 of its volume, heating it to over 500 °C.`],
  };

  const firstArea = {
    id: 'area',
    label: 'Work is an area',
    lede: 'A gas expanding at constant pressure pushes the piston with a steady force. On a pressure–volume graph, the work it does is the area under the line.',
    build: 1,
    compact: true,
    params: {
      pk: { value: 200, min: 100, max: 300, step: 10, color: 'b', label: 'pressure in kilopascals', digits: 0 },
      V1: { value: 1, min: 0.5, max: 2, step: 0.25, color: 'a', label: 'starting volume in litres' },
      V2: { value: 3, min: 2.5, max: 5, step: 0.25, color: 'a', label: 'final volume in litres' },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => `${h.v('W')}${op('=')}${h.n('pk')}${op('×')}(${h.n('V2')}${op('−')}${h.n('V1')})${op('=')}${h.r(p.pk * (p.V2 - p.V1), 0)}${h.unit('J')}`,
    aside: () => '<div>kPa × litres = joules, conveniently: 1000 Pa × 0.001 m³ = 1 J.</div>',
    readout: (p, h, { t }) => { const V = lerp(p.V1, p.V2, clamp01(t / 3.5)); return h.ro('volume', fmt(V, 2), 'L') + h.ro('work so far', fmt(p.pk * (V - p.V1), 0), 'J', 'c'); },
    steps: [{ at: 0, hl: [], say: 'Gas at constant pressure under a weighted piston, about to be heated.' }],
    simSay: (p) => `The gas expands at a steady ${fmt(p.pk)} kPa. Force × distance = pressure × area × distance = pressure × change in volume: the shaded rectangle.`,
    simSfx: () => [sfx.glide(0, 3.5, pitch(0), pitch(7)), sfx.chime(3.6, note(7))],
    draw(p, h, { k, t }) {
      const f = clamp01(t / 3.5), V = lerp(p.V1, p.V2, f);
      const Gr = graph({ x0: 380, x1: 760, y0: 370, y1: 90, tMax: 5.5, vMax: 330, tLabel: 'volume (L)', vLabel: 'pressure (kPa)' });
      let s = S.fade(seg(k, 0, 0.6), Gr.s);
      s += S.rect(Gr.X(p.V1), Gr.Y(p.pk), Gr.X(V) - Gr.X(p.V1), Gr.Y(0) - Gr.Y(p.pk), 'c-soft', null) + S.line(Gr.X(p.V1), Gr.Y(p.pk), Gr.X(V), Gr.Y(p.pk), 'ink', 3) + S.circle(Gr.X(V), Gr.Y(p.pk), 6, 'ink');
      if (V - p.V1 > 0.3) s += label((Gr.X(p.V1) + Gr.X(V)) / 2, Gr.Y(p.pk / 2), `W = ${fmt(p.pk * (V - p.V1), 0)} J`, { fill: 'c', weight: 600 });
      // An isotherm from the same start, for comparison: it does less work.
      s += S.fade(seg(k, 0, 0.6), S.path(path(40, (u) => { const v = lerp(p.V1, 5.5, u); return [Gr.X(v), Gr.Y((p.pk * p.V1) / v)]; }), 'muted', 1.2, dashed('4 4')) + label(Gr.X(5.4), Gr.Y((p.pk * p.V1) / 5.4) - 6, 'constant T', { fill: 'muted', size: 10, anchor: 'end' }));
      const cx = 170, by = 370, w = 160, top = by - 50 - V * 50;
      s += piston(cx, by, w, 320, top, t + k, 0.4 + 0.3 * f, 100, 7) + S.rect(cx - 40, top - 100, 80, 30, 'b-soft', 'b', { 'stroke-width': 2 }) + label(cx, top - 80, 'weight', { fill: 'b', size: 11 }) + flame(cx, by + 42, t + k, 1);
      return s;
    },
    theory: [
      ['Pressure times volume', `A gas at pressure ${M('p')} pushes a piston of area ${M('A')} with force ${M('pA')}. Moving it a distance ${M('d')} does work ${M('W = pAd = pΔV')}. On a ${M('p')}–${M('V')} graph that's the area of the rectangle under the line.`],
      ['Any process', `If the pressure changes as the gas expands, the work is still the area under the curve. Going round a closed loop on the graph, as an engine does, the work done in one cycle is the area enclosed by the loop.`],
    ],
    practice: (p, h) => [`Breathing in, your lungs expand by about 0.5 L against atmospheric pressure (101 kPa): ${h.r(101 * 0.5, 0)} J of work.`],
  };

  MV.phys.gas = gas;
  MV.phys.rnd = rnd;
  MV.register({ realm: 'phys', id: 't-first', group: GROUP, symbol: 'U', title: 'First law of thermodynamics', modes: [firstConcept, firstPump, firstArea] });

  // =====================================================================
  // Heat engines and the Carnot cycle
  // =====================================================================

  // A flow diagram: band widths proportional to the energy carried. Moving dots show the flow.
  const band = (pts, wdt, col, t, dir = 1, n = 6) => {
    let s = S.path(MV.phys.pts(pts), col, Math.max(2, wdt), { opacity: 0.35, 'stroke-linecap': 'butt' });
    const W = MV.phys.wire(pts);
    if (wdt > 2) for (let i = 0; i < n; i++) { const [x, y] = W.at((((i / n + dir * t * 0.25) % 1) + 1) % 1 * W.len); s += S.circle(x, y, Math.min(6, wdt / 3), col); }
    return s;
  };
  const QH = 1000;
  const engineConcept = {
    id: 'concept',
    label: 'Heat engine',
    lede: 'An engine takes heat from something hot, turns part of it into work, and must dump the rest into something cold. Even a perfect engine can’t use all of it.',
    build: 3.2,
    compact: true,
    params: {
      TH: { value: 800, min: 400, max: 1200, step: 50, color: 'c', label: 'hot source temperature in kelvin', digits: 0 },
      TC: { value: 300, min: 250, max: 400, step: 10, color: 'a', label: 'cold sink temperature in kelvin', digits: 0 },
      W: { value: 300, min: 0, max: 1000, step: 25, color: 'b', label: 'work out per 1000 J of heat in', digits: 0 },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('η')}${op('=')}${h.frac(h.n('W'), '1000')}${op('=')}${h.r((p.W / QH) * 100, 0)}${h.unit('%')}`,
    aside: (p, h) => { const lim = 1 - p.TC / p.TH; return `<div>Carnot limit: 1 − ${h.n('TC')} ÷ ${h.n('TH')} = ${h.c('ink', fmt(lim * 100, 0), 'lim')} %. ${p.W / QH > lim ? '<b>Impossible: no engine can beat the Carnot limit.</b>' : `Heat dumped: ${fmt(QH - p.W)} J.`}</div>`; },
    readout: (p, h) => h.ro('efficiency', fmt((p.W / QH) * 100, 0), '%') + h.ro('limit', fmt((1 - p.TC / p.TH) * 100, 0), '%'),
    steps: [
      { at: 0, hl: ['TH'], say: ({ TH }) => `A hot source at ${fmt(TH)} K (burning fuel, say) gives the engine 1000 J of heat each cycle.` },
      { at: 0.3, hl: ['W'], say: ({ W }) => `The engine turns ${fmt(W)} J of it into work: turning wheels, lifting things.` },
      { at: 0.55, hl: ['TC'], say: (p) => `The other ${fmt(QH - p.W)} J must be dumped into a cold sink at ${fmt(p.TC)} K, the air or a river. This isn’t a design flaw: it’s required by the second law.` },
      { at: 0.78, hl: ['res', 'lim'], say: (p) => `Efficiency = work ÷ heat in = ${fmt((p.W / QH) * 100, 0)} %. The best possible, Carnot’s limit, depends only on the two temperatures: ${fmt((1 - p.TC / p.TH) * 100, 0)} %.` },
    ],
    sfx: (p) => [sfx.whoosh(0.02, 0.25), sfx.glide(0.3, 0.5, pitch(0), pitch(p.W / 80)), sfx.swoosh(0.55, 0.75), sfx.chime(0.8, note(7))],
    simSay: (p) => (p.W / QH > 1 - p.TC / p.TH ? 'This engine would beat Carnot’s limit, so it can’t exist: it would let heat flow from cold to hot for free.' : 'Energy flows from hot to cold through the engine, and the engine skims off work on the way. Hotter source or colder sink, bigger possible share.'),
    simSfx: () => Array.from({ length: 16 }, (_, i) => sfx.tick(i * 0.5, note(i % 2 ? 2 : 4))),
    draw(p, h, { k, t }) {
      const wq = 60 / QH, lim = 1 - p.TC / p.TH, bad = p.W / QH > lim;
      const u1 = seg(k, 0.3, 0.5), u2 = seg(k, 0.55, 0.75), u3 = seg(k, 0.78, 0.95);
      let s = S.rect(120, 30, 260, 56, 'c-soft', 'c', { rx: 10, 'stroke-width': 2 }) + label(250, 63, `hot source  ${fmt(p.TH)} K`, { fill: 'c', weight: 600 });
      s += S.fade(u2, S.rect(120, 340, 260, 56, 'a-soft', 'a', { rx: 10, 'stroke-width': 2 }) + label(250, 373, `cold sink  ${fmt(p.TC)} K`, { fill: 'a', weight: 600 }));
      s += band([[250, 86], [250, 190]], QH * wq, 'c', t) + label(270, 140, `Q_H = 1000 J`, { fill: 'c', anchor: 'start', size: 12 });
      s += S.fade(u1, band([[250, 215], [250, 230], [560, 230]], p.W * wq * u1, 'b', t) + label(570, 234, `W = ${fmt(p.W)} J`, { fill: 'b', anchor: 'start', weight: 600 }));
      s += S.fade(u2, band([[250, 230], [250, 340]], (QH - p.W) * wq, 'a', t) + label(270, 300, `Q_C = ${fmt(QH - p.W)} J`, { fill: 'a', anchor: 'start', size: 12 }));
      // The engine: a wheel that spins faster the more work it delivers.
      const ang = t * (1 + p.W / 150) * 2;
      s += S.circle(250, 210, 30, 'card', bad ? 'c' : 'ink', { 'stroke-width': 3 });
      for (let i = 0; i < 4; i++) { const a = ang + (i * Math.PI) / 2; s += S.line(250, 210, 250 + 26 * Math.cos(a), 210 + 26 * Math.sin(a), 'ink', 2); }
      // Efficiency bar against the Carnot limit.
      const bx = 520, by = 330, bw = 220;
      s += S.fade(u3, S.rect(bx, by, bw, 20, 'ink-soft', null, { rx: 4 }) + S.rect(bx, by, bw * Math.min(1, p.W / QH), 20, bad ? 'c' : 'b', null, { rx: 4 }) +
        S.line(bx + bw * lim, by - 10, bx + bw * lim, by + 30, 'ink', 2.5) + label(bx + bw * lim, by - 16, `Carnot ${fmt(lim * 100, 0)} %`, { size: 11, weight: 600 }) + label(bx, by + 44, `this engine ${fmt((p.W / QH) * 100, 0)} %${bad ? ': impossible' : ''}`, { anchor: 'start', size: 12, fill: bad ? 'c' : 'ink' }));
      return s;
    },
    theory: [
      ['Heat engines', `A heat engine runs in a cycle: it takes heat ${M('Q_H')} from a hot source, does work ${M('W')}, and rejects heat ${M('Q_C')} to a cold sink. By the first law, ${M('W = Q_H − Q_C')}. Its efficiency is the useful fraction, ${M('η = W/Q_H = 1 − Q_C/Q_H')}. Car engines manage about 25–35 %, large power stations about 40–60 %.`],
      ['The second law', `Heat flows naturally only from hot to cold. A consequence is that no engine can turn heat entirely into work: some must always flow on to a colder body. Kelvin and Planck stated the second law exactly this way.`],
      ['Carnot’s limit', `Sadi Carnot showed in 1824 that the most efficient engine possible between two temperatures (in kelvin) has ${M('η_{max} = 1 − T_C/T_H')}. It doesn't depend on the fuel or the design. To do better you need a hotter source or a colder sink, which is why power stations burn fuel as hot as their materials allow.`],
    ],
    practice: (p, h) => [`A power station with steam at 840 K and a river at 290 K can never beat ${h.r((1 - 290 / 840) * 100, 0)} % efficiency.`],
  };

  const engineFridge = {
    id: 'fridge',
    label: 'Refrigerator',
    lede: 'A fridge is a heat engine run backwards. It uses work to pump heat out of the cold inside and dump it, plus the work, into the warm kitchen.',
    build: 1,
    compact: true,
    params: {
      QC: { value: 300, min: 100, max: 600, step: 25, color: 'a', label: 'heat removed from inside, joules per cycle', digits: 0 },
      W: { value: 100, min: 20, max: 300, step: 10, color: 'b', label: 'electrical work per cycle in joules', digits: 0 },
      TC: { value: 268, min: 250, max: 280, step: 2, color: 'a', label: 'inside temperature in kelvin', digits: 0 },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('COP')}${op('=')}${h.frac(h.n('QC'), h.n('W'))}${op('=')}${h.r(p.QC / p.W, 1)}`,
    aside: (p, h) => { const lim = p.TC / (300 - p.TC); return `<div>Into the kitchen: ${h.c('c', fmt(p.QC + p.W), 'QH')} J (that’s why the back of a fridge is warm). Carnot limit for ${h.n('TC')} K inside and 300 K outside: ${h.c('ink', fmt(lim, 1), 'lim')}. ${p.QC / p.W > lim ? '<b>Impossible.</b>' : ''}</div>`; },
    readout: (p, h) => h.ro('inside', fmt(p.TC - 273, 0), '°C', 'a') + h.ro('kitchen', '27', '°C', 'c'),
    steps: [{ at: 0, hl: [], say: 'A fridge: cold inside, kitchen outside.' }],
    simSay: (p) => `Each cycle the compressor uses ${fmt(p.W)} J of electricity to move ${fmt(p.QC)} J of heat out of the cold box. Both end up in the kitchen.`,
    simSfx: () => [sfx.whoosh(0, 4), sfx.whoosh(4, 8)],
    draw(p, h, { k, t }) {
      const wq = 50 / 600;
      let s = S.rect(80, 300, 280, 90, 'a-soft', 'a', { rx: 10, 'stroke-width': 2 }) + label(220, 340, `inside the fridge`, { fill: 'a', weight: 600 }) + label(220, 362, `${fmt(p.TC - 273, 0)} °C`, { fill: 'a', size: 12 });
      s += S.rect(80, 30, 280, 60, 'c-soft', 'c', { rx: 10, 'stroke-width': 2 }) + label(220, 65, 'kitchen, 27 °C', { fill: 'c', weight: 600 });
      s += band([[220, 300], [220, 200]], p.QC * wq, 'a', t) + label(240, 260, `Q_C = ${fmt(p.QC)} J`, { fill: 'a', anchor: 'start', size: 12 });
      s += band([[600, 190], [250, 190]], p.W * wq, 'b', t) + label(610, 194, `W = ${fmt(p.W)} J`, { fill: 'b', anchor: 'start', weight: 600 }) + label(610, 214, 'electricity', { fill: 'muted', anchor: 'start', size: 11 });
      s += band([[220, 180], [220, 90]], (p.QC + p.W) * wq, 'c', t) + label(240, 130, `Q_H = ${fmt(p.QC + p.W)} J`, { fill: 'c', anchor: 'start', size: 12 });
      s += S.circle(220, 190, 26, 'card', 'ink', { 'stroke-width': 3 }) + label(220, 195, 'pump', { size: 11 });
      return s;
    },
    theory: [
      ['Heat pumps', `Heat won't flow from cold to hot on its own (the second law). A fridge forces it to, by doing work ${M('W')}: it takes ${M('Q_C')} from the inside and releases ${M('Q_H = Q_C + W')} into the room through the coils at the back. Its performance is measured by the <em>coefficient of performance</em>, ${M('COP = Q_C/W')}, usually 2 to 4.`],
      ['Limits', `The best possible COP, from Carnot, is ${M('T_C/(T_H − T_C)')}: the smaller the temperature gap, the easier the pumping. An open fridge door can't cool a kitchen: all the heat pumped out, plus the work, comes straight back in.`],
      ['Heating with a heat pump', `Run the same machine to warm a house and it delivers ${M('Q_H')}, more heat than the electricity it uses, because it also moves heat in from outside. That makes heat pumps three or four times more efficient than electric heaters.`],
    ],
    practice: (p, h) => [`With a COP of ${h.r(p.QC / p.W, 1)}, every joule of electricity removes ${h.r(p.QC / p.W, 1)} J of heat from the food.`],
  };

  // Carnot cycle for an ideal monatomic gas (γ = 5/3), with nR = 1 in arbitrary units.
  const GAM = 5 / 3;
  const carnot = ({ TH, TC }) => {
    const V1 = 1, V2 = 2, r = Math.pow(TH / TC, 1 / (GAM - 1)), V3 = V2 * r, V4 = V1 * r;
    const P = (V, T) => T / V;
    // Each stroke takes 2 s: isothermal expansion, adiabatic expansion, isothermal compression, adiabatic compression.
    const at = (t) => {
      const s = Math.min(3, Math.floor((t % 8) / 2)), u = ((t % 8) - 2 * s) / 2;
      if (s === 0) { const V = lerp(V1, V2, u); return { V, T: TH, s }; }
      if (s === 1) { const V = lerp(V2, V3, u); return { V, T: TH * Math.pow(V2 / V, GAM - 1), s }; }
      if (s === 2) { const V = lerp(V3, V4, u); return { V, T: TC, s }; }
      const V = lerp(V4, V1, u); return { V, T: TC * Math.pow(V4 / V, GAM - 1), s };
    };
    return { V1, V2, V3, V4, P, at };
  };
  const engineCarnot = {
    id: 'carnot',
    label: 'Carnot cycle',
    lede: 'The ideal engine cycle: expand while touching the hot source, expand insulated, compress while touching the cold sink, compress insulated. The loop’s area is the work.',
    build: 1,
    compact: true,
    params: {
      TH: { value: 600, min: 400, max: 900, step: 50, color: 'c', label: 'hot source in kelvin', digits: 0 },
      TC: { value: 300, min: 200, max: 350, step: 10, color: 'a', label: 'cold sink in kelvin', digits: 0 },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('η')}${op('=')}1${op('−')}${h.frac(h.n('TC'), h.n('TH'))}${op('=')}${h.r((1 - p.TC / p.TH) * 100, 0)}${h.unit('%')}`,
    aside: () => '<div>Temperatures must be absolute, in kelvin: K = °C + 273.</div>',
    readout: (p, h, { t }) => { const c = carnot(p), st = c.at(Math.min(t, 7.999)); return h.ro('stroke', `${st.s + 1} of 4`) + h.ro('gas', fmt(st.T, 0), 'K', st.T > (p.TH + p.TC) / 2 ? 'c' : 'a'); },
    steps: [{ at: 0, hl: [], say: 'A cylinder of gas, ready to run one Carnot cycle.' }],
    simSay: (p, h, { t }) => ['1. Touching the hot source, the gas expands slowly at constant temperature, taking in heat and doing work.', '2. Insulated, it keeps expanding. With no heat coming in, it pays for the work with internal energy and cools to the cold temperature.', '3. Touching the cold sink, it’s squeezed at constant temperature, giving out heat.', '4. Insulated, it’s squeezed further and warms back up to the hot temperature. Cycle complete.'][carnot(p).at(Math.min(t, 7.999)).s],
    simSfx: () => [sfx.glide(0, 2, pitch(9), pitch(7)), sfx.glide(2, 4, pitch(7), pitch(0)), sfx.glide(4, 6, pitch(0), pitch(2)), sfx.glide(6, 8, pitch(2), pitch(9))],
    draw(p, h, { k, t }) {
      const c = carnot(p), Vmax = c.V3 * 1.08, Pmax = c.P(c.V1, p.TH) * 1.1;
      const Gr = graph({ x0: 380, x1: 760, y0: 370, y1: 90, tMax: Vmax, vMax: Pmax, tLabel: 'volume', vLabel: 'pressure', ticks: false });
      const pt = (V, T) => [Gr.X(V), Gr.Y(c.P(V, T))];
      const leg = (a, b, Tf) => Array.from({ length: 31 }, (_, i) => { const V = lerp(a, b, i / 30); return pt(V, Tf(V)); });
      const legs = [leg(c.V1, c.V2, () => p.TH), leg(c.V2, c.V3, (V) => p.TH * Math.pow(c.V2 / V, GAM - 1)), leg(c.V3, c.V4, () => p.TC), leg(c.V4, c.V1, (V) => p.TC * Math.pow(c.V4 / V, GAM - 1))];
      let s = S.fade(seg(k, 0, 0.6), Gr.s + S.poly(legs.flat(), 'b-soft', null) + label((Gr.X(c.V1) + Gr.X(c.V3)) / 2, Gr.Y(c.P(c.V2, p.TH)) + 40, 'area = work', { fill: 'b', size: 12, weight: 600 }));
      const cols = ['c', 'muted', 'a', 'muted'];
      legs.forEach((L, i) => { s += S.fade(seg(k, 0, 0.6), S.path(MV.phys.pts(L), cols[i], 2.5)); });
      const st = c.at(Math.min(t, 7.999));
      s += S.circle(...pt(st.V, st.T), 7, 'ink');
      const cx = 170, by = 360, w = 150, top = by - 30 - (st.V / Vmax) * 230, hot = clamp01((st.T - p.TC) / (p.TH - p.TC));
      s += piston(cx, by, w, 290, top, t, 0.15 + 0.7 * hot, 60 + 80 * hot, 9);
      if (st.s === 0) s += S.rect(cx - w / 2 - 10, by + 4, w + 20, 22, 'c', null, { rx: 4 }) + label(cx, by + 19, 'hot source', { fill: 'paper', size: 11, weight: 600 });
      else if (st.s === 2) s += S.rect(cx - w / 2 - 10, by + 4, w + 20, 22, 'a', null, { rx: 4 }) + label(cx, by + 19, 'cold sink', { fill: 'paper', size: 11, weight: 600 });
      else s += S.rect(cx - w / 2 - 10, by + 4, w + 20, 22, 'ink-soft', 'ink', { rx: 4 }) + label(cx, by + 19, 'insulated', { size: 11 });
      return s;
    },
    theory: [
      ['Four strokes', `The Carnot cycle has two <em>isothermal</em> strokes, where the gas touches a reservoir and exchanges heat at constant temperature, and two <em>adiabatic</em> strokes, where it's insulated and its temperature changes as it does work or has work done on it. Every step is slow and reversible: nothing is wasted to friction or to heat flowing across a temperature gap.`],
      ['Why it’s the limit', `Because every step could be run backwards, a Carnot engine reversed is a perfect fridge. If any engine beat it, you could pair the two and pump heat from cold to hot for free, breaking the second law. So ${M('η = 1 − T_C/T_H')} is the ceiling for every engine working between those temperatures.`],
    ],
    practice: (p, h) => [`Between boiling water (373 K) and ice (273 K), no engine could exceed ${h.r((1 - 273 / 373) * 100, 0)} % efficiency.`],
  };

  MV.register({ realm: 'phys', id: 't-engines', group: GROUP, symbol: 'η', title: 'Heat engines and Carnot', modes: [engineConcept, engineFridge, engineCarnot] });
})();
