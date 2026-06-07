import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    // Build into a local (gitignored) dist/. Deploy = copy dist/index.html +
    // dist/assets/index-*.js up into the parent ruby-breaker-v2/ folder.
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
