import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures';

// Bind the Gherkin steps to our extended `test`, so step definitions get the
// same fixtures as the rest of the suite: per-worker `user`, Page Objects,
// `taskApi`, and the autouse `resetData` teardown.
export const { Given, When, Then } = createBdd(test);
