import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COACH = require('../coach.js');
const L = require('../logic.js');
const APPSTATE = require('../data/state.js');
const PROGRAM = require('../data/program.js');
const EXERCISES = require('../data/exercises.js');
const DUMBBELLS = require('../data/dumbbells.js');
const HOME_EQUIPMENT = require('../data/equipment.js');
const EX = L.byId(EXERCISES);

function crunchEquipment() {
  const source = fs.readFileSync(path.join(root, 'data', 'crunch.js'), 'utf8');
  const context = { window: { DUMBBELL_EXERCISES: DUMBBELLS } };
  vm.createContext(context);
  vm.runInContext(source, context);
  return Array.from(context.window.CRUNCH_EQUIPMENT);
}

function session(date, exerciseId, weight, reps, rir = 2, extras = {}) {
  return [date, { day: extras.day || 'custom', gymId: extras.gymId || 'crunch', sessionDurationSec: extras.duration || 3000, exercises: [{ exId: exerciseId, sideSets: extras.sideSets, sets: reps.map((n) => ({ reps: n, weight, rir })) }] }];
}

function logOf(rows) { return Object.fromEntries(rows); }
function profile(goal = 'hypertrophy') { return { goal, preferences: { preferred: {}, avoided: {}, substitutionCounts: {}, skippedCounts: {} }, discomfort: {}, availableDumbbellsLb: [] }; }

test('simulation: beginner with no history enters calibration rather than receiving a fabricated load', () => {
  const rec = COACH.recommendLoad(EX.goblet_squat, [], [], { targetSets: 3 });
  assert.equal(rec.mode, 'calibrate');
  assert.equal(rec.confidence, 'Calibration phase');
});

test('simulation: intermediate with long history uses only recent meaningful exposures and strong-history language', () => {
  const rows = [];
  for (let i = 1; i <= 24; i++) rows.push(session(`2026-${String(Math.ceil(i / 4)).padStart(2, '0')}-${String((i % 4) * 6 + 1).padStart(2, '0')}`, 'db_bench', i < 20 ? 45 : 50, i < 23 ? [10, 10, 10] : [12, 12, 12], 2));
  const h = COACH.historyFor(logOf(rows), 'db_bench');
  const rec = COACH.recommendLoad(EX.db_bench, h, [45, 50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(h.length, 24);
  assert.equal(rec.mode, 'progress');
  assert.equal(rec.confidence, 'Strong history');
});

test('simulation: normal same-load progress is recognized without changing load early', () => {
  const log = logOf([
    session('2026-09-01', 'db_incline', 50, [10, 9, 9]),
    session('2026-09-08', 'db_incline', 50, [11, 10, 9]),
    session('2026-09-15', 'db_incline', 50, [12, 11, 10])
  ]);
  const trend = COACH.performanceTrend(COACH.historyFor(log, 'db_incline'));
  const rec = COACH.recommendLoad(EX.db_incline, COACH.historyFor(log, 'db_incline'), [45, 50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(trend.direction, 'improving');
  assert.equal(trend.totalRepChange, 5);
  assert.equal(rec.mode, 'hold');
});

test('simulation: one bad workout is not a plateau or reduction trigger', () => {
  const log = logOf([session('2026-09-01', 'db_row', 50, [12, 12, 12]), session('2026-09-08', 'db_row', 50, [7, 7, 6], 0)]);
  const h = COACH.historyFor(log, 'db_row');
  assert.notEqual(COACH.recommendLoad(EX.db_row, h, [45, 50, 55], { targetSets: 3, repRange: [8, 12] }).mode, 'reduce_suggested');
  assert.equal(COACH.plateauStatus(EX.db_row, h).plateau, false);
});

test('simulation: repeated poor workouts offer a smaller real dumbbell but do not apply it', () => {
  const log = logOf(['01', '08', '15'].map((day) => session(`2026-09-${day}`, 'db_row', 50, [7, 7, 6], 0)));
  const rec = COACH.recommendLoad(EX.db_row, COACH.historyFor(log, 'db_row'), [40, 45, 50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(rec.mode, 'reduce_suggested');
  assert.equal(rec.weight, 50);
  assert.equal(rec.suggestedWeight, 45);
});

test('simulation: low readiness trims only one late accessory set and leaves the main compound first', () => {
  const base = L.buildSession(PROGRAM.programs.push_pull_legs, EX, 'push', 90, {});
  const first = base.slots[0].exId;
  const before = base.slots.reduce((sum, slot) => sum + slot.sets, 0);
  const plan = COACH.enhanceWorkout(base, { EX, equipment: crunchEquipment(), profile: profile(), log: {}, readiness: { energy: 'low', soreness: 'high', sleep: 'poor' } });
  assert.equal(plan.slots[0].exId, first);
  assert.equal(plan.slots.reduce((sum, slot) => sum + slot.sets, 0), before - 1);
  assert.equal(plan.decisionLog.filter((decision) => decision.type === 'readiness_volume_adjustment').length, 1);
  assert.doesNotMatch(plan.readinessContext.explanation, /diagnos|overtrain/i);
});

test('simulation: high recent chest volume and little back work produce interpretable fatigue labels', () => {
  const log = logOf([
    session('2026-09-21', 'db_bench', 50, [10, 10, 10]),
    session('2026-09-22', 'db_incline', 40, [10, 10, 10])
  ]);
  const chest = COACH.fatigueLabel('chest', log, EX, '2026-09-23', 4);
  const back = COACH.fatigueLabel('lats', log, EX, '2026-09-23', 10);
  assert.equal(chest.label, 'High recent workload');
  assert.equal(back.label, 'Fresh');
  assert.match(chest.explanation, /not a medical measurement/);
});

test('simulation: machine-busy scoring preserves movement and role ahead of zone convenience', () => {
  const equipment = crunchEquipment();
  const ranked = COACH.rankedAlternatives(EX.pl_chest_press, ['db_bench', 'pushup', 'cable_crossover'], EX, equipment, profile(), {}, 'plate-loaded');
  assert.equal(ranked[0].exercise.pattern, EX.pl_chest_press.pattern);
  assert.equal(ranked[0].exercise.role, EX.pl_chest_press.role);
  assert.ok(ranked[0].score > ranked[ranked.length - 1].score);
});

test('simulation: switching gyms changes verified availability without deleting history', () => {
  const state = APPSTATE.defaultState();
  const row = session('2026-09-01', 'db_bench', 40, [10, 10, 10]);
  state.workoutLogs[row[0]] = row[1];
  state.config.gymId = 'crunch';
  const crunchState = APPSTATE.normalize(state);
  crunchState.config.gymId = 'home';
  const homeState = APPSTATE.normalize(crunchState);
  assert.equal(homeState.config.gymId, 'home');
  assert.deepEqual(homeState.workoutLogs, state.workoutLogs);
  assert.ok(crunchEquipment().some((item) => item.exerciseIds.includes('db_bench')));
  assert.ok(HOME_EQUIPMENT.some((item) => item.exerciseIds.includes('db_bench')));
});

test('simulation: an unknown rack is reported instead of inventing inventory', () => {
  const h = COACH.historyFor(logOf([session('2026-09-01', 'db_curl', 20, [12, 12, 12]), session('2026-09-08', 'db_curl', 20, [12, 12, 12])]), 'db_curl');
  const rec = COACH.recommendLoad(EX.db_curl, h, [], { targetSets: 3, repRange: [8, 12] });
  assert.equal(rec.rackKnown, false);
  assert.match(rec.reason, /rack is not recorded/);
});

test('simulation: a large relative rack jump requires repeated clean confirmation', () => {
  const one = COACH.historyFor(logOf([session('2026-09-01', 'db_lateral', 20, [20, 20, 20], 2)]), 'db_lateral');
  const two = COACH.historyFor(logOf([session('2026-09-01', 'db_lateral', 20, [20, 20, 20], 2), session('2026-09-08', 'db_lateral', 20, [20, 20, 20], 2)]), 'db_lateral');
  assert.equal(COACH.recommendLoad(EX.db_lateral, one, [20, 25], { targetSets: 3, repRange: [12, 20] }).mode, 'hold');
  assert.equal(COACH.recommendLoad(EX.db_lateral, two, [20, 25], { targetSets: 3, repRange: [12, 20] }).mode, 'progress');
});

test('simulation: repeated unilateral difference is described, not diagnosed', () => {
  const paired = (l, r) => ({ sideSets: { left: [{ reps: l }], right: [{ reps: r }] } });
  const signal = COACH.unilateralSignal([paired(8, 10), paired(9, 10), paired(8, 9)]);
  assert.equal(signal.side, 'left');
  assert.doesNotMatch(signal.message, /injury|disease|diagnos/i);
});

test('simulation: short and long sessions stay within selected program and keep compounds first', () => {
  for (const minutes of [30, 90]) {
    const built = L.buildSession(PROGRAM.programs.upper_lower, EX, 'upper_a', minutes, {});
    assert.ok(built.estMin <= minutes + 1);
    assert.equal(built.slots[0].role, 'compound');
    assert.ok(built.slots.every((slot) => PROGRAM.programs.upper_lower.days.upper_a.slots.some((planned) => planned.ex === slot.exId)));
  }
});

test('simulation: missing RIR lowers evidence quality but does not block well-confirmed progression', () => {
  const log = logOf([
    ['2026-09-01', { exercises: [{ exId: 'db_bench', sets: [12, 12, 12].map((reps) => ({ reps, weight: 50 })) }] }],
    ['2026-09-08', { exercises: [{ exId: 'db_bench', sets: [12, 12, 12].map((reps) => ({ reps, weight: 50 })) }] }]
  ]);
  const rec = COACH.recommendLoad(EX.db_bench, COACH.historyFor(log, 'db_bench'), [50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(rec.mode, 'progress');
  assert.notEqual(rec.confidence, 'Calibration phase');
});

test('simulation: entered RIR prevents progression when top reps were reached at failure', () => {
  const log = logOf([session('2026-09-01', 'db_bench', 50, [12, 12, 12], 0), session('2026-09-08', 'db_bench', 50, [12, 12, 12], 0)]);
  assert.equal(COACH.recommendLoad(EX.db_bench, COACH.historyFor(log, 'db_bench'), [50, 55], { targetSets: 3, repRange: [8, 12] }).mode, 'hold');
});

test('simulation: avoided and uncomfortable exercises cannot be auto-selected', () => {
  const p = profile();
  p.preferences.avoided.db_bench = true;
  p.discomfort.db_floor_press = true;
  const ranked = COACH.rankedAlternatives(EX.pl_chest_press, ['db_bench', 'db_floor_press', 'pushup'], EX, crunchEquipment(), p, {}, 'free-weights');
  assert.deepEqual(ranked.map((item) => item.exercise.id), ['pushup']);
});

test('simulation: unverified Crunch equipment never enters selection', () => {
  const manual = crunchEquipment().filter((item) => item.autoEligible === false);
  assert.ok(manual.length);
  assert.ok(manual.every((item) => item.exerciseIds.length === 0));
});

test('simulation: goal changes preserve all workout history and settings', () => {
  const state = APPSTATE.defaultState();
  state.workoutLogs = logOf([session('2026-09-01', 'db_bench', 50, [10, 10, 9])]);
  state.machineSettings.machine = 'seat 4';
  state.trainingProfile.goal = 'general_fitness';
  const next = APPSTATE.normalize(state);
  assert.equal(next.trainingProfile.goal, 'general_fitness');
  assert.deepEqual(next.workoutLogs, state.workoutLogs);
  assert.equal(next.machineSettings.machine, 'seat 4');
});

test('simulation: duration estimates learn from same-day history and communicate confidence', () => {
  const base = { dayId: 'pull', name: 'Pull', estMin: 60 };
  const log = {
    a: { day: 'pull', sessionDurationSec: 3000 },
    b: { day: 'pull', sessionDurationSec: 3300 },
    c: { day: 'pull', sessionDurationSec: 3420 },
    d: { day: 'push', sessionDurationSec: 1200 }
  };
  const result = COACH.estimateDuration(base, log);
  assert.equal(result.minutes, 54);
  assert.equal(result.confidence, 'Strong history');
  assert.match(result.reason, /3 recent Pull sessions/);
});

test('simulation: compound warm-ups scale with load while isolation work avoids elaborate ramps', () => {
  const heavy = COACH.warmupPlan(EX.db_bench, 80, { exerciseIndex: 0 });
  const later = COACH.warmupPlan(EX.db_row, 50, { exerciseIndex: 3 });
  const lateral = COACH.warmupPlan(EX.db_lateral, 20, { exerciseIndex: 0 });
  assert.equal(heavy.length, 3);
  assert.equal(later.length, 1);
  assert.equal(lateral.length, 0);
  assert.ok(heavy.every((set) => set.kind === 'warmup'));
});

test('simulation: live advice separates a rest problem from a load problem', () => {
  const advice = COACH.liveSetAdvice(EX.db_row, { repRange: [8, 12], sets: 3 }, [{ reps: 12, rir: 2 }, { reps: 8, rir: 1 }], 60);
  assert.equal(advice.action, 'rest_longer');
  assert.match(advice.message, /60–90 seconds/);
});

test('simulation: preference learning remains reversible and skips carry a bounded penalty', () => {
  const p = profile();
  p.preferences.substitutionCounts['pl_chest_press>db_bench'] = 4;
  p.preferences.skippedCounts.db_floor_press = 20;
  const ranked = COACH.rankedAlternatives(EX.pl_chest_press, ['db_bench', 'db_floor_press'], EX, crunchEquipment(), p, {}, 'free-weights');
  assert.equal(ranked[0].exercise.id, 'db_bench');
  assert.ok(ranked.find((item) => item.exercise.id === 'db_floor_press'), 'skipped movement is down-ranked, not permanently deleted');
});
