import { test, expect } from '../fixtures';

test.describe('Gestion des tâches', () => {
  test('ajoute une tâche et met à jour le compteur', async ({
    authenticatedBoard: board,
  }) => {
    await expect(board.emptyState).toBeVisible();
    await expect(board.activeCount).toHaveText('0 tâche à faire');

    await board.addTask('Préparer le devis client');

    await expect(board.items).toHaveCount(1);
    await expect(board.activeCount).toHaveText('1 tâche à faire');
  });

  test('marque une tâche comme terminée', async ({
    authenticatedBoard: board,
  }) => {
    await board.addTask('Configurer la CI');
    await board.toggle('Configurer la CI');

    const title = board.item('Configurer la CI').getByTestId('task-title');
    await expect(title).toHaveClass(/done/);
    await expect(board.activeCount).toHaveText('0 tâche à faire');
  });

  test('supprime une tâche', async ({ authenticatedBoard: board }) => {
    await board.addTask('Tâche jetable');
    await board.remove('Tâche jetable');

    await expect(board.items).toHaveCount(0);
    await expect(board.emptyState).toBeVisible();
  });

  test('filtre entre tâches à faire et terminées', async ({
    authenticatedBoard: board,
  }) => {
    await board.addTask('À faire 1');
    await board.addTask('À faire 2');
    await board.addTask('Bientôt terminée');
    await board.toggle('Bientôt terminée');

    await board.filterActive.click();
    await expect(board.items).toHaveCount(2);
    await expect(board.item('Bientôt terminée')).toHaveCount(0);

    await board.filterDone.click();
    await expect(board.items).toHaveCount(1);
    await expect(board.item('Bientôt terminée')).toBeVisible();

    await board.filterAll.click();
    await expect(board.items).toHaveCount(3);
  });

  test('conserve les tâches après un rechargement (persistées via API)', async ({
    authenticatedBoard: board,
  }) => {
    await board.addTask('Persistante');
    await board.page.reload();

    await board.expectLoaded();
    await expect(board.item('Persistante')).toBeVisible();
  });

  test('affiche une tâche pré-créée via l’API (seed)', async ({
    page,
    taskApi,
    authenticatedBoard: board,
  }) => {
    // Seed data through the API, then assert the UI reflects it on reload.
    const token = await taskApi.login();
    await taskApi.createTask(token, 'Créée côté serveur');

    await page.reload();
    await board.expectLoaded();
    await expect(board.item('Créée côté serveur')).toBeVisible();
  });

  test('ignore une tâche vide', async ({ authenticatedBoard: board }) => {
    await board.newTaskInput.fill('   ');
    await board.addButton.click();

    await expect(board.items).toHaveCount(0);
    await expect(board.emptyState).toBeVisible();
  });
});
