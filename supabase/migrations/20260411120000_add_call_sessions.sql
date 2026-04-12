-- Migration: add call_sessions table
-- Purpose: bridge conversation_id → user_id for ElevenLabs webhook user_id resolution
-- 語音通話 conversation_id 與 Google ID 的對應表，供 webhook 查詢正確的 user_id

CREATE TABLE IF NOT EXISTS call_sessions (
  conversation_id TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day')
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_expires ON call_sessions(expires_at);

-- P0-1: Add RLS to prevent cross-user access
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY call_sessions_user_isolation ON call_sessions
  FOR ALL
  USING (user_id = auth.uid()::text);
