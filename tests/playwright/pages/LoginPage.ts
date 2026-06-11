import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@taskly/e2e-core';

/**
 * Page Object for the login screen — extends the shared BasePage.
 */
export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.email = this.byId('login-email');
    this.password = this.byId('login-password');
    this.submit = this.byId('login-submit');
    this.error = this.byId('login-error');
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.error).toBeVisible();
    await expect(this.error).toContainText(message);
  }
}
