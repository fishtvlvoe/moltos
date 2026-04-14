# information-sources Specification

## Purpose

TBD - created by archiving change 'settings-menu-complete'. Update Purpose after archive.

## Requirements

### Requirement: System displays connected information sources

The system SHALL display a list of all connected information sources with their connection status, priority level, and sync frequency.

#### Scenario: View connected Gmail source

- **WHEN** user navigates to `/settings/sources`
- **THEN** system displays Gmail as a connected source with status "Connected (fish.myfb@gmail.com)", priority "1", and sync frequency "Hourly"

#### Scenario: No connected sources (empty state)

- **WHEN** user navigates to `/settings/sources` and no sources are connected
- **THEN** system displays "No information sources connected" message with a "Connect a source" button

#### Scenario: Multiple connected sources

- **WHEN** user has Gmail and future sources connected
- **THEN** system displays each source as a separate item with independent status, priority, and frequency


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
### Requirement: User can view source connection status

The system SHALL show whether each source is currently connected, disconnected, or pending authorization.

#### Scenario: Connected source

- **WHEN** user views a connected source
- **THEN** system displays "Connected" status and the associated email/account

#### Scenario: Disconnected source

- **WHEN** user views a disconnected source
- **THEN** system displays "Disconnected" status and an option to reconnect

#### Scenario: Pending authorization

- **WHEN** user has initiated connection but not completed OAuth
- **THEN** system displays "Pending Authorization" status and "Complete Setup" button


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
### Requirement: User can manage source priority

The system SHALL allow users to set the priority order of information sources for content aggregation.

#### Scenario: Set source priority

- **WHEN** user drags or selects priority for a source (e.g., Gmail priority = 1)
- **THEN** system updates the database and displays success message

#### Scenario: Priority affects aggregation

- **WHEN** system generates content summaries
- **THEN** system processes sources in priority order (lower number = higher priority)


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
### Requirement: User can set source sync frequency

The system SHALL allow users to configure how often each source syncs data: hourly, daily, or on-demand.

#### Scenario: Set Gmail to hourly sync

- **WHEN** user selects "Hourly" sync frequency for Gmail
- **THEN** system updates the database and displays success message

#### Scenario: Set source to on-demand sync

- **WHEN** user selects "On-demand" sync frequency
- **THEN** system updates the database and displays a "Sync Now" button for manual refresh

#### Scenario: Sync frequency affects background jobs

- **WHEN** sync frequency is updated
- **THEN** system adjusts background job schedule accordingly (no manual job restart needed)


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
### Requirement: User can disconnect a source

The system SHALL allow users to disconnect a previously connected information source.

#### Scenario: Disconnect Gmail

- **WHEN** user clicks "Disconnect" on Gmail source
- **THEN** system displays a confirmation dialog with warning text (e.g., "Calm Index history will be preserved")

#### Scenario: Confirm disconnection

- **WHEN** user confirms disconnection in the dialog
- **THEN** system removes the source connection and displays success message


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

The information sources page SHALL follow the same layout and component structure as the Gmail Settings page for consistency.

#### Scenario: Page header and back button

- **WHEN** user opens the information sources page
- **THEN** system displays a back arrow ("←") and page title "資訊來源"

#### Scenario: Status card and management card

- **WHEN** user views the sources page
- **THEN** system displays a status section showing connected sources and a management section with configuration controls

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