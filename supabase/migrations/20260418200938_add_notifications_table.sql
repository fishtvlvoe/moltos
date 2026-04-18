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

-- 冪等查詢索引（B-tree range scan 可命中）
-- 用於 dispatcher 查「今日 TPE 同用戶同 type」是否已發送
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
  ON notifications (user_id, type, created_at DESC);

-- 冪等 UNIQUE constraint：DB 層強制「同用戶同 type 同日（TPE）最多一筆」
-- 防止並發 cron / retry 造成重複發送
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_per_day
  ON notifications (user_id, type, (DATE(created_at AT TIME ZONE 'Asia/Taipei')));

-- RLS：用戶只能讀/改自己的通知；INSERT/DELETE 僅 service role 可執行
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_select ON notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- 顯式封鎖非 service role 的 INSERT / DELETE（防禦縱深）
CREATE POLICY notifications_no_insert ON notifications
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY notifications_no_delete ON notifications
  FOR DELETE
  USING (false);
