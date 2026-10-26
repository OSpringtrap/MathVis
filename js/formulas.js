// The general formulas for each topic, written with letters rather than numbers.
// Shown in the list beside the topic; `f` is typeset with MV.M, `note` explains it,
// and `demo` (optional) builds the formula step by step on the display.
(() => {
  'use strict';
  const F = (name, f, note, demo) => ({ name, f, note, demo });

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
      F('Heron’s formula', 'A = √(s(s − a)(s − b)(s − c))', 'The area from the three sides alone. Press play to watch it built term by term.', MV.demos?.heron),
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
  };
})();
