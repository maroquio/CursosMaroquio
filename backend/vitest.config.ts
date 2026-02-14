import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*.bun.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './src/shared'),
      '@auth': resolve(__dirname, './src/contexts/auth'),
      '@courses': resolve(__dirname, './src/contexts/courses'),
      '@infrastructure': resolve(__dirname, './src/infrastructure'),
    },
  },
});
