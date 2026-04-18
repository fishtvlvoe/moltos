# in-app-notifications Specification

## Purpose

TBD - created by archiving change 'notification-delivery-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Database schema provides a notifications table

The system SHALL create a `notifications` table with the following columns: `id` (UUID primary key, default `gen_random_uuid()`), `user_id` (TEXT, foreign key to `users.id` with `ON DELETE CASCADE`), `type` (TEXT, not null), `title` (TEXT, not null), `body` (TEXT, not null), `sent_via` (TEXT, not null, one of `'email'`, `'in_app_only'`, `'email+in_app'`), `read_at` (TIMESTAMPTZ, nullable), and `created_at` (TIMESTAMPTZ, not null, default `NOW()`). The table SHALL include an index on `(user_id, created_at DESC) WHERE read_at IS NULL` for unread queries, and an index supporting idempotency lookups by `(user_id, type, DATE(created_at AT TIME ZONE 'Asia/Taipei'))`.

#### Scenario: Migration creates table and indexes

- **WHEN** the migration is applied to an empty Supabase database
- **THEN** the `notifications` table exists with all columns and both indexes, and a test insert with valid `user_id`, `type`, `title`, `body`, `sent_via` succeeds

#### Scenario: User deletion cascades

- **WHEN** a user row is deleted from the `users` table and that user has 5 rows in `notifications`
- **THEN** all 5 notification rows are automatically deleted


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
### Requirement: API returns a user's notifications

The system SHALL expose `GET /api/notifications` that returns the authenticated user's notifications ordered by `created_at DESC`. The endpoint SHALL support query parameters `unread=true` (filter to unread only) and `count_only=true` (return only a count, not rows). Unauthenticated requests SHALL receive status 401.

#### Scenario: List authenticated user's notifications

- **WHEN** an authenticated user with 3 notifications calls `GET /api/notifications`
- **THEN** the response is status 200 with a JSON array of 3 notifications ordered by `created_at DESC`, each containing `{ id, type, title, body, sent_via, read_at, created_at }`

#### Scenario: Count unread only

- **WHEN** an authenticated user with 2 unread and 5 read notifications calls `GET /api/notifications?unread=true&count_only=true`
- **THEN** the response is status 200 with JSON `{ count: 2 }`

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated request calls `GET /api/notifications`
- **THEN** the response is status 401 and no data is returned


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
### Requirement: API marks a notification as read

The system SHALL expose `POST /api/notifications/[id]/read` that sets `read_at = NOW()` on the notification if it belongs to the authenticated user. The endpoint SHALL return status 404 if the notification does not exist or does not belong to the user. Calling the endpoint on an already-read notification SHALL succeed without changing `read_at`.

#### Scenario: Mark unread notification as read

- **WHEN** an authenticated user calls `POST /api/notifications/<id>/read` on their own unread notification
- **THEN** the notification's `read_at` is updated to the current timestamp and the response is status 200

#### Scenario: Cannot mark another user's notification

- **WHEN** an authenticated user calls `POST /api/notifications/<id>/read` on a notification belonging to a different user
- **THEN** the response is status 404 and `read_at` is not modified

#### Scenario: Marking already-read notification is idempotent

- **WHEN** an authenticated user calls `POST /api/notifications/<id>/read` on a notification where `read_at` is already set
- **THEN** the response is status 200, `read_at` retains its original value, and no error occurs


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
### Requirement: Notification list page displays user notifications

The system SHALL provide a page at `/notifications` that displays the authenticated user's notifications in reverse chronological order. Each item SHALL show `title`, `body`, a relative timestamp, and a visual distinction between read and unread. Clicking an unread notification SHALL call the mark-as-read endpoint.

#### Scenario: User views notification list

- **WHEN** an authenticated user navigates to `/notifications` with 3 notifications (2 unread, 1 read)
- **THEN** the page displays all 3 items in reverse chronological order with unread items visually distinguished from read items

#### Scenario: Click unread notification marks as read

- **WHEN** a user clicks on an unread notification in the list
- **THEN** the client calls `POST /api/notifications/<id>/read` and updates the item to appear as read


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
### Requirement: Header shows unread notification badge

The system SHALL display a notification badge in the app Header when the authenticated user has unread notifications. The badge SHALL be implemented as a `NotificationBadge` component that polls `GET /api/notifications?unread=true&count_only=true` every 60 seconds and renders a red dot when `count > 0`. Clicking the badge SHALL navigate to `/notifications`.

#### Scenario: Badge appears when unread notifications exist

- **WHEN** an authenticated user has 2 unread notifications and visits any page that renders the Header
- **THEN** within 60 seconds the badge component fetches the count and displays a red dot

#### Scenario: Badge hides when all notifications read

- **WHEN** a user with 2 unread notifications marks both as read and remains on the page
- **THEN** within 60 seconds the next poll returns `{ count: 0 }` and the red dot is hidden

#### Scenario: Click badge navigates to notifications page

- **WHEN** a user clicks the notification badge
- **THEN** the browser navigates to `/notifications`

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