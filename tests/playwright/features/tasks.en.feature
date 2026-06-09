# language: en
@tasks
Feature: Task management
  In order to stay organised
  As a signed-in user
  I want to create, complete, delete and filter my tasks

  Background:
    Given I am signed in

  @smoke
  Scenario: Adding a task updates the counter
    When I add the task "Prepare the client quote"
    Then the task "Prepare the client quote" is visible
    And the active task count is 1

  Scenario: Completing a task
    Given the task "Set up CI"
    When I complete the task "Set up CI"
    Then the active task count is 0

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
    Then the displayed task count is <count>

    Examples:
      | filter | count |
      | All    | 2     |
      | To do  | 1     |
      | Done   | 1     |
