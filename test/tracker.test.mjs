import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const L = require('../logic.js');
const TT = require('../tracker.js');
const EX = L.byId(require('../data/exercises.js'));
const MU = L.byId(require('../data/muscles.js'));

const NOW = Date.UTC(2026, 8, 29, 23, 30);
const lift = (over = {}) => ({
  id: 'w1', name: 'Push Day', day: 'push', mode: 'alone', startedAt: NOW - 70 * 60000, endedAt: NOW - 10 * 60000, sessionDurationSec: 3600,
  felt: 4, note: '', exercises: [], ...over,
});
const firstWith = (pred) => Object.values(EX).find(pred);
const chestEx = firstWith((e) => (e.primary || []).includes('chest') && e.role !== 'cardio');
const cardioEx = firstWith((e) => e.role === 'cardio');
const sets = (n) => Array.from({ length: n }, () => ({ reps: 8, weight: 135 }));

const decode = (code) => JSON.parse(Buffer.from(code.slice(4).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

test('a lift session becomes a Weightlifting & Strength activity with its real times', () => {
  const log = { '2026-09-29': lift({ exercises: [{ exId: chestEx.id, sets: sets(4) }] }) };
  const [a] = TT.activitiesFromLog(log, EX, MU, {}, { now: NOW });
  assert.equal(a.id, 'mus-w1');
  assert.equal(a.category, 'Weightlifting & Strength');
  assert.equal(a.domain, 'Health & Physical');
  assert.equal(a.startTime, NOW - 70 * 60000);
  assert.equal(a.endTime, NOW - 10 * 60000);
  assert.equal(a.duration, 3600);
  assert.ok(a.title.startsWith('Push Day — chest'), a.title);
  assert.ok(a.notes.includes('4 sets') && a.notes.includes('felt 4/5'), a.notes);
});

test('cardio sessions are Cardio', () => {
  const log = { '2026-09-29': { id: 'c1', day: 'cardio', cardio: { exId: cardioEx.id, minutes: 25 }, endedAt: NOW - 60000, startedAt: null } };
  const [a] = TT.activitiesFromLog(log, EX, MU, {}, { now: NOW });
  assert.equal(a.category, 'Cardio');
  assert.equal(a.duration, 25 * 60);
  assert.ok(a.title.startsWith('Cardio — '), a.title);
});

test('several sessions on one day all come through, oldest first', () => {
  const day = { sessions: [lift({ id: 'b', startedAt: NOW - 30 * 60000, endedAt: NOW - 5 * 60000 }), lift({ id: 'a' })] };
  const acts = TT.activitiesFromLog({ '2026-09-29': day }, EX, MU, {}, { now: NOW });
  assert.deepEqual(acts.map((a) => a.id), ['mus-a', 'mus-b']);
});

test('old history without ids, sent sessions and old sessions are skipped', () => {
  const log = {
    '2026-09-01': lift({ id: 'old', startedAt: NOW - 28 * 86400000, endedAt: NOW - 28 * 86400000 + 3600000 }),
    '2026-09-28': { day: 'push', exercises: [], sessionDurationSec: 3000 },           // saved before this feature
    '2026-09-29': lift({ id: 'sent' }),
  };
  const sent = { 'mus-sent': NOW - 10 * 60000 };
  assert.equal(TT.activitiesFromLog(log, EX, MU, sent, { now: NOW }).length, 0);
  // …but an edited session (new end time) goes again, and includeSent resends.
  assert.equal(TT.activitiesFromLog(log, EX, MU, { 'mus-sent': 1 }, { now: NOW }).length, 1);
  assert.equal(TT.activitiesFromLog(log, EX, MU, sent, { now: NOW, includeSent: true }).length, 1);
});

test('start falls back to the logged duration', () => {
  const log = { d: lift({ startedAt: null, sessionDurationSec: 1800 }) };
  const [a] = TT.activitiesFromLog(log, EX, MU, {}, { now: NOW });
  assert.equal(a.endTime - a.startTime, 1800000);
});

test('the code is TT1 + url-safe base64 of UTF-8 JSON (round trip)', () => {
  const doc = { source: 'muscles', activities: [{ id: 'x', title: 'Leg Day — quads · glutes ✓', startTime: 1, endTime: 2 }] };
  const code = TT.encode(doc);
  assert.match(code, /^TT1:[A-Za-z0-9_-]+$/);
  assert.deepEqual(decode(code), doc);
});

test('session ids are unique enough', () => {
  const ids = new Set(Array.from({ length: 500 }, () => TT.newSessionId(NOW)));
  assert.ok(ids.size > 495);
});
