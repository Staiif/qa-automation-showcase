import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { HEADLESS } from './env.js';

/**
 * Build a Chrome WebDriver. Selenium 4 bundles Selenium Manager, so the matching
 * chromedriver is resolved automatically — no WebDriverManager / manual download.
 *
 * We set NO implicit wait on purpose: the Page Objects use explicit waits only
 * (mixing the two is the classic source of flaky Selenium suites).
 */
export async function buildDriver() {
  const options = new chrome.Options();
  if (HEADLESS) options.addArguments('--headless=new');
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,900',
    '--lang=fr-FR',
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ pageLoad: 30_000 });
  return driver;
}
