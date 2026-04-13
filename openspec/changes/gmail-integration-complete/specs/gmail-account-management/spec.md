# Gmail Account Management Specification

## ADDED Requirements

### Requirement: Disconnect Gmail Integration

The system SHALL allow users to securely disconnect their Gmail account while preserving their MOLTOS account and historical calm index data.

#### Scenario: User initiates disconnect

- **WHEN** user clicks the "移除 Gmail 關聯" (Remove Gmail Association) button in settings
- **THEN** the system SHALL:
  - Display a confirmation dialog: "確定要移除 Gmail 關聯嗎？你的平靜指數歷史將被保留。" (Confirm removing Gmail? Your calm index history will be preserved.)
  - Include options: "確認" (Confirm) and "取消" (Cancel)

#### Scenario: Successful disconnection

- **WHEN** user confirms the disconnection
- **THEN** the system SHALL:
  - Send POST request to `/api/gmail/disconnect`
  - Clear `gmail_access_token` and `gmail_refresh_token` from user's database record
  - Preserve all `calm_index_history` records (user's past analysis data)
  - NOT delete the user's MOLTOS account itself
  - Return status: "Gmail 已移除" (Gmail removed)
  - Refresh the settings page to show "未連接" (Not connected) state

#### Scenario: Disconnection failure

- **WHEN** the disconnect API returns an error (e.g., database failure, timeout)
- **THEN** the system SHALL:
  - Display error message: "無法移除 Gmail，請稍後重試。" (Unable to remove Gmail. Please try again later.)
  - NOT delete any tokens if the operation fails
  - Allow user to retry

### Requirement: Switch Gmail Account

The system SHALL allow users to reconnect with a different Gmail account without losing their MOLTOS account.

#### Scenario: User wants to change Gmail account

- **WHEN** user (with existing Gmail integration) clicks "更換 Gmail 帳號" (Switch Gmail Account) button
- **THEN** the system SHALL:
  - Display confirmation: "這會使用新的 Gmail 帳號，你的平靜指數歷史將被保留。" (This will connect a new Gmail account. Your calm index history will be preserved.)
  - Initiate Google OAuth flow for a new Gmail account

#### Scenario: New Gmail account authorized

- **WHEN** user authorizes a new Gmail account via Google OAuth
- **THEN** the system SHALL:
  - Store the new `gmail_access_token` and `gmail_refresh_token`
  - Clear the old tokens from database
  - Preserve all `calm_index_history` records (historical data persists)
  - Reset daily email metrics (since they're from a different Gmail account)
  - Display success: "Gmail 帳號已更新為 [new_email]" (Gmail account updated to [new_email])

#### Scenario: User cancels OAuth flow

- **WHEN** user cancels the Google OAuth dialog
- **THEN** the system SHALL:
  - Maintain the existing Gmail connection
  - NOT modify any tokens or settings
  - Return user to settings page

### Requirement: Gmail Connection Status Display

The system SHALL clearly communicate the current Gmail connection status to the user.

#### Scenario: Connected state

- **WHEN** user has valid Gmail tokens stored
- **THEN** the settings page SHALL display:
  - Status badge: "已連接" (Connected) in green
  - Connected email address: `user_email@gmail.com`
  - Last sync timestamp (optional): "最後同步於 [timestamp]" (Last synced at [timestamp])
  - Two action buttons:
    - "更換 Gmail 帳號" (Switch Gmail Account)
    - "移除 Gmail 關聯" (Remove Gmail Association)

#### Scenario: Not connected state

- **WHEN** user has no Gmail tokens (newly signed up or after disconnection)
- **THEN** the settings page SHALL display:
  - Status badge: "未連接" (Not connected) in gray
  - Single action button: "連接 Gmail" (Connect Gmail)
  - Explanatory text: "連接 Gmail 以啟用平靜指數分析。" (Connect Gmail to enable Calm Index analysis.)

#### Scenario: Connecting state (transient)

- **WHEN** user initiates Gmail connection and OAuth is in progress
- **THEN** the settings page SHALL display:
  - Status badge: "連接中..." (Connecting...) with loading indicator
  - Buttons disabled until process completes

### Requirement: Gmail Disconnect API

The system SHALL provide a secure API endpoint to disconnect Gmail accounts.

#### Scenario: Disconnect API endpoint specification

- **WHEN** authenticated user sends POST request to `/api/gmail/disconnect`
- **THEN** the system SHALL:
  - Verify user authentication (via session or JWT)
  - Clear `gmail_access_token` and `gmail_refresh_token` for that user
  - NOT affect the user's MOLTOS account or calm index history
  - Return response: `{ success: true, message: "Gmail account disconnected" }`
  - HTTP status: 200 OK on success, 400/401/500 on error

#### Scenario: Error handling

- **WHEN** user is not authenticated or API validation fails
- **THEN** the system SHALL:
  - Return HTTP 401 Unauthorized if session invalid
  - Return HTTP 400 Bad Request if request malformed
  - Log the error for debugging
  - NOT delete or modify any data

## ADDED Requirements (continued)

### Requirement: Gmail Account Lifecycle

The system SHALL support the full lifecycle of Gmail account management: initial connection, switching accounts, and disconnection.

#### Scenario: Initial Gmail connection (existing flow, unchanged)

- **WHEN** user clicks "連接 Gmail" (Connect Gmail) on onboarding or settings
- **THEN** the system SHALL:
  - Redirect to Google OAuth consent screen
  - Request scopes: `gmail.readonly`, `gmail.metadata`
  - Upon successful auth, store tokens and display "已連接"

#### Scenario: Reconnection with different account

- **WHEN** user clicks "更換 Gmail 帳號" (Switch Gmail Account)
- **THEN** the system SHALL:
  - Prompt Google OAuth with the ability to select a different Google account
  - Update existing user's tokens (not create new user)
  - Preserve calm index history and user data

#### Scenario: Graceful disconnection

- **WHEN** user clicks "移除 Gmail 關聯" (Remove Gmail Association)
- **THEN** the system SHALL:
  - Prompt for confirmation
  - Clear tokens without deleting the MOLTOS account
  - Allow user to reconnect later without data loss (except current metrics that require live Gmail data)
