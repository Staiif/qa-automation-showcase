const { element, by, expect } = require('detox');

/**
 * Page Object for the mobile login screen (parity with the web LoginPage).
 * Keeps Detox matchers in one place so steps read like user intent.
 */
class LoginScreen {
  get email() {
    return element(by.id('login-email'));
  }
  get password() {
    return element(by.id('login-password'));
  }
  get submit() {
    return element(by.id('login-submit'));
  }
  get error() {
    return element(by.id('login-error'));
  }

  async login(email, password) {
    await this.email.replaceText(email);
    await this.password.replaceText(password);
    // Submit via the keyboard "go" key — avoids a button hidden by the keyboard.
    await this.password.tapReturnKey();
  }

  async expectVisible() {
    await expect(this.submit).toBeVisible();
  }

  async expectError() {
    await expect(this.error).toBeVisible();
  }
}

module.exports = new LoginScreen();
