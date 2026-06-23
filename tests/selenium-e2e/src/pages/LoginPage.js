import { BasePage } from './BasePage.js';

/** Page Object for the login screen — mirrors tests/playwright/pages/LoginPage.ts. */
export class LoginPage extends BasePage {
  email = this.byId('login-email');
  password = this.byId('login-password');
  submit = this.byId('login-submit');
  error = this.byId('login-error');

  async open() {
    await this.goto('/');
  }

  async login(email, password) {
    await this.type(this.email, email);
    await this.type(this.password, password);
    await this.click(this.submit);
  }

  async errorText() {
    return this.text(this.error);
  }
}
