# language: en
@auth
Feature: Authentication (mobile)
  As a mobile app user
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

  Scenario: Sign out
    Given I am signed in
    When I sign out
    Then I return to the login page
