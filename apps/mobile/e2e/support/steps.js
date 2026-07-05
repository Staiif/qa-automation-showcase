const { device, expect } = require('detox');
const loginScreen = require('./pages/LoginScreen');
const taskBoard = require('./pages/TaskBoardScreen');
const reporter = require('./logsReporter');

// Standalone demo app (no backend): credentials live in src/auth.ts.
const DEMO = { email: 'demo@taskly.app', password: 'password123' };

/**
 * Scenario name from Jest (strip the feature/describe prefix).
 * NB: the global `expect` is Detox's (exposeGlobals), which has no getState —
 * Jest's own expect must come from @jest/globals, only resolvable under Jest.
 */
function currentScenarioName() {
  try {
    const { expect: jestExpect } = require('@jest/globals');
    // Full Jest name (describe + test, space-separated) — kept as-is, the
    // feature prefix is informative and there is no reliable separator.
    return jestExpect.getState().currentTestName ?? 'unknown scenario';
  } catch {
    return 'unknown scenario';
  }
}

/** Per-file Detox lifecycle: launch once, reset state before each scenario. */
function setupHooks() {
  beforeAll(async () => {
    // detoxStudioLogs activates the in-app E2E logger for this launch only
    await device.launchApp({ newInstance: true, launchArgs: { detoxStudioLogs: true } });
    await reporter.startRun();
  });
  beforeEach(async () => {
    await device.reloadReactNative();
    await reporter.startScenario(currentScenarioName());
  });
  afterEach(async () => {
    await reporter.endScenario(currentScenarioName());
  });
}

/**
 * Wrap the jest-cucumber definers so every step streams its outcome to the
 * Logs Viewer (no-op when the logs-server is down or outside Jest).
 */
function instrument({ given, when, then }) {
  const wrap = (define) => (pattern, cb) => define(pattern, async (...args) => {
    const text = typeof pattern === 'string' ? pattern : String(pattern);
    try {
      await cb(...args);
      await reporter.reportStep(text, 'passed');
    } catch (error) {
      await reporter.reportStep(text, 'failed', error);
      throw error;
    }
  });
  return { given: wrap(given), when: wrap(when), then: wrap(then) };
}

/**
 * Step definitions (FR + EN) — all UI interactions go through the Page Objects
 * (LoginScreen / TaskBoardScreen), exactly like the web suite.
 * Loading a single-language feature only uses the matching subset.
 */
const steps = (definers) => {
  const { given, when, then } = instrument(definers);
  // ----- Français -----
  given('je suis sur la page de connexion', async () => {
    await loginScreen.expectVisible();
  });
  given('je suis connecté', async () => {
    await loginScreen.login(DEMO.email, DEMO.password);
    await taskBoard.expectLoaded();
  });
  when('je me connecte avec des identifiants valides', async () => {
    await loginScreen.login(DEMO.email, DEMO.password);
  });
  when('je me connecte avec un mauvais mot de passe', async () => {
    await loginScreen.login(DEMO.email, 'mauvais-mot-de-passe');
  });
  when('je me déconnecte', async () => {
    await taskBoard.logout.tap();
  });
  then('je vois mon tableau de tâches', async () => {
    await taskBoard.expectLoaded();
  });
  then('mon adresse email est affichée', async () => {
    await expect(taskBoard.userEmail).toHaveText(DEMO.email);
  });
  then("un message d'erreur s'affiche", async () => {
    await loginScreen.expectError();
  });
  then('je reviens à la page de connexion', async () => {
    await loginScreen.expectVisible();
  });
  given(/^la tâche "(.*)"$/, async (title) => {
    await taskBoard.addTask(title);
  });
  when(/^j'ajoute la tâche "(.*)"$/, async (title) => {
    await taskBoard.addTask(title);
  });
  when(/^je marque la tâche "(.*)" comme terminée$/, async (title) => {
    await taskBoard.toggle(title);
  });
  when(/^je supprime la tâche "(.*)"$/, async (title) => {
    await taskBoard.remove(title);
  });
  when(/^je filtre sur "(.*)"$/, async (label) => {
    await taskBoard.filter(label);
  });
  then(/^la tâche "(.*)" est visible$/, async (title) => {
    await expect(taskBoard.item(title)).toBeVisible();
  });
  then(/^la tâche "(.*)" n'est pas visible$/, async (title) => {
    await expect(taskBoard.item(title)).not.toBeVisible();
  });
  then(/^le compteur indique "(.*)"$/, async (text) => {
    await expect(taskBoard.activeCount).toHaveText(text);
  });

  // ----- English -----
  given('I am on the login page', async () => {
    await loginScreen.expectVisible();
  });
  given('I am signed in', async () => {
    await loginScreen.login(DEMO.email, DEMO.password);
    await taskBoard.expectLoaded();
  });
  when('I sign in with valid credentials', async () => {
    await loginScreen.login(DEMO.email, DEMO.password);
  });
  when('I sign in with a wrong password', async () => {
    await loginScreen.login(DEMO.email, 'wrong-password');
  });
  when('I sign out', async () => {
    await taskBoard.logout.tap();
  });
  then('I see my task board', async () => {
    await taskBoard.expectLoaded();
  });
  then('my email address is displayed', async () => {
    await expect(taskBoard.userEmail).toHaveText(DEMO.email);
  });
  then('an error message is shown', async () => {
    await loginScreen.expectError();
  });
  then('I return to the login page', async () => {
    await loginScreen.expectVisible();
  });
  given(/^the task "(.*)"$/, async (title) => {
    await taskBoard.addTask(title);
  });
  when(/^I add the task "(.*)"$/, async (title) => {
    await taskBoard.addTask(title);
  });
  when(/^I complete the task "(.*)"$/, async (title) => {
    await taskBoard.toggle(title);
  });
  when(/^I delete the task "(.*)"$/, async (title) => {
    await taskBoard.remove(title);
  });
  when(/^I filter on "(.*)"$/, async (label) => {
    await taskBoard.filter(label);
  });
  then(/^the task "(.*)" is visible$/, async (title) => {
    await expect(taskBoard.item(title)).toBeVisible();
  });
  then(/^the task "(.*)" is not visible$/, async (title) => {
    await expect(taskBoard.item(title)).not.toBeVisible();
  });
};

module.exports = { steps, setupHooks };
