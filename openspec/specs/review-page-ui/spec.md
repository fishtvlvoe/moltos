# Review Page UI Specification

## Purpose

Defines the UI design, button specifications, curve graph interaction, and card layout for the MOLTOS review page.

## Requirements

### Requirement: Calm Index Display

The system SHALL display calm index information on the review page using a curve graph showing trends over the last 14 days or 1 month.

#### Scenario: Curve graph with sufficient data

- **WHEN** user views review page with ≥14 days of email data
- **THEN** system displays a curve graph with dates on X-axis and calm index score on Y-axis

#### Scenario: Empty state for new accounts

- **WHEN** user has insufficient email history
- **THEN** review page displays clear messaging about the 14-day data requirement

### Requirement: Data Insufficient Message

The system SHALL communicate clearly when calm index data is unavailable due to insufficient email history.

#### Scenario: New account message

- **WHEN** user has fewer than 14 days of email history
- **THEN** system displays informative message explaining the data requirement
