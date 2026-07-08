import { $, browser } from '@wdio/globals';

/**
 * Base Screen Object shared by every screen — the mobile counterpart of the web
 * BasePage. Encodes the team's stable selector convention: the RN `testID`.
 *
 * On Android a React Native `testID` surfaces either as the view's `resource-id`
 * (most views) or as `content-desc` (accessible touchables). We match **either**
 * via XPath, so the same `testID` the Detox suite uses works here unchanged.
 */
export class BaseScreen {
  constructor(timeout = 15_000) {
    this.timeout = timeout;
  }

  byId(id) {
    return $(`//*[@resource-id="${id}" or @content-desc="${id}"]`);
  }

  async waitVisible(el) {
    await el.waitForDisplayed({ timeout: this.timeout });
    return el;
  }

  /** Dismiss the soft keyboard if it's covering a control (best-effort). */
  async hideKeyboard() {
    try {
      if (await browser.isKeyboardShown()) await browser.hideKeyboard();
    } catch {
      /* no keyboard / not supported — ignore */
    }
  }
}
