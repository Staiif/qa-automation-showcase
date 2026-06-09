import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import type { TaskBoardPage } from '../pages/TaskBoardPage';

function filterButton(board: TaskBoardPage, label: string) {
  switch (label) {
    case 'To do':
      return board.filterActive;
    case 'Done':
      return board.filterDone;
    default:
      return board.filterAll;
  }
}

Given('the task {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.addTask(title);
});

When('I add the task {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.addTask(title);
});

When('I complete the task {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.toggle(title);
});

When('I delete the task {string}', async ({ taskBoard }, title: string) => {
  await taskBoard.remove(title);
});

When('I filter on {string}', async ({ taskBoard }, label: string) => {
  await filterButton(taskBoard, label).click();
});

Then('the task {string} is visible', async ({ taskBoard }, title: string) => {
  await expect(taskBoard.item(title)).toBeVisible();
});

Then('the task {string} is not visible', async ({ taskBoard }, title: string) => {
  await expect(taskBoard.item(title)).toHaveCount(0);
});

Then('the active task count is {int}', async ({ taskBoard }, count: number) => {
  // Language-neutral: assert the leading number of "N tâche(s) à faire".
  await expect(taskBoard.activeCount).toHaveText(new RegExp(`^${count}\\b`));
});

Then('the displayed task count is {int}', async ({ taskBoard }, count: number) => {
  await expect(taskBoard.items).toHaveCount(count);
});
