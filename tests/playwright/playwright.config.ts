import { defineConfig, devices } from '@playwright/test';
import { defineBddProject, cucumberReporter } from 'playwright-bdd';
import { API_URL, BASE_URL } from './env';

// Gherkin/BDD project: feature files + step definitions are generated into
// their own test dir and run through the standard Playwright runner — same
// fixtures, parallelism, retries and reporters as the rest of the suite.
const bddProject = defineBddProject({
  name: 'bdd',
  features: 'features/**/*.feature',
  // Steps + the fixtures file that calls createBdd(test) — bddgen infers the
  // extended `test` (with our custom fixtures) from it.
  steps: ['steps/**/*.ts', 'fixtures.ts'],
});

/**
 * Playwright config for the Taskly stack (API + web).
 *
 * The `webServer` array boots the Express API and the production web preview,
 * so the suite runs against the same artifacts that ship — locally and in CI.
 * Set BASE_URL to target an already-running deployment (skips the servers).
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const isCI = !!process.env.CI;
const useExternalTarget = !!process.env.BASE_URL;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    // Cucumber-style HTML living documentation (business-readable, covers the
    // BDD/Gherkin scenarios with pass/fail).
    cucumberReporter('html', { outputFile: 'reports/cucumber/index.html' }),
    ['html', { open: 'never' }],
    ['list'],
    ...(isCI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // E2E + API specs (TypeScript) — inherit the top-level testDir (./specs).
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    // Gherkin/BDD scenarios — own (generated) testDir from defineBddProject.
    { ...bddProject, use: { ...devices['Desktop Chrome'] } },
  ],

  // Boot API + web unless we're pointed at an external deployment.
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
          command: 'npm run web:build && npm run web:preview',
          cwd: '../../',
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !isCI,
          stdout: 'pipe',
        },
      ],
});
