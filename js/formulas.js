// The general formulas for each topic, written with letters rather than numbers.
// Shown in the list beside the topic; `f` is typeset with MV.M, `note` explains it,
// Each topic's step-by-step formula play lives in plays.js.
(() => {
  'use strict';
  const F = (name, f, note) => ({ name, f, note });

  MV.formulas = {
    // ---------- Operations ----------
    add: [
      F('Sum', 'a + b = c', 'The addends a and b combine into the sum c.'),
      F('Commutative', 'a + b = b + a', 'Order doesn’t matter.'),
      F('Associative', '(a + b) + c = a + (b + c)', 'Grouping doesn’t matter.'),
      F('Identity', 'a + 0 = a', 'Adding zero changes nothing.'),
      F('Inverse', 'a + (−a) = 0', 'Every number has an opposite that cancels it.'),
      F('Gauss’s sum', '1 + 2 + … + n = n(n + 1)/2', 'Pair the first and last terms: n/2 pairs, each adding to n + 1.'),
    ],
    subtract: [
      F('Definition', 'a − b = a + (−b)', 'Subtracting is adding the opposite.'),
      F('Inverse of addition', '(a − b) + b = a', 'Adding b back undoes taking it away.'),
      F('Order matters', 'b − a = −(a − b)', 'Swapping gives the same size, opposite sign.'),
      F('Distance', 'd = |a − b|', 'How far apart two numbers are, ignoring direction.'),
      F('Change', 'Δx = x_2 − x_1', 'Final value minus starting value.'),
    ],
    multiply: [
      F('Product', 'a × b = ab', 'b copies of a, or an a by b rectangle.'),
      F('Commutative', 'ab = ba', 'Turn the grid sideways.'),
      F('Associative', '(ab)c = a(bc)', 'A box of unit cubes, counted in any order.'),
      F('Distributive', 'a(b + c) = ab + ac', 'Split a rectangle in two and the areas add.'),
      F('Identity and zero', 'a × 1 = a,  a × 0 = 0', 'One changes nothing; zero wipes everything out.'),
      F('Signs', '(−a)(−b) = ab', 'Two flips of the number line put it back.'),
    ],
    divide: [
      F('Definition', 'a ÷ b = q ⇔ q × b = a', 'Division undoes multiplication.'),
      F('With remainder', 'a = bq + r,  0 ≤ r < b', 'Euclidean division of whole numbers.'),
      F('Reciprocal', 'a ÷ b = a × (1/b)', 'Dividing is multiplying by one over the divisor.'),
      F('Fractions', '(a/b) ÷ (c/d) = ad / bc', 'Flip the second fraction and multiply.'),
      F('Zero', 'a ÷ 0 = undefined', 'No q satisfies q × 0 = a for a ≠ 0.'),
    ],
    power: [
      F('Definition', 'b^n = b × b × … × b', 'n copies of the base b multiplied together.'),
      F('Product rule', 'b^m · b^n = b^{m+n}', 'Count the factors.'),
      F('Power of a power', '(b^m)^n = b^{mn}', 'n groups of m factors.'),
      F('Power of a product', '(ab)^n = a^n b^n', 'Each factor gets the power.'),
      F('Zero and negative', 'b^0 = 1,  b^{−n} = 1/b^n', 'Forced by the quotient rule b^m / b^n = b^{m−n}.'),
      F('Roots', 'b^{1/n} = ⁿ√b', 'Raising to 1/n undoes raising to n.'),
      F('Logarithm', 'log_b x = n ⇔ b^n = x', 'The logarithm recovers the exponent.'),
    ],

    // ---------- Algebra ----------
    linear: [
      F('Slope–intercept', 'y = mx + b', 'm is the slope, b where the line crosses the y-axis.'),
      F('Slope', 'm = (y_2 − y_1) / (x_2 − x_1)', 'Rise over run, between any two points.'),
      F('Point–slope', 'y − y_1 = m(x − x_1)', 'The line through a known point with slope m.'),
      F('Standard form', 'Ax + By = C', 'Also covers vertical lines.'),
      F('Root', 'x = −b / m', 'Where the line crosses y = 0.'),
      F('Perpendicular lines', 'm_1 m_2 = −1', 'Slopes of perpendicular lines multiply to −1.'),
    ],
    quadratic: [
      F('Standard form', 'y = ax^2 + bx + c', 'a ≠ 0; the graph is a parabola.'),
      F('Quadratic formula (Bhaskara)', 'x = (−b ± √Δ) / 2a', 'The roots of ax² + bx + c = 0.'),
      F('Discriminant', 'Δ = b^2 − 4ac', 'Δ > 0: two roots. Δ = 0: one. Δ < 0: none that are real.'),
      F('Vertex form', 'y − y_0 = a(x − x_0)^2', 'The vertex is the point (x₀, y₀).'),
      F('Vertex', 'x_0 = −b / 2a,  y_0 = −Δ / 4a', 'Where the parabola turns.'),
      F('Factored form', 'y = a(x − x_1)(x − x_2)', 'x₁ and x₂ are the roots.'),
      F('Vieta', 'x_1 + x_2 = −b/a,  x_1 x_2 = c/a', 'Sum and product of the roots.'),
    ],
    'square-of-sum': [
      F('Square of a sum', '(a + b)^2 = a^2 + 2ab + b^2', 'Two squares and two rectangles.'),
      F('Square of a difference', '(a − b)^2 = a^2 − 2ab + b^2', 'Replace b with −b.'),
      F('Cube of a sum', '(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3', 'Coefficients from Pascal’s triangle: 1 3 3 1.'),
    ],
    'difference-of-squares': [
      F('Difference of squares', 'a^2 − b^2 = (a + b)(a − b)', 'The middle terms cancel.'),
      F('Difference of cubes', 'a^3 − b^3 = (a − b)(a^2 + ab + b^2)', 'The same idea one dimension up.'),
      F('General', 'a^n − b^n = (a − b)(a^{n−1} + a^{n−2}b + … + b^{n−1})', 'Always divisible by a − b.'),
    ],

    // ---------- Trigonometry ----------
    'unit-circle': [
      F('Point on the circle', 'P = (cos θ, sin θ)', 'For a circle of radius 1.'),
      F('Pythagorean identity', 'sin^2 θ + cos^2 θ = 1', 'Pythagoras on the radius.'),
      F('Tangent', 'tan θ = sin θ / cos θ', 'The slope of the radius.'),
      F('Symmetry', 'sin(−θ) = −sin θ,  cos(−θ) = cos θ', 'Sine is odd, cosine is even.'),
      F('Shift', 'cos θ = sin(θ + 90°)', 'Cosine is sine a quarter turn ahead.'),
      F('Radians', '2π rad = 360°', 'An angle measured by the arc it cuts from the unit circle.'),
    ],
    pythagoras: [
      F('Pythagorean theorem', 'a^2 + b^2 = c^2', 'c is the side opposite the right angle.'),
      F('Long side', 'c = √(a^2 + b^2)', ''),
      F('Short side', 'a = √(c^2 − b^2)', ''),
      F('Distance', 'd = √((x_2 − x_1)^2 + (y_2 − y_1)^2)', 'The straight-line distance between two points.'),
      F('Law of cosines', 'c^2 = a^2 + b^2 − 2ab cos C', 'Any triangle; reduces to Pythagoras when C = 90°.'),
    ],
    'right-triangle': [
      F('Sine', 'sin θ = opp / hyp', 'Opposite over hypotenuse.'),
      F('Cosine', 'cos θ = adj / hyp', 'Adjacent over hypotenuse.'),
      F('Tangent', 'tan θ = opp / adj', 'Opposite over adjacent.'),
      F('Complement', 'sin θ = cos(90° − θ)', 'The co-sine is the sine of the complement.'),
      F('Inverse', 'θ = arcsin(opp / hyp)', 'Find the angle from two sides.'),
    ],

    // ---------- Geometry ----------
    rectangle: [
      F('Area', 'A = w × h', 'Base times height.'),
      F('Perimeter', 'P = 2(w + h)', ''),
      F('Diagonal', 'd = √(w^2 + h^2)', 'By Pythagoras.'),
    ],
    square: [
      F('Area', 'A = s^2', 'Side times itself.'),
      F('Perimeter', 'P = 4s', ''),
      F('Diagonal', 'd = s√2', ''),
      F('Side from area', 's = √A', ''),
    ],
    parallelogram: [
      F('Area', 'A = b × h', 'h is the perpendicular height, not the slanted side.'),
      F('From two sides', 'A = ab sin θ', 'θ is the angle between sides a and b.'),
      F('Perimeter', 'P = 2(a + b)', ''),
    ],
    trapezoid: [
      F('Area', 'A = ½(a + b)h', 'The average of the parallel sides times the height.'),
      F('Midsegment', 'm = (a + b)/2', 'The line joining the midpoints of the slanted sides.'),
      F('Area from the midsegment', 'A = m × h', ''),
    ],
    circle: [
      F('Area', 'A = πr^2', ''),
      F('Circumference', 'C = 2πr = πd', ''),
      F('Area from circumference', 'A = C^2 / 4π', ''),
      F('Sector area', 'A = ½r^2θ', 'θ in radians.'),
      F('Arc length', 's = rθ', 'θ in radians.'),
    ],
    polygon: [
      F('Area', 'A = ½ × P × a', 'P the perimeter, a the apothem.'),
      F('Apothem', 'a = s / (2 tan(180°/n))', ''),
      F('Area from the side', 'A = ns^2 / (4 tan(180°/n))', ''),
      F('Circumradius', 'R = s / (2 sin(180°/n))', 'Centre to a corner.'),
      F('Interior angle', '(n − 2) × 180° / n', ''),
    ],
    'tri-any': [
      F('Area', 'A = ½bh', 'Any side can be the base.'),
      F('Two sides and the angle', 'A = ½ab sin C', ''),
      F('Shoelace', 'A = ½|x_1(y_2 − y_3) + x_2(y_3 − y_1) + x_3(y_1 − y_2)|', 'From the corners’ coordinates.'),
      F('Angles', 'α + β + γ = 180°', ''),
    ],
    'tri-acute': [
      F('Area', 'A = ½bh', 'Half the rectangle around it.'),
      F('Acute test', 'c^2 < a^2 + b^2', 'True for every side c.'),
    ],
    'tri-right': [
      F('Area', 'A = ½ab', 'The legs are base and height.'),
      F('Pythagoras', 'c^2 = a^2 + b^2', ''),
      F('Height to the long side', 'h_c = ab / c', ''),
      F('Circumradius', 'R = c / 2', 'Thales: the long side is a diameter.'),
    ],
    'tri-obtuse': [
      F('Area', 'A = ½bh', 'The height falls outside the base.'),
      F('As a difference', 'A = ½(b + e)h − ½eh', 'Big right triangle minus small right triangle.'),
      F('Obtuse test', 'c^2 > a^2 + b^2', 'c is the side opposite the obtuse angle.'),
    ],
    'tri-isosceles': [
      F('Area', 'A = ½bh', ''),
      F('Height', 'h = √(l^2 − (b/2)^2)', 'Pythagoras on one half.'),
      F('Area from the sides', 'A = (b/4)√(4l^2 − b^2)', ''),
    ],
    'tri-equilateral': [
      F('Area', 'A = (√3/4)s^2', ''),
      F('Height', 'h = (√3/2)s', ''),
      F('Perimeter', 'P = 3s', ''),
      F('Circumradius and inradius', 'R = s/√3,  r = s/(2√3)', ''),
    ],
    'tri-scalene': [
      F('Heron’s formula', 'A = √(s(s − a)(s − b)(s − c))', 'The area from the three sides alone. Press Play formula below to watch it built term by term.'),
      F('Semi-perimeter', 's = (a + b + c)/2', 'Half the perimeter.'),
      F('Base and height', 'A = ½ch', ''),
      F('Foot of the height', 'x = (c^2 + b^2 − a^2) / 2c', 'Distance from the left end of the base.'),
      F('Triangle inequality', 'a < b + c', 'Each side shorter than the other two together.'),
    ],

    // ---------- Physics: operations ----------
    'p-add': [
      F('Total', 'x_{total} = x_1 + x_2 + …', 'Only like quantities, in the same unit.'),
      F('Net force', 'F_{net} = F_1 + F_2 + …', 'With signs for direction.'),
      F('Velocities', 'v_{ground} = v_{walk} + v_{belt}', 'Galilean addition of velocities.'),
      F('Superposition', 'y = y_1 + y_2', 'Overlapping effects add point by point.'),
    ],
    'p-sub': [
      F('Change', 'Δx = x_{end} − x_{start}', ''),
      F('Relative velocity', 'v_{AB} = v_A − v_B', 'A as seen from B.'),
      F('Net of opposing pulls', 'F_{net} = F_1 − F_2', ''),
    ],
    'p-mul': [
      F('Proportionality', 'y = kx', 'k is the constant of proportionality.'),
      F('Distance', 'd = vt', 'Steady speed times time.'),
      F('Spring', 'F = −kx', 'Hooke’s law.'),
      F('Units', '[ab] = [a][b]', 'Units multiply too.'),
    ],
    'p-div': [
      F('Rate', 'rate = amount / unit', '“Per” means divide.'),
      F('Acceleration', 'a = F/m', ''),
      F('Density', 'ρ = m/V', ''),
      F('Inverse proportion', 'y = k/x', ''),
    ],
    'p-pow': [
      F('Scaling', 'y ∝ x^n', ''),
      F('Doubling', 'y(2x) = 2^n y(x)', ''),
      F('Free fall', 'd = ½gt^2', ''),
      F('Inverse square', 'I ∝ 1/r^2', ''),
      F('Square–cube law', 'A ∝ L^2,  V ∝ L^3', ''),
    ],

    // ---------- Physics: mechanics ----------
    'm-motion': [
      F('Uniform motion', 's = s_0 + vt', 'Constant velocity: equal distances in equal times.'),
      F('Velocity', 'v = v_0 + at', 'Constant acceleration: the speed changes by a every second.'),
      F('Position', 's = s_0 + v_0 t + ½at^2', 'Uniformly varied motion.'),
      F('Torricelli', 'v^2 = v_0^2 + 2aΔs', 'No time needed.'),
      F('Stopping distance', 'd = vt_r + v^2/2a', 'Reaction distance plus braking distance.'),
    ],
    'm-graphs': [
      F('Velocity is slope', 'v = Δx/Δt', 'The slope of the position–time graph.'),
      F('Acceleration is slope', 'a = Δv/Δt', 'The slope of the velocity–time graph.'),
      F('Displacement is area', 'Δx = area under v(t)', 'Area below the axis counts as negative.'),
      F('Trapezoid area', 'Δx = (v_0 + v)t/2', 'For constant acceleration.'),
    ],
    // ---------- Physics: Newton's laws ----------
    'n-first': [
      F('First law', 'ΣF = 0 ⇒ Δv = 0', 'No net force, no change in velocity.'),
      F('Momentum', 'p = mv', 'Stays constant when no net force acts.'),
      F('Balanced forces', 'F_1 + F_2 + … = 0', 'Forces can act and still cancel.'),
    ],
    'n-second': [
      F('Second law', 'F = ma', 'Net force equals mass times acceleration.'),
      F('Acceleration', 'a = F/m', ''),
      F('General form', 'F = Δp/Δt', 'Force is the rate of change of momentum.'),
      F('Steady acceleration', 'v = v_0 + at', ''),
      F('Apparent weight', 'N = m(g + a)', 'What a scale reads in an accelerating lift.'),
      F('Newton', '1 N = 1 kg·m/s^2', ''),
    ],
    'n-third': [
      F('Third law', 'F_{AB} = −F_{BA}', 'Equal size, opposite direction, on different objects.'),
      F('Momentum', 'm_A v_A = m_B v_B', 'Pushing apart from rest.'),
      F('Accelerations', 'a_A / a_B = m_B / m_A', 'Equal forces: the lighter one accelerates more.'),
    ],
    'm-forces': [
      F('Kinetic friction', 'f_k = μ_k N', 'While sliding.'),
      F('Static friction', 'f_s ≤ μ_s N', 'It matches the push, up to a limit.'),
      F('Net force', 'F − f = ma', 'Pull minus friction.'),
      F('Connected blocks', 'a = F/(m_A + m_B)', 'Tied together, they move as one.'),
      F('Rope tension', 'T = m_B a', 'What the back block needs.'),
      F('Ramp', 'a = g(sin θ − μ cos θ)', 'The mass cancels.'),
      F('Lift cable', 'T = m(g + a)', 'Holding plus accelerating.'),
    ],
    'm-energy': [
      F('Work', 'W = Fd', 'Force along the motion times distance.'),
      F('Kinetic energy', 'E_k = ½mv^2', 'The energy of motion.'),
      F('Potential energy', 'E_p = mgh', 'The energy of height.'),
      F('Elastic energy', 'E_e = ½kx^2', 'Stored in a spring.'),
      F('Conservation', '½mv^2 + mgh = const', 'Without friction.'),
      F('Speed from height', 'v = √(2gh)', 'The same for every mass.'),
    ],
    // ---------- Physics: heat and thermodynamics ----------
    't-expansion': [
      F('Linear expansion', 'ΔL = L_0 α ΔT', 'α: the expansion coefficient of the material.'),
      F('New length', 'L = L_0(1 + αΔT)', ''),
      F('Surface expansion', 'ΔA = A_0 · 2α · ΔT', 'β = 2α.'),
      F('Volume expansion', 'ΔV = V_0 · 3α · ΔT', 'γ = 3α for solids.'),
      F('Apparent expansion', 'ΔV_{app} = V_0(γ_{liq} − γ_{flask})ΔT', 'What you see rise in the neck.'),
    ],
    't-calor': [
      F('Sensible heat', 'Q = mcΔT', 'Changes the temperature.'),
      F('Latent heat', 'Q = mL', 'Changes the state, at constant temperature.'),
      F('Heat capacity', 'C = mc', 'Joules per degree for the whole object.'),
      F('Equilibrium', 'Q_{lost} + Q_{gained} = 0', 'No heat escapes.'),
      F('Mixing', 'T = (m_1 T_1 + m_2 T_2)/(m_1 + m_2)', 'Same liquid: a weighted average.'),
    ],
    't-transfer': [
      F('Conduction', 'Φ = kAΔT/L', 'Heat flow through a slab.'),
      F('Radiation', 'P = σAT^4', 'Stefan–Boltzmann law, T in kelvin.'),
      F('Wien’s law', 'λ_{max} = b/T', 'Hotter glows bluer.'),
      F('Cooling', 'T = T_r + (T_0 − T_r)e^{−kt}', 'Newton’s law of cooling.'),
    ],
    't-first': [
      F('First law', 'ΔU = Q − W', 'Energy conservation for heat and work.'),
      F('Work at constant pressure', 'W = pΔV', 'The area under the p–V graph.'),
      F('Ideal gas', 'pV = nRT', 'T in kelvin.'),
      F('Isothermal', 'ΔU = 0 ⇒ Q = W', 'Constant temperature.'),
      F('Adiabatic', 'Q = 0 ⇒ ΔU = −W', 'No heat exchanged.'),
    ],
    't-engines': [
      F('Efficiency', 'η = W/Q_H', 'The useful share of the heat.'),
      F('Energy balance', 'W = Q_H − Q_C', ''),
      F('Carnot limit', 'η_{max} = 1 − T_C/T_H', 'Temperatures in kelvin.'),
      F('Refrigerator', 'COP = Q_C/W', 'Heat removed per joule of work.'),
    ],
    // ---------- Physics: optics ----------
    'o-mirrors': [
      F('Law of reflection', 'θ_r = θ_i', 'Angles measured from the normal.'),
      F('Plane mirror', 'd_i = d_o', 'The image is as far behind as the object is in front.'),
      F('Focal length', 'f = R/2', 'Half the radius of curvature.'),
      F('Mirror equation', '1/f = 1/d_o + 1/d_i', 'f negative for a convex mirror.'),
      F('Magnification', 'm = −d_i/d_o', 'Negative: upside down.'),
    ],
    'o-refraction': [
      F('Refractive index', 'n = c/v', 'How much slower light travels.'),
      F('Snell’s law', 'n_1 sin θ_1 = n_2 sin θ_2', ''),
      F('Wavelength', 'λ_2 = λ_1 n_1/n_2', 'The frequency stays the same.'),
      F('Apparent depth', 'd′ = d/n', 'Seen from straight above.'),
    ],
    'o-tir': [
      F('Critical angle', 'sin θ_c = n_2/n_1', 'Only from denser to less dense.'),
      F('Total reflection', 'θ > θ_c ⇒ 100 % reflected', ''),
    ],
    'o-lenses': [
      F('Thin lens', '1/f = 1/d_o + 1/d_i', 'f negative for a diverging lens.'),
      F('Magnification', 'm = h_i/h_o = −d_i/d_o', ''),
      F('Power', 'P = 1/f', 'In dioptres when f is in metres.'),
      F('Lenses together', 'P = P_1 + P_2', 'Powers of thin lenses in contact add.'),
    ],
    'o-vision': [
      F('Focusing', 'P_{eye} = P_{retina} + 1/d', 'Power needed to focus at distance d.'),
      F('Short sight', 'P = −1/d_{far}', 'Diverging lens.'),
      F('Long sight', 'P = 1/0.25 − 1/d_{near}', 'Converging lens, to read at 25 cm.'),
      F('Glasses add', 'P_{total} = P_{eye} + P_{glasses}', ''),
    ],
    // ---------- Physics: waves ----------
    'w-equation': [
      F('Wave speed', 'v = λf', 'The fundamental wave equation.'),
      F('Period', 'T = 1/f', 'Time for one full wave to pass.'),
      F('Speed from period', 'v = λ/T', 'One wavelength per period.'),
      F('Travelling wave', 'y = A sin(2π(x/λ − ft))', 'The shape, moving right.'),
    ],
    'w-phenomena': [
      F('Reflection', 'θ_r = θ_i', ''),
      F('Refraction', 'sin θ_1/sin θ_2 = v_1/v_2', 'The frequency doesn’t change.'),
      F('Diffraction', 'sin θ ≈ λ/a', 'Spreading through a gap of width a.'),
      F('Constructive interference', 'Δd = mλ', 'Path difference a whole number of wavelengths.'),
      F('Destructive interference', 'Δd = (m + ½)λ', 'A half number: they cancel.'),
      F('Malus’s law', 'I = I_0 cos^2 θ', 'Polarized light through a polarizer.'),
      F('Resonance', 'f_{push} = f_0', 'Biggest response at the natural frequency.'),
    ],
    'w-sound': [
      F('Pitch', 'f = 1/T', 'Higher frequency, higher note.'),
      F('Loudness', 'β = 10 log(I/I_0)', 'In decibels.'),
      F('Echo', 'd = vt/2', 'There and back.'),
      F('Doppler', 'f′ = f v/(v − v_s)', 'Source approaching.'),
    ],
    'w-standing': [
      F('String', 'f_n = nv/2L', 'Fixed at both ends.'),
      F('Open tube', 'f_n = nv/2L', 'Open at both ends.'),
      F('Closed tube', 'f_n = nv/4L,  n odd', 'Closed at one end.'),
      F('Wave speed on a string', 'v = √(T/μ)', 'Tension over mass per metre.'),
    ],
    'w-spectrum': [
      F('Speed of light', 'c = λf', 'For every electromagnetic wave.'),
      F('Photon energy', 'E = hf', 'Planck’s constant times frequency.'),
      F('Energy and wavelength', 'E = hc/λ', 'Shorter waves, bigger packets.'),
    ],
    // ---------- Physics: electricity ----------
    'e-ohm': [
      F('Current', 'i = Δq/Δt', 'Charge flowing per second, in amperes.'),
      F('First law', 'V = Ri', 'For ohmic conductors.'),
      F('Second law', 'R = ρL/A', 'Length, area and material.'),
    ],
    'e-circuits': [
      F('Series', 'R_{eq} = R_1 + R_2 + …', 'Same current, voltages add.'),
      F('Parallel', '1/R_{eq} = 1/R_1 + 1/R_2 + …', 'Same voltage, currents add.'),
      F('Two in parallel', 'R_{eq} = R_1 R_2/(R_1 + R_2)', 'Product over sum.'),
      F('Junction rule', 'i = i_1 + i_2', 'Charge in = charge out.'),
      F('Loop rule', 'V = V_1 + V_2', 'Energy supplied = energy used.'),
    ],
    'e-meters': [
      F('Ammeter in series', 'i = V/(R + r_A)', 'Ideal: r_A = 0.'),
      F('Voltmeter in parallel', 'R_∥ = R R_V/(R + R_V)', 'Ideal: R_V → ∞.'),
    ],
    'e-power': [
      F('Energy', 'E = PΔt', 'kWh when P is in kW and Δt in hours.'),
      F('Power', 'P = Vi', 'Voltage times current.'),
      F('Joule heating', 'P = Ri^2', 'Heat in a resistance.'),
      F('From voltage', 'P = V^2/R', ''),
      F('The bill', 'cost = E × price', ''),
    ],
    'e-safety': [
      F('Current from power', 'i = P/V', 'Each appliance.'),
      F('Total current', 'i = i_1 + i_2 + …', 'Appliances in parallel.'),
      F('Short circuit', 'i = V/r', 'Tiny r, huge current.'),
      F('Heating the wire', 'P = Ri^2', 'Why too much current is dangerous.'),
    ],
    'm-momentum': [
      F('Momentum', 'p = mv', 'Mass times velocity, with direction.'),
      F('Conservation', 'm_1 v_1 + m_2 v_2 = m_1 v_1′ + m_2 v_2′', 'In an isolated system.'),
      F('Sticking together', 'v′ = (m_1 v_1 + m_2 v_2)/(m_1 + m_2)', 'Perfectly inelastic collision.'),
      F('Impulse', 'FΔt = Δp', 'Force times time changes momentum.'),
    ],
  };
})();
