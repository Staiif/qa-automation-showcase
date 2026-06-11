import { tokenFor } from './tokenFor.js';

/**
 * Base API client for test-data **setup & teardown**, shared by every suite.
 *
 * Apps subclass it and add their own domain methods (`createTask`,
 * `createNote`, …) — the exact pattern of a `BaseApiClient` + per-domain method
 * modules reused across a fleet of apps.
 *
 * @param request  Playwright APIRequestContext
 * @param config   { apiUrl, testSecret }
 */
export class ApiClient {
  constructor(request, config) {
    this.request = request;
    this.config = config;
  }

  /** Authenticate and return a bearer token. */
  async login(credentials) {
    const res = await this.request.post(`${this.config.apiUrl}/api/login`, {
      data: credentials,
    });
    return (await res.json()).token;
  }

  /** Tear down a single user's data — the core of per-worker isolation. */
  async reset(email) {
    await this.request.post(`${this.config.apiUrl}/api/test/reset`, {
      headers: {
        Authorization: `Bearer ${tokenFor(email)}`,
        'x-test-secret': this.config.testSecret,
      },
    });
  }

  /** Authenticated POST returning the parsed JSON body (for seeding data). */
  async post(path, token, data) {
    const res = await this.request.post(`${this.config.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }
}
