import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MUSCLES = require('../data/muscles.js');
const EXERCISES = require('../data/exercises.js');
const DUMBBELLS = require('../data/dumbbells.js');
const EQUIPMENT = require('../data/equipment.js');
const DEMOS = require('../data/demos.js');
const HOWTO = require('../howto.js');
const APPSTATE = require('../data/state.js');
const EX = Object.fromEntries(EXERCISES.map((exercise) => [exercise.id, exercise]));

function crunchData() {
  const source = fs.readFileSync(path.join(root, 'data', 'crunch.js'), 'utf8');
  const context = { window: { DUMBBELL_EXERCISES: DUMBBELLS } };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'data/crunch.js' });
  return context.window;
}

test('dumbbell merge preserves stable IDs and expands the complete library without duplicates', () => {
  assert.equal(EXERCISES.length, 142);
  assert.equal(DUMBBELLS.length, 77);
  assert.equal(EXERCISES.filter((exercise) => exercise.equipType === 'dumbbell').length, 77);
  assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length);
  assert.equal(new Set(DUMBBELLS.map((exercise) => exercise.id)).size, DUMBBELLS.length);
  ['db_bench', 'db_incline', 'db_row', 'db_rdl', 'goblet_squat', 'walking_lunge', 'russian_twist'].forEach((id) => {
    assert.ok(EX[id], id);
    assert.equal(DUMBBELLS.filter((exercise) => exercise.id === id).length, 1, id);
  });
});

test('every dumbbell entry has complete exercise-specific coaching metadata', () => {
  const arrayFields = ['primary', 'secondary', 'setup', 'movement', 'cues', 'mistakes', 'safety', 'usefulFor'];
  const textFields = ['purpose', 'why', 'startPosition', 'endPosition', 'rangeOfMotion', 'breathing', 'tempo', 'placement', 'calibration'];
  for (const exercise of DUMBBELLS) {
    arrayFields.forEach((field) => assert.ok(Array.isArray(exercise[field]) && exercise[field].length, `${exercise.id} missing ${field}`));
    textFields.forEach((field) => assert.ok(typeof exercise[field] === 'string' && exercise[field].length > 12, `${exercise.id} missing ${field}`));
    ['difficulty', 'pattern', 'role'].forEach((field) => assert.ok(typeof exercise[field] === 'string' && exercise[field].length >= 3, `${exercise.id} missing ${field}`));
    assert.ok(exercise.sets >= 2 && exercise.sets <= 5, exercise.id);
    assert.ok(exercise.repRange[0] < exercise.repRange[1], exercise.id);
    assert.ok(exercise.restSec >= 45, exercise.id);
    assert.ok(exercise.defaultRIR >= 1 && exercise.defaultRIR <= 3, exercise.id);
    assert.ok(exercise.progression?.increase && exercise.progression?.hold && exercise.progression?.decrease, `${exercise.id} progression`);
    exercise.mistakes.forEach((item) => {
      assert.ok(item.mistake?.length > 5, `${exercise.id} mistake`);
      assert.ok(item.correction?.length > 10, `${exercise.id} correction`);
    });
  }
});

test('dumbbell muscles, alternatives and equipment substitutions reference valid IDs', () => {
  const muscles = new Set(MUSCLES.map((muscle) => muscle.id));
  for (const exercise of DUMBBELLS) {
    [...exercise.primary, ...exercise.secondary].forEach((muscle) => assert.ok(muscles.has(muscle), `${exercise.id} -> ${muscle}`));
    (exercise.alternatives || []).forEach((id) => assert.ok(EX[id], `${exercise.id} alternative -> ${id}`));
    (exercise.equipmentSubstitutes || []).forEach((item) => {
      assert.ok(EX[item.id], `${exercise.id} equipment substitute -> ${item.id}`);
      assert.ok(item.note?.length > 20, `${exercise.id} substitute needs a difference explanation`);
    });
  }
});

test('every dumbbell uses explicit per-hand semantics and never selector-stack semantics', () => {
  for (const exercise of DUMBBELLS) {
    assert.equal(exercise.loadMode, 'perHand', exercise.id);
    assert.equal(exercise.weightSemantics?.mode, 'perHand', exercise.id);
    assert.match(exercise.weightSemantics?.note || '', /single dumbbell|one dumbbell|per-hand|per hand|number printed/i, exercise.id);
    assert.notEqual(exercise.loadMode, 'stack');
    assert.ok(['unilateral', 'bilateral', 'alternating'].includes(exercise.handedness), exercise.id);
  }
});

test('every dumbbell has a valid lightweight code-drawn movement demonstration', () => {
  for (const exercise of DUMBBELLS) {
    assert.equal(DEMOS[exercise.id], 'svg', exercise.id);
    const svg = HOWTO.howtoSVG(EX[exercise.id], 'right');
    assert.match(svg, /^<svg/);
    assert.match(svg, /class="howto"/);
    assert.ok(HOWTO.duration(EX[exercise.id]) >= 1.5, exercise.id);
  }
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /data-action="demo-frame" data-frame="start"/);
  assert.match(app, /data-action="demo-toggle"/);
  assert.match(app, /data-action="demo-frame" data-frame="end"/);
  assert.match(app, /prefers-reduced-motion/);
});

test('original and Crunch dumbbell racks map the complete dumbbell library', () => {
  const originalRack = EQUIPMENT.find((item) => item.id === 'guide-39-dumbbells');
  assert.ok(originalRack);
  assert.deepEqual(new Set(originalRack.exerciseIds), new Set(DUMBBELLS.map((exercise) => exercise.id)));
  const crunch = crunchData();
  const rack = crunch.CRUNCH_EQUIPMENT.find((item) => item.id === 'cr-dumbbell-rack');
  assert.ok(rack);
  assert.equal(rack.zoneId, 'free-weights');
  assert.equal(rack.autoEligible, true);
  assert.deepEqual(new Set(Array.from(rack.exerciseIds)), new Set(DUMBBELLS.map((exercise) => exercise.id)));
  for (const exercise of DUMBBELLS) assert.ok(rack.exerciseIds.includes(exercise.id), exercise.id);
});

test('bench-dependent dumbbells also map to photographed Crunch benches', () => {
  const crunch = crunchData();
  const adjustable = crunch.CRUNCH_EQUIPMENT.find((item) => item.id === 'cr-adjustable-bench');
  const seated = crunch.CRUNCH_EQUIPMENT.find((item) => item.id === 'cr-seated-utility-bench');
  assert.ok(adjustable?.photo);
  assert.ok(seated?.photo);
  DUMBBELLS.filter((exercise) => exercise.requiresBench).forEach((exercise) => assert.ok(adjustable.exerciseIds.includes(exercise.id), exercise.id));
  DUMBBELLS.filter((exercise) => exercise.requiresBench && ['Shoulders', 'Arms'].includes(exercise.family)).forEach((exercise) => assert.ok(seated.exerciseIds.includes(exercise.id), exercise.id));
});

test('per-hand logs and new coaching profile survive AppStateV2 normalize and backup restore', () => {
  const state = APPSTATE.defaultState();
  state.config.onboarded = true;
  state.config.gymId = 'crunch';
  state.trainingProfile.goal = 'strength_muscle';
  state.trainingProfile.availableDumbbellsLb = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  state.trainingProfile.exerciseSettings.db_incline = 'Bench notch 3';
  state.workoutLogs['2026-09-23'] = { gymId: 'crunch', exercises: [{ exId: 'db_incline', loadMode: 'perHand', weightPerHand: 50, exerciseSetting: 'Bench notch 3', sets: [{ reps: 12, weight: 50, weightPerHand: 50, rir: 2 }] }] };
  const parsed = APPSTATE.parseBackup(APPSTATE.exportBackup(state));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.workoutLogs['2026-09-23'].exercises[0].weightPerHand, 50);
  assert.equal(parsed.value.workoutLogs['2026-09-23'].exercises[0].sets[0].weightPerHand, 50);
  assert.equal(parsed.value.trainingProfile.exerciseSettings.db_incline, 'Bench notch 3');
  assert.equal(parsed.value.trainingProfile.goal, 'strength_muscle');
  assert.deepEqual(parsed.value.trainingProfile.availableDumbbellsLb, state.trainingProfile.availableDumbbellsLb);
});

test('service worker includes new offline code modules without precaching 154 new bitmap frames', () => {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(source, /data\/dumbbells\.js/);
  assert.match(source, /coach\.js/);
  assert.equal(fs.readdirSync(path.join(root, 'assets', 'demos')).filter((name) => name.endsWith('.webp')).length, 122);
  assert.equal(DUMBBELLS.length * 2, 154);
});

test('equipment and exercise IDs remain globally unique', () => {
  const crunch = crunchData();
  assert.equal(new Set(EQUIPMENT.map((item) => item.id)).size, EQUIPMENT.length);
  assert.equal(new Set(Array.from(crunch.CRUNCH_EQUIPMENT, (item) => item.id)).size, crunch.CRUNCH_EQUIPMENT.length);
  assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length);
});
