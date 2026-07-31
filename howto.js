/* muscles — how-to: an animated side-profile figure that demonstrates each
   movement pattern, plus plain beginner steps. figure is a small skeletal rig;
   each pattern rotates the relevant joints (SMIL, loops, self-contained).
   howtoSVG(pattern) -> <svg> string.  steps(pattern) -> [string].
   Browser global: HOWTO. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.HOWTO = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // pose per pattern: [restAngle, activeAngle] per joint (deg, about the joint).
  // seated legs ~ thigh -78 / shin 78; standing ~ 0/0. moving joints get tinted.
  var SEAT = { thigh: [-78, -78], shin: [78, 78] };
  var STAND = { thigh: [0, 0], shin: [0, 0] };
  function pose(o, legs, dur) { var p = { torso: [0, 0], uarm: [0, 0], farm: [-6, -6], dur: dur || 2.4 }; for (var k in legs) p[k] = legs[k]; for (var k2 in o) p[k2] = o[k2]; return p; }

  var ANIM = {
    horizontal_press: pose({ torso: [-3, -3], uarm: [-72, -92], farm: [-58, -4] }, SEAT, 2.4),
    incline_press: pose({ torso: [-6, -6], uarm: [-96, -122], farm: [-58, -6] }, SEAT, 2.4),
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
    shrug: pose({ uarm: [0, 0], torso: [0, -4] }, STAND, 1.6),
    squat: pose({ torso: [4, 20], uarm: [-6, -6], thigh: [0, -80], shin: [0, 66] }, STAND, 2.8),
    leg_press: pose({ torso: [-8, -8], thigh: [-42, -88], shin: [80, 18] }, {}, 2.6),
    hinge: pose({ torso: [2, 52], uarm: [-4, -4], thigh: [0, -8] }, STAND, 2.8),
    lunge: pose({ torso: [4, 10], thigh: [-30, -74], shin: [24, 70] }, {}, 2.6),
    leg_ext: pose({ shin: [78, 2] }, { thigh: [-78, -78] }, 2.2),
    leg_curl: pose({ shin: [8, 82] }, { thigh: [-78, -78] }, 2.2),
    calf: pose({ shin: [0, 0], torso: [0, 0] }, STAND, 1.5, true),
    crunch: pose({ torso: [-4, 40], thigh: [-80, -96] }, { shin: [78, 78] }, 2.2),
    rotation: pose({ torso: [-9, 9] }, STAND, 2.0),
    abduction: pose({ thigh: [-78, -92] }, { shin: [78, 78] }, 2.0),
    cardio: pose({ uarm: [-28, 18], farm: [-40, -40], thigh: [22, -30], shin: [34, 72] }, {}, 1.0),
    antiext: pose({ torso: [0, 0] }, STAND, 3.0),
    'default': pose({ uarm: [-8, -26] }, STAND, 2.4)
  };
  ANIM.calf.rootBob = true; ANIM.shrug.rootBob = true;

  var STEPS = {
    horizontal_press: ['Set the seat so the handles line up with the middle of your chest.', 'Sit tall, grip the handles, brace your core.', 'Press the handles forward until your arms are almost straight — don’t lock hard.', 'Lower slowly (about 2 seconds) to a comfortable stretch. Repeat.'],
    incline_press: ['Set the seat so handles are at your upper chest.', 'Grip, pull your shoulders back and down.', 'Press up and slightly in until nearly straight.', 'Lower slow to a stretch. No bouncing.'],
    vertical_press: ['Handles at shoulder height, sit tall.', 'Brace, ribs down (don’t arch your back).', 'Press straight up without shrugging.', 'Lower under control to the start.'],
    vertical_pull: ['Grip slightly wider than your shoulders, sit tall.', 'Pull your shoulders down first.', 'Drive your elbows down and pull the bar to your collarbone.', 'Let it rise slowly to a full stretch overhead.'],
    row: ['Chest against the pad (or sit tall), grab the handles.', 'Pull your elbows straight back, squeeze your shoulder blades.', 'Keep your torso still — no heaving.', 'Return slowly to a full stretch forward.'],
    fly: ['Set the pads so your arms open comfortably.', 'Slight bend in the elbows, hold it there.', 'Squeeze the pads together using your chest.', 'Open slowly to feel the stretch. Repeat.'],
    rear_fly: ['Chest on the pad, soft elbows.', 'Open your arms out and back, leading with the pinkies.', 'Squeeze your shoulder blades.', 'Return slowly.'],
    lateral: ['Stand tall, dumbbells at your sides.', 'Lead with your elbows, tilt like pouring water.', 'Raise to shoulder height — no higher.', 'Lower slowly. Keep it light and strict.'],
    curl: ['Elbows pinned to your sides.', 'Curl up, turning your pinky up at the top.', 'Squeeze, then lower slowly to straight arms.', 'No swinging the body.'],
    tri_ext: ['Elbows pinned to your sides.', 'Push the handle/rope down to a full lockout.', 'Squeeze the triceps.', 'Let it rise back up, elbows still.'],
    tri_press: ['Grip, stay fairly upright.', 'Lower until your elbows reach about 90°.', 'Press back up to straight arms.', 'Control the whole way.'],
    lat_iso: ['Soft, fixed elbows.', 'Push the bar down in an arc to your thighs.', 'Feel your lats (sides of your back), not your arms.', 'Return slowly.'],
    shrug: ['Stand tall, weights at your sides.', 'Shrug straight up toward your ears.', 'Pause at the top.', 'Lower slowly — no rolling.'],
    squat: ['Feet about shoulder-width.', 'Brace, sit down and back like into a chair.', 'Go to at least parallel, chest tall.', 'Drive up through your heels.'],
    leg_press: ['Feet shoulder-width on the middle of the platform.', 'Lower until your knees reach about 90°.', 'Keep your lower back on the seat.', 'Push through your whole foot — don’t lock hard.'],
    hinge: ['Soft knees, weight in your hands.', 'Push your hips back, back flat.', 'Feel the stretch in your hamstrings.', 'Drive your hips forward to stand tall.'],
    lunge: ['Take a long step forward.', 'Drop your back knee toward the floor.', 'Keep your front knee over your foot.', 'Push through the front heel to stand.'],
    leg_ext: ['Pad on your lower shin, sit back.', 'Straighten your legs to a squeeze at the top.', 'Pause briefly.', 'Lower slowly — don’t let the stack slam.'],
    leg_curl: ['Pad just above your heels.', 'Curl your heels down/in as hard as you can.', 'Squeeze.', 'Return slowly to the stretch.'],
    calf: ['Balls of your feet on the edge, heels free.', 'Drop your heels for a full stretch.', 'Push all the way up onto your toes.', 'Pause at the top — no bouncing.'],
    crunch: ['Get set, hands by your head or on the handles.', 'Crunch your ribs toward your hips.', 'Round your spine — don’t just pull your neck.', 'Return slowly, keep tension.'],
    rotation: ['Sit back to about 45°, feet up.', 'Rotate your torso side to side with control.', 'Move from your core, not your arms.', 'Count each side as a rep.'],
    abduction: ['Sit tall against the pad.', 'Push your knees outward.', 'Squeeze your glutes at the widest point.', 'Return slowly.'],
    cardio: ['Start easy and warm up for a few minutes.', 'Keep an effort you can just about hold a conversation at.', 'Use a small incline instead of going too fast.', 'Cool down for the last few minutes.'],
    antiext: ['Forearms down, body in one straight line.', 'Squeeze your abs and glutes.', 'Don’t let your hips sag or pike up.', 'Breathe. Hold for the time shown.'],
    'default': ['Set up in a stable, braced position.', 'Move through the full range with control.', 'Squeeze the target muscle at the hardest point.', 'Return slowly — form over weight.']
  };

  function anim(id, valsA, valsB, dur) {
    if (valsA === valsB) return '';
    return '<animateTransform attributeName="transform" attributeType="XML" type="rotate" ' +
      'values="' + valsA + ';' + valsB + ';' + valsA + '" keyTimes="0;0.5;1" dur="' + dur + 's" ' +
      'repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1;0.42 0 0.2 1"/>';
  }
  function moving(a, b) { return a !== b; }
  function limb(len, w, col) { return '<line x1="0" y1="0" x2="0" y2="' + len + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }

  function howtoSVG(pattern) {
    var p = ANIM[pattern] || ANIM['default']; var d = p.dur;
    var still = '#333B42', hot = '#F2551C', J = '#0E1113';
    function col(a, b) { return moving(a, b) ? hot : still; }
    var uarmC = col(p.uarm[0], p.uarm[1]), farmC = col(p.farm[0], p.farm[1]);
    var thighC = col(p.thigh[0], p.thigh[1]), shinC = col(p.shin[0], p.shin[1]);
    var torsoMoves = moving(p.torso[0], p.torso[1]);

    // arm (shoulder at 0,-38 within torso group), forearm len 18, upper 20
    var arm = '<g transform="translate(0,-38)"><g transform="rotate(' + p.uarm[0] + ')">' + anim('uarm', p.uarm[0], p.uarm[1], d) +
      limb(20, 9, uarmC) +
      '<g transform="translate(0,20)"><g transform="rotate(' + p.farm[0] + ')">' + anim('farm', p.farm[0], p.farm[1], d) +
      limb(18, 8, farmC) + '<circle cx="0" cy="18" r="4.5" fill="' + farmC + '"/>' +
      '</g></g></g></g>';
    // torso group (pivots at pelvis 0,0): torso up to -40, head at -52
    var torso = '<g transform="rotate(' + p.torso[0] + ')">' + anim('torso', p.torso[0], p.torso[1], d) +
      '<line x1="0" y1="0" x2="0" y2="-40" stroke="' + (torsoMoves ? hot : '#3A424A') + '" stroke-width="13" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-52" r="9" fill="#3A424A"/>' + arm + '</g>';
    // leg (pivot at pelvis): thigh 24, shin 24, foot
    var leg = '<g transform="rotate(' + p.thigh[0] + ')">' + anim('thigh', p.thigh[0], p.thigh[1], d) +
      limb(24, 10, thighC) +
      '<g transform="translate(0,24)"><g transform="rotate(' + p.shin[0] + ')">' + anim('shin', p.shin[0], p.shin[1], d) +
      limb(24, 9, shinC) + '<line x1="0" y1="24" x2="10" y2="24" stroke="' + shinC + '" stroke-width="6" stroke-linecap="round"/>' +
      '</g></g></g>';

    var rootTransform = 'translate(70,96)';
    var rootAnim = '';
    if (p.rootBob) rootTransform = 'translate(70,96)', rootAnim = '<animateTransform attributeName="transform" type="translate" values="70,96;70,88;70,96" keyTimes="0;0.5;1" dur="' + d + 's" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1;0.42 0 0.2 1"/>';

    return '<svg class="howto" viewBox="0 0 140 170" aria-label="how to perform this exercise">' +
      '<g transform="' + rootTransform + '">' + rootAnim + leg + torso + '</g></svg>';
  }

  function steps(pattern) { return STEPS[pattern] || STEPS['default']; }
  return { howtoSVG: howtoSVG, steps: steps, hasPattern: function (p) { return !!ANIM[p]; } };
});
