import { expect } from 'chai';
import { buildDriver } from '../support/driver.js';
import { ApiClient } from '../support/apiClient.js';
import { LoginPage } from '../pages/LoginPage.js';
import { TaskBoardPage } from '../pages/TaskBoardPage.js';
import { WORKER } from '../support/env.js';

describe('Authentification (UI)', function () {
  let driver;
  let login;
  let board;
  const api = new ApiClient();

  beforeEach(async () => {
    // Tear down this worker's data first — the equivalent of the Playwright
    // autouse `resetData` fixture. Keeps the suite isolated and repeatable.
    await api.reset(WORKER.email);
    driver = await buildDriver();
    login = new LoginPage(driver);
    board = new TaskBoardPage(driver);
  });

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  it('connecte un utilisateur valide et affiche son tableau', async () => {
    await login.open();
    await login.login(WORKER.email, WORKER.password);
    await board.expectLoaded();
    expect(await board.userEmailText()).to.equal(WORKER.email);
  });

  it('refuse des identifiants invalides avec un message d’erreur', async () => {
    await login.open();
    await login.login(WORKER.email, 'mauvais-mot-de-passe');
    expect(await login.errorText()).to.match(/invalide/i);
  });

  it('garde la session après un rechargement', async () => {
    await login.open();
    await login.login(WORKER.email, WORKER.password);
    await board.expectLoaded();
    await board.reload();
    await board.expectLoaded(); // session persisted in localStorage
  });

  it('déconnecte et revient à l’écran de connexion', async () => {
    await login.open();
    await login.login(WORKER.email, WORKER.password);
    await board.expectLoaded();
    await board.logOut();
    await login.visible(login.email);
  });
});
