import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

/**
 * Accessibility smoke tests. Catching WCAG violations automatically is a
 * cheap, high-signal addition to any E2E suite — and a strong selling point
 * for clients who care about compliance.
 */
test.describe('Accessibilité (axe-core)', () => {
  test('écran de login sans violation critique', async ({ loginPage }) => {
    await loginPage.goto();

    const results = await new AxeBuilder({ page: loginPage.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('tableau de tâches sans violation critique', async ({
    page,
    loginPage,
    taskBoard,
    user,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await taskBoard.expectLoaded();
    await taskBoard.addTask('Vérifier le contraste');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
