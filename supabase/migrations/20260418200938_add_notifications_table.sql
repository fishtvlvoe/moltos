-- Migration: add notifications table
-- Purpose: 站內通知基礎建設 + 發送紀錄（統一通道）
-- 對應 openspec/changes/notification-delivery-mvp/design.md Decision 6

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                          -- 'calm_reminder' | 未來擴充
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  sent_via   TEXT NOT NULL,                          -- 'email' | 'in_app_only' | 'email+in_app'
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 未讀查詢索引（Header 紅點、列表頁未讀篩選）
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- 冪等去重索引（cron 每日同用戶同 type 最多一筆）
-- 注意：使用 Asia/Taipei 時區避免跨日邊界問題（Risks 條目）
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_date
  ON notifications (user_id, type, (DATE(created_at AT TIME ZONE 'Asia/Taipei')));

-- RLS：用戶只能讀自己的通知
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_select ON notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- 寫入由 service role 執行（cron / dispatcher），不需 policy
