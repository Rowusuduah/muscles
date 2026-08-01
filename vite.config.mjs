import { defineConfig } from 'vite';
import { sites } from './build/sites-vite-plugin.mjs';
import { verifiedStatic } from './build/verified-static-plugin.mjs';

export default defineConfig({
  publicDir: false,
  plugins: [verifiedStatic(), sites()],
  server: { host: '127.0.0.1' },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: { input: 'index.html' }
  }
});
