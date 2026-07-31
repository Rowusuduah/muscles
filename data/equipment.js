/* muscles — equipment catalog (USF Rec).
   Best-effort identification from Marvin's 51 photos. `src` is the raw photo,
   `photo` the compressed webp the app ships. `exerciseIds` are the movements
   this machine performs (drives "pick your machine"). `confirm:true` = the
   photo->machine match should be double-checked with Marvin.
   Muscle-group tags are coarse categories used by the Train explorer. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.EQUIPMENT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var img = function (n) { return 'assets/equipment/eq' + n + '.webp'; };
  var raw = function (n) { return n === 1 ? 'GYM/Gym equipment.jpeg' : 'GYM/Gym equipment ' + n + '.jpeg'; };
  return [
    /* ---- CHEST ---- */
    { id: 'm_incline_press', name: 'Incline Chest Press', type: 'plate', photo: img(5), src: raw(5),
      cats: ['chest'], exerciseIds: ['pl_incline_press'], note: 'Plate-loaded, converging handles. Great chest builder.' },
    { id: 'm_chest_press', name: 'Iso-Lateral Chest Press', type: 'plate', photo: img(6), src: raw(6),
      cats: ['chest'], exerciseIds: ['pl_chest_press'], note: 'Plate-loaded flat press, each arm independent.' },
    { id: 'm_chest_press_sel', name: 'Chest Press (selectorized)', type: 'selectorized', photo: img(37), src: raw(37),
      cats: ['chest'], exerciseIds: ['sel_chest_press'], confirm: true },
    { id: 'm_pec_deck', name: 'Pec Deck / Fly', type: 'selectorized', photo: img(38), src: raw(38),
      cats: ['chest', 'shoulders'], exerciseIds: ['pec_deck', 'rear_delt_machine'], confirm: true,
      note: 'Doubles as reverse-fly for rear delts.' },

    /* ---- SHOULDERS ---- */
    { id: 'm_shoulder_press', name: 'Shoulder Press (machine)', type: 'selectorized', photo: img(24), src: raw(24),
      cats: ['shoulders'], exerciseIds: ['sel_shoulder_press'], note: 'Has movement diagrams on the frame.' },
    { id: 'm_shoulder_press_sel', name: 'Seated Shoulder Press', type: 'selectorized', photo: img(36), src: raw(36),
      cats: ['shoulders'], exerciseIds: ['sel_shoulder_press'], confirm: true },

    /* ---- BACK ---- */
    { id: 'm_lat_pulldown', name: 'Lat Pulldown', type: 'selectorized', photo: img(34), src: raw(34),
      cats: ['back'], exerciseIds: ['lat_pulldown', 'straight_arm_pulldown'], confirm: true },
    { id: 'm_iso_row', name: 'Iso-Lateral Row', type: 'plate', photo: img(2), src: raw(2),
      cats: ['back'], exerciseIds: ['pl_low_row', 'pl_high_row'], note: 'Plate-loaded row, chest supported.' },
    { id: 'm_seated_row', name: 'Seated Row (machine)', type: 'selectorized', photo: img(28), src: raw(28),
      cats: ['back'], exerciseIds: ['sel_seated_row'], confirm: true },
    { id: 'm_assisted', name: 'Assisted Pull-Up / Dip', type: 'selectorized', photo: img(43), src: raw(43),
      cats: ['back', 'arms', 'chest'], exerciseIds: ['assisted_pullup', 'assisted_dip'], confirm: true,
      note: 'Counterweight helps you do pull-ups and dips.' },

    /* ---- ARMS ---- */
    { id: 'm_arm_curl', name: 'Machine Preacher Curl', type: 'selectorized', photo: img(38), src: raw(38),
      cats: ['arms'], exerciseIds: ['sel_arm_curl'], confirm: true },
    { id: 'm_tricep_cable', name: 'Cable Column (triceps)', type: 'cable', photo: img(46), src: raw(46),
      cats: ['arms', 'back'], exerciseIds: ['cable_pushdown', 'overhead_cable_ext', 'straight_arm_pulldown'], confirm: true },

    /* ---- LEGS ---- */
    { id: 'm_leg_press', name: 'Leg Press', type: 'plate', photo: img(13), src: raw(13),
      cats: ['legs'], exerciseIds: ['leg_press', 'leg_press_calf'], note: 'Angled sled, silver foot plate.' },
    { id: 'm_hack_squat', name: 'Hack Squat', type: 'plate', photo: img(11), src: raw(11),
      cats: ['legs'], exerciseIds: ['hack_squat'], confirm: true },
    { id: 'm_leg_ext', name: 'Leg Extension', type: 'selectorized', photo: img(12), src: raw(12),
      cats: ['legs'], exerciseIds: ['leg_extension'], confirm: true },
    { id: 'm_seated_curl', name: 'Seated Leg Curl', type: 'selectorized', photo: img(45), src: raw(45),
      cats: ['legs'], exerciseIds: ['seated_leg_curl'], confirm: true },
    { id: 'm_lying_curl', name: 'Lying Leg Curl', type: 'selectorized', photo: img(40), src: raw(40),
      cats: ['legs'], exerciseIds: ['lying_leg_curl'], confirm: true },
    { id: 'm_hip_ab', name: 'Hip Abduction', type: 'selectorized', photo: img(44), src: raw(44),
      cats: ['legs', 'glutes'], exerciseIds: ['hip_abduction'], confirm: true },
    { id: 'm_seated_calf', name: 'Seated Calf Raise', type: 'plate', photo: img(9), src: raw(9),
      cats: ['legs'], exerciseIds: ['seated_calf'], confirm: true },

    /* ---- RACKS / SMITH / FREE WEIGHT ---- */
    { id: 'm_smith', name: 'Smith Machine', type: 'smith', photo: img(30), src: raw(30),
      cats: ['chest', 'shoulders', 'legs', 'back'],
      exerciseIds: ['smith_bench', 'smith_ohp', 'smith_squat', 'smith_rdl', 'smith_hip_thrust', 'close_grip_smith'],
      note: 'Guided bar — safe for pressing and squatting solo.' },
    { id: 'm_rack', name: 'Power / Squat Rack', type: 'rack', photo: img(29), src: raw(29),
      cats: ['legs', 'chest', 'shoulders'], exerciseIds: ['goblet_squat'], confirm: true,
      note: 'Free-barbell station with safeties.' },
    { id: 'm_functional', name: 'Functional Trainer (cables)', type: 'cable', photo: img(19), src: raw(19),
      cats: ['chest', 'back', 'shoulders', 'arms', 'legs'],
      exerciseIds: ['cable_row', 'cable_curl', 'cable_pushdown', 'cable_lateral', 'cable_rear_delt', 'cable_kickback', 'cable_crunch', 'face_pull'],
      note: 'Dual adjustable pulleys — does almost anything.' },
    { id: 'm_crossover', name: 'Cable Crossover', type: 'cable', photo: img(20), src: raw(20),
      cats: ['chest', 'shoulders'], exerciseIds: ['cable_crossover', 'cable_rear_delt'] },
    { id: 'm_db_heavy', name: 'Dumbbells (heavy)', type: 'dumbbell', photo: img(22), src: raw(22),
      cats: ['chest', 'back', 'shoulders', 'arms', 'legs'],
      exerciseIds: ['db_bench', 'db_incline', 'db_shoulder_press', 'db_row', 'db_curl', 'hammer_curl', 'incline_db_curl', 'db_lateral', 'db_shrug', 'db_skullcrusher', 'db_rdl', 'goblet_squat', 'bulgarian_split', 'walking_lunge', 'russian_twist'] },
    { id: 'm_db_light', name: 'Dumbbells (light, colored)', type: 'dumbbell', photo: img(47), src: raw(47),
      cats: ['shoulders', 'arms'], exerciseIds: ['db_lateral', 'db_curl', 'hammer_curl'],
      note: 'Light hex dumbbells — perfect for lateral raises and curls.' },
    { id: 'm_fixed_bars', name: 'Fixed Barbells / EZ Bars', type: 'barbell', photo: img(21), src: raw(21),
      cats: ['arms', 'back'], exerciseIds: ['ez_curl'], note: 'Pre-loaded straight and EZ curl bars, 30–110 lb.' },
    { id: 'm_bench_flat', name: 'Flat / Olympic Bench', type: 'bench', photo: img(31), src: raw(31),
      cats: ['chest'], exerciseIds: ['db_bench', 'db_row'], note: 'Flat bench with barbell station.' },
    { id: 'm_bench_adj', name: 'Adjustable Bench', type: 'bench', photo: img(33), src: raw(33),
      cats: ['chest', 'shoulders', 'arms'], exerciseIds: ['db_incline', 'incline_db_curl', 'db_shoulder_press', 'db_skullcrusher'] },

    /* ---- CORE / CARDIO / ACCESSORIES ---- */
    { id: 'm_ab_bench', name: 'Ab / Core Bench & Mats', type: 'bodyweight', photo: img(17), src: raw(17),
      cats: ['abs'], exerciseIds: ['lying_leg_raise', 'plank', 'russian_twist', 'hanging_leg_raise'], confirm: true },
    { id: 'm_treadmill', name: 'Treadmills', type: 'cardio', photo: img(50), src: raw(50),
      cats: ['cardio'], exerciseIds: ['treadmill_steady', 'treadmill_interval'] },
    { id: 'm_elliptical', name: 'Ellipticals', type: 'cardio', photo: img(51), src: raw(51),
      cats: ['cardio'], exerciseIds: ['elliptical_steady'] },
    { id: 'm_bosu', name: 'BOSU Balls', type: 'accessory', photo: img(48), src: raw(48),
      cats: ['abs'], exerciseIds: ['plank'], note: 'Balance/core work.' },
    { id: 'm_rollers', name: 'Foam Rollers', type: 'accessory', photo: img(49), src: raw(49),
      cats: [], exerciseIds: [], note: 'Warm-up and recovery, not a lift.' },

    /* ---- additional machines from the remaining photos (verify names in the gym) ---- */
    { id: 'm_conv_press', name: 'Converging Chest Press', type: 'plate', photo: img(1), src: raw(1), cats: ['chest'], exerciseIds: ['pl_chest_press', 'pl_incline_press'], confirm: true },
    { id: 'm_pl_shoulder2', name: 'Plate Shoulder Press', type: 'plate', photo: img(4), src: raw(4), cats: ['shoulders'], exerciseIds: ['pl_shoulder_press'], confirm: true },
    { id: 'm_iso_incline', name: 'Iso-Lateral Incline Press', type: 'plate', photo: img(8), src: raw(8), cats: ['chest'], exerciseIds: ['pl_incline_press'], confirm: true },
    { id: 'm_row_rear', name: 'Seated Row / Rear Delt', type: 'plate', photo: img(10), src: raw(10), cats: ['back', 'shoulders'], exerciseIds: ['pl_low_row', 'rear_delt_machine'], confirm: true },
    { id: 'm_high_row', name: 'High Row / Pulldown', type: 'selectorized', photo: img(14), src: raw(14), cats: ['back'], exerciseIds: ['lat_pulldown', 'pl_high_row'], confirm: true },
    { id: 'm_seated_curl2', name: 'Seated Leg Curl (plate)', type: 'plate', photo: img(15), src: raw(15), cats: ['legs'], exerciseIds: ['seated_leg_curl'], confirm: true },
    { id: 'm_reardelt_pl', name: 'Rear Delt / Pec Deck (plate)', type: 'plate', photo: img(16), src: raw(16), cats: ['shoulders', 'chest'], exerciseIds: ['rear_delt_machine', 'pec_deck'], confirm: true },
    { id: 'm_rack2', name: 'Squat Rack / Smith', type: 'rack', photo: img(18), src: raw(18), cats: ['legs', 'chest'], exerciseIds: ['smith_squat', 'smith_bench', 'goblet_squat'], confirm: true },
    { id: 'm_legext_curl', name: 'Leg Extension / Curl', type: 'plate', photo: img(23), src: raw(23), cats: ['legs'], exerciseIds: ['leg_extension', 'seated_leg_curl'], confirm: true },
    { id: 'm_bench2', name: 'Adjustable Bench (2)', type: 'bench', photo: img(25), src: raw(25), cats: ['chest', 'arms'], exerciseIds: ['db_incline', 'db_bench', 'incline_db_curl'], confirm: true },
    { id: 'm_incline_silver', name: 'Incline Press (plate)', type: 'plate', photo: img(27), src: raw(27), cats: ['chest'], exerciseIds: ['pl_incline_press'], confirm: true },
    { id: 'm_cable_station', name: 'Functional Cable Station', type: 'cable', photo: img(35), src: raw(35), cats: ['back', 'arms', 'shoulders', 'chest'], exerciseIds: ['cable_row', 'cable_pushdown', 'cable_curl', 'cable_lateral', 'face_pull', 'straight_arm_pulldown'], confirm: true },
    { id: 'm_legext2', name: 'Leg Extension (selectorized)', type: 'selectorized', photo: img(39), src: raw(39), cats: ['legs'], exerciseIds: ['leg_extension'], confirm: true },
    { id: 'm_jungle', name: 'Cable Jungle (multi-station)', type: 'cable', photo: img(41), src: raw(41), cats: ['back', 'arms', 'chest'], exerciseIds: ['lat_pulldown', 'cable_row', 'cable_pushdown', 'cable_crossover'], confirm: true },
    { id: 'm_crossover2', name: 'Cable Crossover / Triceps', type: 'cable', photo: img(42), src: raw(42), cats: ['chest', 'arms'], exerciseIds: ['cable_crossover', 'cable_pushdown', 'face_pull'], confirm: true }
  ];
});
