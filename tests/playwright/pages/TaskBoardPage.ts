import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object for the task board (the authenticated view).
 */
export class TaskBoardPage {
  readonly page: Page;
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
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Mes tâches' });
    this.userEmail = page.getByTestId('user-email');
    this.logout = page.getByTestId('logout-button');
    this.newTaskInput = page.getByTestId('new-task-input');
    this.addButton = page.getByTestId('add-task-button');
    this.items = page.getByTestId('task-item');
    this.activeCount = page.getByTestId('active-count');
    this.emptyState = page.getByTestId('empty-state');
    this.filterAll = page.getByTestId('filter-all');
    this.filterActive = page.getByTestId('filter-active');
    this.filterDone = page.getByTestId('filter-done');
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
