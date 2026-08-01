/* muscles — selectable handbook programs.
   Every coached session stays inside the selected program. The runtime may trim or
   expand a day to fit time, but it never combines incompatible splits. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.PROGRAM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function slot(role, muscle, exercise, alternatives, sets) {
    return { r: role, m: muscle, ex: exercise, alt: alternatives || [], sets: sets || null };
  }
  function day(id, name, focusMuscles, slots) {
    return { id: id, name: name, focusMuscles: focusMuscles, slots: slots };
  }

  var fullA = day('full_a', 'Full Body A', ['chest', 'lats', 'quads', 'hamstrings', 'abs'], [
    slot('compound', 'quads', 'leg_press', ['goblet_squat', 'smith_squat'], 3),
    slot('compound', 'chest', 'pl_chest_press', ['db_bench', 'barbell_bench', 'smith_bench'], 3),
    slot('compound', 'lats', 'pl_lat_pulldown', ['lat_pulldown', 'assisted_pullup'], 3),
    slot('accessory', 'hamstrings', 'seated_leg_curl', ['lying_leg_curl'], 2),
    slot('accessory', 'biceps', 'sel_arm_curl', ['pl_biceps_curl', 'ez_curl', 'db_curl'], 2),
    slot('core', 'abs', 'dead_bug', ['lying_leg_raise', 'plank'], 2)
  ]);
  var fullB = day('full_b', 'Full Body B', ['front_delts', 'mid_back', 'glutes', 'quads', 'triceps', 'abs'], [
    slot('compound', 'glutes', 'booty_builder_hip_thrust', ['smith_hip_thrust', 'db_rdl'], 3),
    slot('compound', 'front_delts', 'pl_shoulder_press', ['db_shoulder_press', 'smith_ohp'], 3),
    slot('compound', 'mid_back', 'pl_low_row', ['cable_row', 'db_row', 'pl_high_row'], 3),
    slot('accessory', 'quads', 'leg_extension', ['goblet_squat'], 2),
    slot('accessory', 'triceps', 'pl_seated_dip', ['assisted_dip', 'cable_pushdown'], 2),
    slot('core', 'abs', 'lying_leg_raise', ['dead_bug', 'plank'], 2)
  ]);

  var push = day('push', 'Push', ['chest', 'front_delts', 'triceps'], [
    slot('compound', 'chest', 'pl_incline_press', ['pl_chest_press', 'db_incline', 'barbell_incline'], 3),
    slot('compound', 'front_delts', 'pl_shoulder_press', ['db_shoulder_press', 'smith_ohp'], 3),
    slot('compound', 'chest', 'pl_decline_press', ['pl_chest_press', 'db_bench'], 3),
    slot('accessory', 'chest', 'pec_deck', ['cable_crossover'], 3),
    slot('accessory', 'side_delts', 'db_lateral', ['cable_lateral'], 3),
    slot('accessory', 'triceps', 'pl_seated_dip', ['assisted_dip', 'cable_pushdown', 'overhead_cable_ext'], 3),
    slot('core', 'abs', 'dead_bug', ['lying_leg_raise', 'plank'], 2)
  ]);
  var pull = day('pull', 'Pull', ['lats', 'mid_back', 'rear_delts', 'biceps'], [
    slot('compound', 'lats', 'pl_lat_pulldown', ['lat_pulldown', 'assisted_pullup'], 3),
    slot('compound', 'mid_back', 'pl_low_row', ['pl_high_row', 'cable_row', 'db_row'], 3),
    slot('compound', 'lats', 'pl_high_row', ['pl_low_row', 'cable_row', 'db_row'], 3),
    slot('accessory', 'rear_delts', 'rear_delt_machine', ['face_pull', 'cable_rear_delt'], 3),
    slot('accessory', 'biceps', 'pl_biceps_curl', ['sel_arm_curl', 'ez_curl', 'db_curl'], 3),
    slot('accessory', 'lower_back', 'back_extension', ['db_rdl'], 2),
    slot('core', 'abs', 'cable_crunch', ['dead_bug', 'lying_leg_raise'], 2)
  ]);
  var legs = day('legs', 'Legs', ['quads', 'hamstrings', 'glutes', 'calves', 'adductors'], [
    slot('compound', 'quads', 'leg_press', ['goblet_squat', 'smith_squat'], 4),
    slot('compound', 'glutes', 'booty_builder_hip_thrust', ['smith_hip_thrust', 'db_rdl'], 3),
    slot('accessory', 'hamstrings', 'seated_leg_curl', ['lying_leg_curl'], 3),
    slot('accessory', 'quads', 'leg_extension', ['goblet_squat'], 3),
    slot('accessory', 'adductors', 'hip_adduction', ['walking_lunge'], 3),
    slot('accessory', 'calves', 'standing_calf', ['leg_press_calf'], 3),
    slot('core', 'abs', 'dead_bug', ['plank', 'lying_leg_raise'], 2)
  ]);

  var upperA = day('upper_a', 'Upper A', ['chest', 'lats', 'front_delts', 'biceps', 'triceps'], [
    slot('compound', 'chest', 'pl_chest_press', ['barbell_bench', 'db_bench', 'smith_bench'], 3),
    slot('compound', 'lats', 'pl_lat_pulldown', ['lat_pulldown', 'assisted_pullup'], 3),
    slot('compound', 'front_delts', 'pl_shoulder_press', ['db_shoulder_press', 'smith_ohp'], 3),
    slot('compound', 'mid_back', 'pl_low_row', ['cable_row', 'db_row'], 3),
    slot('accessory', 'biceps', 'pl_biceps_curl', ['sel_arm_curl', 'ez_curl'], 2),
    slot('accessory', 'triceps', 'cable_pushdown', ['pl_seated_dip', 'overhead_cable_ext'], 2),
    slot('core', 'abs', 'dead_bug', ['plank'], 2)
  ]);
  var lowerA = day('lower_a', 'Lower A', ['quads', 'hamstrings', 'glutes', 'calves'], [
    slot('compound', 'quads', 'leg_press', ['goblet_squat', 'smith_squat'], 4),
    slot('compound', 'hamstrings', 'db_rdl', ['smith_rdl', 'lying_leg_curl'], 3),
    slot('accessory', 'quads', 'leg_extension', ['goblet_squat'], 3),
    slot('accessory', 'hamstrings', 'seated_leg_curl', ['lying_leg_curl'], 3),
    slot('accessory', 'calves', 'standing_calf', ['leg_press_calf'], 3),
    slot('core', 'abs', 'lying_leg_raise', ['dead_bug', 'plank'], 2)
  ]);
  var upperB = day('upper_b', 'Upper B', ['chest', 'lats', 'mid_back', 'rear_delts', 'arms'], [
    slot('compound', 'chest', 'pl_incline_press', ['barbell_incline', 'db_incline'], 3),
    slot('compound', 'mid_back', 'pl_high_row', ['pl_low_row', 'cable_row', 'db_row'], 3),
    slot('compound', 'chest', 'pl_decline_press', ['pl_chest_press', 'db_bench'], 3),
    slot('compound', 'lats', 'lat_pulldown', ['pl_lat_pulldown', 'assisted_pullup'], 3),
    slot('accessory', 'rear_delts', 'rear_delt_machine', ['face_pull'], 2),
    slot('accessory', 'biceps', 'sel_arm_curl', ['pl_biceps_curl', 'db_curl'], 2),
    slot('accessory', 'triceps', 'pl_seated_dip', ['assisted_dip', 'cable_pushdown'], 2)
  ]);
  var lowerB = day('lower_b', 'Lower B', ['glutes', 'hamstrings', 'quads', 'adductors'], [
    slot('compound', 'glutes', 'booty_builder_hip_thrust', ['smith_hip_thrust', 'db_rdl'], 4),
    slot('compound', 'quads', 'goblet_squat', ['leg_press', 'smith_squat'], 3),
    slot('accessory', 'hamstrings', 'lying_leg_curl', ['seated_leg_curl'], 3),
    slot('accessory', 'quads', 'leg_extension', ['walking_lunge'], 3),
    slot('accessory', 'adductors', 'hip_adduction', ['walking_lunge'], 3),
    slot('accessory', 'calves', 'standing_calf', ['leg_press_calf'], 3),
    slot('core', 'lower_back', 'back_extension', ['dead_bug'], 2)
  ]);

  function makeProgram(id, name, experience, frequency, days, cycle, description, setRanges) {
    return {
      schemaVersion: 2,
      id: id,
      name: name,
      experienceLevel: experience,
      sessionsPerRotation: frequency,
      days: days,
      cycle: cycle,
      liftingDays: cycle.slice(),
      optionalCardio: ['treadmill_steady', 'recumbent_bike', 'upper_body_ergometer'],
      description: description,
      hardSetRanges: setRanges,
      warmUp: {
        generalMinutes: [5, 10],
        generalOptions: ['treadmill_steady', 'recumbent_bike', 'upper_body_ergometer'],
        rampSets: [
          { percent: 40, reps: 8, label: 'easy rehearsal' },
          { percent: 65, reps: 5, label: 'controlled ramp' }
        ]
      }
    };
  }

  var PROGRAMS = {
    beginner_full_body: makeProgram(
      'beginner_full_body', 'Beginner Full Body A/B', 'beginner', [2, 3],
      { full_a: fullA, full_b: fullB }, ['full_a', 'full_b'],
      'Two alternating whole-body sessions. Train two or three days per week and resume where you left off.',
      { chest: [5, 8], back: [5, 8], quads: [5, 8], hamstrings: [4, 7], glutes: [4, 7], shoulders: [3, 6], arms: [2, 6], core: [4, 6] }
    ),
    push_pull_legs: makeProgram(
      'push_pull_legs', 'Push / Pull / Legs', 'beginner-intermediate', [3, 5, 6, 7],
      { push: push, pull: pull, legs: legs }, ['push', 'pull', 'legs'],
      'Push, pull, and lower-body sessions on a 3-day rotation. Run it once for 3 days, or repeat it for 5–7 days a week.',
      { chest: [6, 10], back: [8, 12], quads: [6, 10], hamstrings: [5, 9], glutes: [5, 9], shoulders: [5, 9], arms: [5, 9], core: [4, 7] }
    ),
    upper_lower: makeProgram(
      'upper_lower', 'Upper / Lower', 'beginner-intermediate', [4],
      { upper_a: upperA, lower_a: lowerA, upper_b: upperB, lower_b: lowerB }, ['upper_a', 'lower_a', 'upper_b', 'lower_b'],
      'Four balanced sessions with two upper- and two lower-body exposures each week.',
      { chest: [8, 12], back: [10, 14], quads: [8, 12], hamstrings: [7, 11], glutes: [7, 11], shoulders: [6, 10], arms: [5, 9], core: [4, 8] }
    ),
    intermediate_four_day: makeProgram(
      'intermediate_four_day', 'Intermediate Strength + Hypertrophy', 'intermediate', [4],
      {
        upper_strength: Object.assign({}, upperA, { id: 'upper_strength', name: 'Upper Strength' }),
        lower_strength: Object.assign({}, lowerA, { id: 'lower_strength', name: 'Lower Strength' }),
        upper_hypertrophy: Object.assign({}, upperB, { id: 'upper_hypertrophy', name: 'Upper Hypertrophy' }),
        lower_hypertrophy: Object.assign({}, lowerB, { id: 'lower_hypertrophy', name: 'Lower Hypertrophy' })
      }, ['upper_strength', 'lower_strength', 'upper_hypertrophy', 'lower_hypertrophy'],
      'Four days pairing lower-repetition primary work with controlled hypertrophy volume.',
      { chest: [9, 14], back: [10, 16], quads: [9, 14], hamstrings: [8, 13], glutes: [8, 13], shoulders: [7, 12], arms: [6, 10], core: [4, 8] }
    )
  };

  var CLASSIC = {
    chest: ['pl_incline_press', 'pl_chest_press', 'pec_deck', 'cable_crossover', 'assisted_dip', 'pushup'],
    back: ['pl_lat_pulldown', 'lat_pulldown', 'pl_low_row', 'pl_high_row', 'cable_row', 'db_row'],
    shoulders: ['pl_shoulder_press', 'db_lateral', 'rear_delt_machine', 'cable_lateral', 'face_pull', 'db_shrug'],
    arms: ['pl_biceps_curl', 'sel_arm_curl', 'ez_curl', 'cable_pushdown', 'hammer_curl', 'overhead_cable_ext'],
    legs: ['leg_press', 'booty_builder_hip_thrust', 'leg_extension', 'seated_leg_curl', 'hip_adduction', 'standing_calf'],
    core: ['dead_bug', 'lying_leg_raise', 'cable_crunch', 'plank', 'russian_twist', 'back_extension']
  };
  var BODYPARTS = [
    { id: 'chest', name: 'Chest', muscles: ['chest', 'front_delts'] },
    { id: 'back', name: 'Back', muscles: ['lats', 'mid_back', 'traps', 'lower_back'] },
    { id: 'shoulders', name: 'Shoulders', muscles: ['front_delts', 'side_delts', 'rear_delts'] },
    { id: 'arms', name: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
    { id: 'legs', name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'adductors', 'calves'] },
    { id: 'core', name: 'Core', muscles: ['abs', 'obliques', 'lower_back'] }
  ];

  function recommend(experience, frequency) {
    var days = Number(frequency) || 3;
    // 5-7 days/week: Push/Pull/Legs rotates cleanly at high frequency (a full
    // rotation every 3 sessions), so it scales to 5, 6 or 7 days better than the
    // 4-day splits.
    if (days >= 5) return 'push_pull_legs';
    if (experience === 'intermediate' && days >= 4) return 'intermediate_four_day';
    if (days >= 4) return 'upper_lower';
    if (days === 3 && experience === 'intermediate') return 'push_pull_legs';
    return 'beginner_full_body';
  }
  function get(id) {
    var program = PROGRAMS[id] || PROGRAMS.beginner_full_body;
    program.programs = PROGRAMS;
    program.get = get;
    program.recommend = recommend;
    program.classic = CLASSIC;
    program.bodyParts = BODYPARTS;
    return program;
  }
  return get('beginner_full_body');
});
