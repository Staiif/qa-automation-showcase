import { defineConfig, devices } from '@playwright/test';
import { API_URL, BASE_URL } from './env';

/**
 * Notely E2E — second app, same shared API + e2e-core. Boots the API and the
 * Notely production preview, then runs the suite against them.
 */
const isCI = !!process.env.CI;
const useExternalTarget = !!process.env.NOTES_BASE_URL;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: isCI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: useExternalTarget
    ? undefined
    : [
        {
          command: 'npm run api:start',
          cwd: '../../',
          url: `${API_URL}/health`,
          timeout: 60_000,
          reuseExistingServer: !isCI,
          stdout: 'pipe',
        },
        {
          command: 'npm run notes:build && npm run notes:preview',
          cwd: '../../',
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !isCI,
          stdout: 'pipe',
        },
      ],
});
