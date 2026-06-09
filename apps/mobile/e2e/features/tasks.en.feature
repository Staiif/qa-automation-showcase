# language: en
@tasks
Feature: Task management (mobile)
  As a signed-in user
  I want to manage my tasks on mobile

  Background:
    Given I am signed in

  @smoke
  Scenario: Adding a task
    When I add the task "Prepare the quote"
    Then the task "Prepare the quote" is visible

  Scenario: Completing a task hides it from the To-do filter
    Given the task "Set up CI"
    When I complete the task "Set up CI"
    And I filter on "To do"
    Then the task "Set up CI" is not visible

  Scenario: Deleting a task
    Given the task "Throwaway task"
    When I delete the task "Throwaway task"
    Then the task "Throwaway task" is not visible

  @filter
  Scenario Outline: Filtering tasks
    Given the task "Active 1"
    And the task "Done 1"
    And I complete the task "Done 1"
    When I filter on "<filter>"
    Then the task "<visible>" is visible

    Examples:
      | filter | visible  |
      | To do  | Active 1 |
      | Done   | Done 1   |
