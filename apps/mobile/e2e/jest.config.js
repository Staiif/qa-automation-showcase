/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  // Safe default = 1 worker / 1 emulator. For parallelism, override on the CLI
  // (detox test --maxWorkers N) AND let Detox boot N emulators.
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    [
      'jest-html-reporters',
      {
        publicPath: './reports/mobile',
        filename: 'index.html',
        pageTitle: 'Taskly — Mobile E2E (Detox · Gherkin FR + EN)',
        darkTheme: true,
        expand: true,
      },
    ],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
