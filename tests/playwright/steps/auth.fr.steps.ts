import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

Given('je suis sur la page de connexion', async ({ loginPage }) => {
  await loginPage.goto();
});

Given('je suis connecté', async ({ loginPage, taskBoard, user }) => {
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  await taskBoard.expectLoaded();
});

When('je me connecte avec des identifiants valides', async ({ loginPage, user }) => {
  await loginPage.login(user.email, user.password);
});

When('je me connecte avec un mauvais mot de passe', async ({ loginPage, user }) => {
  await loginPage.login(user.email, 'mauvais-mot-de-passe');
});

When('je recharge la page', async ({ page }) => {
  await page.reload();
});

Then('je vois mon tableau de tâches', async ({ taskBoard }) => {
  await taskBoard.expectLoaded();
});

Then('mon adresse email est affichée', async ({ taskBoard, user }) => {
  await expect(taskBoard.userEmail).toHaveText(user.email);
});

Then('un message d\'erreur s\'affiche', async ({ loginPage }) => {
  await loginPage.expectError(/invalide/i);
});

Then('je reste sur la page de connexion', async ({ loginPage }) => {
  await expect(loginPage.submit).toBeVisible();
});
