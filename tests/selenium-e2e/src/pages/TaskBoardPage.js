import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';

// XPath string literal for a title (tasks in this app never contain quotes).
const xpathLiteral = (s) => (s.includes('"') ? `'${s}'` : `"${s}"`);

/** Page Object for the task board — mirrors tests/playwright/pages/TaskBoardPage.ts. */
export class TaskBoardPage extends BasePage {
  heading = By.css('#board-title');
  userEmail = this.byId('user-email');
  logout = this.byId('logout-button');
  newTaskInput = this.byId('new-task-input');
  addButton = this.byId('add-task-button');
  activeCount = this.byId('active-count');
  emptyState = this.byId('empty-state');
  taskItems = this.byId('task-item');
  filterAll = this.byId('filter-all');
  filterActive = this.byId('filter-active');
  filterDone = this.byId('filter-done');

  /** A single task row, located by its visible title. */
  item(title) {
    return By.xpath(
      `//li[@data-testid="task-item"][.//span[@data-testid="task-title" and normalize-space(.)=${xpathLiteral(
        title,
      )}]]`,
    );
  }

  async expectLoaded() {
    await this.visible(this.heading);
  }

  async addTask(title) {
    await this.type(this.newTaskInput, title);
    await this.click(this.addButton);
    await this.visible(this.item(title));
  }

  async toggle(title) {
    const row = await this.visible(this.item(title));
    await row.findElement(this.byId('task-checkbox')).click();
  }

  async remove(title) {
    const row = await this.visible(this.item(title));
    await row.findElement(this.byId('task-delete')).click();
    await this.driver.wait(
      async () => !(await this.isPresent(this.item(title))),
      this.timeout,
    );
  }

  async filter(which) {
    const button = { all: this.filterAll, active: this.filterActive, done: this.filterDone }[which];
    await this.click(button);
  }

  async titles() {
    const spans = await this.driver.findElements(this.byId('task-title'));
    return Promise.all(spans.map((s) => s.getText()));
  }

  async userEmailText() {
    return this.text(this.userEmail);
  }

  async activeCountText() {
    return this.text(this.activeCount);
  }

  async logOut() {
    await this.click(this.logout);
  }
}
