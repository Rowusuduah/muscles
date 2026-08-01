import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILES = [
  'app.js', 'logic.js', 'figure.js', 'howto.js', 'sw.js', 'manifest.json', 'og.png',
  'Complete_Gym_Equipment_Handbook_Revised.pdf'
];
const DIRECTORIES = ['data', 'assets', 'fonts', 'icons'];

export function verifiedStatic() {
  let root = process.cwd();
  return {
    name: 'verified-static-assets',
    apply: 'build',
    configResolved(config) { root = config.root; },
    async closeBundle() {
      const client = resolve(root, 'dist', 'client');
      const server = resolve(root, 'dist', 'server');
      await mkdir(client, { recursive: true });
      await mkdir(server, { recursive: true });
      for (const file of FILES) await cp(resolve(root, file), resolve(client, file));
      for (const directory of DIRECTORIES) await cp(resolve(root, directory), resolve(client, directory), { recursive: true });
      await cp(resolve(root, 'worker', 'index.js'), resolve(server, 'index.js'));
    }
  };
}
