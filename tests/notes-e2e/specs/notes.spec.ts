import { test, expect } from '../fixtures';
import { API_URL } from '../env';

test.describe('Notely (2e app sur e2e-core)', () => {
  test('login échoue avec un mauvais mot de passe', async ({ request, user }) => {
    const res = await request.post(`${API_URL}/api/login`, {
      data: { email: user.email, password: 'mauvais' },
    });
    expect(res.status()).toBe(401);
  });

  test('cycle de vie d’une note via l’API (create → delete)', async ({
    request,
    notesApi,
  }) => {
    const token = await notesApi.login();
    const created = await notesApi.createNote(token, 'Note via API');
    expect(created).toMatchObject({ text: 'Note via API' });

    const headers = { Authorization: `Bearer ${token}` };
    const list = await (await request.get(`${API_URL}/api/notes`, { headers })).json();
    expect(list).toHaveLength(1);

    const del = await request.delete(`${API_URL}/api/notes/${created.id}`, { headers });
    expect(del.status()).toBe(204);
  });

  test('ajoute puis supprime une note (UI)', async ({
    authenticatedNotes: notes,
  }) => {
    await expect(notes.emptyState).toBeVisible();

    await notes.addNote('Acheter du café');
    await expect(notes.count).toHaveText('1 note');

    await notes.remove('Acheter du café');
    await expect(notes.emptyState).toBeVisible();
  });

  test('affiche une note pré-créée via l’API (seed)', async ({
    page,
    notesApi,
    authenticatedNotes: notes,
  }) => {
    const token = await notesApi.login();
    await notesApi.createNote(token, 'Créée côté serveur');

    await page.reload();
    await notes.expectLoaded();
    await expect(notes.item('Créée côté serveur')).toBeVisible();
  });
});
