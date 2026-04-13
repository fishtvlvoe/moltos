# Insights Collapse UI Specification

## Purpose

Defines the collapsible card interaction for displaying conversation insights on the review page, allowing users to toggle the insights list visibility.

## ADDED Requirements

### Requirement: Insights card collapse state

The system SHALL display the conversation insights section in a collapsible card format, with a toggle button that controls visibility of the insights list.

#### Scenario: Collapsed insights section (default)

- **WHEN** user views the review page
- **THEN** system displays the insights section in collapsed state with heading "▼ 對話洞察 ({count} 筆)" where {count} is the number of insights
- **AND** the individual insight cards are NOT visible

#### Scenario: User expands insights

- **WHEN** user clicks on the collapsed insights heading
- **THEN** system expands the section to show heading "▲ 對話洞察"
- **AND** all insight cards become visible below the heading
- **AND** the section heading remains clickable to collapse

#### Scenario: User collapses expanded insights

- **WHEN** user clicks on the expanded insights heading
- **THEN** system collapses the section
- **AND** individual insight cards become hidden
- **AND** heading returns to "▼ 對話洞察 ({count} 筆)"

### Requirement: Insights collapse state persistence

The system SHALL manage the collapse state locally for the current session (no persistence across page reloads).

#### Scenario: Collapse state resets on page reload

- **WHEN** user reloads the review page
- **THEN** insights section returns to collapsed state (default)
