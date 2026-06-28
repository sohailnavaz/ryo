import { defineConfig } from 'vitest/config';

// Root-level unit tests for pure logic in the shared packages (no React / no
// react-native rendering — those are covered by the Playwright e2e suite).
// Co-located `*.test.ts` next to the source they exercise.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts'],
    // react-native-web / expo source shouldn't be pulled into unit tests.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    passWithNoTests: false,
  },
});
