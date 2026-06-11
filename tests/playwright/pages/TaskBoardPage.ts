import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@taskly/e2e-core';

/**
 * Page Object for the task board (authenticated view) — extends BasePage.
 */
export class TaskBoardPage extends BasePage {
  readonly heading: Locator;
  readonly userEmail: Locator;
  readonly logout: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly items: Locator;
  readonly activeCount: Locator;
  readonly emptyState: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterDone: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.getByRole('heading', { name: 'Mes tâches' });
    this.userEmail = this.byId('user-email');
    this.logout = this.byId('logout-button');
    this.newTaskInput = this.byId('new-task-input');
    this.addButton = this.byId('add-task-button');
    this.items = this.byId('task-item');
    this.activeCount = this.byId('active-count');
    this.emptyState = this.byId('empty-state');
    this.filterAll = this.byId('filter-all');
    this.filterActive = this.byId('filter-active');
    this.filterDone = this.byId('filter-done');
  }

  /** A single task row, located by its visible title. */
  item(title: string): Locator {
    return this.items.filter({ hasText: title });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async addTask(title: string) {
    await this.newTaskInput.fill(title);
    await this.addButton.click();
    await expect(this.item(title)).toBeVisible();
  }

  async toggle(title: string) {
    await this.item(title).getByTestId('task-checkbox').click();
  }

  async remove(title: string) {
    await this.item(title).getByTestId('task-delete').click();
    await expect(this.item(title)).toHaveCount(0);
  }
}
