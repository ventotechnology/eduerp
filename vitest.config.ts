import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    fileParallelism: false,
    testTimeout: 20000,
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
