import { expect } from '@wdio/globals';
import { LoginScreen } from '../screens/LoginScreen.js';
import { TaskBoardScreen } from '../screens/TaskBoardScreen.js';
import { relaunchApp } from '../support/app.js';
import { DEMO_USER } from '../support/env.js';

describe('Tâches (mobile)', () => {
  const login = new LoginScreen();
  const board = new TaskBoardScreen();

  beforeEach(async () => {
    await relaunchApp();
    await login.login(DEMO_USER.email, DEMO_USER.password);
    await board.expectLoaded();
  });

  it('ajoute une tâche et incrémente le compteur', async () => {
    await board.addTask('Acheter du pain');
    await expect(board.item('Acheter du pain')).toBeDisplayed();
    await expect(board.activeCount).toHaveText('1 tâche à faire');
  });

  it('complète une tâche et la retrouve dans « Terminées »', async () => {
    await board.addTask('Faire les courses');
    await board.toggle('Faire les courses');

    await board.filter('done');
    await expect(board.item('Faire les courses')).toBeDisplayed();

    await board.filter('active');
    await expect(board.emptyState).toBeDisplayed();
  });

  it('supprime une tâche', async () => {
    await board.addTask('Tâche à supprimer');
    await board.remove('Tâche à supprimer');
    await expect(board.emptyState).toBeDisplayed();
  });

  it('n’ajoute rien quand le champ est vide', async () => {
    await board.addButton.click();
    await expect(board.activeCount).toHaveText('0 tâche à faire');
  });
});
