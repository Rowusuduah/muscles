import { access, cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
}

// Sites metadata packaging hook, kept local so the vanilla runtime stays framework-free.
export function sites() {
  let root = process.cwd();
  return {
    name: 'sites',
    apply: 'build',
    configResolved(config) { root = config.root; },
    async closeBundle() {
      const output = resolve(root, 'dist', '.openai');
      const hosting = resolve(root, '.openai', 'hosting.json');
      await rm(output, { recursive: true, force: true });
      await mkdir(output, { recursive: true });
      if (await exists(hosting)) await cp(hosting, resolve(output, 'hosting.json'));
    }
  };
}
