import { browser } from '@wdio/globals';
import { APP_ID } from './env.js';

/**
 * Restart the app to a clean state between tests — the Appium equivalent of
 * Detox's `device.launchApp({ newInstance: true })`. The RN app keeps tasks in
 * memory only, so a relaunch is enough to isolate each scenario.
 */
export async function relaunchApp() {
  await browser.execute('mobile: terminateApp', { appId: APP_ID });
  await browser.execute('mobile: activateApp', { appId: APP_ID });
}
