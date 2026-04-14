# Settings API Documentation

## Overview

Settings API provides endpoints for managing user preferences across four domains:
- Notifications (email, in_app, push)
- Reminders (schedule, time, frequency, types)
- Sources (priority, sync intervals)
- Privacy (personalization, analytics, recommendations)

All endpoints require authentication via NextAuth session.

---

## POST /api/settings/notifications

Update user notification preferences.

### Request

```json
{
  "channel": "email|in_app|push",
  "enabled": true
}
```

### Response (200)

```json
{
  "success": true,
  "preferences": {
    "email": true,
    "in_app": true,
    "push": false
  }
}
```

### Error Responses

- **400**: Invalid channel or enabled value
- **401**: Unauthorized
- **500**: Database update failed

---

## POST /api/settings/reminders

Update user reminder schedule.

### Request

```json
{
  "enabled": true,
  "time": "09:00",
  "frequency": "daily|weekly|monthly",
  "types": ["calm_index", "chat_summary"]
}
```

### Response (200)

```json
{
  "success": true,
  "schedule": {
    "enabled": true,
    "time": "09:00",
    "frequency": "daily",
    "types": ["calm_index", "chat_summary"]
  }
}
```

### Validation Rules

- **time**: Must be in HH:MM format (00:00-23:59)
- **frequency**: Must be one of daily, weekly, monthly
- **types**: At least one type must be selected
- **enabled**: If false, time/frequency/types are not validated

### Error Responses

- **400**: Invalid format, invalid frequency, or empty types
- **401**: Unauthorized
- **500**: Database update failed

---

## POST /api/settings/sources

Update source priorities and sync intervals.

### Request

```json
{
  "gmail": {
    "connected": true,
    "priority": 1,
    "sync_interval": "hourly|daily|on-demand"
  }
}
```

### Response (200)

```json
{
  "success": true,
  "sources": {
    "gmail": {
      "connected": true,
      "priority": 2,
      "sync_interval": "daily"
    }
  }
}
```

### Validation Rules

- **sync_interval**: Must be one of hourly, daily, on-demand

### Error Responses

- **400**: Invalid sync_interval
- **401**: Unauthorized
- **500**: Database update failed

---

## POST /api/settings/privacy

Update privacy preferences.

### Request

```json
{
  "personalization": true,
  "analytics": true,
  "recommendations": true
}
```

### Response (200)

```json
{
  "success": true,
  "settings": {
    "personalization": true,
    "analytics": true,
    "recommendations": false
  }
}
```

### Validation Rules

- All fields must be boolean values

### Error Responses

- **400**: Invalid settings values
- **401**: Unauthorized
- **500**: Database update failed

---

## Data Model

Settings are stored as JSONB columns in the `users` table:

### notification_preferences
```json
{
  "email": boolean,
  "in_app": boolean,
  "push": boolean
}
```

### reminder_schedule
```json
{
  "enabled": boolean,
  "time": "HH:MM",
  "frequency": "daily|weekly|monthly",
  "types": ["calm_index"|"chat_summary"]
}
```

### source_priorities
```json
{
  "gmail": {
    "connected": boolean,
    "priority": number,
    "sync_interval": "hourly|daily|on-demand"
  }
}
```

### privacy_settings
```json
{
  "personalization": boolean,
  "analytics": boolean,
  "recommendations": boolean
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Possible error messages:
- "Unauthorized" (401)
- "Invalid [field]" (400)
- "At least one type must be selected" (400)
- "Failed to update [setting]" (500)
- "Internal server error" (500)
