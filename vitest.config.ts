/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['e2e', 'node_modules', 'dist', '.astro'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});