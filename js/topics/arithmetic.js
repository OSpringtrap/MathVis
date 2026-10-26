(() => {
  'use strict';
  const { S, fmt, compact, dashed, numberLine, MINUS, lin, seg, lerp, M, sfx, pitch, note } = MV;
  // A position on the number line becomes a pitch: right is higher, left is lower.
  const linePitch = (v) => pitch(v);
  const G = 'Operations';
  const op = (s) => `<span class="op">${s}</span>`;

  // Start at 0, walk to a, then take a second step to r. Shared by + and −.
  function walk(a, r, R, stepLabel, k) {
    const u1 = seg(k, 0, 0.32), u2 = seg(k, 0.38, 0.68), u3 = seg(k, 0.74, 1);
    const { X, svg } = numberLine(-R, R, 190);
    let s = svg;
    s += S.circle(X(0), 190, 5, 'paper', 'ink', { 'stroke-width': 2 });
    s += S.arrow(X(0), 122, X(lerp(0, a, u1)), 122, 'a');
    s += S.fade(u1, S.text((X(0) + X(a)) / 2, 108, fmt(a), { fill: 'a', math: true, size: 20 }));
    s += S.fade(u2, S.line(X(a), 190, X(a), 58, 'grid2', 1.5, dashed('3 5')));
    s += S.arrow(X(a), 66, X(lerp(a, r, u2)), 66, 'b');
    s += S.fade(u2, S.text((X(a) + X(r)) / 2, 52, stepLabel, { fill: 'b', math: true, size: 20 }));
    s += S.arrow(X(0), 255, X(lerp(0, r, u3)), 255, 'ink', 3.5);
    s += S.fade(u3, S.text((X(0) + X(r)) / 2, 286, fmt(r), { math: true, size: 22, weight: 600 }) + S.circle(X(r), 190, 6.5, 'ink'));
    return { s, X };
  }

  MV.register({
    id: 'add',
    group: G,
    symbol: '+',
    title: 'Addition',
    height: 310,
    lede: 'Putting two amounts together. Start at the first, move by the second, and see where you land.',
    params: {
      a: { value: 3, min: -12, max: 12, step: 1, color: 'a', label: 'first number' },
      b: { value: 5, min: -12, max: 12, step: 1, color: 'b', label: 'second number' },
    },
    formula: (p, h) => `${h.n('a')}${op('+')}${h.n('b')}${op('=')}${h.r(p.a + p.b)}`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `Start at 0 and move ${fmt(a)}: that’s the first number.` },
      { at: 0.36, hl: ['+', 'b'], say: ({ b }) => `Add ${fmt(b)}: keep going ${Math.abs(b)} more, ${b >= 0 ? 'to the right' : 'to the left, because it’s negative'}.` },
      { at: 0.72, hl: ['=', 'res'], say: ({ a, b }) => `You land on ${fmt(a + b)}. That’s the sum.` },
    ],
    sfx: ({ a, b }) => [
      sfx.glide(0, 0.32, linePitch(0), linePitch(a)),
      sfx.glide(0.38, 0.68, linePitch(a), linePitch(a + b)),
      sfx.chime(0.78, linePitch(a + b)),
    ],
    draw({ a, b }, h, { k }) {
      const r = a + b;
      const R = Math.max(10, Math.abs(a), Math.abs(r)) + 1;
      return walk(a, r, R, (b < 0 ? '' : '+') + fmt(b), k).s;
    },
    theory: [
      ['What it means', `For whole numbers, ${M('a + b')} counts the objects in two separate collections put together. On the number line, adding is a <em>translation</em>: ${M('a + b')} is where you arrive if you start at ${M('a')} and move ${M('b')} units, to the right if ${M('b')} is positive and to the left if it's negative. The numbers being added are the <em>addends</em> and the result is the <em>sum</em>.`],
      ['Rules it always obeys', `Addition is <em>commutative</em>, ${M('a + b = b + a')}, and <em>associative</em>, ${M('(a + b) + c = a + (b + c)')}, so a list of numbers can be added in any order and grouping. Zero is the <em>identity</em>: ${M('a + 0 = a')}. Every number has an <em>additive inverse</em> ${M('−a')} with ${M('a + (−a) = 0')}. Together these make the integers what mathematicians call a group under addition.`],
      ['Many terms at once', `Long sums are written with sigma notation: ${M('Σ_{i=1}^n i = 1 + 2 + … + n')}. A famous shortcut, often credited to a young Gauss, pairs the first and last terms to get ${M('Σ_{i=1}^n i = n(n + 1) / 2')}. For example, 1 + 2 + … + 100 = 5050.`],
    ],
    practice: ({ a, b }, h) => {
      const r = a + b;
      return [
        `It’s ${h.val('a')} °C at dawn and the temperature ${b >= 0 ? 'rises' : 'falls'} by ${h.val('b', Math.abs(b))} degrees: by noon it’s ${h.r(r)} °C.`,
        `Get in the lift on floor ${h.val('a')} and ride ${h.val('b', Math.abs(b))} floors ${b >= 0 ? 'up' : 'down'}: you step out on floor ${h.r(r)}.`,
        `A balance of $${h.val('a')} and a ${b >= 0 ? 'deposit' : 'charge'} of $${h.val('b', Math.abs(b))} leaves $${h.r(r)}.`,
        `Order doesn’t matter: ${h.val('b')} + ${h.val('a')} is also ${h.r(r)}. The two arrows land in the same place either way.`,
      ];
    },
  });

  MV.register({
    id: 'subtract',
    group: G,
    symbol: MINUS,
    title: 'Subtraction',
    height: 370,
    lede: 'Taking an amount away, which is the same as asking how far apart two numbers are.',
    params: {
      a: { value: 7, min: -12, max: 12, step: 1, color: 'a', label: 'starting number' },
      b: { value: 3, min: -12, max: 12, step: 1, color: 'b', label: 'number taken away' },
    },
    formula: (p, h) => `${h.n('a')}${op(MINUS)}${h.n('b')}${op('=')}${h.r(p.a - p.b)}`,
    steps: [
      { at: 0, hl: ['a'], say: ({ a }) => `Start at 0 and move to ${fmt(a)}.` },
      { at: 0.3, hl: [MINUS, 'b'], say: ({ b }) => `Subtract ${fmt(b)}: step ${Math.abs(b)} back ${b >= 0 ? 'to the left' : 'to the right, since taking away a negative adds'}.` },
      { at: 0.58, hl: ['=', 'res'], say: ({ a, b }) => `You land on ${fmt(a - b)}.` },
      { at: 0.8, hl: ['res'], say: ({ a, b }) => `Same answer read as a distance: ${fmt(b)} and ${fmt(a)} are ${fmt(Math.abs(a - b))} apart.` },
    ],
    sfx: ({ a, b }) => [
      sfx.glide(0, 0.26, linePitch(0), linePitch(a)),
      sfx.glide(0.3, 0.55, linePitch(a), linePitch(a - b)),
      sfx.chime(0.62, linePitch(a - b)),
      sfx.tick(0.82, linePitch(b)), sfx.tick(0.9, linePitch(a)),
    ],
    draw({ a, b }, h, { k }) {
      const r = a - b;
      const R = Math.max(10, Math.abs(a), Math.abs(b), Math.abs(r)) + 1;
      const { s: walked, X } = walk(a, r, R, (b < 0 ? '+' : MINUS) + fmt(Math.abs(b)), Math.min(1, k / 0.8));
      let s = walked;
      // Second reading: the gap between b and a on the line.
      const u = seg(k, 0.8, 1);
      if (a !== b && u > 0) {
        const y = 326, mid = (X(a) + X(b)) / 2, half = ((X(a) - X(b)) / 2) * u;
        s += S.circle(X(b), 190, 5.5, 'b') + S.circle(X(a), 190, 5.5, 'a');
        s += S.line(mid - half, y, mid + half, y, 'muted', 1.5);
        s += S.fade(u, S.line(X(b), y - 6, X(b), y + 6, 'muted', 1.5) + S.line(X(a), y - 6, X(a), y + 6, 'muted', 1.5) +
          S.text(mid, y + 26, `${fmt(Math.abs(r))} apart`, { fill: 'muted', size: 13 }));
      }
      return s;
    },
    theory: [
      ['What it means', `${M('a − b')} is the number you must add to ${M('b')} to get ${M('a')}: ${M('(a − b) + b = a')}. That makes subtraction the <em>inverse</em> of addition. It can always be rewritten as adding the opposite, ${M('a − b = a + (−b)')}, which is why the amber arrow points left. The parts are the <em>minuend</em> ${M('a')}, the <em>subtrahend</em> ${M('b')} and the <em>difference</em>.`],
      ['Rules it breaks', `Unlike addition, subtraction is not commutative: ${M('b − a = −(a − b)')}, the same size pointing the other way. It isn't associative either: ${M('(10 − 4) − 3 = 3')} but ${M('10 − (4 − 3) = 9')}. That's why subtraction is usually turned into adding negatives before rearranging terms.`],
      ['Distance and change', `The distance between two numbers is the absolute value of their difference, ${M('|a − b|')}, which ignores direction. In science, a change is written with a delta, ${M('Δx = x_{end} − x_{start}')}. A negative Δ means the quantity went down.`],
    ],
    practice: ({ a, b }, h) => {
      const r = a - b;
      return [
        `The temperature went from ${h.val('b')} °C to ${h.val('a')} °C: it changed by ${h.r(r)} degrees.`,
        `You had $${h.val('a')} and spent $${h.val('b')}: $${h.r(r)} is left.`,
        `Order matters: ${h.val('b')} − ${h.val('a')} = ${h.r(-r)}. The same gap, pointing the other way.`,
        `Subtracting is adding the opposite: ${h.val('a')} + (${h.val('b', -b)}) = ${h.r(r)}.`,
      ];
    },
  });

  MV.register({
    id: 'multiply',
    group: G,
    symbol: '×',
    title: 'Multiplication',
    lede: 'Repeated addition: rows of equal size. Lay them out and the answer is an area.',
    build: 2.6,
    params: {
      a: { value: 6, min: 0, max: 12, step: 1, color: 'a', label: 'squares in each row' },
      b: { value: 4, min: 0, max: 12, step: 1, color: 'b', label: 'number of rows' },
    },
    formula: (p, h) => `${h.n('a')}${op('×')}${h.n('b')}${op('=')}${h.r(p.a * p.b)}`,
    steps: ({ a, b }) => (a === 0 || b === 0
      ? [{ at: 0, hl: ['×'], say: 'Anything times zero is zero: there is nothing to lay out.' }]
      : [
        { at: 0, hl: ['a'], say: `Lay out one row of ${fmt(a)} squares.` },
        { at: 0.34, hl: ['×', 'b'], say: `Copy the row until there are ${fmt(b)} rows.` },
        { at: 0.92, hl: ['=', 'res'], say: `Count them all: ${fmt(b)} rows of ${fmt(a)} is ${fmt(a * b)}.` },
      ]),
    sfx: ({ a, b }) => {
      if (a === 0 || b === 0) return [];
      const ev = [];
      for (let i = 0; i < a; i++) ev.push(sfx.tick((0.32 * i) / a, note(i)));
      for (let j = 1; j < b; j++) ev.push(sfx.pop(0.36 + (0.56 * (j - 1)) / Math.max(1, b - 1), note(j + 2)));
      ev.push(sfx.chime(0.93, note(7)));
      return ev;
    },
    draw({ a, b }, h, { k }) {
      if (a === 0 || b === 0) {
        return S.text(400, 200, 'Zero rows, or rows of zero: there are no squares at all.', { fill: 'muted', size: 16 });
      }
      const cell = Math.min(50, 560 / a, 290 / b);
      const W = a * cell, H = b * cell;
      const x0 = Math.max(110, (800 - W) / 2), y0 = 56;
      const u1 = lin(k, 0, 0.32), u2 = lin(k, 0.36, 0.92);
      const firstRow = Math.ceil(u1 * a - 1e-9);
      const rowsF = 1 + u2 * (b - 1), full = Math.floor(rowsF + 1e-9), frac = rowsF - full;
      const sq = (i, y, fill, opacity = 1) =>
        S.rect(x0 + i * cell + 1.5, y + 1.5, cell - 3, cell - 3, fill, null, { rx: Math.min(4, cell / 6), opacity });
      let s = '';
      for (let i = 0; i < firstRow; i++) s += sq(i, y0, 'a-soft');
      if (u1 >= 1) {
        for (let j = 1; j < full; j++) for (let i = 0; i < a; i++) s += sq(i, y0 + j * cell, 'ink-soft');
        // The next row slides down out of the one above it.
        if (full < b && frac > 0) {
          const y = y0 + lerp(full - 1, full, MV.ease(frac)) * cell;
          for (let i = 0; i < a; i++) s += sq(i, y, 'ink-soft', frac);
        }
      }
      s += S.line(x0, y0 - 14, x0 + W * u1, y0 - 14, 'a', 3);
      s += S.fade(u1, S.text(x0 + W / 2, y0 - 26, `${fmt(a)} in a row`, { fill: 'a', size: 14 }));
      if (u1 >= 1) {
        s += S.line(x0 - 14, y0, x0 - 14, y0 + cell * rowsF, 'b', 3);
        s += S.text(x0 - 26, y0 + (cell * rowsF) / 2, `${fmt(full)} row${full === 1 ? '' : 's'}`, { fill: 'b', size: 14, anchor: 'end' });
        s += S.text(x0 + W / 2, y0 + H + 42, `${fmt(full)} row${full === 1 ? '' : 's'} of ${fmt(a)} = ${fmt(full * a)} squares`, { size: 17, weight: 600 });
      }
      return s;
    },
    theory: [
      ['What it means', `For a whole number ${M('b')}, ${M('a × b')} is ${M('a')} added to itself ${M('b')} times: ${M('a + a + … + a')}. Laid out as ${M('b')} rows of ${M('a')}, the total is the area of an ${M('a')} by ${M('b')} rectangle. For fractions and decimals the repeated-addition picture fails, but the area and <em>scaling</em> pictures still work: multiplying by 1.5 stretches a length to one and a half times its size. The inputs are <em>factors</em> and the result is the <em>product</em>.`],
      ['Rules it always obeys', `Multiplication is commutative, ${M('ab = ba')} (turn the grid sideways), and associative, ${M('(ab)c = a(bc)')} (a box of ${M('a × b × c')} unit cubes counted in any order). One is the identity, ${M('a × 1 = a')}, and zero absorbs everything, ${M('a × 0 = 0')}. The <em>distributive law</em> ${M('a(b + c) = ab + ac')} links multiplication to addition: split a rectangle in two and the areas add.`],
      ['Signs', `The sign rules follow from the distributive law. Since ${M('a × (b + (−b)) = a × 0 = 0')}, we get ${M('ab + a(−b) = 0')}, so ${M('a(−b) = −ab')}. Applying the same argument again gives ${M('(−a)(−b) = ab')}: a negative times a negative is positive. Geometrically, multiplying by −1 flips the number line around zero, and two flips put it back.`],
    ],
    practice: ({ a, b }, h) => {
      const r = a * b;
      return [
        `A floor ${h.val('a')} m by ${h.val('b')} m needs ${h.r(r)} m² of tiles.`,
        `${h.val('b')} tickets at $${h.val('a')} each cost $${h.r(r)}.`,
        `Driving at ${h.val('a', a * 10)} km/h for ${h.val('b')} hours covers ${h.r(r * 10)} km.`,
        `${h.val('a')} × ${h.val('b')} = ${h.val('b')} × ${h.val('a')}: turn the grid on its side and it’s the same squares.`,
      ];
    },
  });

  MV.register({
    id: 'divide',
    group: G,
    symbol: '÷',
    title: 'Division',
    height: 340,
    build: 3,
    lede: 'Splitting into equal parts. Ask how many groups fit, or how much each share gets.',
    params: {
      a: { value: 14, min: 0, max: 36, step: 1, color: 'a', label: 'amount to divide' },
      b: { value: 4, min: 0, max: 12, step: 1, color: 'b', label: 'divide by' },
    },
    formula: (p, h) => `${h.n('a')}${op('÷')}${h.n('b')}${op('=')}${h.r(p.b === 0 ? 'undefined' : p.a / p.b)}`,
    steps: ({ a, b }) => {
      if (b === 0) return [{ at: 0, hl: ['÷', 'b'], say: 'Dividing by zero has no answer.' }];
      const q = Math.floor(a / b), rem = a - q * b;
      return [
        { at: 0, hl: ['a'], say: `Start with ${fmt(a)}.` },
        { at: 0.14, hl: ['÷', 'b'], say: `How many groups of ${fmt(b)} fit? Mark them off: ${fmt(q)}.` },
        ...(rem ? [{ at: 0.48, hl: [], say: `${fmt(rem)} ${rem === 1 ? 'is' : 'are'} left over: too few for another group. That’s the remainder.` }] : []),
        { at: 0.56, hl: ['b'], say: `The other way to see it: deal ${fmt(a)} out into ${fmt(b)} groups, one at a time.` },
        { at: 0.94, hl: ['=', 'res'], say: `Each group gets ${fmt(a / b)}.` },
      ];
    },
    sfx: ({ a, b }) => {
      if (b === 0) return [sfx.thud(0.1)];
      const q = Math.floor(a / b), ev = [sfx.glide(0, 0.12, pitch(0), pitch(7))];
      for (let g = 0; g < q; g++) ev.push(sfx.pop(0.14 + (0.34 * g) / Math.max(1, q), note(g + 2)));
      for (let i = 0; i < q * b; i++) ev.push(sfx.tick(0.62 + (0.32 * i) / (q * b), note(5 + (i % b))));
      ev.push(sfx.chime(0.95, note(7)));
      return ev;
    },
    aside({ a, b }) {
      if (b === 0) return '';
      const q = Math.floor(a / b), rem = a - q * b;
      return `<div>= ${fmt(q)} ${rem ? `remainder ${fmt(rem)}` : 'exactly'}</div>`;
    },
    draw({ a, b }, h, { k }) {
      if (b === 0) {
        return S.text(400, 150, 'You can’t split something into zero groups.', { size: 20, fill: 'muted' }) +
          S.text(400, 184, `No number of zeros ever adds up to ${fmt(a)}, so a ÷ 0 has no answer.`, { size: 15, fill: 'muted' });
      }
      const q = Math.floor(a / b), rem = a - q * b;
      let s = '';

      // How many b's fit into a?
      const unit = Math.min(34, 700 / Math.max(a, 1));
      const x0 = (800 - a * unit) / 2, y = 56, bh = 38;
      s += S.line(x0, y - 12, x0 + a * unit * seg(k, 0, 0.12), y - 12, 'a', 3);
      const gF = lin(k, 0.14, 0.48) * q;
      for (let g = 0; g < Math.min(q, Math.ceil(gF)); g++) {
        const gx = x0 + g * b * unit;
        s += S.fade(Math.min(1, gF - g), S.rect(gx + 1.5, y, b * unit - 3, bh, 'b-soft', 'b', { rx: 4, 'stroke-width': 1.5 }) +
          (b * unit >= 20 ? S.text(gx + (b * unit) / 2, y + bh / 2 + 5, g + 1, { fill: 'b', size: 13, weight: 600 }) : ''));
      }
      const u3 = seg(k, 0.48, 0.56);
      if (rem) s += S.fade(u3, S.rect(x0 + q * b * unit + 1.5, y, rem * unit - 3, bh, null, 'muted', { rx: 4, ...dashed('4 4') }));
      s += S.fade(u3, S.text(400, y + bh + 26,
        `${fmt(q)} group${q === 1 ? '' : 's'} of ${fmt(b)} fit${rem ? `, with ${fmt(rem)} left over` : ''}`, { fill: 'muted', size: 14 }));

      // Share a among b: deal the dots out one at a time, round the table.
      const top = 172, colW = 700 / b, bw = colW - 8;
      const perRow = Math.max(1, Math.floor((bw - 12) / 16));
      const boxH = Math.max(44, Math.ceil(q / perRow) * 16 + 16);
      const rowW = Math.min(q, perRow) * 16;
      let boxes = '';
      for (let i = 0; i < b; i++) boxes += S.rect(50 + i * colW + 4, top, bw, boxH, null, 'grid2', { rx: 8, 'stroke-width': 1.5 });
      s += S.fade(seg(k, 0.56, 0.62), boxes);
      const dealt = Math.floor(lin(k, 0.62, 0.94) * q * b + 1e-9);
      for (let idx = 0; idx < dealt; idx++) {
        const box = idx % b, slot = Math.floor(idx / b);
        const bx = 50 + box * colW + 4;
        s += S.circle(bx + (bw - rowW) / 2 + 8 + (slot % perRow) * 16, top + 16 + Math.floor(slot / perRow) * 16, 5.5, 'a');
      }
      let tail = '';
      for (let j = 0; j < rem; j++) tail += S.circle(400 - (rem * 16) / 2 + 8 + j * 16, top + boxH + 24, 5.5, null, 'a', { 'stroke-width': 1.5 });
      tail += S.text(400, top + boxH + 58,
        `Shared among ${fmt(b)}, each gets ${fmt(q)}${rem ? `, and ${fmt(rem)} can’t be shared evenly` : ''}`, { fill: 'muted', size: 14 });
      return s + S.fade(seg(k, 0.94, 1), tail);
    },
    theory: [
      ['What it means', `${M('a ÷ b = q')} means ${M('q × b = a')}: division is the inverse of multiplication. It answers two different questions with the same number. <em>Quotitive</em> division asks how many groups of size ${M('b')} fit into ${M('a')} (the top bar). <em>Partitive</em> division asks how big each share is when ${M('a')} is split into ${M('b')} equal parts (the boxes). The parts are the <em>dividend</em> ${M('a')}, the <em>divisor</em> ${M('b')} and the <em>quotient</em>.`],
      ['Remainders', `For whole numbers there's a precise version called Euclidean division. For any ${M('a ≥ 0')} and ${M('b > 0')} there is exactly one pair ${M('q')} and ${M('r')} with ${M('a = bq + r')} and ${M('0 ≤ r < b')}. The remainder ${M('r')} is written ${M('a')} mod ${M('b')}. Clocks, calendars and checksums all run on it: 14:00 is 2 pm because 14 mod 12 = 2.`],
      ['Why not zero?', `If ${M('a ÷ 0 = q')}, then ${M('q × 0')} would have to equal ${M('a')}. When ${M('a ≠ 0')} no number works, because anything times zero is zero. When ${M('a = 0')} every number works, so there's no single answer. Either way the expression has no meaning, so it's left <em>undefined</em>.`],
      ['As multiplication', `Dividing by ${M('b')} is the same as multiplying by its <em>reciprocal</em> ${M('1/b')}, so ${M('a ÷ b = a × (1/b)')}. That's how fractions work: ${M('a/b')} is ${M('a')} copies of the piece ${M('1/b')}. Like subtraction, division is neither commutative nor associative.`],
    ],
    practice: ({ a, b }, h) => {
      if (b === 0) {
        return [
          `Sharing ${h.val('a')} slices among nobody has no answer, because there’s no one to receive them.`,
          `Division undoes multiplication, and no number times 0 gives ${h.val('a')}. That’s why dividing by zero is undefined.`,
        ];
      }
      const x = a / b;
      return [
        `${h.val('a')} slices of pizza shared by ${h.val('b')} people: each gets ${h.r(x)} slices.`,
        `$${h.val('a')} for ${h.val('b')} kg of apples is $${h.r(x)} per kilogram.`,
        `${h.val('a')} km in ${h.val('b')} hours is an average speed of ${h.r(x)} km/h.`,
        `Division undoes multiplication: ${h.r(x)} × ${h.val('b')} = ${h.val('a')}.`,
      ];
    },
  });

  MV.register({
    id: 'power',
    group: G,
    symbol: 'xⁿ',
    title: 'Powers',
    build: 2.6,
    lede: 'Repeated multiplication. Each step multiplies by the same number again, so growth snowballs.',
    params: {
      base: { value: 2, min: 0.5, max: 10, step: 0.5, color: 'a', label: 'base' },
      n: { value: 5, min: 0, max: 10, step: 1, color: 'b', label: 'exponent' },
    },
    formula: (p, h) => `${h.n('base')}<sup>${h.n('n')}</sup>${op('=')}${h.r(p.base ** p.n)}`,
    steps: ({ base, n }) => [
      { at: 0, hl: ['n'], say: 'Start from 1, before multiplying by anything.' },
      ...Array.from({ length: n }, (_, j) => ({
        at: (0.95 * (j + 1)) / (n + 1),
        hl: ['base'],
        say: `Multiply by ${fmt(base)} again: ${fmt(base)}<sup>${j + 1}</sup> = ${fmt(base ** (j + 1))}.`,
      })),
      { at: 0.97, hl: ['=', 'res'], say: `${fmt(n)} multiplications by ${fmt(base)} give ${fmt(base ** n)}.` },
    ],
    // Each bar's value becomes a pitch on a logarithmic scale, so repeated multiplication sounds like equal steps up.
    sfx: ({ base, n }) => {
      const span = n * Math.abs(Math.log(base)) || 1;
      const semis = (v) => (24 * Math.log(v)) / span;
      return Array.from({ length: n + 1 }, (_, j) => sfx.glide((0.95 * j) / (n + 1), (0.95 * (j + 0.7)) / (n + 1),
        pitch(j ? semis(base ** (j - 1)) : -5), pitch(semis(base ** j)))).concat([sfx.chime(0.96, pitch(Math.max(0, semis(base ** n))))]);
    },
    aside({ base, n }, h) {
      if (n === 0) return `<div>Anything to the power 0 is 1. You haven’t multiplied by anything yet.</div>`;
      const f = h.val('base');
      const factors = n <= 7 ? Array(n).fill(f).join(' × ') : `${f} × ${f} × … × ${f}`;
      return `<div>= ${factors}</div><div class="note">${fmt(n)} copies of ${fmt(base)}, multiplied together</div>`;
    },
    draw({ base, n }, h, { k }) {
      const vals = Array.from({ length: n + 1 }, (_, j) => base ** j);
      const max = Math.max(...vals);
      const slot = 700 / (n + 1), bw = Math.min(56, slot * 0.66);
      const floor = 352, top = 52;
      const height = (v) => Math.max(1.5, (v / max) * (floor - top));
      let s = S.line(40, floor, 760, floor, 'grid2', 1.5);
      vals.forEach((v, j) => {
        // Each bar grows out of the previous one: multiply by the base once more.
        const u = seg(k, (0.95 * j) / (n + 1), (0.95 * (j + 1)) / (n + 1));
        if (u <= 0) return;
        const x = 50 + slot * j + slot / 2, last = j === n;
        const hgt = lerp(j ? height(vals[j - 1]) : 0, height(v), u);
        s += S.rect(x - bw / 2, floor - hgt, bw, hgt, last ? 'ink' : 'a-soft', last ? null : 'a', { rx: 3, 'stroke-width': 1.5 });
        s += S.fade(u, S.text(x, floor - hgt - 9, compact(v), { size: 13, fill: last ? 'ink' : 'muted', weight: last ? 600 : null }) +
          S.text(x, floor + 28, `${fmt(base)}<tspan dy="-8" font-size="11">${j}</tspan>`, { size: 15, math: true, fill: 'muted' }));
        if (j > 0 && u < 1) s += S.text(x, floor - hgt - 26, `× ${fmt(base)}`, { fill: 'a', size: 14, weight: 600 });
      });
      return s;
    },
    theory: [
      ['What it means', `For a whole number ${M('n')}, ${M('b^n')} is ${M('n')} copies of the <em>base</em> ${M('b')} multiplied together. ${M('n')} is the <em>exponent</em>. Just as multiplication is repeated addition, exponentiation is repeated multiplication. ${M('b^2')} is read "b squared" and ${M('b^3')} "b cubed" because they're the area of a square and the volume of a cube with side ${M('b')}.`],
      ['The laws of exponents', `Counting factors gives the rules: ${M('b^m · b^n = b^{m+n}')}, ${M('(b^m)^n = b^{mn}')}, ${M('(ab)^n = a^n b^n')} and ${M('b^m / b^n = b^{m−n}')}. Note that exponentiation is neither commutative (${M('2^3 = 8')} but ${M('3^2 = 9')}) nor associative. A tower like ${M('2^{3^2}')} is read from the top down.`],
      ['Zero, negative and fractional exponents', `The quotient law forces the definitions. ${M('b^0 = b^n / b^n = 1')}, ${M('b^{−n} = 1 / b^n')}, and ${M('b^{1/n}')} is the ${M('n')}th root of ${M('b')}, because ${M('(b^{1/n})^n = b')}. (${M('0^0')} is usually taken to be 1 in algebra, but left undefined in some areas of analysis.)`],
      ['Undoing a power', `Two questions run backwards from ${M('b^n = x')}. Knowing ${M('x')} and ${M('n')}, the root ${M('b = x^{1/n}')} recovers the base. Knowing ${M('x')} and ${M('b')}, the <em>logarithm</em> ${M('n')} = log<sub>${M('b')}</sub> ${M('x')} recovers the exponent. Logarithms count how many times you multiply, which is why they turn exponential growth into straight lines.`],
    ],
    practice: ({ base, n }, h) => [
      `A square with sides of ${h.val('base')} m has an area of ${h.val('base')}² = ${h.r(base ** 2)} m². A cube that size holds ${h.r(base ** 3)} m³.`,
      `Fold a sheet of paper ${h.val('n')} times and it’s 2<sup>${fmt(n)}</sup> = ${h.r(2 ** n)} layers thick.`,
      `Money earning 7% a year is multiplied by 1.07 each year: after ${h.val('n')} years, $100 becomes $${h.r(100 * 1.07 ** n)}.`,
      base < 1
        ? `A base below 1 shrinks things: half of a half of a half… That’s how radioactive material decays.`
        : `Every bar is ${h.val('base')} times the one before it. That’s why exponential growth looks slow, then sudden.`,
    ],
  });
})();
