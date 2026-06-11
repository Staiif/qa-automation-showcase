// Same e2e-core as the Tasks suite — here on a plain @playwright/test base
// (no BDD), proving the shared core isn't tied to Cucumber.
import { test as base } from '@playwright/test';
import {
  makeAuthFixtures,
  ApiClient,
  seedSession,
  type E2EConfig,
} from '@taskly/e2e-core';
import { NotesPage } from './pages/NotesPage';
import { API_URL, DEMO_USER, TEST_SECRET } from './env';

interface Note {
  id: string;
  text: string;
}

const config: E2EConfig = {
  apiUrl: API_URL,
  testSecret: TEST_SECRET,
  demoUser: DEMO_USER,
  sessionKey: 'notes.session',
};

/** App-specific API client: domain methods on top of the shared ApiClient. */
class NotesApiClient extends ApiClient {
  createNote(token: string, text: string): Promise<Note> {
    return this.post<Note>('/api/notes', token, { text });
  }
}

interface NotesApi {
  reset(): Promise<void>;
  login(): Promise<string>;
  createNote(token: string, text: string): Promise<Note>;
}

interface Fixtures {
  notesPage: NotesPage;
  notesApi: NotesApi;
  authenticatedNotes: NotesPage;
}

export const test = makeAuthFixtures(base, config).extend<Fixtures>({
  notesApi: async ({ request, user }, use) => {
    const client = new NotesApiClient(request, config);
    await use({
      reset: () => client.reset(user.email),
      login: () => client.login(user),
      createNote: (token, text) => client.createNote(token, text),
    });
  },

  notesPage: async ({ page }, use) => {
    await use(new NotesPage(page));
  },

  authenticatedNotes: async ({ page, resetData: _reset, user }, use) => {
    await seedSession(page, config.sessionKey, user);
    const notes = new NotesPage(page);
    await page.goto('/');
    await notes.expectLoaded();
    await use(notes);
  },
});

export { expect } from '@playwright/test';
