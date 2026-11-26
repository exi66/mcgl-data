import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Relative base: the build works from any sub-path (GitHub Pages /<repo>/ included).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // i18n is initialised for tests too: code outside React translates with i18next.t().
    setupFiles: ['src/lib/i18n.ts'],
  },
});
