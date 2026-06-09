import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import type { TaskBoardPage } from '../pages/TaskBoardPage';

function filterButton(board: TaskBoardPage, label: string) {
  switch (label) {
    case 'À faire':
      return board.filterActive;
    case 'Terminées':
      return board.filterDone;
    default:
      return board.filterAll;
  }
}

Given('la tâche {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.addTask(title);
});

When('j\'ajoute la tâche {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.addTask(title);
});

When('je marque la tâche {string} comme terminée', async ({ taskBoard }, title: string) => {
  await taskBoard.toggle(title);
});

When('je supprime la tâche {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.remove(title);
});

When('je filtre sur {string}', async ({ taskBoard }, label: string) => {
  await filterButton(taskBoard, label).click();
});

Then('la tâche {string} est visible', async ({ taskBoard }, title: string) => {
  await expect(taskBoard.item(title)).toBeVisible();
});

Then('la tâche {string} n\'est pas visible', async ({ taskBoard }, title: string) => {
  await expect(taskBoard.item(title)).toHaveCount(0);
});

Then('le compteur indique {string}', async ({ taskBoard }, text: string) => {
  await expect(taskBoard.activeCount).toHaveText(text);
});

Then('le nombre de tâches affichées est {int}', async ({ taskBoard }, count: number) => {
  await expect(taskBoard.items).toHaveCount(count);
});
