import { tokenFor } from '@taskly/e2e-core';
import { BASE_URL, SESSION_KEY } from './env.js';

/**
 * Seed a session straight into localStorage to skip the UI login — the Selenium
 * equivalent of e2e-core's `seedSession`. Mirrors the Playwright
 * `authenticatedBoard` fixture (a board already past authentication).
 */
export async function seedSession(driver, user) {
  await driver.get(BASE_URL); // need an origin loaded before touching its localStorage
  await driver.executeScript(
    'window.localStorage.setItem(arguments[0], arguments[1]);',
    SESSION_KEY,
    JSON.stringify({ email: user.email, token: tokenFor(user.email) }),
  );
  await driver.navigate().refresh();
}
