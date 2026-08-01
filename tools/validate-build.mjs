import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const client = path.join(root, 'dist', 'client');
const required = [
  'index.html', 'app.js', 'logic.js', 'figure.js', 'howto.js', 'sw.js', 'manifest.json',
  'data/handbook.js', 'data/state.js', 'data/program.js', 'data/exercises.js',
  'fonts/Oswald-Variable.ttf', 'og.png', 'Complete_Gym_Equipment_Handbook_Revised.pdf'
];
required.forEach((file) => assert.ok(fs.existsSync(path.join(client, file)), `missing build asset ${file}`));
for (let i = 1; i <= 51; i++) assert.ok(fs.existsSync(path.join(client, 'assets', 'equipment', `eq${i}.webp`)), `missing eq${i}.webp`);
assert.ok(fs.existsSync(path.join(root, 'dist', 'server', 'index.js')), 'missing Sites worker');
assert.ok(fs.existsSync(path.join(root, 'dist', '.openai', 'hosting.json')), 'missing packaged Sites metadata');
console.log('Validated Sites build: shell + 45 guides + 51 photographs + PDF + worker');
