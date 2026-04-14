# Reminder Schedules Specification

## Purpose

Defines the system's capability to allow users to configure daily reminders with customizable time, frequency, and content type.

## Requirements

## ADDED Requirements

### Requirement: User can view reminder schedule

The system SHALL display the current reminder configuration including enabled/disabled state, scheduled time (24-hour format HH:MM), frequency (daily/weekly), and reminder types (calm index, chat summary).

#### Scenario: View enabled reminder schedule

- **WHEN** user navigates to `/settings/reminders` with an enabled schedule
- **THEN** system displays: enabled toggle (ON), time picker showing saved time, frequency dropdown, and type checkboxes with saved selections

#### Scenario: View disabled reminder schedule

- **WHEN** user navigates to `/settings/reminders` with a disabled schedule
- **THEN** system displays the schedule configuration grayed out or with a disabled state indicator

#### Scenario: View default reminder schedule (first time)

- **WHEN** user navigates to `/settings/reminders` for the first time
- **THEN** system displays defaults: disabled, time 09:00, frequency daily, types: [calm_index]

### Requirement: User can enable/disable reminders

The system SHALL allow users to toggle the reminder feature on or off. When disabled, reminders SHALL NOT be sent.

#### Scenario: Enable reminders

- **WHEN** user toggles the reminder enabled switch to ON
- **THEN** system saves the state to the database and displays success message

#### Scenario: Disable reminders

- **WHEN** user toggles the reminder enabled switch to OFF
- **THEN** system saves the state to the database and stops sending reminders

### Requirement: User can set reminder time

The system SHALL allow users to set a custom reminder time in 24-hour format (HH:MM). Valid times are 00:00 to 23:59.

#### Scenario: Set reminder to morning time

- **WHEN** user selects 07:30 in the time picker
- **THEN** system updates the database and displays success message

#### Scenario: Set reminder to evening time

- **WHEN** user selects 20:45 in the time picker
- **THEN** system updates the database and displays success message

#### Scenario: Invalid time input

- **WHEN** user enters an invalid time (e.g., 25:00)
- **THEN** system displays an error message and does not save the change

### Requirement: User can select reminder frequency

The system SHALL allow users to choose reminder frequency: daily (every day) or weekly (specific day of week). Default is daily.

#### Scenario: Set daily reminders

- **WHEN** user selects "daily" frequency option
- **THEN** system updates the database to send reminders every day at the configured time

#### Scenario: Set weekly reminders

- **WHEN** user selects "weekly" frequency option AND selects days (e.g., Monday, Wednesday, Friday)
- **THEN** system updates the database to send reminders only on selected days

### Requirement: User can select reminder content types

The system SHALL allow users to independently enable or disable reminder types: calm index summary and chat summary. Users SHALL be able to select multiple types.

#### Scenario: Select calm index reminder only

- **WHEN** user checks "Calm Index Summary" and unchecks "Chat Summary"
- **THEN** system saves the selection and will send only calm index reminders

#### Scenario: Select multiple reminder types

- **WHEN** user checks both "Calm Index Summary" and "Chat Summary"
- **THEN** system saves the selection and will send reminders for both types

#### Scenario: No reminder types selected

- **WHEN** user unchecks all reminder types
- **THEN** system displays a warning ("Please select at least one reminder type") and does not allow saving

### Requirement: Page follows consistent UI pattern

The reminder settings page SHALL follow the same layout and component structure as the Gmail Settings page for consistency.

#### Scenario: Page header and back button

- **WHEN** user opens the reminder settings page
- **THEN** system displays a back arrow ("←") and page title "提醒排程"

#### Scenario: Status card and form card

- **WHEN** user views the reminders page
- **THEN** system displays a status section showing current schedule state and a form section with all configuration controls
