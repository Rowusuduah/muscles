/* muscles — the coached program.
   A 7-session weekly cycle. Lifting days are ordered slots; the session
   builder (logic.js) keeps compounds + one core slot and trims/expands
   accessories to fit the user's time budget. Cardio days seed a modality.
   slot = { r: role, m: target muscleId, ex: preferred exerciseId, alt: [exerciseId...] }
   `alt` is ranked by movement similarity — also used for busy-machine swaps.
   Exercise sets/repRange/rest come from the exercise definition. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.PROGRAM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var push = {
    id: 'push', name: 'Push Day', focusMuscles: ['chest', 'front_delts', 'triceps'],
    slots: [
      { r: 'compound', m: 'chest', ex: 'pl_incline_press', alt: ['pl_chest_press', 'sel_chest_press', 'db_incline', 'smith_bench'] },
      { r: 'compound', m: 'chest', ex: 'pl_chest_press', alt: ['sel_chest_press', 'db_bench', 'smith_bench', 'pushup'] },
      { r: 'compound', m: 'front_delts', ex: 'sel_shoulder_press', alt: ['pl_shoulder_press', 'db_shoulder_press', 'smith_ohp'] },
      { r: 'accessory', m: 'chest', ex: 'pec_deck', alt: ['cable_crossover'] },
      { r: 'accessory', m: 'side_delts', ex: 'db_lateral', alt: ['cable_lateral'] },
      { r: 'accessory', m: 'triceps', ex: 'cable_pushdown', alt: ['overhead_cable_ext', 'db_skullcrusher', 'close_grip_smith'] },
      { r: 'core', m: 'abs', ex: 'hanging_leg_raise', alt: ['lying_leg_raise', 'cable_crunch', 'ab_crunch_machine', 'plank'] }
    ]
  };
  var pull = {
    id: 'pull', name: 'Pull Day', focusMuscles: ['lats', 'mid_back', 'biceps', 'rear_delts'],
    slots: [
      { r: 'compound', m: 'lats', ex: 'lat_pulldown', alt: ['assisted_pullup'] },
      { r: 'compound', m: 'mid_back', ex: 'pl_low_row', alt: ['sel_seated_row', 'cable_row', 'db_row', 'pl_high_row'] },
      { r: 'compound', m: 'lats', ex: 'pl_high_row', alt: ['cable_row', 'sel_seated_row', 'db_row'] },
      { r: 'accessory', m: 'rear_delts', ex: 'rear_delt_machine', alt: ['cable_rear_delt', 'face_pull'] },
      { r: 'accessory', m: 'biceps', ex: 'sel_arm_curl', alt: ['ez_curl', 'db_curl', 'cable_curl', 'incline_db_curl'] },
      { r: 'accessory', m: 'biceps', ex: 'hammer_curl', alt: ['incline_db_curl', 'cable_curl', 'db_curl'] },
      { r: 'core', m: 'abs', ex: 'cable_crunch', alt: ['hanging_leg_raise', 'lying_leg_raise', 'ab_crunch_machine'] }
    ]
  };
  var legs = {
    id: 'legs', name: 'Leg Day', focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    slots: [
      { r: 'compound', m: 'quads', ex: 'leg_press', alt: ['hack_squat', 'smith_squat', 'goblet_squat'] },
      { r: 'compound', m: 'hamstrings', ex: 'smith_rdl', alt: ['db_rdl', 'seated_leg_curl', 'lying_leg_curl'] },
      { r: 'accessory', m: 'quads', ex: 'leg_extension', alt: ['hack_squat', 'goblet_squat'] },
      { r: 'accessory', m: 'hamstrings', ex: 'seated_leg_curl', alt: ['lying_leg_curl'] },
      { r: 'accessory', m: 'glutes', ex: 'hip_abduction', alt: ['smith_hip_thrust', 'cable_kickback', 'bulgarian_split'] },
      { r: 'accessory', m: 'calves', ex: 'standing_calf', alt: ['seated_calf', 'leg_press_calf'] },
      { r: 'core', m: 'abs', ex: 'lying_leg_raise', alt: ['hanging_leg_raise', 'cable_crunch', 'plank'] }
    ]
  };
  var upper = {
    id: 'upper', name: 'Upper Day', focusMuscles: ['chest', 'lats', 'front_delts', 'biceps', 'triceps'],
    slots: [
      { r: 'compound', m: 'chest', ex: 'pl_chest_press', alt: ['sel_chest_press', 'db_bench', 'smith_bench', 'pl_incline_press'] },
      { r: 'compound', m: 'lats', ex: 'lat_pulldown', alt: ['assisted_pullup', 'pl_high_row'] },
      { r: 'compound', m: 'mid_back', ex: 'sel_seated_row', alt: ['pl_low_row', 'cable_row', 'db_row'] },
      { r: 'compound', m: 'front_delts', ex: 'db_shoulder_press', alt: ['sel_shoulder_press', 'pl_shoulder_press', 'smith_ohp'] },
      { r: 'accessory', m: 'biceps', ex: 'ez_curl', alt: ['db_curl', 'cable_curl', 'sel_arm_curl'] },
      { r: 'accessory', m: 'triceps', ex: 'cable_pushdown', alt: ['overhead_cable_ext', 'close_grip_smith', 'db_skullcrusher'] },
      { r: 'core', m: 'abs', ex: 'ab_crunch_machine', alt: ['cable_crunch', 'hanging_leg_raise', 'lying_leg_raise'] }
    ]
  };
  var lower = {
    id: 'lower', name: 'Lower Day', focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    slots: [
      { r: 'compound', m: 'quads', ex: 'hack_squat', alt: ['leg_press', 'smith_squat', 'goblet_squat'] },
      { r: 'compound', m: 'hamstrings', ex: 'db_rdl', alt: ['smith_rdl', 'lying_leg_curl', 'seated_leg_curl'] },
      { r: 'compound', m: 'glutes', ex: 'smith_hip_thrust', alt: ['hip_abduction', 'cable_kickback', 'bulgarian_split'] },
      { r: 'accessory', m: 'quads', ex: 'leg_extension', alt: ['leg_press', 'goblet_squat'] },
      { r: 'accessory', m: 'hamstrings', ex: 'lying_leg_curl', alt: ['seated_leg_curl'] },
      { r: 'accessory', m: 'calves', ex: 'seated_calf', alt: ['standing_calf', 'leg_press_calf'] },
      { r: 'core', m: 'obliques', ex: 'russian_twist', alt: ['plank', 'lying_leg_raise', 'cable_crunch'] }
    ]
  };
  var cardio = {
    id: 'cardio', name: 'Cardio', focusMuscles: [],
    cardio: { modalities: ['treadmill_steady', 'elliptical_steady', 'treadmill_interval'], defaultEx: 'treadmill_steady', effortTarget: 'Zone 2 — conversational' }
  };

  /* CLASSIC body-part split — used in "Train with a partner" mode, where a human
     guides you, so the app organises by single body part (bro split) instead of PPL.
     Each is a recommended starting list of exercise ids; the user can add/remove/search. */
  var CLASSIC = {
    chest: ['pl_incline_press', 'pl_chest_press', 'pec_deck', 'cable_crossover', 'assisted_dip', 'pushup'],
    back: ['lat_pulldown', 'pl_low_row', 'sel_seated_row', 'pl_high_row', 'straight_arm_pulldown', 'db_row'],
    shoulders: ['sel_shoulder_press', 'db_lateral', 'rear_delt_machine', 'cable_lateral', 'face_pull', 'db_shrug'],
    arms: ['ez_curl', 'cable_pushdown', 'hammer_curl', 'overhead_cable_ext', 'sel_arm_curl', 'incline_db_curl'],
    legs: ['leg_press', 'hack_squat', 'leg_extension', 'seated_leg_curl', 'smith_rdl', 'standing_calf'],
    core: ['hanging_leg_raise', 'cable_crunch', 'ab_crunch_machine', 'plank', 'russian_twist']
  };

  /* body-part categories (for the partner picker + Train explorer + figure highlight) */
  var BODYPARTS = [
    { id: 'chest', name: 'Chest', muscles: ['chest', 'front_delts'] },
    { id: 'back', name: 'Back', muscles: ['lats', 'mid_back', 'traps', 'lower_back'] },
    { id: 'shoulders', name: 'Shoulders', muscles: ['front_delts', 'side_delts', 'rear_delts'] },
    { id: 'arms', name: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
    { id: 'legs', name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { id: 'core', name: 'Abs / Core', muscles: ['abs', 'obliques'] }
  ];

  return {
    id: 'ppl-ul+2cardio',
    goal: 'hypertrophy',
    days: { push: push, pull: pull, legs: legs, upper: upper, lower: lower, cardio: cardio },
    /* the fixed 7-session order the cycle advances through */
    cycle: ['push', 'pull', 'legs', 'cardio', 'upper', 'lower', 'cardio'],
    liftingDays: ['push', 'pull', 'legs', 'upper', 'lower'],
    classic: CLASSIC,
    bodyParts: BODYPARTS
  };
});
