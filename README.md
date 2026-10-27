# MathVis / PhysVis

Interactive visual explanations of math (MathVis) and physics (PhysVis). Plain HTML, CSS and JS. There's no build step.

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`) and visit http://localhost:8000.

## Adding a topic

Each file in `js/topics/` calls `MV.register({...})` once per topic. A new file needs a `<script>` tag in `index.html`, before `js/app.js`. Topics appear in the sidebar in the order they're registered.

```js
MV.register({
  realm: 'phys',               // 'math' (default) or 'phys': which tab it lives under
  id: 'push',                  // used in the URL: index.html#push
  group: 'Operations in motion',
  sub: 'Triangles',            // optional nested sub-section inside the group
  symbol: '÷', title: 'Force ÷ mass', lede: 'One or two sentences on what it shows.',
  height: 420,                 // optional SVG viewBox height (width is always 800)
  compact: true,               // optional: smaller formula type for long formulas
  build: 2,                    // seconds the build animation takes (default 2)
  params: {                    // each becomes a draggable number
    F: { value: 10, min: 1, max: 20, step: 1, color: 'a', label: 'force in newtons', digits: 2 },
  },
  constrain: (p, changedKey) => p,      // optional: keep params consistent
  animate: { param: 't', speed: 45 },   // optional: Play sweeps a param (units per second)
  sim: { duration: (p) => seconds },    // optional: Play runs a clock from 0 to duration
  formula:  (p, h) => '…',              // the big formula (HTML)
  aside:    (p, h) => '…',              // optional smaller lines under it
  readout:  (p, h, f) => h.ro('time', h.f(f.t, 1), 's'),  // optional live numbers by the buttons
  draw:     (p, h, f) => '<svg markup>',  // f.k: build progress 0→1, f.t: simulation time (s)
  steps:    [{ at: 0.3, hl: ['×', 'b'], say: (p) => 'Caption for this step' }, …],  // captions; hl lights formula parts
  sfx:      (p) => [MV.sfx.glide(0, 0.3, MV.pitch(0), MV.pitch(7)), …],         // sounds on the build (at/until in 0–1)
  simSfx:   (p) => [MV.sfx.tick(1.5), …],     // sounds during the simulation (seconds)
  simSay:   (p, h, f) => 'Live caption while the simulation runs',
  theory:   [['Heading', 'Paragraph with ' + MV.M('a^2 + b^2 = c^2')], …],
  practice: (p, h) => ['Real-world sentence…', …],
});
```

**Modes.** A topic can instead list `modes: [{ id, label, …same fields… }]`. The first is the main view and the rest appear as example buttons (PhysVis uses this: the operation in general, then example simulations). Link to a mode with `#topic:mode`. Set `modesLabel: null` on the topic to show the modes as equals (Series / Parallel / Mixed) instead of a main view plus "Examples", or a string to rename that label.

**Formula list.** `js/formulas.js` maps each topic id to its general formulas: `{ name, f, note }`, where `f` is typeset with `MV.M`. Every formula has a **Show formula** play, stored as `MV.plays[topicId][formulaName]` (the name must match the list). Clicking a formula selects it; the big button under the list then builds it on the display. `js/plays.js` holds the kit (`MV.playKit`) and the operations and algebra plays, `js/plays-shapes.js` trigonometry and geometry, `js/plays-physics.js` the PhysVis operations and Newton’s laws, and `js/plays-mechanics.js`, `plays-heat.js`, `plays-optics.js`, `plays-waves.js` and `plays-electric.js` the subject sections. `play({ intro, values, own, backdrop, scene, pieces: [{ parts: [[position, text]], color, hl, say, draw(q, u, U, k) }], vary: [{ key, amp, min, max, label, color, say }] })` builds one. Pieces are listed in the order they're built, and `position` says where their text sits in the formula. Each `vary` entry then swings that variable along a sine wave so you can see what it does. `own: true` uses only the play's own `values` (the physics plays do this).

**Highlighting.** A step's `hl` keys match `data-k` in the formula and aside: parameter keys (from `h.n` / `h.val`), operator symbols (`'+'`, `'×'`, `'½'`, `'π'`), `'res'` for results, or any key passed as the third argument of `h.c(color, text, key)`.

**Sound.** `js/sound.js` synthesizes everything with Web Audio. Event kinds: glide, curve (pitch follows a list of frequencies), tick, pop, chime, chord, whoosh, swoosh, snip, thud, splash, and hum (a sustained note built from harmonics, `MV.sfx.hum(at, until, f, harmonics, gain)`, used to let you hear pitch, loudness and timbre). Use `MV.pitch(semitones from middle C)` or `MV.note(i)` (pentatonic, always pleasant) for frequencies.

**Animation.** `draw` is a pure function of the parameters and the frame. Give each element its own slice of the build with `MV.seg(k, from, to)` (eased) or `MV.lin(k, from, to)` (linear), each returning 0→1. Then grow, fade or move it with `MV.lerp`, `MV.lerpPt`, `MV.S.fade(u, svg)`, `MV.drawOn(u)` (draws a stroke on), or `MV.rot` (rotates a point). Simulations compute positions from `f.t`. Reduced-motion users get the finished frame straight away.

**Formula helpers (`h`):** `n(k)` makes a draggable number, `signed(k)` a draggable number with its operator (`+ 3` / `− 3`), `val(k)` a coloured value, `c(color, text)` coloured text, `r(x)` a result, `v('x')` an italic variable, `frac(num, den)` a fraction, `unit('m/s')` a unit and `ro(label, value, unit)` a readout item.

**`MV.M('…')`** typesets inline maths for theory text. Letters become italic, `^2` / `^{…}` make superscripts and `_1` / `_{…}` subscripts. Words of three or more lowercase letters (sin, log, rel) stay upright.

**Colour roles** stay the same everywhere: `a` is cobalt, `b` amber and `c` rose, for the first, second and third quantity. Results are `ink`. Soft fills are `a-soft`, `b-soft`, `c-soft` and `ink-soft`.

**Drawing helpers** are in `js/core.js`: `MV.S` (line, rect, circle, path, poly, text, arrow, fade), `MV.numberLine`, `MV.plane` (grid, axes, clipping, `curve(f)`), `MV.fit` (world box → screen, y up), `MV.niceStep`, `MV.fmt` and `MV.compact`.

**PhysVis subjects.** After the operations, PhysVis follows the usual order of study: Mechanics (`kinematics.js`, then `newton.js`, then `dynamics.js`, so the section reads in learning order), Heat and thermodynamics (`thermo.js`), Optics (`optics.js`), Waves (`waves.js`) and Electricity (`electric.js`). Shared props for these (time graphs, springs, bars, thermometers, flames, circuits with flowing charges, clipping) live in `js/topics/phys-kit.js` as `MV.phys`; the optics ray tracer is `MV.phys.optics.rayDiagram`.
