/**
 * Base Page Object shared by every app's E2E suite.
 *
 * Holds the Playwright `page` plus the common locator/navigation helpers, so
 * each app only declares what's specific to its own screens. This is the web
 * equivalent of a shared `BasePage` / `CommonPage` reused across a fleet of apps.
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /** Locate an element by its data-testid (the stable selector convention). */
  byId(id) {
    return this.page.getByTestId(id);
  }

  /** Navigate to a path, relative to the project's baseURL. */
  async goto(path = '/') {
    await this.page.goto(path);
  }

  async reload() {
    await this.page.reload();
  }
}
