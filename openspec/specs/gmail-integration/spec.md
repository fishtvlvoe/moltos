# Gmail Integration Specification

## Purpose

Defines Gmail OAuth integration for MOLTOS, including initial connection, token management, and account lifecycle.

## Requirements

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


<!-- @trace
source: gmail-integration-complete
updated: 2026-04-14
code:
  - app/(app)/review/page.tsx
  - components/settings/gmail-actions.tsx
  - .spectra.yaml
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
  - components/chat/chat-input.tsx
  - package.json
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - supabase/migrations/20260414010000_add_gmail_columns.sql
  - lib/db.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - app/(app)/chat/page.tsx
  - app/api/gmail/switch-account/route.ts
  - app/(app)/settings/gmail/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - components/settings/gmail-status.tsx
  - docs/dev/voicebox-integration-analysis.md
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - lib/speech.ts
  - components/dashboard/calm-index-card.tsx
  - app/api/gmail/disconnect/route.ts
  - components/ui/dialog.tsx
tests:
  - lib/__tests__/speech.test.ts
-->

---
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


<!-- @trace
source: gmail-integration-complete
updated: 2026-04-14
code:
  - app/(app)/review/page.tsx
  - components/settings/gmail-actions.tsx
  - .spectra.yaml
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
  - components/chat/chat-input.tsx
  - package.json
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - supabase/migrations/20260414010000_add_gmail_columns.sql
  - lib/db.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - app/(app)/chat/page.tsx
  - app/api/gmail/switch-account/route.ts
  - app/(app)/settings/gmail/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - components/settings/gmail-status.tsx
  - docs/dev/voicebox-integration-analysis.md
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - lib/speech.ts
  - components/dashboard/calm-index-card.tsx
  - app/api/gmail/disconnect/route.ts
  - components/ui/dialog.tsx
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Gmail Integration

The system SHALL support the full lifecycle of Gmail account management: initial connection, switching accounts, and disconnection.

#### Scenario: Full lifecycle support

- **WHEN** user manages Gmail integration through settings page
- **THEN** the system SHALL support connect, switch, and disconnect operations while preserving calm index history

<!-- @trace
source: gmail-integration-complete
updated: 2026-04-14
code:
  - app/(app)/review/page.tsx
  - components/settings/gmail-actions.tsx
  - .spectra.yaml
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
  - components/chat/chat-input.tsx
  - package.json
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - supabase/migrations/20260414010000_add_gmail_columns.sql
  - lib/db.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - app/(app)/chat/page.tsx
  - app/api/gmail/switch-account/route.ts
  - app/(app)/settings/gmail/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - components/settings/gmail-status.tsx
  - docs/dev/voicebox-integration-analysis.md
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - lib/speech.ts
  - components/dashboard/calm-index-card.tsx
  - app/api/gmail/disconnect/route.ts
  - components/ui/dialog.tsx
tests:
  - lib/__tests__/speech.test.ts
-->