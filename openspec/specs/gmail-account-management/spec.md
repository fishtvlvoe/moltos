# Gmail Account Management Specification

## Purpose

Defines the complete lifecycle of Gmail account management in MOLTOS: connecting, disconnecting, and switching Gmail accounts.

## Requirements

### Requirement: Disconnect Gmail Integration

The system SHALL allow users to disconnect their Gmail account while preserving their MOLTOS account and calm index history.

#### Scenario: Successful disconnection

- **WHEN** user confirms Gmail disconnection
- **THEN** system clears Gmail tokens, preserves account and history, shows "Not connected" state

### Requirement: Switch Gmail Account

The system SHALL allow users to switch to a different Gmail account without losing their MOLTOS account.

#### Scenario: Account switch via OAuth

- **WHEN** user initiates Gmail account switch
- **THEN** system opens Google OAuth with account selection, updates tokens upon success

### Requirement: Gmail Connection Status Display

The system SHALL display clear Gmail connection status: Connected, Not Connected, or Connecting.

#### Scenario: Connected state display

- **WHEN** user has valid Gmail tokens
- **THEN** settings page shows green "Connected" badge, email address, and action buttons

### Requirement: Gmail Disconnect API

The system SHALL provide a secure POST endpoint at `/api/gmail/disconnect` to handle disconnection.

#### Scenario: API endpoint

- **WHEN** authenticated user sends POST to `/api/gmail/disconnect`
- **THEN** system clears tokens and returns success response
