import { expect } from 'chai';
import { tokenFor } from '@taskly/e2e-core';
import { buildDriver } from '../support/driver.js';
import { ApiClient } from '../support/apiClient.js';
import { seedSession } from '../support/session.js';
import { TaskBoardPage } from '../pages/TaskBoardPage.js';
import { WORKER } from '../support/env.js';

describe('Tâches (UI)', function () {
  let driver;
  let board;
  const api = new ApiClient();

  beforeEach(async () => {
    await api.reset(WORKER.email);
    driver = await buildDriver();
    board = new TaskBoardPage(driver);
    // Skip the UI login by seeding a session — like the `authenticatedBoard` fixture.
    await seedSession(driver, WORKER);
    await board.expectLoaded();
  });

  afterEach(async () => {
    if (driver) await driver.quit();
  });

  it('ajoute une tâche et incrémente le compteur', async () => {
    await board.addTask('Acheter du pain');
    expect(await board.titles()).to.include('Acheter du pain');
    expect(await board.activeCountText()).to.equal('1 tâche à faire');
  });

  it('complète une tâche et la retrouve dans « Terminées »', async () => {
    await board.addTask('Faire les courses');
    await board.toggle('Faire les courses');

    await board.filter('done');
    expect(await board.titles()).to.include('Faire les courses');

    await board.filter('active');
    expect(await board.isPresent(board.emptyState)).to.equal(true);
  });

  it('supprime une tâche', async () => {
    await board.addTask('Tâche à supprimer');
    await board.remove('Tâche à supprimer');
    expect(await board.isPresent(board.emptyState)).to.equal(true);
  });

  it('affiche une tâche pré-créée via l’API', async () => {
    // Seed through the API, then assert the UI renders it (setup via API, check via UI).
    await api.createTask(tokenFor(WORKER.email), 'Tâche via API');
    await board.reload();
    await board.expectLoaded();
    expect(await board.titles()).to.include('Tâche via API');
  });

  it('n’ajoute rien quand le champ est vide', async () => {
    await board.click(board.addButton);
    expect(await board.isPresent(board.taskItems)).to.equal(false);
  });
});
