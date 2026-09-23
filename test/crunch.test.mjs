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
const EX = Object.fromEntries(EXERCISES.map((exercise) => [exercise.id, exercise]));

const source = fs.readFileSync(path.join(root, 'data', 'crunch.js'), 'utf8');
const context = { window: {} };
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
      assert.ok(photo.webp.startsWith('https://drive.google.com/thumbnail?id='));
    }
  }
});

test('manual-only or ambiguous Crunch equipment can never enter automatic workout selection', () => {
  const equipmentById = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));
  for (const guide of GUIDES.filter((guide) => guide.autoEligible === false)) {
    const item = equipmentById[guide.id];
    assert.ok(item, guide.id);
    assert.deepEqual(item.exerciseIds, [], guide.id + ' exposed exercise IDs despite manual-only status');
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
  assert.deepEqual(unresolved, []);
});

test('all Crunch coach-linked exercise IDs exist in the exercise library', () => {
  for (const item of EQUIPMENT) {
    for (const exerciseId of item.exerciseIds || []) {
      assert.ok(EX[exerciseId], item.id + ' -> unknown exercise ' + exerciseId);
    }
  }
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
