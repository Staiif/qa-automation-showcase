import { By, until } from 'selenium-webdriver';
import { BASE_URL } from '../support/env.js';

/**
 * Base Page Object shared by every screen — the Selenium counterpart of
 * e2e-core's BasePage. Holds the driver plus the common locator/wait helpers, so
 * each page only declares what's specific to it. `byId` encodes the team's stable
 * selector convention: `data-testid` (the same attribute the Playwright POM uses).
 */
export class BasePage {
  constructor(driver, timeout = 10_000) {
    this.driver = driver;
    this.timeout = timeout;
  }

  /** Locate by the stable `data-testid` selector. */
  byId(id) {
    return By.css(`[data-testid="${id}"]`);
  }

  async goto(pathname = '/') {
    await this.driver.get(new URL(pathname, BASE_URL).toString());
  }

  async reload() {
    await this.driver.navigate().refresh();
  }

  async find(locator) {
    return this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async visible(locator) {
    const el = await this.find(locator);
    return this.driver.wait(until.elementIsVisible(el), this.timeout);
  }

  async click(locator) {
    const el = await this.visible(locator);
    await this.driver.wait(until.elementIsEnabled(el), this.timeout);
    await el.click();
  }

  async type(locator, text) {
    const el = await this.visible(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  async text(locator) {
    return (await this.visible(locator)).getText();
  }

  async isPresent(locator) {
    return (await this.driver.findElements(locator)).length > 0;
  }
}
