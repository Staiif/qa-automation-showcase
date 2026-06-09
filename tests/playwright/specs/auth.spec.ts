import { test, expect } from '../fixtures';

test.describe('Authentification', () => {
  // Each test runs in a fresh browser context (empty localStorage) against a
  // backend reset for this worker — see the `resetData` fixture.

  test('refuse des identifiants invalides', async ({ loginPage, user }) => {
    await loginPage.goto();
    await loginPage.login(user.email, 'wrong-password');

    await loginPage.expectError(/invalide/i);
    await expect(loginPage.page.getByTestId('user-email')).toHaveCount(0);
  });

  test('connecte un utilisateur valide et affiche son email', async ({
    loginPage,
    taskBoard,
    user,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    await taskBoard.expectLoaded();
    await expect(taskBoard.userEmail).toHaveText(user.email);
  });

  test('persiste la session après un rechargement', async ({
    loginPage,
    taskBoard,
    user,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await taskBoard.expectLoaded();

    await loginPage.page.reload();

    await taskBoard.expectLoaded();
    await expect(taskBoard.userEmail).toHaveText(user.email);
  });

  test('déconnecte et revient à l’écran de login', async ({
    loginPage,
    taskBoard,
    user,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await taskBoard.expectLoaded();

    await taskBoard.logout.click();

    await expect(loginPage.submit).toBeVisible();
    await expect(taskBoard.heading).toHaveCount(0);
  });
});
