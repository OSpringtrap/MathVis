// Electricity: Ohm's laws, circuits, measuring instruments, power and energy, and safety devices.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, clamp01, M, sfx, pitch, note } = MV;
  const { caption, label, path, graph, wire, charges, resistor, battery, meter } = MV.phys;
  const GROUP = 'Electricity';
  const op = (s) => `<span class="op">${s}</span>`;
  // Drift speed of the drawn charges, in pixels per second per ampere (capped so they stay readable).
  const flow = (i, t, per = 18) => Math.min(160, i * per) * t;

  // A simple loop: battery on the left side, the rest of the circuit clockwise from its + terminal.
  const LOOP = { x0: 110, x1: 470, y0: 100, y1: 330 };
  const loopWire = ({ x0, x1, y0, y1 } = LOOP) => wire([[x0, (y0 + y1) / 2], [x0, y0], [x1, y0], [x1, y1], [x0, y1]], true);

  // =====================================================================
  // Ohm's laws
  // =====================================================================

  const ohmFirst = {
    id: 'first',
    label: 'First law: V = Ri',
    lede: 'A battery pushes charge round a circuit; a resistor holds it back. Double the push and twice as much charge flows each second.',
    build: 3.2,
    params: {
      V: { value: 6, min: 1, max: 12, step: 0.5, color: 'b', label: 'battery voltage in volts' },
      R: { value: 4, min: 1, max: 20, step: 0.5, color: 'c', label: 'resistance in ohms' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('i')}${op('=')}${h.frac(h.n('V'), h.n('R'))}${op('=')}${h.r(p.V / p.R)}${h.unit('A')}`,
    aside: (p, h) => `<div>Written the usual way: ${h.v('V')} = ${h.v('R')} × ${h.v('i')}, ${h.val('V')} = ${h.val('R')} × ${h.c('a', fmt(p.V / p.R), 'i')}.</div>`,
    readout: (p, h) => h.ro('current', fmt(p.V / p.R), 'A', 'a'),
    steps: [
      { at: 0, hl: ['V'], say: ({ V }) => `A ${fmt(V)} V battery: the voltage is the push it gives each coulomb of charge.` },
      { at: 0.3, hl: ['R'], say: ({ R }) => `A ${fmt(R)} Ω resistor: the more resistance, the harder it is for charge to get through.` },
      { at: 0.6, hl: ['res', 'i'], say: (p) => `The current, the charge flowing past each second, is push ÷ resistance: ${fmt(p.V)} ÷ ${fmt(p.R)} = ${fmt(p.V / p.R)} A.` },
      { at: 0.82, hl: ['V', 'R'], say: 'On the graph: for a fixed resistor, current rises in a straight line with voltage. The steeper the line, the smaller the resistance.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(4)), sfx.glide(0.3, 0.5, pitch(p.R / 2), pitch(0)), sfx.glide(0.6, 0.78, pitch(0), pitch(2 * Math.min(10, p.V / p.R))), sfx.chime(0.85, note(7))],
    simSay: (p) => `Each dot is a packet of charge. ${fmt(p.V / p.R)} coulombs pass any point every second, through the wires and the resistor alike: the current is the same all the way round.`,
    simSfx: (p) => Array.from({ length: Math.min(40, Math.round(6 * Math.min(6, p.V / p.R))) }, (_, i) => sfx.tick((i * 6) / Math.min(40, Math.round(6 * Math.min(6, p.V / p.R))), note(5))),
    draw(p, h, { k, t }) {
      const i = p.V / p.R, W = loopWire(), u1 = seg(k, 0.3, 0.5), u2 = seg(k, 0.6, 0.78);
      let s = W.svg('ink', 2.5);
      s += S.fade(u2, charges(W, flow(i, t) + 8, 'a'));
      s += battery(LOOP.x0, 215, `${fmt(p.V)} V`, 'b');
      s += S.fade(u1 || 0.25, resistor(230, LOOP.y0, 350, LOOP.y0, 'c', `${fmt(p.R)} Ω`, clamp01((i * i * p.R) / 40)));
      s += S.fade(u2, S.arrow(LOOP.x1 + 16, 170, LOOP.x1 + 16, 250, 'a', 3) + label(LOOP.x1 + 24, 215, `i = ${fmt(i)} A`, { fill: 'a', anchor: 'start', weight: 600 }));
      // Current against voltage for this resistor.
      const Gr = graph({ x0: 560, x1: 760, y0: 340, y1: 110, tMax: 12, vMax: 12, tLabel: 'voltage (V)', vLabel: 'current (A)' });
      s += S.fade(seg(k, 0.82, 0.96), Gr.s + S.line(Gr.X(0), Gr.Y(0), Gr.X(Math.min(12, 12 * p.R)), Gr.Y(Math.min(12, 12 / p.R)), 'c', 2.5) + S.circle(Gr.X(p.V), Gr.Y(i), 6, 'a'));
      return s;
    },
    theory: [
      ['Current, voltage, resistance', `<em>Current</em> ${M('i')} is the rate charge flows: ${M('i = Δq/Δt')}, in amperes (coulombs per second). <em>Voltage</em> ${M('V')} is the energy given to each coulomb by the source, in volts (joules per coulomb). <em>Resistance</em> ${M('R')} measures how hard it is to push current through something, in ohms.`],
      ['Ohm’s first law', `For many conductors at a steady temperature, current is proportional to voltage: ${M('V = Ri')}. Such conductors are called <em>ohmic</em>; their ${M('V')}–${M('i')} graph is a straight line through the origin. A filament lamp isn't ohmic: as it heats up, its resistance rises.`],
      ['A water analogy', `Voltage is like water pressure, current like the flow rate through a pipe, and resistance like a narrow section of pipe. More pressure, more flow; a narrower pipe, less flow.`],
      ['Which way does it flow?', `By convention current flows from + to − through the outside circuit. In metal wires the moving charges are actually electrons, drifting the other way, surprisingly slowly (millimetres per second). The signal travels fast; the electrons don't.`],
    ],
    practice: (p, h) => [`A phone charger's 5 V across a 2 Ω load would drive ${h.r(5 / 2)} A.`, `Wet skin has a resistance of about 1000 Ω: 220 V across it would drive ${h.r(220 / 1000, 2)} A, easily enough to stop a heart. Dry skin offers far more protection.`],
  };

  const RHOS = [[1.7, 'copper'], [2.8, 'aluminium'], [10, 'iron'], [110, 'nichrome']];
  const matName = (rho) => RHOS.reduce((b, m) => (Math.abs(m[0] - rho) < Math.abs(b[0] - rho) ? m : b))[1];
  const ohmSecond = {
    id: 'second',
    label: 'Second law: R = ρL/A',
    lede: 'A wire’s resistance depends on its shape and its material. Longer: more resistance. Thicker: less. And some materials resist far more than others.',
    build: 3.2,
    compact: true,
    params: {
      L: { value: 10, min: 1, max: 50, step: 1, color: 'b', label: 'length in metres', digits: 0 },
      A: { value: 1, min: 0.5, max: 4, step: 0.5, color: 'a', label: 'cross-section in mm²' },
      rho: { value: 1.7, min: 1.7, max: 110, step: 0.1, color: 'c', label: 'resistivity in 10⁻⁸ Ω·m (copper 1.7, aluminium 2.8, nichrome 110)' },
    },
    formula: (p, h) => `${h.v('R')}${op('=')}${h.frac(`${h.n('rho')}×10<sup>−8</sup>${op('×')}${h.n('L')}`, `${h.n('A')}×10<sup>−6</sup>`)}${op('=')}${h.r((p.rho * 1e-8 * p.L) / (p.A * 1e-6), 3)}${h.unit('Ω')}`,
    aside: (p, h) => `<div>Closest material: ${h.c('c', matName(p.rho), 'mat')}. Area in m²: 1 mm² = 10<sup>−6</sup> m².</div>`,
    steps: [
      { at: 0, hl: ['L'], say: 'A wire. Charges flowing along it keep bumping into the vibrating atoms of the metal.' },
      { at: 0.28, hl: ['L'], say: 'Twice as long: twice as many bumps on the way. Resistance is proportional to length.' },
      { at: 0.54, hl: ['A'], say: 'Twice as thick: twice as many lanes side by side for the charge. Resistance is inversely proportional to the area.' },
      { at: 0.78, hl: ['rho', 'mat'], say: 'The material sets the resistivity ρ: copper conducts superbly; nichrome, used in heaters, resists 65 times more.' },
    ],
    sfx: () => [sfx.pop(0.02, note(4)), sfx.glide(0.28, 0.48, pitch(0), pitch(-5)), sfx.glide(0.54, 0.72, pitch(-5), pitch(2)), sfx.chime(0.8, note(7))],
    draw(p, h, { k }) {
      const len = 120 + p.L * 11, th = 10 + Math.sqrt(p.A) * 22, x0 = 400 - len / 2, y = 200;
      const u1 = seg(k, 0.28, 0.48), u2 = seg(k, 0.54, 0.72), u3 = seg(k, 0.78, 0.95);
      const L = lerp(240, len, u1 || (k > 0.5 ? 1 : 0)), T = lerp(22, th, u2 || (k > 0.75 ? 1 : 0)), X0 = 400 - L / 2;
      let s = S.rect(X0, y - T / 2, L, T, 'b-soft', 'b', { rx: T / 2, 'stroke-width': 2 }) + S.rect(X0, y - T / 2, L, T, 'c', null, { rx: T / 2, opacity: (0.05 + 0.4 * u3 * Math.log10(p.rho / 1.7 + 1) / 1.82).toFixed(3) });
      // Atoms the charges bump into.
      const n = Math.round(L / 22), rows = Math.max(1, Math.round(T / 16));
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) s += S.circle(X0 + 11 + i * 22, y - T / 2 + ((j + 0.5) * T) / rows, 3, 'muted', null, { opacity: 0.6 });
      s += S.fade(u1, S.line(X0, y + T / 2 + 20, X0 + L, y + T / 2 + 20, 'b', 2) + label(400, y + T / 2 + 40, `L = ${fmt(p.L)} m`, { fill: 'b', weight: 600 }));
      s += S.fade(u2, S.el('ellipse', { cx: X0 + L + 30, cy: y, rx: T / 5, ry: T / 2, fill: 'a-soft', stroke: 'a', 'stroke-width': 2 }) + label(X0 + L + 50, y + 4, `A = ${fmt(p.A)} mm²`, { fill: 'a', anchor: 'start', weight: 600 }));
      s += S.fade(u3, label(400, y - T / 2 - 20, `${matName(p.rho)}: ρ = ${fmt(p.rho)} × 10⁻⁸ Ω·m`, { fill: 'c', weight: 600 }));
      s += S.fade(seg(k, 0, 0.2), caption(60, 360, 'Drawn to show the trend, not to scale.'));
      return s;
    },
    theory: [
      ['Ohm’s second law', `The resistance of a uniform wire is ${M('R = ρL/A')}: proportional to its length ${M('L')}, inversely proportional to its cross-sectional area ${M('A')}, and proportional to the <em>resistivity</em> ${M('ρ')} of the material. Resistivity is a property of the material alone, in ohm-metres.`],
      ['Conductors and insulators', `Silver (1.6 × 10⁻⁸ Ω·m) and copper (1.7 × 10⁻⁸) are the best common conductors; copper is cheaper, so it's used for wiring. Nichrome (about 110 × 10⁻⁸) is used in heating elements precisely because it resists. Glass and rubber have resistivities around 10¹⁰ to 10¹⁶: insulators.`],
      ['Why thick cables', `Appliances that draw large currents, like electric showers and ovens, need thicker cables: a bigger area means less resistance, so less heat wasted in the cable itself.`],
    ],
    practice: (p, h) => [`A 100 m extension lead of 1.5 mm² copper (two conductors, so 200 m of wire) has ${h.r((1.7e-8 * 200) / 1.5e-6, 2)} Ω of resistance.`],
  };

  MV.register({ realm: 'phys', id: 'e-ohm', group: GROUP, symbol: 'Ω', title: 'Ohm’s laws', modesLabel: null, modes: [ohmFirst, ohmSecond] });

  // =====================================================================
  // Circuits and resistor combinations
  // =====================================================================

  const pLoad = (i, R) => clamp01((i * i * R) / 40);
  // Voltage bar beside a resistor.
  const vbar = (x, y, V, Vmax, col, text) => S.rect(x - 8, y - (V / Vmax) * 70, 16, (V / Vmax) * 70, `${col}-soft`, col, { 'stroke-width': 1.2 }) + label(x, y + 16, text, { fill: col, size: 11, weight: 600 });

  const series = {
    id: 'series',
    label: 'Series',
    lede: 'Resistors one after another: the same current flows through each, and the battery’s voltage is shared between them.',
    build: 3.4,
    compact: true,
    params: {
      V: { value: 12, min: 1, max: 24, step: 1, color: 'b', label: 'battery voltage', digits: 0 },
      R1: { value: 4, min: 1, max: 20, step: 1, color: 'a', label: 'first resistor in ohms', digits: 0 },
      R2: { value: 2, min: 1, max: 20, step: 1, color: 'c', label: 'second resistor in ohms', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('R')}<sub>eq</sub>${op('=')}${h.n('R1')}${op('+')}${h.n('R2')}${op('=')}${h.r(p.R1 + p.R2, 0)}${h.unit('Ω')}`,
    aside: (p, h) => { const i = p.V / (p.R1 + p.R2); return `<div>${h.v('i')} = ${h.n('V')} ÷ ${fmt(p.R1 + p.R2)} = ${h.c('ink', fmt(i), 'i')} A through both. Voltages: ${h.c('a', fmt(i * p.R1), 'V1')} V + ${h.c('c', fmt(i * p.R2), 'V2')} V = ${fmt(p.V)} V.</div>`; },
    readout: (p, h) => { const i = p.V / (p.R1 + p.R2); return h.ro('current', fmt(i), 'A') + h.ro('V₁', fmt(i * p.R1), 'V', 'a') + h.ro('V₂', fmt(i * p.R2), 'V', 'c'); },
    steps: [
      { at: 0, hl: ['V'], say: 'A battery and two resistors in a single loop.' },
      { at: 0.25, hl: ['i'], say: 'There’s only one path, so the same current flows through both. Nothing is used up: every coulomb that enters one resistor leaves it.' },
      { at: 0.5, hl: ['V1', 'V2'], say: 'Each resistor uses up part of the voltage, in proportion to its resistance. The parts add up to the battery’s voltage.' },
      { at: 0.75, hl: ['R1', 'R2', 'res'], say: 'Together they act like one resistor equal to their sum: the charge has to struggle through both, one after the other.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.tick(0.26, note(5)), sfx.chord(0.5, [note(4), note(6)]), sfx.chime(0.78, note(7))],
    simSay: () => 'The dots move at the same speed everywhere: one current. Take one resistor out and the whole circuit stops, like old Christmas lights.',
    simSfx: (p) => Array.from({ length: 12 }, (_, i) => sfx.tick(i * 0.5, note(Math.min(9, Math.round(p.V / (p.R1 + p.R2)))))),
    draw(p, h, { k, t }) {
      const i = p.V / (p.R1 + p.R2), W = loopWire(), u1 = seg(k, 0.25, 0.45), u2 = seg(k, 0.5, 0.7), u3 = seg(k, 0.75, 0.95);
      let s = W.svg('ink', 2.5) + battery(LOOP.x0, 215, `${fmt(p.V)} V`, 'b');
      s += S.fade(u1, charges(W, flow(i, t), 'ink'));
      s += resistor(170, LOOP.y0, 280, LOOP.y0, 'a', `R₁ ${fmt(p.R1)} Ω`, pLoad(i, p.R1)) + resistor(LOOP.x1, 160, LOOP.x1, 270, 'c', `R₂ ${fmt(p.R2)} Ω`, pLoad(i, p.R2));
      s += S.fade(u2, vbar(240, 290, i * p.R1, Math.max(p.V, 1), 'a', `V₁ ${fmt(i * p.R1)} V`) + vbar(370, 290, i * p.R2, Math.max(p.V, 1), 'c', `V₂ ${fmt(i * p.R2)} V`));
      // The equivalent circuit.
      const E = { x0: 560, x1: 740, y0: 140, y1: 300 }, W2 = loopWire(E);
      s += S.fade(u3, W2.svg('ink', 2) + battery(E.x0, 220, '', 'b') + resistor(600, E.y0, 700, E.y0, 'ink', `${fmt(p.R1 + p.R2)} Ω`) + charges(W2, flow(i, t), 'ink', 26, 2.6) + label(650, E.y1 + 30, 'acts the same as', { fill: 'muted', size: 12 }));
      return s;
    },
    theory: [
      ['Series rules', `In series, the current is the same everywhere: ${M('i = i_1 = i_2')}. The voltages add: ${M('V = V_1 + V_2')}. Since each ${M('V_n = R_n i')}, the equivalent resistance is the sum: ${M('R_{eq} = R_1 + R_2 + …')}. Adding a resistor in series always increases the total.`],
      ['Voltage dividers', `The voltage splits in proportion to the resistances: ${M('V_1 = V R_1/(R_1 + R_2)')}. That's how a dimmer or a volume knob can give any fraction of the supply voltage.`],
      ['A weakness', `If one part of a series circuit breaks, the current stops everywhere. That's why house lights and sockets aren't wired in series.`],
    ],
    practice: (p, h) => [`Add a third ${h.val('R1')} Ω resistor and the current falls to ${h.r(p.V / (2 * p.R1 + p.R2))} A.`],
  };

  // Parallel and mixed layouts: top rail y0, bottom rail y1, branches drawn vertically.
  const P = { xb: 110, y0: 100, y1: 330, b1: 300, b2: 450 };
  const branchWire = (bx, xs = P.xb, y0 = P.y0, y1 = P.y1) => wire([[xs, (y0 + y1) / 2], [xs, y0], [bx, y0], [bx, y1], [xs, y1]], true);

  const parallel = {
    id: 'parallel',
    label: 'Parallel',
    lede: 'Resistors side by side: each gets the full battery voltage, and the current splits between the paths. More paths, less total resistance.',
    build: 3.4,
    compact: true,
    params: {
      V: { value: 12, min: 1, max: 24, step: 1, color: 'b', label: 'battery voltage', digits: 0 },
      R1: { value: 4, min: 1, max: 20, step: 1, color: 'a', label: 'first resistor in ohms', digits: 0 },
      R2: { value: 6, min: 1, max: 20, step: 1, color: 'c', label: 'second resistor in ohms', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.frac('1', `${h.v('R')}<sub>eq</sub>`)}${op('=')}${h.frac('1', h.n('R1'))}${op('+')}${h.frac('1', h.n('R2'))}${op('⇒')}${h.v('R')}<sub>eq</sub>${op('=')}${h.r((p.R1 * p.R2) / (p.R1 + p.R2))}${h.unit('Ω')}`,
    aside: (p, h) => `<div>Each branch gets ${h.n('V')} V: ${h.c('a', fmt(p.V / p.R1), 'i1')} A + ${h.c('c', fmt(p.V / p.R2), 'i2')} A = ${h.c('ink', fmt(p.V / p.R1 + p.V / p.R2), 'i')} A from the battery.</div>`,
    readout: (p, h) => h.ro('i₁', fmt(p.V / p.R1), 'A', 'a') + h.ro('i₂', fmt(p.V / p.R2), 'A', 'c') + h.ro('total', fmt(p.V / p.R1 + p.V / p.R2), 'A'),
    steps: [
      { at: 0, hl: ['V'], say: 'A battery with two resistors connected side by side, each across the battery.' },
      { at: 0.25, hl: ['V'], say: 'Each branch is connected straight to the battery’s terminals, so each gets the full voltage.' },
      { at: 0.5, hl: ['i1', 'i2', 'i'], say: 'Each branch draws its own current, V/R. At the junctions the current splits and rejoins: total in = total out.' },
      { at: 0.75, hl: ['R1', 'R2', 'res'], say: 'More current for the same voltage means less resistance overall: the equivalent is smaller than either resistor alone.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.tick(0.26, note(5)), sfx.chord(0.5, [note(4), note(7)]), sfx.chime(0.78, note(9))],
    simSay: () => 'The smaller resistor carries more current (faster dots). The shared wires near the battery carry both currents. Unplug one branch and the other keeps working: that’s how your house is wired.',
    simSfx: () => Array.from({ length: 12 }, (_, i) => sfx.tick(i * 0.5, note(6))),
    draw(p, h, { k, t }) {
      const i1 = p.V / p.R1, i2 = p.V / p.R2, W1 = branchWire(P.b1), W2 = branchWire(P.b2), u1 = seg(k, 0.25, 0.45), u2 = seg(k, 0.5, 0.7), u3 = seg(k, 0.75, 0.95);
      let s = W2.svg('ink', 2.5) + S.line(P.b1, P.y0, P.b1, P.y1, 'ink', 2.5) + battery(P.xb, 215, `${fmt(p.V)} V`, 'b');
      s += S.circle(P.b1, P.y0, 4, 'ink') + S.circle(P.b1, P.y1, 4, 'ink');
      s += resistor(P.b1, 160, P.b1, 270, 'a', `R₁ ${fmt(p.R1)} Ω`, pLoad(i1, p.R1)) + resistor(P.b2, 160, P.b2, 270, 'c', `R₂ ${fmt(p.R2)} Ω`, pLoad(i2, p.R2));
      s += S.fade(u2, charges(W1, flow(i1, t, 10), 'a', 30) + charges(W2, flow(i2, t, 10) + 13, 'c', 30));
      s += S.fade(u1, vbar(P.b1 - 80, 250, p.V, p.V, 'b', `${fmt(p.V)} V`) + vbar(P.b2 + 60, 250, p.V, p.V, 'b', `${fmt(p.V)} V`));
      const E = { x0: 570, x1: 740, y0: 140, y1: 300 }, WE = loopWire(E), iT = i1 + i2, Req = (p.R1 * p.R2) / (p.R1 + p.R2);
      s += S.fade(u3, WE.svg('ink', 2) + battery(E.x0, 220, '', 'b') + resistor(600, E.y0, 710, E.y0, 'ink', `${fmt(Req)} Ω`) + charges(WE, flow(iT, t, 10), 'ink', 26, 2.6) + label(655, E.y1 + 30, 'acts the same as', { fill: 'muted', size: 12 }));
      return s;
    },
    theory: [
      ['Parallel rules', `In parallel, every branch has the same voltage: ${M('V = V_1 = V_2')}. The currents add: ${M('i = i_1 + i_2')} (charge is conserved at each junction, Kirchhoff's current law). So ${M('1/R_{eq} = 1/R_1 + 1/R_2 + …')}, and for two resistors ${M('R_{eq} = R_1 R_2/(R_1 + R_2)')}. The result is always smaller than the smallest branch.`],
      ['Why homes use parallel', `Every appliance gets the full mains voltage and can be switched on or off independently. But every appliance you add draws more current from the supply, which is why too many on one circuit can overload it.`],
      ['Identical resistors', `${M('n')} identical resistors ${M('R')} in parallel give ${M('R/n')}: two 10 Ω resistors side by side act like 5 Ω.`],
    ],
    practice: (p, h) => [`A third branch of ${h.val('R1')} Ω would make the total current ${h.r(2 * p.V / p.R1 + p.V / p.R2)} A.`],
  };

  const mixed = {
    id: 'mixed',
    label: 'Mixed',
    lede: 'One resistor in series with a parallel pair. Simplify step by step: combine the pair first, then add the series one.',
    build: 3.6,
    compact: true,
    params: {
      V: { value: 12, min: 1, max: 24, step: 1, color: 'b', label: 'battery voltage', digits: 0 },
      R1: { value: 2, min: 1, max: 20, step: 1, color: 'a', label: 'series resistor in ohms', digits: 0 },
      R2: { value: 6, min: 1, max: 20, step: 1, color: 'c', label: 'first parallel resistor in ohms', digits: 0 },
      R3: { value: 3, min: 1, max: 20, step: 1, color: 'c', label: 'second parallel resistor in ohms', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => { const R23 = (p.R2 * p.R3) / (p.R2 + p.R3); return `${h.v('R')}<sub>eq</sub>${op('=')}${h.n('R1')}${op('+')}${h.frac(`${h.n('R2')}${op('×')}${h.n('R3')}`, `${h.val('R2')}${op('+')}${h.val('R3')}`)}${op('=')}${h.r(p.R1 + R23)}${h.unit('Ω')}`; },
    aside: (p, h) => { const R23 = (p.R2 * p.R3) / (p.R2 + p.R3), i = p.V / (p.R1 + R23), Vp = i * R23; return `<div>${h.v('i')} = ${h.c('ink', fmt(i), 'i')} A. ${h.v('R')}<sub>1</sub> takes ${h.c('a', fmt(i * p.R1), 'V1')} V; the pair shares ${h.c('c', fmt(Vp), 'Vp')} V: ${fmt(Vp / p.R2)} A and ${fmt(Vp / p.R3)} A.</div>`; },
    readout: (p, h) => { const R23 = (p.R2 * p.R3) / (p.R2 + p.R3), i = p.V / (p.R1 + R23); return h.ro('total', fmt(i), 'A') + h.ro('i₂', fmt((i * R23) / p.R2), 'A', 'c') + h.ro('i₃', fmt((i * R23) / p.R3), 'A', 'c'); },
    steps: [
      { at: 0, hl: ['R1'], say: 'R₁ is in series with the battery; R₂ and R₃ are in parallel with each other.' },
      { at: 0.3, hl: ['R2', 'R3'], say: 'Step 1: replace the parallel pair with its equivalent, product over sum.' },
      { at: 0.55, hl: ['R1', 'res'], say: 'Step 2: that equivalent is in series with R₁, so add them.' },
      { at: 0.78, hl: ['i', 'V1', 'Vp'], say: 'Now work backwards: total current from Ohm’s law, the voltage across each part, and finally how the current splits in the pair.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.chord(0.3, [note(4), note(6)]), sfx.glide(0.55, 0.72, pitch(2), pitch(9)), sfx.chime(0.8, note(7))],
    simSay: () => 'All the current goes through R₁, then splits between R₂ and R₃ and rejoins.',
    simSfx: () => Array.from({ length: 12 }, (_, i) => sfx.tick(i * 0.5, note(5))),
    draw(p, h, { k, t }) {
      const R23 = (p.R2 * p.R3) / (p.R2 + p.R3), i = p.V / (p.R1 + R23), Vp = i * R23, i2 = Vp / p.R2, i3 = Vp / p.R3;
      const W2 = branchWire(P.b1 + 40), W3 = branchWire(P.b2), u1 = seg(k, 0.3, 0.5), u2 = seg(k, 0.55, 0.72), u3 = seg(k, 0.78, 0.95);
      let s = W3.svg('ink', 2.5) + S.line(P.b1 + 40, P.y0, P.b1 + 40, P.y1, 'ink', 2.5) + battery(P.xb, 215, `${fmt(p.V)} V`, 'b');
      s += resistor(150, P.y0, 260, P.y0, 'a', `R₁ ${fmt(p.R1)} Ω`, pLoad(i, p.R1));
      s += resistor(P.b1 + 40, 160, P.b1 + 40, 270, 'c', `R₂ ${fmt(p.R2)} Ω`, pLoad(i2, p.R2)) + resistor(P.b2, 160, P.b2, 270, 'c', `R₃ ${fmt(p.R3)} Ω`, pLoad(i3, p.R3));
      s += S.fade(u3, charges(W2, flow(i2, t, 10), 'c', 30) + charges(W3, flow(i3, t, 10) + 13, 'c', 30));
      s += S.fade(u1, S.rect(P.b1 + 10, 135, P.b2 - P.b1 + 30, 160, null, 'c', { rx: 10, 'stroke-width': 1.5, ...dashed('5 4') }) + label((P.b1 + 40 + P.b2) / 2, 128, `pair: ${fmt(R23)} Ω`, { fill: 'c', size: 12, weight: 600 }));
      s += S.fade(u2, label(580, 150, `${fmt(p.R1)} + ${fmt(R23)} = ${fmt(p.R1 + R23)} Ω`, { size: 15, weight: 600 }));
      s += S.fade(u3, label(580, 190, `i = ${fmt(p.V)} ÷ ${fmt(p.R1 + R23)} = ${fmt(i)} A`, { size: 14 }) + label(580, 216, `pair voltage = ${fmt(Vp)} V`, { size: 14, fill: 'c' }));
      return s;
    },
    theory: [
      ['Simplify in steps', `Mixed circuits are solved by replacing groups with their equivalents: parallel groups with ${M('R_1 R_2/(R_1 + R_2)')}, series groups with sums, repeatedly, until one resistor remains. Then ${M('i = V/R_{eq}')} gives the total current, and you work back out to each part.`],
      ['Two conservation laws', `Behind every rule are two ideas, Kirchhoff's laws: charge is conserved at every junction (currents in = currents out), and energy is conserved round every loop (the voltages used up equal the voltage supplied).`],
    ],
    practice: (p, h) => { const R23 = (p.R2 * p.R3) / (p.R2 + p.R3); return [`The battery delivers ${h.r((p.V * p.V) / (p.R1 + R23), 1)} W to this circuit.`]; },
  };

  MV.register({ realm: 'phys', id: 'e-circuits', group: GROUP, symbol: 'R', title: 'Circuits and combinations', modesLabel: null, modes: [series, parallel, mixed] });

  // =====================================================================
  // Measuring instruments
  // =====================================================================

  const ammeterMode = {
    id: 'ammeter',
    label: 'Ammeter',
    lede: 'An ammeter counts the charge flowing through it, so it must sit in the path: in series. A good one has almost no resistance, so it doesn’t change the current it’s measuring.',
    build: 3,
    compact: true,
    params: {
      V: { value: 6, min: 1, max: 12, step: 0.5, color: 'b', label: 'battery voltage' },
      R: { value: 3, min: 1, max: 10, step: 0.5, color: 'c', label: 'lamp resistance in ohms' },
      rA: { value: 0.1, min: 0, max: 5, step: 0.1, color: 'a', label: 'the ammeter’s own resistance in ohms' },
    },
    sim: { duration: () => 5 },
    formula: (p, h) => `${h.v('i')}${op('=')}${h.frac(h.n('V'), `${h.n('R')}${op('+')}${h.n('rA')}`)}${op('=')}${h.r(p.V / (p.R + p.rA))}${h.unit('A')}`,
    aside: (p, h) => `<div>Without the meter: ${h.c('ink', fmt(p.V / p.R), 'true')} A. The meter changes the current by ${h.c('a', fmt((1 - p.R / (p.R + p.rA)) * 100, 1), 'err')} %.</div>`,
    readout: (p, h) => h.ro('reading', fmt(p.V / (p.R + p.rA)), 'A', 'a'),
    steps: [
      { at: 0, hl: [], say: 'A battery and a lamp. We want to know the current.' },
      { at: 0.3, hl: ['rA'], say: 'Break the circuit and put the ammeter in the gap, so all the current has to pass through it: in series.' },
      { at: 0.65, hl: ['res', 'true', 'err'], say: 'Its own resistance adds to the circuit and lowers the current a little. An ideal ammeter has zero resistance.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.snip(0.3), sfx.chime(0.68, note(7))],
    simSay: () => 'Every charge that goes through the lamp also goes through the meter: that’s why it must be in series.',
    simSfx: () => Array.from({ length: 10 }, (_, i) => sfx.tick(i * 0.5, note(5))),
    draw(p, h, { k, t }) {
      const i = p.V / (p.R + p.rA), W = loopWire(), u1 = seg(k, 0.3, 0.5);
      let s = W.svg('ink', 2.5) + battery(LOOP.x0, 215, `${fmt(p.V)} V`, 'b') + S.fade(u1, charges(W, flow(i, t, 14), 'a'));
      s += resistor(180, LOOP.y0, 290, LOOP.y0, 'c', `lamp ${fmt(p.R)} Ω`, pLoad(i, p.R));
      s += S.fade(u1, S.rect(LOOP.x1 - 30, 190, 60, 50, 'card', null) + meter(LOOP.x1, 215, 'A', i / 12, 'a', `${fmt(i)} A`));
      s += S.fade(u1, label(600, 140, 'in series:', { size: 14, weight: 600 }) + label(600, 166, 'the current goes through it', { size: 13 }));
      return s;
    },
    theory: [
      ['Connecting an ammeter', `An ammeter measures current, so the current must flow through it: open the circuit at the point of interest and connect the meter into the gap, in series. Its resistance should be as small as possible, ideally zero, so it barely changes the current.`],
      ['Never across a battery', `Because an ammeter has almost no resistance, connecting it in parallel (across a component or the battery) makes a near short circuit: a huge current flows, blowing the meter's fuse or damaging it.`],
    ],
    practice: (p, h) => [`An ammeter of ${h.val('rA')} Ω in a ${h.val('R')} Ω circuit reads ${h.r((p.R / (p.R + p.rA)) * 100, 1)} % of the true current.`],
  };

  const voltmeterMode = {
    id: 'voltmeter',
    label: 'Voltmeter',
    lede: 'A voltmeter compares two points, so it’s connected across a component: in parallel. A good one has huge resistance, so almost no current sneaks through it.',
    build: 3,
    compact: true,
    params: {
      V: { value: 12, min: 2, max: 24, step: 1, color: 'b', label: 'battery voltage', digits: 0 },
      RV: { value: 100, min: 1, max: 1000, step: 1, color: 'a', label: 'the voltmeter’s resistance in kilohms', digits: 0 },
    },
    sim: { duration: () => 5 },
    formula: (p, h) => { const R = 10, par = (R * p.RV) / (R + p.RV), Vr = (p.V * par) / (R + par); return `${h.v('V')}<sub>reading</sub>${op('=')}${h.r(Vr)}${h.unit('V')}`; },
    aside: (p, h) => { const R = 10, par = (R * p.RV) / (R + p.RV), Vr = (p.V * par) / (R + par); return `<div>Two 10 kΩ resistors across ${h.n('V')} V: the true voltage across one is ${h.c('ink', fmt(p.V / 2), 'true')} V. A ${h.n('RV')} kΩ meter reads ${fmt((Vr / (p.V / 2)) * 100, 1)} % of that.</div>`; },
    readout: (p, h) => { const R = 10, par = (R * p.RV) / (R + p.RV); return h.ro('reading', fmt((p.V * par) / (R + par)), 'V', 'a'); },
    steps: [
      { at: 0, hl: [], say: 'Two equal 10 kΩ resistors in series, sharing the battery’s voltage.' },
      { at: 0.3, hl: ['RV'], say: 'Connect the voltmeter’s two leads across the second resistor, one on each side: in parallel. Nothing needs to be disconnected.' },
      { at: 0.65, hl: ['res', 'true'], say: 'But the meter is a new path: a little current goes through it, which lowers the voltage it’s measuring. The higher its resistance, the less it disturbs things.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.tick(0.3, note(5)), sfx.chime(0.68, note(7))],
    simSay: (p) => (p.RV >= 100 ? 'A high-resistance meter: almost no current through it, and an accurate reading.' : 'A low-resistance meter draws a lot of current and drags the voltage down: the reading is too low.'),
    simSfx: () => Array.from({ length: 10 }, (_, i) => sfx.tick(i * 0.5, note(4))),
    draw(p, h, { k, t }) {
      const R = 10, par = (R * p.RV) / (R + p.RV), Rt = R + par, i = p.V / Rt, Vr = i * par, iV = Vr / p.RV, W = loopWire(), u1 = seg(k, 0.3, 0.5);
      let s = W.svg('ink', 2.5) + battery(LOOP.x0, 215, `${fmt(p.V)} V`, 'b') + charges(W, flow(i * 3, t, 14), 'ink');
      s += resistor(180, LOOP.y0, 290, LOOP.y0, 'c', '10 kΩ') + resistor(LOOP.x1, 160, LOOP.x1, 270, 'c', '10 kΩ');
      const mx = LOOP.x1 + 110, Wv = wire([[LOOP.x1, 140], [mx, 140], [mx, 290], [LOOP.x1, 290]]);
      s += S.fade(u1, Wv.svg('a', 2) + S.circle(LOOP.x1, 140, 4, 'ink') + S.circle(LOOP.x1, 290, 4, 'ink') + charges(Wv, flow(iV * 30, t, 14), 'a', 30) + S.rect(mx - 26, 190, 52, 50, 'card', null) + meter(mx, 215, 'V', Vr / 24, 'a', `${fmt(Vr)} V`));
      s += S.fade(u1, label(660, 140, 'in parallel:', { size: 14, weight: 600 }) + label(660, 166, 'across the part', { size: 13 }));
      return s;
    },
    theory: [
      ['Connecting a voltmeter', `Voltage is a difference between two points, so a voltmeter is connected across the component, one lead on each side: in parallel. It should have a very large resistance, ideally infinite, so that it draws almost no current and doesn't disturb the circuit.`],
      ['Loading', `A meter whose resistance is comparable to the component's steals current and changes the voltage it's trying to measure. Digital multimeters typically have about 10 MΩ, far more than most circuits, so the error is negligible.`],
    ],
    practice: () => ['Connected in series by mistake, a voltmeter’s huge resistance stops almost all current: the lamp goes out, and the meter reads nearly the full battery voltage.'],
  };

  const mistakes = {
    id: 'mistakes',
    label: 'Wrong connections',
    lede: 'What happens if you swap them? An ammeter across a lamp is a short circuit; a voltmeter in series blocks the current.',
    build: 1,
    params: {
      w: { value: 1, min: 1, max: 2, step: 1, color: 'a', label: '1: ammeter across the lamp, 2: voltmeter in series', digits: 0 },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => (p.w === 1 ? `${h.v('i')}${op('=')}${h.frac('6 V', '0.01 Ω')}${op('=')}${h.r(600, 0)}${h.unit('A!')}` : `${h.v('i')}${op('=')}${h.frac('6 V', '10 MΩ')}${op('≈')}${h.r('0.0000006', 7)}${h.unit('A')}`),
    aside: (p, h) => `<div>Case ${h.n('w')}: ${p.w === 1 ? 'the ammeter’s tiny resistance gives the current an easy bypass. The lamp goes dark and the meter’s fuse blows.' : 'the voltmeter’s huge resistance almost stops the current. The lamp goes dark; the meter reads about 6 V, the whole battery.'}</div>`,
    steps: [{ at: 0, hl: ['w'], say: 'A 6 V battery and a lamp, with a meter connected the wrong way.' }],
    simSay: (p) => (p.w === 1 ? 'Almost all the current takes the near-zero-resistance path through the ammeter instead of the lamp: a short circuit. Current soars until a fuse breaks it.' : 'The voltmeter is now in the only path, and its millions of ohms let almost nothing through. Nothing is damaged, but nothing works.'),
    simSfx: (p) => (p.w === 1 ? [sfx.whoosh(0.2, 1.4), sfx.snip(1.5), sfx.thud(1.52)] : [sfx.tick(0.3, note(2))]),
    draw(p, h, { k, t }) {
      const W = loopWire();
      let s = W.svg('ink', 2.5) + battery(LOOP.x0, 215, '6 V', 'b');
      if (p.w === 1) {
        const blown = t > 1.5, i = blown ? 0 : 600;
        s += resistor(200, LOOP.y0, 330, LOOP.y0, 'c', 'lamp, dark', 0) + S.path(`M200 ${LOOP.y0} L200 ${LOOP.y0 + 100} L330 ${LOOP.y0 + 100} L330 ${LOOP.y0}`, 'a', 2);
        s += S.rect(240, LOOP.y0 + 76, 50, 48, 'card', null) + meter(265, LOOP.y0 + 100, 'A', blown ? 0 : 1.08, 'a', blown ? 'fuse blown' : 'off the scale!');
        if (!blown && t > 0) s += charges(W, flow(i, t, 1), 'c', 14, 3.5) + S.circle(265, LOOP.y0 + 100, 30 + 6 * Math.sin(t * 30), 'c', null, { opacity: 0.25 });
        if (blown) s += S.line(212, LOOP.y0 + 90, 228, LOOP.y0 + 110, 'c', 3) + S.line(228, LOOP.y0 + 90, 212, LOOP.y0 + 110, 'c', 3);
      } else {
        s += resistor(200, LOOP.y0, 330, LOOP.y0, 'c', 'lamp, dark', 0);
        s += S.rect(LOOP.x1 - 30, 190, 60, 50, 'card', null) + meter(LOOP.x1, 215, 'V', 0.5, 'a', '≈ 6 V');
      }
      s += S.fade(seg(k, 0, 0.6), caption(560, 140, p.w === 1 ? 'Ammeter (≈ 0 Ω) across the lamp' : 'Voltmeter (≈ 10 MΩ) in series'));
      return s;
    },
    theory: [
      ['Remember it this way', `<em>A</em>mmeters go <em>a</em>long the path (series); <em>V</em>oltmeters go across, like the arms of a <em>V</em> (parallel). An ammeter measures what flows through it; a voltmeter compares the two points it touches.`],
      ['Why the mistakes behave as they do', `An ammeter's near-zero resistance in parallel with a component offers the current a bypass, effectively a short circuit across the supply. A voltmeter's huge resistance in series is like a nearly-closed valve in the only pipe.`],
    ],
    practice: () => ['Multimeters protect their current range with a fuse precisely because of mistake number 1.'],
  };

  MV.register({ realm: 'phys', id: 'e-meters', group: GROUP, symbol: 'A', title: 'Measuring instruments', modesLabel: null, modes: [ammeterMode, voltmeterMode, mistakes] });

  // =====================================================================
  // Electric power and energy consumption
  // =====================================================================

  const DAYS = 30;
  const powerConcept = {
    id: 'concept',
    label: 'Energy and the bill',
    lede: 'Power is how fast an appliance uses energy. Multiply by how long it runs and you get the energy, in kilowatt-hours: what the electricity bill charges for.',
    build: 3.4,
    compact: true,
    params: {
      P: { value: 2000, min: 100, max: 5500, step: 100, color: 'a', label: 'power in watts', digits: 0 },
      hrs: { value: 1, min: 0.25, max: 8, step: 0.25, color: 'b', label: 'hours of use per day' },
      price: { value: 0.8, min: 0.2, max: 1.5, step: 0.05, color: 'c', label: 'price per kWh' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('E')}${op('=')}${h.c('a', fmt(p.P / 1000, 2), 'kw')}${h.unit('kW')}${op('×')}${h.n('hrs')}${h.unit('h')}${op('×')}${DAYS}${op('=')}${h.r((p.P / 1000) * p.hrs * DAYS, 1)}${h.unit('kWh/month')}`,
    aside: (p, h) => `<div>${h.n('P')} W is ${h.c('a', fmt(p.P / 1000, 2), 'kw')} kW. At ${h.n('price')} per kWh: ${h.c('c', fmt((p.P / 1000) * p.hrs * DAYS * p.price, 2), 'cost')} a month.</div>`,
    readout: (p, h, { t }) => { const d = (t / 6) * DAYS; return h.ro('day', fmt(d, 0)) + h.ro('energy', fmt((p.P / 1000) * p.hrs * d, 1), 'kWh') + h.ro('cost', fmt((p.P / 1000) * p.hrs * d * p.price, 2)); },
    steps: [
      { at: 0, hl: ['kw'], say: ({ P }) => `An appliance rated ${fmt(P)} W uses ${fmt(P)} joules every second: ${fmt(P / 1000, 2)} kilowatts.` },
      { at: 0.3, hl: ['hrs'], say: ({ hrs }) => `It runs ${fmt(hrs)} h a day. Energy = power × time: kW × h gives kilowatt-hours.` },
      { at: 0.55, hl: ['res'], say: 'Over a month, the kilowatt-hours add up. One kWh is 3.6 million joules: a 1 kW heater running for an hour.' },
      { at: 0.78, hl: ['price', 'cost'], say: 'The bill is simply the kWh used × the price of one kWh.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(4)), sfx.glide(0.3, 0.5, pitch(0), pitch(Math.min(12, p.hrs * 2))), sfx.chord(0.56, [note(4), note(6)]), sfx.chime(0.8, note(9))],
    simSay: (p) => `A month in six seconds. The meter spins faster for powerful appliances; the coins pile up with every kWh. ${p.P >= 4000 ? 'An electric shower is one of the biggest consumers in a home.' : ''}`,
    simSfx: (p) => { const n = Math.min(30, Math.round(((p.P / 1000) * p.hrs * DAYS) / 5)); return Array.from({ length: n }, (_, i) => sfx.tick((i * 6) / Math.max(1, n), note(7))); },
    draw(p, h, { k, t }) {
      const kwh = (p.P / 1000) * p.hrs * DAYS, d = t > 0 ? (t / 6) * DAYS : DAYS * seg(k, 0.55, 0.75), used = (p.P / 1000) * p.hrs * d;
      // Meter with a spinning disc.
      const mx = 170, my = 200;
      let s = S.rect(mx - 90, my - 110, 180, 220, 'card', 'ink', { rx: 12, 'stroke-width': 2 }) + S.rect(mx - 66, my - 84, 132, 40, 'ink', null, { rx: 4 });
      s += label(mx, my - 56, `${String(Math.floor(used)).padStart(5, '0')} kWh`, { fill: 'paper', size: 17, weight: 600 });
      const ang = used * 2 * Math.PI * 3;
      s += S.el('ellipse', { cx: mx, cy: my + 30, rx: 60, ry: 12, fill: 'ink-soft', stroke: 'ink', 'stroke-width': 1.5 }) + S.line(mx + 58 * Math.cos(ang), my + 30 + 11 * Math.sin(ang), mx + 50 * Math.cos(ang), my + 30 + 9 * Math.sin(ang), 'c', 4);
      s += S.fade(seg(k, 0, 0.25), label(mx, my + 140, `${fmt(p.P)} W appliance`, { fill: 'a', weight: 600 }));
      // Bars: energy and money.
      const bx = 420, by = 360, sc = 220 / Math.max(10, kwh);
      s += S.fade(seg(k, 0.3, 0.5), S.rect(bx, by - used * sc, 70, used * sc, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(bx + 35, by + 18, 'kWh', { fill: 'a', size: 12, weight: 600 }) + label(bx + 35, by - used * sc - 8, fmt(used, 1), { fill: 'a', size: 12 }));
      const coins = Math.min(30, Math.floor((used * p.price) / Math.max(0.5, (kwh * p.price) / 30)));
      for (let c = 0; c < coins; c++) s += S.fade(seg(k, 0.78, 0.95) || (t > 0 ? 1 : 0), S.el('ellipse', { cx: 600 + (c % 3) * 4, cy: by - c * 8, rx: 28, ry: 7, fill: 'b-soft', stroke: 'b', 'stroke-width': 1.5 }));
      s += S.fade(seg(k, 0.78, 0.95), label(604, by + 18, `cost ${fmt(used * p.price, 2)}`, { fill: 'b', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Power', `Electric power is the rate of using energy: ${M('P = E/Δt')}, in watts (joules per second). An appliance's power rating tells you how much energy it uses every second it's on. For any component, ${M('P = Vi')}; with Ohm's law, also ${M('P = Ri^2 = V^2/R')}.`],
      ['The kilowatt-hour', `Joules are tiny for household use, so energy is billed in kilowatt-hours: ${M('E = PΔt')} with ${M('P')} in kW and ${M('Δt')} in hours. 1 kWh = 1000 W × 3600 s = 3.6 MJ. The meter on your house counts kWh.`],
      ['Where it goes', `Heating appliances (showers, ovens, kettles, irons, air conditioning) draw thousands of watts and dominate most bills. Lighting and electronics use far less, though small loads left on all day (fridges, standby) add up.`],
    ],
    practice: null,
  };

  const APPS = [
    ['shower', 5500, null, 'c'], ['air conditioner', 1200, null, 'a'], ['fridge', 150, 10, 'b'], ['TV', 100, 5, 'b'], ['10 LED lamps', 90, 5, 'b'], ['computer', 200, 4, 'b'], ['iron', 1000, 0.3, 'b'],
  ];
  const house = (p) => APPS.map(([name, P, hrs, col]) => { const h = name === 'shower' ? p.mins / 60 : name === 'air conditioner' ? p.ac : hrs; return { name, P, h, col, kwh: (P / 1000) * h * DAYS }; });
  const powerHouse = {
    id: 'house',
    label: 'A household',
    lede: 'A month of electricity for a family. Which appliances really cost the money? Try shorter showers and less air conditioning.',
    build: 1,
    compact: true,
    params: {
      mins: { value: 40, min: 0, max: 120, step: 5, color: 'c', label: 'minutes of showers per day (whole family)', digits: 0 },
      ac: { value: 3, min: 0, max: 12, step: 0.5, color: 'a', label: 'hours of air conditioning per day' },
      price: { value: 0.8, min: 0.2, max: 1.5, step: 0.05, color: 'b', label: 'price per kWh' },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => { const tot = house(p).reduce((a, x) => a + x.kwh, 0); return `${h.v('E')}${op('=')}Σ${h.v('P')}Δ${h.v('t')}${op('=')}${h.r(tot, 0)}${h.unit('kWh/month')}`; },
    aside: (p, h) => { const tot = house(p).reduce((a, x) => a + x.kwh, 0); return `<div>Bill: ${h.c('b', fmt(tot * p.price, 2), 'bill')} at ${h.n('price')} per kWh. Showers: ${h.n('mins')} min/day; air conditioning: ${h.n('ac')} h/day.</div>`; },
    steps: [{ at: 0, hl: [], say: 'Each bar is one appliance’s energy for the month: power × hours × 30 days.' }],
    simSay: (p) => { const L = house(p).sort((a, b) => b.kwh - a.kwh)[0]; return `The biggest consumer here is the ${L.name}: ${fmt(L.kwh, 0)} kWh a month. High power for a short time can beat low power all day.`; },
    simSfx: () => [sfx.chord(0.2, [note(2), note(4), note(7)])],
    draw(p, h, { k, t }) {
      const list = house(p), tot = list.reduce((a, x) => a + x.kwh, 0), max = Math.max(60, ...list.map((x) => x.kwh)), grow = t > 0 ? clamp01(t / 2) : seg(k, 0, 0.8);
      let s = caption(60, 50, 'kWh per month');
      list.forEach((x, i) => {
        const y = 80 + i * 44, w = (x.kwh / max) * 420 * grow;
        s += label(200, y + 20, x.name, { anchor: 'end', size: 13 }) + S.rect(210, y + 4, w, 26, `${x.col}-soft`, x.col, { 'stroke-width': 1.5, rx: 3 }) + label(216 + w, y + 22, `${fmt(x.kwh, 0)} kWh · ${fmt(x.P)} W × ${fmt(x.h, 2)} h`, { anchor: 'start', size: 11, fill: 'muted' });
      });
      s += label(760, 400, `total ${fmt(tot, 0)} kWh → ${fmt(tot * p.price, 2)}`, { anchor: 'end', size: 15, weight: 600 });
      return s;
    },
    theory: [
      ['Adding up the bill', `The month's energy is the sum over every appliance of ${M('PΔt')}. Appliances that heat or cool use the most power; anything running all day, like a fridge, also adds up even at low power.`],
      ['Saving energy', `The biggest savings come from the biggest terms: shorter showers, a thermostat set a couple of degrees milder, LED lighting instead of incandescent, and switching off devices left on standby.`],
    ],
    practice: (p, h) => [`Cutting showers by 10 minutes a day saves ${h.r(5.5 * (10 / 60) * DAYS, 0)} kWh, ${h.r(5.5 * (10 / 60) * DAYS * p.price, 2)} a month.`],
  };

  const powerBulbs = {
    id: 'bulbs',
    label: 'Same light, less power',
    lede: 'An old 60 W filament bulb and a 9 W LED give about the same light. The difference is how much becomes heat instead.',
    build: 1,
    compact: true,
    params: {
      hrs: { value: 5, min: 1, max: 12, step: 1, color: 'b', label: 'hours of light per day', digits: 0 },
      price: { value: 0.8, min: 0.2, max: 1.5, step: 0.05, color: 'c', label: 'price per kWh' },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => `(60${op('−')}9)${h.unit('W')}${op('×')}${h.n('hrs')}${h.unit('h')}${op('×')}365${op('=')}${h.r((51 * p.hrs * 365) / 1000, 0)}${h.unit('kWh saved a year')}`,
    aside: (p, h) => `<div>That’s ${h.c('c', fmt(((51 * p.hrs * 365) / 1000) * p.price, 2), 'save')} a year, for one bulb.</div>`,
    steps: [{ at: 0, hl: [], say: 'Two bulbs, the same brightness.' }],
    simSay: () => 'The filament bulb turns about 90 % of its energy into heat; the LED about 50 %, and needs far less to start with.',
    simSfx: () => [sfx.chime(0.2, note(7))],
    draw(p, h, { k, t }) {
      const bulb = (cx, P, heat, name) => {
        // Same light from both (same glow); the filament also sheds a lot of heat (the rose shimmer).
        let s = S.circle(cx, 160, 46 + heat * P * 0.5, 'c', null, { opacity: (0.04 + 0.12 * heat * (P / 60)).toFixed(3) }) + S.circle(cx, 160, 62, 'b', null, { opacity: 0.12 }) + S.circle(cx, 160, 42, 'b-soft', 'b', { 'stroke-width': 2 }) + S.rect(cx - 16, 202, 32, 22, 'ink-soft', 'ink', { 'stroke-width': 1.5 });
        s += label(cx, 252, name, { weight: 600 }) + label(cx, 270, `${P} W`, { fill: 'a', size: 13 });
        const sc = 1.3, light = P * (1 - heat), hot = P * heat;
        s += S.rect(cx - 50, 390 - light * sc, 40, light * sc, 'b', null) + S.rect(cx + 10, 390 - hot * sc, 40, hot * sc, 'c', null, { opacity: 0.8 });
        s += label(cx - 30, 404, `light ${fmt(light, 0)} W`, { fill: 'b', size: 10 }) + label(cx + 30, 404, `heat ${fmt(hot, 0)} W`, { fill: 'c', size: 10 });
        return s;
      };
      return bulb(220, 60, 0.92, 'filament') + bulb(560, 9, 0.47, 'LED') + S.fade(seg(k, 0, 0.6), caption(60, 50, 'Light output about the same: 800 lumens'));
    },
    theory: [['Efficiency', `Both bulbs turn electrical energy into light and heat; only the light is useful. A filament bulb works by heating a wire white-hot, so most of its energy leaves as infrared. An LED makes light directly from the semiconductor and is several times more efficient. Same light, a fraction of the power, and a fraction of the bill.`]],
    practice: (p, h) => [`Swapping 10 bulbs saves about ${h.r(((51 * p.hrs * 365) / 1000) * 10, 0)} kWh a year.`],
  };

  MV.register({ realm: 'phys', id: 'e-power', group: GROUP, symbol: 'W', title: 'Power and energy bills', modes: [powerConcept, powerHouse, powerBulbs] });

  // =====================================================================
  // Fuses and circuit breakers
  // =====================================================================

  const KITCHEN = [[1, 'kettle', 2200], [2.4, 'microwave', 1200], [3.8, 'toaster', 900], [5.2, 'iron', 1100]];
  const fuseState = ({ V, rating }, t) => {
    let on = KITCHEN.filter(([at]) => t >= at), i = on.reduce((a, x) => a + x[2], 0) / V;
    // The fuse wire heats up while overloaded and melts after 0.6 s.
    let over = null;
    for (let j = 0; j < KITCHEN.length; j++) { const ij = KITCHEN.slice(0, j + 1).reduce((a, x) => a + x[2], 0) / V; if (ij > rating) { over = KITCHEN[j][0]; break; } }
    const blown = over != null && t >= over + 0.6;
    if (blown) { i = 0; on = []; }
    return { i, on, over, blown, heat: over != null && t >= over ? clamp01((t - over) / 0.6) : 0 };
  };
  const fuseConcept = {
    id: 'concept',
    label: 'Overload',
    lede: 'Every appliance switched on adds its current to the same wires. A fuse is a deliberately weak link: if the current gets dangerous, it melts first and cuts the circuit.',
    build: 3,
    compact: true,
    params: {
      V: { value: 220, min: 110, max: 240, step: 10, color: 'b', label: 'mains voltage', digits: 0 },
      rating: { value: 20, min: 10, max: 40, step: 5, color: 'a', label: 'fuse rating in amperes', digits: 0 },
    },
    sim: { duration: () => 7.5 },
    formula: (p, h) => { const tot = KITCHEN.reduce((a, x) => a + x[2], 0); return `${h.v('i')}${op('=')}${h.frac(`${fmt(tot)} W`, `${h.n('V')} V`)}${op('=')}${h.r(tot / p.V, 1)}${h.unit('A')}${op(tot / p.V > p.rating ? '>' : '≤')}${h.n('rating')}${h.unit('A')}`; },
    aside: (p, h) => { const tot = KITCHEN.reduce((a, x) => a + x[2], 0); return `<div>${tot / p.V > p.rating ? h.c('c', 'With everything on, the fuse blows.', 'verdict') : h.c('a', 'Everything can run at once.', 'verdict')} Each appliance adds ${h.v('i')} = ${h.v('P')}/${h.v('V')}.</div>`; },
    readout: (p, h, { t }) => { const f = fuseState(p, t); return h.ro('current', fmt(f.i, 1), 'A') + h.ro('fuse', f.blown ? 'blown' : 'ok'); },
    steps: [
      { at: 0, hl: ['V'], say: 'A kitchen circuit: appliances in parallel, all fed through one fuse.' },
      { at: 0.35, hl: ['rating'], say: ({ rating }) => `The fuse is a thin wire rated ${fmt(rating)} A. Above that, it heats up enough to melt.` },
      { at: 0.7, hl: ['res', 'verdict'], say: 'Each appliance draws i = P/V, and in parallel the currents add. Press play to switch them on one by one.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.tick(0.36, note(5)), sfx.chime(0.72, note(7))],
    simSay: (p, h, { t }) => { const f = fuseState(p, t); return f.blown ? 'The fuse wire melted and broke the circuit. Everything stops, before the house wiring could overheat and start a fire.' : f.heat > 0 ? 'Overloaded! The fuse wire is heating up…' : `${f.on.length ? `${f.on.map((x) => x[1]).join(', ')} on: ${fmt(f.i, 1)} A.` : 'Nothing on yet.'}`; },
    simSfx: (p) => { const ev = KITCHEN.map(([at]) => sfx.tick(at, note(5))); const f = fuseState(p, 99); if (f.over != null) ev.push(sfx.snip(f.over + 0.6), sfx.thud(f.over + 0.62)); return ev; },
    draw(p, h, { k, t }) {
      const f = fuseState(p, t), top = 90, bot = 330;
      let s = S.rect(50, 160, 70, 100, 'ink-soft', 'ink', { rx: 6, 'stroke-width': 2 }) + label(85, 280, 'supply', { size: 11, fill: 'muted' }) + label(85, 214, `${fmt(p.V)} V`, { size: 12, weight: 600 });
      s += S.line(120, 180, 150, 180, 'ink', 2.5) + S.line(150, 180, 150, top, 'ink', 2.5) + S.line(120, 240, 150, 240, 'ink', 2.5) + S.line(150, 240, 150, bot, 'ink', 2.5);
      // Fuse on the top line.
      const fx = 190, glow = f.heat;
      s += S.fade(seg(k, 0.35, 0.55) || 0.4, S.rect(fx - 30, top - 14, 60, 28, 'card', 'ink', { rx: 6, 'stroke-width': 2 }) + label(fx, top - 22, `fuse ${fmt(p.rating)} A`, { fill: 'a', size: 12, weight: 600 }));
      s += S.line(150, top, fx - 30, top, 'ink', 2.5);
      if (!f.blown) s += S.line(fx - 26, top, fx + 26, top, glow > 0 ? 'c' : 'ink', 2 + 2 * glow) + (glow > 0 ? S.circle(fx, top, 16 + 12 * glow, 'c', null, { opacity: (0.3 * glow).toFixed(2) }) : '');
      else s += S.line(fx - 26, top, fx - 6, top + 4, 'ink', 2) + S.line(fx + 6, top - 4, fx + 26, top, 'ink', 2);
      s += S.line(fx + 30, top, 740, top, 'ink', 2.5) + S.line(150, bot, 740, bot, 'ink', 2.5);
      KITCHEN.forEach(([, name, P], j) => {
        const x = 300 + j * 130, isOn = f.on.some((o) => o[1] === name);
        s += S.line(x, top, x, 170, 'ink', 2) + S.line(x, 250, x, bot, 'ink', 2) + S.rect(x - 46, 170, 92, 80, isOn ? 'b-soft' : 'card', isOn ? 'b' : 'grid2', { rx: 8, 'stroke-width': 2 });
        s += label(x, 205, name, { size: 12, weight: 600, fill: isOn ? 'b' : 'muted' }) + label(x, 226, `${P} W`, { size: 11, fill: 'muted' }) + label(x, 243, `${fmt(P / p.V, 1)} A`, { size: 11, fill: isOn ? 'b' : 'muted' });
      });
      // Current against time, with the rating line.
      const Gr = graph({ x0: 300, x1: 740, y0: 400, y1: 350, tMax: 7.5, vMax: 30, ticks: false, tLabel: '', vLabel: '' });
      if (t > 0) s += S.path(path(150, (u) => [Gr.X(u * t), Gr.Y(Math.min(30, fuseState(p, u * t).i))]), 'c', 2) + S.line(Gr.X(0), Gr.Y(Math.min(30, p.rating)), Gr.X(7.5), Gr.Y(Math.min(30, p.rating)), 'a', 1, dashed('4 4'));
      return s;
    },
    theory: [
      ['Why too much current is dangerous', `Current heats the wires it flows through, at a rate ${M('P = Ri^2')}: double the current, four times the heat. House wiring is sized for a certain maximum current; beyond it, insulation can melt and start a fire.`],
      ['Fuses', `A fuse is a short, thin wire in a holder, made to melt at a set current, its rating. It's placed in the live wire, so when it blows the appliances are disconnected from the dangerous voltage. Once blown it must be replaced, ideally with one of the same rating; a bigger one defeats the purpose.`],
      ['Adding up the load', `Appliances on one circuit are in parallel, so their currents add: ${M('i = i_1 + i_2 + …')}, each ${M('i = P/V')}. Lower mains voltage (127 V instead of 220 V) means more current for the same power, so thicker wires and bigger fuses are needed.`],
    ],
    practice: (p, h) => [`At ${h.val('V')} V, a 5500 W shower alone draws ${h.r(5500 / p.V, 1)} A: it needs its own circuit and breaker.`],
  };

  const shortCircuit = {
    id: 'short',
    label: 'Short circuit',
    lede: 'If damaged insulation lets the live wire touch the neutral, the current skips the appliance and finds a path of almost no resistance. A circuit breaker trips in milliseconds.',
    build: 1,
    compact: true,
    params: {
      V: { value: 220, min: 110, max: 240, step: 10, color: 'b', label: 'mains voltage', digits: 0 },
      r: { value: 0.1, min: 0.02, max: 1, step: 0.02, color: 'c', label: 'resistance of the short circuit in ohms' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('i')}${op('=')}${h.frac(h.n('V'), h.n('r'))}${op('=')}${h.r(p.V / p.r, 0)}${h.unit('A')}`,
    aside: (p, h) => `<div>Normal load (a 2200 W kettle, ${fmt(p.V * p.V / 2200, 1)} Ω): ${h.c('a', fmt(2200 / p.V, 1), 'normal')} A. Heat in a 0.05 Ω stretch of wire: ${h.c('c', fmt(0.05 * (p.V / p.r) ** 2, 0), 'heat')} W.</div>`,
    readout: (p, h, { t }) => h.ro('current', t < 2 ? fmt(2200 / p.V, 1) : t < 2.6 ? fmt(p.V / p.r, 0) : '0', 'A'),
    steps: [{ at: 0, hl: [], say: 'A kettle working normally, protected by a circuit breaker.' }],
    simSay: (p, h, { t }) => (t < 2 ? 'Normal: the current goes through the kettle’s element.' : t < 2.6 ? `The cable is crushed and the bare wires touch: a path of only ${fmt(p.r)} Ω. The current leaps to ${fmt(p.V / p.r, 0)} A (slow motion).` : 'The breaker’s electromagnet snapped the switch open within a few milliseconds. Unlike a fuse, it can be reset once the fault is fixed.'),
    simSfx: () => [sfx.tick(0.2, note(4)), sfx.whoosh(2, 2.5), sfx.snip(2.6), sfx.thud(2.62)],
    draw(p, h, { k, t }) {
      const short = t >= 2, tripped = t >= 2.6, top = 110, bot = 320;
      let s = S.rect(40, 170, 70, 90, 'ink-soft', 'ink', { rx: 6, 'stroke-width': 2 }) + label(75, 220, `${fmt(p.V)} V`, { size: 12, weight: 600 });
      s += S.line(110, 190, 140, 190, 'ink', 2.5) + S.line(140, 190, 140, top, 'ink', 2.5) + S.line(110, 240, 140, 240, 'ink', 2.5) + S.line(140, 240, 140, bot, 'ink', 2.5);
      // Breaker: a switch with an electromagnet coil.
      const bx = 220;
      s += S.rect(bx - 40, top - 40, 80, 80, 'card', 'ink', { rx: 8, 'stroke-width': 2 }) + label(bx, top - 48, 'circuit breaker', { size: 12, weight: 600 });
      s += S.line(140, top, bx - 30, top, 'ink', 2.5) + S.path(`M${bx - 20} ${top + 18} q5 -12 10 0 q5 -12 10 0 q5 -12 10 0`, 'a', 2);
      s += tripped ? S.line(bx - 30, top, bx + 22, top - 26, 'ink', 3) : S.line(bx - 30, top, bx + 30, top, 'ink', 3);
      s += S.line(bx + 30, top, 700, top, 'ink', 2.5) + S.line(140, bot, 700, bot, 'ink', 2.5);
      // Kettle and the short.
      s += S.line(620, top, 620, 180, 'ink', 2) + S.line(620, 260, 620, bot, 'ink', 2) + S.rect(580, 180, 80, 80, 'b-soft', 'b', { rx: 10, 'stroke-width': 2 }) + label(620, 225, 'kettle', { fill: 'b', size: 12, weight: 600 });
      if (short) s += S.path(`M420 ${top} L430 ${top + 60} L410 ${top + 110} L425 ${bot}`, 'c', 3) + S.circle(420, 215, 20 + (tripped ? 0 : 10 * Math.sin(t * 40)), 'c', null, { opacity: tripped ? 0.15 : 0.35 }) + label(440, 215, 'short!', { fill: 'c', anchor: 'start', weight: 600 });
      const live = !tripped, i = !short ? 2200 / p.V : live ? p.V / p.r : 0;
      if (live && t > 0) { const W = wire(short ? [[140, top], [420, top], [420, bot], [140, bot]] : [[140, top], [620, top], [620, bot], [140, bot]]); s += charges(W, flow(Math.min(i, 200), t, 2), short ? 'c' : 'a', short ? 12 : 26); }
      s += label(400, 380, `current ${fmt(i, 0)} A`, { size: 16, weight: 600, fill: short && live ? 'c' : 'ink' });
      return s;
    },
    theory: [
      ['Short circuits', `A short circuit is an unintended path of very low resistance between live and neutral, bypassing the load. By Ohm's law the current ${M('i = V/r')} becomes enormous, and the heating ${M('Ri^2')} in the wires can melt them and start a fire within seconds.`],
      ['Circuit breakers', `A breaker is a switch that opens automatically. A coil (electromagnet) pulls it open almost instantly when a huge current flows, as in a short circuit. A bimetallic strip bends open more slowly under a smaller, sustained overload. Unlike a fuse, a breaker can simply be switched back on once the fault is fixed.`],
      ['Earth and residual-current devices', `Metal-cased appliances connect their case to earth, so a live wire touching the case causes a short to earth that trips the breaker. A residual-current device (RCD) goes further: it compares live and neutral currents and trips at a difference of just 30 mA, fast enough to save someone touching a live wire.`],
    ],
    practice: (p, h) => [`A 0.1 Ω short at ${h.val('V')} V draws ${h.r(p.V / 0.1, 0)} A, ${h.r((p.V / 0.1) / (2200 / p.V), 0)} times a kettle’s current.`],
  };

  MV.register({ realm: 'phys', id: 'e-safety', group: GROUP, symbol: '⌁', title: 'Fuses and circuit breakers', modes: [fuseConcept, shortCircuit] });
})();
