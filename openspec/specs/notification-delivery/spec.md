# notification-delivery Specification

## Purpose

TBD - created by archiving change 'notification-delivery-mvp'. Update Purpose after archive.

## Requirements

### Requirement: System provides Email delivery capability via toSend

The system SHALL provide an Email delivery module (`lib/email/tosend.ts`) that wraps the toSend service API and exposes a `sendEmail({ to, subject, html, text })` function. The module SHALL read `TOSEND_API_KEY` and `TOSEND_FROM_EMAIL` from environment variables. The module SHALL return a result object with `{ success: boolean, messageId?: string, error?: string }` and MUST NOT throw on delivery failure.

#### Scenario: Successful email delivery

- **WHEN** `sendEmail` is called with a valid recipient and toSend returns 200
- **THEN** the function returns `{ success: true, messageId: <toSend message id> }`

#### Scenario: toSend API failure

- **WHEN** `sendEmail` is called and toSend returns a non-2xx response
- **THEN** the function returns `{ success: false, error: <error message> }` without throwing and logs the error via `console.error`

#### Scenario: Missing environment variables

- **WHEN** `sendEmail` is called while `TOSEND_API_KEY` is unset
- **THEN** the function returns `{ success: false, error: 'TOSEND_API_KEY not configured' }` without making an API call


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
### Requirement: System provides a notification dispatcher for reminder delivery

The system SHALL provide a dispatcher (`lib/notifications/dispatcher.ts`) with a `dispatchReminder(user, type)` function that: (a) writes a row to the `notifications` table, (b) attempts Email delivery via the Email module, and (c) updates the `sent_via` column based on outcome. The dispatcher SHALL NOT throw for individual user failures and MUST return a result object describing delivery outcome.

#### Scenario: Successful email + in-app delivery

- **WHEN** `dispatchReminder` is called for a user with valid email and toSend responds successfully
- **THEN** a row is inserted into `notifications` with `sent_via = 'email+in_app'` and the function returns `{ success: true, notificationId: <uuid> }`

#### Scenario: Email delivery fails, in-app still written

- **WHEN** `dispatchReminder` is called and toSend returns an error
- **THEN** a row is inserted into `notifications` with `sent_via = 'in_app_only'` and the function returns `{ success: true, notificationId: <uuid>, emailFailed: true }`

#### Scenario: Duplicate prevention via idempotency check

- **WHEN** `dispatchReminder` is called for a user who already has a `notifications` row with the same `type` and `DATE(created_at AT TIME ZONE 'Asia/Taipei')` equal to today
- **THEN** no new row is inserted, no email is sent, and the function returns `{ success: true, skipped: true, reason: 'already_sent_today' }`


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
### Requirement: System exposes a protected Cron endpoint for reminder dispatch

The system SHALL expose `POST /api/cron/send-reminders` that: (a) verifies the request via `Authorization: Bearer <CRON_SECRET>` header, (b) queries all users whose `reminder_schedule.enabled = true` AND whose `reminder_schedule.time` hour matches the current Asia/Taipei hour AND whose `reminder_schedule.frequency` permits delivery today, and (c) invokes the dispatcher for each matched user. The endpoint SHALL return a JSON summary with `{ total, sent, skipped, failed }` counts.

#### Scenario: Valid cron request processes all matched users

- **WHEN** the endpoint is called with valid `Authorization: Bearer <CRON_SECRET>` at 09:00 Asia/Taipei and 3 users have `reminder_schedule.time = '09:15'` with `enabled = true` and `frequency = 'daily'`
- **THEN** the dispatcher is invoked 3 times and the response is `{ total: 3, sent: 3, skipped: 0, failed: 0 }` with status 200

#### Scenario: Request without valid CRON_SECRET rejected

- **WHEN** the endpoint is called without the `Authorization` header or with an incorrect secret
- **THEN** the endpoint returns status 401 and does not dispatch any notifications

#### Scenario: Individual user failure does not abort batch

- **WHEN** the endpoint processes 5 matched users and the dispatcher throws unexpectedly for the 2nd user
- **THEN** the remaining 4 users are still processed and the response contains `{ total: 5, sent: 4, skipped: 0, failed: 1 }`


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
### Requirement: Vercel Cron schedule triggers the reminder endpoint hourly

The system SHALL configure `vercel.json` with a `crons` entry pointing to `/api/cron/send-reminders` on a schedule that covers all reminder time hours. If the Vercel plan supports hourly execution, the schedule SHALL be `0 * * * *`. If the plan is limited to daily cron, the schedule SHALL be `0 9,20 * * *` (09:00 and 20:00 Asia/Taipei, adjusted for UTC).

#### Scenario: Cron triggers endpoint on schedule

- **WHEN** the configured schedule time arrives on Vercel production
- **THEN** Vercel invokes `POST /api/cron/send-reminders` with the injected `Authorization: Bearer <CRON_SECRET>` header

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