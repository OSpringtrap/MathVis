// Waves: the wave equation, wave phenomena (a ripple tank), sound, standing waves and the electromagnetic spectrum.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, clamp01, M, sfx, pitch, note } = MV;
  const { caption, label, path, graph, spring, spectral } = MV.phys;
  const GROUP = 'Waves';
  const op = (s) => `<span class="op">${s}</span>`;
  const RAD = Math.PI / 180;
  const TAU = 2 * Math.PI;
  // Audible stand-in for slow waves: map a few hertz up into a comfortable pitch.
  const hear = (f) => Math.min(900, 160 * Math.max(0.25, f));

  // ---------- Ripple-tank helpers ----------
  // Clip to a convex polygon.
  const clipPoly = (id, poly) => ({ defs: `<defs><clipPath id="${id}"><polygon points="${poly.map((p) => p.join(',')).join(' ')}"/></clipPath></defs>`, clip: (inner) => `<g clip-path="url(#${id})">${inner}</g>` });
  // The part of a rectangle on one side of a line through B with normal n (side > 0 keeps (p − B)·n > 0).
  function halfRect([x0, y0, x1, y1], B, n, side) {
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], f = (p) => side * ((p[0] - B[0]) * n[0] + (p[1] - B[1]) * n[1]), out = [];
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if (fa * fb < 0) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  // Straight wavefronts: lines perpendicular to d at distances s from O (long lines, to be clipped).
  const front = (O, d, s, col = 'a', w = 2.5, o = 1) => { const c = [O[0] + d[0] * s, O[1] + d[1] * s], p = [-d[1], d[0]]; return S.line(c[0] - p[0] * 900, c[1] - p[1] * 900, c[0] + p[0] * 900, c[1] + p[1] * 900, col, w, { opacity: o }); };
  const TANK = [40, 40, 760, 390];
  const tank = () => S.rect(TANK[0], TANK[1], TANK[2] - TANK[0], TANK[3] - TANK[1], 'a-soft', null, { rx: 6, opacity: 0.5 });

  // =====================================================================
  // The wave equation
  // =====================================================================

  const wavePic = ({ lam, f, A = 50 }, k, t, { x0 = 60, x1 = 740, y = 220, sc = 55, showMark = true } = {}) => {
    const yAt = (xm, tt) => A * Math.sin(TAU * (xm / lam - f * tt));
    const len = (x1 - x0) / sc, grow = seg(k, 0, 0.3);
    let s = S.line(x0, y, x1, y, 'grid2', 1, dashed('3 5'));
    s += S.path(path(240, (u) => { const xm = u * len * Math.max(grow, t > 0 ? 1 : 0); return [x0 + xm * sc, y - yAt(xm, t)]; }), 'ink', 3);
    if (showMark) {
      const xm = 2.5 * lam > len ? len * 0.3 : 2.25 * lam;
      s += S.fade(seg(k, 0.36, 0.5), S.line(x0 + xm * sc, y - 70, x0 + xm * sc, y + 70, 'b', 1, dashed('2 4')) + S.circle(x0 + xm * sc, y - yAt(xm, t), 8, 'b'));
    }
    return { s, yAt, len };
  };
  const eqConcept = {
    id: 'concept',
    label: 'Speed, wavelength, frequency',
    lede: 'A wave carries a shape along without carrying the material. Each crest moves one wavelength in the time a point bobs up and down once.',
    build: 3.4,
    params: {
      lam: { value: 2, min: 0.5, max: 4, step: 0.25, color: 'a', label: 'wavelength in metres' },
      f: { value: 0.5, min: 0.25, max: 2, step: 0.25, color: 'b', label: 'frequency in hertz (bobs per second)' },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('v')}${op('=')}${h.n('lam')}${op('×')}${h.n('f')}${op('=')}${h.r(p.lam * p.f)}${h.unit('m/s')}`,
    aside: (p, h) => `<div>Period ${h.v('T')} = 1/${h.v('f')} = ${h.c('b', fmt(1 / p.f), 'T')} s: in that time each crest moves one wavelength, ${h.val('lam')} m.</div>`,
    readout: (p, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('bobs', fmt(Math.floor(t * p.f + 1e-9), 0)) + h.ro('crest moved', fmt(p.lam * p.f * t, 1), 'm'),
    steps: [
      { at: 0, hl: ['lam'], say: ({ lam }) => `A wave on a long rope. The distance from one crest to the next is the wavelength, λ = ${fmt(lam)} m.` },
      { at: 0.36, hl: ['f'], say: ({ f }) => `Watch one point of the rope (the dot): it only moves up and down, ${fmt(f)} times a second. That’s the frequency.` },
      { at: 0.66, hl: ['res', 'T'], say: (p) => `During one bob, a crest moves exactly one wavelength. So it moves λ × f = ${fmt(p.lam * p.f)} m every second: the wave speed.` },
    ],
    sfx: (p) => [sfx.pop(0.02, note(4)), sfx.hum(0.36, 0.6, hear(p.f), [1], 0.6), sfx.chime(0.7, note(7))],
    simSay: (p) => `The dot only bobs; the crest (the triangle) travels. Each tick is one full bob, and in that time the crest has moved ${fmt(p.lam)} m.`,
    simSfx: (p) => Array.from({ length: Math.floor(8 * p.f) }, (_, i) => sfx.tick((i + 1) / p.f, pitch(5))),
    draw(p, h, { k, t }) {
      const W = wavePic(p, k, t), x0 = 60, sc = 55, y = 220;
      let s = W.s;
      // Wavelength bracket between two crests (at t = 0 a crest sits at x = λ/4).
      const c1 = p.lam / 4 + p.f * p.lam * t % p.lam, c2 = c1 + p.lam;
      if (c2 < W.len) s += S.fade(seg(k, 0.1, 0.3), S.line(x0 + c1 * sc, y - 80, x0 + c2 * sc, y - 80, 'a', 2) + S.line(x0 + c1 * sc, y - 86, x0 + c1 * sc, y - 74, 'a', 2) + S.line(x0 + c2 * sc, y - 86, x0 + c2 * sc, y - 74, 'a', 2) + label(x0 + ((c1 + c2) / 2) * sc, y - 92, `λ = ${fmt(p.lam)} m`, { fill: 'a', weight: 600 }));
      // A crest marker travelling with the wave.
      const cm = (p.lam / 4 + p.lam * p.f * t) % W.len;
      s += S.fade(seg(k, 0.66, 0.8), S.poly([[x0 + cm * sc, y - 58], [x0 + cm * sc - 8, y - 72], [x0 + cm * sc + 8, y - 72]], 'c', null));
      s += S.fade(seg(k, 0.66, 0.8), S.arrow(300, 340, 300 + p.lam * p.f * sc, 340, 'c', 3) + label(300 + (p.lam * p.f * sc) / 2, 362, `crest moves ${fmt(p.lam * p.f)} m each second`, { fill: 'c', size: 12 }));
      s += S.fade(seg(k, 0, 0.3), caption(60, 60, 'A rope, shaken at one end. Ruler marks every metre.'));
      for (let m = 0; m <= W.len; m++) s += S.fade(seg(k, 0, 0.3), S.line(x0 + m * sc, 296, x0 + m * sc, 304, 'grid2', 1.5) + (m % 2 ? '' : label(x0 + m * sc, 318, `${m}`, { fill: 'muted', size: 10 })));
      return s;
    },
    theory: [
      ['What a wave is', `A wave is a disturbance that travels, carrying energy without carrying matter along with it. A cork on a pond bobs up and down as ripples pass; it isn't swept away. Waves on a rope or water are <em>mechanical</em> (they need a medium); light and radio are <em>electromagnetic</em> and can cross a vacuum.`],
      ['The fundamental equation', `The <em>wavelength</em> ${M('λ')} is the distance between neighbouring crests; the <em>frequency</em> ${M('f')} is how many crests pass a point each second (in hertz); the <em>period</em> ${M('T = 1/f')} is the time for one. In one period a crest moves one wavelength, so the speed is ${M('v = λ/T = λf')}.`],
      ['The medium sets the speed', `The speed depends on the medium, not on how you shake it: sound in air ≈ 343 m/s, in water ≈ 1500 m/s, light in vacuum 300 000 km/s. Shake faster (higher ${M('f')}) and the wavelength gets shorter to keep ${M('λf')} the same.`],
      ['Transverse and longitudinal', `In a <em>transverse</em> wave, like a rope or light, the medium moves across the direction of travel. In a <em>longitudinal</em> wave, like sound, it moves back and forth along it, in compressions and rarefactions.`],
    ],
    practice: null,
  };

  const V_ROPE = 2;
  const eqMedium = {
    id: 'medium',
    label: 'Same rope, faster shaking',
    lede: 'The rope decides how fast waves travel on it. Shake faster, and the waves come out shorter, so that wavelength × frequency stays the same.',
    build: 1,
    params: {
      f: { value: 1, min: 0.25, max: 2, step: 0.25, color: 'b', label: 'how fast you shake, in hertz' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('λ')}${op('=')}${h.frac(`${V_ROPE}`, h.n('f'))}${op('=')}${h.r(V_ROPE / p.f)}${h.unit('m')}`,
    aside: () => `<div>On this rope every wave travels at ${V_ROPE} m/s.</div>`,
    readout: (p, h) => h.ro('λ', fmt(V_ROPE / p.f), 'm') + h.ro('speed', fmt(V_ROPE), 'm/s'),
    steps: [{ at: 0, hl: [], say: 'A rope where waves always travel at 2 m/s.' }],
    simSay: (p) => `Shaking ${fmt(p.f)} times a second, each wave is ${fmt(V_ROPE / p.f)} m long. Double the frequency and the waves are half as long; the speed doesn’t change.`,
    simSfx: (p) => [sfx.hum(0, 2, hear(p.f), [1], 0.6)],
    draw(p, h, { k, t }) {
      const W = wavePic({ lam: V_ROPE / p.f, f: p.f }, 1, t, { showMark: false });
      let s = W.s + S.fade(seg(k, 0, 0.6), caption(60, 60, `Waves leave your hand at ${V_ROPE} m/s, however fast you shake.`));
      const hy = 220 - W.yAt(0, t);
      s += S.circle(52, hy, 10, 'b-soft', 'b', { 'stroke-width': 2 });
      return s;
    },
    theory: [['Fixed speed', `For a given medium the wave speed is fixed, so ${M('λ = v/f')}: frequency and wavelength are inversely proportional. On a guitar string or in air, high notes have short wavelengths and low notes long ones.`]],
    practice: (p, h) => [`Sound at 343 m/s: middle C (262 Hz) has λ = ${h.r(343 / 262, 2)} m; a bass note at 50 Hz is ${h.r(343 / 50, 1)} m long.`],
  };

  MV.register({ realm: 'phys', id: 'w-equation', group: GROUP, symbol: 'λ', title: 'The wave equation', modes: [eqConcept, eqMedium] });

  // =====================================================================
  // Wave phenomena (a ripple tank seen from above)
  // =====================================================================

  const WSPEED = 50; // px per second for ripples
  const phReflection = {
    id: 'reflection',
    label: 'Reflection',
    lede: 'Straight ripples hit a wall at an angle and bounce off at the same angle, just like light off a mirror.',
    build: 2.4,
    params: {
      th: { value: 35, min: 0, max: 65, step: 1, color: 'a', label: 'angle of incidence in degrees', digits: 0 },
    },
    sim: { duration: () => 14 },
    formula: (p, h) => `${h.v('θ')}<sub>r</sub>${op('=')}${h.v('θ')}<sub>i</sub>${op('=')}${h.n('th')}${h.unit('°')}`,
    aside: () => '<div>Wavelength, frequency and speed are unchanged by the bounce.</div>',
    steps: [
      { at: 0, hl: [], say: 'A ripple tank, seen from above. Lines are wave crests; a wall on the right.' },
      { at: 0.4, hl: ['th'], say: 'The ripples travel along the arrow and meet the wall at an angle to its normal.' },
      { at: 0.7, hl: [], say: 'They reflect off at the same angle on the other side of the normal. Press play to send the waves in.' },
    ],
    sfx: () => [sfx.splash(0.02), sfx.glide(0.4, 0.6, pitch(7), pitch(0)), sfx.glide(0.7, 0.9, pitch(0), pitch(7))],
    simSay: () => 'Each crest reaches the wall one end first; the reflected crest heads off the other way, keeping the same spacing.',
    simSfx: () => [sfx.splash(0.1), sfx.splash(7)],
    draw(p, h, { k, t }) {
      const wx = 600, th = p.th * RAD, d = [Math.cos(th), Math.sin(th)], O = [60, 60], lam = 46;
      const C = clipPoly('ph-refl', [[TANK[0], TANK[1]], [wx, TANK[1]], [wx, TANK[3]], [TANK[0], TANK[3]]]);
      let fr = '';
      if (t > 0) {
        const lead = WSPEED * t;
        for (let n = 0; n * lam < lead; n++) {
          const s0 = lead - n * lam;
          fr += front(O, d, s0, 'a', 2.5);
          // The mirror image of the same crest, across the wall: the reflected crest.
          const Om = [2 * wx - O[0], O[1]], dm = [-d[0], d[1]];
          fr += front(Om, dm, s0, 'c', 2.5);
        }
      }
      let s = tank() + C.defs + C.clip(fr) + S.rect(wx, TANK[1], 14, TANK[3] - TANK[1], 'ink-soft', 'ink', { 'stroke-width': 2 });
      // Ray diagram.
      const hit = [wx, 230], L = 200, inc = [hit[0] - L * d[0], hit[1] - L * d[1]], out = [hit[0] - L * d[0], hit[1] + L * d[1]];
      s += S.fade(seg(k, 0.4, 0.6), S.line(hit[0] - 160, hit[1], hit[0], hit[1], 'muted', 1.5, dashed('5 5')) + S.arrow(...inc, hit[0] - 6 * d[0], hit[1] - 6 * d[1], 'a', 3) + label(hit[0] - 70, hit[1] - 12, `θi ${fmt(p.th)}°`, { fill: 'a', size: 12, weight: 600 }));
      s += S.fade(seg(k, 0.7, 0.9), S.arrow(...hit, ...out, 'c', 3) + label(hit[0] - 70, hit[1] + 24, `θr ${fmt(p.th)}°`, { fill: 'c', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Reflection', `When a wave meets a barrier it bounces back, with the angle of reflection equal to the angle of incidence. Speed, wavelength and frequency are unchanged because the wave stays in the same medium. Echoes, sonar and radar all rely on reflected waves.`],
      ['Reflection on a rope', `A pulse reflected from a fixed end comes back upside down; from a free end, the right way up. Reflections like these are what set up standing waves.`],
    ],
    practice: () => ['A ship’s sonar times the echo from the sea floor: at 1500 m/s, a 2 s echo means the floor is 1500 m down.'],
  };

  const phRefraction = {
    id: 'refraction',
    label: 'Refraction',
    lede: 'Ripples slow down in shallow water. Crossing into it at an angle, they bunch up and swing round to a new direction.',
    build: 2.4,
    compact: true,
    params: {
      th: { value: 35, min: 0, max: 60, step: 1, color: 'a', label: 'angle of incidence in degrees', digits: 0 },
      r: { value: 0.6, min: 0.3, max: 1, step: 0.05, color: 'c', label: 'speed in shallow water ÷ speed in deep water' },
    },
    sim: { duration: () => 14 },
    formula: (p, h) => `sin ${h.v('θ')}<sub>2</sub>${op('=')}sin ${h.n('th')}°${op('×')}${h.n('r')}${op('⇒')}${h.v('θ')}<sub>2</sub>${op('=')}${h.r(`${fmt(Math.asin(Math.sin(p.th * RAD) * p.r) / RAD, 1)}°`)}`,
    aside: (p, h) => `<div>Frequency unchanged, so the wavelength shrinks in the same ratio: ×${h.val('r')}.</div>`,
    steps: [
      { at: 0, hl: [], say: 'Deep water on the left, shallow water on the right, divided by a slanted edge.' },
      { at: 0.45, hl: ['r'], say: 'In the shallow part the ripples travel more slowly, so the crests are closer together.' },
      { at: 0.75, hl: ['th', 'res'], say: 'The end of each crest that reaches the shallows first slows first, and the crest swings toward the normal.' },
    ],
    sfx: () => [sfx.splash(0.02), sfx.glide(0.45, 0.7, pitch(7), pitch(2))],
    simSay: () => 'Same frequency on both sides, slower speed, shorter wavelength, new direction: that’s refraction, the same thing that bends light in glass.',
    simSfx: () => [sfx.splash(0.1)],
    draw(p, h, { k, t }) {
      const th = p.th * RAD, B = [430, 215], nb = [Math.cos(th), Math.sin(th)], tb = [-Math.sin(th), Math.cos(th)];
      // The refracted direction keeps the sign of the incoming direction's component along the boundary (d1·tb = −sin θ).
      const th2 = Math.asin(Math.sin(th) * p.r), d1 = [1, 0];
      const d2 = [Math.cos(th2) * nb[0] - Math.sin(th2) * tb[0], Math.cos(th2) * nb[1] - Math.sin(th2) * tb[1]];
      const deep = clipPoly('ph-deep', halfRect(TANK, B, nb, -1)), shallow = clipPoly('ph-shal', halfRect(TANK, B, nb, 1));
      const lam = 46, lam2 = lam * p.r;
      let s = S.rect(TANK[0], TANK[1], TANK[2] - TANK[0], TANK[3] - TANK[1], 'a-soft', null, { rx: 6, opacity: 0.6 }) + shallow.defs + deep.defs + shallow.clip(S.rect(TANK[0], TANK[1], 720, 350, 'b-soft', null, { opacity: 0.8 }));
      s += S.line(B[0] - tb[0] * 400, B[1] - tb[1] * 400, B[0] + tb[0] * 400, B[1] + tb[1] * 400, 'b', 2, dashed('6 4'));
      const sh = (WSPEED * (t > 0 ? t : 0)) % lam, u = seg(k, 0.45, 0.7);
      let f1 = '', f2 = '';
      for (let n = -14; n <= 14; n++) { f1 += front(B, d1, n * lam + sh, 'a', 2.5); f2 += front(B, d2, (n * lam + sh) * p.r, 'c', 2.5, u || 0.15); }
      s += deep.clip(f1) + shallow.clip(f2);
      s += S.fade(seg(k, 0.75, 0.9), S.arrow(B[0] - 170, B[1], B[0] - 20, B[1], 'ink', 3) + S.arrow(B[0] + 10 * d2[0], B[1] + 10 * d2[1], B[0] + 170 * d2[0], B[1] + 170 * d2[1], 'ink', 3) + S.line(B[0] - nb[0] * 120, B[1] - nb[1] * 120, B[0] + nb[0] * 120, B[1] + nb[1] * 120, 'muted', 1.5, dashed('3 4')));
      s += label(90, 70, 'deep: faster', { fill: 'a', anchor: 'start', size: 12, weight: 600 }) + label(740, 380, 'shallow: slower', { fill: 'c', anchor: 'end', size: 12, weight: 600 });
      return s;
    },
    theory: [
      ['Refraction of waves', `When a wave passes into a region where it travels at a different speed, its wavelength changes and, if it arrives at an angle, so does its direction: ${M('sin θ_1/sin θ_2 = v_1/v_2 = λ_1/λ_2')}. The frequency never changes, because it's set by the source.`],
      ['Everywhere', `Ocean waves slow in shallow water and swing round to arrive almost parallel to the beach, whatever direction they came from offshore. Sound bends in air layers of different temperature, which is why distant sounds carry further on cool evenings.`],
    ],
    practice: () => ['Waves approaching a headland refract and concentrate their energy on its tip, which is why headlands erode.'],
  };

  const phDiffraction = {
    id: 'diffraction',
    label: 'Diffraction',
    lede: 'Waves passing through a gap spread out into the space behind it. The narrower the gap compared with the wavelength, the more they spread.',
    build: 2.4,
    compact: true,
    params: {
      a: { value: 3, min: 1, max: 8, step: 0.5, color: 'a', label: 'gap width in centimetres' },
      lam: { value: 2, min: 1, max: 4, step: 0.25, color: 'c', label: 'wavelength in centimetres' },
    },
    sim: { duration: () => 14 },
    formula: (p, h) => `sin ${h.v('θ')}${op('≈')}${h.frac(h.n('lam'), h.n('a'))}${op('=')}${h.r(p.lam >= p.a ? 'over 1: spreads everywhere' : `${fmt(Math.asin(p.lam / p.a) / RAD, 0)}°`)}`,
    aside: () => '<div>θ is roughly how far the main beam spreads on each side.</div>',
    steps: [
      { at: 0, hl: [], say: 'Straight ripples heading for a wall with a gap in it.' },
      { at: 0.45, hl: ['a', 'lam'], say: 'Past the gap, the crests curve round into the shadow. Each point of the gap acts like a new little source.' },
      { at: 0.75, hl: ['res'], say: 'The spreading angle depends on λ/a: a gap about one wavelength wide spreads the waves into semicircles; a wide gap lets a nearly straight beam through.' },
    ],
    sfx: () => [sfx.splash(0.02), sfx.swoosh(0.45, 0.7)],
    simSay: (p) => (p.lam >= p.a * 0.7 ? 'Gap comparable to the wavelength: the waves fan out in near semicircles. This is why you can hear someone round a corner.' : 'Wide gap: most of the wave goes straight through, with only the edges curving. Light, with its tiny wavelength, behaves like this almost always.'),
    simSfx: () => [sfx.splash(0.1)],
    draw(p, h, { k, t }) {
      const bx = 300, cy = 215, sc = 22, a = p.a * sc, lam = p.lam * sc, theta = p.lam >= p.a ? Math.PI / 2 : Math.asin(p.lam / p.a);
      let s = tank() + S.rect(bx - 6, TANK[1], 12, cy - a / 2 - TANK[1], 'ink', null) + S.rect(bx - 6, cy + a / 2, 12, TANK[3] - cy - a / 2, 'ink', null);
      const lead = t > 0 ? WSPEED * t : 260;
      const L = clipBox_('ph-dif-l', [TANK[0], TANK[1], bx - 6, TANK[3]]);
      let fl = '', fr = '';
      for (let n = 0; n < 40; n++) {
        const x = TANK[0] + lead - n * lam;
        if (x < TANK[0]) break;
        if (x <= bx) fl += S.line(x, TANK[1], x, TANK[3], 'a', 2.5);
        else {
          const r = x - bx, top = [bx, cy - a / 2], bot = [bx, cy + a / 2], th = Math.min(theta * 1.3, Math.PI / 2);
          const arc = (c, sign) => S.path(path(24, (u) => { const ang = sign * th * u; return [c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)]; }), 'a', 2.5, { opacity: 0.85 });
          fr += S.line(bx + r, cy - a / 2, bx + r, cy + a / 2, 'a', 2.5) + arc(top, -1) + arc(bot, 1);
        }
      }
      const R = clipBox_('ph-dif-r', [bx, TANK[1], TANK[2], TANK[3]]);
      s += L.defs + L.clip(fl) + R.defs + R.clip(S.fade(seg(k, 0.45, 0.7) || (t > 0 ? 1 : 0), fr));
      // Spread angle.
      s += S.fade(seg(k, 0.75, 0.9), S.line(bx, cy, bx + 300 * Math.cos(theta), cy - 300 * Math.sin(theta), 'c', 1.5, dashed('5 4')) + S.line(bx, cy, bx + 300 * Math.cos(theta), cy + 300 * Math.sin(theta), 'c', 1.5, dashed('5 4')) + label(bx + 40, cy - 60, `θ ≈ ${fmt(theta / RAD, 0)}°`, { fill: 'c', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Diffraction', `Waves bend round obstacles and spread out through gaps. The effect is strongest when the gap or obstacle is about the size of the wavelength. The main beam through a slit of width ${M('a')} spreads to roughly ${M('sin θ ≈ λ/a')} on each side.`],
      ['Sound versus light', `Sound wavelengths are centimetres to metres, similar to doorways, so sound diffracts round corners easily. Visible light's wavelength is under a micrometre, so it casts sharp shadows; you only see it diffract through very fine slits, or in the rainbow sheen of a CD.`],
      ['Limits of seeing', `Diffraction limits how fine a detail any telescope, microscope or eye can resolve: a bigger aperture (larger ${M('a')}) means less spreading and sharper images.`],
    ],
    practice: () => ['Long-wave radio (wavelengths of kilometres) diffracts over hills; FM radio (3 m) doesn’t, which is why it fades in valleys.'],
  };
  function clipBox_(id, [x0, y0, x1, y1]) { return MV.phys.clipBox(id, x0, y0, x1 - x0, y1 - y0); }

  const phInterference = {
    id: 'interference',
    label: 'Interference',
    lede: 'Two sources make overlapping ripples. Where crest meets crest the water heaves; where crest meets trough it stays still. A pattern of calm and rough lines fans out.',
    build: 2.4,
    compact: true,
    params: {
      d: { value: 4, min: 1, max: 8, step: 0.5, color: 'b', label: 'distance between the sources in centimetres' },
      lam: { value: 1.5, min: 0.75, max: 3, step: 0.25, color: 'c', label: 'wavelength in centimetres' },
    },
    sim: { duration: () => 12 },
    formula: (p, h) => `${h.v('Δd')}${op('=')}${h.v('m')}${h.n('lam')}${op('⇒')}${h.r(2 * Math.floor(p.d / p.lam) + 1)}${h.unit('loud lines')}`,
    aside: (p, h) => `<div>Constructive where the path difference is a whole number of wavelengths; destructive where it’s a half number. Sources ${h.n('d')} cm apart.</div>`,
    steps: [
      { at: 0, hl: ['d'], say: 'Two dippers bob in step, each sending out circular ripples.' },
      { at: 0.4, hl: ['lam'], say: 'The ripples overlap. At every point, the water’s height is the sum of the two waves: superposition.' },
      { at: 0.7, hl: ['res'], say: 'Along the dashed lines, the distances to the two sources differ by a whole number of wavelengths: crests always meet crests. In between, crests meet troughs and cancel.' },
    ],
    sfx: (p) => [sfx.chord(0.02, [hear(1), hear(1) * 1.002]), sfx.chord(0.72, [note(4), note(8)])],
    simSay: () => 'Watch the screen on the right: bright bands where the waves add, dark bands where they cancel. Thomas Young did this with light in 1801 and proved light is a wave.',
    simSfx: () => [sfx.splash(0.1)],
    draw(p, h, { k, t }) {
      const sc = 26, S1 = [110, 215 - (p.d * sc) / 2], S2 = [110, 215 + (p.d * sc) / 2], lam = p.lam * sc, lead = t > 0 ? WSPEED * t : 900;
      const C = clipBox_('ph-int', [TANK[0], TANK[1], 700, TANK[3]]);
      let rings = '';
      for (let n = 0; n < 60; n++) { const r = lead - n * lam; if (r <= 0) break; if (r > 900) continue; rings += S.circle(...S1, r, null, 'a', { 'stroke-width': 2, opacity: 0.55 }) + S.circle(...S2, r, null, 'c', { 'stroke-width': 2, opacity: 0.55 }); }
      let s = tank() + C.defs + C.clip(S.fade(seg(k, 0.4, 0.6) || (t > 0 ? 1 : 0), rings));
      s += S.circle(...S1, 7, 'a') + S.circle(...S2, 7, 'c');
      // Antinodal lines: points where |PS1| − |PS2| = mλ.
      let lines = '';
      for (let m = -Math.floor(p.d / p.lam); m <= Math.floor(p.d / p.lam); m++) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const r1 = Math.abs(m * lam) + (p.d * sc) * 0.02 + i * 12, r2 = r1 - m * lam;
          if (r2 <= 0) continue;
          const D = p.d * sc, yy = (r1 * r1 - r2 * r2 + D * D) / (2 * D), xx2 = r1 * r1 - yy * yy;
          if (xx2 < 0) continue;
          pts.push([S1[0] + Math.sqrt(xx2), S1[1] + yy]);
        }
        if (pts.length > 1) lines += S.path(MV.phys.pts(pts), 'ink', 1.5, dashed('6 5'));
      }
      s += S.fade(seg(k, 0.7, 0.9), C.clip(lines));
      // Screen with the intensity pattern.
      const sx = 715;
      s += S.rect(sx, TANK[1], 30, TANK[3] - TANK[1], 'card', 'grid2', { 'stroke-width': 1.5 });
      for (let y = TANK[1]; y < TANK[3]; y += 3) {
        const r1 = Math.hypot(sx - S1[0], y - S1[1]), r2 = Math.hypot(sx - S2[0], y - S2[1]), I = Math.cos((Math.PI * (r1 - r2)) / lam) ** 2;
        s += S.rect(sx + 2, y, 26 * I, 3, 'b', null, { opacity: (0.9 * (t > 0 ? 1 : seg(k, 0.7, 0.9))).toFixed(2) });
      }
      s += label(sx + 15, TANK[1] - 8, 'screen', { fill: 'muted', size: 11 });
      return s;
    },
    theory: [
      ['Superposition', `When two waves overlap, the displacement at each point is the sum of the two. Where crest meets crest (or trough meets trough) they reinforce: <em>constructive interference</em>. Where crest meets trough they cancel: <em>destructive interference</em>.`],
      ['Path difference', `At a point whose distances to the two sources differ by ${M('Δd')}, the waves arrive in step if ${M('Δd = mλ')} (m a whole number) and out of step if ${M('Δd = (m + ½)λ')}. These conditions trace out hyperbolas fanning away from the sources.`],
      ['Everyday interference', `Noise-cancelling headphones play sound exactly out of step with outside noise. The colours in soap bubbles and oil films come from light reflected off the top and bottom surfaces interfering. Two speakers playing the same tone have quiet spots in the room.`],
    ],
    practice: () => ['Young’s double slit: light through two slits 0.1 mm apart makes bright fringes a few millimetres apart on a wall 1 m away.'],
  };

  // Polarization: a transverse wave in perspective, through two slits.
  const phPolarization = {
    id: 'polarization',
    label: 'Polarization',
    lede: 'A transverse wave can wiggle in any direction across its path. A polarizer lets through only the part along one direction, like a rope through a picket fence.',
    build: 2.4,
    compact: true,
    params: {
      th: { value: 45, min: 0, max: 90, step: 5, color: 'a', label: 'angle between the two polarizers in degrees', digits: 0 },
    },
    sim: { duration: () => 8 },
    formula: (p, h) => `${h.v('I')}${op('=')}${h.v('I')}<sub>0</sub>${op('×')}cos²${h.n('th')}°${op('=')}${h.r(Math.cos(p.th * RAD) ** 2 * 100, 0)}${h.unit('% of what reaches it')}`,
    aside: () => '<div>Unpolarized light loses half at the first polarizer; the second passes the cos² fraction (Malus’s law).</div>',
    steps: [
      { at: 0, hl: [], say: 'Unpolarized light, like sunlight, wiggles in every direction across its path, changing randomly.' },
      { at: 0.35, hl: [], say: 'The first polarizer only lets through the vertical wiggle: the light comes out polarized, at half the intensity.' },
      { at: 0.65, hl: ['th', 'res'], say: 'A second polarizer at an angle passes only the part of the wiggle along its own direction: amplitude × cos θ, intensity × cos² θ. Crossed at 90°, nothing gets through.' },
    ],
    sfx: () => [sfx.whoosh(0.02, 0.3), sfx.tick(0.36, note(4)), sfx.chime(0.68, note(7))],
    simSay: (p) => (p.th >= 89 ? 'Crossed polarizers: the light after the first is vertical, and the second accepts only horizontal. Darkness.' : 'Turn the second polarizer: the wave it lets through shrinks as the angle grows.'),
    simSfx: () => [sfx.whoosh(0, 8)],
    draw(p, h, { k, t }) {
      const y0 = 220, x0 = 40, p1 = 280, p2 = 520, x1 = 760, A = 60, lam = 70, ph = (x) => TAU * (x / lam - 0.6 * t);
      // Project a transverse displacement at angle α (from vertical) with size s: vertical part up, horizontal part drawn as a slanted depth.
      const proj = (x, s, alpha) => [x + s * Math.sin(alpha) * 0.45, y0 - s * Math.cos(alpha) - s * Math.sin(alpha) * 0.3];
      let s = S.line(x0, y0, x1, y0, 'grid2', 1, dashed('3 5'));
      const dirs = [0, 60, 120, 30, 90, 150];
      dirs.forEach((dg, i) => { s += S.path(path(60, (u) => { const x = lerp(x0, p1, u); return proj(x, A * Math.sin(ph(x) + i * 1.3), dg * RAD); }), i % 2 ? 'b' : 'c', 1.5, { opacity: 0.55 }); });
      const u1 = seg(k, 0.35, 0.55), u2 = seg(k, 0.65, 0.85), c = Math.cos(p.th * RAD);
      s += S.fade(u1, S.path(path(80, (u) => { const x = lerp(p1, p2, u); return proj(x, A * Math.sin(ph(x)), 0); }), 'a', 2.5));
      s += S.fade(u2, S.path(path(80, (u) => { const x = lerp(p2, x1, u); return proj(x, A * c * Math.sin(ph(x)), p.th * RAD); }), 'a', 2.5));
      const slit = (x, ang, col) => `<g transform="translate(${x} ${y0}) skewY(-20) rotate(${ang})">${S.rect(-34, -90, 68, 180, 'ink-soft', 'ink', { 'stroke-width': 2, rx: 6 })}${S.rect(-5, -78, 10, 156, 'card', col, { 'stroke-width': 1.5 })}</g>`;
      s += slit(p1, 0, 'a') + S.fade(u2 || 0.4, slit(p2, p.th, 'a'));
      s += label(p1, 340, 'polarizer', { size: 12 }) + label(p2, 340, `turned ${fmt(p.th)}°`, { size: 12, fill: 'a' });
      const bars = [[160, 1, 'unpolarized'], [400, 0.5, 'half'], [640, 0.5 * c * c, `${fmt(50 * c * c, 0)} %`]];
      bars.forEach(([x, I, lab], i) => { s += S.fade(i === 0 ? 1 : i === 1 ? u1 : u2, S.rect(x - 30, 390 - I * 40, 60, I * 40, 'b-soft', 'b', { 'stroke-width': 1.5 }) + label(x, 404, lab, { fill: 'b', size: 11 })); });
      return s;
    },
    theory: [
      ['Polarization', `Only <em>transverse</em> waves can be polarized: their wiggle has a direction across the line of travel. Light is transverse, so it can be polarized; sound, which is longitudinal, can't. A polarizer passes only the wiggle along its axis.`],
      ['Malus’s law', `Polarized light of intensity ${M('I_0')} meeting a polarizer at angle ${M('θ')} to its direction comes out with ${M('I = I_0 cos^2 θ')}: the amplitude is multiplied by ${M('cos θ')} and intensity goes as amplitude squared.`],
      ['Uses', `Light reflected from water and roads is partly polarized horizontally, so polarized sunglasses with a vertical axis cut the glare. LCD screens work by twisting polarized light, and 3D cinema glasses send differently polarized images to each eye.`],
    ],
    practice: () => ['Tilt your head with polarized sunglasses on while looking at a phone screen: at one angle it goes dark.'],
  };

  // Resonance: a mass on a spring, shaken at the top.
  const F0 = 1;
  const respAmp = (f, Q = 8) => 1 / Math.sqrt((F0 * F0 - f * f) ** 2 + ((F0 * f) / Q) ** 2) / Q;
  const phResonance = {
    id: 'resonance',
    label: 'Resonance',
    lede: 'Everything that can wobble has a natural frequency. Push it in time with that frequency, even gently, and the wobble grows huge.',
    build: 2,
    compact: true,
    params: {
      f: { value: 0.6, min: 0.3, max: 2, step: 0.05, color: 'a', label: 'how often you shake it, in hertz' },
    },
    sim: { duration: () => 12 },
    formula: (p, h) => `${h.n('f')}${h.unit('Hz')}${op(Math.abs(p.f - F0) < 0.03 ? '=' : '≠')}${h.v('f')}<sub>0</sub>${op('=')}${F0}${h.unit('Hz')}${op('→')}${h.r(`×${fmt(respAmp(p.f) / respAmp(0.3) * 1, 1)}`)}`,
    aside: () => '<div>Amplitude compared with very slow shaking. At the natural frequency each push arrives just as the mass starts back down: every push adds energy.</div>',
    readout: (p, h, { t }) => h.ro('time', fmt(t, 1), 's') + h.ro('swing', fmt(respAmp(p.f) * (1 - Math.exp(-t / 3)) * 100 / respAmp(F0), 0), '% of max'),
    steps: [
      { at: 0, hl: [], say: 'A mass on a spring. Pulled and let go, it bounces at its natural frequency, here 1 Hz.' },
      { at: 0.5, hl: ['f', 'res'], say: 'Now shake the top gently and steadily. The response curve shows how big the bouncing gets for each shaking frequency: a sharp peak at the natural frequency.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.curve(0.5, 0.9, Array.from({ length: 30 }, (_, i) => pitch(4 + 10 * respAmp(0.3 + (1.7 * i) / 29) / respAmp(F0))))],
    simSay: (p) => (Math.abs(p.f - F0) < 0.08 ? 'In resonance: each small shake lands at just the right moment, and the bouncing grows and grows (only friction stops it growing forever).' : p.f < F0 ? 'Shaking slower than its natural frequency: the mass just follows the hand, bouncing a little.' : 'Shaking faster than its natural frequency: the mass can’t keep up and barely moves.'),
    simSfx: (p) => [sfx.curve(0, 12, Array.from({ length: 48 }, (_, i) => pitch(2 + 12 * (respAmp(p.f) / respAmp(F0)) * (1 - Math.exp(-(i / 4) / 3)))))],
    draw(p, h, { k, t }) {
      const cx = 200, top = 70, A = respAmp(p.f) / respAmp(F0), grow = 1 - Math.exp(-t / 3);
      const hand = 6 * Math.sin(TAU * p.f * t), disp = 110 * A * grow * Math.sin(TAU * p.f * t - Math.atan2((F0 * p.f) / 8, F0 * F0 - p.f * p.f));
      const my = 260 + disp;
      let s = S.rect(cx - 50, top - 20 + hand, 100, 16, 'ink-soft', 'ink', { rx: 4, 'stroke-width': 2 }) + label(cx + 60, top - 8 + hand, 'hand', { size: 11, anchor: 'start', fill: 'muted' });
      s += `<g transform="rotate(90 ${cx} ${top + hand})">${spring(cx, top + hand, cx + (my - top - hand - 24), 'ink', 12, 12)}</g>`;
      s += S.rect(cx - 30, my - 24, 60, 48, 'b-soft', 'b', { rx: 6, 'stroke-width': 2 }) + S.line(cx - 70, 260, cx - 40, 260, 'muted', 1, dashed('3 3'));
      const Gr = graph({ x0: 430, x1: 760, y0: 370, y1: 90, tMax: 2, vMax: 1.1, tLabel: 'shaking frequency (Hz)', vLabel: 'size of the bounce', ticks: false });
      s += S.fade(seg(k, 0.5, 0.8), Gr.s + S.path(path(160, (u) => { const f = 0.05 + u * 1.95; return [Gr.X(f), Gr.Y(Math.min(1.08, respAmp(f) / respAmp(F0)))]; }), 'c', 2.5) + S.line(Gr.X(F0), Gr.Y(0), Gr.X(F0), Gr.Y(1.05), 'muted', 1, dashed('3 4')) + label(Gr.X(F0), Gr.Y(0) + 16, 'f₀', { size: 12 }) + S.circle(Gr.X(p.f), Gr.Y(Math.min(1.08, A)), 7, 'a'));
      return s;
    },
    theory: [
      ['Natural frequency', `A swing, a wine glass, a bridge or a guitar string all have frequencies at which they naturally vibrate, set by their stiffness and mass. For a mass on a spring, ${M('f_0 = (1/2π)√(k/m)')}.`],
      ['Resonance', `When a periodic push matches the natural frequency, each push adds energy at just the right moment and the amplitude grows enormously, limited only by friction. Push a child on a swing at the top of each swing and they go higher and higher; push at random times and nothing much happens.`],
      ['Useful and dangerous', `Resonance is how you tune a radio (the circuit resonates with one station's frequency), how microwave ovens heat water, and how instruments make loud notes. It can also be destructive: soldiers break step on bridges, and buildings in earthquake zones are designed not to resonate with ground shaking.`],
    ],
    practice: () => ['A singer can shatter a wine glass by holding a loud note exactly at the glass’s natural frequency.'],
  };

  MV.register({ realm: 'phys', id: 'w-phenomena', group: GROUP, symbol: '∿', title: 'Wave phenomena', modesLabel: null, modes: [phReflection, phRefraction, phDiffraction, phInterference, phPolarization, phResonance] });

  // =====================================================================
  // Sound and the Doppler effect
  // =====================================================================

  const TIMBRES = [
    ['pure tone (tuning fork)', [1]],
    ['clarinet-like (odd harmonics)', [1, 0, 0.55, 0, 0.35, 0, 0.22, 0, 0.12]],
    ['violin-like (all harmonics)', [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12]],
    ['organ-like', [1, 0.8, 0.5, 0.45, 0.2, 0.25, 0.1, 0.1]],
  ];
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const noteName = (f) => { const n = Math.round(12 * Math.log2(f / 440)) + 57; return `${NOTE_NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12)}`; };
  const soundConcept = {
    id: 'concept',
    label: 'Pitch, loudness, timbre',
    lede: 'Three things make a sound what it is: how often the air vibrates (pitch), how strongly (loudness), and the mix of overtones in its shape (timbre). Turn your sound on and listen.',
    build: 4,
    compact: true,
    params: {
      f: { value: 220, min: 110, max: 880, step: 10, color: 'a', label: 'frequency in hertz', digits: 0 },
      amp: { value: 0.6, min: 0.1, max: 1, step: 0.05, color: 'b', label: 'amplitude (how hard the air is pushed)' },
      tim: { value: 2, min: 1, max: 4, step: 1, color: 'c', label: 'timbre: 1 pure, 2 clarinet, 3 violin, 4 organ', digits: 0 },
    },
    sim: { duration: () => 3 },
    formula: (p, h) => `${h.v('f')}${op('=')}${h.n('f')}${h.unit('Hz')}${op('→')}${h.r(noteName(p.f))}${op(',')}${h.v('T')}${op('=')}${h.r(fmt(1000 / p.f, 2))}${h.unit('ms')}`,
    aside: (p, h) => `<div>Loudness ${h.n('amp')}: about ${h.c('b', fmt(60 + 20 * Math.log10(p.amp), 0), 'db')} dB. Timbre ${h.n('tim')}: ${h.c('c', TIMBRES[p.tim - 1][0], 'tname')}.</div>`,
    steps: [
      { at: 0, hl: [], say: 'A sound is a pressure wave in the air. The trace shows the pressure at your ear over a few thousandths of a second.' },
      { at: 0.12, hl: ['f'], say: (p) => `Pitch: the air vibrates ${fmt(p.f)} times a second. Faster vibration, higher note. Listen.` },
      { at: 0.4, hl: ['amp', 'db'], say: 'Loudness: the same note, pushed harder. Bigger pressure swings carry more energy: louder.' },
      { at: 0.68, hl: ['tim', 'tname'], say: (p) => `Timbre: same pitch, same loudness, different instrument. The wave’s shape comes from overtones at 2×, 3×, 4×… the frequency, shown as bars: ${TIMBRES[p.tim - 1][0]}.` },
    ],
    sfx: (p) => [sfx.hum(0.12, 0.34, p.f, [1], 0.7), sfx.hum(0.4, 0.5, p.f, [1], 0.25), sfx.hum(0.52, 0.64, p.f, [1], 1), sfx.hum(0.68, 0.95, p.f, TIMBRES[p.tim - 1][1], p.amp * 1.4)],
    simSay: (p) => `Playing ${noteName(p.f)} (${fmt(p.f)} Hz) with the ${TIMBRES[p.tim - 1][0]} timbre.`,
    simSfx: (p) => [sfx.hum(0, 2.8, p.f, TIMBRES[p.tim - 1][1], p.amp * 1.4)],
    draw(p, h, { k, t }) {
      const u1 = seg(k, 0.12, 0.34), u2 = seg(k, 0.4, 0.64), u3 = seg(k, 0.68, 0.92);
      const harm = u3 > 0 ? TIMBRES[p.tim - 1][1] : [1], amp = lerp(0.6, p.amp, u2 || (t > 0 ? 1 : 0));
      const sum = harm.reduce((a, b) => a + b, 0);
      const wave = (x) => harm.reduce((acc, a, i) => acc + a * Math.sin((i + 1) * x), 0) / Math.max(1, sum * 0.6);
      const x0 = 60, x1 = 740, y = 170, ms = 20, cyc = (p.f * ms) / 1000;
      let s = S.rect(x0, 50, x1 - x0, 240, 'card', 'grid2', { rx: 8, 'stroke-width': 1.5 }) + S.line(x0, y, x1, y, 'grid', 1);
      for (let i = 1; i < 10; i++) s += S.line(x0 + (i * (x1 - x0)) / 10, 50, x0 + (i * (x1 - x0)) / 10, 290, 'grid', 1);
      s += label(x1 - 8, 284, `${ms} ms`, { fill: 'muted', size: 11, anchor: 'end' });
      const shift = t * 4;
      s += S.path(path(600, (u) => [x0 + u * (x1 - x0), y - 100 * amp * wave(TAU * (u * cyc * Math.max(u1, t > 0 ? 1 : 0.15)) - shift)]), 'a', 2.5);
      // Overtone bars.
      const bx = 80;
      s += S.fade(u3, caption(bx, 320, 'overtones') + harm.map((a, i) => S.rect(bx + 6 + i * 26, 390 - a * 50, 18, a * 50, 'c-soft', 'c', { 'stroke-width': 1.2 }) + label(bx + 15 + i * 26, 404, `${i + 1}f`, { fill: 'muted', size: 9 })).join(''));
      s += S.fade(u2, caption(470, 330, `louder: ${fmt(60 + 20 * Math.log10(p.amp), 0)} dB`) + S.rect(470, 345, 250 * p.amp, 14, 'b', null, { rx: 3 }));
      s += S.fade(u1, caption(470, 385, `${fmt(p.f)} Hz ≈ ${noteName(p.f)}`));
      return s;
    },
    theory: [
      ['Pitch is frequency', `Sound is a longitudinal pressure wave. Its <em>pitch</em> is set by the frequency: humans hear from about 20 Hz to 20 000 Hz. Doubling the frequency raises the note an octave; concert A is 440 Hz. Below 20 Hz is infrasound (elephants, earthquakes), above 20 kHz ultrasound (bats, medical scans).`],
      ['Loudness is intensity', `<em>Loudness</em> grows with the amplitude of the pressure swings; the energy carried, the intensity ${M('I')}, grows with amplitude squared. Because the ear spans a huge range, loudness is measured in decibels: ${M('β = 10 log(I/I_0)')}. Every +10 dB is ten times the intensity: a whisper is about 30 dB, a conversation 60, a concert 110.`],
      ['Timbre is shape', `A note from an instrument isn't a pure sine wave: it's the fundamental plus <em>overtones</em> at 2, 3, 4… times the frequency, in proportions that depend on the instrument. That mix, the <em>timbre</em>, is why a violin and a flute playing the same note at the same loudness still sound different.`],
      ['The speed of sound', `Sound travels about 343 m/s in air at 20 °C, faster in warmer air, about 1500 m/s in water and 5000 m/s in steel. It can't travel in a vacuum. Counting seconds between lightning and thunder gives the distance: about 3 s per kilometre.`],
    ],
    practice: null,
  };

  const V_S = 343;
  const DISP = 60; // px per second for drawn sound
  const soundDoppler = {
    id: 'doppler',
    label: 'Doppler effect',
    lede: 'An ambulance siren sounds higher as it comes toward you and drops as it passes. Its waves bunch up in front and stretch out behind.',
    build: 1,
    compact: true,
    params: {
      M: { value: 0.4, min: 0, max: 1.5, step: 0.05, color: 'a', label: 'source speed as a fraction of the speed of sound' },
      f: { value: 440, min: 200, max: 800, step: 10, color: 'b', label: 'siren frequency in hertz', digits: 0 },
    },
    sim: { duration: () => 9 },
    formula: (p, h) => `${h.v('f')}′${op('=')}${h.n('f')}${op('×')}${h.frac('343', `343${op('−')}${h.c('a', fmt(p.M * V_S, 0), 'vs')}`)}${op('=')}${h.r(p.M >= 1 ? 'shock wave' : fmt(p.f / (1 - p.M), 0))}${p.M >= 1 ? '' : h.unit('Hz ahead')}`,
    aside: (p, h) => `<div>Behind: ${h.val('f')} × 343 ÷ (343 + ${fmt(p.M * V_S, 0)}) = ${h.c('c', fmt(p.f / (1 + p.M), 0), 'behind')} Hz. Source speed ${h.n('M')} × 343 m/s.</div>`,
    readout: (p, h) => h.ro('ahead', p.M >= 1 ? '—' : fmt(p.f / (1 - p.M), 0), 'Hz', 'a') + h.ro('behind', fmt(p.f / (1 + p.M), 0), 'Hz', 'c'),
    steps: [{ at: 0, hl: [], say: 'A source of sound moving to the right, sending out a wavefront every half second (in slow motion).' }],
    simSay: (p) => (p.M >= 1 ? 'Faster than sound: the source outruns its own waves, which pile up into a cone, a shock wave. On the ground you hear it as a sonic boom.' : p.M > 0 ? 'Each new wavefront starts a little further along, so the fronts are squashed together ahead (higher pitch) and spread out behind (lower pitch). Listen to it pass.' : 'Standing still: the circles are evenly spaced all round.'),
    simSfx: (p) => { const hi = p.M >= 1 ? p.f * 3 : p.f / (1 - p.M), lo = p.f / (1 + p.M); return p.M >= 1 ? [sfx.thud(5), sfx.thud(5.05), sfx.whoosh(5, 7)] : [sfx.curve(0.2, 8.5, Array.from({ length: 40 }, (_, i) => lerp(hi, lo, 0.5 + Math.atan((i - 20) / 3) / Math.PI)))]; },
    draw(p, h, { k, t }) {
      const y = 220, x0 = 110, vs = DISP * p.M, src = x0 + vs * t, every = 0.5;
      let s = S.line(40, y + 150, 760, y + 150, 'grid2', 1.5);
      for (let te = 0; te <= t + 1e-9; te += every) { const r = DISP * (t - te), cx = x0 + vs * te; if (r > 0.5) s += S.circle(cx, y, r, null, 'a', { 'stroke-width': 1.8, opacity: Math.max(0.15, 1 - r / 700).toFixed(2) }); }
      s += S.rect(src - 22, y - 12, 44, 24, 'c', null, { rx: 6 }) + S.circle(src, y - 18, 6, 'b');
      if (p.M > 0) s += S.arrow(src + 26, y, src + 26 + 50 * Math.min(1.5, p.M), y, 'ink', 2.5);
      const ear = (x, text, col) => S.el('ellipse', { cx: x, cy: y + 120, rx: 10, ry: 14, fill: 'card', stroke: col, 'stroke-width': 2 }) + label(x, y + 148, text, { fill: col, size: 12, weight: 600 });
      s += ear(720, p.M >= 1 ? 'boom!' : `hears ${fmt(p.f / (1 - p.M), 0)} Hz`, 'a') + ear(70, `hears ${fmt(p.f / (1 + p.M), 0)} Hz`, 'c');
      if (p.M >= 1 && t > 1) { const ang = Math.asin(1 / p.M), L = vs * t; s += S.line(src, y, src - L * Math.cos(ang), y - L * Math.sin(ang), 'c', 2.5) + S.line(src, y, src - L * Math.cos(ang), y + L * Math.sin(ang), 'c', 2.5); }
      s += S.fade(seg(k, 0, 0.6), caption(60, 50, 'Seen from above, in slow motion'));
      return s;
    },
    theory: [
      ['Moving sources', `A moving source emits each wavefront from a slightly different place. Ahead, the fronts crowd together (shorter wavelength, higher frequency); behind, they spread out. For a source at speed ${M('v_s')}, a listener ahead hears ${M('f′ = f v/(v − v_s)')}, and behind ${M('f v/(v + v_s)')}. A moving listener hears a shift too.`],
      ['Shock waves', `If the source moves faster than sound, it overtakes its own waves; they pile up into a cone-shaped shock wave, heard on the ground as a sonic boom. The cone's half-angle satisfies ${M('sin α = v/v_s')}.`],
      ['Uses', `Police radar and speed cameras measure the Doppler shift of reflected radio waves. Doppler ultrasound shows blood flowing in the heart. Astronomers see light from galaxies shifted toward red: they're moving away, the evidence that the universe is expanding.`],
    ],
    practice: (p, h) => [`An ambulance at 30 m/s with a 700 Hz siren sounds like ${h.r(700 * 343 / 313, 0)} Hz approaching and ${h.r(700 * 343 / 373, 0)} Hz leaving.`],
  };

  MV.register({ realm: 'phys', id: 'w-sound', group: GROUP, symbol: '♪', title: 'Sound and the Doppler effect', modes: [soundConcept, soundDoppler] });

  // =====================================================================
  // Standing waves
  // =====================================================================

  const standString = {
    id: 'string',
    label: 'Vibrating string',
    lede: 'Pluck a string fixed at both ends. Waves bounce back and forth and add up into a pattern that stays in place: still points (nodes) and big wobbles (antinodes).',
    build: 3.2,
    compact: true,
    params: {
      n: { value: 1, min: 1, max: 6, step: 1, color: 'a', label: 'harmonic number (loops on the string)', digits: 0 },
      L: { value: 0.65, min: 0.3, max: 1, step: 0.05, color: 'b', label: 'string length in metres' },
      v: { value: 286, min: 100, max: 400, step: 2, color: 'c', label: 'wave speed on the string in m/s', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `${h.v('f')}<sub>${p.n}</sub>${op('=')}${h.frac(`${h.n('n')}${op('×')}${h.n('v')}`, `2${op('×')}${h.n('L')}`)}${op('=')}${h.r((p.n * p.v) / (2 * p.L), 0)}${h.unit('Hz')}`,
    aside: (p, h) => `<div>Wavelength ${h.v('λ')} = 2${h.v('L')}/${h.v('n')} = ${h.c('a', fmt((2 * p.L) / p.n), 'lam')} m: ${p.n} half-wavelength loop${p.n > 1 ? 's' : ''} fit on the string.</div>`,
    steps: [
      { at: 0, hl: ['L'], say: ({ L }) => `A string ${fmt(L)} m long, fixed at both ends, like a guitar string.` },
      { at: 0.3, hl: ['v'], say: 'A wave runs along it and reflects off each end, upside down. The reflected wave overlaps the original.' },
      { at: 0.6, hl: ['n', 'lam'], say: 'Only waves that fit a whole number of half-wavelengths survive: the ends must stay still. They make a standing wave with n loops.' },
      { at: 0.82, hl: ['res'], say: (p) => `Its frequency: f = nv/2L = ${fmt((p.n * p.v) / (2 * p.L), 0)} Hz. Listen.` },
    ],
    sfx: (p) => [sfx.pop(0.02, note(2)), sfx.swoosh(0.3, 0.55), sfx.hum(0.82, 0.98, (p.n * p.v) / (2 * p.L), [1, 0.4, 0.2], 0.9)],
    simSay: (p) => `The dashed waves travel in opposite directions; their sum (solid) just swells and shrinks in place. ${p.n === 1 ? 'The fundamental: the lowest note.' : `Harmonic ${p.n}: ${p.n} times the fundamental frequency.`}`,
    simSfx: (p) => [sfx.hum(0, 3, (p.n * p.v) / (2 * p.L), [1, 0.4, 0.25, 0.15], 0.9)],
    draw(p, h, { k, t }) {
      const x0 = 80, len = 640, y = 210, A = 70, w = TAU * 0.6 * Math.sqrt(p.n), kx = (p.n * Math.PI) / len, u1 = seg(k, 0.3, 0.55), u2 = seg(k, 0.6, 0.8);
      const tt = t > 0 ? t : 0.15;
      let s = S.rect(x0 - 14, y - 90, 14, 180, 'ink-soft', null) + S.rect(x0 + len, y - 90, 14, 180, 'ink-soft', null);
      const env = (x) => Math.sin(kx * (x - x0));
      s += S.fade(u2, S.path(path(160, (u) => { const x = x0 + u * len; return [x, y - A * env(x)]; }), 'grid2', 1.2, dashed('3 4')) + S.path(path(160, (u) => { const x = x0 + u * len; return [x, y + A * env(x)]; }), 'grid2', 1.2, dashed('3 4')));
      s += S.fade(u1, S.path(path(160, (u) => { const x = x0 + u * len; return [x, y - (A / 2) * Math.sin(kx * (x - x0) - w * tt)]; }), 'b', 1.5, { opacity: 0.6, ...dashed('6 4') }) + S.path(path(160, (u) => { const x = x0 + u * len; return [x, y - (A / 2) * Math.sin(kx * (x - x0) + w * tt)]; }), 'c', 1.5, { opacity: 0.6, ...dashed('6 4') }));
      s += S.path(path(200, (u) => { const x = x0 + u * len; return [x, y - A * env(x) * Math.cos(w * tt)]; }), 'ink', 3);
      for (let i = 0; i <= p.n; i++) s += S.fade(u2, S.circle(x0 + (i * len) / p.n, y, 5, 'a') + label(x0 + (i * len) / p.n, y + 26, 'N', { fill: 'a', size: 11, weight: 600 }));
      for (let i = 0; i < p.n; i++) s += S.fade(u2, label(x0 + ((i + 0.5) * len) / p.n, y - A - 12, 'A', { fill: 'c', size: 11, weight: 600 }));
      s += S.fade(u2, caption(80, 370, 'N: node, never moves. A: antinode, moves most.'));
      return s;
    },
    theory: [
      ['Standing waves', `When two identical waves travel in opposite directions, as a wave and its reflection do, they add to a <em>standing wave</em>: a pattern that oscillates in place. At the <em>nodes</em> the two always cancel; at the <em>antinodes</em>, halfway between, the motion is largest. Neighbouring nodes are half a wavelength apart.`],
      ['Harmonics of a string', `A string fixed at both ends must have nodes at the ends, so only whole numbers of half-wavelengths fit: ${M('L = nλ/2')}. The allowed frequencies are ${M('f_n = nv/2L')}: the <em>fundamental</em> (${M('n = 1')}) and its <em>harmonics</em> at 2, 3, 4… times it. A plucked string vibrates in many of them at once, which gives its timbre.`],
      ['Playing notes', `The wave speed on a string is ${M('v = √(T/μ)')}, set by the tension ${M('T')} and mass per metre ${M('μ')}. Tighten a guitar string to raise its pitch; press it against a fret to shorten ${M('L')}; thicker strings play lower.`],
    ],
    practice: (p, h) => [`Halving the length (pressing at the 12th fret) doubles the frequency to ${h.r((p.n * p.v) / p.L, 0)} Hz: one octave up.`],
  };

  const tubeMode = (closed) => ({
    id: closed ? 'closed' : 'open',
    label: closed ? 'Closed tube' : 'Open tube',
    lede: closed
      ? 'Air in a tube closed at one end: the closed end can’t move (a node), the open end moves freely (an antinode). Only odd harmonics fit.'
      : 'Air in a tube open at both ends, like a flute: both ends are antinodes where the air moves most. All the harmonics fit.',
    build: 2.6,
    compact: true,
    params: {
      m: { value: 1, min: 1, max: closed ? 4 : 5, step: 1, color: 'a', label: closed ? 'mode (harmonic 1, 3, 5, 7)' : 'harmonic number', digits: 0 },
      L: { value: 0.5, min: 0.2, max: 1.5, step: 0.05, color: 'b', label: 'tube length in metres' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => { const n = closed ? 2 * p.m - 1 : p.m; return `${h.v('f')}${op('=')}${h.frac(`${h.c('a', n, 'n')}${op('×')}343`, `${closed ? 4 : 2}${op('×')}${h.n('L')}`)}${op('=')}${h.r((n * V_S) / ((closed ? 4 : 2) * p.L), 0)}${h.unit('Hz')}`; },
    aside: (p, h) => `<div>${closed ? `Harmonic ${2 * p.m - 1}: the tube holds ${2 * p.m - 1} quarter-wavelengths.` : `Harmonic ${p.m}: the tube holds ${p.m} half-wavelengths.`} Mode ${h.n('m')}.</div>`,
    steps: [
      { at: 0, hl: ['L'], say: closed ? 'A tube closed at the left end, like a bottle or a panpipe.' : 'A tube open at both ends, like a flute.' },
      { at: 0.4, hl: ['m'], say: closed ? 'The air at the closed end can’t move: a node. At the open end it moves most: an antinode. The shortest pattern that fits is a quarter wavelength.' : 'Air at both open ends moves freely: antinodes. The shortest pattern that fits is half a wavelength.' },
      { at: 0.72, hl: ['res'], say: 'The dots are slices of air sliding back and forth; the shaded band shows how far they move. Listen to the note.' },
    ],
    sfx: (p) => { const n = closed ? 2 * p.m - 1 : p.m; return [sfx.whoosh(0.02, 0.3), sfx.hum(0.72, 0.98, (n * V_S) / ((closed ? 4 : 2) * p.L), [1, 0.3, 0.15], 0.9)]; },
    simSay: () => (closed ? 'Only odd harmonics: 1, 3, 5… times the fundamental. That’s why a clarinet, acting like a closed tube, has its hollow, distinctive tone.' : 'Every harmonic fits: 1, 2, 3… times the fundamental, a bright, full tone.'),
    simSfx: (p) => { const n = closed ? 2 * p.m - 1 : p.m; return [sfx.hum(0, 3, (n * V_S) / ((closed ? 4 : 2) * p.L), closed ? [1, 0, 0.3, 0, 0.15] : [1, 0.4, 0.2, 0.1], 0.9)]; },
    draw(p, h, { k, t }) {
      const n = closed ? 2 * p.m - 1 : p.m, x0 = 90, len = 600, y = 200, H = 90, w = TAU * 0.5;
      const env = (x) => (closed ? Math.sin(((n * Math.PI) / 2) * ((x - x0) / len)) : Math.cos(n * Math.PI * ((x - x0) / len)));
      let s = S.line(x0, y - H / 2, x0 + len, y - H / 2, 'ink', 3) + S.line(x0, y + H / 2, x0 + len, y + H / 2, 'ink', 3) + (closed ? S.line(x0, y - H / 2, x0, y + H / 2, 'ink', 6) : '');
      const u = seg(k, 0.4, 0.7), tt = t > 0 ? t : 0.2;
      s += S.fade(u, S.path(path(120, (q) => { const x = x0 + q * len; return [x, y - 18 * Math.abs(env(x)) - 2]; }) + ' ' + path(120, (q) => { const x = x0 + (1 - q) * len; return [x, y + 18 * Math.abs(env(x)) + 2]; }).replace('M', 'L'), 'c', 1, { fill: 'c-soft', opacity: 0.8 }));
      for (let i = 0; i <= 40; i++) {
        const xr = x0 + (i * len) / 40, dx = 9 * env(xr) * Math.cos(w * tt) * (u || 0.3);
        for (let j = -2; j <= 2; j++) s += S.circle(xr + dx, y + j * 14, 2.6, 'a', null, { opacity: 0.8 });
      }
      // Displacement curve below: the standing wave pattern.
      s += S.fade(u, S.path(path(160, (q) => { const x = x0 + q * len; return [x, 330 - 40 * env(x)]; }), 'b', 2) + S.path(path(160, (q) => { const x = x0 + q * len; return [x, 330 + 40 * env(x)]; }), 'b', 2) + S.line(x0, 330, x0 + len, 330, 'grid2', 1) + caption(x0, 390, 'how far the air moves along the tube'));
      return s;
    },
    theory: closed ? [
      ['Closed at one end', `At a closed end the air can't move: a displacement node. At the open end it's an antinode. The tube therefore holds an odd number of quarter-wavelengths: ${M('L = nλ/4')} with ${M('n = 1, 3, 5…')}, so ${M('f_n = nv/4L')}. Its fundamental is an octave lower than an open tube of the same length.`],
      ['Bottles and clarinets', `Blowing across a bottle excites its closed-tube resonance; pour in water to shorten the air column and the note rises. A clarinet behaves like a closed tube, which is why its sound lacks even harmonics.`],
    ] : [
      ['Open at both ends', `Both ends are antinodes, so the tube holds whole numbers of half-wavelengths: ${M('L = nλ/2')} and ${M('f_n = nv/2L')} with ${M('n = 1, 2, 3…')}, the same formula as a string, with the speed of sound ${M('v')} ≈ 343 m/s.`],
      ['Wind instruments', `Opening finger holes on a flute effectively shortens the tube, raising the pitch. Organ pipes are tuned by their length: a 2.6 m open pipe sounds about 65 Hz, the lowest C on a piano keyboard's range for many organs.`],
    ],
    practice: (p, h) => { const n = closed ? 2 * p.m - 1 : p.m; return [`A ${h.val('L')} m ${closed ? 'closed' : 'open'} tube in harmonic ${n} sounds at ${h.r((n * V_S) / ((closed ? 4 : 2) * p.L), 0)} Hz.`]; },
  });

  MV.register({ realm: 'phys', id: 'w-standing', group: GROUP, symbol: '≈', title: 'Standing waves', modesLabel: null, modes: [standString, tubeMode(false), tubeMode(true)] });

  // =====================================================================
  // The electromagnetic spectrum
  // =====================================================================

  const BANDS = [
    [-13, -11, 'gamma rays', 'c', 'cancer radiotherapy, sterilising food and equipment; from nuclear decay'],
    [-11, -8, 'X-rays', 'c', 'imaging bones and teeth, airport scanners, studying crystals'],
    [-8, Math.log10(380e-9), 'ultraviolet', 'a', 'sterilising water, sun tans and sunburn, making vitamin D, fluorescence'],
    [Math.log10(380e-9), Math.log10(750e-9), 'visible light', 'ink', 'seeing, photography, fibre optics, lasers'],
    [Math.log10(750e-9), -3, 'infrared', 'c', 'remote controls, thermal cameras, toasters and heat lamps'],
    [-3, -0.5, 'microwaves', 'b', 'microwave ovens, Wi-Fi, mobile phones, radar, satellite links'],
    [-0.5, 4, 'radio waves', 'b', 'radio and TV broadcasting, GPS, radio astronomy'],
  ];
  const SIZES = [[-10, 'an atom'], [-7, 'a virus'], [-5, 'a cell'], [-3, 'a pinhead'], [-1, 'a hand'], [0.5, 'a person'], [2, 'a football pitch']];
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sci = (x, d = 1) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${fmt(m, d)} × 10${String(e).split('').map((c) => SUP[c] || c).join('')}`; };
  const bandAt = (lg) => BANDS.find(([a, b]) => lg >= a && lg < b) || BANDS[BANDS.length - 1];
  MV.phys.waves = { sci, BANDS, bandAt };
  const spectrum = {
    id: 'concept',
    label: 'The spectrum',
    lede: 'Radio, microwaves, infrared, light, ultraviolet, X-rays and gamma rays are all the same thing: electromagnetic waves, travelling at the speed of light, differing only in wavelength.',
    build: 3.2,
    compact: true,
    params: {
      lg: { value: -6.3, min: -12.5, max: 3.5, step: 0.1, color: 'a', label: 'wavelength, as a power of ten in metres' },
    },
    animate: { param: 'lg', speed: 1.6 },
    formula: (p, h) => { const lam = 10 ** p.lg; return `${h.v('f')}${op('=')}${h.frac('3×10⁸', `${h.c('a', sci(lam), 'lam')} m`)}${op('=')}${h.r(sci(3e8 / lam))}${h.unit('Hz')}`; },
    aside: (p, h) => { const lam = 10 ** p.lg, E = (6.626e-34 * 3e8) / lam / 1.602e-19; return `<div>${h.c('ink', bandAt(p.lg)[2], 'band')}: each photon carries ${h.c('c', E >= 0.01 ? fmt(E, E < 10 ? 2 : 0) : sci(E), 'E')} eV. Wavelength 10^${h.n('lg')} m. Press play to sweep from gamma rays to radio.</div>`; },
    steps: [
      { at: 0, hl: [], say: 'The whole electromagnetic spectrum on one line. Each step to the right is ten times longer wavelength.' },
      { at: 0.35, hl: ['lg', 'lam'], say: 'Visible light is a tiny slice in the middle, from about 380 nm (violet) to 750 nm (red).' },
      { at: 0.65, hl: ['res', 'E'], say: 'All travel at c = 300 000 km/s in a vacuum, so shorter wavelength means higher frequency, and more energy per photon: why UV burns and X-rays penetrate.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(2)), sfx.glide(0.35, 0.6, pitch(12), pitch(0)), sfx.chime(0.68, note(7))],
    draw(p, h, { k }) {
      const X = (lg) => 60 + ((lg + 13) / 17) * 680, by = 120, bh = 50, u0 = seg(k, 0, 0.3);
      let s = '';
      BANDS.forEach(([a, b, name, col], i) => {
        const o = clamp01(u0 * 8 - i);
        if (name === 'visible light') for (let nm = 380; nm < 750; nm += 10) s += S.fade(o, S.rect(X(Math.log10(nm * 1e-9)), by, X(Math.log10((nm + 10) * 1e-9)) - X(Math.log10(nm * 1e-9)) + 0.5, bh, spectral(nm), null));
        else s += S.fade(o, S.rect(X(a), by, X(b) - X(a), bh, `${col}-soft`, col, { 'stroke-width': 1 }));
        s += S.fade(o, label((X(a) + X(b)) / 2, i % 2 ? by + bh + 18 : by - 8, name, { size: 11, fill: col === 'ink' ? 'ink' : col, weight: 600 }));
      });
      for (let e = -12; e <= 4; e += 2) s += S.fade(u0, S.line(X(e), by + bh, X(e), by + bh + 6, 'muted', 1) + label(X(e), by + bh + 40, `10${String(e).split('').map((c) => SUP[c] || c).join('')} m`, { fill: 'muted', size: 10 }));
      SIZES.forEach(([e, name]) => { s += S.fade(seg(k, 0.35, 0.6), label(X(e), by + bh + 58, name, { fill: 'muted', size: 9 })); });
      // Marker and a wave drawn at a (log-compressed) wavelength.
      const mx = X(p.lg), band = bandAt(p.lg);
      s += S.poly([[mx, by - 2], [mx - 8, by - 26], [mx + 8, by - 26]], 'ink', null);
      const vis = band[2] === 'visible light', col = vis ? spectral(10 ** p.lg * 1e9) : band[3];
      const lamPx = 10 + ((p.lg + 13) / 17) * 240;
      s += S.fade(seg(k, 0.35, 0.6), S.path(path(300, (u) => { const x = 60 + u * 680; return [x, 290 - 40 * Math.sin((TAU * (x - 60)) / lamPx)]; }), col, 3) + caption(60, 352, '(wave drawn with its length compressed to fit)'));
      s += S.fade(seg(k, 0.65, 0.9), label(400, 380, `${band[2]}: ${band[4]}`, { size: 13, weight: 600 }));
      return s;
    },
    theory: [
      ['One family', `Electromagnetic waves are oscillating electric and magnetic fields that sustain each other as they travel. Maxwell predicted them in 1865 and found their speed came out equal to the measured speed of light: light is one of them. All travel at ${M('c ≈ 3 × 10^8')} m/s in a vacuum, obeying ${M('c = λf')}.`],
      ['From radio to gamma', `In order of decreasing wavelength: radio (metres to kilometres), microwaves (millimetres to centimetres), infrared, visible (380–750 nm), ultraviolet, X-rays and gamma rays (smaller than an atom). The divisions are by how they're produced and used, not sharp physical boundaries.`],
      ['Energy per photon', `Light comes in packets, photons, each with energy ${M('E = hf')}, where ${M('h')} ≈ 6.63 × 10⁻³⁴ J·s is Planck's constant. Radio photons are far too weak to affect molecules. UV, X-ray and gamma photons carry enough energy to break chemical bonds and ionise atoms, which is why they can damage living cells and need shielding.`],
    ],
    practice: (p, h) => [`An FM station at 100 MHz broadcasts with λ = ${h.r(3e8 / 1e8, 0)} m; a microwave oven's 2.45 GHz waves are ${h.r((3e8 / 2.45e9) * 100, 1)} cm long.`],
  };

  MV.register({ ...spectrum, realm: 'phys', id: 'w-spectrum', group: GROUP, symbol: 'γ', title: 'Electromagnetic spectrum' });
})();
