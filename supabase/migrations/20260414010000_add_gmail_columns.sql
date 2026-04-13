-- Add Gmail integration columns to users table
-- gmail_email = null 表示未連接 Gmail 狀態
-- gmail_access_token / gmail_refresh_token = null 同上（OAuth tokens 已清除）
-- gmail_last_sync = 上次同步時間（用於 UI 顯示和 rate-limit）
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gmail_access_token text,
ADD COLUMN IF NOT EXISTS gmail_refresh_token text,
ADD COLUMN IF NOT EXISTS gmail_email text,
ADD COLUMN IF NOT EXISTS gmail_last_sync timestamp with time zone;

-- Add index for gmail_email for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_gmail_email ON users(gmail_email);
