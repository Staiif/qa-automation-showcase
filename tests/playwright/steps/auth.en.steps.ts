import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

Given('I am signed in', async ({ loginPage, taskBoard, user }) => {
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  await taskBoard.expectLoaded();
});

When('I sign in with valid credentials', async ({ loginPage, user }) => {
  await loginPage.login(user.email, user.password);
});

When('I sign in with a wrong password', async ({ loginPage, user }) => {
  await loginPage.login(user.email, 'wrong-password');
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

Then('I see my task board', async ({ taskBoard }) => {
  await taskBoard.expectLoaded();
});

Then('my email address is displayed', async ({ taskBoard, user }) => {
  await expect(taskBoard.userEmail).toHaveText(user.email);
});

Then('an error message is shown', async ({ loginPage }) => {
  await loginPage.expectError(/invalide/i);
});

Then('I stay on the login page', async ({ loginPage }) => {
  await expect(loginPage.submit).toBeVisible();
});
