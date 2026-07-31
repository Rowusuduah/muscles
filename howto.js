/* muscles — how-to demos (v2). A jointed figure ON the machine, showing the
   movement, with a RIGHT vs WRONG toggle. howtoSVG(pattern, variant) where
   variant is 'right' (green, correct) or 'wrong' (red, exaggerated mistake).
   steps(pattern) -> beginner steps. wrongLabel(pattern) -> the mistake shown.
   Browser global: HOWTO. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.HOWTO = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var SEAT = { thigh: [-78, -78], shin: [78, 78] }, STAND = { thigh: [0, 0], shin: [0, 0] };
  function pose(o, legs, dur) { var p = { torso: [0, 0], uarm: [0, 0], farm: [-6, -6], dur: dur || 2.4 }; for (var k in legs) p[k] = legs[k]; for (var k2 in o) p[k2] = o[k2]; return p; }

  var ANIM = {
    horizontal_press: pose({ torso: [-3, -3], uarm: [-72, -92], farm: [-58, -4] }, SEAT, 2.4),
    incline_press: pose({ torso: [-8, -8], uarm: [-96, -122], farm: [-58, -6] }, SEAT, 2.4),
    vertical_press: pose({ uarm: [-58, -172], farm: [-34, -4] }, SEAT, 2.6),
    vertical_pull: pose({ uarm: [-172, -80], farm: [-2, -48] }, SEAT, 2.4),
    row: pose({ torso: [-4, -4], uarm: [-84, -118], farm: [-8, -56] }, SEAT, 2.4),
    fly: pose({ uarm: [-66, -104], farm: [-14, -14] }, SEAT, 2.6),
    rear_fly: pose({ torso: [-4, -4], uarm: [-90, -120], farm: [-14, -14] }, SEAT, 2.6),
    lateral: pose({ uarm: [2, -82], farm: [-8, -8] }, STAND, 2.2),
    curl: pose({ uarm: [-10, -10], farm: [4, -140] }, STAND, 2.2),
    tri_ext: pose({ uarm: [-12, -12], farm: [-120, -4] }, STAND, 2.0),
    tri_press: pose({ uarm: [-28, -8], farm: [-100, -6] }, STAND, 2.2),
    lat_iso: pose({ torso: [6, 6], uarm: [-150, -74], farm: [-8, -8] }, STAND, 2.2),
    shrug: pose({ uarm: [0, 0], torso: [0, 0] }, STAND, 1.6),
    squat: pose({ torso: [4, 20], uarm: [-4, -4], thigh: [0, -80], shin: [0, 66] }, STAND, 2.8),
    leg_press: pose({ torso: [-8, -8], thigh: [-42, -88], shin: [80, 18] }, {}, 2.6),
    hinge: pose({ torso: [2, 52], uarm: [-4, -4], thigh: [0, -8] }, STAND, 2.8),
    lunge: pose({ torso: [4, 10], thigh: [-30, -74], shin: [24, 70] }, {}, 2.6),
    leg_ext: pose({ shin: [78, 2] }, { thigh: [-78, -78] }, 2.2),
    leg_curl: pose({ shin: [8, 82] }, { thigh: [-78, -78] }, 2.2),
    calf: pose({ shin: [0, 0], torso: [0, 0] }, STAND, 1.5),
    crunch: pose({ torso: [-4, 40], thigh: [-80, -96] }, { shin: [78, 78] }, 2.2),
    rotation: pose({ torso: [-9, 9] }, STAND, 2.0),
    abduction: pose({ thigh: [-78, -92] }, { shin: [78, 78] }, 2.0),
    cardio: pose({ uarm: [-28, 18], farm: [-40, -40], thigh: [22, -30], shin: [34, 72] }, {}, 1.0),
    antiext: pose({ torso: [0, 0] }, STAND, 3.0),
    'default': pose({ uarm: [-8, -26] }, STAND, 2.4)
  };
  ANIM.calf.rootBob = true; ANIM.shrug.rootBob = true;

  // apparatus + target region per pattern
  var CTX = {
    horizontal_press: 'seat', incline_press: 'seat', vertical_press: 'seat', fly: 'seat', rear_fly: 'seat', row: 'seat',
    vertical_pull: 'pulldown', lat_iso: 'cable', curl: 'stand', tri_ext: 'cable', tri_press: 'stand', lateral: 'stand',
    shrug: 'stand', squat: 'squat', leg_press: 'legpress', hinge: 'stand', lunge: 'stand', leg_ext: 'legmachine',
    leg_curl: 'legmachine', calf: 'stand', crunch: 'seat', rotation: 'stand', abduction: 'legmachine', cardio: 'tread', antiext: 'floor', 'default': 'stand'
  };
  var WRONG = {
    horizontal_press: 'half', incline_press: 'half', vertical_press: 'half', fly: 'half', row: 'swing', rear_fly: 'swing',
    vertical_pull: 'lean', lat_iso: 'half', curl: 'swing', tri_ext: 'flare', tri_press: 'half', lateral: 'high',
    shrug: 'roll', squat: 'shallow', leg_press: 'shallow', hinge: 'round', lunge: 'shallow', leg_ext: 'half',
    leg_curl: 'half', calf: 'bounce', crunch: 'neck', rotation: 'fast', abduction: 'half', cardio: 'hard', antiext: 'sag', 'default': 'half'
  };
  var WRONG_LABEL = {
    half: 'Half reps — no full range', swing: 'Swinging with the body', lean: 'Leaning way back / behind the neck',
    flare: 'Elbows flaring and drifting', high: 'Raising too high, using the traps', roll: 'Rolling the shoulders',
    shallow: 'Cutting the depth short', round: 'Rounding the back', neck: 'Yanking the neck', fast: 'Rushing, no control',
    bounce: 'Bouncing, no stretch or pause', hard: 'Going too hard — it eats recovery', sag: 'Hips sagging / piking'
  };

  var STEPS = {
    horizontal_press: ['Seat so handles are at mid-chest.', 'Sit tall, brace your core.', 'Press forward to almost straight — don’t lock hard.', 'Lower slow (~2s) to a stretch.'],
    incline_press: ['Seat so handles are at your upper chest.', 'Shoulders back and down.', 'Press up and slightly in.', 'Lower slow to a stretch, no bounce.'],
    vertical_press: ['Handles at shoulder height, sit tall.', 'Ribs down — don’t arch.', 'Press straight up without shrugging.', 'Lower under control.'],
    vertical_pull: ['Grip a bit wider than your shoulders.', 'Pull your shoulders down first.', 'Drive elbows down, bar to your collarbone.', 'Rise slowly to a full stretch.'],
    row: ['Chest on the pad, grab the handles.', 'Pull elbows straight back, squeeze the blades.', 'Torso still — no heaving.', 'Return slowly to a stretch.'],
    fly: ['Set pads so arms open comfortably.', 'Soft elbows, hold the angle.', 'Squeeze the pads together with your chest.', 'Open slowly for the stretch.'],
    rear_fly: ['Chest on the pad, soft elbows.', 'Open arms out and back, pinkies leading.', 'Squeeze the shoulder blades.', 'Return slowly.'],
    lateral: ['Stand tall, weights at your sides.', 'Lead with the elbows.', 'Raise to shoulder height — no higher.', 'Lower slowly, keep it light.'],
    curl: ['Elbows pinned to your sides.', 'Curl up, pinky up at the top.', 'Squeeze, lower to straight arms.', 'No swinging.'],
    tri_ext: ['Elbows pinned to your sides.', 'Push down to a full lockout.', 'Squeeze the triceps.', 'Return with elbows still.'],
    tri_press: ['Grip, stay fairly upright.', 'Lower to ~90° at the elbow.', 'Press to straight arms.', 'Control the whole way.'],
    lat_iso: ['Soft, fixed elbows.', 'Sweep the bar down to your thighs.', 'Feel your lats, not your arms.', 'Return slowly.'],
    shrug: ['Stand tall, weights at your sides.', 'Shrug straight up to your ears.', 'Pause at the top.', 'Lower slow — no rolling.'],
    squat: ['Feet about shoulder-width.', 'Sit down and back, chest tall.', 'Go to at least parallel.', 'Drive up through your heels.'],
    leg_press: ['Feet mid-platform, shoulder-width.', 'Lower to ~90° at the knees.', 'Keep your lower back on the seat.', 'Push through the whole foot.'],
    hinge: ['Soft knees, weight in hands.', 'Push hips back, flat back.', 'Feel the hamstring stretch.', 'Drive hips forward to stand.'],
    lunge: ['Long step forward.', 'Drop the back knee down.', 'Front knee over the foot.', 'Push through the front heel.'],
    leg_ext: ['Pad on your lower shin.', 'Straighten to a squeeze.', 'Pause briefly.', 'Lower slow — no slamming.'],
    leg_curl: ['Pad above your heels.', 'Curl your heels in hard.', 'Squeeze.', 'Return slowly to the stretch.'],
    calf: ['Balls of feet on the edge.', 'Drop the heels for a full stretch.', 'Push all the way up.', 'Pause on top — no bouncing.'],
    crunch: ['Get set, hands by your head.', 'Crunch ribs toward hips.', 'Round the spine — don’t pull your neck.', 'Return slowly.'],
    rotation: ['Lean back ~45°, feet up.', 'Rotate side to side with control.', 'Move from your core.', 'Each side is a rep.'],
    abduction: ['Sit tall against the pad.', 'Push your knees outward.', 'Squeeze the glutes wide.', 'Return slowly.'],
    cardio: ['Warm up easy for a few minutes.', 'Hold a pace you can just talk at.', 'Use a small incline, not more speed.', 'Cool down at the end.'],
    antiext: ['Forearms down, body in a line.', 'Squeeze abs and glutes.', 'Don’t sag or pike.', 'Breathe — hold the time shown.'],
    'default': ['Set up braced and stable.', 'Move through the full range with control.', 'Squeeze at the hardest point.', 'Return slowly — form over weight.']
  };

  function moving(a, b) { return Math.abs(a - b) > 0.5; }
  // slower, with a clear pause at the end of each rep so the range is obvious
  function anim(a, b, dur) {
    if (!moving(a, b)) return '';
    var D = (dur * 1.2).toFixed(2);
    return '<animateTransform attributeName="transform" attributeType="XML" type="rotate" values="' + a + ';' + b + ';' + b + ';' + a + '" keyTimes="0;0.42;0.6;1" dur="' + D + 's" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0 0 1 1;0.4 0 0.2 1"/>';
  }
  function seg(len, w, col, glow) { return '<line x1="0" y1="0" x2="0" y2="' + len + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"' + (glow ? ' filter="url(#hglow)"' : '') + '/>'; }
  function rot(x, y, deg) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return { x: x * c - y * s, y: x * s + y * c }; }
  // the point that traces the movement (hand / foot / head), at phase 0 (start) or 1 (end)
  function trackPoint(p, ph) {
    var t = p.torso[ph];
    if (moving(p.uarm[0], p.uarm[1]) || moving(p.farm[0], p.farm[1])) {
      var s0 = rot(0, -34, t), u = rot(0, 20, t + p.uarm[ph]), f = rot(0, 18, t + p.uarm[ph] + p.farm[ph]);
      return { x: s0.x + u.x + f.x, y: s0.y + u.y + f.y };
    }
    if (moving(p.thigh[0], p.thigh[1]) || moving(p.shin[0], p.shin[1])) {
      var th = rot(0, 24, p.thigh[ph]), sh = rot(0, 24, p.thigh[ph] + p.shin[ph]);
      return { x: th.x + sh.x + 11, y: th.y + sh.y + 24 };
    }
    return rot(0, -51, t);
  }
  // green dashed arrow from start to end of the movement, animated
  function arrow(p) {
    var A = trackPoint(p, 0), B = trackPoint(p, 1);
    var dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    if (len < 12) return '';
    var mx = (A.x + B.x) / 2 - dy * 0.16, my = (A.y + B.y) / 2 + dx * 0.16;
    var ang = Math.atan2(B.y - my, B.x - mx) * 180 / Math.PI;
    return '<g><path d="M' + A.x.toFixed(1) + ' ' + A.y.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + B.x.toFixed(1) + ' ' + B.y.toFixed(1) + '" stroke="#31C85E" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-dasharray="1 5"><animate attributeName="stroke-dashoffset" values="12;0" dur="0.9s" repeatCount="indefinite"/></path>' +
      '<g transform="translate(' + B.x.toFixed(1) + ',' + B.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')"><path d="M0 0 L-8 -5 L-8 5 Z" fill="#31C85E"/></g></g>';
  }

  // build a "wrong" pose from a good one
  function badPose(p, kind) {
    var b = JSON.parse(JSON.stringify(p)); b.dur = Math.max(0.9, p.dur * 0.62);
    function partial(j, f) { if (b[j]) b[j][1] = b[j][0] + (b[j][1] - b[j][0]) * (f == null ? 0.45 : f); }
    if (kind === 'half') { ['uarm', 'farm', 'shin', 'thigh'].forEach(function (j) { partial(j); }); }
    else if (kind === 'swing') { partial('farm', 0.6); partial('uarm', 0.6); b.torso = [-14, 16]; }
    else if (kind === 'lean') { b.torso = [-6, 34]; partial('uarm', 0.7); }
    else if (kind === 'flare') { partial('farm', 0.5); b.uarm = [-12, -50]; }
    else if (kind === 'high') { b.uarm = [2, -128]; b.torso = [-8, 8]; }
    else if (kind === 'shallow') { partial('thigh', 0.35); partial('shin', 0.35); }
    else if (kind === 'round') { b.torso = [2, 70]; b.thigh = [0, -2]; }
    else if (kind === 'roll') { b.uarm = [0, -18]; b.rootBob = true; }
    else if (kind === 'neck') { b.torso = [-4, 20]; partial('farm', 0.5); }
    else if (kind === 'fast') { /* just faster + wide */ b.torso = [-16, 16]; }
    else if (kind === 'bounce') { partial('shin', 0.4); b.dur = 0.7; }
    else if (kind === 'sag') { b.torso = [0, 8]; }
    else if (kind === 'hard') { b.dur = 0.7; }
    else { ['uarm', 'farm', 'shin', 'thigh'].forEach(function (j) { partial(j); }); }
    return b;
  }

  /* ---- apparatus (drawn behind the figure, in root/pelvis space) ---- */
  var AP = '#2B333B', AP2 = '#3B4650', APfill = '#20262C';
  function apparatus(ctx) {
    switch (ctx) {
      case 'seat': return '<rect x="-20" y="-44" width="8" height="46" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>' +
        '<rect x="-18" y="2" width="34" height="7" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>' +
        '<circle cx="20" cy="-30" r="3.5" fill="' + AP2 + '"/><circle cx="20" cy="-18" r="3.5" fill="' + AP2 + '"/>';
      case 'pulldown': return '<line x1="42" y1="-16" x2="42" y2="-74" stroke="' + AP + '" stroke-width="3"/>' +
        '<rect x="-6" y="-78" width="48" height="6" rx="3" fill="' + AP2 + '"/>' +
        '<rect x="-16" y="4" width="32" height="7" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>';
      case 'cable': return '<rect x="44" y="-46" width="12" height="72" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>' +
        '<line x1="50" y1="-46" x2="50" y2="-58" stroke="' + AP2 + '" stroke-width="2"/><line x1="-30" y1="50" x2="42" y2="50" stroke="' + AP + '" stroke-width="2"/>';
      case 'stand': return '<line x1="-30" y1="50" x2="44" y2="50" stroke="' + AP + '" stroke-width="2"/>';
      case 'squat': return '<line x1="-30" y1="50" x2="44" y2="50" stroke="' + AP + '" stroke-width="2"/>' +
        '<line x1="-16" y1="-38" x2="18" y2="-38" stroke="' + AP2 + '" stroke-width="4"/><circle cx="-16" cy="-38" r="6" fill="' + AP2 + '"/><circle cx="18" cy="-38" r="6" fill="' + AP2 + '"/>';
      case 'legpress': return '<rect x="-18" y="-2" width="26" height="7" rx="3" fill="' + APfill + '" stroke="' + AP + '"/><rect x="-24" y="-40" width="7" height="40" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>' +
        '<rect x="30" y="-58" width="40" height="10" rx="3" fill="' + AP2 + '" transform="rotate(58 40 -20)"/>';
      case 'legmachine': return '<rect x="-20" y="-44" width="8" height="46" rx="3" fill="' + APfill + '" stroke="' + AP + '"/><rect x="-18" y="2" width="30" height="7" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>' +
        '<circle cx="30" cy="44" r="6" fill="' + AP2 + '"/>';
      case 'tread': return '<rect x="-30" y="50" width="70" height="9" rx="4" fill="' + APfill + '" stroke="' + AP + '"/><line x1="40" y1="52" x2="48" y2="-30" stroke="' + AP + '" stroke-width="3"/><rect x="40" y="-40" width="16" height="12" rx="2" fill="' + AP2 + '"/>';
      case 'floor': return '<line x1="-34" y1="52" x2="50" y2="52" stroke="' + AP + '" stroke-width="2"/>';
      case 'benchflat': return '<rect x="-46" y="2" width="58" height="9" rx="4" fill="' + APfill + '" stroke="' + AP + '"/><rect x="-42" y="11" width="6" height="20" fill="' + APfill + '" stroke="' + AP + '"/><rect x="6" y="11" width="6" height="20" fill="' + APfill + '" stroke="' + AP + '"/>';
      case 'benchincline': return '<g transform="rotate(-32 0 4)"><rect x="-8" y="-44" width="12" height="52" rx="5" fill="' + APfill + '" stroke="' + AP + '"/></g><rect x="-16" y="6" width="30" height="8" rx="3" fill="' + APfill + '" stroke="' + AP + '"/>';
      case 'preacher': return '<rect x="-18" y="2" width="30" height="7" rx="3" fill="' + APfill + '" stroke="' + AP + '"/><g transform="rotate(22 10 -14)"><rect x="4" y="-28" width="11" height="26" rx="5" fill="' + APfill + '" stroke="' + AP + '"/></g>';
      case 'benchsupport': return '<rect x="-32" y="8" width="50" height="9" rx="4" fill="' + APfill + '" stroke="' + AP + '"/><rect x="-28" y="17" width="6" height="16" fill="' + APfill + '" stroke="' + AP + '"/><rect x="10" y="17" width="6" height="16" fill="' + APfill + '" stroke="' + AP + '"/>';
      case 'hang': return '<rect x="-18" y="-74" width="52" height="6" rx="3" fill="' + AP2 + '"/><line x1="-12" y1="-74" x2="-12" y2="-84" stroke="' + AP + '" stroke-width="3"/><line x1="28" y1="-74" x2="28" y2="-84" stroke="' + AP + '" stroke-width="3"/>';
      default: return '';
    }
  }

  // the implement held in the hand (dumbbell / barbell / cable-or-machine handle)
  function implSVG(impl, ghost) {
    if (ghost || !impl || impl === 'none') return '';
    var mc = '#6A747E', pc = '#464F57';
    if (impl === 'db') return '<g transform="translate(0,18)"><rect x="-7" y="-2.5" width="14" height="5" rx="2" fill="' + mc + '"/><rect x="-10" y="-5" width="4.5" height="10" rx="1.5" fill="' + pc + '"/><rect x="5.5" y="-5" width="4.5" height="10" rx="1.5" fill="' + pc + '"/></g>';
    if (impl === 'bar') return '<g transform="translate(0,18)"><rect x="-21" y="-2" width="42" height="4" rx="2" fill="' + mc + '"/><circle cx="-20" cy="0" r="4.5" fill="' + pc + '"/><circle cx="20" cy="0" r="4.5" fill="' + pc + '"/></g>';
    return '<g transform="translate(0,18)"><rect x="-2.6" y="-6" width="5.2" height="12" rx="2.6" fill="' + mc + '"/></g>'; // machine / cable handle
  }

  // ghost=true renders a faint static END-position (shows the full range of motion)
  function figure(p, right, ghost, impl) {
    var still = ghost ? '#333B43' : '#39424A', hot = ghost ? '#333B43' : (right ? '#31C85E' : '#E4585C'), body = ghost ? '#333B43' : '#333C44', d = p.dur;
    var fr = ghost ? 1 : 0;
    function A(j) { return ghost ? '' : anim(p[j][0], p[j][1], d); }
    function col(j) { return (!ghost && moving(p[j][0], p[j][1])) ? hot : still; }
    function gl(j) { return !ghost && moving(p[j][0], p[j][1]); }
    var uarmC = col('uarm'), farmC = col('farm'), thighC = col('thigh'), shinC = col('shin');
    var torsoHot = !ghost && moving(p.torso[0], p.torso[1]);
    var arm = '<g transform="translate(0,-34)"><g transform="rotate(' + p.uarm[fr] + ')">' + A('uarm') + seg(20, 10, uarmC, gl('uarm')) +
      '<circle cx="0" cy="20" r="3" fill="' + uarmC + '"/><g transform="translate(0,20)"><g transform="rotate(' + p.farm[fr] + ')">' + A('farm') + seg(18, 8, farmC, gl('farm')) + '<circle cx="0" cy="18" r="5" fill="' + farmC + '"/>' + implSVG(impl, ghost) + '</g></g></g></g>';
    var torso = '<g transform="rotate(' + p.torso[fr] + ')">' + A('torso') +
      '<rect x="-11" y="-40" width="22" height="40" rx="10" fill="' + (torsoHot ? hot : body) + '"' + (torsoHot ? ' filter="url(#hglow)"' : '') + '/>' +
      '<circle cx="0" cy="-51" r="8.5" fill="' + body + '"/><rect x="-4" y="-45" width="8" height="8" fill="' + body + '"/>' + arm + '</g>';
    var leg = '<g transform="rotate(' + p.thigh[fr] + ')">' + A('thigh') + seg(24, 12, thighC, gl('thigh')) +
      '<circle cx="0" cy="24" r="4" fill="' + thighC + '"/><g transform="translate(0,24)"><g transform="rotate(' + p.shin[fr] + ')">' + A('shin') + seg(24, 10, shinC, gl('shin')) + '<line x1="0" y1="24" x2="11" y2="24" stroke="' + shinC + '" stroke-width="7" stroke-linecap="round"/></g></g></g>';
    var hips = '<rect x="-11" y="-3" width="22" height="10" rx="5" fill="' + body + '"/>';
    var g = leg + hips + torso;
    return ghost ? '<g opacity="0.28">' + g + '</g>' : g;
  }

  // per-exercise setup: context (apparatus) + implement + posture, from equipType/id.
  // Same movement pattern, different equipment/body position => a different-looking demo.
  function deriveMove(ex) {
    var pat = ex.pattern, eq = ex.equipType, id = ex.id;
    var m = { ctx: CTX[pat] || 'stand', impl: 'none', torso: null, legs: null };
    if (eq === 'dumbbell') m.impl = 'db';
    else if (eq === 'barbell' || eq === 'smith') m.impl = 'bar';
    else if (eq === 'cable' || eq === 'selectorized' || eq === 'plate') m.impl = 'machine';
    var freeBar = (eq === 'dumbbell' || eq === 'barbell' || eq === 'smith');
    var lieLegs = { thigh: [-28, -28], shin: [64, 64] };
    if (pat === 'horizontal_press') {
      if (freeBar) { m.ctx = 'benchflat'; m.torso = -80; m.legs = lieLegs; }
      else if (eq === 'bodyweight') { m.ctx = 'floor'; m.torso = -84; m.legs = { thigh: [-90, -90], shin: [0, 0] }; }
      else m.ctx = 'seat';
    } else if (pat === 'incline_press') {
      if (freeBar) { m.ctx = 'benchincline'; m.torso = -44; m.legs = { thigh: [-34, -34], shin: [62, 62] }; }
      else m.ctx = 'seat';
    } else if (pat === 'vertical_press') { m.ctx = freeBar ? 'stand' : 'seat'; }
    else if (pat === 'vertical_pull') { if (eq === 'bodyweight') { m.ctx = 'hang'; m.impl = 'none'; m.legs = { thigh: [3, 3], shin: [3, 3] }; } else { m.ctx = 'pulldown'; m.impl = 'bar'; } }
    else if (pat === 'row') { if (eq === 'dumbbell') { m.ctx = 'benchsupport'; m.torso = -66; m.legs = { thigh: [-40, -40], shin: [42, 42] }; } else if (eq === 'cable') m.ctx = 'cable'; else m.ctx = 'seat'; }
    else if (pat === 'fly' || pat === 'rear_fly') { m.ctx = eq === 'cable' ? 'cable' : 'seat'; }
    else if (pat === 'curl') { if (id === 'sel_arm_curl') { m.ctx = 'preacher'; } else if (id === 'incline_db_curl') { m.ctx = 'benchincline'; m.torso = -46; m.impl = 'db'; m.legs = { thigh: [-34, -34], shin: [62, 62] }; } else if (eq === 'cable') m.ctx = 'cable'; else m.ctx = 'stand'; }
    else if (pat === 'tri_ext') { if (eq === 'dumbbell') { m.ctx = 'benchflat'; m.torso = -80; m.impl = 'db'; m.legs = lieLegs; } else m.ctx = 'cable'; }
    else if (pat === 'tri_press') { m.ctx = 'stand'; }
    else if (pat === 'squat') { m.ctx = freeBar && eq !== 'dumbbell' ? 'squat' : 'stand'; }
    else if (pat === 'hinge') { if (id === 'smith_hip_thrust') { m.ctx = 'benchflat'; m.torso = -78; } else m.ctx = (eq === 'smith' || eq === 'barbell') ? 'squat' : (eq === 'cable' ? 'cable' : 'stand'); }
    else if (pat === 'lunge') { m.ctx = 'stand'; }
    else if (pat === 'leg_ext' || pat === 'leg_curl' || pat === 'abduction') { m.ctx = 'legmachine'; m.impl = 'none'; }
    else if (pat === 'leg_press') { m.ctx = 'legpress'; m.impl = 'none'; }
    else if (pat === 'calf') { m.ctx = 'stand'; m.impl = 'machine'; }
    else if (pat === 'lateral') { m.ctx = 'stand'; }
    else if (pat === 'shrug') { m.ctx = 'stand'; }
    else if (pat === 'crunch') { m.ctx = id === 'cable_crunch' ? 'cable' : (id === 'ab_crunch_machine' ? 'seat' : 'floor'); m.impl = m.ctx === 'floor' ? 'none' : m.impl; }
    else if (pat === 'rotation' || pat === 'antiext') { m.ctx = 'floor'; m.impl = 'none'; if (pat === 'antiext') { m.torso = -86; m.legs = { thigh: [-90, -90], shin: [0, 0] }; } }
    else if (pat === 'cardio') { m.ctx = 'tread'; m.impl = 'none'; }
    else if (pat === 'lat_iso') { m.ctx = 'cable'; }
    return m;
  }
  function applyMove(base, move) {
    var p = JSON.parse(JSON.stringify(base));
    if (move.torso != null) { var d = p.torso[1] - p.torso[0]; p.torso = [move.torso, move.torso + d]; }
    if (move.legs) { if (!moving(p.thigh[0], p.thigh[1])) p.thigh = move.legs.thigh.slice(); if (!moving(p.shin[0], p.shin[1])) p.shin = move.legs.shin.slice(); }
    return p;
  }

  function howtoSVG(ex, variant) {
    var pattern = (typeof ex === 'string') ? ex : ex.pattern;
    var move = (typeof ex === 'object' && ex) ? deriveMove(ex) : { ctx: CTX[pattern] || 'stand', impl: 'none', torso: null, legs: null };
    var right = variant !== 'wrong';
    var base = applyMove(ANIM[pattern] || ANIM['default'], move);
    var p = right ? base : badPose(base, WRONG[pattern] || 'half');
    var rootT = 'translate(70,96)', rootA = '';
    if (p.rootBob) rootA = '<animateTransform attributeName="transform" type="translate" values="70,96;70,88;70,88;70,96" keyTimes="0;0.42;0.6;1" dur="' + (p.dur * 1.2).toFixed(2) + 's" repeatCount="indefinite"/>';
    var badge = right
      ? '<g transform="translate(11,13)"><circle r="10" fill="#31C85E"/><path d="M-4.5 0l3 3 6-7" stroke="#0E1113" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
      : '<g transform="translate(11,13)"><circle r="10" fill="#E4585C"/><path d="M-4 -4l8 8M4 -4l-8 8" stroke="#0E1113" stroke-width="2.6" stroke-linecap="round"/></g>';
    var defs = '<defs><filter id="hglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    return '<svg class="howto" viewBox="0 0 140 172" aria-label="how to perform this exercise">' + defs +
      '<g transform="' + rootT + '">' + rootA + apparatus(move.ctx) +
      figure(p, right, true, move.impl) + figure(p, right, false, move.impl) + (right ? arrow(p) : '') + '</g>' + badge + '</svg>';
  }

  function steps(pattern) { return STEPS[pattern] || STEPS['default']; }
  function wrongLabel(pattern) { return WRONG_LABEL[WRONG[pattern] || 'half'] || 'Common mistake'; }
  return { howtoSVG: howtoSVG, steps: steps, wrongLabel: wrongLabel, hasPattern: function (p) { return !!ANIM[p]; } };
});
