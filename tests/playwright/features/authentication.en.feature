# language: en
@auth
Feature: Authentication
  In order to manage my tasks securely
  As a user
  I want to sign in to Taskly

  @smoke
  Scenario: Sign in with valid credentials
    Given I am on the login page
    When I sign in with valid credentials
    Then I see my task board
    And my email address is displayed

  Scenario: Sign in rejected with a wrong password
    Given I am on the login page
    When I sign in with a wrong password
    Then an error message is shown
    And I stay on the login page

  Scenario: Session survives a reload
    Given I am signed in
    When I reload the page
    Then I see my task board
