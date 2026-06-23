import { tokenFor } from '@taskly/e2e-core';
import { API_URL, TEST_SECRET } from './env.js';

/**
 * API client for test-data setup & teardown — the Selenium counterpart of
 * e2e-core's ApiClient (which is bound to Playwright's request context). Uses
 * the global `fetch` (Node 20+), reusing the shared `tokenFor` token scheme.
 */
export class ApiClient {
  /** Authenticate and return a bearer token. */
  async login({ email, password }) {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`login failed: ${res.status}`);
    return (await res.json()).token;
  }

  /** Tear down a single user's data — the core of per-worker isolation. */
  async reset(email) {
    const res = await fetch(`${API_URL}/api/test/reset`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokenFor(email)}`,
        'x-test-secret': TEST_SECRET,
      },
    });
    if (!res.ok) throw new Error(`reset failed: ${res.status}`);
  }

  /** Authenticated task creation, for seeding data before checking the UI. */
  async createTask(token, title) {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`createTask failed: ${res.status}`);
    return res.json();
  }
}
