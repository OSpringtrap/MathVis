// Optics: mirrors, refraction, total internal reflection, lenses and the eye.
(() => {
  'use strict';
  const { S, fmt, dashed, seg, lerp, clamp01, M, sfx, pitch, note } = MV;
  const { caption, label, path, clipBox } = MV.phys;
  const GROUP = 'Optics';
  const op = (s) => `<span class="op">${s}</span>`;
  const RAD = Math.PI / 180;
  const deg = (r) => r / RAD;

  // ---------- Ray diagrams for thin lenses and mirrors ----------
  // World units (sc pixels each), axis at height ay, element at ax. A mirror is drawn as a lens "unfolded":
  // everything after the element is reflected back to the left. Paraxial rule: slope out = slope in − height / f.
  function image(f, d) {
    const di = 1 / (1 / f - 1 / d);
    return Number.isFinite(di) && Math.abs(di) < 80 ? { di, m: -di / d } : null;
  }
  function rayDiagram({ f, d, ho = 1.3, mirror = false, k = 1, sc = 50, ax = 420, ay = 220, id = 'rd' }) {
    const box = clipBox(id, 20, 30, 760, 360);
    const Xi = (x) => ax + x * sc, Xo = (x) => ax + (mirror ? -1 : 1) * x * sc, Y = (y) => ay - y * sc;
    const img = image(f, d);
    let s = box.defs + S.line(20, ay, 780, ay, 'grid2', 1.5);
    // The element itself.
    const H = 120;
    if (mirror) {
      const bow = f > 0 ? -18 : 18;
      s += S.path(`M${ax + bow} ${ay - H} Q${ax - bow} ${ay} ${ax + bow} ${ay + H}`, 'ink', 4);
      // Hatching behind the reflecting surface: the curve's x at height y is ax + bow(1 − 4t(1 − t)).
      for (let i = -5; i <= 5; i++) { const tt = (i * 22 + H) / (2 * H), xm = ax + bow * (1 - 4 * tt * (1 - tt)); s += S.line(xm + 4, ay + i * 22, xm + 14, ay + i * 22 - 8, 'grid2', 1.5); }
    } else {
      const b = f > 0 ? 16 : -12, w = f > 0 ? 0 : 10;
      s += S.path(`M${ax - w} ${ay - H} Q${ax - w - b * 2} ${ay} ${ax - w} ${ay + H} L${ax + w} ${ay + H} Q${ax + w + b * 2} ${ay} ${ax + w} ${ay - H} Z`, 'ink', 2, { fill: 'a-soft' });
    }
    // Focal points (and centre of curvature for mirrors).
    const fp = (x, name) => (Math.abs(x) < 7.5 ? S.circle(x, ay, 4, 'ink') + label(x, ay + 20, name, { size: 12, weight: 600 }) : '');
    if (mirror) s += fp(Xo(f), 'F') + fp(Xo(2 * f), 'C');
    else s += fp(Xi(-Math.abs(f)), 'F') + fp(Xi(Math.abs(f)), 'F');
    // The object.
    const u0 = seg(k, 0, 0.18);
    s += S.fade(u0 || 0.3, S.arrow(Xi(-d), Y(0), Xi(-d), Y(ho), 'b', 4) + label(Xi(-d), Y(ho) - 10, 'object', { fill: 'b', size: 12 }));
    // Three principal rays.
    const rays = [{ yl: ho, sIn: 0 }, { yl: 0, sIn: -ho / d }];
    if (Math.abs(d - f) > 1e-6) { const sIn = -ho / (d - f); rays.push({ yl: ho + sIn * d, sIn }); }
    const cols = ['a', 'c', 'b'], at = [0.22, 0.42, 0.62];
    let r = '';
    rays.forEach(({ yl, sIn }, i) => {
      const u = seg(k, at[i], at[i] + 0.16);
      if (u <= 0) return;
      const sOut = sIn - yl / f;
      r += S.line(Xi(-d), Y(ho), Xi(-d) + (Xi(0) - Xi(-d)) * Math.min(1, u * 2), Y(ho + ((yl - ho) * Math.min(1, u * 2))), cols[i], 2.2);
      if (u > 0.5) {
        const v = (u - 0.5) * 2, x1 = 16 * v;
        r += S.line(Xo(0), Y(yl), Xo(x1), Y(yl + sOut * x1), cols[i], 2.2);
        if (img && img.di < 0) r += S.line(Xo(0), Y(yl), Xo(img.di - 1.5), Y(yl + sOut * (img.di - 1.5)), cols[i], 1.3, dashed('5 5'));
      }
    });
    s += box.clip(r);
    // The image.
    const u4 = seg(k, 0.82, 0.96);
    if (img) {
      const x = Xo(img.di), hi = img.m * ho;
      if (x > 20 && x < 780) s += S.fade(u4, S.arrow(x, Y(0), x, Y(hi), 'ink', 4, 12) + (img.di < 0 ? S.line(x, Y(0), x, Y(hi), 'paper', 2, dashed('4 4')) : '') + label(x, Y(hi) + (hi < 0 ? 22 : -10), img.di < 0 ? 'virtual image' : 'real image', { size: 12, weight: 600 }));
    } else s += S.fade(u4, label(ax, 60, 'object at the focus: the rays leave parallel, no image', { size: 13, weight: 600 }));
    return s;
  }
  const describe = (f, d) => {
    const img = image(f, d);
    if (!img) return 'no image: the rays come out parallel';
    const kind = img.di > 0 ? 'real' : 'virtual', way = img.m < 0 ? 'inverted' : 'upright', size = Math.abs(img.m) > 1.02 ? 'larger' : Math.abs(img.m) < 0.98 ? 'smaller' : 'the same size';
    return `${kind}, ${way}, ${size} (×${fmt(Math.abs(img.m), 2)})`;
  };
  MV.phys.optics = { image, rayDiagram, describe };

  // =====================================================================
  // Reflection and mirrors
  // =====================================================================

  const mirrorPlane = {
    id: 'plane',
    label: 'Plane mirror',
    lede: 'Light bounces off a mirror at the same angle it arrives. That one rule is why your reflection seems to stand behind the glass, exactly as far back as you stand in front.',
    build: 3.4,
    params: {
      th: { value: 40, min: 5, max: 80, step: 1, color: 'a', label: 'angle of incidence in degrees', digits: 0 },
      d: { value: 2, min: 1, max: 4, step: 0.25, color: 'b', label: 'candle’s distance from the mirror in metres' },
    },
    formula: (p, h) => `${h.v('θ')}<sub>r</sub>${op('=')}${h.v('θ')}<sub>i</sub>${op('=')}${h.n('th')}${h.unit('°')}`,
    aside: (p, h) => `<div>The candle ${h.n('d')} m in front; its image ${h.c('c', fmt(p.d), 'di')} m behind. Upright, same size, but left and right swapped.</div>`,
    steps: [
      { at: 0, hl: [], say: 'A flat mirror, and a laser beam aimed at it.' },
      { at: 0.18, hl: ['th'], say: ({ th }) => `Measure angles from the normal, the line at right angles to the mirror. The beam arrives at ${fmt(th)}°.` },
      { at: 0.38, hl: [], say: 'It leaves at exactly the same angle on the other side of the normal. Incident ray, normal and reflected ray all lie in one plane.' },
      { at: 0.6, hl: ['d'], say: 'Now a candle. Light from its flame bounces off the mirror into your eye.' },
      { at: 0.8, hl: ['di'], say: 'Your brain traces the light back in a straight line: it seems to come from a point behind the mirror, as far back as the candle is in front. That’s the virtual image.' },
    ],
    sfx: () => [sfx.pop(0.02, note(4)), sfx.glide(0.18, 0.34, pitch(7), pitch(0)), sfx.glide(0.38, 0.54, pitch(0), pitch(7)), sfx.chime(0.82, note(9))],
    draw(p, h, { k }) {
      const mx = 420, sc = 60, my0 = 40, my1 = 390;
      let s = S.line(mx, my0, mx, my1, 'ink', 4);
      for (let y = my0 + 10; y < my1; y += 22) s += S.line(mx + 3, y, mx + 13, y - 8, 'grid2', 1.5);
      // Laser at the top.
      const hy = 130, L = 260, th = p.th * RAD, u1 = seg(k, 0.18, 0.34), u2 = seg(k, 0.38, 0.54);
      const src = [mx - L * Math.sin(th), hy - L * Math.cos(th) * 0.55];
      const ang = Math.atan2(hy - src[1], mx - src[0]);
      s += S.fade(seg(k, 0, 0.16), S.rect(src[0] - 18, src[1] - 7, 36, 14, 'ink', null, { rx: 3, transform: `rotate(${deg(ang).toFixed(1)} ${src[0].toFixed(1)} ${src[1].toFixed(1)})` }));
      s += S.line(src[0], src[1], lerp(src[0], mx, u1), lerp(src[1], hy, u1), 'c', 2.5);
      s += S.fade(u1, S.line(mx - 120, hy, mx, hy, 'muted', 1.5, dashed('5 5')) + label(mx - 126, hy + 4, 'normal', { fill: 'muted', size: 11, anchor: 'end' }));
      const out = [src[0], 2 * hy - src[1]];
      if (u2 > 0) s += S.line(mx, hy, lerp(mx, out[0], u2), lerp(hy, out[1], u2), 'c', 2.5);
      const arc = (a0, a1, r) => S.path(`M${mx - r * Math.cos(a0)} ${hy - r * Math.sin(a0)} A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${mx - r * Math.cos(a1)} ${hy - r * Math.sin(a1)}`, 'a', 2);
      s += S.fade(u1, arc(0, ang, 46) + label(mx - 62 * Math.cos(ang / 2), hy - 62 * Math.sin(ang / 2) + 4, `θi ${fmt(p.th)}°`, { fill: 'a', size: 12, weight: 600 }));
      s += S.fade(u2, arc(0, -ang, 46) + label(mx - 62 * Math.cos(ang / 2), hy + 62 * Math.sin(ang / 2) + 8, `θr ${fmt(p.th)}°`, { fill: 'a', size: 12, weight: 600 }));
      // Candle, eye and image.
      const u3 = seg(k, 0.6, 0.76), u4 = seg(k, 0.8, 0.96), cy = 330, cx = mx - p.d * sc, ix = mx + p.d * sc, eye = [mx - 1.2 * sc, 250];
      const candle = (x, ghost) => S.rect(x - 7, cy - 40, 14, 40, ghost ? null : 'b-soft', 'b', { 'stroke-width': 1.5, ...(ghost ? dashed('3 3') : {}) }) + S.poly([[x, cy - 60], [x - 6, cy - 44], [x + 6, cy - 44]], ghost ? null : 'c', 'c', ghost ? { 'stroke-width': 1.5, ...dashed('2 2') } : {});
      s += S.fade(u3, candle(cx, false) + label(cx, cy + 18, `${fmt(p.d)} m`, { fill: 'b', size: 12 }));
      const flame = [cx, cy - 52], img = [ix, cy - 52];
      // Where the line from the eye to the image crosses the mirror.
      const t = (mx - eye[0]) / (img[0] - eye[0]), P = [mx, eye[1] + (img[1] - eye[1]) * t];
      s += S.fade(u3, S.el('ellipse', { cx: eye[0], cy: eye[1], rx: 16, ry: 9, fill: 'card', stroke: 'ink', 'stroke-width': 2 }) + S.circle(eye[0] + 4, eye[1], 4, 'ink') + S.line(...flame, ...P, 'b', 2) + S.line(...P, ...eye, 'b', 2));
      s += S.fade(u4, S.line(...P, ...img, 'b', 1.5, dashed('5 5')) + candle(ix, true) + label(ix, cy + 18, `${fmt(p.d)} m behind`, { fill: 'c', size: 12 }) + label(ix, cy - 72, 'image', { fill: 'c', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['The law of reflection', `When light reflects, the angle of reflection equals the angle of incidence, ${M('θ_r = θ_i')}, both measured from the <em>normal</em>, the line perpendicular to the surface. On a rough surface, like paper, each tiny patch has its own normal and light scatters in every direction (diffuse reflection); on a smooth one it reflects as a beam (specular reflection).`],
      ['Images in a plane mirror', `Rays from each point of an object reflect into your eye as if they came from a point behind the mirror. This <em>virtual</em> image is upright, the same size, and as far behind the mirror as the object is in front. It's reversed front to back, which is why your reflection's left hand is on your right.`],
      ['Rotating a mirror', `Turn a mirror by an angle α and the reflected beam turns by 2α. Two mirrors at an angle make multiple images: at 90° you see 3, at 60° you see 5, following ${M('N = 360°/α − 1')}.`],
    ],
    practice: (p, h) => [
      `Standing ${h.val('d')} m from a mirror, your image is ${h.r(2 * p.d)} m away from you.`,
      `To see your whole body in a plane mirror, it only needs to be half your height, wherever you stand.`,
    ],
  };

  const curvedMirror = (concave) => ({
    id: concave ? 'concave' : 'convex',
    label: concave ? 'Concave mirror' : 'Convex mirror',
    lede: concave
      ? 'A mirror curved inward like a bowl focuses light. Far away objects make small upside-down images; come closer than the focus and you see yourself magnified and upright.'
      : 'A mirror bulging outward spreads light out. It always shows a smaller, upright image, but over a much wider view.',
    build: 3.6,
    compact: true,
    params: {
      d: { value: concave ? 4 : 3, min: 0.5, max: 6.5, step: 0.1, color: 'b', label: 'object distance' },
      f: { value: 1.5, min: 0.75, max: 3, step: 0.25, color: 'a', label: concave ? 'focal length' : 'focal length (the focus is behind the mirror)' },
    },
    animate: { param: 'd', speed: 0.9 },
    formula: (p, h) => { const f = concave ? p.f : -p.f, img = image(f, p.d); return `1/${concave ? h.n('f') : `(${MV.MINUS}${h.n('f')})`}${op('=')}1/${h.n('d')}${op('+')}1/${h.v('d')}<sub>i</sub>${op('⇒')}${h.v('d')}<sub>i</sub>${op('=')}${h.r(img ? img.di : '∞')}`; },
    aside: (p, h) => `<div>Image: ${h.c('ink', describe(concave ? p.f : -p.f, p.d), 'kind')}. ${h.v('d')}<sub>i</sub> is negative behind the mirror. Press play to slide the object.</div>`,
    steps: [
      { at: 0, hl: ['d'], say: concave ? 'A concave mirror. F is its focus, halfway to C, the centre of the sphere it’s cut from.' : 'A convex mirror. Its focus F is behind it: reflected rays spread out as if they came from there.' },
      { at: 0.22, hl: ['f'], say: concave ? 'A ray parallel to the axis reflects through the focus.' : 'A ray parallel to the axis reflects away as if it came from the focus behind the mirror.' },
      { at: 0.42, hl: [], say: 'A ray hitting the centre of the mirror reflects at the same angle on the other side of the axis.' },
      { at: 0.62, hl: [], say: concave ? 'A ray through the focus reflects parallel to the axis.' : 'A ray heading for the focus behind the mirror reflects parallel to the axis.' },
      { at: 0.82, hl: ['res', 'kind'], say: (p) => { const img = image(concave ? p.f : -p.f, p.d); return img ? `Where the rays meet, or seem to come from, is the image: ${describe(concave ? p.f : -p.f, p.d)}.` : 'Object exactly at the focus: the reflected rays are parallel and never meet. No image.'; } },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.glide(0.22, 0.38, pitch(4), pitch(9)), sfx.glide(0.42, 0.58, pitch(5), pitch(10)), sfx.glide(0.62, 0.78, pitch(7), pitch(12)), sfx.chime(0.84, note(9))],
    draw(p, h, { k }) {
      return rayDiagram({ f: concave ? p.f : -p.f, d: p.d, mirror: true, k, id: concave ? 'rd-cc' : 'rd-cx' }) + S.fade(seg(k, 0.82, 0.96), caption(30, 410, describe(concave ? p.f : -p.f, p.d)));
    },
    theory: concave ? [
      ['Focus and centre', `A concave mirror is a piece of a sphere of radius ${M('R')}, curved toward the light. Rays parallel to the axis reflect through the <em>focus</em> F, halfway to the centre: ${M('f = R/2')}.`],
      ['Where the image forms', `The mirror equation links the object distance ${M('d_o')}, the image distance ${M('d_i')} and the focal length: ${M('1/f = 1/d_o + 1/d_i')}. The magnification is ${M('m = −d_i/d_o')}; negative means upside down.`],
      ['Every case', `Far beyond C: small, inverted, real. At C: same size, inverted. Between C and F: larger, inverted, real (a projector's lamp mirror). At F: no image, parallel light (a torch or a car headlight puts its bulb here). Inside F: larger, upright, virtual: a make-up or shaving mirror.`],
    ] : [
      ['Diverging', `A convex mirror bulges toward the light, so parallel rays reflect outward as if from a focus behind it. In the mirror equation its focal length is negative.`],
      ['Always the same kind of image', `Whatever the distance, a convex mirror gives a virtual, upright, smaller image, but it shows a wide field of view. That's why it's used for car wing mirrors ("objects are closer than they appear"), shop security mirrors and blind corners.`],
    ],
    practice: (p, h) => { const img = image(concave ? p.f : -p.f, p.d); return [
      img ? `Object at ${h.val('d')}: image at ${h.r(img.di)} (${img.di > 0 ? 'in front of' : 'behind'} the mirror), magnified ×${h.r(Math.abs(img.m))}.` : 'At the focus, the mirror sends out a parallel beam, like a headlight.',
      concave ? 'Solar cookers and big telescopes use concave mirrors to collect light at the focus.' : 'A convex mirror at a blind corner lets drivers see round it.',
    ]; },
  });

  MV.register({ realm: 'phys', id: 'o-mirrors', group: GROUP, symbol: '◗', title: 'Reflection and mirrors', modesLabel: null, modes: [mirrorPlane, curvedMirror(true), curvedMirror(false)] });

  // =====================================================================
  // Refraction and Snell's law
  // =====================================================================

  const snell = ({ th1, n1, n2 }) => { const s2 = (n1 * Math.sin(th1 * RAD)) / n2; return s2 > 1 ? null : Math.asin(s2) / RAD; };
  const refrConcept = {
    id: 'concept',
    label: 'Snell’s law',
    lede: 'Light slows down entering glass or water. Arriving at an angle, one side of the beam slows first, and the beam swings round: refraction.',
    build: 3.4,
    compact: true,
    params: {
      th1: { value: 45, min: 0, max: 80, step: 1, color: 'a', label: 'angle of incidence in degrees', digits: 0 },
      n1: { value: 1, min: 1, max: 2, step: 0.01, color: 'b', label: 'refractive index above (air 1.00)' },
      n2: { value: 1.5, min: 1, max: 2.4, step: 0.01, color: 'c', label: 'refractive index below (water 1.33, glass 1.5)' },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => { const t2 = snell(p); return `${h.n('n1')}${op('×')}sin ${h.n('th1')}°${op('=')}${h.n('n2')}${op('×')}sin ${h.v('θ')}<sub>2</sub>${op('⇒')}${h.v('θ')}<sub>2</sub>${op('=')}${h.r(t2 == null ? 'none' : `${fmt(t2, 1)}°`)}`; },
    aside: (p, h) => `<div>Speeds: ${h.c('b', fmt(300 / p.n1, 0), 'v1')} thousand km/s above, ${h.c('c', fmt(300 / p.n2, 0), 'v2')} below (${h.v('v')} = ${h.v('c')}/${h.v('n')}). ${snell(p) == null ? '<b>No refracted ray: total internal reflection.</b>' : ''}</div>`,
    readout: (p, h) => h.ro('θ₂', snell(p) == null ? '—' : fmt(snell(p), 1), '°'),
    steps: [
      { at: 0, hl: ['n1', 'n2'], say: 'Two transparent materials. The refractive index n says how much slower light goes in each: v = c / n.' },
      { at: 0.22, hl: ['th1'], say: ({ th1 }) => `A beam arrives at ${fmt(th1)}° from the normal.` },
      { at: 0.45, hl: ['res'], say: (p) => (snell(p) == null ? 'It can’t get out: the beam is totally reflected.' : p.n2 > p.n1 ? 'Entering a slower material it bends toward the normal…' : 'Entering a faster material it bends away from the normal…') },
      { at: 0.7, hl: ['n1', 'n2', 'res'], say: '…by exactly the amount that keeps n × sin θ the same on both sides: Snell’s law. A little light is also reflected.' },
    ],
    sfx: (p) => [sfx.pop(0.02, note(4)), sfx.glide(0.22, 0.42, pitch(7), pitch(7)), sfx.glide(0.45, 0.65, pitch(7), pitch(7 - 4 * (p.n2 - p.n1))), sfx.chime(0.72, note(6))],
    simSay: (p) => `Watch the wavefronts (the short bars): they bunch up in the slower material, because the waves keep the same frequency but travel less far in each cycle. The wavelength shrinks by a factor of ${fmt(p.n2 / p.n1, 2)}.`,
    simSfx: () => Array.from({ length: 12 }, (_, i) => sfx.tick(i * 0.5, note(4))),
    draw(p, h, { k, t }) {
      const cx = 400, cy = 220, L = 230, t1 = p.th1 * RAD, t2d = snell(p), u1 = seg(k, 0.22, 0.42), u2 = seg(k, 0.45, 0.65), u3 = seg(k, 0.7, 0.9);
      let s = S.rect(40, 30, 720, cy - 30, 'b-soft', null, { opacity: (0.15 + 0.35 * (p.n1 - 1)).toFixed(2) }) + S.rect(40, cy, 720, 390 - cy, 'c-soft', null, { opacity: (0.15 + 0.35 * (p.n2 - 1)).toFixed(2) });
      s += label(60, 56, `n₁ = ${fmt(p.n1)}`, { fill: 'b', anchor: 'start', weight: 600 }) + label(60, 380, `n₂ = ${fmt(p.n2)}`, { fill: 'c', anchor: 'start', weight: 600 });
      s += S.line(cx, 40, cx, 400, 'muted', 1.5, dashed('5 5'));
      const src = [cx - L * Math.sin(t1), cy - L * Math.cos(t1)];
      s += S.line(src[0], src[1], lerp(src[0], cx, u1), lerp(src[1], cy, u1), 'a', 3);
      const refl = [cx + L * Math.sin(t1), cy - L * Math.cos(t1)];
      const R = t2d == null ? 1 : 0.15;
      s += S.fade(u3 * (t2d == null ? 1 : 0.6), S.line(cx, cy, refl[0], refl[1], 'a', 3 * R + 1, { opacity: 0.4 + 0.6 * R }));
      if (t2d != null) {
        const t2 = t2d * RAD, dst = [cx + L * Math.sin(t2), cy + L * Math.cos(t2)];
        s += S.line(cx, cy, lerp(cx, dst[0], u2), lerp(cy, dst[1], u2), 'a', 3);
        s += S.fade(u2, S.path(`M${cx} ${cy + 50} A50 50 0 0 0 ${cx + 50 * Math.sin(t2)} ${cy + 50 * Math.cos(t2)}`, 'c', 2) + label(cx + 64 * Math.sin(t2 / 2) + 6, cy + 64 * Math.cos(t2 / 2) + 10, `θ₂ ${fmt(t2d, 1)}°`, { fill: 'c', size: 12, weight: 600, anchor: 'start' }));
        // Wavefronts: bars across the beam, spaced by the wavelength in each medium, moving at that medium's speed.
        if (t > 0) {
          const lam = 34, sp = 60;
          for (let i = 0; i < 12; i++) {
            const d1 = ((t * sp / p.n1 + i * lam / p.n1) % (L)) ;
            const a1 = [cx - (L - d1) * Math.sin(t1), cy - (L - d1) * Math.cos(t1)];
            s += S.line(a1[0] - 12 * Math.cos(t1), a1[1] + 12 * Math.sin(t1), a1[0] + 12 * Math.cos(t1), a1[1] - 12 * Math.sin(t1), 'ink', 2.5);
            const d2 = ((t * sp / p.n2 + i * lam / p.n2) % L);
            const a2 = [cx + d2 * Math.sin(t2), cy + d2 * Math.cos(t2)];
            s += S.line(a2[0] - 12 * Math.cos(t2), a2[1] + 12 * Math.sin(t2), a2[0] + 12 * Math.cos(t2), a2[1] - 12 * Math.sin(t2), 'ink', 2.5);
          }
        }
      }
      s += S.fade(u1, S.path(`M${cx} ${cy - 50} A50 50 0 0 0 ${cx - 50 * Math.sin(t1)} ${cy - 50 * Math.cos(t1)}`, 'a', 2) + label(cx - 64 * Math.sin(t1 / 2) - 6, cy - 64 * Math.cos(t1 / 2), `θ₁ ${fmt(p.th1)}°`, { fill: 'a', size: 12, weight: 600, anchor: 'end' }));
      if (t2d == null) s += S.fade(u2, label(cx, 300, 'no way out: totally reflected', { fill: 'c', weight: 600 }));
      return s;
    },
    theory: [
      ['Refraction', `Light travels at ${M('c')} ≈ 300 000 km/s in a vacuum and slower in materials: ${M('v = c/n')}, where ${M('n')} is the <em>refractive index</em>. Air ≈ 1.0003, water 1.33, glass about 1.5, diamond 2.42. When light crosses a boundary at an angle, it changes direction.`],
      ['Snell’s law', `The angles from the normal obey ${M('n_1 sin θ_1 = n_2 sin θ_2')}. Going into a material with a bigger ${M('n')} (slower), the ray bends toward the normal; going into a smaller ${M('n')}, it bends away. Along the normal (${M('θ = 0')}) it doesn't bend at all.`],
      ['Why it bends', `Think of a line of marchers walking from pavement onto mud at an angle. The first to reach the mud slow down while the others keep going, so the whole line swings round. Equivalently, light takes the path that gets it there fastest (Fermat's principle), like a lifeguard running further on sand to swim less.`],
      ['Frequency stays, wavelength changes', `Crossing into a slower material, the frequency of light (its colour) stays the same, so its wavelength shrinks: ${M('λ_2 = λ_1 n_1/n_2')}. Because ${M('n')} is slightly different for each colour, a prism splits white light into a rainbow: dispersion.`],
    ],
    practice: null,
  };

  const refrDepth = {
    id: 'depth',
    label: 'Apparent depth',
    lede: 'A coin at the bottom of a pool looks closer to the surface than it is. Light leaving the water bends, and your eye traces it back along a straight line.',
    build: 1,
    params: {
      d: { value: 2, min: 0.5, max: 3, step: 0.1, color: 'b', label: 'real depth in metres' },
      n: { value: 1.33, min: 1, max: 2.4, step: 0.01, color: 'c', label: 'refractive index of the liquid (water 1.33)' },
    },
    sim: { duration: () => 3 },
    formula: (p, h) => `${h.v('d')}′${op('=')}${h.frac(h.n('d'), h.n('n'))}${op('=')}${h.r(p.d / p.n)}${h.unit('m')}`,
    aside: (p, h) => `<div>It looks ${h.c('c', fmt(p.d - p.d / p.n), 'diff')} m shallower than it is (seen from almost straight above).</div>`,
    steps: [{ at: 0, hl: [], say: 'A coin at the bottom of a pool. You look down at it from the edge.' }],
    simSay: () => 'Rays from the coin bend away from the normal as they leave the water. Traced back, they seem to come from higher up: the coin, and the whole pool, look shallower. Divers and fishermen learn to aim lower.',
    simSfx: () => [sfx.splash(0.1), sfx.chime(1.5, note(7))],
    draw(p, h, { k, t }) {
      const sy = 130, sc = 80, cx = 330, coinY = sy + p.d * sc, appY = sy + (p.d / p.n) * sc, u = clamp01(t / 1.5), u2 = clamp01((t - 1.5) / 1.2);
      let s = S.rect(40, sy, 720, 400 - sy, 'a-soft', null) + S.line(40, sy, 760, sy, 'a', 2) + label(750, sy + 22, `n = ${fmt(p.n)}`, { fill: 'a', anchor: 'end', size: 12 });
      s += S.el('ellipse', { cx, cy: coinY, rx: 16, ry: 5, fill: 'b', stroke: 'b' }) + label(cx - 24, coinY + 4, `real: ${fmt(p.d)} m`, { fill: 'b', anchor: 'end', size: 12 });
      // Two rays leave the coin and, after bending at the surface, reach the eye (one just either side of it).
      const eye = [cx + 120, 50];
      const exitX = (a1) => { const a2 = Math.asin(Math.min(0.999, p.n * Math.sin(a1))); return cx + (coinY - sy) * Math.tan(a1) + (sy - eye[1]) * Math.tan(a2); };
      const aim = (tx) => { let lo = 0, hi = Math.asin(0.999 / p.n); for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (exitX(mid) < tx) lo = mid; else hi = mid; } return lo; };
      [eye[0] - 10, eye[0] + 10].forEach((tx) => {
        const a1 = aim(tx), a2 = Math.asin(Math.min(0.999, p.n * Math.sin(a1)));
        const hit = [cx + (coinY - sy) * Math.tan(a1), sy], far = [hit[0] + (sy - eye[1]) * Math.tan(a2), eye[1]];
        s += S.line(cx, coinY, lerp(cx, hit[0], u), lerp(coinY, sy, u), 'b', 2);
        if (u >= 1) s += S.line(...hit, lerp(hit[0], far[0], Math.min(1, u2 * 2)), lerp(sy, far[1], Math.min(1, u2 * 2)), 'b', 2);
        if (u2 > 0.4) s += S.line(...hit, hit[0] - (appY - sy) * Math.tan(a2), appY, 'c', 1.5, dashed('5 5'));
      });
      s += S.el('ellipse', { cx: eye[0], cy: eye[1], rx: 16, ry: 9, fill: 'card', stroke: 'ink', 'stroke-width': 2 }) + S.circle(eye[0] - 4, eye[1] + 2, 4, 'ink');
      s += S.fade(clamp01((u2 - 0.4) * 2), S.el('ellipse', { cx, cy: appY, rx: 16, ry: 5, fill: null, stroke: 'c', 'stroke-width': 2, 'stroke-dasharray': '3 3' }) + label(cx - 24, appY + 4, `seems: ${fmt(p.d / p.n)} m`, { fill: 'c', anchor: 'end', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Apparent depth', `Seen from nearly straight above, an object at depth ${M('d')} under a liquid of index ${M('n')} appears at ${M('d′ = d/n')}. For water, about three quarters of the real depth. From an angle, it looks even shallower.`],
      ['Bent sticks', `For the same reason a straw in a glass looks broken at the surface, and a swimming pool's floor seems to slope up toward the far end.`],
    ],
    practice: (p, h) => [`A pool that looks 1.5 m deep is really ${h.r(1.5 * 1.33)} m deep. Don’t dive in!`],
  };

  MV.register({ realm: 'phys', id: 'o-refraction', group: GROUP, symbol: 'n', title: 'Refraction and Snell’s law', modes: [refrConcept, refrDepth] });

  // =====================================================================
  // Total internal reflection
  // =====================================================================

  // Fraction reflected at a boundary (Schlick's approximation), for drawing beam brightness.
  const reflectance = (n1, n2, th) => { const s2 = (n1 / n2) * Math.sin(th * RAD); if (s2 >= 1) return 1; const c = Math.cos(n1 > n2 ? Math.asin(s2) : th * RAD), r0 = ((n1 - n2) / (n1 + n2)) ** 2; return r0 + (1 - r0) * (1 - c) ** 5; };
  const tirConcept = {
    id: 'concept',
    label: 'Critical angle',
    lede: 'Light trying to leave glass or water bends away from the normal. Past a certain angle it can’t get out at all, and the surface becomes a perfect mirror.',
    build: 3,
    compact: true,
    params: {
      th: { value: 30, min: 0, max: 89, step: 1, color: 'a', label: 'angle inside the material, in degrees', digits: 0 },
      n1: { value: 1.5, min: 1.1, max: 2.42, step: 0.01, color: 'c', label: 'index of the dense material (glass 1.5, diamond 2.42)' },
      n2: { value: 1, min: 1, max: 1.33, step: 0.01, color: 'b', label: 'index outside (air 1.00)' },
    },
    animate: { param: 'th', speed: 15 },
    constrain: (p) => (p.n2 < p.n1 ? p : { ...p, n2: Math.max(1, Math.min(1.33, +(p.n1 - 0.05).toFixed(2))) }),
    formula: (p, h) => `sin ${h.v('θ')}<sub>c</sub>${op('=')}${h.frac(h.n('n2'), h.n('n1'))}${op('⇒')}${h.v('θ')}<sub>c</sub>${op('=')}${h.r(`${fmt(deg(Math.asin(p.n2 / p.n1)), 1)}°`)}`,
    aside: (p, h) => { const c = deg(Math.asin(p.n2 / p.n1)); return `<div>Ray at ${h.n('th')}°: ${p.th < c ? `${h.c('a', 'partly escapes', 'state')}, bent to ${fmt(deg(Math.asin((p.n1 / p.n2) * Math.sin(p.th * RAD))), 1)}°` : h.c('c', 'totally reflected', 'state')}. Press play to sweep the angle.</div>`; },
    steps: [
      { at: 0, hl: ['n1', 'n2'], say: 'A light inside a glass block shines up toward the surface, where glass meets air.' },
      { at: 0.3, hl: ['th'], say: 'Leaving glass for air, light speeds up and bends away from the normal. Most escapes, a little reflects back.' },
      { at: 0.6, hl: ['res'], say: 'Tilt it further: the escaping ray bends closer to the surface. At the critical angle it skims along it (90°).' },
      { at: 0.8, hl: ['state'], say: 'Beyond that, sin θ₂ would have to be more than 1, impossible. No light escapes: it’s all reflected. Total internal reflection.' },
    ],
    sfx: () => [sfx.pop(0.02, note(4)), sfx.glide(0.3, 0.55, pitch(7), pitch(5)), sfx.glide(0.6, 0.78, pitch(5), pitch(0)), sfx.chime(0.82, note(9))],
    draw(p, h, { k }) {
      const cx = 400, cy = 160, L = 220, crit = deg(Math.asin(p.n2 / p.n1)), th = p.th * RAD, R = reflectance(p.n1, p.n2, p.th), u1 = seg(k, 0.3, 0.5);
      let s = S.rect(40, cy, 720, 400 - cy, 'c-soft', null, { opacity: (0.2 + 0.25 * (p.n1 - 1)).toFixed(2) }) + label(60, 390, `dense material, n = ${fmt(p.n1)}`, { fill: 'c', anchor: 'start', size: 12, weight: 600 }) + label(60, 50, `outside, n = ${fmt(p.n2)}`, { fill: 'b', anchor: 'start', size: 12, weight: 600 });
      s += S.line(cx, 30, cx, 400, 'muted', 1.5, dashed('5 5'));
      const src = [cx - L * Math.sin(th), cy + L * Math.cos(th)];
      s += S.circle(...src, 7, 'b') + S.line(...src, cx, cy, 'a', 3);
      s += S.fade(u1, S.line(cx, cy, cx + L * Math.sin(th), cy + L * Math.cos(th), 'a', 1 + 3 * R, { opacity: (0.25 + 0.75 * R).toFixed(2) }));
      if (p.th < crit) { const t2 = Math.asin((p.n1 / p.n2) * Math.sin(th)); s += S.fade(u1, S.line(cx, cy, cx + L * Math.sin(t2), cy - L * Math.cos(t2), 'a', 1 + 3 * (1 - R), { opacity: (0.25 + 0.75 * (1 - R)).toFixed(2) })); }
      // The critical angle, marked.
      const cr = crit * RAD;
      s += S.fade(seg(k, 0.6, 0.78), S.line(cx, cy, cx - 260 * Math.sin(cr), cy + 260 * Math.cos(cr), 'c', 1.5, dashed('3 4')) + label(cx - 270 * Math.sin(cr), cy + 270 * Math.cos(cr) + 14, `critical ${fmt(crit, 1)}°`, { fill: 'c', size: 12, weight: 600 }));
      s += S.fade(seg(k, 0.8, 0.95), label(620, 110, p.th >= crit ? 'all reflected' : `${fmt((1 - R) * 100, 0)} % escapes`, { weight: 600, size: 15, fill: p.th >= crit ? 'c' : 'a' }));
      return s;
    },
    theory: [
      ['The critical angle', `Going from a denser material (${M('n_1')}) into a less dense one (${M('n_2 < n_1')}), the ray bends away from the normal. When the outgoing angle reaches 90°, the incoming angle is the <em>critical angle</em>: ${M('sin θ_c = n_2/n_1')}. For glass into air it's about 42°, for water 49°, for diamond only 24°.`],
      ['Total internal reflection', `Beyond ${M('θ_c')}, Snell's law has no solution and no light gets out: 100 % is reflected, better than any silvered mirror. It only happens going from the denser to the less dense material.`],
      ['Where it’s used', `Optical fibres guide light round corners for internet cables and medical endoscopes. Binoculars and periscopes use prisms instead of mirrors. A diamond is cut so light entering the top is totally reflected inside and comes back out of the top, which is why it sparkles.`],
    ],
    practice: (p, h) => [`For diamond in air the critical angle is ${h.r(deg(Math.asin(1 / 2.42)), 1)}°, so light is trapped very easily.`],
  };

  const tirFibre = {
    id: 'fibre',
    label: 'Optical fibre',
    lede: 'A glass thread with a slightly less dense coating. Light enters one end and bounces along the inside by total internal reflection, even round bends.',
    build: 1,
    compact: true,
    params: {
      a: { value: 8, min: 2, max: 30, step: 1, color: 'a', label: 'angle of the ray to the fibre’s axis, in degrees', digits: 0 },
    },
    sim: { duration: () => 6 },
    formula: (p, h) => `sin ${h.v('θ')}<sub>c</sub>${op('=')}${h.frac('1.46', '1.50')}${op('⇒')}${h.v('θ')}<sub>c</sub>${op('=')}${h.r(`${fmt(deg(Math.asin(1.46 / 1.5)), 1)}°`)}`,
    aside: (p, h) => { const hit = 90 - p.a, c = deg(Math.asin(1.46 / 1.5)); return `<div>A ray at ${h.n('a')}° to the axis meets the wall at ${h.c('ink', fmt(hit), 'hit')}° from the normal: ${hit > c ? 'trapped' : '<b>above the limit, it leaks out</b>'}.</div>`; },
    readout: (p, h) => h.ro('wall angle', fmt(90 - p.a, 0), '°'),
    steps: [{ at: 0, hl: [], say: 'A fibre: a glass core (n = 1.50) inside cladding of slightly lower index (1.46).' }],
    simSay: (p) => (90 - p.a > deg(Math.asin(1.46 / 1.5)) ? 'Every time the light meets the wall, it hits at more than the critical angle and is totally reflected. Nothing is lost: signals can travel tens of kilometres.' : 'Too steep: at each bounce the light meets the wall at less than the critical angle, and part of it escapes. The signal fades.'),
    simSfx: (p) => Array.from({ length: 10 }, (_, i) => sfx.tick(0.4 + i * 0.55, note(90 - p.a > 76.7 ? 7 : 2))),
    draw(p, h, { k, t }) {
      const y0 = 180, y1 = 236, x0 = 60, x1 = 760, crit = deg(Math.asin(1.46 / 1.5)), trapped = 90 - p.a > crit;
      let s = S.rect(x0, y0 - 24, x1 - x0, y1 - y0 + 48, 'b-soft', null) + S.rect(x0, y0, x1 - x0, y1 - y0, 'a-soft', 'a', { 'stroke-width': 1.5 }) + label(x0 + 6, y0 - 30, 'cladding n = 1.46', { fill: 'b', anchor: 'start', size: 11 }) + label(x0 + 6, y1 + 46, 'core n = 1.50', { fill: 'a', anchor: 'start', size: 11 });
      // Zig-zag path, with power dropping at each bounce if the angle is too steep.
      // Angles drawn doubled so the bounces are visible.
      const tan = Math.tan(2 * p.a * RAD), seglen = (y1 - y0) / Math.max(tan, 0.05);
      const pts = [[x0, (y0 + y1) / 2]];
      let x = x0 + seglen / 2, up = true;
      while (x < x1 + seglen) { pts.push([Math.min(x, x1 + 400), up ? y0 : y1]); x += seglen; up = !up; }
      const W = MV.phys.wire(pts), shown = Math.min(W.len, (t / 6) * W.len * 1.05);
      const R = trapped ? 1 : reflectance(1.5, 1.46, 90 - p.a);
      let power = 1, travelled = 0;
      for (let i = 1; i < pts.length; i++) {
        const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (travelled >= shown) break;
        const f = Math.min(1, (shown - travelled) / L), end = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
        if (pts[i - 1][0] < x1) s += S.line(...pts[i - 1], Math.min(end[0], x1), end[0] > x1 ? lerp(pts[i - 1][1], end[1], (x1 - pts[i - 1][0]) / (end[0] - pts[i - 1][0])) : end[1], 'c', 1 + 3 * power, { opacity: (0.2 + 0.8 * power).toFixed(2) });
        if (f >= 1 && !trapped && pts[i][0] < x1) { const out = pts[i][1] === y0 ? -1 : 1; s += S.line(pts[i][0], pts[i][1], pts[i][0] + 30, pts[i][1] + out * 34, 'c', 1 + 3 * power * (1 - R), { opacity: 0.6 }); }
        if (f >= 1) power *= R;
        travelled += L;
      }
      s += S.fade(seg(k, 0, 0.6), S.circle(x0 - 10, (y0 + y1) / 2, 9, 'c') + caption(60, 340, trapped ? 'Trapped: every bounce is total internal reflection.' : 'Leaking: each bounce lets some light escape into the cladding.') + caption(60, 362, '(angles drawn twice as steep, to show the bounces)'));
      return s;
    },
    theory: [
      ['Guiding light', `An optical fibre has a glass core surrounded by cladding with a slightly lower refractive index. Light travelling nearly along the fibre meets the core–cladding boundary at a grazing angle, beyond the critical angle, so it's totally reflected again and again. The coating protects the surface, so dust and scratches don't spoil the reflections.`],
      ['Why fibre beats copper', `Light can carry far more information than electrical signals, loses very little energy over long distances, and isn't disturbed by electrical interference. Undersea fibre cables carry almost all intercontinental internet traffic. Bundles of fibres also let doctors see inside the body with an endoscope.`],
    ],
    practice: () => ['A single fibre can carry tens of terabits per second: millions of video calls at once.'],
  };

  // Mirage: refractive index rises with height above a hot road (exaggerated so the bending is visible).
  const tirMirage = {
    id: 'mirage',
    label: 'Mirage',
    lede: 'On a hot day the road ahead looks wet. Air just above the hot surface is thinner, light bends upward through it, and you see the sky reflected in the road.',
    build: 1,
    params: {
      dT: { value: 30, min: 0, max: 50, step: 5, color: 'c', label: 'how much hotter the road is than the air above, in °C', digits: 0 },
    },
    sim: { duration: () => 4 },
    formula: (p, h) => `${h.v('n')}<sub>air</sub>${op('≈')}1${op('+')}0.000293${op('×')}${h.frac('288', `288${op('+')}${h.n('dT')}`)}${op('=')}${h.r(1 + 0.000293 * (288 / (288 + p.dT)), 6)}`,
    aside: (p, h) => `<div>A tiny change in ${h.v('n')}, but a ray skimming the road at a fraction of a degree turns round anyway (drawn exaggerated).</div>`,
    steps: [{ at: 0, hl: [], say: 'A tree in the distance, a long hot road, and you.' }],
    simSay: (p) => (p.dT >= 10 ? 'A ray from the tree heads down toward the road, but each warmer, thinner layer bends it a little more, until it curves back up into your eye. Your brain assumes it came in a straight line: from below the road.' : 'The road isn’t hot enough: the ray bends a little but still hits the road. No mirage.'),
    simSfx: () => [sfx.glide(0, 3, pitch(7), pitch(0)), sfx.chime(3.2, note(7))],
    draw(p, h, { k, t }) {
      const ground = 330, eye = [690, 270], tree = [110, 200];
      let s = S.rect(40, ground, 720, 70, 'ink-soft', null) + S.rect(40, ground - 60, 720, 60, 'c', null, { opacity: (0.02 + p.dT / 300).toFixed(3) });
      s += S.rect(tree[0] - 6, tree[1], 12, ground - tree[1], 'b', null) + S.circle(tree[0], tree[1] - 10, 36, 'a-soft', 'a', { 'stroke-width': 2 });
      s += S.el('ellipse', { cx: eye[0], cy: eye[1], rx: 14, ry: 8, fill: 'card', stroke: 'ink', 'stroke-width': 2 }) + S.circle(eye[0] - 4, eye[1], 3.5, 'ink');
      // Ray: a parabola that dips to a lowest point and climbs into the eye. Lowest height shrinks to the road as the heating fades.
      const strength = p.dT / 50, low = ground - 6 - 40 * strength;
      const a = 0.25 + 0.75 * strength; // how far along the turn is
      const xm = lerp(tree[0], eye[0], 0.5 + 0.2 * (1 - a));
      const yAt = (x) => { const A = x <= xm ? (low - tree[1]) / (xm - tree[0]) ** 2 : (low - eye[1]) / (eye[0] - xm) ** 2; return low - A * (x - xm) ** 2; };
      const shown = clamp01(t / 3);
      if (p.dT >= 10) {
        s += S.path(path(80, (u) => { const x = lerp(tree[0] + 30, eye[0], u * shown); return [x, yAt(x)]; }), 'b', 2.5);
        if (shown >= 1) { const slope = (yAt(eye[0]) - yAt(eye[0] - 2)) / 2, bx = 380, iy = eye[1] + slope * (bx - eye[0]); s += S.line(eye[0], eye[1], bx, iy, 'c', 1.5, dashed('5 5')); s += S.fade(clamp01((t - 3) * 2), S.circle(bx, iy + 10, 22, null, 'a', { 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }) + label(bx, iy + 50, 'looks like a puddle reflecting the sky', { fill: 'c', size: 12, weight: 600 })); }
      } else {
        s += S.line(tree[0] + 30, tree[1] + 10, lerp(tree[0] + 30, 520, shown), lerp(tree[1] + 10, ground, shown), 'b', 2.5);
      }
      s += S.fade(seg(k, 0, 0.6), caption(60, 60, 'Hot air near the road: thinner, so light travels slightly faster there'));
      return s;
    },
    theory: [
      ['Bending in layers', `Hot air is less dense, so its refractive index is very slightly lower. Light going from cooler air down into hotter air bends away from the normal, curving gradually upward. A ray that reaches the road at a grazing angle turns back up before it touches it, effectively total internal reflection spread through the air.`],
      ['What you see', `Your brain assumes light travels in straight lines, so the bent ray seems to come from below the road: an upside-down image of the sky or a distant car, shimmering like water. Over cold seas the opposite happens, and ships can appear floating above the horizon (a superior mirage).`],
    ],
    practice: () => ['Mirages can be photographed: they’re real light, just arriving from an unexpected direction.'],
  };

  MV.register({ realm: 'phys', id: 'o-tir', group: GROUP, symbol: 'θc', title: 'Total internal reflection', modes: [tirConcept, tirFibre, tirMirage] });

  // =====================================================================
  // Spherical lenses
  // =====================================================================

  const lensMode = (conv) => ({
    id: conv ? 'converging' : 'diverging',
    label: conv ? 'Converging lens' : 'Diverging lens',
    lede: conv
      ? 'A lens thicker in the middle bends light toward the axis. It can project a real image on a screen, or act as a magnifying glass when you hold it close.'
      : 'A lens thinner in the middle spreads light out. It always makes a smaller, upright, virtual image.',
    build: 3.6,
    compact: true,
    params: {
      d: { value: conv ? 4 : 3, min: 0.5, max: 6.5, step: 0.1, color: 'b', label: 'object distance' },
      f: { value: 1.5, min: 0.75, max: 3, step: 0.25, color: 'a', label: conv ? 'focal length' : 'focal length (negative for a diverging lens)' },
    },
    animate: { param: 'd', speed: 0.9 },
    formula: (p, h) => { const f = conv ? p.f : -p.f, img = image(f, p.d); return `1/${conv ? h.n('f') : `(${MV.MINUS}${h.n('f')})`}${op('=')}1/${h.n('d')}${op('+')}1/${h.v('d')}<sub>i</sub>${op('⇒')}${h.v('d')}<sub>i</sub>${op('=')}${h.r(img ? img.di : '∞')}`; },
    aside: (p, h) => `<div>Image: ${h.c('ink', describe(conv ? p.f : -p.f, p.d), 'kind')}. Power ${h.v('P')} = 1/${h.v('f')} = ${h.c('a', fmt(1 / (conv ? p.f : -p.f), 2), 'P')} D if f is in metres. Press play to slide the object.</div>`,
    steps: [
      { at: 0, hl: ['d'], say: conv ? 'A converging lens, with a focus F on each side at the focal length.' : 'A diverging lens. Its foci are virtual: rays seem to spread from them.' },
      { at: 0.22, hl: ['f'], say: conv ? 'A ray parallel to the axis is bent through the far focus.' : 'A ray parallel to the axis is bent outward, as if it came from the near focus.' },
      { at: 0.42, hl: [], say: 'A ray through the centre of the lens goes straight on.' },
      { at: 0.62, hl: [], say: conv ? 'A ray through the near focus comes out parallel.' : 'A ray aimed at the far focus comes out parallel.' },
      { at: 0.82, hl: ['res', 'kind'], say: (p) => (image(conv ? p.f : -p.f, p.d) ? `The image: ${describe(conv ? p.f : -p.f, p.d)}.` : 'Object at the focus: the rays come out parallel. No image.') },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.glide(0.22, 0.38, pitch(4), pitch(9)), sfx.glide(0.42, 0.58, pitch(5), pitch(10)), sfx.glide(0.62, 0.78, pitch(7), pitch(12)), sfx.chime(0.84, note(9))],
    draw(p, h, { k }) {
      return rayDiagram({ f: conv ? p.f : -p.f, d: p.d, mirror: false, k, id: conv ? 'rd-cv' : 'rd-dv' }) + S.fade(seg(k, 0.82, 0.96), caption(30, 410, describe(conv ? p.f : -p.f, p.d)));
    },
    theory: conv ? [
      ['Converging lenses', `A lens thicker at the middle (convex) bends parallel rays to meet at its focus, a distance ${M('f')} away. Its power is ${M('P = 1/f')}, measured in dioptres when ${M('f')} is in metres: a +2 D lens has ${M('f = 50')} cm.`],
      ['The thin-lens equation', `The same equation as for mirrors: ${M('1/f = 1/d_o + 1/d_i')}, with magnification ${M('m = −d_i/d_o = h_i/h_o')}. A positive ${M('d_i')} is a real image on the far side, which you can catch on a screen.`],
      ['Cameras, projectors and magnifiers', `Object far away: small, inverted, real image near the focus: a camera or your eye. Object between ${M('f')} and ${M('2f')}: enlarged, inverted, real: a projector. Object inside ${M('f')}: enlarged, upright, virtual: a magnifying glass.`],
    ] : [
      ['Diverging lenses', `A lens thinner at the middle (concave) spreads parallel rays out as if they came from a focus on the near side. Its focal length and power are negative. The image is always virtual, upright and smaller, whatever the distance.`],
      ['Uses', `Diverging lenses correct short sight, and appear in door peepholes (a wide view of the corridor) and inside zoom lenses and telescopes. Combining lenses adds their powers: ${M('P = P_1 + P_2')}.`],
    ],
    practice: (p, h) => { const img = image(conv ? p.f : -p.f, p.d); return [
      img ? `Object at ${h.val('d')}: image at ${h.r(img.di)} on the ${img.di > 0 ? 'far' : 'near'} side, ×${h.r(Math.abs(img.m))}.` : 'At the focus, a lens turns a point of light into a parallel beam, like a lighthouse.',
      conv ? 'A magnifying glass focusing sunlight to a burning point is a converging lens making a real image of the Sun.' : 'Look through glasses for short sight and things look slightly smaller: that’s a diverging lens.',
    ]; },
  });

  MV.register({ realm: 'phys', id: 'o-lenses', group: GROUP, symbol: '()', title: 'Lenses', modesLabel: null, modes: [lensMode(true), lensMode(false)] });

  // =====================================================================
  // The eye and vision correction
  // =====================================================================

  // Model: the eye's lens power P (dioptres) plus the glasses' power focuses an object at distance d.
  // The image lands where the total vergence equals the retina's: 1 D of error is drawn as 12 px of mis-focus.
  const eyeModel = ({ Vr, relax, acc, d, Pg }) => {
    const Vobj = d >= 99 ? 0 : -1 / d;
    const need = Vr - Vobj - Pg, P = Math.max(relax, Math.min(relax + acc, need));
    const err = Vobj + Pg + P - Vr; // positive: focus in front of the retina (too strong)
    return { Vobj, P, err };
  };
  const RETINA = 230, FRONT = 300, CY = 210;
  function drawEye(m, { u, eyeLen, colorRays = 'a', extra = '' }) {
    const back = FRONT + RETINA + eyeLen;
    let s = S.el('ellipse', { cx: (FRONT + back) / 2 + 10, cy: CY, rx: (back - FRONT) / 2 + 24, ry: 130, fill: 'card', stroke: 'ink', 'stroke-width': 2.5 });
    s += S.path(`M${back - 10} ${CY - 110} Q${back + 26} ${CY} ${back - 10} ${CY + 110}`, 'c', 4) + label(back + 10, CY - 120, 'retina', { fill: 'c', size: 11, anchor: 'start' });
    const lensW = 10 + (m.P - 58) * 1.6;
    s += S.el('ellipse', { cx: FRONT + 20, cy: CY, rx: Math.max(6, lensW), ry: 54, fill: 'a-soft', stroke: 'a', 'stroke-width': 2 });
    // Rays: incoming heights, bent at the lens toward the focus.
    const focusX = back - 6 - m.err * 12;
    const hs = [-44, -22, 22, 44], spread = Math.min(0.6, Math.abs(m.Vobj) * 0.15);
    let r = '';
    hs.forEach((hh) => {
      const x0 = 40, y0 = CY + hh * (1 - spread);
      if (u > 0) r += S.line(x0, y0, lerp(x0, FRONT + 20, Math.min(1, u * 2)), lerp(y0, CY + hh, Math.min(1, u * 2)), colorRays, 2);
      if (u > 0.5) {
        const v = (u - 0.5) * 2, endX = back - 6, slope = -hh / (focusX - FRONT - 20), yEnd = CY + hh + slope * (endX - FRONT - 20);
        r += S.line(FRONT + 20, CY + hh, lerp(FRONT + 20, endX, v), lerp(CY + hh, yEnd, v), colorRays, 2);
      }
    });
    s += r;
    if (u >= 1) { const blur = Math.abs(m.err) * 12 * (88 / (RETINA + eyeLen)); s += S.line(back - 6, CY - blur, back - 6, CY + blur, 'c', 6, { opacity: 0.6 }) + S.circle(focusX, CY, 4, 'ink'); }
    return s + extra;
  }
  // "What you see": a few letters blurred by the focus error.
  function chart(x, y, err, id) {
    const sd = Math.min(8, Math.abs(err) * 2.2).toFixed(2);
    return `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}"/></filter></defs>` +
      S.rect(x - 70, y - 60, 140, 150, 'paper', 'grid2', { rx: 8, 'stroke-width': 1.5 }) +
      `<g filter="url(#${id})">${S.text(x, y, 'E', { size: 46, weight: 600 })}${S.text(x, y + 40, 'F P', { size: 26, weight: 600 })}${S.text(x, y + 70, 'T O Z', { size: 16, weight: 600 })}</g>` +
      label(x, y + 110, Math.abs(err) < 0.26 ? 'sharp' : 'blurred', { fill: Math.abs(err) < 0.26 ? 'a' : 'c', size: 12, weight: 600 });
  }

  const visionMode = ({ id, label: name, lede, Vr, relax, acc, d0, Pg0, dRange, theory, practice, intro, fixHint }) => ({
    id,
    label: name,
    lede,
    build: 2.6,
    compact: true,
    params: {
      d: { value: d0, min: dRange[0], max: dRange[1], step: dRange[2], color: 'b', label: 'distance to what you’re looking at, in metres' },
      Pg: { value: Pg0, min: -4, max: 4, step: 0.25, color: 'a', label: 'power of the glasses in dioptres' },
    },
    formula: (p, h) => { const m = eyeModel({ Vr, relax, acc, d: p.d, Pg: p.Pg }); return `${h.v('P')}<sub>glasses</sub>${op('=')}${h.n('Pg')}${h.unit('D')}${op('→')}focus error ${h.r(Math.abs(m.err) < 0.01 ? 0 : m.err, 2)}${h.unit('D')}`; },
    aside: (p, h) => { const m = eyeModel({ Vr, relax, acc, d: p.d, Pg: p.Pg }); return `<div>${h.c('ink', Math.abs(m.err) < 0.26 ? 'In focus on the retina.' : m.err > 0 ? 'The light focuses in front of the retina.' : 'The light would focus behind the retina.', 'state')} ${fixHint}</div>`; },
    steps: [
      { at: 0, hl: ['d'], say: intro },
      { at: 0.3, hl: [], say: 'Light from the letters passes through the cornea and lens, which bend it to a point. The eye’s lens can thicken to focus on near things (accommodation), within limits.' },
      { at: 0.65, hl: ['Pg', 'res', 'state'], say: (p) => { const m = eyeModel({ Vr, relax, acc, d: p.d, Pg: p.Pg }); return Math.abs(m.err) < 0.26 ? 'The point lands on the retina: a sharp image. Drag the numbers to explore.' : `The point misses the retina, so each letter spreads into a blur. ${fixHint}`; } },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.glide(0.3, 0.6, pitch(4), pitch(9)), sfx.chime(0.68, note(7))],
    draw(p, h, { k }) {
      const m = eyeModel({ Vr, relax, acc, d: p.d, Pg: p.Pg }), u = seg(k, 0.3, 0.62), eyeLen = (60 - Vr) * 12;
      let s = drawEye(m, { k, u, eyeLen });
      if (p.Pg !== 0) { const b = p.Pg > 0 ? 6 : -6; s += S.path(`M${FRONT - 70} ${CY - 70} Q${FRONT - 70 - b * 3} ${CY} ${FRONT - 70} ${CY + 70} M${FRONT - 60} ${CY - 70} Q${FRONT - 60 + b * 3} ${CY} ${FRONT - 60} ${CY + 70}`, 'a', 2.5) + label(FRONT - 65, CY - 80, `${p.Pg > 0 ? '+' : ''}${fmt(p.Pg)} D`, { fill: 'a', size: 12, weight: 600 }); }
      s += label(60, 50, `looking at something ${p.d >= 99 ? 'far away' : `${fmt(p.d)} m away`}`, { anchor: 'start', size: 13, fill: 'b' });
      s += S.fade(seg(k, 0.65, 0.9), chart(700, 140, m.err, `blur-${id}`) + label(700, 60, 'what you see', { fill: 'muted', size: 12 }));
      return s;
    },
    theory,
    practice,
  });

  const visNormal = visionMode({
    id: 'normal', label: 'Normal eye', Vr: 60, relax: 60, acc: 4, d0: 0.3, Pg0: 0, dRange: [0.1, 6, 0.05],
    lede: 'A healthy eye focuses far objects with its lens relaxed, and thickens the lens to focus near ones. Too close, and even a young eye can’t keep up.',
    intro: 'A normal eye, looking at a page.',
    fixHint: 'Move the page further than about 25 cm (the near point) and it’s sharp again.',
    theory: [
      ['How the eye focuses', `Most of the eye's focusing is done by the curved <em>cornea</em>, and the <em>lens</em> fine-tunes it: together about 60 dioptres. To focus on something close, muscles let the lens bulge, adding power. This is <em>accommodation</em>. A young adult can add about 4 D, enough to read at 25 cm, the <em>near point</em>.`],
      ['Vergence', `In dioptres, light from an object at distance ${M('d')} arrives with vergence ${M('−1/d')}. The eye's power must make up the difference so the light converges exactly on the retina: ${M('P_{eye} = P_{retina} + 1/d')}. Glasses simply add their power ${M('P = 1/f')} to the eye's.`],
      ['Presbyopia', `With age the lens stiffens: by 60, accommodation may be only 1 D, so the near point recedes to a metre. Reading glasses (positive, converging lenses) add the missing power.`],
    ],
    practice: (p, h) => [`Reading at ${h.val('d')} m needs ${h.r(1 / p.d, 1)} D of accommodation.`, 'Children can focus as close as 7 cm; that ability fades steadily with age.'],
  });
  const visMyopia = visionMode({
    id: 'myopia', label: 'Myopia', Vr: 57, relax: 60, acc: 4, d0: 6, Pg0: 0, dRange: [0.2, 6, 0.1],
    lede: 'A short-sighted eye is a little too long (or focuses too strongly). Far things focus in front of the retina and look blurred. A diverging lens fixes it.',
    intro: 'A short-sighted eye, looking at a sign 6 m away.',
    fixHint: 'Try glasses of −3 D: a diverging lens weakens the eye’s focusing.',
    theory: [
      ['Short sight', `In <em>myopia</em> the eye is slightly too long for its focusing power, so light from distant objects meets in front of the retina. Near objects are fine: their light arrives diverging and focuses further back. Accommodation only adds power, so it can't help.`],
      ['Correction', `A diverging (negative) lens spreads the light a little first. Its power is set so that distant objects seem to be at the eye's <em>far point</em>, the furthest it can focus: ${M('P = −1/d_{far}')}. An eye whose far point is 33 cm needs −3 D.`],
    ],
    practice: () => ['Myopia is becoming far more common worldwide; time outdoors in childhood seems to protect against it.'],
  });
  const visHyperopia = visionMode({
    id: 'hyperopia', label: 'Hyperopia', Vr: 63, relax: 60, acc: 4, d0: 0.25, Pg0: 0, dRange: [0.2, 6, 0.05],
    lede: 'A long-sighted eye is a little too short. It focuses far things by straining, but close up it runs out of power and the page blurs. A converging lens helps.',
    intro: 'A long-sighted eye, trying to read a page at 25 cm.',
    fixHint: 'Try glasses of +3 D: a converging lens adds the missing power.',
    theory: [
      ['Long sight', `In <em>hyperopia</em> the eye is too short, so with the lens relaxed light would focus behind the retina. Young people accommodate to compensate, which works for distance but leaves too little extra power for reading, and can cause tiredness and headaches.`],
      ['Correction', `A converging (positive) lens adds the missing power. Its focal length is chosen so that a page at 25 cm forms an image at the eye's own near point: ${M('P = 1/0.25 − 1/d_{near}')} in dioptres.`],
    ],
    practice: () => ['Reading glasses for presbyopia are converging lenses too, usually +1 to +3 D.'],
  });

  // Astigmatism: the eye focuses horizontal and vertical lines at different depths. A cylindrical lens corrects one direction.
  const AST = 2; // the horizontal meridian is 2 D too strong
  const visAstig = {
    id: 'astig',
    label: 'Astigmatism',
    lede: 'An unevenly curved cornea focuses lines in one direction more strongly than lines in the other. Some spokes of a wheel look sharp, others smeared. A cylindrical lens evens it out.',
    build: 2.6,
    compact: true,
    params: {
      Pc: { value: 0, min: -4, max: 2, step: 0.25, color: 'a', label: 'cylinder power of the glasses, in dioptres' },
    },
    formula: (p, h) => `${h.v('P')}<sub>cylinder</sub>${op('=')}${h.n('Pc')}${h.unit('D')}${op('→')}leftover ${h.r(AST + p.Pc, 2)}${h.unit('D')}`,
    aside: (p, h) => `<div>${h.c('ink', Math.abs(AST + p.Pc) < 0.26 ? 'Every spoke is sharp.' : 'Spokes in one direction are blurred.', 'state')} This cornea is 2 D too strong in one direction: try −2 D.</div>`,
    steps: [
      { at: 0, hl: [], say: 'An astigmatic eye looks at a wheel of spokes.' },
      { at: 0.3, hl: [], say: 'The cornea is shaped more like a spoon than a ball: it bends light more in one direction than the other, giving two focal lines at different depths (blue and rose).' },
      { at: 0.65, hl: ['Pc', 'res', 'state'], say: 'One set of lines is focused, the others blur. A cylindrical lens has power in only one direction, so it can cancel the difference.' },
    ],
    sfx: () => [sfx.pop(0.02, note(2)), sfx.chord(0.3, [note(2), note(5)]), sfx.chime(0.68, note(7))],
    draw(p, h, { k }) {
      const errH = AST + p.Pc, u = seg(k, 0.3, 0.62);
      let s = drawEye({ P: 60, err: 0, Vobj: 0 }, { k, u, eyeLen: 0, colorRays: 'a' });
      if (u >= 1 && Math.abs(errH) > 0.05) { const back = FRONT + RETINA, fx = back - 6 - errH * 12; [-44, -22, 22, 44].forEach((hh) => { s += S.line(FRONT + 20, CY + hh, back - 6, CY + hh - (hh / (fx - FRONT - 20)) * (back - 26 - FRONT), 'c', 1.5, { opacity: 0.8 }); }); s += S.circle(fx, CY, 4, 'c'); }
      // The spoke wheel: each spoke blurred by the error in the direction across it.
      const cx = 690, cy = 160, defs = [];
      for (let i = 0; i < 7; i++) defs.push(`<filter id="ast-${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(i * 1.1).toFixed(1)}"/></filter>`);
      let wheel = `<defs>${defs.join('')}</defs>` + S.rect(cx - 90, cy - 90, 180, 200, 'paper', 'grid2', { rx: 8, 'stroke-width': 1.5 });
      for (let a = 0; a < 180; a += 15) {
        const r = a * RAD, err = Math.abs(errH * Math.cos(r) ** 2), lvl = Math.min(6, Math.round(err * 2.4));
        wheel += `<g filter="url(#ast-${lvl})">${S.line(cx - 70 * Math.cos(r), cy - 70 * Math.sin(r), cx + 70 * Math.cos(r), cy + 70 * Math.sin(r), 'ink', 3)}</g>`;
      }
      s += S.fade(seg(k, 0.65, 0.9), wheel + label(cx, 60, 'what you see', { fill: 'muted', size: 12 }) + label(cx, cy + 102, Math.abs(errH) < 0.26 ? 'all sharp' : 'uneven blur', { fill: Math.abs(errH) < 0.26 ? 'a' : 'c', size: 12, weight: 600 }));
      return s;
    },
    theory: [
      ['Astigmatism', `A perfect cornea is curved equally in every direction, like a ball. An astigmatic one is curved more in one direction, like the back of a spoon, so it has two different powers. Instead of one focal point there are two focal lines, and lines in some directions blur at every distance.`],
      ['Cylindrical lenses', `Glasses for astigmatism include a <em>cylindrical</em> component: a lens shaped like a slice of a cylinder, with power in only one direction. Its strength and angle are chosen to cancel the cornea's extra power, written on a prescription as "cyl" and "axis".`],
    ],
    practice: () => ['Most people have a little astigmatism; it only needs correcting when it blurs vision noticeably.'],
  };

  Object.assign(MV.phys.optics, { eyeModel, drawEye, chart, reflectance, FRONT, RETINA, CY });
  MV.register({ realm: 'phys', id: 'o-vision', group: GROUP, symbol: '◉', title: 'Vision and its correction', modesLabel: null, modes: [visNormal, visMyopia, visHyperopia, visAstig] });
})();
