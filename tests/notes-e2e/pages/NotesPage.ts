import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@taskly/e2e-core';

/** Page Object for the Notely board — extends the shared BasePage. */
export class NotesPage extends BasePage {
  readonly heading: Locator;
  readonly userEmail: Locator;
  readonly logout: Locator;
  readonly newNoteInput: Locator;
  readonly addButton: Locator;
  readonly items: Locator;
  readonly emptyState: Locator;
  readonly count: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Mes notes' });
    this.userEmail = this.byId('user-email');
    this.logout = this.byId('logout-button');
    this.newNoteInput = this.byId('new-note-input');
    this.addButton = this.byId('add-note-button');
    this.items = this.byId('note-item');
    this.emptyState = this.byId('empty-state');
    this.count = this.byId('note-count');
  }

  item(text: string): Locator {
    return this.items.filter({ hasText: text });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async addNote(text: string) {
    await this.newNoteInput.fill(text);
    await this.addButton.click();
    await expect(this.item(text)).toBeVisible();
  }

  async remove(text: string) {
    await this.item(text).getByTestId('note-delete').click();
    await expect(this.item(text)).toHaveCount(0);
  }
}
