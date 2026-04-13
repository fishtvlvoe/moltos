# Gmail Integration Specification

## Purpose

Defines Gmail OAuth integration for MOLTOS, including initial connection, token management, and account lifecycle.

## Requirements

### Requirement: OAuth Authorization Flow

The system SHALL support Google OAuth for initial Gmail connection with appropriate scopes (gmail.readonly, gmail.metadata).

#### Scenario: Initial connection

- **WHEN** user clicks "Connect Gmail"
- **THEN** system redirects to Google OAuth, stores tokens upon success

### Requirement: Token Management

The system SHALL securely manage Gmail access and refresh tokens, supporting add and remove operations.

#### Scenario: Token storage

- **WHEN** user completes OAuth authorization
- **THEN** system stores access_token and refresh_token in users table

### Requirement: Gmail Integration

The system SHALL support the full lifecycle of Gmail account management: initial connection, switching accounts, and disconnection.

#### Scenario: Full lifecycle

- **WHEN** user manages Gmail integration through settings
- **THEN** system supports connect, switch, and disconnect operations while preserving calm index history
