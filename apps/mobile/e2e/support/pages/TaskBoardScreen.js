const { element, by, expect } = require('detox');

/**
 * Page Object for the mobile task board (parity with the web TaskBoardPage).
 */
class TaskBoardScreen {
  get title() {
    return element(by.id('board-title'));
  }
  get userEmail() {
    return element(by.id('user-email'));
  }
  get logout() {
    return element(by.id('logout-button'));
  }
  get newTaskInput() {
    return element(by.id('new-task-input'));
  }
  get activeCount() {
    return element(by.id('active-count'));
  }

  /** A task row, located by its title. */
  item(title) {
    return element(by.id(`task-item-${title}`));
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
  }

  async addTask(title) {
    await this.newTaskInput.replaceText(title);
    await this.newTaskInput.tapReturnKey();
    await expect(this.item(title)).toBeVisible();
  }

  async toggle(title) {
    await element(by.id(`task-toggle-${title}`)).tap();
  }

  async remove(title) {
    await element(by.id(`task-delete-${title}`)).tap();
  }

  async filter(label) {
    await element(by.id(this._filterId(label))).tap();
  }

  _filterId(label) {
    switch (label) {
      case 'À faire':
      case 'To do':
        return 'filter-active';
      case 'Terminées':
      case 'Done':
        return 'filter-done';
      default:
        return 'filter-all';
    }
  }
}

module.exports = new TaskBoardScreen();
