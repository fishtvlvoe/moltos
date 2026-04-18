/**
 * 通知分派器（Reminder 專用）
 * 對應 openspec/changes/notification-delivery-mvp/design.md：
 *  - Decision 4: 冪等性機制 — notifications 表作為去重基準
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

/**
 * 回傳今日台北時區的 00:00 UTC ISO 字串。
 * 用於冪等查詢：只需檢查 created_at >= 今日 TPE 00:00（約等於昨日 UTC 16:00）。
 */
function getTpeDayStartUtcIso(): string {
  // 當下台北時間
  const now = new Date();
  const tpeNow = new Date(now.getTime() + 8 * 3600_000);
  tpeNow.setUTCHours(0, 0, 0, 0);
  // 換算回 UTC（TPE 00:00 = UTC 前一日 16:00）
  const utcEquivalent = new Date(tpeNow.getTime() - 8 * 3600_000);
  return utcEquivalent.toISOString();
}

export async function dispatchReminder(
  user: DispatchUser,
  type: NotificationType
): Promise<DispatchResult> {
  // Step 1: 冪等查詢 — 今日同 user + type 是否已發送
  const existing = await supabaseAdmin
    .from('notifications')
    .select('id, sent_via')
    .eq('user_id', user.id)
    .eq('type', type)
    .gte('created_at', getTpeDayStartUtcIso())
    .maybeSingle();

  if (existing.data) {
    return { status: 'skipped', reason: 'already_sent_today' };
  }

  // Step 2: 建立通知內容
  const template = buildCalmReminderTemplate();

  // Step 3: 先寫 notifications row（sent_via 先標 in_app_only，email 成功再 update）
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

  if (inserted.error || !inserted.data) {
    return {
      status: 'failed',
      error: `insert_notification_failed: ${inserted.error?.message ?? 'unknown'}`,
    };
  }

  const notificationId = inserted.data.id as string;

  // Step 4: 若有 email → 嘗試送 Email，成功則升級 sent_via
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

  // Step 5: Email 成功 → 升級 sent_via 為 email+in_app
  const { error: updateError } = await supabaseAdmin
    .from('notifications')
    .update({ sent_via: 'email+in_app' })
    .eq('id', notificationId);

  if (updateError) {
    // 更新失敗不影響 email 已送出，記 log 不 throw
    console.warn(
      `[dispatcher] update sent_via failed (non-fatal): ${updateError.message}`
    );
  }

  return {
    status: 'sent',
    sentVia: 'email+in_app',
    notificationId,
  };
}
