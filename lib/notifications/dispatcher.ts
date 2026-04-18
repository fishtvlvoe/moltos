/**
 * 通知分派器（Reminder 專用）
 * 對應 openspec/changes/notification-delivery-mvp/design.md：
 *  - Decision 4: 冪等性機制 — 依靠 notifications 表 UNIQUE 索引
 *    (user_id, type, DATE(created_at AT TIME ZONE 'Asia/Taipei'))
 *    INSERT 重複時 DB 回 23505，轉為 skipped
 *  - Decision 5: 失敗隔離策略 — 每用戶獨立 try/catch + 降級寫入站內
 */

import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email/tosend';
import { buildCalmReminderTemplate } from '@/lib/notifications/templates';

export interface DispatchUser {
  id: string;
  email: string | null;
}

export type NotificationType = 'calm_reminder';
export type SentVia = 'email' | 'in_app_only' | 'email+in_app';

export interface DispatchResult {
  status: 'sent' | 'skipped' | 'failed';
  sentVia?: SentVia;
  reason?: 'already_sent_today';
  error?: string;
  notificationId?: string;
}

// Postgres unique_violation error code
const PG_UNIQUE_VIOLATION = '23505';

export async function dispatchReminder(
  user: DispatchUser,
  type: NotificationType
): Promise<DispatchResult> {
  // Step 1: 建立通知內容
  const template = buildCalmReminderTemplate();

  // Step 2: 寫 notifications row（sent_via 先標 in_app_only，email 成功再 update）
  // UNIQUE 索引會在同日重複 INSERT 時回 23505 → 視為 skipped（冪等）
  const inserted = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: user.id,
      type,
      title: template.title,
      body: template.body,
      sent_via: 'in_app_only',
    })
    .select('id')
    .single();

  if (inserted.error) {
    if (inserted.error.code === PG_UNIQUE_VIOLATION) {
      return { status: 'skipped', reason: 'already_sent_today' };
    }
    return {
      status: 'failed',
      error: `insert_notification_failed: ${inserted.error.code ?? 'unknown'}`,
    };
  }

  const notificationId = inserted.data?.id as string | undefined;
  if (!notificationId) {
    return { status: 'failed', error: 'insert_returned_no_id' };
  }

  // Step 3: 若有 email → 嘗試送 Email，成功則升級 sent_via
  if (!user.email) {
    return {
      status: 'sent',
      sentVia: 'in_app_only',
      notificationId,
      error: 'user_has_no_email',
    };
  }

  const emailResult = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.body,
  });

  if (!emailResult.success) {
    // 已寫入 in_app_only，email 失敗直接降級回傳
    return {
      status: 'sent',
      sentVia: 'in_app_only',
      notificationId,
      error: emailResult.error,
    };
  }

  // Step 4: Email 成功 → 升級 sent_via 為 email+in_app
  const { error: updateError } = await supabaseAdmin
    .from('notifications')
    .update({ sent_via: 'email+in_app' })
    .eq('id', notificationId);

  if (updateError) {
    // 更新失敗不影響 email 已送出，記 log 不 throw
    console.warn(
      `[dispatcher] update sent_via failed (non-fatal): ${updateError.code ?? 'unknown'}`
    );
  }

  return {
    status: 'sent',
    sentVia: 'email+in_app',
    notificationId,
  };
}
