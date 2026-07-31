/* muscles — anatomy figure. Stylised male front + back with classed muscle
   regions matching muscle ids. figureSVG(view, opts) returns an <svg> string.
   opts.heat = { muscleId: 0..1 }      -> heat-map mode (Progress)
   opts.mark = { muscleId: 'primary'|'secondary' } -> exercise mode (glow targets)
   Browser global: FIGURE. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.FIGURE = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var COLD = [0x24, 0x2a, 0x30];      // graphite (untrained)
  var WARM = [0xb2, 0x3c, 0x14];      // deep ember
  var HOT  = [0xf2, 0x55, 0x1c];      // ember
  var PEAK = [0xff, 0x8a, 0x4c];      // bright ember
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function hx(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function heatColor(t) {
    t = Math.max(0, Math.min(1, t));
    var a, b, u;
    if (t < 0.5) { a = COLD; b = WARM; u = t / 0.5; }
    else if (t < 0.85) { a = WARM; b = HOT; u = (t - 0.5) / 0.35; }
    else { a = HOT; b = PEAK; u = (t - 0.85) / 0.15; }
    return hx([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]);
  }

  /* region geometry. Each: [muscleId, svgElement-without-fill].
     Coordinates in a 200 x 440 viewBox, figure centred at x=100. */
  var FRONT = {
    base: [
      'M100 8 q16 0 16 18 q0 15 -8 20 l6 6 q22 3 30 16 q6 12 5 40 l-4 70 q10 40 6 92 q-2 40 -8 96 q-2 20 -12 66 l-14 0 q-6 -40 -7 -80 l-4 0 q-1 40 -7 80 l-14 0 q-10 -46 -12 -66 q-6 -56 -8 -96 q-4 -52 6 -92 l-4 -70 q-1 -28 5 -40 q8 -13 30 -16 l6 -6 q-8 -5 -8 -20 q0 -18 16 -18 z'
    ],
    regions: [
      ['traps', 'M84 66 q16 -8 32 0 l-6 12 q-10 -5 -20 0 z'],
      ['front_delts', '<ellipse cx="63" cy="104" rx="15" ry="14"/>'],
      ['front_delts', '<ellipse cx="137" cy="104" rx="15" ry="14"/>'],
      ['side_delts', '<ellipse cx="50" cy="104" rx="9" ry="13"/>'],
      ['side_delts', '<ellipse cx="150" cy="104" rx="9" ry="13"/>'],
      ['chest', 'M80 92 q20 -5 19 -2 l0 34 q-14 10 -25 -3 q-3 -18 6 -29 z'],
      ['chest', 'M120 92 q-20 -5 -19 -2 l0 34 q14 10 25 -3 q3 -18 -6 -29 z'],
      ['biceps', '<ellipse cx="48" cy="140" rx="9" ry="19"/>'],
      ['biceps', '<ellipse cx="152" cy="140" rx="9" ry="19"/>'],
      ['forearms', '<ellipse cx="42" cy="182" rx="8" ry="20"/>'],
      ['forearms', '<ellipse cx="158" cy="182" rx="8" ry="20"/>'],
      ['abs', 'M87 128 q13 -4 26 0 l0 74 q-13 8 -26 0 z'],
      ['obliques', 'M80 132 q-6 24 3 66 l6 -2 l0 -66 z'],
      ['obliques', 'M120 132 q6 24 -3 66 l-6 -2 l0 -66 z'],
      ['quads', 'M84 214 q-6 50 4 104 q9 5 12 0 l1 -104 q-8 -6 -17 0 z'],
      ['quads', 'M116 214 q6 50 -4 104 q-9 5 -12 0 l-1 -104 q8 -6 17 0 z'],
      ['calves', 'M86 330 q-4 34 5 60 l7 -1 l0 -60 z'],
      ['calves', 'M114 330 q4 34 -5 60 l-7 -1 l0 -60 z']
    ]
  };
  var BACK = {
    base: FRONT.base,
    regions: [
      ['traps', 'M80 60 q20 -10 40 0 l-8 40 q-12 -6 -24 0 z'],
      ['rear_delts', '<ellipse cx="62" cy="104" rx="15" ry="13"/>'],
      ['rear_delts', '<ellipse cx="138" cy="104" rx="15" ry="13"/>'],
      ['triceps', '<ellipse cx="48" cy="140" rx="9" ry="19"/>'],
      ['triceps', '<ellipse cx="152" cy="140" rx="9" ry="19"/>'],
      ['forearms', '<ellipse cx="42" cy="182" rx="8" ry="20"/>'],
      ['forearms', '<ellipse cx="158" cy="182" rx="8" ry="20"/>'],
      ['mid_back', 'M84 104 q16 -5 32 0 l-2 20 q-14 -5 -28 0 z'],
      ['lats', 'M83 122 q-9 30 8 60 l10 -6 l-2 -56 q-8 -3 -16 2 z'],
      ['lats', 'M117 122 q9 30 -8 60 l-10 -6 l2 -56 q8 -3 16 2 z'],
      ['lower_back', 'M90 186 q10 -3 20 0 l-2 34 q-8 -3 -16 0 z'],
      ['glutes', 'M85 224 q-5 16 4 34 q11 8 12 -2 l0 -34 q-9 -4 -16 2 z'],
      ['glutes', 'M115 224 q5 16 -4 34 q-11 8 -12 -2 l0 -34 q9 -4 16 2 z'],
      ['hamstrings', 'M84 266 q-4 44 5 92 q9 5 12 0 l1 -92 q-9 -5 -18 0 z'],
      ['hamstrings', 'M116 266 q4 44 -5 92 q-9 5 -12 0 l-1 -92 q9 -5 18 0 z'],
      ['calves', 'M86 358 q-4 20 3 42 l8 -1 l0 -42 z'],
      ['calves', 'M114 358 q4 20 -3 42 l-8 -1 l0 -42 z']
    ]
  };

  function fillFor(muscleId, opts) {
    if (opts.mark && opts.mark[muscleId]) {
      return opts.mark[muscleId] === 'primary' ? { fill: hx(HOT), glow: true } : { fill: heatColor(0.5), glow: false };
    }
    if (opts.heat) return { fill: heatColor(opts.heat[muscleId] || 0), glow: (opts.heat[muscleId] || 0) > 0.85 };
    return { fill: hx(COLD), glow: false };
  }

  function figureSVG(view, opts) {
    opts = opts || {};
    var def = view === 'back' ? BACK : FRONT;
    var parts = ['<svg class="figure" viewBox="0 0 200 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'];
    parts.push('<defs><filter id="mglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');
    // silhouette base
    parts.push('<path d="' + def.base + '" fill="#171B1F" stroke="#2C333A" stroke-width="1.2"/>');
    // muscle regions
    def.regions.forEach(function (r) {
      var mid = r[0], shape = r[1];
      var f = fillFor(mid, opts);
      var attrs = 'class="mr mr-' + mid + '" data-m="' + mid + '" fill="' + f.fill + '"' + (f.glow ? ' filter="url(#mglow)"' : '') + ' stroke="rgba(255,255,255,.05)" stroke-width="0.6"';
      if (shape.charAt(0) === '<') parts.push(shape.replace('<ellipse', '<ellipse ' + attrs));
      else parts.push('<path d="' + shape + '" ' + attrs + '/>');
    });
    parts.push('</svg>');
    return parts.join('');
  }

  return { figureSVG: figureSVG, heatColor: heatColor, muscleList: function () { return FRONT.regions.map(function (r) { return r[0]; }); } };
});
