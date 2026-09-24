import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = require('../logic.js');
const MUSCLES = require('../data/muscles.js');
const EXERCISES = require('../data/exercises.js');
const HANDBOOK = require('../data/handbook.js');
const EQUIPMENT = require('../data/equipment.js');
const PROGRAM = require('../data/program.js');
const DEMOS = require('../data/demos.js');
const APPSTATE = require('../data/state.js');
const HOWTO = require('../howto.js');
const EX = L.byId(EXERCISES);

function guideForPhoto(number) {
  const filename = number === 0 ? 'Gym equipment.jpeg' : `Gym equipment ${number}.jpeg`;
  return HANDBOOK.filter((guide) => guide.photos.some((photo) => photo.filename === filename));
}
function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem: (key) => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
    dump: () => ({ ...data })
  };
}

test('inventory: exactly 45 verified guides and 51 unique source photographs', () => {
  const photos = HANDBOOK.flatMap((guide) => guide.photos.map((photo) => photo.filename));
  assert.equal(HANDBOOK.length, 45);
  assert.equal(EQUIPMENT.length, 45);
  assert.equal(new Set(photos).size, 51);
  assert.equal(HANDBOOK.flatMap((guide) => guide.photos).filter((photo) => photo.crossReference).length, 4);
  const expected = new Set(['Gym equipment.jpeg', ...Array.from({ length: 50 }, (_, i) => `Gym equipment ${i + 2}.jpeg`)]);
  assert.deepEqual(new Set(photos), expected);
});

test('inventory: all 51 original and WebP assets exist', () => {
  const rawArchivePresent = fs.existsSync(path.join(root, 'GYM'));
  for (const number of [0, ...Array.from({ length: 50 }, (_, i) => i + 2)]) {
    const filename = number === 0 ? 'Gym equipment.jpeg' : `Gym equipment ${number}.jpeg`;
    const webNumber = number === 0 ? 1 : number;
    if (rawArchivePresent) assert.ok(fs.existsSync(path.join(root, 'GYM', filename)), filename);
    assert.ok(fs.existsSync(path.join(root, 'assets', 'equipment', `eq${webNumber}.webp`)), `eq${webNumber}.webp`);
  }
});

test('critical identity corrections are exact and conservative', () => {
  assert.equal(guideForPhoto(3)[0].identity, 'Plate-Loaded Lat Pulldown');
  assert.equal(guideForPhoto(4)[0].identity, 'Plate-Loaded Decline Press');
  assert.equal(guideForPhoto(9)[0].identity, 'Matrix Glute Trainer');
  assert.equal(guideForPhoto(12)[0].identity, 'Plate-Loaded Lying Leg Curl');
  assert.deepEqual(guideForPhoto(44).map((g) => g.identity), ['Hip Adduction Machine']);
  assert.deepEqual(guideForPhoto(45).map((g) => g.identity), ['Hip Adduction Machine']);
  assert.deepEqual(guideForPhoto(50).map((g) => g.identity), ['Technogym Excite Top Upper-Body Ergometer', 'Recumbent Exercise Bikes']);
  assert.deepEqual(guideForPhoto(51).map((g) => g.identity), ['Treadmills']);
});

test('unsupported StepMill, elliptical and hip-abduction catalog claims are absent', () => {
  const claims = HANDBOOK.map((g) => `${g.identity} ${g.linkedExerciseIds.join(' ')}`).join(' ').toLowerCase();
  assert.doesNotMatch(claims, /stepmill|elliptical|hip[_ ]abduction/);
});

test('alternate views are grouped in their verified guide', () => {
  const expectedGroups = [[5, 8], [34, 46], [36, 37], [26, 27], [44, 45], [29, 30], [19, 20]];
  expectedGroups.forEach((numbers) => {
    const owner = HANDBOOK.find((guide) => numbers.every((number) => guide.photos.some((photo) => photo.filename === `Gym equipment ${number}.jpeg`)));
    assert.ok(owner, `missing grouped views ${numbers.join('/')}`);
  });
});

test('every guide has the complete HandbookGuide interface and positioned callouts', () => {
  const required = ['identity', 'category', 'photos', 'evidence', 'muscles', 'adjustmentsAndChecks', 'execution', 'callouts', 'safety', 'programming', 'progression', 'sources', 'linkedExerciseIds'];
  HANDBOOK.forEach((guide) => {
    required.forEach((key) => assert.ok(guide[key] != null, `${guide.id} missing ${key}`));
    assert.ok(guide.adjustmentsAndChecks.length >= 3);
    assert.ok(guide.execution.length >= 4);
    assert.ok(guide.mistakes.length >= 3);
    assert.equal(guide.callouts.length, 4);
    guide.callouts.forEach((callout) => {
      assert.ok(callout.x > 0 && callout.x < 100 && callout.y > 0 && callout.y < 100);
      assert.ok(callout.label.length > 2);
    });
  });
});

test('handbook category colors match the editorial system', () => {
  const colors = { Push: '#C74B50', Pull: '#2E6FA7', Legs: '#2E8555', Core: '#7356A5', 'Full Body': '#C67A24', Cardio: '#16889E' };
  HANDBOOK.forEach((guide) => assert.equal(guide.categoryColor, colors[guide.category]));
});

test('guide, equipment and program exercise references are valid and available', () => {
  HANDBOOK.forEach((guide) => guide.linkedExerciseIds.forEach((id) => assert.ok(EX[id], `${guide.id} -> ${id}`)));
  EQUIPMENT.forEach((item) => item.exerciseIds.forEach((id) => assert.ok(EX[id], `${item.id} -> ${id}`)));
  Object.values(PROGRAM.programs).forEach((program) => program.cycle.forEach((dayId) => {
    assert.ok(program.days[dayId]);
    program.days[dayId].slots.forEach((slot) => {
      assert.ok(EX[slot.ex], `${program.id}/${dayId} -> ${slot.ex}`);
      assert.equal(EX[slot.ex].deprecated, false, `${slot.ex} must not be deprecated`);
      slot.alt.forEach((id) => assert.ok(EX[id], `${program.id}/${dayId} alt -> ${id}`));
    });
  }));
});

test('deprecated definitions remain hidden but renderable for V1 history', () => {
  ['sel_chest_press', 'sel_shoulder_press', 'hack_squat', 'hip_abduction', 'seated_calf', 'elliptical_steady', 'ab_crunch_machine', 'sel_seated_row'].forEach((id) => {
    assert.ok(EX[id]);
    assert.equal(EX[id].availability, false);
    assert.equal(EX[id].deprecated, true);
  });
});

test('all exercise muscles and versioned load semantics are valid', () => {
  const muscles = new Set(MUSCLES.map((m) => m.id));
  const modes = new Set(['perSide', 'perHand', 'stack', 'assistance', 'total', 'bodyweight', 'duration']);
  EXERCISES.forEach((exercise) => {
    [...exercise.primary, ...exercise.secondary].forEach((m) => assert.ok(muscles.has(m), `${exercise.id} -> ${m}`));
    assert.equal(exercise.schemaVersion, 2);
    assert.ok(modes.has(exercise.loadMode), `${exercise.id} load mode`);
    assert.deepEqual(exercise.prescription.repRange, exercise.repRange);
  });
});

test('every declared two-frame demonstration asset exists', () => {
  Object.keys(DEMOS).forEach((id) => {
    assert.ok(EX[id], `demo has unknown exercise ${id}`);
    if (DEMOS[id] === 'svg') {
      assert.match(HOWTO.howtoSVG(EX[id], 'right'), /<svg/);
    } else {
      assert.ok(fs.existsSync(path.join(root, 'assets', 'demos', `${id}_0.webp`)));
      assert.ok(fs.existsSync(path.join(root, 'assets', 'demos', `${id}_1.webp`)));
    }
  });
});

test('program recommendation respects experience and realistic weekly frequency', () => {
  assert.equal(PROGRAM.recommend('beginner', 2), 'beginner_full_body');
  assert.equal(PROGRAM.recommend('beginner', 3), 'beginner_full_body');
  assert.equal(PROGRAM.recommend('intermediate', 3), 'push_pull_legs');
  assert.equal(PROGRAM.recommend('beginner', 4), 'upper_lower');
  assert.equal(PROGRAM.recommend('intermediate', 4), 'intermediate_four_day');
  // 5-7 days/week routes to Push/Pull/Legs (rotates cleanly at high frequency).
  assert.equal(PROGRAM.recommend('beginner', 5), 'push_pull_legs');
  assert.equal(PROGRAM.recommend('intermediate', 6), 'push_pull_legs');
  assert.equal(PROGRAM.recommend('beginner', 7), 'push_pull_legs');
  assert.ok([3, 5, 6, 7].every((n) => PROGRAM.programs.push_pull_legs.sessionsPerRotation.includes(n)));
});

test('time fitting supports 20–120 minutes and never leaves the selected program', () => {
  const budgets = [20, 30, 45, 60, 90, 120];
  Object.values(PROGRAM.programs).forEach((program) => program.cycle.forEach((dayId) => {
    const allowed = new Set(program.days[dayId].slots.map((slot) => slot.ex));
    const sessions = budgets.map((minutes) => L.buildSession(program, EX, dayId, minutes, {}));
    sessions.forEach((session, index) => {
      assert.ok(session.estMin <= budgets[index] + 1, `${program.id}/${dayId}/${budgets[index]} -> ${session.estMin}`);
      assert.ok(session.slots.length >= 2);
      session.slots.forEach((slot) => assert.ok(allowed.has(slot.exId), `${slot.exId} escaped selected day`));
    });
    const sets = sessions.map((session) => session.slots.reduce((n, slot) => n + slot.sets, 0));
    for (let i = 1; i < sets.length; i++) assert.ok(sets[i] >= sets[i - 1]);
  }));
});

test('spare session time never inflates the selected program volume', () => {
  Object.values(PROGRAM.programs).forEach((program) => program.cycle.forEach((dayId) => {
    const day = program.days[dayId];
    const built = L.buildSession(program, EX, dayId, 120, { undertrained: day.focusMuscles });
    assert.deepEqual(built.slots.map((slot) => slot.exId), day.slots.map((slot) => slot.ex));
    built.slots.forEach((slot) => {
      const planned = day.slots.find((item) => item.ex === slot.exId);
      assert.equal(slot.sets, planned.sets, `${program.id}/${dayId}/${slot.exId}`);
      assert.equal(slot.bonus, undefined);
    });
  }));
});

test('handbook ramp-up sets are generated without counting as working sets', () => {
  const ramps = L.rampSets(PROGRAM.programs.beginner_full_body, 100);
  assert.deepEqual(ramps.map((r) => [r.kind, r.targetReps, r.weight]), [['warmup', 8, 40], ['warmup', 5, 65]]);
});

test('busy-machine alternatives are valid, available and actually present in this gym', () => {
  const program = PROGRAM.programs.push_pull_legs;
  const slot = program.days.push.slots[0];
  const alternatives = L.busyAlternatives(slot, EX, EQUIPMENT);
  assert.ok(alternatives.length >= 1);
  alternatives.forEach((exercise) => {
    assert.equal(exercise.availability, true);
    assert.ok(L.machinesForExercise(exercise.id, EQUIPMENT).length >= 1);
  });
});

test('double progression respects RIR and assistance moves in the correct direction', () => {
  const press = EX.pl_incline_press;
  assert.equal(L.prescribe(press, { lastWeight: 45, lastSetsReps: [10, 10, 10], lastRIR: 2, missStreak: 0 }).weight, 50);
  assert.equal(L.prescribe(press, { lastWeight: 45, lastSetsReps: [10, 10, 10], lastRIR: 0, missStreak: 0 }).mode, 'hold');
  const assistance = EX.assisted_pullup;
  const next = L.prescribe(assistance, { lastWeight: 80, lastSetsReps: [10, 10, 10], lastRIR: 2, missStreak: 0 });
  assert.equal(next.mode, 'progress');
  assert.equal(next.weight, 70, 'less assistance is progression');
});

test('one bad workout never auto-deloads; repeated misses only suggest a user-approved reduction', () => {
  const exercise = EX.pl_incline_press;
  assert.equal(L.prescribe(exercise, { lastWeight: 50, lastSetsReps: [5, 5, 5], missStreak: 1 }).mode, 'hold');
  const suggestion = L.prescribe(exercise, { lastWeight: 50, lastSetsReps: [5, 5, 5], missStreak: 2 });
  assert.equal(suggestion.mode, 'reduce_suggested');
  assert.equal(suggestion.weight, 50);
  assert.equal(suggestion.suggestedWeight, 45);
  assert.equal(L.acceptReduction(suggestion).weight, 45);
});

test('updateLift records optional RIR, performance and repeated-miss state', () => {
  const exercise = EX.pl_incline_press;
  const first = L.updateLift(null, exercise, [{ reps: 5, weight: 50, rir: 1 }]);
  const second = L.updateLift(first, exercise, [{ reps: 5, weight: 50, rir: 0 }]);
  assert.equal(first.missStreak, 1);
  assert.equal(second.missStreak, 2);
  assert.equal(second.lastRIR, 0);
  assert.ok(second.bestE1RM > 50);
});

test('weekly consistency is based on selected schedule, not consecutive-day pressure', () => {
  const log = {
    '2026-07-27': { day: 'full_a', exercises: [{ exId: 'leg_press', sets: [{ reps: 10, weight: 100 }] }] },
    '2026-07-29': { day: 'full_b', exercises: [{ exId: 'pl_chest_press', sets: [{ reps: 8, weight: 40 }] }] },
    '2026-07-31': { day: 'full_a', exercises: [{ exId: 'pl_lat_pulldown', sets: [{ reps: 10, weight: 40 }] }] }
  };
  const result = L.weeklyConsistency(log, '2026-07-31', 3);
  assert.equal(result.completed, 3);
  assert.equal(result.target, 3);
  assert.equal(result.met, true);
});

test('unit conversion is stable across display and storage semantics', () => {
  assert.ok(Math.abs(L.kgToLb(L.lbToKg(100)) - 100) < 1e-9);
  assert.equal(L.toDisplay(100, 'lb'), 100);
  assert.equal(L.toDisplay(100, 'kg'), 45.5);
  assert.ok(L.fromInput('45', 'kg') > 99 && L.fromInput('45', 'kg') < 100);
});

test('V1 local-storage migration preserves logs, lift history, settings and nicknames', () => {
  const legacyLog = { '2026-07-30': { day: 'push', exercises: [{ exId: 'hack_squat', sets: [{ reps: 8, weight: 100 }] }] } };
  const storage = memoryStorage({
    'muscles-config': JSON.stringify({ name: 'R', units: 'kg', onboarded: true, start: '2026-01-01' }),
    'muscles-plan': JSON.stringify({ cycleIndex: 4, sessionCount: 9 }),
    'muscles-lifts': JSON.stringify({ hack_squat: { lastWeight: 100 } }),
    'muscles-log': JSON.stringify(legacyLog),
    'muscles-eqnames': JSON.stringify({ legacy_machine: 'My station' })
  });
  const result = APPSTATE.migrate(storage);
  assert.equal(result.migrated, true);
  assert.equal(result.state.schemaVersion, 2);
  assert.deepEqual(result.state.workoutLogs, legacyLog);
  assert.equal(result.state.liftHistory.hack_squat.lastWeight, 100);
  assert.equal(result.state.customLabels.legacy_machine, 'My station');
  assert.ok(storage.getItem(APPSTATE.KEY));
});

test('validated backup import summarizes and replaces only after validation', () => {
  const storage = memoryStorage();
  const state = APPSTATE.defaultState();
  state.config.onboarded = true;
  state.workoutLogs['2026-07-31'] = { day: 'full_a', exercises: [] };
  const parsed = APPSTATE.parseBackup(APPSTATE.exportBackup(state));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.summary.workoutDays, 1);
  assert.equal(APPSTATE.replaceFromBackup(storage, parsed).ok, true);
  assert.ok(storage.getItem(APPSTATE.KEY));
});

test('invalid and future-version backups are rejected without changing current state', () => {
  const original = APPSTATE.defaultState();
  const storage = memoryStorage({ [APPSTATE.KEY]: JSON.stringify(original) });
  const before = storage.getItem(APPSTATE.KEY);
  const invalid = APPSTATE.parseBackup('{broken');
  assert.equal(invalid.ok, false);
  assert.equal(APPSTATE.replaceFromBackup(storage, invalid).ok, false);
  const future = { ...original, schemaVersion: 999 };
  assert.equal(APPSTATE.validateBackup(future).ok, false);
  assert.equal(storage.getItem(APPSTATE.KEY), before);
});

test('program changes preserve normalized workout history', () => {
  const state = APPSTATE.defaultState();
  state.workoutLogs['2026-07-31'] = { day: 'full_a', exercises: [] };
  state.selectedProgram = 'upper_lower';
  state.config.programId = 'upper_lower';
  const normalized = APPSTATE.normalize(state);
  assert.equal(normalized.selectedProgram, 'upper_lower');
  assert.ok(normalized.workoutLogs['2026-07-31']);
});

test('service worker precaches the complete verified shell and uses update-safe HTML handling', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /length:\s*51/);
  assert.match(sw, /data\/handbook\.js/);
  assert.match(sw, /data\/state\.js/);
  assert.match(sw, /howto\.js/);
  assert.match(sw, /networkFirst\(event\.request, 'index\.html'\)/);
  assert.match(sw, /SKIP_WAITING/);
  assert.doesNotMatch(sw, /muscles-v1/);
});

test('exercise demonstrations use equipment-specific instructions for corrected cardio and hip guides', () => {
  const upperErg = EX.upper_body_ergometer;
  const recumbent = EX.recumbent_bike;
  const adduction = EX.hip_adduction;
  assert.match(HOWTO.steps(upperErg).join(' '), /crank|circles/i);
  assert.match(HOWTO.steps(recumbent).join(' '), /seat|pedal/i);
  assert.match(HOWTO.steps(adduction).join(' '), /pads together|starting width/i);
  assert.match(HOWTO.howtoSVG(upperErg, 'right'), /how to perform this exercise/);
  assert.doesNotMatch(HOWTO.steps(upperErg).join(' '), /incline|treadmill/i);
});

test('interactive app actions use semantic controls instead of clickable generic elements', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.doesNotMatch(app, /<(?:div|span|li|article)\b[^>]*\bdata-action=/i);
});

test('theme and weekly training-day controls remain available after onboarding', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /id="theme-toggle"[^>]*data-action="toggle-theme"/);
  assert.match(app, /data-action="set-frequency"/);
  assert.match(app, /\[2, 3, 4, 5, 6, 7\]/); // 2–7 training days selectable
  assert.match(app, /history preserved/);
});

test('daily gym confirmation is additive state and never removes workout history', () => {
  const state = APPSTATE.defaultState();
  state.config.gymId = 'crunch';
  state.config.gymConfirmedOn = '2026-09-23';
  state.workoutLogs['2026-09-22'] = { gymId: 'home', exercises: [{ exId: 'db_bench' }] };
  const normalized = APPSTATE.normalize(state);
  assert.equal(normalized.config.gymId, 'crunch');
  assert.equal(normalized.config.gymConfirmedOn, '2026-09-23');
  assert.deepEqual(normalized.workoutLogs, state.workoutLogs);
  state.config.gymConfirmedOn = 'not-a-date';
  assert.equal(APPSTATE.normalize(state).config.gymConfirmedOn, '');
});

test('first-page gym gate scopes the exercise browser and exposes Crunch orange mode', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(app, /Which gym are you at today\?/);
  assert.match(app, /gymChoiceCards\('select-daily-gym'\)/);
  assert.match(app, /cfg\.gymConfirmedOn = todayISO\(\)/);
  assert.match(app, /return typeMatch && familyMatch[^;]+&& available\[ex\.id\]/);
  assert.match(html, /html\[data-gym="crunch"\]/);
  assert.match(html, /--ember:#F58220/);
  assert.match(app, /Everything shown below is available at this gym/);
});

test('solo coach assigns a verified station from route and history while partner mode retains manual choice', () => {
  const equipment = [
    { id: 'press-a', name: 'Press A', exerciseIds: ['sel_chest_press'], verified: true, autoEligible: true, zoneId: 'selectorized' },
    { id: 'press-b', name: 'Press B', exerciseIds: ['sel_chest_press'], verified: true, autoEligible: true, zoneId: 'upstairs' },
    { id: 'press-manual', name: 'Uncertain press', exerciseIds: ['sel_chest_press'], verified: false, autoEligible: false, zoneId: 'selectorized' }
  ];
  const log = {
    '2026-09-20': { exercises: [{ exId: 'sel_chest_press', machineId: 'press-b' }] },
    '2026-09-22': { exercises: [{ exId: 'sel_chest_press', machineId: 'press-a' }] }
  };
  const continuity = L.selectEquipmentForExercise('sel_chest_press', equipment, log, 'selectorized');
  assert.equal(continuity.machine.id, 'press-a');
  assert.match(continuity.reason, /most recent logged session/i);
  const routed = L.selectEquipmentForExercise('sel_chest_press', equipment, log, 'upstairs');
  assert.equal(routed.machine.id, 'press-b');
  assert.notEqual(routed.machine.id, 'press-manual');

  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /Coach chose your equipment/);
  assert.match(app, /machines\.length && isPartner/);
  assert.match(app, /SESSION\.mode !== 'partner'/);
  assert.match(app, /partner_equipment_selected/);
  assert.match(app, /Crunch route map · current stop highlighted/);
  assert.match(app, /machineChoiceReason/);
});

test('partner-led sessions include an explicit two-hour option and preserve that budget', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /\[30, 45, 60, 90, 120\]/);
  assert.match(app, /m === 120 \? '2 hours'/);
  const custom = L.buildCustom(['db_bench', 'db_row'], EX, 120, 'Partner session');
  assert.equal(custom.mode, 'partner');
  assert.equal(custom.budgetMin, 120);
});

test('guided load test identifies a suitable load without guessing and respects assistance semantics', () => {
  const rack = [35, 40, 45, 50, 55];
  const right = L.assessLoadTest(EX.db_bench, { load: 45, reps: 10, rir: 2, clean: true, pain: false }, { availableDumbbellsLb: rack });
  assert.equal(right.accepted, true);
  assert.equal(right.verdict, 'right');
  assert.equal(right.load, 45);

  const heavy = L.assessLoadTest(EX.db_bench, { load: 50, reps: 6, rir: 0, clean: true, pain: false }, { availableDumbbellsLb: rack });
  assert.equal(heavy.verdict, 'too_heavy');
  assert.equal(heavy.suggestedLoad, 45);

  const light = L.assessLoadTest(EX.db_bench, { load: 45, reps: 14, rir: 4, clean: true, pain: false }, { availableDumbbellsLb: rack });
  assert.equal(light.verdict, 'too_light');
  assert.equal(light.suggestedLoad, 50);

  const assistedTooHard = L.assessLoadTest(EX.assisted_pullup, { load: 70, reps: 4, rir: 0, clean: false, pain: false });
  assert.equal(assistedTooHard.verdict, 'too_heavy');
  assert.equal(assistedTooHard.suggestedLoad, 80, 'more selected assistance should make the next test easier');

  const pain = L.assessLoadTest(EX.db_bench, { load: 40, reps: 5, rir: 3, clean: true, pain: true }, { availableDumbbellsLb: rack });
  assert.equal(pain.verdict, 'stop');
  assert.equal(pain.suggestedLoad, null);
});

test('load-test UI records attempts separately and fills working sets only after acceptance', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /Guided load test · not a working set/);
  assert.match(app, /data-action="evaluate-load-test"/);
  assert.match(app, /type: 'load_calibrated'/);
  assert.match(app, /loadTests: \(s\.loadTests \|\| \[\]\)\.slice\(\)/);
  assert.match(app, /setItem\.kind !== 'warmup'/);
});

test('installed app exposes explicit update checking and a new versioned cache', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(app, /data-action="check-update"/);
  assert.match(html, /window\.MUSCLES_UPDATES/);
  assert.match(html, /reg\.update\(\)/);
  assert.match(html, /visibilitychange/);
  assert.match(sw, /2026-09-24-r16/);
});

test('motion guide has detailed phases and an exercise-specific plank-drag view', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const svg = HOWTO.howtoSVG(EX.db_plank_drag, 'right');
  assert.match(app, /Set up before the first rep/);
  assert.match(app, /Perform one clean rep/);
  assert.match(app, /Range/);
  assert.match(app, /Breathing/);
  assert.match(app, /Tempo/);
  assert.match(svg, /Top view of a wide high plank/);
  assert.match(svg, /values="70,108;118,108/);
  assert.match(svg, /var\(--ember\)/);
});
