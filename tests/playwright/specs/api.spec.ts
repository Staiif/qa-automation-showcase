import { test, expect } from '../fixtures';
import { API_URL } from '../env';

/**
 * API-level tests — faster and more granular than UI tests, and the foundation
 * for the setup/teardown that keeps the UI suite isolated. The `resetData`
 * fixture wipes server state before each test.
 */
test.describe('API Taskly', () => {
  test('login échoue avec un mauvais mot de passe', async ({ request, user }) => {
    const res = await request.post(`${API_URL}/api/login`, {
      data: { email: user.email, password: 'mauvais' },
    });
    expect(res.status()).toBe(401);
  });

  test('login réussit et renvoie un token', async ({ taskApi }) => {
    const token = await taskApi.login();
    expect(token).toMatch(/^tok_/);
  });

  test('refuse l’accès aux tâches sans token', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/tasks`);
    expect(res.status()).toBe(401);
  });

  test('cycle de vie complet d’une tâche (create → toggle → delete)', async ({
    request,
    taskApi,
  }) => {
    const token = await taskApi.login();
    const headers = { Authorization: `Bearer ${token}` };

    // Create
    const created = await taskApi.createTask(token, 'Tâche via API');
    expect(created).toMatchObject({ title: 'Tâche via API', done: false });

    // Read
    const list = await (await request.get(`${API_URL}/api/tasks`, { headers })).json();
    expect(list).toHaveLength(1);

    // Update
    const patched = await request.patch(`${API_URL}/api/tasks/${created.id}`, {
      headers,
      data: { done: true },
    });
    expect((await patched.json()).done).toBe(true);

    // Delete
    const del = await request.delete(`${API_URL}/api/tasks/${created.id}`, { headers });
    expect(del.status()).toBe(204);

    const after = await (await request.get(`${API_URL}/api/tasks`, { headers })).json();
    expect(after).toHaveLength(0);
  });

  test('le teardown (reset) repart d’un état vide', async ({ request, taskApi }) => {
    const token = await taskApi.login();
    await taskApi.createTask(token, 'À nettoyer');

    await taskApi.reset();

    const headers = { Authorization: `Bearer ${token}` };
    const list = await (await request.get(`${API_URL}/api/tasks`, { headers })).json();
    expect(list).toEqual([]);
  });

  test('endpoint de reset protégé par secret', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/test/reset`, {
      headers: { 'x-test-secret': 'mauvais-secret' },
    });
    expect(res.status()).toBe(403);
  });
});
