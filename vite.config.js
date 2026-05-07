import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Faster and built-in (replaces terser)
    sourcemap: false
  },
  server: {
    port: 3000,
    open: true
  }
});
