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
  function anim(a, b, dur) { if (!moving(a, b)) return ''; return '<animateTransform attributeName="transform" attributeType="XML" type="rotate" values="' + a + ';' + b + ';' + a + '" keyTimes="0;0.5;1" dur="' + dur + 's" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1;0.42 0 0.2 1"/>'; }
  function cap(len, w, col) { return '<line x1="0" y1="0" x2="0" y2="' + len + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }

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
      case 'floor': return '<line x1="-30" y1="52" x2="46" y2="52" stroke="' + AP + '" stroke-width="2"/>';
      default: return '';
    }
  }

  function figure(p, right) {
    var still = '#39424A', hot = right ? '#31C85E' : '#E4585C', body = '#333C44', d = p.dur;
    function col(a) { return moving(a[0], a[1]) ? hot : still; }
    var uarmC = col(p.uarm), farmC = col(p.farm), thighC = col(p.thigh), shinC = col(p.shin);
    var torsoHot = moving(p.torso[0], p.torso[1]);
    var arm = '<g transform="translate(0,-34)"><g transform="rotate(' + p.uarm[0] + ')">' + anim(p.uarm[0], p.uarm[1], d) + cap(20, 10, uarmC) +
      '<circle cx="0" cy="20" r="3" fill="' + uarmC + '"/><g transform="translate(0,20)"><g transform="rotate(' + p.farm[0] + ')">' + anim(p.farm[0], p.farm[1], d) + cap(18, 8, farmC) + '<circle cx="0" cy="18" r="5" fill="' + farmC + '"/></g></g></g></g>';
    var torso = '<g transform="rotate(' + p.torso[0] + ')">' + anim(p.torso[0], p.torso[1], d) +
      '<rect x="-11" y="-40" width="22" height="40" rx="10" fill="' + (torsoHot ? hot : body) + '"/>' +
      '<circle cx="0" cy="-51" r="8.5" fill="' + body + '"/><rect x="-4" y="-45" width="8" height="8" fill="' + body + '"/>' + arm + '</g>';
    var leg = '<g transform="rotate(' + p.thigh[0] + ')">' + anim(p.thigh[0], p.thigh[1], d) + cap(24, 12, thighC) +
      '<circle cx="0" cy="24" r="4" fill="' + thighC + '"/><g transform="translate(0,24)"><g transform="rotate(' + p.shin[0] + ')">' + anim(p.shin[0], p.shin[1], d) + cap(24, 10, shinC) + '<line x1="0" y1="24" x2="11" y2="24" stroke="' + shinC + '" stroke-width="7" stroke-linecap="round"/></g></g></g>';
    var hips = '<rect x="-11" y="-3" width="22" height="10" rx="5" fill="' + body + '"/>';
    return leg + hips + torso;
  }

  function howtoSVG(pattern, variant) {
    var right = variant !== 'wrong';
    var base = ANIM[pattern] || ANIM['default'];
    var p = right ? base : badPose(base, WRONG[pattern] || 'half');
    var rootT = 'translate(70,96)', rootA = '';
    if (p.rootBob) rootA = '<animateTransform attributeName="transform" type="translate" values="70,96;70,88;70,96" keyTimes="0;0.5;1" dur="' + p.dur + 's" repeatCount="indefinite"/>';
    var badge = right
      ? '<g transform="translate(10,12)"><circle r="9" fill="#31C85E"/><path d="M-4 0l3 3 5-6" stroke="#0E1113" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
      : '<g transform="translate(10,12)"><circle r="9" fill="#E4585C"/><path d="M-3.5 -3.5l7 7M3.5 -3.5l-7 7" stroke="#0E1113" stroke-width="2.4" stroke-linecap="round"/></g>';
    return '<svg class="howto" viewBox="0 0 140 170" aria-label="how to perform this exercise">' +
      '<g transform="' + rootT + '">' + rootA + apparatus(CTX[pattern] || 'stand') + figure(p, right) + '</g>' + badge + '</svg>';
  }

  function steps(pattern) { return STEPS[pattern] || STEPS['default']; }
  function wrongLabel(pattern) { return WRONG_LABEL[WRONG[pattern] || 'half'] || 'Common mistake'; }
  return { howtoSVG: howtoSVG, steps: steps, wrongLabel: wrongLabel, hasPattern: function (p) { return !!ANIM[p]; } };
});
