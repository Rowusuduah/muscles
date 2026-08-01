import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MDRIVE = require(path.join(root, 'drive.js'));

test('drive module loads in Node with only the pure surface (no browser refs)', () => {
  assert.equal(typeof MDRIVE.decideSync, 'function');
  assert.equal(MDRIVE.FILENAME, 'Muscles_Backup.json');
  assert.equal(MDRIVE.SCOPE, 'https://www.googleapis.com/auth/drive.file');
  // Browser-only operations must NOT be present in the Node surface.
  assert.equal(MDRIVE.connect, undefined);
});

test('decideSync: newer side wins, ties are a no-op', () => {
  assert.equal(MDRIVE.decideSync('2026-08-01T10:00:00Z', '2026-08-01T12:00:00Z'), 'pull');
  assert.equal(MDRIVE.decideSync('2026-08-01T12:00:00Z', '2026-08-01T10:00:00Z'), 'push');
  assert.equal(MDRIVE.decideSync('2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z'), 'same');
});

test('decideSync: missing timestamps degrade safely', () => {
  // No local record yet but a remote exists → pull the cloud copy.
  assert.equal(MDRIVE.decideSync('', '2026-08-01T10:00:00Z'), 'pull');
  // Local changes but no remote timestamp → push local up.
  assert.equal(MDRIVE.decideSync('2026-08-01T10:00:00Z', ''), 'push');
  // Nothing on either side → nothing to do.
  assert.equal(MDRIVE.decideSync('', ''), 'same');
  assert.equal(MDRIVE.decideSync(null, undefined), 'same');
});

test('decideSync: ISO strings compare chronologically across day/month/year', () => {
  assert.equal(MDRIVE.decideSync('2026-07-31T23:59:59Z', '2026-08-01T00:00:00Z'), 'pull');
  assert.equal(MDRIVE.decideSync('2027-01-01T00:00:00Z', '2026-12-31T23:59:59Z'), 'push');
});
