// "Show formula" plays for Electricity. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, lerp, clamp01, dashed } = MV;
  const { play, label, reg } = MV.playKit;
  const { wire, charges, resistor, battery, bar, meter } = MV.phys;
  const work = (x, y, list, o = {}) => list.map(([text, u, col], i) => S.fade(u, label(x, y + i * 28, text, { anchor: 'start', size: 16, fill: col || 'ink', ...o }))).join('');
  const loop = () => wire([[120, 215], [120, 110], [480, 110], [480, 320], [120, 320]], true);

  // Energy per coulomb round a loop: up at the battery, down across each resistor.
  function ladder(drops, V, u, colors) {
    const X0 = 540, W = 200, Y = (v) => 360 - (v / Math.max(V, 1)) * 230;
    let s = S.line(X0, Y(0), X0 + W, Y(0), 'grid2', 1.5) + label(X0, Y(V) - 12, 'energy per coulomb (volts)', { anchor: 'start', size: 11, fill: 'muted' });
    s += S.fade(u[0], S.line(X0, Y(0), X0, Y(V), 'b', 3) + label(X0 - 6, Y(V / 2), `+${fmt(V)} V`, { fill: 'b', anchor: 'end', size: 12, weight: 600 }));
    let v = V, x = X0;
    drops.forEach((d, i) => {
      const nx = x + W / drops.length;
      s += S.fade(u[i + 1], S.line(x, Y(v), nx, Y(v - d), colors[i], 3) + label((x + nx) / 2 + 6, Y(v - d / 2), `−${fmt(d)} V`, { fill: colors[i], anchor: 'start', size: 12, weight: 600 }));
      v -= d; x = nx;
    });
    return s;
  }

  // =====================================================================
  // Ohm's laws
  // =====================================================================

  reg('e-ohm', {
    Current: play({
      own: true, values: { rate: 2 },
      intro: 'Stand at one point of a wire and count the charge going past.',
      scene: ({ rate }, h, k, u) => {
        const W = wire([[60, 220], [740, 220]]), gate = 400;
        let s = W.svg('ink', 6) + S.line(gate, 180, gate, 260, 'c', 2, dashed('4 4'));
        s += charges(W, (k * 900 * rate) / 2 % 34, 'a', 34, 6);
        s += S.fade(u(0), label(gate, 170, `${fmt(rate * 3)} C pass the line…`, { fill: 'a', size: 14 }));
        s += S.fade(u(1), label(gate, 300, '…in 3 seconds', { fill: 'b', size: 14 }));
        s += S.fade(u(2), label(gate, 350, `i = ${fmt(rate * 3)} ÷ 3 = ${fmt(rate)} A`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'Δq']], color: 'a', say: 'Δq: the charge that crosses the line, in coulombs.' },
        { parts: [[3, '/Δt']], color: 'b', say: '/Δt: in this much time.' },
        { parts: [[0, 'i'], [1, ' = ']], say: 'i =: the current, coulombs per second. 1 ampere is 1 coulomb every second, about 6 billion billion electrons.' },
      ],
      vary: [{ key: 'rate', amp: 1.5, min: 0.3, label: 'i', color: 'a', say: 'Vary the flow: more charge past the line each second, more current.' }],
    }),
    'First law': play({
      own: true, values: { R: 4, i: 1.5 },
      intro: 'Think of voltage as height: energy per coulomb. The battery lifts charge up; the resistor lets it down.',
      scene: ({ R, i }, h, k, u) => {
        const W = loop(), V = R * i;
        let s = W.svg('ink', 2.5) + battery(120, 215, `${fmt(V)} V`, 'b') + resistor(230, 110, 360, 110, 'c', `${fmt(R)} Ω`) + charges(W, k * 200 * i, 'a');
        s += S.fade(u(1), label(300, 360, `i = ${fmt(i)} A`, { fill: 'a', size: 14, weight: 600 }));
        s += ladder([V], V, [u(2), u(0)], ['c']);
        s += S.fade(u(2), label(640, 70, `V = ${fmt(R)} × ${fmt(i)} = ${fmt(V)} V`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'R']], color: 'c', say: 'R: the resistor fights the flow. Each coulomb forced through it loses energy as heat.' },
        { parts: [[3, 'i']], color: 'a', say: 'i: the more current you want, the harder you must push.' },
        { parts: [[0, 'V'], [1, ' = ']], color: 'b', say: 'V =: the voltage the battery must supply equals the drop across the resistor, R × i.' },
      ],
      vary: [{ key: 'R', amp: 3, min: 0.5, label: 'R', color: 'c', say: 'Vary the resistance at the same current: the voltage needed grows in step.' }],
    }),
    'Second law': play({
      own: true, values: { rho: 1.7, L: 2, A: 1 },
      intro: 'Build a long wire out of short pieces, and a thick wire out of thin ones.',
      scene: ({ rho, L, A }, h, k, u) => {
        const seg = (x, y, w, th, col) => S.rect(x, y - th / 2, w, th, `${col}-soft`, col, { rx: th / 2, 'stroke-width': 1.5 });
        let s = '';
        s += S.fade(u(0), seg(80, 100, 120, 14, 'c') + label(220, 105, 'ρ: 1 m of 1 mm², resistance ρ', { anchor: 'start', size: 13 }));
        const n = Math.max(1, Math.round(L));
        for (let i = 0; i < n; i++) s += S.fade(u(1), seg(80 + i * 124, 190, 120, 14, 'b'));
        s += S.fade(u(1), label(80 + n * 124 + 10, 195, `${n} in a row: × ${n}`, { anchor: 'start', size: 13, fill: 'b' }));
        const m = Math.max(1, Math.round(A));
        for (let j = 0; j < m; j++) s += S.fade(u(2), seg(80, 270 + j * 18, 120, 14, 'a'));
        s += S.fade(u(2), label(220, 280, `${m} side by side: ÷ ${m}`, { anchor: 'start', size: 13, fill: 'a' }));
        s += S.fade(u(3), label(560, 380, `R = ${fmt(rho)}×10⁻⁸ × ${fmt(L)} ÷ ${fmt(A)}×10⁻⁶ = ${fmt((rho * 1e-8 * L) / (A * 1e-6), 4)} Ω`, { weight: 600, size: 14 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'ρ']], color: 'c', say: 'ρ: the material’s resistivity, the resistance of a standard piece.' },
        { parts: [[3, 'L']], color: 'b', say: 'L: a longer wire is like pieces in series; resistances add, so R grows with length.' },
        { parts: [[4, '/A']], color: 'a', say: '/A: a thicker wire is like pieces side by side, in parallel; more paths, so R shrinks with area.' },
        { parts: [[0, 'R'], [1, ' = ']], say: 'R =: material × length ÷ area.' },
      ],
      vary: [{ key: 'L', amp: 1.5, min: 1, max: 4, label: 'L', color: 'b', say: 'Vary the length: each extra metre adds another piece in series.' }],
    }),
  });

  // =====================================================================
  // Circuits
  // =====================================================================

  const condBar = (x, R, col, text, u) => S.fade(u, S.rect(x, 360 - (1 / R) * 300, 50, (1 / R) * 300, `${col}-soft`, col, { 'stroke-width': 1.5 }) + label(x + 25, 378, text, { fill: col, size: 12, weight: 600 }) + label(x + 25, 352 - (1 / R) * 300, `1/${fmt(R, 2)}`, { fill: col, size: 11 }));
  reg('e-circuits', {
    Series: play({
      own: true, values: { R1: 4, R2: 2 },
      intro: 'Two resistors, one after the other. Charge must get through both.',
      scene: ({ R1, R2 }, h, k, u) => {
        const sc = 30, y = 200;
        let s = S.line(60, y, 740, y, 'ink', 2.5);
        const w1 = R1 * sc, w2 = R2 * sc, x1 = 120 + (1 - u(2)) * 0, x2 = x1 + w1 + 60 * (1 - u(2));
        s += S.fade(u(0), S.rect(x1, y - 22, w1, 44, 'a-soft', 'a', { rx: 6, 'stroke-width': 2 }) + label(x1 + w1 / 2, y + 5, `${fmt(R1)} Ω`, { fill: 'a', weight: 600 }));
        s += S.fade(u(1), S.rect(x2, y - 22, w2, 44, 'c-soft', 'c', { rx: 6, 'stroke-width': 2 }) + label(x2 + w2 / 2, y + 5, `${fmt(R2)} Ω`, { fill: 'c', weight: 600 }));
        s += S.fade(u(2), S.rect(x1 - 4, y - 30, w1 + w2 + 8, 60, null, 'ink', { rx: 8, 'stroke-width': 2, ...dashed('6 4') }) + label(x1 + (w1 + w2) / 2, y - 44, `one obstacle of ${fmt(R1 + R2)} Ω`, { weight: 600 }));
        s += charges(wire([[60, y], [740, y]]), (k * 600) % 26, 'ink', 26, 3);
        return s;
      },
      pieces: [
        { parts: [[2, 'R₁']], color: 'a', say: 'R₁: the first obstacle.' },
        { parts: [[3, ' + R₂ + …']], color: 'c', say: '+ R₂: every charge has to get through the second too, so the obstacles add up.' },
        { parts: [[0, 'R_eq'], [1, ' = ']], say: 'R_eq =: one resistor equal to the sum would behave exactly the same.' },
      ],
      vary: [{ key: 'R2', amp: 3, min: 0.5, label: 'R₂', color: 'c', say: 'Vary R₂: the total grows by exactly the same amount.' }],
    }),
    Parallel: play({
      own: true, values: { R1: 4, R2: 6 },
      intro: 'Side by side, each path makes it easier for charge to get through. Measure “easiness” as 1/R.',
      scene: ({ R1, R2 }, h, k, u) => {
        const Req = (R1 * R2) / (R1 + R2);
        let s = condBar(150, R1, 'a', 'path 1', u(0)) + condBar(240, R2, 'c', 'path 2', u(1));
        s += S.fade(u(2), S.rect(420, 360 - (1 / R1) * 300, 50, (1 / R1) * 300, 'a-soft', 'a', { 'stroke-width': 1.5 }) + S.rect(420, 360 - (1 / R1 + 1 / R2) * 300, 50, (1 / R2) * 300, 'c-soft', 'c', { 'stroke-width': 1.5 }) + label(445, 378, 'both', { size: 12, weight: 600 }) + label(560, 160, `1/R = ${fmt(1 / R1 + 1 / R2, 3)}`, { size: 15, anchor: 'start' }) + label(560, 188, `R = ${fmt(Req, 2)} Ω`, { size: 17, weight: 600, anchor: 'start' }));
        s += S.line(130, 360, 500, 360, 'ink', 1.5);
        return s;
      },
      pieces: [
        { parts: [[2, '1/R₁']], color: 'a', say: '1/R₁: how easily charge gets through the first path (its conductance).' },
        { parts: [[3, ' + 1/R₂ + …']], color: 'c', say: '+ 1/R₂: a second path side by side adds its own easiness: more lanes.' },
        { parts: [[0, '1/R_eq'], [1, ' = ']], say: '1/R_eq =: the easiness adds up, so the combined resistance is less than either one.' },
      ],
      vary: [{ key: 'R2', amp: 4, min: 1, max: 20, label: 'R₂', color: 'c', say: 'Vary R₂: even a very large second resistor still lowers the total a little.' }],
    }),
    'Two in parallel': play({
      own: true, values: { R1: 4, R2: 6 },
      intro: 'A shortcut for exactly two resistors in parallel.',
      scene: ({ R1, R2 }, h, k, u) => work(120, 120, [
        ['1/R = 1/R₁ + 1/R₂', u(0)],
        ['= (R₂ + R₁) ÷ (R₁R₂)', u(1), 'b'],
        ['flip it: R = R₁R₂ ÷ (R₁ + R₂)', u(2), 'a'],
        [`= ${fmt(R1)} × ${fmt(R2)} ÷ ${fmt(R1 + R2)} = ${fmt((R1 * R2) / (R1 + R2), 2)} Ω`, u(2)],
        [`smaller than ${fmt(Math.min(R1, R2))} Ω, the smaller one`, u(2), 'muted'],
      ]),
      pieces: [
        { parts: [[2, 'R₁R₂']], color: 'a', say: 'Start from 1/R = 1/R₁ + 1/R₂ and put both fractions over R₁R₂.' },
        { parts: [[3, '/(R₁ + R₂)']], color: 'b', say: 'The top becomes R₁ + R₂; flip the fraction over to get R itself.' },
        { parts: [[0, 'R_eq'], [1, ' = ']], say: 'R_eq =: “product over sum”. Equal resistors give half of one.' },
      ],
      vary: [{ key: 'R2', amp: 5, min: 1, max: 20, label: 'R₂', color: 'b', say: 'Vary R₂: when it equals R₁ the answer is exactly half.' }],
    }),
    'Junction rule': play({
      own: true, values: { i: 3, f: 0.6 },
      intro: 'A wire splits in two. Where does the current go?',
      scene: ({ i, f }, h, k, u) => {
        const J = [330, 220], i1 = i * f, i2 = i * (1 - f);
        const Win = wire([[60, 220], J]), W1 = wire([J, [480, 120], [740, 120]]), W2 = wire([J, [480, 320], [740, 320]]);
        let s = Win.svg('ink', 2 + i * 2) + W1.svg('ink', 2 + i1 * 2) + W2.svg('ink', 2 + i2 * 2) + S.circle(...J, 6, 'ink');
        s += S.fade(u(0), charges(Win, (k * 400 * i) % 22, 'b', 22, 4) + label(160, 200, `i = ${fmt(i)} A in`, { fill: 'b', weight: 600 }));
        s += S.fade(u(1), charges(W1, (k * 400 * i1) % 22, 'a', 22, 4) + label(620, 100, `i₁ = ${fmt(i1)} A`, { fill: 'a', weight: 600 }));
        s += S.fade(u(2), charges(W2, (k * 400 * i2) % 22, 'c', 22, 4) + label(620, 350, `i₂ = ${fmt(i2)} A`, { fill: 'c', weight: 600 }) + label(400, 400, `${fmt(i1)} + ${fmt(i2)} = ${fmt(i)} A`, { size: 15, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'i'], [1, ' = ']], color: 'b', say: 'i: the current arriving at the junction.' },
        { parts: [[2, 'i₁']], color: 'a', say: 'i₁: part goes one way…' },
        { parts: [[3, ' + i₂']], color: 'c', say: 'i₂: …the rest the other. Charge isn’t created or destroyed, so the parts add back to the whole.' },
      ],
      vary: [{ key: 'f', amp: 0.35, min: 0.05, max: 0.95, label: 'share in branch 1', color: 'a', say: 'Vary how it splits: the branches change, the total never does.' }],
    }),
    'Loop rule': play({
      own: true, values: { V: 12, R1: 4, R2: 2 },
      intro: 'Follow one coulomb round the circuit and track its energy.',
      scene: ({ V, R1, R2 }, h, k, u) => {
        const i = V / (R1 + R2), W = loop();
        let s = W.svg('ink', 2.5) + battery(120, 215, `${fmt(V)} V`, 'b') + resistor(200, 110, 300, 110, 'a', `${fmt(R1)} Ω`) + resistor(480, 160, 480, 270, 'c', `${fmt(R2)} Ω`) + charges(W, k * 300, 'ink');
        s += ladder([i * R1, i * R2], V, [u(0), u(1), u(2)], ['a', 'c']);
        return s;
      },
      pieces: [
        { parts: [[0, 'V'], [1, ' = ']], color: 'b', say: 'V: the battery lifts each coulomb up by V volts of energy.' },
        { parts: [[2, 'V₁']], color: 'a', say: 'V₁: it loses some going through the first resistor…' },
        { parts: [[3, ' + V₂']], color: 'c', say: 'V₂: …and the rest through the second, arriving back at the start with nothing left. Round any loop, the rises equal the drops.' },
      ],
      vary: [{ key: 'R1', amp: 3, min: 0.5, label: 'R₁', color: 'a', say: 'Vary R₁: the bigger resistor takes the bigger share of the drop.' }],
    }),
  });

  // =====================================================================
  // Measuring instruments
  // =====================================================================

  reg('e-meters', {
    'Ammeter in series': play({
      own: true, values: { V: 6, R: 3, rA: 0.5 },
      intro: 'Put an ammeter into a circuit. It becomes part of the circuit.',
      scene: ({ V, R, rA }, h, k, u) => {
        const W = loop(), i = V / (R + rA);
        let s = W.svg('ink', 2.5) + battery(120, 215, `${fmt(V)} V`, 'b') + resistor(220, 110, 340, 110, 'c', `${fmt(R)} Ω`) + charges(W, k * 300 * i, 'a');
        s += S.fade(u(0), S.rect(450, 190, 60, 50, 'card', null) + meter(480, 215, 'A', i / 3, 'a', `r_A ${fmt(rA)} Ω`));
        s += S.fade(u(1), bar(600, 340, V / R, 60, 'ink', 'without', `${fmt(V / R)} A`, 50) + bar(680, 340, i, 60, 'a', 'with meter', `${fmt(i)} A`, 50));
        s += S.fade(u(2), label(640, 90, `i = ${fmt(V)} ÷ (${fmt(R)} + ${fmt(rA)})`, { size: 14, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'V/(R']], color: 'c', say: 'V/R: without the meter, Ohm’s law gives the current.' },
        { parts: [[3, ' + r_A)']], color: 'a', say: '+ r_A: in series, the meter’s own resistance adds to the circuit’s.' },
        { parts: [[0, 'i'], [1, ' = ']], say: 'i =: so it measures slightly less than was there before. That’s why a good ammeter has almost zero resistance.' },
      ],
      vary: [{ key: 'rA', amp: 2, min: 0, max: 5, label: 'r_A', color: 'a', say: 'Vary the meter’s resistance: the bigger it is, the more it disturbs what it measures.' }],
    }),
    'Voltmeter in parallel': play({
      own: true, values: { R: 10, RV: 30 },
      intro: 'A voltmeter across a 10 kΩ resistor is a second path beside it.',
      scene: ({ R, RV }, h, k, u) => {
        const par = (R * RV) / (R + RV);
        let s = S.fade(u(0), bar(200, 360, R, 20, 'c', 'resistor alone', `${fmt(R)} kΩ`, 60));
        s += S.fade(u(1), bar(300, 360, RV, 20 * Math.min(1, 12 / RV), 'a', 'voltmeter', `${fmt(RV)} kΩ`, 60));
        s += S.fade(u(2), bar(420, 360, par, 20, 'ink', 'together', `${fmt(par, 2)} kΩ`, 60) + label(620, 120, `${fmt((par / R) * 100, 1)} % of the original`, { weight: 600, size: 15 }) + label(620, 146, 'a huge R_V keeps it near 100 %', { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'R R_V']], color: 'c', say: 'R: the part we’re measuring across.' },
        { parts: [[3, '/(R + R_V)']], color: 'a', say: 'R_V: the meter in parallel adds a second path: product over sum.' },
        { parts: [[0, 'R_∥'], [1, ' = ']], say: 'R_∥ =: the combination is lower than R, so the voltage across it drops. Only if R_V is enormous is the change negligible.' },
      ],
      vary: [{ key: 'RV', amp: 400, min: 1, max: 1000, label: 'R_V (kΩ)', color: 'a', say: 'Vary the meter’s resistance: from a terrible 1 kΩ to a good 1 MΩ.' }],
    }),
  });

  // =====================================================================
  // Power and energy
  // =====================================================================

  reg('e-power', {
    Energy: play({
      own: true, values: { P: 2, dt: 3 },
      intro: 'A heater’s power, plotted against time. The energy is the area.',
      scene: ({ P, dt }, h, k, u) => {
        const Gr = MV.phys.graph({ x0: 100, x1: 700, y0: 360, y1: 120, tMax: 8, vMax: 4, tLabel: 'hours', vLabel: 'power (kW)' });
        let s = Gr.s + S.fade(u(0), S.line(Gr.X(0), Gr.Y(P), Gr.X(8), Gr.Y(P), 'a', 2.5) + label(Gr.X(8), Gr.Y(P) - 8, `${fmt(P)} kW`, { fill: 'a', size: 12, anchor: 'end' }));
        s += S.fade(u(1), S.rect(Gr.X(0), Gr.Y(P), Gr.X(dt) - Gr.X(0), Gr.Y(0) - Gr.Y(P), 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(Gr.X(dt / 2), Gr.Y(0) + 34, `Δt = ${fmt(dt)} h`, { fill: 'b', size: 12 }));
        s += S.fade(u(2), label(Gr.X(dt / 2), Gr.Y(P / 2) + 5, `E = ${fmt(P * dt)} kWh`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'P']], color: 'a', say: 'P: power, how many kilojoules every second, or kilowatts.' },
        { parts: [[3, 'Δt']], color: 'b', say: 'Δt: for how long it runs.' },
        { parts: [[0, 'E'], [1, ' = ']], say: 'E =: the rectangle’s area. kW × hours = kWh, the unit on your electricity bill.' },
      ],
      vary: [{ key: 'dt', amp: 2.5, min: 0.5, max: 7.5, label: 'Δt', color: 'b', say: 'Vary the time: leave it on twice as long, pay twice as much.' }],
    }),
    Power: play({
      own: true, values: { V: 12, i: 2 },
      intro: 'Each coulomb carries energy from the battery and drops it in the lamp.',
      scene: ({ V, i }, h, k, u) => {
        const W = loop();
        let s = W.svg('ink', 2.5) + battery(120, 215, `${fmt(V)} V`, 'b') + resistor(240, 110, 360, 110, 'c', 'lamp', clamp01((V * i) / 60)) + charges(W, k * 400 * i, 'a');
        s += work(540, 120, [[`each coulomb: ${fmt(V)} J`, u(0), 'b'], [`${fmt(i)} coulombs every second`, u(1), 'a'], [`P = ${fmt(V)} × ${fmt(i)} = ${fmt(V * i)} J/s = ${fmt(V * i)} W`, u(2)]]);
        return s;
      },
      pieces: [
        { parts: [[2, 'V']], color: 'b', say: 'V: a volt is a joule per coulomb, so each coulomb delivers V joules.' },
        { parts: [[3, 'i']], color: 'a', say: 'i: an amp is a coulomb per second.' },
        { parts: [[0, 'P'], [1, ' = ']], say: 'P =: joules per coulomb × coulombs per second = joules per second: watts.' },
      ],
      vary: [{ key: 'i', amp: 1.5, min: 0.2, label: 'i', color: 'a', say: 'Vary the current: more charge each second, more energy each second.' }],
    }),
    'Joule heating': play({
      own: true, values: { R: 2, i: 2 },
      intro: 'A wire with resistance gets warm. How warm, as the current rises?',
      scene: ({ R, i }, h, k, u) => {
        const P = R * i * i;
        let s = S.rect(100, 160, 300, 40, 'b-soft', 'b', { rx: 20, 'stroke-width': 2 }) + S.rect(100, 160, 300, 40, 'c', null, { rx: 20, opacity: clamp01(P / 60).toFixed(2) });
        s += S.fade(u(0), label(250, 150, `R = ${fmt(R)} Ω`, { fill: 'b', size: 13 }));
        s += S.fade(u(1), work(470, 120, [[`V across it = R i = ${fmt(R * i)} V`, 1], [`P = V i = (R i) × i`, 1]]));
        s += S.fade(u(2), bar(250, 380, P, 2.5, 'c', 'heat', `${fmt(P)} W`, 70) + label(560, 230, `double the current → ×4 the heat`, { size: 14, weight: 600 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'R']], color: 'b', say: 'R: the resistance of the wire.' },
        { parts: [[3, 'i²']], color: 'c', say: 'i²: P = V i, and V = R i, so P = R i × i. The current counts twice: more charges, each losing more.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'c', say: 'P =: that’s how heaters and kettles work, and why overloaded wires get dangerously hot.' },
      ],
      vary: [{ key: 'i', amp: 2, min: 0.3, max: 5, label: 'i', color: 'c', say: 'Vary the current: the heat grows with its square.' }],
    }),
    'From voltage': play({
      own: true, values: { V: 220, R: 22 },
      intro: 'At home the voltage is fixed. How does a heater’s resistance set its power?',
      scene: ({ V, R }, h, k, u) => {
        const i = V / R, P = (V * V) / R;
        let s = work(100, 130, [[`i = V/R = ${fmt(V)} ÷ ${fmt(R)} = ${fmt(i, 1)} A`, u(1), 'a'], ['P = V i = V × V/R', u(1)], [`P = ${fmt(V)}² ÷ ${fmt(R)} = ${fmt(P, 0)} W`, u(2), 'c']]);
        s += S.fade(u(0), label(100, 100, `V = ${fmt(V)} V from the socket`, { anchor: 'start', fill: 'b', size: 14 }));
        s += S.fade(u(2), bar(620, 380, P, 0.06, 'c', 'power', `${fmt(P, 0)} W`, 70));
        return s;
      },
      pieces: [
        { parts: [[2, 'V²']], color: 'b', say: 'V²: the socket’s voltage is fixed.' },
        { parts: [[3, '/R']], color: 'a', say: '/R: a smaller resistance lets more current through, i = V/R.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'c', say: 'P =: so at fixed voltage, lower resistance means more power. A 2000 W kettle has a lower resistance than a 1000 W one.' },
      ],
      vary: [{ key: 'R', amp: 15, min: 8, max: 60, label: 'R', color: 'a', say: 'Vary the resistance: halve it and the power doubles.' }],
    }),
    'The bill': play({
      own: true, values: { E: 300, price: 0.8 },
      intro: 'At the end of the month, the meter shows how many kWh you used.',
      scene: ({ E, price }, h, k, u) => {
        let s = S.fade(u(0), S.rect(100, 120, 200, 60, 'ink', null, { rx: 6 }) + label(200, 158, `${fmt(E, 0)} kWh`, { fill: 'paper', size: 20, weight: 600 }));
        s += S.fade(u(1), label(200, 220, `× ${fmt(price, 2)} per kWh`, { fill: 'b', size: 15 }));
        const coins = Math.min(40, Math.round((E * price) / 10));
        for (let c = 0; c < coins; c++) s += S.fade(u(2), S.el('ellipse', { cx: 500 + Math.floor(c / 20) * 70, cy: 380 - (c % 20) * 10, rx: 28, ry: 7, fill: 'b-soft', stroke: 'b', 'stroke-width': 1.5 }));
        s += S.fade(u(2), label(560, 100, `cost = ${fmt(E * price, 2)}`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'E']], say: 'E: the energy used, in kilowatt-hours.' },
        { parts: [[3, ' × price']], color: 'b', say: '× price: the tariff for each kWh.' },
        { parts: [[0, 'cost'], [1, ' = ']], say: 'cost =: so the cheapest kWh is the one you don’t use.' },
      ],
      vary: [{ key: 'E', amp: 200, min: 50, max: 600, label: 'E (kWh)', color: 'ink', say: 'Vary the energy: the pile of coins grows in step.' }],
    }),
  });

  // =====================================================================
  // Safety
  // =====================================================================

  reg('e-safety', {
    'Current from power': play({
      own: true, values: { P: 2200, V: 220 },
      intro: 'A 2200 W kettle. How much current does it draw?',
      scene: ({ P, V }, h, k, u) => {
        let s = S.rect(100, 140, 120, 140, 'b-soft', 'b', { rx: 14, 'stroke-width': 2 }) + label(160, 215, 'kettle', { fill: 'b', weight: 600 });
        s += work(300, 140, [[`P = ${fmt(P)} W`, u(0), 'a'], [`V = ${fmt(V)} V`, u(1), 'b'], [`i = ${fmt(P)} ÷ ${fmt(V)} = ${fmt(P / V, 1)} A`, u(2)]]);
        s += S.fade(u(2), bar(660, 380, P / V, 9, 'c', 'current', `${fmt(P / V, 1)} A`, 60));
        return s;
      },
      pieces: [
        { parts: [[2, 'P']], color: 'a', say: 'P: the power on the label, from P = V i.' },
        { parts: [[3, '/V']], color: 'b', say: '/V: divide by the mains voltage.' },
        { parts: [[0, 'i'], [1, ' = ']], say: 'i =: the same kettle on a lower voltage supply needs more current, and thicker wires.' },
      ],
      vary: [{ key: 'V', amp: 60, min: 110, max: 240, label: 'V', color: 'b', say: 'Vary the mains voltage: at 110 V the same power needs twice the current of 220 V.' }],
    }),
    'Total current': play({
      own: true, values: { extra: 1100 },
      intro: 'Appliances on one circuit, all in parallel, each adding its current.',
      scene: ({ extra }, h, k, u) => {
        const V = 220, items = [['kettle', 2200, 'a'], ['microwave', 1200, 'c'], ['iron', extra, 'b']];
        let y = 360, s = S.line(560, 360, 720, 360, 'ink', 1.5);
        items.forEach(([name, P, col], i) => { const hgt = (P / V) * 9; s += S.fade(u(i), S.rect(600, y - hgt, 80, hgt, `${col}-soft`, col, { 'stroke-width': 1.5 }) + label(590, y - hgt / 2 + 4, `${name} ${fmt(P / V, 1)} A`, { fill: col, size: 12, anchor: 'end' })); y -= hgt; });
        const tot = (2200 + 1200 + extra) / V;
        s += S.line(560, 360 - 20 * 9, 720, 360 - 20 * 9, 'c', 2, dashed('6 4')) + label(726, 360 - 20 * 9 + 4, 'fuse 20 A', { fill: 'c', size: 12, anchor: 'start' });
        s += S.fade(u(2), label(200, 120, `total ${fmt(tot, 1)} A ${tot > 20 ? '> 20 A: the fuse blows' : '≤ 20 A: fine'}`, { weight: 600, size: 16, fill: tot > 20 ? 'c' : 'ink' }));
        return s;
      },
      pieces: [
        { parts: [[0, 'i'], [1, ' = '], [2, 'i₁']], color: 'a', say: 'i₁: the kettle’s current.' },
        { parts: [[3, ' + i₂']], color: 'c', say: '+ i₂: the microwave, in parallel, adds its own.' },
        { parts: [[4, ' + …']], color: 'b', say: '+ …: every appliance stacks up on the same supply wires and the same fuse.' },
      ],
      vary: [{ key: 'extra', amp: 1000, min: 0, max: 2200, label: 'iron (W)', color: 'b', say: 'Vary the last appliance: push the stack past the fuse’s rating and it blows.' }],
    }),
    'Short circuit': play({
      own: true, values: { V: 220, r: 0.1 },
      intro: 'Live and neutral touch: almost nothing resists the current.',
      scene: ({ V, r }, h, k, u) => {
        const i = V / r;
        let s = work(100, 140, [[`V = ${fmt(V)} V`, u(0), 'b'], [`r = ${fmt(r, 2)} Ω (just a bit of wire)`, u(1), 'c'], [`i = ${fmt(V)} ÷ ${fmt(r, 2)} = ${fmt(i, 0)} A`, u(2)]]);
        s += S.fade(u(2), bar(560, 380, 10, 1, 'a', 'kettle', '10 A', 50) + bar(660, 380, Math.min(i, 3000), 0.09, 'c', 'short', `${fmt(i, 0)} A`, 50));
        return s;
      },
      pieces: [
        { parts: [[2, 'V']], color: 'b', say: 'V: the full mains voltage…' },
        { parts: [[3, '/r']], color: 'c', say: '/r: …across a tiny resistance, a few centimetres of copper.' },
        { parts: [[0, 'i'], [1, ' = ']], say: 'i =: thousands of amps, in an instant. Only a breaker or fuse stops a fire.' },
      ],
      vary: [{ key: 'r', amp: 0.4, min: 0.02, max: 1, label: 'r', color: 'c', say: 'Vary the fault’s resistance: the smaller it is, the bigger the surge.' }],
    }),
    'Heating the wire': play({
      own: true, values: { R: 0.05, i: 10 },
      intro: 'A short piece of house wiring, 0.05 Ω. How much heat at different currents?',
      scene: ({ R, i }, h, k, u) => {
        const P = R * i * i, glow = clamp01(P / 200);
        let s = S.rect(120, 180, 320, 30, 'b-soft', 'b', { rx: 15, 'stroke-width': 2 }) + S.rect(120, 180, 320, 30, 'c', null, { rx: 15, opacity: glow.toFixed(2) }) + S.circle(280, 195, 40 + 60 * glow, 'c', null, { opacity: (0.25 * glow).toFixed(2) });
        s += S.fade(u(0), label(280, 170, `R = ${fmt(R)} Ω`, { fill: 'b', size: 13 }));
        s += S.fade(u(1), label(280, 250, `i = ${fmt(i, 0)} A`, { fill: 'a', size: 13 }));
        s += S.fade(u(2), label(600, 160, `P = ${fmt(R)} × ${fmt(i, 0)}² = ${fmt(P, 0)} W`, { weight: 600, size: 16 }) + label(600, 188, P > 100 ? 'insulation would melt' : 'barely warm', { size: 13, fill: P > 100 ? 'c' : 'muted' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'R']], color: 'b', say: 'R: even good wiring has a little resistance.' },
        { parts: [[3, 'i²']], color: 'a', say: 'i²: the heat goes with the square of the current: ten times the current, a hundred times the heat.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'c', say: 'P =: that heat inside the wall is the real danger of an overload, which is what fuses and breakers prevent.' },
      ],
      vary: [{ key: 'i', amp: 40, min: 5, max: 80, label: 'i', color: 'a', say: 'Vary the current: watch the wire go from cool to glowing.' }],
    }),
  });
})();
