const { loadFeature, autoBindSteps } = require('jest-cucumber');
const { steps, setupHooks } = require('./support/steps');

setupHooks();
autoBindSteps(
  [loadFeature('e2e/features/authentication.en.feature', { tagFilter: process.env.CUCUMBER_TAGS })],
  [steps],
);
