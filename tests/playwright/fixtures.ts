// Base test comes from playwright-bdd (a superset of @playwright/test) so the
// same fixtures power both the TS specs and the Gherkin step definitions.
import { test as base } from 'playwright-bdd';
import { LoginPage } from './pages/LoginPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { API_URL, DEMO_USER, TEST_SECRET } from './env';

export { DEMO_USER };

interface Task {
  id: string;
  title: string;
  done: boolean;
}

interface Credentials {
  email: string;
  password: string;
}

interface TaskApi {
  /** Tear down this worker's server-side data. */
  reset(): Promise<void>;
  /** Authenticate the worker's user and return a bearer token. */
  login(): Promise<string>;
  /** Seed a task directly via the API (test data creation). */
  createTask(token: string, title: string): Promise<Task>;
}

interface Fixtures {
  /** A per-parallel-slot account, so parallel tests never share data. */
  user: Credentials;
  loginPage: LoginPage;
  taskBoard: TaskBoardPage;
  taskApi: TaskApi;
  /** A board past authentication, against a freshly reset backend. */
  authenticatedBoard: TaskBoardPage;
  /** Autouse: resets this worker's server state before each test. */
  resetData: void;
}

/** Mirrors the API's token scheme so we can seed sessions without a UI login. */
function tokenFor(email: string): string {
  return `tok_${Buffer.from(email).toString('base64')}`;
}

export const test = base.extend<Fixtures>({
  // Isolation: each parallel slot logs in as `demo+wN@…`, an account the API
  // accepts by convention. Parallel tests therefore operate on disjoint data.
  user: async ({}, use) => {
    const [local, domain] = DEMO_USER.email.split('@');
    await use({
      email: `${local}+w${test.info().parallelIndex}@${domain}`,
      password: DEMO_USER.password,
    });
  },

  // Runs before every test: teardown of THIS worker's data so each test starts
  // from a known-empty backend, without disturbing other parallel workers.
  resetData: [
    async ({ request, user }, use) => {
      await request.post(`${API_URL}/api/test/reset`, {
        headers: {
          Authorization: `Bearer ${tokenFor(user.email)}`,
          'x-test-secret': TEST_SECRET,
        },
      });
      await use();
    },
    { auto: true },
  ],

  taskApi: async ({ request, user }, use) => {
    const api: TaskApi = {
      async reset() {
        await request.post(`${API_URL}/api/test/reset`, {
          headers: {
            Authorization: `Bearer ${tokenFor(user.email)}`,
            'x-test-secret': TEST_SECRET,
          },
        });
      },
      async login() {
        const res = await request.post(`${API_URL}/api/login`, { data: user });
        return (await res.json()).token as string;
      },
      async createTask(token, title) {
        const res = await request.post(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { title },
        });
        return (await res.json()) as Task;
      },
    };
    await use(api);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  taskBoard: async ({ page }, use) => {
    await use(new TaskBoardPage(page));
  },

  // Depends on resetData so the backend is empty before we navigate; injects a
  // valid session token for this worker's user to skip the UI login.
  authenticatedBoard: async ({ page, resetData: _reset, user }, use) => {
    await page.addInitScript(
      ({ email, token }) => {
        window.localStorage.setItem(
          'taskly.session',
          JSON.stringify({ email, token }),
        );
      },
      { email: user.email, token: tokenFor(user.email) },
    );

    const board = new TaskBoardPage(page);
    await page.goto('/');
    await board.expectLoaded();
    await use(board);
  },
});

export { expect } from '@playwright/test';
