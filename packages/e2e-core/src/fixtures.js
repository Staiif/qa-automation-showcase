import { ApiClient } from './ApiClient.js';
import { tokenFor } from './tokenFor.js';

/**
 * Builds a Playwright/BDD `test` with **per-worker isolation + auto teardown**,
 * shared by every app's suite. The `base` test is injected (the app's
 * playwright-bdd test) so this package keeps zero runtime dependencies.
 *
 * @param base   the app's base test (e.g. playwright-bdd `test`)
 * @param config { apiUrl, testSecret, demoUser: { email, password }, sessionKey }
 */
export function makeAuthFixtures(base, config) {
  return base.extend({
    // A per-parallel-slot account (`demo+wN@…`) so parallel tests never collide.
    user: async ({}, use) => {
      const [local, domain] = config.demoUser.email.split('@');
      await use({
        email: `${local}+w${base.info().parallelIndex}@${domain}`,
        password: config.demoUser.password,
      });
    },

    // Autouse: tear down THIS worker's data before each test, leaving the others
    // untouched — the whole suite stays isolated under parallelism.
    resetData: [
      async ({ request, user }, use) => {
        await new ApiClient(request, config).reset(user.email);
        await use();
      },
      { auto: true },
    ],
  });
}

/** Seed a session directly in localStorage to skip the UI login. */
export async function seedSession(page, sessionKey, user) {
  await page.addInitScript(
    ({ key, email, token }) => {
      window.localStorage.setItem(key, JSON.stringify({ email, token }));
    },
    { key: sessionKey, email: user.email, token: tokenFor(user.email) },
  );
}
