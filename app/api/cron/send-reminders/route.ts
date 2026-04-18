/**
 * Vercel Cron endpoint — 發送 reminder 通知
 *
 * 設計：
 * - Vercel Hobby 方案：每日 9:00 / 20:00 TPE 各一次（vercel.json cron `0 1,12 * * *`）
 * - 篩選條件：reminder_schedule.enabled = true、time 小時 = 當下 TPE 小時（9 或 20）
 * - frequency：daily 每日 / weekly 僅週一 / monthly 僅每月 1 號
 * - 失敗隔離：單一用戶 throw 不影響其他用戶（Decision 5）
 * - 冪等：由 dispatcher 內部 notifications 表查詢（Decision 4）
 *
 * 對應 openspec/changes/notification-delivery-mvp/design.md
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchReminder, type NotificationType } from '@/lib/notifications/dispatcher';

interface ReminderSchedule {
  enabled?: boolean;
  time?: string; // HH:MM
  frequency?: 'daily' | 'weekly' | 'monthly';
  types?: string[];
}

interface UserRow {
  id: string;
  email: string | null;
  reminder_schedule: ReminderSchedule | null;
}

interface DispatchSummary {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ user_id: string; error: string }>;
}

function nowInTaipei(): { hour: number; dayOfWeek: number; dayOfMonth: number } {
  // 以 UTC 時間 +8 小時換算，避免受伺服器時區影響
  const utcMs = Date.now();
  const tpe = new Date(utcMs + 8 * 3600_000);
  return {
    hour: tpe.getUTCHours(),
    dayOfWeek: tpe.getUTCDay(), // 0 = Sun, 1 = Mon ...
    dayOfMonth: tpe.getUTCDate(),
  };
}

function shouldSendForFrequency(
  frequency: ReminderSchedule['frequency'],
  tpe: ReturnType<typeof nowInTaipei>
): boolean {
  if (frequency === 'daily' || !frequency) return true;
  if (frequency === 'weekly') return tpe.dayOfWeek === 1; // 週一
  if (frequency === 'monthly') return tpe.dayOfMonth === 1; // 每月 1 號
  return false;
}

function parseHour(time: string | undefined): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):\d{2}$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function mapType(t: string): NotificationType {
  // MVP 只支援一種；未來可擴充
  return 'calm_reminder';
}

export async function GET(request: Request): Promise<Response> {
  // 1. 驗證 CRON_SECRET
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!expectedSecret || provided !== expectedSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tpe = nowInTaipei();

  // 2. 查詢所有啟用提醒的用戶（filter 階段用簡單 enabled 條件，細節在 JS 過濾）
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, reminder_schedule')
    .eq('reminder_schedule->>enabled', 'true');

  if (error) {
    return NextResponse.json(
      { error: `query_users_failed: ${error.message}` },
      { status: 500 }
    );
  }

  const users = ((data ?? []) as UserRow[]).filter((u) => {
    const schedule = u.reminder_schedule;
    if (!schedule?.enabled) return false;

    // time 小時匹配（僅處理 9 或 20 時段）
    const scheduledHour = parseHour(schedule.time);
    if (scheduledHour === null) return false;
    if (scheduledHour !== tpe.hour) return false;

    // frequency 判定
    if (!shouldSendForFrequency(schedule.frequency, tpe)) return false;

    return true;
  });

  const summary: DispatchSummary = {
    total: users.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // 3. 逐一派發（每個 user 獨立 try/catch → Decision 5）
  for (const u of users) {
    const type = mapType(u.reminder_schedule?.types?.[0] ?? 'calm_index');
    try {
      const result = await dispatchReminder({ id: u.id, email: u.email }, type);
      if (result.status === 'sent') summary.sent += 1;
      else if (result.status === 'skipped') summary.skipped += 1;
      else {
        summary.failed += 1;
        summary.errors.push({
          user_id: u.id,
          error: result.error ?? 'unknown',
        });
      }
    } catch (err) {
      summary.failed += 1;
      summary.errors.push({
        user_id: u.id,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`[cron/send-reminders] user ${u.id} failed:`, err);
    }
  }

  return NextResponse.json(summary, { status: 200 });
}
