-- Add Gmail integration columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gmail_access_token text,
ADD COLUMN IF NOT EXISTS gmail_refresh_token text,
ADD COLUMN IF NOT EXISTS gmail_email text,
ADD COLUMN IF NOT EXISTS gmail_last_sync timestamp with time zone;

-- Add index for gmail_email for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_gmail_email ON users(gmail_email);
