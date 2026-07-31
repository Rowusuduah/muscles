import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const L = require('../logic.js');
const MUSCLES = require('../data/muscles.js');
const EXERCISES = require('../data/exercises.js');
const EQUIPMENT = require('../data/equipment.js');
const PROGRAM = require('../data/program.js');
const EX = L.byId(EXERCISES);

test('units: lb<->kg round trip and display rounding', () => {
  assert.ok(Math.abs(L.kgToLb(L.lbToKg(100)) - 100) < 1e-9);
  assert.equal(L.toDisplay(100, 'lb'), 100);
  assert.equal(L.toDisplay(100, 'kg'), 45.5);       // 45.359 -> nearest 0.5
  assert.equal(L.fromInput('45', 'kg') > 99 && L.fromInput('45', 'kg') < 100, true);
});

test('e1rm: Epley', () => {
  assert.equal(L.e1rm(100, 1), 100);
  assert.ok(Math.abs(L.e1rm(100, 10) - 133.33) < 0.5);
});

test('cycle: 7-session order push,pull,legs,cardio,upper,lower,cardio', () => {
  const seq = [0, 1, 2, 3, 4, 5, 6].map((i) => L.dayIdAt(PROGRAM, i));
  assert.deepEqual(seq, ['push', 'pull', 'legs', 'cardio', 'upper', 'lower', 'cardio']);
  assert.equal(L.dayIdAt(PROGRAM, 7), 'push');       // wraps
  assert.equal(L.nextIndex(PROGRAM, 6), 0);
});

test('session builder: fits time budget and keeps essentials', () => {
  const long = L.buildSession(PROGRAM, EX, 'push', 120, {});
  const short = L.buildSession(PROGRAM, EX, 'push', 30, {});
  assert.ok(long.estMin <= 120, 'long within budget');
  assert.ok(short.estMin <= 30 + 1, 'short within budget');
  assert.ok(short.slots.length < long.slots.length, 'shorter session has fewer slots');
  // compounds always survive
  const compounds = short.slots.filter((s) => s.role === 'compound').length;
  assert.ok(compounds >= 2, 'compounds kept in short session');
  // at least one core finisher stays
  assert.ok(short.slots.some((s) => s.role === 'core'), 'core kept');
});

test('session builder: longer budget adds volume', () => {
  const s60 = L.buildSession(PROGRAM, EX, 'legs', 60, {});
  const s120 = L.buildSession(PROGRAM, EX, 'legs', 120, {});
  const sets60 = s60.slots.reduce((t, s) => t + s.sets, 0);
  const sets120 = s120.slots.reduce((t, s) => t + s.sets, 0);
  assert.ok(sets120 > sets60, 'more total sets at 120 min');
});

test('prescribe: calibrate -> progress -> hold -> deload', () => {
  const ex = EX['pl_incline_press'];      // range 6-10, +5 lb
  assert.equal(L.prescribe(ex, null).mode, 'calibrate');
  assert.equal(L.prescribe(ex, { lastWeight: 45, lastSetsReps: [10, 10, 10], missStreak: 0 }).mode, 'progress');
  assert.equal(L.prescribe(ex, { lastWeight: 45, lastSetsReps: [10, 10, 10], missStreak: 0 }).weight, 50);
  assert.equal(L.prescribe(ex, { lastWeight: 45, lastSetsReps: [8, 7, 7], missStreak: 0 }).mode, 'hold');
  assert.equal(L.prescribe(ex, { lastWeight: 45, lastSetsReps: [5, 4, 4], missStreak: 1 }).mode, 'deload');
});

test('updateLift: tracks weight, reps, e1rm, missStreak', () => {
  const ex = EX['pl_incline_press'];
  const r1 = L.updateLift(null, ex, [{ reps: 10, weight: 45 }, { reps: 9, weight: 45 }]);
  assert.equal(r1.lastWeight, 45);
  assert.equal(r1.missStreak, 0);
  assert.ok(r1.bestE1RM > 45);
  const r2 = L.updateLift(r1, ex, [{ reps: 5, weight: 50 }]);   // below bottom(6)
  assert.equal(r2.missStreak, 1);
});

test('weeklyVolume: primary=1, secondary=0.5 set counting', () => {
  const log = {
    '2026-07-30': { day: 'push', exercises: [{ exId: 'pl_incline_press', sets: [{ reps: 10, weight: 45 }, { reps: 9, weight: 45 }, { reps: 8, weight: 45 }] }] }
  };
  const wv = L.weeklyVolume(log, EX, '2026-07-30', 7);
  assert.equal(wv['chest'].sets, 3);       // primary
  assert.equal(wv['triceps'].sets, 1.5);   // secondary (0.5 * 3)
  assert.ok(wv['chest'].volume > 0);
});

test('streak: never-miss-twice tolerates a single rest day', () => {
  const log = {
    '2026-07-31': { day: 'push', exercises: [{ exId: 'pl_chest_press', sets: [{ reps: 8, weight: 40 }] }] },
    // 07-30 rest
    '2026-07-29': { day: 'pull', exercises: [{ exId: 'lat_pulldown', sets: [{ reps: 8, weight: 60 }] }] },
    '2026-07-28': { day: 'legs', exercises: [{ exId: 'leg_press', sets: [{ reps: 12, weight: 180 }] }] }
  };
  assert.equal(L.streak(log, '2026-07-31'), 3);     // single gap tolerated
  const broken = { '2026-07-31': log['2026-07-31'], '2026-07-27': log['2026-07-28'] };
  assert.equal(L.streak(broken, '2026-07-31'), 1);  // 2+ empty days breaks
});

test('rank: goal-gradient thresholds', () => {
  assert.equal(L.rank(0).name, 'Beginner');
  assert.equal(L.rank(60).name, 'Novice');
  assert.equal(L.rank(60).next, 'Intermediate');
  assert.ok(L.rank(125).progress > 0 && L.rank(125).progress < 1);
});

test('busyAlternatives: only exercises the gym has', () => {
  const slot = PROGRAM.days.push.slots[0];  // incline press w/ alts
  const alts = L.busyAlternatives(slot, EX, EQUIPMENT);
  assert.ok(alts.length >= 1);
  alts.forEach((a) => assert.ok(a.id));
});

test('data integrity: every program exercise & alt exists', () => {
  Object.keys(PROGRAM.days).forEach((d) => {
    const day = PROGRAM.days[d];
    (day.slots || []).forEach((s) => {
      assert.ok(EX[s.ex], `missing exercise ${s.ex} in ${d}`);
      (s.alt || []).forEach((a) => assert.ok(EX[a], `missing alt ${a} in ${d}`));
      assert.ok(MUSCLES.some((m) => m.id === s.m), `bad muscle ${s.m}`);
    });
  });
});

test('data integrity: every equipment exercise exists', () => {
  EQUIPMENT.forEach((e) => (e.exerciseIds || []).forEach((id) => {
    assert.ok(EX[id], `equipment ${e.id} references missing exercise ${id}`);
  }));
});

test('data integrity: every exercise muscle is defined', () => {
  const mids = new Set(MUSCLES.map((m) => m.id));
  EXERCISES.forEach((e) => {
    [].concat(e.primary, e.secondary).forEach((m) => {
      if (m) assert.ok(mids.has(m), `exercise ${e.id} bad muscle ${m}`);
    });
  });
});
