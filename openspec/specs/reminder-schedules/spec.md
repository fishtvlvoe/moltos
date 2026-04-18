# reminder-schedules Specification

## Purpose

TBD - created by archiving change 'settings-menu-complete'. Update Purpose after archive.

## Requirements

### Requirement: User can view reminder schedule

The system SHALL display the current reminder configuration including enabled/disabled state, scheduled time (24-hour format HH:MM), frequency (daily/weekly), and reminder types (calm index, chat summary).

#### Scenario: View enabled reminder schedule

- **WHEN** user navigates to `/settings/reminders` with an enabled schedule
- **THEN** system displays: enabled toggle (ON), time picker showing saved time, frequency dropdown, and type checkboxes with saved selections

#### Scenario: View disabled reminder schedule

- **WHEN** user navigates to `/settings/reminders` with a disabled schedule
- **THEN** system displays the schedule configuration grayed out or with a disabled state indicator

#### Scenario: View default reminder schedule (first time)

- **WHEN** user navigates to `/settings/reminders` for the first time
- **THEN** system displays defaults: disabled, time 09:00, frequency daily, types: [calm_index]


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
### Requirement: User can enable/disable reminders

The system SHALL allow users to toggle the reminder feature on or off. When disabled, reminders SHALL NOT be sent.

#### Scenario: Enable reminders

- **WHEN** user toggles the reminder enabled switch to ON
- **THEN** system saves the state to the database and displays success message

#### Scenario: Disable reminders

- **WHEN** user toggles the reminder enabled switch to OFF
- **THEN** system saves the state to the database and stops sending reminders


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
### Requirement: User can set reminder time

The system SHALL allow users to set a custom reminder time in 24-hour format (HH:MM). Valid times are 00:00 to 23:59.

#### Scenario: Set reminder to morning time

- **WHEN** user selects 07:30 in the time picker
- **THEN** system updates the database and displays success message

#### Scenario: Set reminder to evening time

- **WHEN** user selects 20:45 in the time picker
- **THEN** system updates the database and displays success message

#### Scenario: Invalid time input

- **WHEN** user enters an invalid time (e.g., 25:00)
- **THEN** system displays an error message and does not save the change


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
### Requirement: User can select reminder frequency

The system SHALL allow users to choose reminder frequency: daily (every day) or weekly (specific day of week). Default is daily.

#### Scenario: Set daily reminders

- **WHEN** user selects "daily" frequency option
- **THEN** system updates the database to send reminders every day at the configured time

#### Scenario: Set weekly reminders

- **WHEN** user selects "weekly" frequency option AND selects days (e.g., Monday, Wednesday, Friday)
- **THEN** system updates the database to send reminders only on selected days


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
### Requirement: User can select reminder content types

The system SHALL allow users to independently enable or disable reminder types: calm index summary and chat summary. Users SHALL be able to select multiple types.

#### Scenario: Select calm index reminder only

- **WHEN** user checks "Calm Index Summary" and unchecks "Chat Summary"
- **THEN** system saves the selection and will send only calm index reminders

#### Scenario: Select multiple reminder types

- **WHEN** user checks both "Calm Index Summary" and "Chat Summary"
- **THEN** system saves the selection and will send reminders for both types

#### Scenario: No reminder types selected

- **WHEN** user unchecks all reminder types
- **THEN** system displays a warning ("Please select at least one reminder type") and does not allow saving


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

The reminder settings page SHALL follow the same layout and component structure as the Gmail Settings page for consistency.

#### Scenario: Page header and back button

- **WHEN** user opens the reminder settings page
- **THEN** system displays a back arrow ("←") and page title "提醒排程"

#### Scenario: Status card and form card

- **WHEN** user views the reminders page
- **THEN** system displays a status section showing current schedule state and a form section with all configuration controls

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
### Requirement: System delivers reminders according to the user's schedule

When a user's `reminder_schedule.enabled` is true, the system SHALL dispatch a reminder notification (via Email and in-app) on the schedule defined by `reminder_schedule.time` (HH:MM, Asia/Taipei) and `reminder_schedule.frequency`. For `frequency = 'daily'`, the reminder SHALL be delivered every day at the specified time. For `frequency = 'weekly'`, the reminder SHALL be delivered every Monday at the specified time. For `frequency = 'monthly'`, the reminder SHALL be delivered on the first day of each month at the specified time. Delivery SHALL be idempotent: a user SHALL NOT receive more than one reminder of the same `type` per calendar day (Asia/Taipei).

#### Scenario: Daily reminder delivered at scheduled hour

- **WHEN** a user has `reminder_schedule = { enabled: true, time: '09:00', frequency: 'daily', types: ['calm_index'] }` and the cron runs at 09:00 Asia/Taipei on any day
- **THEN** the user receives one calm-index reminder notification (email + in-app) and exactly one row is inserted into `notifications`

#### Scenario: Weekly reminder only on Monday

- **WHEN** a user has `reminder_schedule = { enabled: true, time: '09:00', frequency: 'weekly', ... }` and the cron runs at 09:00 Asia/Taipei on Tuesday
- **THEN** no reminder is dispatched for that user

#### Scenario: Disabled schedule is skipped

- **WHEN** a user has `reminder_schedule = { enabled: false, ... }` and the cron runs at the user's scheduled hour
- **THEN** no reminder is dispatched for that user

#### Scenario: Idempotency prevents duplicate same-day delivery

- **WHEN** the cron dispatches a daily reminder to a user at 09:00 and the cron (or a retry) runs again within the same Asia/Taipei calendar day
- **THEN** no additional reminder is dispatched and the dispatcher returns `{ skipped: true, reason: 'already_sent_today' }` for that user


<!-- @trace
source: notification-delivery-mvp
updated: 2026-04-19
code:
  - docs/圖/截圖 2026-04-04 下午4.16.50.png
  - supabase/migrations/20260418200938_add_notifications_table.sql
  - docs/圖/screen-voice.png
  - app/api/notifications/route.ts
  - 圖/screen-chat.png
  - 圖/截圖 2026-04-04 下午4.34.34.png
  - 簡報圖/Presentation.pen
  - 圖/截圖 2026-04-04 下午4.33.45.png
  - docs/功能頁/4.png
  - docs/圖/截圖 2026-04-04 下午4.34.34.png
  - 圖/截圖 2026-04-04 下午4.33.14.png
  - 圖/截圖 2026-04-04 下午4.34.23.png
  - docs/圖/截圖 2026-04-04 下午4.33.33.png
  - supabase/.temp/linked-project.json
  - 簡報圖/比賽用簡報.pdf
  - docs/圖/截圖 2026-04-04 下午4.34.23.png
  - docs/簡報圖/screen-chat.png
  - 圖/screen-home.png
  - app/(app)/layout.tsx
  - lib/notifications/templates.ts
  - app/api/notifications/[id]/read/route.ts
  - docs/功能頁/5.png
  - docs/圖/截圖 2026-04-04 下午4.34.03.png
  - 簡報圖/slides.pdf
  - docs/圖/screen-home.png
  - 圖/截圖 2026-04-04 下午4.16.50.png
  - docs/簡報圖/screen-voice.png
  - vercel.json
  - 圖/screen-review.png
  - docs/簡報圖/screen-review.png
  - 圖/screen-voice.png
  - docs/功能頁/6.png
  - docs/功能頁/3.png
  - app/(app)/notifications/page.tsx
  - 簡報圖/screen-chat.png
  - app/api/cron/send-reminders/route.ts
  - docs/簡報圖/screen-home.png
  - 圖/截圖 2026-04-04 下午4.34.03.png
  - docs/圖/screen-review.png
  - docs/圖/截圖 2026-04-04 下午4.33.45.png
  - docs/簡報圖/Presentation.pen
  - docs/圖/screen-chat.png
  - docs/功能頁/1.png
  - 圖/截圖 2026-04-04 下午4.33.33.png
  - 簡報圖/screen-review.png
  - components/notification-badge.tsx
  - docs/圖/截圖 2026-04-04 下午4.33.14.png
  - docs/功能頁/2.png
  - docs/簡報圖/slides.pdf
  - lib/email/tosend.ts
  - 簡報圖/screen-home.png
  - 簡報圖/screen-voice.png
  - docs/簡報圖/比賽用簡報.pdf
  - lib/notifications/dispatcher.ts
tests:
  - __tests__/lib/email/tosend.test.ts
  - __tests__/lib/notifications/dispatcher.test.ts
  - __tests__/app/api/notifications/read.test.ts
  - __tests__/app/api/cron/send-reminders.test.ts
  - __tests__/app/api/notifications/list.test.ts
-->

---
### Requirement: Reminder content uses a fixed template for MVP

The system SHALL generate reminder Email and in-app content using a fixed template. The Email subject SHALL be `「記得關心一下自己」— 小默提醒你`. The Email and in-app body SHALL contain a short supportive message (approximately 30–80 zh-TW characters) and a link back to the app. The system SHALL NOT invoke any AI summarization or dynamic content generation for reminders in this MVP.

#### Scenario: Reminder email uses fixed subject and template

- **WHEN** the dispatcher sends a reminder Email
- **THEN** the Email subject is `「記得關心一下自己」— 小默提醒你` and the body contains a static supportive message plus a link to the app's base URL

<!-- @trace
source: notification-delivery-mvp
updated: 2026-04-19
code:
  - docs/圖/截圖 2026-04-04 下午4.16.50.png
  - supabase/migrations/20260418200938_add_notifications_table.sql
  - docs/圖/screen-voice.png
  - app/api/notifications/route.ts
  - 圖/screen-chat.png
  - 圖/截圖 2026-04-04 下午4.34.34.png
  - 簡報圖/Presentation.pen
  - 圖/截圖 2026-04-04 下午4.33.45.png
  - docs/功能頁/4.png
  - docs/圖/截圖 2026-04-04 下午4.34.34.png
  - 圖/截圖 2026-04-04 下午4.33.14.png
  - 圖/截圖 2026-04-04 下午4.34.23.png
  - docs/圖/截圖 2026-04-04 下午4.33.33.png
  - supabase/.temp/linked-project.json
  - 簡報圖/比賽用簡報.pdf
  - docs/圖/截圖 2026-04-04 下午4.34.23.png
  - docs/簡報圖/screen-chat.png
  - 圖/screen-home.png
  - app/(app)/layout.tsx
  - lib/notifications/templates.ts
  - app/api/notifications/[id]/read/route.ts
  - docs/功能頁/5.png
  - docs/圖/截圖 2026-04-04 下午4.34.03.png
  - 簡報圖/slides.pdf
  - docs/圖/screen-home.png
  - 圖/截圖 2026-04-04 下午4.16.50.png
  - docs/簡報圖/screen-voice.png
  - vercel.json
  - 圖/screen-review.png
  - docs/簡報圖/screen-review.png
  - 圖/screen-voice.png
  - docs/功能頁/6.png
  - docs/功能頁/3.png
  - app/(app)/notifications/page.tsx
  - 簡報圖/screen-chat.png
  - app/api/cron/send-reminders/route.ts
  - docs/簡報圖/screen-home.png
  - 圖/截圖 2026-04-04 下午4.34.03.png
  - docs/圖/screen-review.png
  - docs/圖/截圖 2026-04-04 下午4.33.45.png
  - docs/簡報圖/Presentation.pen
  - docs/圖/screen-chat.png
  - docs/功能頁/1.png
  - 圖/截圖 2026-04-04 下午4.33.33.png
  - 簡報圖/screen-review.png
  - components/notification-badge.tsx
  - docs/圖/截圖 2026-04-04 下午4.33.14.png
  - docs/功能頁/2.png
  - docs/簡報圖/slides.pdf
  - lib/email/tosend.ts
  - 簡報圖/screen-home.png
  - 簡報圖/screen-voice.png
  - docs/簡報圖/比賽用簡報.pdf
  - lib/notifications/dispatcher.ts
tests:
  - __tests__/lib/email/tosend.test.ts
  - __tests__/lib/notifications/dispatcher.test.ts
  - __tests__/app/api/notifications/read.test.ts
  - __tests__/app/api/cron/send-reminders.test.ts
  - __tests__/app/api/notifications/list.test.ts
-->