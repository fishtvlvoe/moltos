# notification-settings Specification

## Purpose

TBD - created by archiving change 'settings-menu-complete'. Update Purpose after archive.

## Requirements

### Requirement: User can view notification preferences

The system SHALL display the current state of notification preferences across three channels: email notifications, in-app notifications, and push notifications. Each channel SHALL show an on/off toggle.

#### Scenario: View default preferences

- **WHEN** user navigates to `/settings/notifications` for the first time
- **THEN** system displays: email (ON), in-app (ON), push (OFF) with toggle switches

#### Scenario: View saved preferences

- **WHEN** user navigates to `/settings/notifications` after updating preferences
- **THEN** system displays the user's saved preferences matching the database state


<!-- @trace
source: settings-menu-complete
updated: 2026-04-14
code:
  - supabase/.temp/project-ref
  - supabase/.temp/storage-version
  - app/api/settings/notifications/route.ts
  - app/(app)/settings/privacy/page.tsx
  - components/settings/reminder-form.tsx
  - app/(app)/settings/sources/page.tsx
  - components/settings/privacy-policy.tsx
  - docs/api/settings.md
  - components/settings/source-config.tsx
  - components/settings/notification-status.tsx
  - components/settings/menu-card.tsx
  - components/settings/reminder-status.tsx
  - supabase/.temp/pooler-url
  - supabase/migrations/20260414020000_add_settings_columns.sql
  - components/settings/notification-controls.tsx
  - supabase/.temp/cli-latest
  - app/(app)/settings/reminders/page.tsx
  - app/(app)/settings/notifications/page.tsx
  - supabase/.temp/gotrue-version
  - supabase/.temp/storage-migration
  - app/api/settings/sources/route.ts
  - app/api/settings/reminders/route.ts
  - app/api/settings/privacy/route.ts
  - components/settings/privacy-toggles.tsx
  - supabase/.temp/postgres-version
  - supabase/.temp/rest-version
  - components/settings/sources-list.tsx
tests:
  - __tests__/api/settings/sources.test.ts
  - __tests__/api/settings/reminders.test.ts
  - __tests__/api/settings/privacy.test.ts
  - components/settings/__tests__/menu-card.test.tsx
  - __tests__/e2e/settings-flow.test.ts
  - __tests__/api/settings/notifications.test.ts
  - components/settings/__tests__/notification-controls.test.tsx
-->

---
### Requirement: User can toggle notification channels

The system SHALL allow users to independently enable or disable each notification channel. Changes SHALL be persisted to the database.

#### Scenario: Enable email notifications

- **WHEN** user toggles the email notification switch to ON
- **THEN** system updates the database and displays a success message (toast)

#### Scenario: Disable in-app notifications

- **WHEN** user toggles the in-app notification switch to OFF
- **THEN** system updates the database and displays a success message (toast)

#### Scenario: Toggle update fails

- **WHEN** database update fails (network error, server error)
- **THEN** system displays an error message and reverts the toggle to its previous state


<!-- @trace
source: settings-menu-complete
updated: 2026-04-14
code:
  - supabase/.temp/project-ref
  - supabase/.temp/storage-version
  - app/api/settings/notifications/route.ts
  - app/(app)/settings/privacy/page.tsx
  - components/settings/reminder-form.tsx
  - app/(app)/settings/sources/page.tsx
  - components/settings/privacy-policy.tsx
  - docs/api/settings.md
  - components/settings/source-config.tsx
  - components/settings/notification-status.tsx
  - components/settings/menu-card.tsx
  - components/settings/reminder-status.tsx
  - supabase/.temp/pooler-url
  - supabase/migrations/20260414020000_add_settings_columns.sql
  - components/settings/notification-controls.tsx
  - supabase/.temp/cli-latest
  - app/(app)/settings/reminders/page.tsx
  - app/(app)/settings/notifications/page.tsx
  - supabase/.temp/gotrue-version
  - supabase/.temp/storage-migration
  - app/api/settings/sources/route.ts
  - app/api/settings/reminders/route.ts
  - app/api/settings/privacy/route.ts
  - components/settings/privacy-toggles.tsx
  - supabase/.temp/postgres-version
  - supabase/.temp/rest-version
  - components/settings/sources-list.tsx
tests:
  - __tests__/api/settings/sources.test.ts
  - __tests__/api/settings/reminders.test.ts
  - __tests__/api/settings/privacy.test.ts
  - components/settings/__tests__/menu-card.test.tsx
  - __tests__/e2e/settings-flow.test.ts
  - __tests__/api/settings/notifications.test.ts
  - components/settings/__tests__/notification-controls.test.tsx
-->

---
### Requirement: Notification preferences affect system behavior

The system SHALL respect saved notification preferences when triggering notifications. Only enabled channels SHALL receive notifications.

#### Scenario: User receives email notification

- **WHEN** user has email notifications enabled AND a triggering event occurs (e.g., daily summary)
- **THEN** system sends email notification to user's email address

#### Scenario: User does not receive disabled notification

- **WHEN** user has push notifications disabled AND a triggering event occurs
- **THEN** system SHALL NOT send push notification to user


<!-- @trace
source: settings-menu-complete
updated: 2026-04-14
code:
  - supabase/.temp/project-ref
  - supabase/.temp/storage-version
  - app/api/settings/notifications/route.ts
  - app/(app)/settings/privacy/page.tsx
  - components/settings/reminder-form.tsx
  - app/(app)/settings/sources/page.tsx
  - components/settings/privacy-policy.tsx
  - docs/api/settings.md
  - components/settings/source-config.tsx
  - components/settings/notification-status.tsx
  - components/settings/menu-card.tsx
  - components/settings/reminder-status.tsx
  - supabase/.temp/pooler-url
  - supabase/migrations/20260414020000_add_settings_columns.sql
  - components/settings/notification-controls.tsx
  - supabase/.temp/cli-latest
  - app/(app)/settings/reminders/page.tsx
  - app/(app)/settings/notifications/page.tsx
  - supabase/.temp/gotrue-version
  - supabase/.temp/storage-migration
  - app/api/settings/sources/route.ts
  - app/api/settings/reminders/route.ts
  - app/api/settings/privacy/route.ts
  - components/settings/privacy-toggles.tsx
  - supabase/.temp/postgres-version
  - supabase/.temp/rest-version
  - components/settings/sources-list.tsx
tests:
  - __tests__/api/settings/sources.test.ts
  - __tests__/api/settings/reminders.test.ts
  - __tests__/api/settings/privacy.test.ts
  - components/settings/__tests__/menu-card.test.tsx
  - __tests__/e2e/settings-flow.test.ts
  - __tests__/api/settings/notifications.test.ts
  - components/settings/__tests__/notification-controls.test.tsx
-->

---
### Requirement: Page follows consistent UI pattern

The settings notification page SHALL follow the same layout and component structure as the Gmail Settings page for consistency.

#### Scenario: Page header and back button

- **WHEN** user opens the notification settings page
- **THEN** system displays a back arrow ("←") and page title "通知設定"

#### Scenario: Status card and action card

- **WHEN** user views the notifications page
- **THEN** system displays a status section showing current notification state and an actions section with toggle controls

<!-- @trace
source: settings-menu-complete
updated: 2026-04-14
code:
  - supabase/.temp/project-ref
  - supabase/.temp/storage-version
  - app/api/settings/notifications/route.ts
  - app/(app)/settings/privacy/page.tsx
  - components/settings/reminder-form.tsx
  - app/(app)/settings/sources/page.tsx
  - components/settings/privacy-policy.tsx
  - docs/api/settings.md
  - components/settings/source-config.tsx
  - components/settings/notification-status.tsx
  - components/settings/menu-card.tsx
  - components/settings/reminder-status.tsx
  - supabase/.temp/pooler-url
  - supabase/migrations/20260414020000_add_settings_columns.sql
  - components/settings/notification-controls.tsx
  - supabase/.temp/cli-latest
  - app/(app)/settings/reminders/page.tsx
  - app/(app)/settings/notifications/page.tsx
  - supabase/.temp/gotrue-version
  - supabase/.temp/storage-migration
  - app/api/settings/sources/route.ts
  - app/api/settings/reminders/route.ts
  - app/api/settings/privacy/route.ts
  - components/settings/privacy-toggles.tsx
  - supabase/.temp/postgres-version
  - supabase/.temp/rest-version
  - components/settings/sources-list.tsx
tests:
  - __tests__/api/settings/sources.test.ts
  - __tests__/api/settings/reminders.test.ts
  - __tests__/api/settings/privacy.test.ts
  - components/settings/__tests__/menu-card.test.tsx
  - __tests__/e2e/settings-flow.test.ts
  - __tests__/api/settings/notifications.test.ts
  - components/settings/__tests__/notification-controls.test.tsx
-->