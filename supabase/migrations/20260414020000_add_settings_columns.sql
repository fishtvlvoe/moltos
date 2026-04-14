-- Add settings JSON columns to users table
-- These columns store user preferences for notifications, reminders, sources, and privacy

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "in_app": true, "push": false}'::jsonb,
ADD COLUMN IF NOT EXISTS reminder_schedule jsonb DEFAULT '{"enabled": false, "time": "09:00", "frequency": "daily", "types": ["calm_index"]}'::jsonb,
ADD COLUMN IF NOT EXISTS source_priorities jsonb DEFAULT '{"gmail": {"connected": false, "priority": 1, "sync_interval": "daily"}}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"personalization": true, "analytics": true, "recommendations": true}'::jsonb;

-- Create indexes for efficient queries on JSON columns
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users USING GIN(notification_preferences);
CREATE INDEX IF NOT EXISTS idx_users_reminder_schedule ON users USING GIN(reminder_schedule);
CREATE INDEX IF NOT EXISTS idx_users_source_priorities ON users USING GIN(source_priorities);
CREATE INDEX IF NOT EXISTS idx_users_privacy_settings ON users USING GIN(privacy_settings);
