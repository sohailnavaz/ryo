import { defineConfig, devices } from '@playwright/test';

// Happy-path e2e for the Ryo web app. Runs against a production build in
// PREVIEW mode (NEXT_PUBLIC_RYO_PREVIEW_MODE=1) so the deterministic dummy
// catalogue is served — no live Supabase needed in CI.
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build is run by CI before this; `start` serves the production build.
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_RYO_PREVIEW_MODE: '1',
      NODE_ENV: 'production',
    },
  },
});
