import {
  APP_PATH,
  APP_PATH_EXISTS,
  APP_ID,
  APP_ACTIVITY,
  DEVICE,
  AVD,
} from './src/support/env.js';

// Fail fast with an actionable message if the APK hasn't been built yet.
if (!APP_PATH_EXISTS) {
  throw new Error(
    `APK introuvable : ${APP_PATH}\n` +
      `Construisez l'app d'abord :\n` +
      `  (cd apps/mobile && npm install && cd android && ./gradlew assembleRelease)\n` +
      `ou définissez APP_PATH vers un .apk existant.`,
  );
}

const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': DEVICE,
  'appium:app': APP_PATH,
  'appium:appPackage': APP_ID,
  'appium:appActivity': APP_ACTIVITY,
  'appium:appWaitActivity': '*',
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 240,
  'appium:disableWindowAnimation': true,
  // Locally, let Appium boot the AVD itself; in CI the emulator is already up.
  ...(AVD ? { 'appium:avd': AVD } : {}),
};

export const config = {
  runner: 'local',
  port: 4723,

  specs: ['./src/specs/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [androidCapabilities],

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 15_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 2,

  // @wdio/appium-service starts a local Appium 2 server (needs the uiautomator2
  // driver: `npm run appium:driver`).
  services: [
    [
      'appium',
      {
        args: { address: '127.0.0.1', relaxedSecurity: true },
        logPath: './reports',
      },
    ],
  ],

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 240_000,
    retries: process.env.CI ? 1 : 0, // re-run a genuinely flaky test in CI
  },

  reporters: [
    'spec',
    ['junit', { outputDir: './reports', outputFileFormat: (opts) => `results-${opts.cid}.xml` }],
  ],
};
