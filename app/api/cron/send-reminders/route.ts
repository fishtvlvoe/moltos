/**
 * Vercel Cron endpoint — 發送 reminder 通知
 *
 * 設計：
 * - Vercel Hobby 方案：每日 9:00 / 20:00 TPE 各一次（vercel.json cron `0 1,12 * * *`）
 * - 篩選條件：reminder_schedule.enabled = true、time 小時 = 當下 TPE 小時（9 或 20）
 * - frequency：daily 每日 / weekly 僅週一 / monthly 僅每月 1 號
 * - 失敗隔離：單一用戶 throw 不影響其他用戶（Decision 5）
 * - 冪等：DB UNIQUE 索引 (user_id, type, DATE(created_at @ TPE))（Decision 4）
 *
 * CR 修正（2026-04-18）：
 * - C1: `->>enabled` 改 `->enabled`（JSONB bool 而非 string）
 * - C3: for 迴圈改 Promise.allSettled 分批並發（batchSize=25）
 * - H1: timing-safe secret compare
 * - H2: DB error 不回前端，僅 server log
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
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
}

const BATCH_SIZE = 25;

function nowInTaipei(): { hour: number; dayOfWeek: number; dayOfMonth: number } {
  const utcMs = Date.now();
  const tpe = new Date(utcMs + 8 * 3600_000);
  return {
    hour: tpe.getUTCHours(),
    dayOfWeek: tpe.getUTCDay(),
    dayOfMonth: tpe.getUTCDate(),
  };
}

function shouldSendForFrequency(
  frequency: ReminderSchedule['frequency'],
  tpe: ReturnType<typeof nowInTaipei>
): boolean {
  if (frequency === 'daily' || !frequency) return true;
  if (frequency === 'weekly') return tpe.dayOfWeek === 1;
  if (frequency === 'monthly') return tpe.dayOfMonth === 1;
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

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// MVP 只支援一種；未來可擴充
function mapType(_t: string): NotificationType {
  return 'calm_reminder';
}

export async function GET(request: Request): Promise<Response> {
  // 1. 驗證 CRON_SECRET（timing-safe）
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!expectedSecret || !provided || !secureCompare(provided, expectedSecret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tpe = nowInTaipei();

  // 2. 查詢所有啟用提醒的用戶
  // 注意：`->enabled` 取 JSONB value（保留 bool 型別），`->>enabled` 會轉成 text
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, reminder_schedule')
    .eq('reminder_schedule->enabled', true);

  if (error) {
    console.error('[cron/send-reminders] query_users_failed:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  const users = ((data ?? []) as UserRow[]).filter((u) => {
    const schedule = u.reminder_schedule;
    if (!schedule?.enabled) return false;

    const scheduledHour = parseHour(schedule.time);
    if (scheduledHour === null) return false;
    if (scheduledHour !== tpe.hour) return false;

    if (!shouldSendForFrequency(schedule.frequency, tpe)) return false;

    return true;
  });

  const summary: DispatchSummary = {
    total: users.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  // 3. 分批並發派發（每批 BATCH_SIZE 個，失敗隔離 → Decision 5）
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((u) => {
        const type = mapType(u.reminder_schedule?.types?.[0] ?? 'calm_index');
        return dispatchReminder({ id: u.id, email: u.email }, type);
      })
    );

    results.forEach((res, idx) => {
      const u = batch[idx];
      if (res.status === 'fulfilled') {
        const r = res.value;
        if (r.status === 'sent') summary.sent += 1;
        else if (r.status === 'skipped') summary.skipped += 1;
        else {
          summary.failed += 1;
          console.warn(
            `[cron/send-reminders] user ${u.id} dispatcher failed:`,
            r.error ?? 'unknown'
          );
        }
      } else {
        summary.failed += 1;
        console.error(`[cron/send-reminders] user ${u.id} threw:`, res.reason);
      }
    });
  }

  return NextResponse.json(summary, { status: 200 });
}
