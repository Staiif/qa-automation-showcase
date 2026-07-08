import { BaseScreen } from './BaseScreen.js';

/** Screen Object for the mobile login screen — mirrors the Detox LoginScreen. */
export class LoginScreen extends BaseScreen {
  get email() {
    return this.byId('login-email');
  }
  get password() {
    return this.byId('login-password');
  }
  get submit() {
    return this.byId('login-submit');
  }
  get error() {
    return this.byId('login-error');
  }

  async login(email, password) {
    await this.waitVisible(this.email);
    await this.email.setValue(email);
    await this.password.setValue(password);
    await this.hideKeyboard();
    await this.submit.click();
  }

  async expectVisible() {
    await this.waitVisible(this.submit);
  }

  async errorText() {
    await this.waitVisible(this.error);
    return this.error.getText();
  }
}
