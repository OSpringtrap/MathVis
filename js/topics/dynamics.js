// Mechanics, part 2: forces at work, energy and momentum. Loaded after newton.js.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, clamp01, M, sfx, pitch, note } = MV;
  const { caption, label, path, figure, block, graph, spring, bar, G: g } = MV.phys;
  const GROUP = 'Mechanics';
  const op = (s) => `<span class="op">${s}</span>`;
  // Ground marks that slide past, so a body can stay in view while it moves.
  const ground = (x0, x1, y, shift, gap = 40) => {
    let s = S.line(x0, y, x1, y, 'ink', 2);
    const off = ((shift % gap) + gap) % gap;
    for (let x = x0 - off + gap; x < x1; x += gap) s += S.line(x, y + 2, x - 10, y + 12, 'grid2', 1.5);
    return s;
  };

  // =====================================================================
  // Newton's laws in action
  // =====================================================================

  const fric = ({ F, m, mu }) => {
    const N = m * g, sMax = (mu + 0.1) * N, slides = F > sMax;
    const f = slides ? mu * N : F, a = slides ? (F - f) / m : 0;
    return { N, sMax, slides, f, a };
  };
  const forcesFriction = {
    id: 'friction',
    label: 'Friction',
    lede: 'Pull a heavy box across the floor. Friction pushes back, matching your pull, until you pull harder than it can grip.',
    build: 3.6,
    compact: true,
    params: {
      F: { value: 30, min: 0, max: 80, step: 2, color: 'a', label: 'your pull in newtons', digits: 0 },
      m: { value: 5, min: 2, max: 10, step: 0.5, color: 'b', label: 'mass of the box in kilograms' },
      mu: { value: 0.4, min: 0.1, max: 0.8, step: 0.05, color: 'c', label: 'coefficient of kinetic friction' },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => { const r = fric(p); return `${h.v('a')}${op('=')}(${h.n('F')}${op('−')}${r.slides ? `${h.n('mu')}${op('×')}${h.c('ink', fmt(r.N, 0), 'N')}` : h.c('c', fmt(r.f, 0), 'fr')})${op('÷')}${h.n('m')}${op('=')}${h.r(r.a)}${h.unit('m/s²')}`; },
    aside: (p, h) => { const r = fric(p); return r.slides
      ? `<div>Normal force ${h.v('N')} = ${h.val('m')} × 9.8 = ${h.c('ink', fmt(r.N, 0), 'N')} N. Sliding friction = μ${h.v('N')} = ${h.c('c', fmt(r.f, 1), 'fr')} N.</div>`
      : `<div>The floor can grip with up to ${h.c('c', fmt(r.sMax, 1), 'fr')} N (static μ ≈ ${fmt(p.mu + 0.1)}). Your ${h.val('F')} N isn’t enough: friction matches it and the box stays put.</div>`; },
    readout: (p, h, { t }) => { const r = fric(p); return h.ro('time', fmt(t, 1), 's') + h.ro('friction', fmt(r.f, 1), 'N', 'c') + h.ro('speed', fmt(r.a * t, 1), 'm/s'); },
    steps: [
      { at: 0, hl: ['m'], say: ({ m }) => `A ${fmt(m)} kg box on the floor. Gravity pulls it down with ${fmt(m * g, 0)} N; the floor pushes back up with the same normal force N.` },
      { at: 0.3, hl: ['F'], say: ({ F }) => `You pull to the right with ${fmt(F)} N.` },
      { at: 0.52, hl: ['mu', 'fr'], say: (p) => { const r = fric(p); return r.slides ? `Friction pushes back. Once sliding, it’s μ × N = ${fmt(r.f, 1)} N, whatever your pull.` : `Friction pushes back with exactly ${fmt(r.f, 1)} N, matching your pull. Static friction adjusts itself, up to a maximum of ${fmt(r.sMax, 1)} N.`; } },
      { at: 0.76, hl: ['res'], say: (p) => { const r = fric(p); return r.slides ? `The net force is ${fmt(p.F)} − ${fmt(r.f, 1)} = ${fmt(p.F - r.f, 1)} N, so by F = ma the box accelerates at ${fmt(r.a)} m/s².` : 'Net force zero, so no acceleration: the box stays at rest (first law).'; } },
    ],
    sfx: (p) => { const r = fric(p); return [sfx.thud(0.02), sfx.glide(0.3, 0.48, pitch(0), pitch(p.F / 5)), sfx.glide(0.52, 0.7, pitch(0), pitch(r.f / 5)), r.slides ? sfx.whoosh(0.78, 0.95) : sfx.tick(0.8, note(2))]; },
    simSay: (p) => { const r = fric(p); return r.slides ? `Your ${fmt(p.F)} N beats the ${fmt(r.f, 1)} N of sliding friction, so the box speeds up by ${fmt(r.a)} m/s every second.` : 'Friction holds it: the box doesn’t move. Pull harder (or pick a smoother floor) to get it sliding.'; },
    simSfx: (p) => (fric(p).slides ? [sfx.whoosh(0, 4)] : [sfx.thud(0.1)]),
    draw(p, h, { k, t }) {
      const r = fric(p), sc = 1.5, y = 290, bw = 90 + p.m * 6, bh = 60 + p.m * 4, cx = 250;
      const u0 = seg(k, 0, 0.26), u1 = seg(k, 0.3, 0.48), u2 = seg(k, 0.52, 0.72), u3 = seg(k, 0.76, 0.95);
      let s = ground(40, 480, y, 0.5 * r.a * t * t * 40) + block(cx, y, bw, bh, 'b', `${fmt(p.m)} kg`);
      // Forces drawn outward from the box's edges, each labelled at its tip.
      const Wl = r.N * sc * 0.55;
      s += S.fade(u0, S.arrow(cx, y + 2, cx, y + 2 + Wl * u0, 'ink', 3) + label(cx + 8, y + Wl - 2, `weight ${fmt(r.N, 0)} N`, { anchor: 'start', size: 11 }) +
        S.arrow(cx, y - bh, cx, y - bh - Wl * u0, 'muted', 3) + label(cx + 8, y - bh - Wl + 10, `normal ${fmt(r.N, 0)} N`, { anchor: 'start', size: 11, fill: 'muted' }));
      if (p.F > 0) s += S.fade(u1, S.arrow(cx + bw / 2, y - bh / 2, cx + bw / 2 + p.F * sc * u1, y - bh / 2, 'a', 4) + label(cx + bw / 2 + p.F * sc * 0.5, y - bh / 2 - 12, `${fmt(p.F)} N`, { fill: 'a', weight: 600 }));
      if (r.f > 0) s += S.fade(u2, S.arrow(cx - bw / 2, y - 10, cx - bw / 2 - r.f * sc * u2, y - 10, 'c', 4) + label(cx - bw / 2 - r.f * sc * 0.5, y - 22, `friction ${fmt(r.f, 1)} N`, { fill: 'c', weight: 600, size: 12 }));
      s += S.fade(u3, label(cx, y - bh - 40, r.slides ? `net ${fmt(p.F - r.f, 1)} N → a = ${fmt(r.a)} m/s²` : 'net force 0 → stays at rest', { weight: 600 }));
      // Friction against pull: it rises with your pull, then drops to the sliding value once the box breaks free.
      const Gr = graph({ x0: 540, x1: 760, y0: 330, y1: 120, tMax: 80, vMax: Math.max(10, Math.min(80, r.sMax) * 1.15), tLabel: 'your pull (N)', vLabel: 'friction (N)' });
      const fAt = (F) => (F <= r.sMax ? F : r.N * p.mu);
      s += S.fade(u2, Gr.s + S.path(path(160, (u) => [Gr.X(u * 80), Gr.Y(fAt(u * 80))]), 'c', 2.5) +
        S.circle(Gr.X(p.F), Gr.Y(fAt(p.F)), 6, 'a') + label(Gr.X(r.sMax), Gr.Y(r.sMax) - 10, 'static max', { fill: 'muted', size: 10 }));
      return s;
    },
    theory: [
      ['Static and sliding friction', `Friction is the floor's grip on the box, parallel to the surfaces. While the box is still, <em>static friction</em> matches your pull exactly, up to a limit ${M('f_s ≤ μ_s N')}. Pull harder than that and the box breaks free; then <em>kinetic friction</em> takes over, ${M('f_k = μ_k N')}, which is usually a little smaller. That's why it's harder to get something moving than to keep it moving.`],
      ['The normal force', `${M('N')} is how hard the floor pushes up on the box. On a flat floor with nothing else pressing down, it balances the weight: ${M('N = mg')}. Heavier box, bigger normal force, more friction.`],
      ['Putting it together', `The second law uses the net force: ${M('F − f = ma')}. Draw every force on the body, add them with their directions, then divide by the mass.`],
      ['Useful friction', `Without friction you couldn't walk, drive or hold a pen. Tyres, shoe soles and brakes are designed to maximise it; lubricants and ball bearings to minimise it.`],
    ],
    practice: (p, h) => { const r = fric(p); return [
      `To get this box moving you need more than ${h.r(r.sMax, 1)} N; to keep it sliding at a steady speed, exactly ${h.r(r.N * p.mu, 1)} N.`,
      `On ice (μ ≈ 0.05) the same box would need only ${h.r(0.05 * r.N, 1)} N to keep sliding.`,
    ]; },
  };

  const forcesBlocks = {
    id: 'blocks',
    label: 'Connected blocks',
    lede: 'Pull one block, and a rope drags a second one behind it. Both share the same acceleration; the rope pulls only as hard as the back block needs.',
    build: 3,
    compact: true,
    params: {
      F: { value: 24, min: 4, max: 40, step: 2, color: 'a', label: 'pull in newtons', digits: 0 },
      mA: { value: 4, min: 1, max: 10, step: 0.5, color: 'b', label: 'front block mass in kilograms' },
      mB: { value: 2, min: 1, max: 10, step: 0.5, color: 'c', label: 'back block mass in kilograms' },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => `${h.v('a')}${op('=')}${h.frac(h.n('F'), `${h.n('mA')}${op('+')}${h.n('mB')}`)}${op('=')}${h.r(p.F / (p.mA + p.mB))}${h.unit('m/s²')}`,
    aside: (p, h) => { const a = p.F / (p.mA + p.mB); return `<div>Rope tension: ${h.v('T')} = ${h.val('mB')} × ${h.c('ink', fmt(a), 'acc')} = ${h.c('ink', fmt(p.mB * a, 1), 'T')} N, just enough to give the back block the same acceleration.</div>`; },
    readout: (p, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('speed', fmt((p.F / (p.mA + p.mB)) * t, 1), 'm/s') + h.ro('tension', fmt((p.mB * p.F) / (p.mA + p.mB), 1), 'N'),
    steps: [
      { at: 0, hl: ['mA', 'mB'], say: 'Two blocks on a smooth floor, joined by a rope.' },
      { at: 0.25, hl: ['F'], say: ({ F }) => `You pull the front block with ${fmt(F)} N.` },
      { at: 0.5, hl: ['mA', 'mB', 'res'], say: (p) => `Tied together they move as one body of ${fmt(p.mA + p.mB)} kg: a = ${fmt(p.F)} ÷ ${fmt(p.mA + p.mB)} = ${fmt(p.F / (p.mA + p.mB))} m/s².` },
      { at: 0.75, hl: ['T'], say: (p) => `The rope pulls the back block forward with T = ${fmt((p.mB * p.F) / (p.mA + p.mB), 1)} N, and pulls the front block back just as hard (third law). The front block’s net force is ${fmt(p.F)} − T = ${fmt((p.mA * p.F) / (p.mA + p.mB), 1)} N.` },
    ],
    sfx: (p) => [sfx.thud(0.02), sfx.glide(0.25, 0.45, pitch(0), pitch(p.F / 3)), sfx.pop(0.52, note(4)), sfx.glide(0.75, 0.92, pitch(0), pitch((p.mB * p.F) / (p.mA + p.mB) / 3))],
    simSay: (p) => `Both blocks speed up by ${fmt(p.F / (p.mA + p.mB))} m/s every second. A heavier back block means a smaller acceleration and a tighter rope.`,
    simSfx: () => [sfx.whoosh(0, 4)],
    draw(p, h, { k, t }) {
      const a = p.F / (p.mA + p.mB), T = p.mB * a, y = 300, sc = 4;
      const wA = 50 + p.mA * 6, wB = 50 + p.mB * 6, xA = 470, xB = xA - wA / 2 - 90 - wB / 2;
      const u1 = seg(k, 0.25, 0.45), u2 = seg(k, 0.5, 0.7), u3 = seg(k, 0.75, 0.95);
      let s = ground(40, 760, y, 0.5 * a * t * t * 40) + block(xA, y, wA, 40 + p.mA * 4, 'b', `${fmt(p.mA)} kg`) + block(xB, y, wB, 40 + p.mB * 4, 'c', `${fmt(p.mB)} kg`);
      s += S.line(xB + wB / 2, y - 22, xA - wA / 2, y - 22, 'ink', 2.5);
      s += S.fade(u1, S.arrow(xA + wA / 2, y - 22, xA + wA / 2 + p.F * sc * u1, y - 22, 'a', 4) + label(xA + wA / 2 + p.F * sc * 0.5, y - 36, `F = ${fmt(p.F)} N`, { fill: 'a', weight: 600 }));
      s += S.fade(u3, S.arrow(xB + wB / 2 + 4, y - 50, xB + wB / 2 + 4 + T * sc, y - 50, 'ink', 3) + label(xB + wB / 2 + 4 + T * sc * 0.5, y - 62, `T = ${fmt(T, 1)} N`, { size: 12, weight: 600 }) +
        S.arrow(xA - wA / 2 - 4, y - 50 - 30, xA - wA / 2 - 4 - T * sc, y - 80, 'ink', 3) + label(xA - wA / 2 - 4 - T * sc * 0.5, y - 92, `T back on A`, { size: 11 }));
      s += S.fade(u2, S.arrow(xB, y + 50, xA + 40, y + 50, 'muted', 2.5) + label((xA + xB) / 2, y + 74, `together: a = ${fmt(a)} m/s²`, { weight: 600 }));
      return s;
    },
    theory: [
      ['One system', `Joined by a taut rope, the blocks must move together, so they share one acceleration. Treat them as one body: the only horizontal outside force is your pull, so ${M('a = F/(m_A + m_B)')}. The rope forces are internal to the pair and cancel.`],
      ['Then each block alone', `To find the rope's tension, look at the back block on its own. The only horizontal force on it is the tension, so ${M('T = m_B a')}. The front block feels your pull forward and the tension back: ${M('F − T = m_A a')}. Both equations together give the same answer.`],
    ],
    practice: (p, h) => [
      `A train engine pulling ${h.val('mB')} wagons feels the same idea: the coupling nearest the engine carries the most tension, because it pulls everything behind it.`,
      `Swap the blocks (pull the ${fmt(p.mB)} kg one) and the rope tension becomes ${h.r((p.mA * p.F) / (p.mA + p.mB), 1)} N.`,
    ],
  };

  const ramp = ({ th, mu }) => {
    const r = (th * Math.PI) / 180, sMax = mu + 0.1, slides = Math.tan(r) > sMax;
    const a = slides ? g * (Math.sin(r) - mu * Math.cos(r)) : 0;
    return { r, slides, a, tL: slides ? Math.sqrt((2 * 8) / a) : Infinity };
  };
  const forcesRamp = {
    id: 'ramp',
    label: 'Ramp',
    lede: 'On a slope, gravity splits in two: one part presses the box into the ramp, the other pulls it down along it.',
    build: 3.4,
    compact: true,
    params: {
      th: { value: 30, min: 5, max: 55, step: 1, color: 'a', label: 'slope angle in degrees', digits: 0 },
      mu: { value: 0.25, min: 0, max: 0.8, step: 0.05, color: 'c', label: 'coefficient of kinetic friction' },
      m: { value: 4, min: 1, max: 10, step: 0.5, color: 'b', label: 'mass in kilograms' },
    },
    sim: { duration: (p) => Math.min(5, ramp(p).tL + 0.6) },
    formula: (p, h) => { const r = ramp(p); return `${h.v('a')}${op('=')}9.8${op('×')}(sin ${h.n('th')}°${op('−')}${h.n('mu')}${op('×')}cos ${h.val('th')}°)${op('=')}${h.r(r.a)}${h.unit('m/s²')}`; },
    aside: (p, h) => { const r = ramp(p); return `<div>Along the slope: ${h.c('b', fmt(p.m * g * Math.sin(r.r), 1), 'par')} N. Into it: ${h.c('ink', fmt(p.m * g * Math.cos(r.r), 1), 'perp')} N. ${r.slides ? 'It slides.' : 'Friction holds it in place.'} The mass ${h.n('m')} kg cancels out.</div>`; },
    readout: (p, h, { t }) => { const r = ramp(p), tt = Math.min(t, r.tL); return h.ro('time', fmt(t, 1), 's') + h.ro('slid', fmt(0.5 * r.a * tt * tt, 1), 'm') + h.ro('speed', fmt(r.a * tt, 1), 'm/s'); },
    steps: [
      { at: 0, hl: ['th'], say: ({ th }) => `A box on a ${fmt(th)}° ramp.` },
      { at: 0.22, hl: ['m'], say: ({ m }) => `Its weight, ${fmt(m * g, 0)} N, points straight down.` },
      { at: 0.42, hl: ['par', 'perp'], say: 'Split the weight in two: mg sin θ along the slope, pulling it down, and mg cos θ into the slope, balanced by the normal force.' },
      { at: 0.66, hl: ['mu'], say: 'Friction, μ × N = μ mg cos θ, acts up the slope against the sliding.' },
      { at: 0.84, hl: ['res'], say: (p) => { const r = ramp(p); return r.slides ? `Net force along the slope: mg(sin θ − μ cos θ). Divide by m and the mass cancels: a = ${fmt(r.a)} m/s².` : 'The downhill pull is smaller than friction can grip: the box stays put.'; } },
    ],
    sfx: (p) => [sfx.thud(0.02), sfx.glide(0.22, 0.4, pitch(7), pitch(0)), sfx.chord(0.44, [note(2), note(5)]), sfx.glide(0.66, 0.8, pitch(0), pitch(4)), ramp(p).slides ? sfx.whoosh(0.85, 0.98) : sfx.tick(0.86, note(2))],
    simSay: (p) => { const r = ramp(p); return r.slides ? `Sliding down with a = ${fmt(r.a)} m/s². Steeper ramp or slipperier surface, faster slide.` : `Static friction holds it. It would start to slide above about ${fmt((Math.atan(p.mu + 0.1) * 180) / Math.PI, 0)}°.`; },
    simSfx: (p) => (ramp(p).slides ? [sfx.whoosh(0, Math.min(5, ramp(p).tL)), sfx.thud(Math.min(5, ramp(p).tL))] : []),
    draw(p, h, { k, t }) {
      const r = ramp(p), L = 8, sc = Math.min(520 / (L * Math.cos(r.r)), 320 / (L * Math.sin(r.r)));
      const x0 = 120, y0 = 380, topX = x0, topY = y0 - L * Math.sin(r.r) * sc, botX = x0 + L * Math.cos(r.r) * sc;
      const s0 = 0.6 + Math.min(L - 1.2, 0.5 * r.a * Math.min(t, r.tL) ** 2);
      const bx = lerp(topX, botX, s0 / L), by = lerp(topY, y0, s0 / L);
      const u1 = seg(k, 0.22, 0.4), u2 = seg(k, 0.42, 0.62), u3 = seg(k, 0.66, 0.82);
      let s = S.poly([[x0, y0], [topX, topY], [botX, y0]], 'ink-soft', 'ink', { 'stroke-width': 2 }) + label(botX - 70, y0 - 12, `${fmt(p.th)}°`, { fill: 'a', weight: 600 });
      const deg = p.th, w = 54, hgt = 38;
      // Box centre sits above the surface along the normal direction.
      // Outward normal of a slope falling to the right points up and to the right.
      const nx = Math.sin(r.r), ny = -Math.cos(r.r), cx = bx + nx * hgt / 2, cy = by + ny * hgt / 2;
      s += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${deg})">${S.rect(-w / 2, -hgt / 2, w, hgt, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 })}</g>`;
      const W = p.m * g * 1.6, along = [Math.cos(r.r), Math.sin(r.r)];
      s += S.fade(u1, S.arrow(cx, cy, cx, cy + W * u1, 'ink', 3) + label(cx + 6, cy + W + 14, `mg = ${fmt(p.m * g, 0)} N`, { size: 11, anchor: 'start' }));
      const par = W * Math.sin(r.r), perp = W * Math.cos(r.r);
      s += S.fade(u2, S.arrow(cx, cy, cx + along[0] * par, cy + along[1] * par, 'b', 3) + label(cx + along[0] * par + 8, cy + along[1] * par - 6, 'mg sin θ', { fill: 'b', size: 11, anchor: 'start' }) +
        S.line(cx, cy, cx - nx * perp, cy - ny * perp, 'muted', 2, dashed('4 3')) + S.arrow(cx, cy, cx + nx * perp, cy + ny * perp, 'a', 2.5) + label(cx + nx * perp + 6, cy + ny * perp - 4, 'N', { fill: 'a', size: 12, anchor: 'start', weight: 600 }));
      if (p.mu > 0) { const f = (r.slides ? p.mu * perp : par); s += S.fade(u3, S.arrow(cx, cy, cx - along[0] * f, cy - along[1] * f, 'c', 3) + label(cx - along[0] * f - 6, cy - along[1] * f - 6, 'friction', { fill: 'c', size: 11, anchor: 'end' })); }
      return s;
    },
    theory: [
      ['Splitting the weight', `On a slope tilted by ${M('θ')}, the weight ${M('mg')} splits into ${M('mg sin θ')} along the slope and ${M('mg cos θ')} into it. The ramp pushes back with ${M('N = mg cos θ')}, so only the along-slope part can move the box.`],
      ['The mass cancels', `With friction ${M('μN')} opposing the slide, ${M('ma = mg sin θ − μmg cos θ')}, so ${M('a = g(sin θ − μ cos θ)')}. Every term has ${M('m')} in it, so heavy and light boxes slide down a ramp the same way.`],
      ['When does it slip?', `The box stays put while static friction can hold it: ${M('tan θ ≤ μ_s')}. Measuring the steepest angle at which something doesn't slide is a simple way to find its coefficient of friction.`],
    ],
    practice: (p, h) => [
      `Without friction, a ${h.val('th')}° slope gives a = 9.8 × sin ${fmt(p.th)}° = ${h.r(g * Math.sin((p.th * Math.PI) / 180))} m/s².`,
      `Ski slopes are graded by steepness: beginners’ runs are under about 15°, expert runs can pass 35°.`,
    ],
  };

  // Lift: speed up for 2 s, cruise 3 s, slow down 2 s.
  const liftAcc = (acc, t) => (t < 2 ? acc : t < 5 ? 0 : t < 7 ? -acc : 0);
  const liftY = (acc, t) => {
    if (t < 2) return 0.5 * acc * t * t;
    if (t < 5) return 2 * acc + 2 * acc * (t - 2);
    if (t < 7) { const u = t - 5; return 8 * acc + 2 * acc * u - 0.5 * acc * u * u; }
    return 10 * acc;
  };
  const forcesLift = {
    id: 'lift',
    label: 'Lift cable',
    lede: 'A lift hangs from one cable. The cable must hold up the weight, and pull extra whenever the lift speeds up going up.',
    build: 1,
    params: {
      m: { value: 800, min: 400, max: 1200, step: 50, color: 'b', label: 'lift and passengers in kilograms', digits: 0 },
      acc: { value: 1.5, min: 0.5, max: 3, step: 0.25, color: 'a', label: 'acceleration in m/s²' },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('T')}${op('=')}${h.n('m')}${op('×')}(9.8${op('+')}${h.n('acc')})${op('=')}${h.r(p.m * (g + p.acc), 0)}${h.unit('N')}`,
    aside: (p, h) => `<div>Cruising: ${h.val('m')} × 9.8 = ${h.c('ink', fmt(p.m * g, 0), 'w')} N. Slowing at the top: ${h.val('m')} × (9.8 − ${h.val('acc')}) = ${h.c('c', fmt(p.m * (g - p.acc), 0), 'low')} N.</div>`,
    readout: (p, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('tension', fmt(p.m * (g + liftAcc(p.acc, t)), 0), 'N') + h.ro('speed', fmt(t < 2 ? p.acc * t : t < 5 ? 2 * p.acc : t < 7 ? 2 * p.acc - p.acc * (t - 5) : 0, 1), 'm/s'),
    steps: [{ at: 0, hl: [], say: 'A lift at the ground floor, about to go up.' }],
    simSay: (p, h, { t }) => (t < 2 ? `Speeding up: the cable pulls harder than the weight. Net force m × a = ${fmt(p.m * p.acc, 0)} N upward.`
      : t < 5 ? 'Steady speed: no acceleration, so the tension equals the weight exactly, even though the lift is moving.'
        : t < 7 ? 'Slowing down: the cable pulls less than the weight, so the net force points down.'
          : 'Stopped at the top: tension back to the weight.'),
    simSfx: () => [sfx.thud(0.02), sfx.tick(2, note(5)), sfx.tick(5, note(2)), sfx.chime(7, note(4))],
    draw(p, h, { k, t }) {
      const top = 30, bottom = 390, carH = 100, rise = 10 * p.acc, sc = (bottom - top - carH - 40) / rise, cx = 200;
      const carBottom = bottom - liftY(p.acc, t) * sc, carTop = carBottom - carH, T = p.m * (g + liftAcc(p.acc, t));
      let s = S.fade(seg(k, 0, 0.6), S.rect(cx - 90, top, 180, bottom - top, null, 'grid2', { 'stroke-width': 2 }) + S.circle(cx, top + 14, 12, null, 'ink', { 'stroke-width': 2 }));
      s += S.line(cx, top + 26, cx, carTop, 'ink', 2.5);
      s += S.rect(cx - 70, carTop, 140, carH, 'b-soft', 'b', { rx: 6, 'stroke-width': 2 }) + figure(cx - 25, carBottom - 4, 'b', 0.9) + figure(cx + 25, carBottom - 4, 'b', 0.95);
      const f = 0.006;
      s += S.arrow(cx + 30, carTop, cx + 30, carTop - T * f, 'a', 3.5) + label(cx + 38, carTop - T * f * 0.5, `T ${fmt(T, 0)} N`, { fill: 'a', size: 11, anchor: 'start', weight: 600 });
      s += S.arrow(cx - 30, carBottom - 30, cx - 30, carBottom - 30 + p.m * g * f, 'c', 3) + label(cx - 38, carBottom - 30 + p.m * g * f * 0.6, `mg ${fmt(p.m * g, 0)} N`, { fill: 'c', size: 11, anchor: 'end' });
      const Gr = graph({ x0: 420, x1: 760, y0: 380, y1: 90, tMax: 8, vMax: 1200 * (g + 3) * 1.05, vMin: 0, vLabel: 'cable tension (N)' });
      s += S.fade(seg(k, 0, 0.6), Gr.s + S.line(Gr.X(0), Gr.Y(p.m * g), Gr.X(8), Gr.Y(p.m * g), 'c', 1, dashed('4 4')) + label(Gr.X(8), Gr.Y(p.m * g) - 6, 'weight', { fill: 'c', size: 11, anchor: 'end' }));
      s += S.path(path(160, (u) => { const tt = u * t; return [Gr.X(tt), Gr.Y(p.m * (g + liftAcc(p.acc, tt)))]; }), 'a', 2.5);
      return s;
    },
    theory: [
      ['Two forces on the lift', `The cable pulls up with tension ${M('T')}; gravity pulls down with ${M('mg')}. The second law says their difference accelerates the lift: ${M('T − mg = ma')}, so ${M('T = m(g + a)')}. Speeding up on the way up, ${M('a > 0')} and the cable works harder; slowing down, ${M('a < 0')} and it eases off.`],
      ['Safety margins', `Lift cables are rated for many times the heaviest load they'll ever carry, and lifts have brakes that grip the rails if the cable speed gets too high. A real lift uses a counterweight too, so the motor only lifts the difference.`],
    ],
    practice: (p, h) => [
      `A full lift of ${h.val('m')} kg speeding up at ${h.val('acc')} m/s² needs ${h.r(p.m * p.acc, 0)} N more than its weight.`,
      `If the lift went into free fall (a = −g), the tension would be zero, and the passengers would float.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'm-forces', group: GROUP, symbol: 'μ', title: 'Newton’s laws in action', modesLabel: null, modes: [forcesFriction, forcesBlocks, forcesRamp, forcesLift] });

  // =====================================================================
  // Work and energy
  // =====================================================================

  const HALF = 10; // half-width of the half-pipe in metres
  const skate = ({ h, m, loss }, t) => {
    const E0 = m * g * h, w = Math.sqrt(2 * g * h) / HALF, decay = loss * 0.35;
    const A = Math.exp(-decay * t / 2), x = -A * Math.cos(w * t), E = E0 * A * A;
    const PE = m * g * h * x * x, KE = Math.max(0, E - PE);
    return { E0, E, PE, KE, heat: E0 - E, x, v: Math.sqrt((2 * KE) / m) };
  };
  const energyConcept = {
    id: 'concept',
    label: 'Energy is conserved',
    lede: 'A skater drops into a half-pipe. Height turns into speed and back into height: the energy changes form, but the total stays the same.',
    build: 3.4,
    params: {
      h: { value: 4, min: 1, max: 8, step: 0.5, color: 'b', label: 'starting height in metres' },
      m: { value: 50, min: 20, max: 90, step: 5, color: 'ink', label: 'mass in kilograms', digits: 0 },
      loss: { value: 0, min: 0, max: 0.3, step: 0.05, color: 'c', label: 'friction (0 is perfectly smooth)' },
    },
    sim: { duration: () => 12 },
    formula: (p, h) => `${h.v('v')}${op('=')}√(2${op('×')}9.8${op('×')}${h.n('h')})${op('=')}${h.r(Math.sqrt(2 * g * p.h))}${h.unit('m/s at the bottom')}`,
    aside: (p, h) => `<div>At the top: ${h.v('mgh')} = ${h.n('m')} × 9.8 × ${h.val('h')} = ${h.c('b', fmt(p.m * g * p.h, 0), 'pe')} J. At the bottom, all of it is ${h.v('½mv²')}. Friction ${h.n('loss')}.</div>`,
    readout: (p, h, { t }) => { const e = skate(p, t); return h.ro('height', fmt(p.h * e.x * e.x, 1), 'm', 'b') + h.ro('speed', fmt(e.v, 1), 'm/s', 'a') + h.ro('heat', fmt(e.heat, 0), 'J', 'c'); },
    steps: [
      { at: 0, hl: ['h'], say: ({ h }) => `The skater waits at the lip, ${fmt(h)} m above the bottom.` },
      { at: 0.25, hl: ['pe'], say: (p) => `All the energy is stored as height, gravitational potential energy: mgh = ${fmt(p.m * g * p.h, 0)} J.` },
      { at: 0.55, hl: ['res'], say: (p) => `At the bottom, the height is gone and it has all become movement, kinetic energy ½mv². Setting them equal: v = √(2gh) = ${fmt(Math.sqrt(2 * g * p.h))} m/s.` },
      { at: 0.8, hl: ['m'], say: 'The mass cancels from both sides: a heavy and a light skater reach the same speed.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(7)), sfx.chord(0.27, [note(5), note(7)]), sfx.glide(0.55, 0.75, pitch(12), pitch(0)), sfx.chime(0.82, note(4))],
    simSay: (p, h, { t }) => { const e = skate(p, t); return p.loss > 0 ? `Friction turns a little energy into heat on every pass, so each swing is a bit lower. Total so far: ${fmt(e.PE + e.KE + e.heat, 0)} J, the same as at the start.` : 'Down: height becomes speed. Up the other side: speed becomes height. The total bar never changes.'; },
    simSfx: (p) => [sfx.curve(0, 12, Array.from({ length: 60 }, (_, i) => pitch(1.5 * skate(p, (i / 59) * 12).v)))],
    draw(p, h, { k, t }) {
      const sc = 30, cx = 260, base = 360;
      const e = skate(p, t), xs = e.x;
      // Track: y = h x² scaled so the lip is at the starting height.
      const trackH = (x) => base - x * x * p.h * sc;
      let s = S.path(path(80, (u) => { const x = -1.12 + 2.24 * u; return [cx + x * 200, trackH(x)]; }), 'ink', 3);
      s += S.line(cx - 230, base - p.h * sc, cx - 200, base - p.h * sc, 'b', 1.5, dashed('3 3')) + label(cx - 236, base - p.h * sc + 4, `${fmt(p.h)} m`, { fill: 'b', anchor: 'end', size: 12 });
      const px = cx + xs * 200, py = trackH(xs), slope = 2 * xs * p.h * sc / 200, ang = Math.atan(slope);
      s += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${((-ang * 180) / Math.PI).toFixed(1)})">${figure(0, -4, 'a', 0.75)}${S.rect(-16, -6, 32, 5, 'ink', null, { rx: 2 })}</g>`;
      // Energy bars: potential, kinetic, heat and the total.
      const bx = 560, by = 360, bs = 240 / Math.max(e.E0, 1);
      const u1 = seg(k, 0.25, 0.45), u2 = seg(k, 0.55, 0.75);
      const PE = t > 0 ? e.PE : e.E0 * (1 - u2), KE = t > 0 ? e.KE : e.E0 * u2;
      s += S.fade(u1, bar(bx, by, PE, bs, 'b', 'height', `${fmt(PE, 0)} J`) + bar(bx + 50, by, KE, bs, 'a', 'motion', `${fmt(KE, 0)} J`) +
        bar(bx + 100, by, e.heat, bs, 'c', 'heat', `${fmt(e.heat, 0)} J`) + bar(bx + 160, by, PE + KE + e.heat, bs, 'ink', 'total', `${fmt(e.E0, 0)} J`) + caption(530, 60, 'Energy (joules)'));
      return s;
    },
    theory: [
      ['Kinetic and potential energy', `A moving body has <em>kinetic energy</em> ${M('E_k = ½mv^2')}. A body raised to height ${M('h')} has <em>gravitational potential energy</em> ${M('E_p = mgh')}, energy stored by its position that gravity can turn back into motion. A compressed or stretched spring stores <em>elastic potential energy</em> ${M('E_e = ½kx^2')}.`],
      ['Conservation of mechanical energy', `Without friction or air resistance, the sum ${M('E_k + E_p')} stays constant: ${M('½mv^2 + mgh = const')}. Energy just moves from one form to the other. Setting the energy at the top equal to the energy at the bottom gives ${M('v = √(2gh)')}, the same for every mass.`],
      ['Where does it go?', `With friction, the mechanical energy slowly drops, but it isn't destroyed: it becomes heat in the wheels and the ramp. Counting heat too, the total energy is always conserved. This is one of the most fundamental laws in physics.`],
      ['Work', `A force that moves something does <em>work</em> on it, ${M('W = Fd')} (force along the motion times distance). Work is how energy is transferred: the work done on a body equals the change in its kinetic energy.`],
    ],
    practice: null,
  };

  const energyWork = {
    id: 'work',
    label: 'Work by a push',
    lede: 'Push a sledge across smooth ice. Every metre you push it, you hand over energy: force × distance becomes speed.',
    build: 1,
    params: {
      F: { value: 40, min: 10, max: 100, step: 5, color: 'a', label: 'push in newtons', digits: 0 },
      d: { value: 10, min: 2, max: 20, step: 1, color: 'b', label: 'distance pushed in metres', digits: 0 },
      m: { value: 20, min: 5, max: 60, step: 5, color: 'ink', label: 'mass in kilograms', digits: 0 },
    },
    sim: { duration: (p) => Math.sqrt((2 * p.d * p.m) / p.F) + 2 },
    formula: (p, h) => `${h.v('W')}${op('=')}${h.n('F')}${op('×')}${h.n('d')}${op('=')}${h.r(p.F * p.d, 0)}${h.unit('J')}`,
    aside: (p, h) => `<div>All of it becomes kinetic energy: ½ × ${h.n('m')} × ${h.v('v')}² = ${h.val('F', p.F * p.d, 0)}, so ${h.v('v')} = ${h.c('ink', fmt(Math.sqrt((2 * p.F * p.d) / p.m)), 'v')} m/s.</div>`,
    readout: (p, h, { t }) => { const tp = Math.sqrt((2 * p.d * p.m) / p.F), a = p.F / p.m, tt = Math.min(t, tp), x = 0.5 * a * tt * tt; return h.ro('pushed', fmt(x, 1), 'm') + h.ro('work', fmt(p.F * x, 0), 'J', 'a') + h.ro('speed', fmt(a * tt, 2), 'm/s'); },
    steps: [{ at: 0, hl: [], say: 'A sledge at rest on smooth ice.' }],
    simSay: (p, h, { t }) => (t < Math.sqrt((2 * p.d * p.m) / p.F) ? 'Pushing: each metre adds F × 1 m of work, and the kinetic energy bar grows by exactly the same amount.' : `Push over. You did ${fmt(p.F * p.d, 0)} J of work, and the sledge now carries ${fmt(p.F * p.d, 0)} J of kinetic energy. On frictionless ice it keeps it.`),
    simSfx: (p) => { const tp = Math.sqrt((2 * p.d * p.m) / p.F); return [sfx.glide(0, tp, pitch(0), pitch(10)), sfx.chime(tp, note(7))]; },
    draw(p, h, { k, t }) {
      const tp = Math.sqrt((2 * p.d * p.m) / p.F), a = p.F / p.m, vEnd = a * tp;
      const x = t < tp ? 0.5 * a * t * t : p.d + vEnd * (t - tp), W = p.F * Math.min(x, p.d);
      const sc = 480 / (p.d + vEnd * 2.2), X = (m) => 90 + m * sc, y = 330;
      let s = S.fade(seg(k, 0, 0.6), S.rect(40, y, 720, 14, 'a-soft', null, { rx: 4, opacity: 0.6 }) + S.rect(X(0), y + 20, p.d * sc, 8, 'b-soft', null, { rx: 3 }) + label(X(p.d / 2), y + 46, `push for ${fmt(p.d)} m`, { fill: 'b', size: 12 }));
      const sx = X(x);
      s += S.rect(sx - 2, y - 46, 90, 40, 'ink-soft', 'ink', { rx: 8, 'stroke-width': 2 }) + S.path(`M${sx - 8} ${y - 2} L${sx + 96} ${y - 2} Q${sx + 110} ${y - 2} ${sx + 106} ${y - 16}`, 'ink', 2.5) + label(sx + 43, y - 21, `${fmt(p.m)} kg`, { size: 12, weight: 600 });
      if (x < p.d) s += figure(sx - 30, y, 'a', 1.5) + S.arrow(sx - 70, y - 64, sx - 6, y - 64, 'a', 4) + label(sx - 40, y - 78, `${fmt(p.F)} N`, { fill: 'a', size: 13, weight: 600 });
      else s += figure(X(p.d) - 30, y, 'a', 1.5);
      const bs = 170 / (p.F * p.d);
      s += bar(600, 230, W, bs, 'a', 'work done', `${fmt(W, 0)} J`, 44) + bar(690, 230, W, bs, 'ink', 'kinetic energy', `${fmt(W, 0)} J`, 44) + caption(560, 40, 'Work in = energy gained');
      return s;
    },
    theory: [
      ['Force times distance', `The work done by a force is ${M('W = Fd')}: the force times the distance moved in the force's direction. It's measured in joules: 1 J is a push of 1 N over 1 m. A force at an angle only counts its part along the motion: ${M('W = Fd cos θ')}.`],
      ['The work–energy theorem', `On frictionless ice, all the work you do goes into kinetic energy: ${M('W = ΔE_k = ½mv^2')}. Push twice as far, and you give twice the energy, but only √2 times the speed, because speed enters squared.`],
      ['No movement, no work', `Holding a heavy bag still is tiring, but it does no work on the bag: it doesn't move. A force at right angles to the motion, like the pull keeping a ball on a string going round, does no work either.`],
    ],
    practice: (p, h) => [
      `Lifting a ${h.val('m')} kg box 1 m takes ${h.r(p.m * g, 0)} J of work, its gain in potential energy.`,
      `A food Calorie is 4184 J: enough to lift a 50 kg person about ${h.r(4184 / (50 * g), 1)} m.`,
    ],
  };

  // Spring launcher: release (slowed down), run along the flat, climb the ramp until all the energy is height.
  const launch = ({ kk, x, m }) => {
    const E = 0.5 * kk * x * x, hMax = E / (m * g), v = Math.sqrt((2 * E) / m);
    const phase = (t) => {
      if (t < 0.6) return { a: 'spring' };
      if (t < 1.4) { const u = (t - 0.6) / 0.8, xc = x * Math.cos((Math.PI / 2) * u); return { a: 'release', u, xc, el: 0.5 * kk * xc * xc }; }
      if (t < 2.2) return { a: 'run', u: (t - 1.4) / 0.8 };
      if (t < 4.2) { const u = (t - 2.2) / 2; return { a: 'climb', u, f: 1 - (1 - u) ** 2 }; }
      return { a: 'top', f: 1 };
    };
    return { E, hMax, v, phase };
  };
  const energySpring = {
    id: 'spring',
    label: 'Spring launcher',
    lede: 'A compressed spring launches a block up a smooth ramp. Elastic energy becomes motion, then height.',
    build: 1,
    compact: true,
    params: {
      kk: { value: 400, min: 100, max: 800, step: 50, color: 'c', label: 'spring stiffness in N/m', digits: 0 },
      x: { value: 0.3, min: 0.1, max: 0.5, step: 0.05, color: 'a', label: 'compression in metres' },
      m: { value: 1, min: 0.5, max: 3, step: 0.25, color: 'b', label: 'block mass in kilograms' },
    },
    sim: { duration: () => 5 },
    formula: (p, h) => `${h.v('h')}${op('=')}${h.frac(`½${op('×')}${h.n('kk')}${op('×')}${h.n('x')}²`, `${h.n('m')}${op('×')}9.8`)}${op('=')}${h.r(launch(p).hMax)}${h.unit('m')}`,
    aside: (p, h) => { const L = launch(p); return `<div>Stored in the spring: ½${h.v('kx')}² = ${h.c('c', fmt(L.E, 1), 'E')} J. Launch speed: ${h.c('a', fmt(L.v), 'v')} m/s.</div>`; },
    readout: (p, h, { t }) => { const L = launch(p), ph = L.phase(t); const el = ph.a === 'spring' ? L.E : ph.a === 'release' ? ph.el : 0, pe = ph.f != null ? L.E * ph.f : 0; return h.ro('elastic', fmt(el, 1), 'J', 'c') + h.ro('kinetic', fmt(L.E - el - pe, 1), 'J', 'a') + h.ro('height', fmt(pe, 1), 'J', 'b'); },
    steps: [{ at: 0, hl: [], say: 'A block pressed against a compressed spring.' }],
    simSay: (p, h, { t }) => { const ph = launch(p).phase(t); return ph.a === 'spring' ? 'The spring stores elastic energy ½kx².' : ph.a === 'release' ? 'Released (in slow motion): elastic energy becomes kinetic energy.' : ph.a === 'run' ? 'On the flat, all the energy is motion.' : ph.a === 'climb' ? 'Climbing: kinetic energy becomes height. It slows down as it rises.' : `Stopped at ${fmt(launch(p).hMax)} m: all the spring’s energy is now height.`; },
    simSfx: () => [sfx.snip(0.6), sfx.swoosh(0.6, 1.4), sfx.glide(2.2, 4.2, pitch(12), pitch(0)), sfx.chime(4.2, note(7))],
    draw(p, h, { k, t }) {
      const L = launch(p), ph = L.phase(t), y = 330, wall = 70, rest = 230, sc = 250, ang = Math.PI / 6;
      const hs = 220 / Math.max(L.hMax * 1.15, 0.5), rampX = 420;
      const comp = ph.a === 'spring' ? p.x : ph.a === 'release' ? ph.xc : 0;
      const springEnd = rest - comp * sc;
      let s = S.fade(seg(k, 0, 0.6), S.line(40, y, rampX, y, 'ink', 2) + S.rect(wall - 14, y - 70, 14, 70, 'ink-soft', null) + S.line(rampX, y, rampX + 220 / Math.tan(ang) * 1.1, y - 220 * 1.1, 'ink', 2));
      s += spring(wall, y - 22, springEnd, 'c', 10, 10);
      let bx, by, rot = 0;
      if (ph.a === 'spring' || ph.a === 'release') { bx = springEnd + 22; by = y; }
      else if (ph.a === 'run') { bx = lerp(rest + 22, rampX, ph.u); by = y; }
      else { const hh = L.hMax * ph.f * hs; bx = rampX + hh / Math.tan(ang); by = y - hh; rot = -30; }
      s += `<g transform="translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${rot})">${S.rect(-22, -40, 44, 40, 'b-soft', 'b', { rx: 4, 'stroke-width': 2 })}</g>`;
      if (ph.f != null) s += S.line(rampX + 200, by, bx + 40, by, 'b', 1, dashed('3 4')) + label(rampX + 206, by + 4, `${fmt(L.hMax * ph.f, 2)} m`, { fill: 'b', size: 11, anchor: 'start' });
      const el = ph.a === 'spring' ? L.E : ph.a === 'release' ? ph.el : 0, pe = ph.f != null ? L.E * ph.f : 0, ke = L.E - el - pe;
      const bs = 120 / Math.max(L.E, 1);
      s += caption(80, 40, 'Energy (joules)') + bar(110, 210, el, bs, 'c', 'elastic', `${fmt(el, 1)} J`, 34) + bar(170, 210, ke, bs, 'a', 'kinetic', `${fmt(ke, 1)} J`, 34) + bar(230, 210, pe, bs, 'b', 'height', `${fmt(pe, 1)} J`, 34);
      return s;
    },
    theory: [
      ['Elastic potential energy', `A spring compressed (or stretched) by ${M('x')} pushes back with ${M('F = kx')}, and the work done squeezing it is stored as ${M('E_e = ½kx^2')}: the area under the force–compression graph, a triangle. Double the compression, four times the energy.`],
      ['Chaining the conversions', `With no friction, ${M('½kx^2 = ½mv^2 = mgh')}. So the block reaches ${M('h = kx^2/2mg')} whatever the angle of the ramp. This is exactly how a pinball plunger, a bow and arrow or a trampoline works.`],
    ],
    practice: (p, h) => [
      `Doubling the compression to ${fmt(2 * p.x)} m would send the block ${h.r(4 * launch(p).hMax)} m high, four times as high.`,
      `A pole vaulter does the same in reverse: running speed bends the pole (elastic energy), which then lifts the vaulter over the bar.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'm-energy', group: GROUP, symbol: 'E', title: 'Work and energy', modes: [energyConcept, energyWork, energySpring] });

  // =====================================================================
  // Momentum and collisions
  // =====================================================================

  const collide = ({ m1, v1, m2, v2, e }) => {
    const P = m1 * v1 + m2 * v2, rel = v1 - v2;
    const w1 = (P - m2 * e * rel) / (m1 + m2), w2 = (P + m1 * e * rel) / (m1 + m2);
    return { P, w1, w2, KE0: 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2, KE1: 0.5 * m1 * w1 * w1 + 0.5 * m2 * w2 * w2 };
  };
  const TC = 2;
  const momConcept = {
    id: 'concept',
    label: 'Collisions',
    lede: 'Two carts collide. However they bounce or stick, the total momentum after is exactly the total before.',
    build: 3.2,
    compact: true,
    params: {
      m1: { value: 2, min: 1, max: 5, step: 0.5, color: 'a', label: 'left cart mass in kilograms' },
      v1: { value: 4, min: 1, max: 6, step: 0.5, color: 'a', label: 'left cart velocity in m/s' },
      m2: { value: 3, min: 1, max: 5, step: 0.5, color: 'b', label: 'right cart mass in kilograms' },
      v2: { value: -1, min: -4, max: 3, step: 0.5, color: 'b', label: 'right cart velocity in m/s (negative is leftward)' },
      e: { value: 1, min: 0, max: 1, step: 0.25, color: 'c', label: 'bounciness: 1 elastic, 0 they stick' },
    },
    constrain: (p, key) => (p.v1 > p.v2 ? p : key === 'v2' ? { ...p, v1: Math.min(6, p.v2 + 1) } : { ...p, v2: Math.max(-4, p.v1 - 1) }),
    sim: { duration: () => 5 },
    formula: (p, h) => `${h.n('m1')}${op('×')}${h.n('v1')}${op('+')}${h.n('m2')}${op('×')}(${h.n('v2')})${op('=')}${h.r(collide(p).P)}${h.unit('kg·m/s')}`,
    aside: (p, h) => { const c = collide(p); return `<div>After: ${h.val('m1')} × ${h.c('a', fmt(c.w1), 'w1')} + ${h.val('m2')} × ${h.c('b', fmt(c.w2), 'w2')} = ${h.c('ink', fmt(c.P), 'res2')}, the same. Bounciness ${h.n('e')}: kinetic energy ${fmt(c.KE0, 1)} → ${fmt(c.KE1, 1)} J.</div>`; },
    readout: (p, h, { t }) => { const c = collide(p), a = t < TC; return h.ro('time', fmt(t, 1), 's') + h.ro('left', fmt(a ? p.v1 : c.w1), 'm/s', 'a') + h.ro('right', fmt(a ? p.v2 : c.w2), 'm/s', 'b') + h.ro('total p', fmt(c.P), 'kg·m/s'); },
    steps: [
      { at: 0, hl: ['m1', 'm2'], say: 'Two carts on a smooth track.' },
      { at: 0.25, hl: ['v1', 'v2'], say: 'Each has a velocity; right is positive, so a cart moving left has a negative velocity.' },
      { at: 0.5, hl: ['res'], say: (p) => `Momentum is mass × velocity. Add them with their signs: total ${fmt(collide(p).P)} kg·m/s.` },
      { at: 0.75, hl: ['w1', 'w2', 'res2'], say: 'During the crash each cart pushes the other equally hard for the same time (third law), so whatever one gains the other loses. The total can’t change.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(4)), sfx.glide(0.25, 0.45, pitch(p.v1 * 2), pitch(p.v1 * 2)), sfx.chord(0.52, [note(4), note(6)]), sfx.thud(0.76)],
    simSay: (p, h, { t }) => { const c = collide(p); if (t < TC) return 'Before: the momentum bars on the right show each cart’s share and the total.'; return p.e === 0 ? `They stick and move together at ${fmt(c.w1)} m/s. Some kinetic energy turned into heat and dents, but momentum is conserved.` : p.e === 1 ? 'A perfectly elastic bounce: momentum and kinetic energy are both conserved.' : 'A partly bouncy collision: momentum conserved, some kinetic energy lost to heat and sound.'; },
    simSfx: () => [sfx.thud(TC)],
    draw(p, h, { k, t }) {
      const c = collide(p), y = 200;
      const w1 = 40 + p.m1 * 12, w2 = 40 + p.m2 * 12;
      // Left cart's right edge and right cart's left edge meet at x = 0 at the collision time.
      const e1 = (tt) => (tt < TC ? p.v1 * (tt - TC) : c.w1 * (tt - TC)), e2 = (tt) => (tt < TC ? p.v2 * (tt - TC) : c.w2 * (tt - TC));
      let lo = Infinity, hi = -Infinity;
      for (const tt of [0, TC, 5]) { lo = Math.min(lo, e1(tt), e2(tt)); hi = Math.max(hi, e1(tt), e2(tt)); }
      const sc = Math.min(70, 520 / Math.max(hi - lo, 1)), X = (x) => 400 + (x - (lo + hi) / 2) * sc;
      let s = S.fade(seg(k, 0, 0.2), S.line(40, y, 760, y, 'grid2', 1.5));
      const x1 = X(e1(t)), x2 = X(e2(t));
      s += S.fade(seg(k, 0, 0.2), MV.phys.cart(x1, y, w1, 'a', `${fmt(p.m1)} kg`) + MV.phys.cart(x2 + w2, y, w2, 'b', `${fmt(p.m2)} kg`));
      const va = t < TC ? p.v1 : c.w1, vb = t < TC ? p.v2 : c.w2, u1 = seg(k, 0.25, 0.45);
      if (Math.abs(va) > 0.05) s += S.fade(u1, S.arrow(x1 - w1 / 2, y - 50, x1 - w1 / 2 + va * 18, y - 50, 'a', 3) + label(x1 - w1 / 2 + va * 18, y - 60, `${fmt(va)} m/s`, { fill: 'a', size: 11 }));
      if (Math.abs(vb) > 0.05) s += S.fade(u1, S.arrow(x2 + w2 / 2, y - 50, x2 + w2 / 2 + vb * 18, y - 50, 'b', 3) + label(x2 + w2 / 2 + vb * 18, y - 60, `${fmt(vb)} m/s`, { fill: 'b', size: 11 }));
      // Momentum bars, before and after.
      const pb = 140 / Math.max(1, Math.abs(p.m1 * p.v1), Math.abs(p.m2 * p.v2), Math.abs(p.m1 * c.w1), Math.abs(p.m2 * c.w2), Math.abs(c.P)), base = 340, u2 = seg(k, 0.5, 0.7), u3 = seg(k, 0.75, 0.95);
      const row = (x0, a, b, title) => {
        let r = caption(x0, 262, title) + S.line(x0, base, x0 + 300, base, 'grid2', 1);
        const ax = x0 + 150;
        r += S.rect(Math.min(ax, ax + a * pb), base - 30, Math.abs(a * pb), 14, 'a', null, { rx: 2 }) + S.rect(Math.min(ax, ax + b * pb), base - 14, Math.abs(b * pb), 14, 'b', null, { rx: 2 });
        r += S.rect(Math.min(ax, ax + (a + b) * pb), base + 6, Math.abs((a + b) * pb), 14, 'ink', null, { rx: 2 }) + S.line(ax, base - 36, ax, base + 26, 'muted', 1);
        r += label(x0 + 306, base + 18, `total ${fmt(a + b)}`, { size: 11, anchor: 'start' });
        return r;
      };
      s += S.fade(u2, row(40, p.m1 * p.v1, p.m2 * p.v2, 'momentum before (kg·m/s)'));
      s += S.fade(t >= TC ? 1 : u3 * 0.35, row(420, p.m1 * c.w1, p.m2 * c.w2, 'momentum after'));
      return s;
    },
    theory: [
      ['Momentum', `An object's momentum is its mass times its velocity, ${M('p = mv')}, measured in kg·m/s. It has a direction: a cart moving left has negative momentum. A heavy truck crawling and a light bullet flying can carry the same momentum.`],
      ['Conservation', `In an isolated system, where no outside force acts, the total momentum never changes: ${M('m_1 v_1 + m_2 v_2 = m_1 v_1′ + m_2 v_2′')}. The reason is the third law: during the collision each body pushes the other equally hard for the same time, so their momentum changes are equal and opposite.`],
      ['Elastic and inelastic', `In an <em>elastic</em> collision kinetic energy is also conserved; the carts bounce apart. In an <em>inelastic</em> one, some kinetic energy turns into heat, sound and dents. In a <em>perfectly inelastic</em> collision the bodies stick together: ${M('v′ = (m_1 v_1 + m_2 v_2)/(m_1 + m_2)')}. Momentum is conserved in all three.`],
      ['Impulse', `A force acting for a time changes momentum: ${M('FΔt = Δp')}. The product ${M('FΔt')} is called the <em>impulse</em>.`],
    ],
    practice: null,
  };

  const STOP_DASH = 0.01;
  const momAirbag = {
    id: 'airbag',
    label: 'Airbags',
    lede: 'In a crash your head must lose all its momentum. An airbag can’t change how much, only how long it takes, and that changes the force.',
    build: 1,
    params: {
      v: { value: 15, min: 5, max: 30, step: 1, color: 'a', label: 'speed in m/s', digits: 0 },
      dt: { value: 0.12, min: 0.03, max: 0.3, step: 0.01, color: 'b', label: 'airbag stopping time in seconds' },
    },
    sim: { duration: () => 4.2 },
    formula: (p, h) => `${h.v('F')}${op('=')}${h.frac(`5${op('×')}${h.n('v')}`, h.n('dt'))}${op('=')}${h.r(Math.round((5 * p.v) / p.dt), 0)}${h.unit('N')}`,
    aside: (p, h) => `<div>Same momentum lost, ${5 * p.v} kg·m/s, against a hard dashboard in ${STOP_DASH} s: ${h.c('c', fmt((5 * p.v) / STOP_DASH, 0), 'hard')} N, ${h.c('ink', fmt(p.dt / STOP_DASH, 0), 'ratio')} times more.</div>`,
    readout: (p, h) => h.ro('head', '5', 'kg') + h.ro('momentum', fmt(5 * p.v, 0), 'kg·m/s'),
    steps: [{ at: 0, hl: [], say: 'Two crash-test heads, 5 kg each, heading forward at the same speed. One will hit a dashboard, the other an airbag.' }],
    simSay: (p, h, { t }) => (t < 1.5 ? 'Same mass, same speed: the same momentum to lose.' : t < 3.2 ? 'In slow motion: the dashboard stops the head almost instantly; the airbag stops it gently over a longer time.' : `Both lost ${5 * p.v} kg·m/s. The airbag took ${fmt(p.dt / STOP_DASH, 0)} times longer, so the force was ${fmt(p.dt / STOP_DASH, 0)} times smaller: the area under each force curve is the same.`),
    simSfx: () => [sfx.thud(1.5), sfx.swoosh(1.5, 3)],
    draw(p, h, { k, t }) {
      const slow = 4, hit = 1.5, xw = 440, pxm = 60; // 4 s of animation show the first 0.4 s of the crash
      const real = Math.max(0, ((t - hit) / slow) * 0.4);
      const lanes = [[130, STOP_DASH, 'c', 'dashboard', 0], [270, p.dt, 'b', 'airbag', 70]];
      let s = '';
      for (const [y, d, col, name, pad] of lanes) {
        const contact = xw - pad, stopDist = Math.min(pad, (p.v * d * pxm) / 2);
        // Constant deceleration from v to 0 over the time d.
        const travelled = t < hit ? -(hit - t) * 120 : Math.min(1, real / d) * stopDist * (2 - Math.min(1, real / d));
        s += S.fade(seg(k, 0, 0.6), caption(60, y - 64, name)) + S.rect(xw, y - 60, 16, 120, 'ink-soft', 'ink', { 'stroke-width': 1.5 });
        if (pad) { const inflate = clamp01((t - 1.0) * 4), squash = t < hit ? 0 : travelled; s += S.fade(inflate, S.rect(contact + squash, y - 50, xw - contact - squash, 100, 'b-soft', 'b', { rx: 24, 'stroke-width': 1.5 })); }
        const hx = contact + travelled;
        s += S.circle(hx - 22, y, 22, `${col}-soft`, col, { 'stroke-width': 2 }) + S.circle(hx - 12, y - 6, 3, col);
      }
      // Force against time (slow motion): a tall narrow spike against a low wide hump, the same area.
      const peak = ((5 * p.v) / STOP_DASH) * (Math.PI / 2);
      const Gr = graph({ x0: 520, x1: 760, y0: 360, y1: 80, tMax: 0.32, vMax: peak * 1.05, tLabel: 'time (s)', vLabel: 'force (N)', ticks: false });
      s += S.fade(seg(k, 0, 0.6), Gr.s);
      const pulse = (d, col) => { const Fm = ((5 * p.v) / d) * (Math.PI / 2), end = Math.min(d, real); if (end <= 0) return ''; return S.path(path(40, (u) => { const q = u * end; return [Gr.X(q), Gr.Y(Fm * Math.sin((Math.PI * q) / d))]; }), col, 2.5); };
      s += pulse(STOP_DASH, 'c') + pulse(p.dt, 'b');
      s += S.fade(clamp01((t - 3.2) * 2), label(640, 70, 'same area: same impulse', { size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Impulse', `To stop, your head must lose all its momentum, ${M('Δp = mv')}. A force ${M('F')} acting for a time ${M('Δt')} changes the momentum by ${M('FΔt')}, so the average force is ${M('F = Δp/Δt')}. The momentum to lose is fixed by the crash; the time is not.`],
      ['Stretching the time', `A hard dashboard stops a head in about a hundredth of a second. An airbag, crumple zones and a seat belt that stretches a little all make the stop last ten or more times longer, so the force drops to a tenth. The same idea is behind bending your knees when you land, catching an egg with soft hands, and padded helmets.`],
    ],
    practice: (p, h) => [
      `At ${h.val('v')} m/s, a 5 kg head stopped in ${fmt(STOP_DASH)} s feels ${h.r((5 * p.v) / STOP_DASH, 0)} N, the weight of ${fmt((5 * p.v) / STOP_DASH / g, 0)} kg.`,
      `Gymnasts land on thick mats for the same reason: the mat stretches the stopping time.`,
    ],
  };

  MV.register({ realm: 'phys', id: 'm-momentum', group: GROUP, symbol: 'p', title: 'Momentum and collisions', modes: [momConcept, momAirbag] });
})();
