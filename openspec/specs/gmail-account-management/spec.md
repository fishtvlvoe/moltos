# Gmail Account Management Specification

## Purpose

Defines the complete lifecycle of Gmail account management in MOLTOS: connecting, disconnecting, and switching Gmail accounts.

## Requirements

### Requirement: Disconnect Gmail Integration

The system SHALL allow users to disconnect their Gmail account while preserving their MOLTOS account and calm index history.

#### Scenario: Successful disconnection

- **WHEN** user confirms Gmail disconnection
- **THEN** system clears Gmail tokens, preserves account and history, shows "Not connected" state


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
### Requirement: Switch Gmail Account

The system SHALL allow users to switch to a different Gmail account without losing their MOLTOS account.

#### Scenario: Account switch via OAuth

- **WHEN** user initiates Gmail account switch
- **THEN** system opens Google OAuth with account selection, updates tokens upon success


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
### Requirement: Gmail Connection Status Display

The system SHALL display clear Gmail connection status: Connected, Not Connected, or Connecting.

#### Scenario: Connected state display

- **WHEN** user has valid Gmail tokens
- **THEN** settings page shows green "Connected" badge, email address, and action buttons


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
### Requirement: Gmail Disconnect API

The system SHALL provide a secure POST endpoint at `/api/gmail/disconnect` to handle disconnection.

#### Scenario: API endpoint

- **WHEN** authenticated user sends POST to `/api/gmail/disconnect`
- **THEN** system clears tokens and returns success response

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