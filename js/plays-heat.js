// "Show formula" plays for Heat and thermodynamics. See plays.js for the kit.
(() => {
  'use strict';
  const { S, fmt, lerp, clamp01, dashed } = MV;
  const { play, label, reg, iso } = MV.playKit;
  const { graph, bar, path, thermometer, flame, gas } = MV.phys;
  const work = (x, y, list, o = {}) => list.map(([text, u, col], i) => S.fade(u, label(x, y + i * 28, text, { anchor: 'start', size: 16, fill: col || 'ink', ...o }))).join('');

  // =====================================================================
  // Thermal expansion
  // =====================================================================

  // A rod made of 1 m pieces, each grown by `grow` pixels (exaggerated).
  const segRod = (x0, y, n, unit, grow, col = 'b') => {
    let s = '', x = x0;
    for (let i = 0; i < n; i++) { s += S.rect(x, y - 14, unit, 28, `${col}-soft`, col, { 'stroke-width': 1.5 }) + (grow > 0.3 ? S.rect(x + unit, y - 14, grow, 28, 'c', null) : ''); x += unit + grow; }
    return s;
  };
  reg('t-expansion', {
    'Linear expansion': play({
      own: true, values: { L0: 4, alpha: 12, dT: 100 },
      intro: 'A steel rail, 4 m long, on a summer day. Growth drawn 400 times bigger.',
      scene: ({ L0, alpha, dT }, h, k, u) => {
        const ex = 400 * 120, one = alpha * 1e-6 * ex; // pixels per metre per degree, exaggerated
        let s = S.fade(u(0), label(80, 120, `1 m warmed 1 °C grows α = ${fmt(alpha)} millionths of a metre`, { anchor: 'start', size: 13 }) + segRod(80, 160, 1, 120, one * 4) + label(80 + 130 + one * 4, 165, '(drawn extra big)', { anchor: 'start', size: 11, fill: 'muted' }));
        s += S.fade(u(1), label(80, 220, `1 m warmed ${fmt(dT)} °C: ${fmt(dT)} times as much`, { anchor: 'start', size: 13 }) + segRod(80, 260, 1, 120, one * dT * u(1) / 6));
        const n = Math.round(L0);
        s += S.fade(u(2), label(80, 320, `all ${fmt(L0)} metres do it`, { anchor: 'start', size: 13 }) + segRod(80, 360, n, 120, (one * dT) / 6 * (u(2))));
        s += S.fade(u(3), label(620, 110, `ΔL = ${fmt(L0)} × ${fmt(alpha)}×10⁻⁶ × ${fmt(dT)}`, { size: 14 }) + label(620, 140, `= ${fmt(L0 * alpha * 1e-6 * dT * 1000, 2)} mm`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'α']], color: 'a', say: 'α: one metre, warmed one degree, grows by α. For steel, 12 millionths of a metre.' },
        { parts: [[4, 'ΔT']], color: 'c', say: 'ΔT: warm it more degrees and it grows that many times as much.' },
        { parts: [[2, 'L₀ ']], color: 'b', say: 'L₀: and every metre of the rod does the same, so multiply by the length.' },
        { parts: [[0, 'ΔL'], [1, ' = ']], say: 'ΔL =: the total growth, the three multiplied together.' },
      ],
      vary: [{ key: 'dT', amp: 90, min: 0, max: 300, label: 'ΔT', color: 'c', say: 'Vary the temperature: the growth follows it in a straight line. Cool it and the rail shrinks.' }],
    }),
    'New length': play({
      own: true, values: { L0: 4, alpha: 12, dT: 150 },
      intro: 'Old length plus growth, written as one factor.',
      scene: ({ L0, alpha, dT }, h, k, u) => {
        const unit = 100, grow = alpha * 1e-6 * dT * 400 * unit;
        let s = S.fade(u(0), S.rect(80, 170, L0 * unit, 34, 'b-soft', 'b', { 'stroke-width': 2 }) + label(80 + (L0 * unit) / 2, 192, `L₀ = ${fmt(L0)} m`, { fill: 'b', weight: 600 }));
        s += S.fade(u(1), S.rect(80 + L0 * unit, 170, grow * u(1), 34, 'c', null) + label(80 + L0 * unit + grow / 2, 160, 'L₀αΔT', { fill: 'c', size: 12 }));
        s += work(80, 270, [['L = L₀ + L₀αΔT', u(1), 'c'], ['= L₀ × (1 + αΔT)', u(1)], [`= ${fmt(L0)} × ${fmt(1 + alpha * 1e-6 * dT, 6)} = ${fmt(L0 * (1 + alpha * 1e-6 * dT), 5)} m`, u(2)]]);
        return s;
      },
      pieces: [
        { parts: [[2, 'L₀']], color: 'b', say: 'L₀: the original length.' },
        { parts: [[3, '(1 + αΔT)']], color: 'c', say: '(1 + αΔT): it gains L₀αΔT. Pull out the L₀: the rod is multiplied by a factor just a tiny bit above 1.' },
        { parts: [[0, 'L'], [1, ' = ']], say: 'L =: the new length.' },
      ],
      vary: [{ key: 'dT', amp: 140, min: -50, max: 300, label: 'ΔT', color: 'c', say: 'Vary ΔT: negative when it cools, and the factor dips just below 1.' }],
    }),
    'Surface expansion': play({
      own: true, values: { a: 1, alpha: 23, dT: 200 },
      intro: 'A square aluminium plate. Each side grows, so the area grows twice over. Drawn 60 times bigger.',
      scene: ({ a, alpha, dT }, h, k, u) => {
        const side = 220, e = alpha * 1e-6 * dT * 60 * side * u(1), x0 = 120, y0 = 110;
        let s = S.fade(u(0), S.rect(x0, y0, side, side, 'b-soft', 'b', { 'stroke-width': 2 }) + label(x0 + side / 2, y0 + side / 2, `A₀ = ${fmt(a)} m²`, { fill: 'b', weight: 600 }));
        s += S.fade(u(1), S.rect(x0 + side, y0, e, side, 'c', null, { opacity: 0.7 }) + S.rect(x0, y0 + side, side, e, 'c', null, { opacity: 0.7 }) + S.rect(x0 + side, y0 + side, e, e, 'ink', null) +
          label(x0 + side + e + 10, y0 + side / 2, 'strip 1: A₀αΔT', { fill: 'c', anchor: 'start', size: 12 }) + label(x0 + side / 2, y0 + side + e + 20, 'strip 2: A₀αΔT', { fill: 'c', size: 12 }) + label(x0 + side + e + 10, y0 + side + e + 14, 'tiny corner: ignore', { fill: 'muted', anchor: 'start', size: 11 }));
        s += S.fade(u(3), label(600, 140, `ΔA ≈ 2 strips = 2αΔT × A₀`, { size: 14 }) + label(600, 170, `= ${fmt(a * 2 * alpha * 1e-6 * dT * 1e4, 1)} cm²`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'A₀']], color: 'b', say: 'A₀: the plate’s area.' },
        { parts: [[3, ' · 2α']], color: 'c', say: '2α: the plate grows sideways and downwards, two strips each A₀αΔT. The corner piece is a millionth of a millionth: negligible.' },
        { parts: [[4, ' · ΔT']], color: 'c', say: 'ΔT: both strips grow with the temperature rise.' },
        { parts: [[0, 'ΔA'], [1, ' = ']], say: 'ΔA =: so the surface coefficient is β = 2α.' },
      ],
      vary: [{ key: 'dT', amp: 180, min: 0, max: 400, label: 'ΔT', color: 'c', say: 'Vary ΔT: both strips thicken together.' }],
    }),
    'Volume expansion': play({
      own: true, values: { alpha: 12, dT: 300 },
      intro: 'A steel cube. It grows in three directions at once. Drawn 80 times bigger.',
      scene: ({ alpha, dT }, h, k, u) => {
        const side = 160, e = alpha * 1e-6 * dT * 80 * side * u(1);
        let s = S.fade(u(0), iso(120, 340, side, side, side, 'b-soft', 'b') + label(200, 270, 'V₀', { fill: 'b', weight: 600, size: 18 }));
        s += S.fade(u(1), iso(120 + side, 340, e, side, side, 'c-soft', 'c') + iso(120, 340 - side, side, e, side, 'c-soft', 'c') +
          label(130 + side + e + 70, 260, '3 slabs, each V₀αΔT', { fill: 'c', anchor: 'start', size: 13 }) + label(130 + side + e + 70, 284, '(front, side and top)', { fill: 'muted', anchor: 'start', size: 12 }));
        s += S.fade(u(3), label(600, 140, `γ = 3α = ${fmt(3 * alpha)}×10⁻⁶ per °C`, { size: 14 }) + label(600, 170, `ΔV/V₀ = ${fmt(3 * alpha * 1e-6 * dT * 100, 3)} %`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'V₀']], color: 'b', say: 'V₀: the starting volume.' },
        { parts: [[3, ' · 3α']], color: 'c', say: '3α: each of the three directions adds a thin slab of V₀αΔT. Three slabs: γ = 3α.' },
        { parts: [[4, ' · ΔT']], color: 'c', say: 'ΔT: all three thicken with the temperature.' },
        { parts: [[0, 'ΔV'], [1, ' = ']], say: 'ΔV =: liquids don’t have a shape, so for them γ is measured directly, and it’s much bigger.' },
      ],
      vary: [{ key: 'dT', amp: 250, min: 0, max: 600, label: 'ΔT', color: 'c', say: 'Vary ΔT: the three slabs grow together.' }],
    }),
    'Apparent expansion': play({
      own: true, values: { V0: 1000, gl: 11, gf: 0.27, dT: 50 },
      intro: 'Alcohol in a glass flask, warmed. Both expand; only the difference shows.',
      scene: ({ V0, gl, gf, dT }, h, k, u) => {
        const sc = 0.035, liq = V0 * gl * 1e-4 * dT, fl = V0 * gf * 1e-4 * dT;
        const bx = 140, by = 360, w = 90;
        let s = S.fade(u(0), S.rect(bx, by - V0 * 0.18, w, V0 * 0.18, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(bx + w / 2, by + 20, `V₀ = ${fmt(V0)} cm³`, { fill: 'a', size: 12 }));
        s += S.fade(u(1), S.rect(bx, by - V0 * 0.18 - liq / sc / 20, w, liq / sc / 20, 'a', null) + label(bx + w + 10, by - V0 * 0.18 - liq / sc / 40, `liquid grows ${fmt(liq, 1)} cm³`, { fill: 'a', anchor: 'start', size: 12 }));
        s += S.fade(u(2), S.rect(bx + 300, by - V0 * 0.18 - fl / sc / 20, w, V0 * 0.18 + fl / sc / 20, null, 'ink', { 'stroke-width': 2.5 }) + label(bx + 300 + w / 2, by + 20, `flask grows ${fmt(fl, 1)} cm³`, { size: 12 }));
        s += S.fade(u(3), label(560, 120, `${fmt(liq, 1)} − ${fmt(fl, 1)} = ${fmt(liq - fl, 1)} cm³ up the neck`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'V₀(']], color: 'a', say: 'V₀: the liquid in the flask.' },
        { parts: [[3, 'γ_liq']], color: 'a', say: 'γ_liq: the liquid expands by V₀γ_liqΔT.' },
        { parts: [[4, ' − γ_flask)']], say: '− γ_flask: but the flask expands too, making room for some of it.' },
        { parts: [[5, 'ΔT'], [0, 'ΔV_app'], [1, ' = ']], color: 'c', say: 'ΔV_app =: only the difference is pushed up the neck.' },
      ],
      vary: [{ key: 'gl', amp: 9, min: 0.5, max: 20, label: 'γ_liq', color: 'a', say: 'Vary the liquid: with water (γ ≈ 2×10⁻⁴) the rise is small; mercury and alcohol are used in thermometers because they rise well.' }],
    }),
  });

  // =====================================================================
  // Calorimetry
  // =====================================================================

  // Grid of little energy packets: cols × rows, coloured.
  const packets = (x0, y0, cols, rows, col, o = 1, size = 14) => { let s = ''; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) s += S.rect(x0 + i * (size + 3), y0 + j * (size + 3), size, size, `${col}-soft`, col, { rx: 3, 'stroke-width': 1.2, opacity: o }); return s; };
  reg('t-calor', {
    'Sensible heat': play({
      own: true, values: { m: 3, c: 4186, dT: 5 },
      intro: 'Warm some water. Each square below is 4186 J, the heat for 1 kg and 1 °C.',
      scene: ({ m, c, dT }, h, k, u) => {
        const M = Math.max(1, Math.round(m)), D = Math.max(1, Math.round(dT));
        let s = S.fade(u(0), packets(80, 120, 1, 1, 'b') + label(110, 132, `1 kg, 1 °C: c = ${fmt(c)} J`, { anchor: 'start', size: 13 }));
        s += S.fade(u(1), packets(80, 170, M, 1, 'b') + label(90 + M * 17, 182, `${fmt(m)} kg, 1 °C: m × c`, { anchor: 'start', size: 13 }));
        s += S.fade(u(2), packets(80, 220, M, Math.round(D * u(2)) || 1, 'c') + label(90 + M * 17, 236, `${fmt(m)} kg, ${fmt(dT)} °C: × ΔT`, { anchor: 'start', size: 13 }));
        s += S.fade(u(3), label(560, 140, `Q = ${fmt(m)} × ${fmt(c)} × ${fmt(dT)}`, { size: 15 }) + label(560, 170, `= ${fmt(m * c * dT, 0)} J`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'c']], color: 'b', say: 'c: the specific heat, the joules that warm 1 kg by 1 °C. For water it’s 4186 J, a lot; for iron only 450 J.' },
        { parts: [[2, 'm']], color: 'b', say: 'm: twice the water needs twice the heat.' },
        { parts: [[4, 'ΔT']], color: 'c', say: 'ΔT: and each extra degree needs that again.' },
        { parts: [[0, 'Q'], [1, ' = ']], say: 'Q =: the heat is the three multiplied: every kilogram, every degree.' },
      ],
      vary: [{ key: 'dT', amp: 4, min: 1, max: 10, label: 'ΔT', color: 'c', say: 'Vary ΔT: one more row of packets for every degree.' }],
    }),
    'Latent heat': play({
      own: true, values: { m: 1, L: 334 },
      intro: 'Ice at exactly 0 °C on a steady heater. Heat goes in; the thermometer doesn’t budge.',
      scene: ({ m, L }, h, k, u) => {
        const melt = u(1);
        let s = flame(220, 370, k * 30, 1.2) + S.rect(130, 230, 180, 110, 'card', 'ink', { 'stroke-width': 2.5 });
        s += S.rect(133, 337 - 60 * melt, 174, 60 * melt, 'a-soft', null);
        for (let i = 0; i < 5; i++) { const sz = 34 * (1 - melt) ** 0.7; if (sz > 1) s += S.rect(145 + i * 32, 330 - sz, sz, sz, 'card', 'a', { rx: 4, 'stroke-width': 1.5 }); }
        s += thermometer(350, 220, 110, 0.35, 'c', '0 °C');
        s += S.fade(u(0), label(560, 150, `each kg needs L = ${fmt(L)} kJ to melt`, { size: 14 }));
        s += S.fade(u(1), label(560, 180, `${fmt(m)} kg × ${fmt(L)} kJ/kg`, { size: 14 }));
        s += S.fade(u(2), label(560, 214, `Q = ${fmt(m * L)} kJ, still 0 °C`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'L']], color: 'a', say: 'L: the latent heat, the energy needed to break the ice crystal apart, per kilogram. It doesn’t raise the temperature at all.' },
        { parts: [[2, 'm']], color: 'b', say: 'm: more ice, proportionally more heat.' },
        { parts: [[0, 'Q'], [1, ' = ']], say: 'Q =: only when the last crystal melts will the temperature start rising again.' },
      ],
      vary: [{ key: 'm', amp: 1.5, min: 0.2, label: 'm', color: 'b', say: 'Vary the mass of ice: the heat needed scales with it.' }],
    }),
    'Heat capacity': play({
      own: true, values: { m: 2, c: 4186 },
      intro: 'How many joules to warm a whole object by 1 °C?',
      scene: ({ m, c }, h, k, u) => {
        const C = m * c, sc = 220 / 20000;
        let s = S.fade(u(0), label(80, 120, `${fmt(m)} kg of water`, { anchor: 'start', size: 14, fill: 'b' }));
        s += S.fade(u(1), label(80, 150, `× ${fmt(c)} J per kg per °C`, { anchor: 'start', size: 14 }));
        s += S.fade(u(2), bar(480, 370, C, sc, 'b', 'water', `${fmt(C, 0)} J/°C`, 60) + bar(580, 370, m * 450, sc, 'muted', 'same mass of iron', `${fmt(m * 450, 0)} J/°C`, 60));
        return s;
      },
      pieces: [
        { parts: [[2, 'm']], color: 'b', say: 'm: the mass of the object.' },
        { parts: [[3, 'c']], say: 'c: its material’s specific heat.' },
        { parts: [[0, 'C'], [1, ' = ']], color: 'b', say: 'C =: the heat capacity, joules per degree for the whole thing. Water’s is about 9 times iron’s, which is why a pan heats faster than the water in it.' },
      ],
      vary: [{ key: 'm', amp: 1.6, min: 0.2, label: 'm', color: 'b', say: 'Vary the mass: a bigger object soaks up more heat for each degree.' }],
    }),
    Equilibrium: play({
      own: true, values: { mh: 1, Th: 80, mc: 1, Tc: 20 },
      intro: 'A hot block dropped into cold water, in an insulated box.',
      scene: ({ mh, Th, mc, Tc }, h, k, u) => {
        const T = (mh * Th + mc * Tc) / (mh + mc), qh = -mh * 4.186 * (Th - T), qc = mc * 4.186 * (T - Tc), sc = 150 / Math.max(1, Math.abs(qc));
        let s = S.fade(u(0), bar(250, 250, qh, sc, 'c', 'hot: loses', `${fmt(qh, 0)} kJ`, 60));
        s += S.fade(u(1), bar(350, 250, qc, sc, 'a', 'cold: gains', `+${fmt(qc, 0)} kJ`, 60));
        s += S.line(180, 250, 420, 250, 'ink', 1.5);
        s += S.fade(u(2), label(600, 200, `${fmt(qh, 0)} + ${fmt(qc, 0)} = 0`, { weight: 600, size: 18 }) + label(600, 230, `both end at ${fmt(T, 1)} °C`, { size: 14 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'Q_lost']], color: 'c', say: 'Q_lost: the hot body gives up heat, so its Q is negative.' },
        { parts: [[1, ' + Q_gained']], color: 'a', say: '+ Q_gained: the cold body takes it in: positive.' },
        { parts: [[2, ' = 0']], say: '= 0: in an insulated box nothing escapes, so every joule lost is a joule gained.' },
      ],
      vary: [{ key: 'Th', amp: 15, min: 40, max: 100, label: 'T_hot', color: 'c', say: 'Vary the hot temperature: both bars change, always exactly balancing.' }],
    }),
    Mixing: play({
      own: true, values: { m1: 1, T1: 80, m2: 2, T2: 20 },
      intro: 'Mixing water is like balancing a seesaw on a thermometer scale.',
      scene: ({ m1, T1, m2, T2 }, h, k, u) => {
        const T = (m1 * T1 + m2 * T2) / (m1 + m2), X = (t) => 100 + t * 6, y = 250;
        let s = S.line(X(0), y, X(100), y, 'ink', 3);
        for (let t = 0; t <= 100; t += 20) s += S.line(X(t), y, X(t), y + 8, 'ink', 1.5) + label(X(t), y + 24, `${t} °C`, { fill: 'muted', size: 11 });
        s += S.fade(u(0), S.rect(X(T1) - 15 * m1, y - 30 * m1, 30 * m1, 30 * m1, 'c-soft', 'c', { 'stroke-width': 2 }) + label(X(T1), y - 30 * m1 - 8, `${fmt(m1)} kg at ${fmt(T1)} °C`, { fill: 'c', size: 12 }) +
          S.rect(X(T2) - 15 * m2, y - 30 * m2, 30 * m2, 30 * m2, 'a-soft', 'a', { 'stroke-width': 2 }) + label(X(T2), y - 30 * m2 - 8, `${fmt(m2)} kg at ${fmt(T2)} °C`, { fill: 'a', size: 12 }));
        s += S.fade(u(1), S.poly([[X(T), y + 2], [X(T) - 14, y + 30], [X(T) + 14, y + 30]], 'ink', null));
        s += S.fade(u(2), label(X(T), y + 60, `balance point: ${fmt(T, 1)} °C`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[2, '(m₁T₁ + m₂T₂)']], color: 'c', say: 'Each portion of water is a weight placed at its temperature on the scale.' },
        { parts: [[3, '/(m₁ + m₂)']], color: 'a', say: 'Divide by the total mass: that finds the balance point of the seesaw, the weighted average.' },
        { parts: [[0, 'T'], [1, ' = ']], say: 'T =: the final temperature. The heavier side pulls it closer.' },
      ],
      vary: [{ key: 'm2', amp: 1.8, min: 0.2, label: 'm₂', color: 'a', say: 'Vary the cold water: more of it and the balance point slides toward its temperature.' }],
    }),
  });

  // =====================================================================
  // Heat transfer
  // =====================================================================

  reg('t-transfer', {
    Conduction: play({
      own: true, values: { kk: 1, A: 1, dT: 20, L: 0.1 },
      intro: 'Heat leaking through a wall: warm room on the left, cold outside on the right.',
      scene: ({ kk, A, dT, L }, h, k, u) => {
        const wx = 330, ww = L * 1000, hh = 60 + A * 100, y0 = 230 - hh / 2, flow = (kk * A * dT) / L;
        let s = S.rect(80, 60, wx - 80, 330, 'c-soft', null, { opacity: 0.5 }) + S.rect(wx + ww, 60, 760 - wx - ww, 330, 'a-soft', null, { opacity: 0.5 }) + label(150, 90, 'warm', { fill: 'c' }) + label(700, 90, 'cold', { fill: 'a' });
        s += S.rect(wx, y0, ww, hh, 'b-soft', 'b', { 'stroke-width': 2 });
        s += S.fade(u(0), label(wx + ww / 2, y0 - 12, `k = ${fmt(kk)} (brick)`, { fill: 'b', size: 12 }));
        s += S.fade(u(1), label(wx + ww / 2, y0 + hh + 20, `A = ${fmt(A)} m²`, { size: 12 }));
        s += S.fade(u(2), label(200, 380, `ΔT = ${fmt(dT)} °C`, { fill: 'c', size: 13 }));
        s += S.fade(u(3), S.line(wx, y0 + hh + 34, wx + ww, y0 + hh + 34, 'ink', 2) + label(wx + ww / 2, y0 + hh + 52, `L = ${fmt(L * 100)} cm`, { size: 12 }));
        const n = Math.min(12, Math.round(flow / 20) + 1);
        for (let i = 0; i < n; i++) { const yy = y0 + ((i + 0.5) * hh) / n; s += S.fade(u(4), S.arrow(wx - 40, yy, wx + ww + 50, yy, 'c', 2)); }
        s += S.fade(u(4), label(620, 150, `Φ = ${fmt(kk)} × ${fmt(A)} × ${fmt(dT)} ÷ ${fmt(L)}`, { size: 14 }) + label(620, 180, `= ${fmt(flow, 0)} W`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'k']], color: 'b', say: 'k: how well the material conducts. Copper 400, brick about 1, foam 0.03.' },
        { parts: [[3, 'A']], say: 'A: a bigger wall lets more heat through, side by side.' },
        { parts: [[4, 'ΔT']], color: 'c', say: 'ΔT: the bigger the temperature difference, the harder heat is pushed through.' },
        { parts: [[5, '/L']], say: '/L: but a thicker wall slows it down: the drop is spread over more distance.' },
        { parts: [[0, 'Φ'], [1, ' = ']], color: 'c', say: 'Φ =: the heat flow in watts, joules every second.' },
      ],
      vary: [{ key: 'L', amp: 0.08, min: 0.03, max: 0.25, label: 'L', color: 'b', say: 'Vary the thickness: double the wall, half the heat loss. That’s what insulation buys you.' }],
    }),
    Radiation: play({
      own: true, values: { T: 600 },
      intro: 'A metal ball heated in a furnace. It glows, giving off energy as radiation.',
      scene: ({ T }, h, k, u) => {
        const P = (T / 600) ** 4, glow = clamp01((T - 700) / 800);
        let s = S.circle(220, 230, 60 + 60 * Math.min(1, P / 8) * u(2), 'b', null, { opacity: (0.15 * u(2)).toFixed(2) }) + S.circle(220, 230, 50, 'ink-soft', 'ink', { 'stroke-width': 2 }) + S.circle(220, 230, 50, 'c', null, { opacity: glow.toFixed(2) });
        s += S.fade(u(0), label(220, 320, 'σ: a constant of nature', { fill: 'muted', size: 12 }));
        s += S.fade(u(1), label(220, 150, 'A: its surface area', { size: 12 }));
        s += S.fade(u(2), bar(560, 370, P, 260 / 16, 'c', `${fmt(T)} K`, `× ${fmt(P, 2)}`, 60) + bar(660, 370, 1, 260 / 16, 'muted', '600 K', '× 1', 60) + label(610, 90, 'power radiated', { size: 13 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'σ']], say: 'σ = 5.67×10⁻⁸ W/m²K⁴: the Stefan–Boltzmann constant.' },
        { parts: [[3, 'A']], say: 'A: more surface, more glow.' },
        { parts: [[4, 'T⁴']], color: 'c', say: 'T⁴: the temperature in kelvin, to the fourth power. Double it and the power goes up 16 times.' },
        { parts: [[0, 'P'], [1, ' = ']], color: 'c', say: 'P =: everything above absolute zero radiates, even you, mostly in infrared.' },
      ],
      vary: [{ key: 'T', amp: 600, min: 300, max: 1200, label: 'T', color: 'c', say: 'Vary the temperature: the power climbs explosively as it gets hotter, and the ball starts to glow red.' }],
    }),
    'Wien’s law': play({
      own: true, values: { T: 5800 },
      intro: 'How much light a hot body gives off at each wavelength.',
      scene: ({ T }, h, k, u) => {
        const B = (nm, TT) => { const l = nm * 1e-9; return 1 / (l ** 5 * (Math.exp(0.014388 / (l * TT)) - 1)); };
        const peak = 2.898e6 / T, norm = B(2.898e6 / 5800, 5800), top = Math.max(1.1, (B(peak, T) / norm) * 1.1);
        const Gr = graph({ x0: 110, x1: 700, y0: 360, y1: 120, tMax: 2000, vMax: top, tLabel: 'wavelength (nm)', vLabel: top > 1.15 ? `brightness (scale × ${fmt(top / 1.1, 1)})` : 'brightness', ticks: false });
        let s = Gr.s;
        for (let nm = 380; nm < 750; nm += 10) s += S.rect(Gr.X(nm), Gr.Y(0) + 4, Gr.X(10) - Gr.X(0) + 0.5, 8, MV.phys.spectral(nm), null);
        s += S.fade(u(0), S.path(path(120, (q) => { const nm = 100 + q * 1900; return [Gr.X(nm), Gr.Y(B(nm, T) / norm)]; }), 'c', 2.5));
        s += S.fade(u(1), S.line(Gr.X(peak), Gr.Y(0), Gr.X(peak), Gr.Y(B(peak, T) / norm), 'ink', 1.5, dashed('4 4')) + label(Gr.X(peak), 105, `peak ${fmt(peak, 0)} nm`, { weight: 600, size: 13 }));
        s += S.fade(u(2), label(560, 170, `λ = 2 898 000 ÷ ${fmt(T)} K`, { size: 14, anchor: 'start' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'b']], say: 'b ≈ 2.9 mm·K: Wien’s constant.' },
        { parts: [[3, '/T']], color: 'c', say: '/T: divide by the temperature in kelvin. Hotter means a shorter wavelength at the peak.' },
        { parts: [[0, 'λ_max'], [1, ' = ']], say: 'λ_max =: the Sun, at 5800 K, peaks in visible light; a 3000 K bulb in the red and infrared; you, at 310 K, near 10 000 nm.' },
      ],
      vary: [{ key: 'T', amp: 2600, min: 2500, max: 9000, label: 'T', color: 'c', say: 'Vary the temperature: the hump grows taller and slides toward blue as it heats, toward infrared as it cools.' }],
    }),
    Cooling: play({
      own: true, values: { T0: 90, Tr: 20, kk: 0.08 },
      intro: 'A cup of tea left on the table.',
      scene: ({ T0, Tr, kk }, h, k, u) => {
        const Gr = graph({ x0: 110, x1: 700, y0: 370, y1: 120, tMax: 60, vMax: 100, tLabel: 'minutes', vLabel: 'temperature (°C)' });
        let s = Gr.s + S.fade(u(0), S.line(Gr.X(0), Gr.Y(Tr), Gr.X(60), Gr.Y(Tr), 'a', 2, dashed('5 4')) + label(Gr.X(60), Gr.Y(Tr) - 8, `room ${fmt(Tr)} °C`, { fill: 'a', size: 12, anchor: 'end' }));
        s += S.fade(u(1), S.line(Gr.X(0), Gr.Y(Tr), Gr.X(0), Gr.Y(T0), 'c', 4) + label(Gr.X(0) + 8, Gr.Y((T0 + Tr) / 2), `gap ${fmt(T0 - Tr)} °C`, { fill: 'c', size: 12, anchor: 'start' }));
        s += S.fade(u(2), S.path(path(80, (q) => [Gr.X(q * 60), Gr.Y(Tr + (T0 - Tr) * Math.exp(-kk * q * 60))]), 'c', 2.5));
        const half = Math.log(2) / kk;
        for (let i = 1; i <= 3; i++) if (half * i < 60) s += S.fade(u(2), S.circle(Gr.X(half * i), Gr.Y(Tr + (T0 - Tr) / 2 ** i), 5, 'ink') + label(Gr.X(half * i) + 6, Gr.Y(Tr + (T0 - Tr) / 2 ** i) - 8, `gap ÷ ${2 ** i}`, { size: 11, anchor: 'start' }));
        return s;
      },
      pieces: [
        { parts: [[2, 'T_r']], color: 'a', say: 'T_r: the tea ends up at room temperature.' },
        { parts: [[3, ' + (T₀ − T_r)']], color: 'c', say: '(T₀ − T_r): the gap between the tea and the room drives the cooling.' },
        { parts: [[4, 'e⁻ᵏᵗ'], [0, 'T'], [1, ' = ']], color: 'c', say: 'e^(−kt): the gap shrinks by the same fraction every minute, halving again and again. Hot tea cools fast; nearly-cold tea slowly.' },
      ],
      vary: [{ key: 'kk', amp: 0.06, min: 0.01, max: 0.2, label: 'k', color: 'c', say: 'Vary k: a lid or an insulated mug makes k small, and the curve stretches out.' }],
    }),
  });

  // =====================================================================
  // First law of thermodynamics
  // =====================================================================

  const cyl = (cx, by, w, top, t, hot) => S.line(cx - w / 2, by - 230, cx - w / 2, by, 'ink', 3) + S.line(cx + w / 2, by - 230, cx + w / 2, by, 'ink', 3) + S.line(cx - w / 2, by, cx + w / 2, by, 'ink', 3) +
    gas(18, { x0: cx - w / 2 + 3, y0: top + 2, x1: cx + w / 2 - 3, y1: by - 3 }, 60 + 100 * hot, t, 4, hot) + S.rect(cx - w / 2 + 3, top - 16, w - 6, 16, 'ink-soft', 'ink', { 'stroke-width': 2 });
  reg('t-first', {
    'First law': play({
      own: true, values: { Q: 500, W: 200 },
      intro: 'Think of the gas’s internal energy as a bank balance.',
      scene: ({ Q, W }, h, k, u) => {
        const sc = 0.18, base = 290, x = 420;
        let s = cyl(170, 360, 140, 200 - (W / 1000) * 60 * u(1), k * 3, clamp01(0.4 + ((Q - W) / 1000) * u(2)));
        s += S.fade(u(0), bar(x, base, Q, sc, 'b', 'deposit: heat Q', `+${fmt(Q)} J`, 60));
        s += S.fade(u(1), bar(x + 110, base, -W, sc, 'a', 'withdrawal: work W', `−${fmt(W)} J`, 60));
        s += S.fade(u(2), bar(x + 220, base, Q - W, sc, 'c', 'balance change ΔU', `${fmt(Q - W)} J`, 60));
        s += S.line(x - 40, base, x + 260, base, 'ink', 1.5);
        return s;
      },
      pieces: [
        { parts: [[2, 'Q']], color: 'b', say: 'Q: heat flowing in is a deposit.' },
        { parts: [[3, ' − W']], color: 'a', say: '− W: work the gas does pushing the piston is a withdrawal.' },
        { parts: [[0, 'ΔU'], [1, ' = ']], color: 'c', say: 'ΔU =: the change in the balance. Energy is never created or lost, only moved around.' },
      ],
      vary: [{ key: 'W', amp: 450, min: 0, max: 1000, label: 'W', color: 'a', say: 'Vary the work: withdraw more than you deposit and the balance falls: the gas cools.' }],
    }),
    'Work at constant pressure': play({
      own: true, values: { p: 200, dV: 2 },
      intro: 'Gas pushing a piston of area A at a steady pressure.',
      scene: ({ p, dV }, h, k, u) => {
        const cx = 170, by = 370, w = 150, top0 = 260, rise = dV * 40 * u(1);
        let s = cyl(cx, by, w, top0 - rise, k * 3, 0.5);
        s += S.fade(u(0), S.arrow(cx, top0 - rise - 50, cx, top0 - rise - 100, 'b', 3) + label(cx + 10, top0 - rise - 80, 'force = p × A', { fill: 'b', size: 12, anchor: 'start' }));
        s += S.fade(u(1), S.line(cx + w / 2 + 20, top0, cx + w / 2 + 20, top0 - rise, 'a', 3) + label(cx + w / 2 + 28, top0 - rise / 2, 'moves d', { fill: 'a', size: 12, anchor: 'start' }));
        s += work(380, 140, [['work = force × distance', u(0)], ['= p × A × d', u(1), 'b'], ['A × d is the extra volume ΔV', u(1), 'a'], [`W = ${fmt(p)} kPa × ${fmt(dV)} L = ${fmt(p * dV)} J`, u(2)]]);
        return s;
      },
      pieces: [
        { parts: [[2, 'p']], color: 'b', say: 'p: pressure is force per area, so the gas pushes the piston with p × A.' },
        { parts: [[3, 'ΔV']], color: 'a', say: 'ΔV: the piston moves d; area × distance is the volume swept out.' },
        { parts: [[0, 'W'], [1, ' = ']], say: 'W =: force × distance = p × A × d = p ΔV.' },
      ],
      vary: [{ key: 'dV', amp: 1.6, min: 0.2, label: 'ΔV', color: 'a', say: 'Vary the expansion: the work grows in step.' }],
    }),
    'Ideal gas': play({
      own: true, values: { T: 300, n: 1 },
      intro: 'Gas in a box. Pressure comes from molecules hammering on the walls.',
      scene: ({ T, n }, h, k, u) => {
        const hot = clamp01((T - 150) / 600), cx = 220, by = 370, w = 220, top = 150;
        let s = S.rect(cx - w / 2, top, w, by - top, 'card', 'ink', { 'stroke-width': 3 }) + gas(Math.round(10 * n), { x0: cx - w / 2 + 3, y0: top + 3, x1: cx + w / 2 - 3, y1: by - 3 }, 40 + 0.4 * T, k * 4, 6, hot);
        const p = (n * 8.314 * T) / 0.0224 / 1000;
        s += S.fade(u(1), label(560, 140, `${fmt(n)} mol`, { fill: 'b', size: 14 }));
        s += S.fade(u(2), label(560, 170, `at ${fmt(T)} K`, { fill: 'c', size: 14 }));
        s += S.fade(u(3), label(560, 210, `in 22.4 L: p = ${fmt(p, 0)} kPa`, { weight: 600, size: 16 }));
        return s;
      },
      pieces: [
        { parts: [[0, 'pV']], say: 'pV: pressure times volume. Squeeze the box smaller and the same molecules hit the walls more often.' },
        { parts: [[1, ' = n']], color: 'b', say: 'n: more molecules (moles), more hits.' },
        { parts: [[2, 'R']], say: 'R = 8.31 J/(mol·K): the gas constant, the same for every gas.' },
        { parts: [[3, 'T']], color: 'c', say: 'T: hotter molecules move faster and hit harder and more often. T must be in kelvin.' },
      ],
      vary: [{ key: 'T', amp: 250, min: 100, max: 800, label: 'T', color: 'c', say: 'Vary the temperature: the molecules speed up and the pressure rises in proportion.' }],
    }),
    Isothermal: play({
      own: true, values: { Q: 400 },
      intro: 'A gas expanding slowly while touching a big warm block, so its temperature never changes.',
      scene: ({ Q }, h, k, u) => {
        const sc = 0.3;
        let s = cyl(170, 360, 140, 200 - (Q / 1000) * 80 * u(1), k * 3, 0.5) + S.rect(90, 362, 160, 22, 'c', null, { rx: 4 }) + label(170, 378, 'warm block', { fill: 'paper', size: 11 }) + thermometer(280, 160, 120, 0.55, 'c', 'steady');
        s += S.fade(u(0), label(420, 120, 'same temperature → ΔU = 0', { anchor: 'start', size: 14 }));
        s += S.fade(u(1), bar(470, 340, Q, sc, 'b', 'heat in', `${fmt(Q)} J`, 60) + bar(570, 340, Q, sc, 'a', 'work out', `${fmt(Q)} J`, 60));
        return s;
      },
      pieces: [
        { parts: [[0, 'ΔU = 0']], say: 'ΔU = 0: for an ideal gas, internal energy depends only on temperature. Same temperature, same U.' },
        { parts: [[1, ' ⇒ Q = W']], color: 'b', say: '⇒ Q = W: so every joule of heat that flows in leaves straight away as work.' },
      ],
      vary: [{ key: 'Q', amp: 350, min: 0, max: 1000, label: 'Q', color: 'b', say: 'Vary the heat: the work matches it exactly.' }],
    }),
    Adiabatic: play({
      own: true, values: { W: -300 },
      intro: 'A gas in an insulated cylinder: no heat can get in or out.',
      scene: ({ W }, h, k, u) => {
        const hot = clamp01(0.5 - (W / 1000) * u(1)), top = 200 + (W / 1000) * 120 * u(1);
        let s = S.rect(90, 120, 160, 260, null, 'muted', { 'stroke-width': 8, opacity: 0.4 }) + cyl(170, 360, 140, top, k * 3, hot) + thermometer(290, 160, 120, hot, 'c', W < 0 ? 'heats' : 'cools');
        s += S.fade(u(0), label(420, 120, 'insulated: Q = 0', { anchor: 'start', size: 14 }));
        s += S.fade(u(1), bar(470, 280, W, 0.2, 'a', W < 0 ? 'work done on it' : 'work it does', `W = ${fmt(W)} J`, 60) + bar(570, 280, -W, 0.2, 'c', 'ΔU', `${fmt(-W)} J`, 60) + S.line(430, 280, 620, 280, 'ink', 1.5));
        return s;
      },
      pieces: [
        { parts: [[0, 'Q = 0']], say: 'Q = 0: nothing gets through the insulation (or it happens too fast for heat to flow).' },
        { parts: [[1, ' ⇒ ΔU = −W']], color: 'c', say: '⇒ ΔU = −W: squeeze it (W negative) and its energy rises: it heats up. Let it expand (W positive) and it pays from its own energy: it cools.' },
      ],
      vary: [{ key: 'W', amp: 500, min: -600, max: 600, label: 'W', color: 'a', say: 'Vary W from squeezing to expanding: the thermometer swings from hot to cold.' }],
    }),
  });

  // =====================================================================
  // Heat engines
  // =====================================================================

  reg('t-engines', {
    Efficiency: play({
      own: true, values: { W: 300 },
      intro: 'A car engine burns fuel and gets 1000 J of heat. Where does it go?',
      scene: ({ W }, h, k, u) => {
        const x0 = 100, y = 200, L = 560;
        let s = S.fade(u(1), S.rect(x0, y, L, 50, 'c-soft', 'c', { 'stroke-width': 1.5 }) + label(x0 + L / 2, y - 12, 'Q_H = 1000 J of heat from the fuel', { fill: 'c', size: 13 }));
        s += S.fade(u(0), S.rect(x0, y, L * (W / 1000), 50, 'b', null, { opacity: 0.8 }) + label(x0 + (L * (W / 1000)) / 2, y + 31, `W = ${fmt(W)} J`, { fill: 'paper', weight: 600, size: 13 }));
        s += S.fade(u(1), label(x0 + L * (W / 1000) + (L * (1 - W / 1000)) / 2, y + 31, `${fmt(1000 - W)} J out the exhaust and radiator`, { size: 12 }));
        s += S.fade(u(2), label(400, 330, `η = ${fmt(W)} ÷ 1000 = ${fmt(W / 10, 0)} %`, { weight: 600, size: 18 }));
        return s;
      },
      pieces: [
        { parts: [[2, 'W']], color: 'b', say: 'W: the useful work, turning the wheels.' },
        { parts: [[3, '/Q_H']], color: 'c', say: '/Q_H: out of all the heat the fuel gave.' },
        { parts: [[0, 'η'], [1, ' = ']], say: 'η =: the efficiency, the useful fraction. Car engines manage about 25–35 %.' },
      ],
      vary: [{ key: 'W', amp: 200, min: 50, max: 650, label: 'W', color: 'b', say: 'Vary the work: the efficiency bar slides, but it can never reach 100 %.' }],
    }),
    'Energy balance': play({
      own: true, values: { QC: 700 },
      intro: 'Each cycle, energy in must equal energy out.',
      scene: ({ QC }, h, k, u) => {
        const sc = 0.25, base = 350;
        let s = S.fade(u(1), bar(250, base, 1000, sc, 'c', 'heat in Q_H', '1000 J', 70));
        s += S.fade(u(2), bar(370, base, QC, sc, 'a', 'heat out Q_C', `${fmt(QC)} J`, 70));
        s += S.fade(u(0), S.rect(335, base - 1000 * sc, 70, (1000 - QC) * sc, 'b-soft', 'b', { 'stroke-width': 1.5, ...dashed('4 3') }) + label(420, base - 1000 * sc + ((1000 - QC) * sc) / 2 + 4, `W = ${fmt(1000 - QC)} J`, { fill: 'b', anchor: 'start', weight: 600 }));
        s += S.line(200, base, 460, base, 'ink', 1.5);
        return s;
      },
      pieces: [
        { parts: [[0, 'W'], [1, ' = ']], color: 'b', say: 'W: the work is whatever heat doesn’t come back out.' },
        { parts: [[2, 'Q_H']], color: 'c', say: 'Q_H: the heat taken in from the hot source.' },
        { parts: [[3, ' − Q_C']], color: 'a', say: '− Q_C: minus the heat dumped into the cold sink. The first law, for one full cycle (the engine ends where it started, so ΔU = 0).' },
      ],
      vary: [{ key: 'QC', amp: 250, min: 300, max: 950, label: 'Q_C', color: 'a', say: 'Vary the heat dumped: less waste, more work.' }],
    }),
    'Carnot limit': play({
      own: true, values: { TH: 600, TC: 300 },
      intro: 'Carnot’s own picture: heat falling from a high temperature to a low one, like water turning a mill wheel.',
      scene: ({ TH, TC }, h, k, u) => {
        const Y = (T) => 380 - T * 0.4, x = 300;
        let s = S.line(x - 120, Y(0), x + 220, Y(0), 'ink', 2) + label(x - 126, Y(0) + 4, 'absolute zero, 0 K', { fill: 'muted', size: 11, anchor: 'end' });
        s += S.rect(x - 110, Y(TH), 90, Y(0) - Y(TH), 'c-soft', null) + label(x - 115, Y(TH) + 4, `T_H = ${fmt(TH)} K`, { fill: 'c', anchor: 'end', size: 13, weight: 600 });
        s += S.fade(u(0), S.rect(x + 100, Y(TC), 90, Y(0) - Y(TC), 'a-soft', null) + label(x + 196, Y(TC) + 4, `T_C = ${fmt(TC)} K`, { fill: 'a', anchor: 'start', size: 13, weight: 600 }));
        // The fall: water drops from T_H to T_C over the wheel.
        s += S.fade(u(1), S.path(`M${x - 20} ${Y(TH)} Q${x + 40} ${Y(TH)} ${x + 40} ${(Y(TH) + Y(TC)) / 2} T${x + 100} ${Y(TC)}`, 'a', 6, { opacity: 0.6 }) + S.circle(x + 40, (Y(TH) + Y(TC)) / 2, 34, null, 'ink', { 'stroke-width': 3 }) +
          S.line(x + 240, Y(TH), x + 240, Y(TC), 'b', 3) + label(x + 248, (Y(TH) + Y(TC)) / 2, 'usable drop', { fill: 'b', anchor: 'start', size: 12 }) + S.line(x + 240, Y(TC), x + 240, Y(0), 'muted', 3, dashed('4 4')) + label(x + 248, (Y(TC) + Y(0)) / 2, 'can’t fall further', { fill: 'muted', anchor: 'start', size: 12 }));
        s += S.fade(u(2), label(620, 90, `η = (${fmt(TH)} − ${fmt(TC)}) ÷ ${fmt(TH)} = ${fmt((1 - TC / TH) * 100, 0)} %`, { weight: 600, size: 15 }));
        return s;
      },
      pieces: [
        { parts: [[3, 'T_C/T_H']], color: 'a', say: 'T_C/T_H: measured from absolute zero, the heat could only fall to T_C, never all the way down. That fraction of the “height” is wasted.' },
        { parts: [[2, '1 − ']], color: 'b', say: '1 −: the usable fraction is the drop from T_H to T_C, out of the whole height T_H.' },
        { parts: [[0, 'η_max'], [1, ' = ']], say: 'η_max =: no engine of any design can do better between these two temperatures.' },
      ],
      vary: [{ key: 'TC', amp: 200, min: 20, max: 550, label: 'T_C', color: 'a', say: 'Vary the cold sink: the colder it is, the bigger the usable drop. Only at absolute zero could you use it all, and you can’t reach that.' }],
    }),
    Refrigerator: play({
      own: true, values: { QC: 300, W: 100 },
      intro: 'A fridge pumps heat uphill, from the cold inside to the warm room.',
      scene: ({ QC, W }, h, k, u) => {
        const sc = 0.4, base = 340;
        let s = S.fade(u(0), bar(250, base, QC, sc, 'a', 'heat removed Q_C', `${fmt(QC)} J`, 70));
        s += S.fade(u(1), bar(380, base, W, sc, 'b', 'electricity W', `${fmt(W)} J`, 70));
        s += S.fade(u(2), label(620, 160, `COP = ${fmt(QC)} ÷ ${fmt(W)} = ${fmt(QC / W, 1)}`, { weight: 600, size: 17 }) + label(620, 190, `${fmt(QC / W, 1)} J moved per joule paid`, { size: 13 }));
        s += S.line(200, base, 440, base, 'ink', 1.5);
        return s;
      },
      pieces: [
        { parts: [[2, 'Q_C']], color: 'a', say: 'Q_C: what you want, the heat pulled out of the food.' },
        { parts: [[3, '/W']], color: 'b', say: '/W: what you pay for, the electrical work.' },
        { parts: [[0, 'COP'], [1, ' = ']], say: 'COP =: the coefficient of performance. It’s usually more than 1: a fridge moves more heat than the energy it uses.' },
      ],
      vary: [{ key: 'W', amp: 70, min: 30, max: 300, label: 'W', color: 'b', say: 'Vary the work needed: a better-insulated fridge with a smaller temperature gap needs less.' }],
    }),
  });
})();
