import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROGRAM = require('../data/program.js');
const EXERCISES = require('../data/exercises.js');
const DUMBBELL_EXERCISES = require('../data/dumbbells.js');
const EX = Object.fromEntries(EXERCISES.map((exercise) => [exercise.id, exercise]));

const source = fs.readFileSync(path.join(root, 'data', 'crunch.js'), 'utf8');
const context = { window: { DUMBBELL_EXERCISES } };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'data/crunch.js' });

const GUIDES = context.window.CRUNCH_GUIDES;
const EQUIPMENT = context.window.CRUNCH_EQUIPMENT;
const MAP = context.window.CRUNCH_MAP;
const GYM = context.window.CRUNCH_GYM;
const available = new Set(EQUIPMENT.flatMap((item) => item.exerciseIds || []));

test('Crunch inventory is model-level, unique and traceable to the 140-photo audit', () => {
  assert.ok(Array.isArray(GUIDES));
  assert.ok(GUIDES.length >= 50);
  assert.equal(GYM.photoCount, 140);
  assert.equal(new Set(GUIDES.map((guide) => guide.id)).size, GUIDES.length);
  for (const guide of GUIDES) {
    assert.equal(guide.gymId, 'crunch');
    assert.ok(guide.identity);
    assert.ok(guide.zoneId);
    assert.ok(guide.evidence?.confidence);
    assert.ok(guide.evidence?.summary);
    assert.ok(guide.photos?.length >= 1);
    for (const photo of guide.photos) {
      assert.match(photo.filename, /^IMG_\d{4}\.JPG$/);
      // Crunch photos are bundled locally like the Original Gym so they load
      // instantly and work fully offline — never from a remote Google Drive URL.
      assert.ok(!/drive\.google\.com/.test(photo.webp), guide.id + ' still points at Google Drive');
      assert.match(photo.webp, /^assets\/crunch\/img_\d{4}\.webp$/);
    }
  }
});

test('every Crunch photo is a local file that exists on disk and is precached by the service worker', () => {
  // Evaluate sw.js in a stubbed worker scope so we can read its real SHELL precache list.
  const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const swScope = {
    self: { addEventListener() {}, location: { origin: 'https://x' }, skipWaiting() {}, clients: { claim() {} } },
    caches: {}, fetch() {}, console,
  };
  vm.createContext(swScope);
  vm.runInContext(swSource, swScope, { filename: 'sw.js' });
  const precached = new Set(swScope.SHELL);
  const referenced = new Set(GUIDES.flatMap((guide) => guide.photos.map((photo) => photo.webp)));
  for (const rel of referenced) {
    assert.ok(fs.existsSync(path.join(root, rel)), 'missing local asset ' + rel);
    assert.ok(precached.has(rel), 'service worker SHELL does not precache ' + rel);
  }
});

test('manual-only or ambiguous Crunch equipment can never enter automatic workout selection', () => {
  const equipmentById = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));
  for (const guide of GUIDES.filter((guide) => guide.autoEligible === false)) {
    const item = equipmentById[guide.id];
    assert.ok(item, guide.id);
    assert.deepEqual(Array.from(item.exerciseIds), [], guide.id + ' exposed exercise IDs despite manual-only status');
  }
});

test('every programmed workout slot has a verified Crunch movement or verified program alternative', () => {
  const unresolved = [];
  for (const program of Object.values(PROGRAM.programs)) {
    for (const dayId of program.cycle) {
      const day = program.days[dayId];
      for (const slot of day.slots) {
        if (available.has(slot.ex)) continue;
        const replacement = (slot.alt || []).find((id) => available.has(id));
        if (!replacement) unresolved.push({ program: program.id, day: dayId, exercise: slot.ex, alternatives: slot.alt || [] });
      }
    }
  }
  assert.deepEqual(Array.from(unresolved), []);
});

test('all Crunch coach-linked exercise IDs exist in the exercise library', () => {
  for (const item of EQUIPMENT) {
    for (const exerciseId of item.exerciseIds || []) {
      assert.ok(EX[exerciseId], item.id + ' -> unknown exercise ' + exerciseId);
    }
  }
});

test('all 140 audit photos belong to a guide — nothing photographed is left unidentified', () => {
  const used = new Set(GUIDES.flatMap((guide) => guide.photos.map((photo) => photo.number)));
  const missing = [];
  for (let n = 2079; n <= 2218; n++) if (!used.has(n)) missing.push('IMG_' + n);
  assert.deepEqual(missing, []);
  assert.equal(used.size, GYM.photoCount);
});

test('the Olympic bench row found in the 2026-09-27 re-audit is mapped to barbell movements', () => {
  const byId = Object.fromEntries(GUIDES.map((guide) => [guide.id, guide]));
  const expected = {
    'cr-olympic-flat-bench': 'barbell_bench',
    'cr-olympic-incline-bench': 'barbell_incline',
    'cr-olympic-decline-bench': 'barbell_decline',
    'cr-olympic-military-bench': 'barbell_seated_ohp',
  };
  for (const [guideId, exerciseId] of Object.entries(expected)) {
    assert.ok(byId[guideId], guideId);
    assert.equal(byId[guideId].zoneId, 'olympic-benches');
    assert.ok(byId[guideId].linkedExerciseIds.includes(exerciseId), guideId + ' -> ' + exerciseId);
    assert.ok(EX[exerciseId], exerciseId);
  }
  assert.ok(MAP.zones.some((zone) => zone.id === 'olympic-benches'));
});

test('every Crunch station can be logged from its guide, including manual-only stations', () => {
  for (const item of EQUIPMENT) {
    const loggable = (item.logExerciseIds || []).filter((id) => EX[id]);
    assert.ok(loggable.length > 0, item.id + ' has nothing the owner can log');
    for (const id of item.exerciseIds || []) assert.ok(item.logExerciseIds.includes(id), item.id + ' coach id not loggable: ' + id);
  }
  const byId = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));
  assert.ok(byId['cr-smith-machine'].logExerciseIds.includes('smith_bench'));
  assert.deepEqual(Array.from(byId['cr-smith-machine'].exerciseIds), []);
  assert.deepEqual(Array.from(byId['cr-treadmills'].logExerciseIds).slice(0, 1), ['treadmill_run']);
  assert.ok(byId['cr-cardio-steppers'].logExerciseIds.includes('stair_climber'));
});

test('Crunch map is explicitly schematic because indoor GPS is not machine-accurate', () => {
  assert.match(MAP.method, /schematic/i);
  assert.match(MAP.method, /not to scale/i);
  assert.equal(MAP.exif.photoCount, 140);
  assert.ok(MAP.exif.gpsMedianErrorM >= 20);
  assert.ok(MAP.exif.gpsMaxErrorM > MAP.exif.gpsMedianErrorM);
  assert.ok(MAP.zones.length >= 6);
  assert.equal(new Set(MAP.zones.map((zone) => zone.id)).size, MAP.zones.length);
});
