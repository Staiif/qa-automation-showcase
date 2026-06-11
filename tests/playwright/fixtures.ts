import { test as base } from 'playwright-bdd';
import {
  makeAuthFixtures,
  ApiClient,
  seedSession,
  type E2EConfig,
} from '@taskly/e2e-core';
import { LoginPage } from './pages/LoginPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { API_URL, DEMO_USER, TEST_SECRET } from './env';

export { DEMO_USER };

interface Task {
  id: string;
  title: string;
  done: boolean;
}

const config: E2EConfig = {
  apiUrl: API_URL,
  testSecret: TEST_SECRET,
  demoUser: DEMO_USER,
  sessionKey: 'taskly.session',
};

/** App-specific API client: domain methods on top of the shared ApiClient. */
class TaskApiClient extends ApiClient {
  createTask(token: string, title: string): Promise<Task> {
    return this.post<Task>('/api/tasks', token, { title });
  }
}

interface TaskApi {
  reset(): Promise<void>;
  login(): Promise<string>;
  createTask(token: string, title: string): Promise<Task>;
}

interface Fixtures {
  loginPage: LoginPage;
  taskBoard: TaskBoardPage;
  taskApi: TaskApi;
  /** A board past authentication, against a freshly reset backend. */
  authenticatedBoard: TaskBoardPage;
}

// makeAuthFixtures adds the shared `user` (per-worker) + autouse `resetData`.
export const test = makeAuthFixtures(base, config).extend<Fixtures>({
  taskApi: async ({ request, user }, use) => {
    const client = new TaskApiClient(request, config);
    await use({
      reset: () => client.reset(user.email),
      login: () => client.login(user),
      createTask: (token, title) => client.createTask(token, title),
    });
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  taskBoard: async ({ page }, use) => {
    await use(new TaskBoardPage(page));
  },

  authenticatedBoard: async ({ page, resetData: _reset, user }, use) => {
    await seedSession(page, config.sessionKey, user);
    const board = new TaskBoardPage(page);
    await page.goto('/');
    await board.expectLoaded();
    await use(board);
  },
});

export { expect } from '@playwright/test';
