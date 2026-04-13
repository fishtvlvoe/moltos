# Gmail Integration Specification - Delta (Account Management Additions)

## MODIFIED Requirements

### Requirement: OAuth Authorization Flow

The system SHALL support Google OAuth for both initial connection and switching to a different Google account.

#### Scenario: OAuth flow for account switching

- **WHEN** user (with existing Gmail) clicks "更換 Gmail 帳號" (Switch Gmail Account)
- **THEN** the system SHALL:
  - Initiate Google OAuth with `prompt=select_account` to allow user to pick a different Google account
  - Update the user's `gmail_access_token` and `gmail_refresh_token` with new values
  - NOT create a new MOLTOS user; instead, update the existing user's Gmail association
  - Preserve all historical calm index data

#### Scenario: Token update on reconnection

- **WHEN** system receives new tokens from Google OAuth
- **THEN** the system SHALL:
  - Invalidate any previous Gmail API requests using old tokens
  - Begin fetching email data from the new Gmail account
  - Reset "last sync" timestamp

### Requirement: Token Management

The system SHALL securely manage Gmail access and refresh tokens, supporting both add and remove operations.

#### Scenario: Token removal on disconnect

- **WHEN** user initiates Gmail disconnection via `/api/gmail/disconnect`
- **THEN** the system SHALL:
  - Delete `gmail_access_token` from users table
  - Delete `gmail_refresh_token` from users table
  - NOT attempt to revoke tokens with Google (optional; can be added later)
  - Preserve all historical data in `calm_index_history`

#### Scenario: Token refresh on new connection

- **WHEN** user switches to a new Gmail account via OAuth
- **THEN** the system SHALL:
  - Replace old tokens with new tokens
  - Use new tokens for all subsequent Gmail API calls
  - Clear any stale data associated with the previous Gmail account (optional policy decision)

### Requirement: Gmail Integration

The system SHALL support the full lifecycle of Gmail account management: initial connection, switching accounts, and disconnection.

#### Scenario: Full lifecycle support

- **WHEN** user manages Gmail integration through settings page
- **THEN** the system SHALL support connect, switch, and disconnect operations while preserving calm index history
