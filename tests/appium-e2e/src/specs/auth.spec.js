import { expect } from '@wdio/globals';
import { LoginScreen } from '../screens/LoginScreen.js';
import { TaskBoardScreen } from '../screens/TaskBoardScreen.js';
import { relaunchApp } from '../support/app.js';
import { DEMO_USER } from '../support/env.js';

describe('Authentification (mobile)', () => {
  const login = new LoginScreen();
  const board = new TaskBoardScreen();

  beforeEach(async () => {
    await relaunchApp(); // fresh app each test, like Detox newInstance
  });

  it('connecte un utilisateur valide et affiche son tableau', async () => {
    await login.login(DEMO_USER.email, DEMO_USER.password);
    await board.expectLoaded();
    await expect(board.userEmail).toHaveText(DEMO_USER.email);
  });

  it('refuse des identifiants invalides avec un message d’erreur', async () => {
    await login.login(DEMO_USER.email, 'mauvais-mot-de-passe');
    await expect(login.error).toBeDisplayed();
    expect(await login.errorText()).toMatch(/invalide/i);
  });

  it('déconnecte et revient à l’écran de connexion', async () => {
    await login.login(DEMO_USER.email, DEMO_USER.password);
    await board.expectLoaded();
    await board.logOut();
    await login.expectVisible();
  });
});
