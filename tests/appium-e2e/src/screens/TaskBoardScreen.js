import { BaseScreen } from './BaseScreen.js';

/** Screen Object for the mobile task board — mirrors the Detox TaskBoardScreen. */
export class TaskBoardScreen extends BaseScreen {
  get title() {
    return this.byId('board-title');
  }
  get userEmail() {
    return this.byId('user-email');
  }
  get logout() {
    return this.byId('logout-button');
  }
  get newTaskInput() {
    return this.byId('new-task-input');
  }
  get addButton() {
    return this.byId('add-task-button');
  }
  get activeCount() {
    return this.byId('active-count');
  }
  get emptyState() {
    return this.byId('empty-state');
  }

  // Rows carry their title in the testID (task-item-<title>), like the Detox suite.
  item(title) {
    return this.byId(`task-item-${title}`);
  }

  async expectLoaded() {
    await this.waitVisible(this.title);
  }

  async addTask(title) {
    await this.newTaskInput.setValue(title);
    await this.hideKeyboard();
    await this.addButton.click();
    await this.waitVisible(this.item(title));
  }

  async toggle(title) {
    await this.byId(`task-toggle-${title}`).click();
  }

  async remove(title) {
    await this.byId(`task-delete-${title}`).click();
  }

  async filter(which) {
    await this.byId(`filter-${which}`).click();
  }

  async logOut() {
    await this.logout.click();
  }
}
