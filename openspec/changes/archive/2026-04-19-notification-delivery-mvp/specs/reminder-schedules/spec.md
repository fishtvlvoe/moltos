## ADDED Requirements

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

### Requirement: Reminder content uses a fixed template for MVP

The system SHALL generate reminder Email and in-app content using a fixed template. The Email subject SHALL be `「記得關心一下自己」— 小默提醒你`. The Email and in-app body SHALL contain a short supportive message (approximately 30–80 zh-TW characters) and a link back to the app. The system SHALL NOT invoke any AI summarization or dynamic content generation for reminders in this MVP.

#### Scenario: Reminder email uses fixed subject and template

- **WHEN** the dispatcher sends a reminder Email
- **THEN** the Email subject is `「記得關心一下自己」— 小默提醒你` and the body contains a static supportive message plus a link to the app's base URL
