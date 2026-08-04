import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Prevent Vite's upward postcss-config search from picking up the parent
  // portfolio repo's Tailwind config -- this project is deliberately isolated.
  css: {
    postcss: {
      plugins: []
    }
  },
  server: {
    port: 5183,
    strictPort: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
});
