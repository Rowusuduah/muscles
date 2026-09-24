import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const COACH = require('../coach.js');
const L = require('../logic.js');
const EXERCISES = require('../data/exercises.js');
const PROGRAM = require('../data/program.js');
const EX = L.byId(EXERCISES);

function history(weight, sessions, reps = [12, 12, 12], rir = 2) {
  return Array.from({ length: sessions }, (_, index) => ({
    date: `2026-09-${String(10 + index).padStart(2, '0')}`,
    weight,
    reps: reps.slice(),
    totalReps: reps.reduce((sum, n) => sum + n, 0),
    avgReps: reps.reduce((sum, n) => sum + n, 0) / reps.length,
    bestSet: Math.max(...reps),
    avgRIR: rir,
    minRIR: rir,
    volume: reps.reduce((sum, n) => sum + n * weight, 0),
    sets: reps.map((n) => ({ reps: n, weight, rir }))
  }));
}

test('new exercise calibration never invents a universal starting weight', () => {
  const result = COACH.recommendLoad(EX.db_bench, [], [], { targetSets: 3, repRange: [8, 12] });
  assert.equal(result.mode, 'calibrate');
  assert.equal(result.weight, null);
  assert.match(result.note, /2–3 clean repetitions in reserve/i);
  assert.match(result.reason, /no starting load was invented/i);
});

test('double progression requires complete repeated sets before using the next real rack increment', () => {
  const rack = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const result = COACH.recommendLoad(EX.db_bench, history(50, 2), rack, { targetSets: 3, repRange: [8, 12] });
  assert.equal(result.mode, 'progress');
  assert.equal(result.weight, 55);
  assert.equal(result.rackKnown, true);
});

test('one lucky top set or one top session does not trigger a load increase', () => {
  const rack = [45, 50, 55];
  const partial = history(50, 2, [12, 10, 9]);
  assert.equal(COACH.recommendLoad(EX.db_bench, partial, rack, { targetSets: 3, repRange: [8, 12] }).mode, 'hold');
  assert.equal(COACH.recommendLoad(EX.db_bench, history(50, 1), rack, { targetSets: 3, repRange: [8, 12] }).mode, 'hold');
});

test('repeated below-range sessions only suggest a reversible reduction', () => {
  const misses = history(50, 3, [7, 6, 6], 0);
  const result = COACH.recommendLoad(EX.db_bench, misses, [40, 45, 50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(result.mode, 'reduce_suggested');
  assert.equal(result.weight, 50);
  assert.equal(result.suggestedWeight, 45);
  assert.match(result.reason, /Three consecutive/);
});

test('progression holds after incomplete sets and gives a session-total rep target', () => {
  const result = COACH.recommendLoad(EX.db_incline, history(50, 3, [12, 12, 11]), [45, 50, 55], { targetSets: 3, repRange: [8, 12] });
  assert.equal(result.mode, 'hold');
  assert.equal(result.weight, 50);
  assert.match(result.note, /total clean reps/);
});

test('weighted volume counts primary work fully and secondary contribution conservatively', () => {
  const log = { '2026-09-22': { exercises: [{ exId: 'db_bench', sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }, { reps: 10, weight: 50 }] }] } };
  const volume = COACH.weightedVolume(log, EX, '2026-09-23', 7);
  assert.equal(volume.chest.sets, 3);
  assert.equal(volume.triceps.sets, 1.5);
  assert.equal(volume.front_delts.sets, 1.5);
  assert.equal(volume.chest.volume, 1500);
  assert.equal(volume.triceps.volume, 750);
});

test('readiness changes are conservative and preserve priority work', () => {
  const low = COACH.readinessAdjustment({ energy: 'low', soreness: 'high', sleep: 'poor' }, 0);
  const normal = COACH.readinessAdjustment({ energy: 'normal', soreness: 'mild', sleep: 'okay' }, 0);
  assert.equal(low.action, 'trim_accessory');
  assert.equal(low.targetRIRAdd, 1);
  assert.equal(normal.action, 'normal');
});

test('goal emphasis changes target ranges and rest while preserving exercise order', () => {
  const base = L.buildSession(PROGRAM.programs.beginner_full_body, EX, 'full_a', 60, {});
  const originalIds = base.slots.map((slot) => slot.exId);
  const equipment = originalIds.map((id, index) => ({ id: `eq-${index}`, autoEligible: true, zoneId: index < 3 ? 'first' : 'second', exerciseIds: [id] }));
  const enhanced = COACH.enhanceWorkout(base, { EX, equipment, profile: { goal: 'general_fitness', preferences: { preferred: {}, avoided: {}, substitutionCounts: {} }, discomfort: {} }, log: {}, readiness: null });
  assert.deepEqual(enhanced.slots.map((slot) => slot.exId), originalIds);
  assert.equal(enhanced.goal.id, 'general_fitness');
  enhanced.slots.forEach((slot) => {
    assert.ok(slot.ex.repRange[0] >= (slot.ex.role === 'compound' ? 8 : 10) || slot.ex.repRange[0] === EX[slot.exId].repRange[0]);
    assert.ok(slot.ex.restSec <= Math.max(45, EX[slot.exId].restSec));
  });
});

test('route grouping never reorders program priority', () => {
  const slots = [{ exId: 'db_incline' }, { exId: 'pl_high_row' }, { exId: 'db_curl' }, { exId: 'db_lateral' }];
  const equipment = [
    { id: 'rack', autoEligible: true, zoneId: 'free-weights', exerciseIds: ['db_incline', 'db_curl', 'db_lateral'] },
    { id: 'row', autoEligible: true, zoneId: 'plate-loaded', exerciseIds: ['pl_high_row'] }
  ];
  const before = slots.map((slot) => slot.exId);
  const groups = COACH.routeFor(slots, equipment);
  assert.deepEqual(slots.map((slot) => slot.exId), before);
  assert.deepEqual(groups.map((group) => group.zoneId), ['free-weights', 'plate-loaded', 'free-weights']);
  assert.deepEqual(groups[2].exerciseIds, ['db_curl', 'db_lateral']);
});

test('busy alternatives exclude avoided exercises and reward verified continuity', () => {
  const equipment = [
    { id: 'rack', autoEligible: true, zoneId: 'free-weights', exerciseIds: ['db_bench', 'db_floor_press'] },
    { id: 'press', autoEligible: true, zoneId: 'plate-loaded', exerciseIds: ['pl_chest_press'] }
  ];
  const profile = { preferences: { preferred: { pl_chest_press: true }, avoided: { db_floor_press: true }, substitutionCounts: {} }, discomfort: {} };
  const ranked = COACH.rankedAlternatives(EX.db_bench, ['db_floor_press', 'pl_chest_press'], EX, equipment, profile, {}, 'free-weights');
  assert.deepEqual(ranked.map((item) => item.exercise.id), ['pl_chest_press']);
  assert.ok(ranked[0].reasons.includes('preferred'));
});

test('unilateral coaching waits for repeated paired-side evidence', () => {
  const paired = (left, right) => ({ sideSets: { left: [{ reps: left }], right: [{ reps: right }] } });
  assert.equal(COACH.unilateralSignal([paired(8, 10), paired(8, 10)]).repeated, false);
  const signal = COACH.unilateralSignal([paired(8, 10), paired(9, 10), paired(8, 9)]);
  assert.equal(signal.repeated, true);
  assert.equal(signal.side, 'left');
  assert.match(signal.message, /Start there next time/);
});

test('plateau detection requires at least four comparable meaningful exposures', () => {
  assert.equal(COACH.plateauStatus(EX.db_curl, history(20, 3, [10, 10, 10])).plateau, false);
  const stalled = history(20, 4, [10, 10, 10], 2);
  assert.equal(COACH.plateauStatus(EX.db_curl, stalled).plateau, true);
});

test('live set advice never automatically changes load mid-set', () => {
  const result = COACH.liveSetAdvice(EX.db_bench, { repRange: [8, 12], sets: 3 }, [{ reps: 6, weight: 50, rir: 0 }], 120);
  assert.equal(result.action, 'offer_lower');
  assert.match(result.message, /if technique is deteriorating; you decide/i);
});
