# Privacy and Data Management Specification

## Purpose

Defines the system's capability to provide users with privacy settings, data usage policies, and data deletion options.

## Requirements

## ADDED Requirements

### Requirement: System displays data usage policy

The system SHALL display a clear, user-friendly privacy policy describing how user data is collected, processed, and protected.

#### Scenario: View privacy policy text

- **WHEN** user navigates to `/settings/privacy`
- **THEN** system displays the full privacy policy in a scrollable section

#### Scenario: Policy includes data categories

- **WHEN** user reads the policy
- **THEN** policy covers: email data, conversation history, calm index data, usage analytics

### Requirement: System provides privacy preference toggles

The system SHALL allow users to control privacy-related settings including personalization, analytics, and recommendations.

#### Scenario: Enable email recommendations

- **WHEN** user toggles "Allow personalized email recommendations" to ON
- **THEN** system updates the database and displays success message

#### Scenario: Disable analytics

- **WHEN** user toggles "Allow usage analytics" to OFF
- **THEN** system updates the database and stops collecting analytics data for this user

#### Scenario: Multiple privacy toggles

- **WHEN** user views privacy settings
- **THEN** system displays at least three independent toggles: personalization, analytics, recommendations

### Requirement: User can delete personal data

The system SHALL provide a clear, accessible way for users to delete their personal data including conversations, calm index history, and preferences.

#### Scenario: Initiate data deletion

- **WHEN** user clicks "Delete All Data" or "Clear All Conversation Data" in the privacy section
- **THEN** system displays a confirmation dialog with warning: "This action cannot be undone. All conversation history and calm index data will be deleted."

#### Scenario: Confirm data deletion

- **WHEN** user confirms data deletion in the dialog
- **THEN** system:
  1. Deletes all conversation records for the user
  2. Clears calm index history
  3. Resets all preferences to defaults
  4. Displays success message
  5. Optionally logs the deletion action for audit purposes

#### Scenario: Data deletion error handling

- **WHEN** data deletion fails (database error, partial failure)
- **THEN** system displays error message and does NOT partially delete data (transaction-based consistency)

### Requirement: Page follows consistent UI pattern

The privacy and data management page SHALL follow the same layout and component structure as the Gmail Settings page for consistency.

#### Scenario: Page header and back button

- **WHEN** user opens the privacy and data management page
- **THEN** system displays a back arrow ("←") and page title "隱私與資料"

#### Scenario: Policy card, settings card, and danger zone card

- **WHEN** user views the privacy page
- **THEN** system displays:
  1. Policy card (read-only) with privacy policy text
  2. Settings card with privacy preference toggles
  3. Danger Zone card (red background) with data deletion button

### Requirement: Data deletion is integrated with existing clear data function

The privacy page's data deletion SHALL reuse the existing `ClearUserDataSection` component or call the same backend API for consistency.

#### Scenario: Use existing deletion flow

- **WHEN** user clicks delete in privacy page
- **THEN** system uses the same deletion logic as the existing Settings page clear data section

#### Scenario: Display success message from deletion

- **WHEN** data deletion completes
- **THEN** system displays the same success message as existing deletion: "已清除所有對話資料"
