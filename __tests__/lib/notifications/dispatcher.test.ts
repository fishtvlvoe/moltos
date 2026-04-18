import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

// 必須在 import dispatcher 之前 mock 它的兩個依賴
vi.mock('@/lib/email/tosend', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/supabase', () => {
  const chain = {
    from: vi.fn(),
  };
  return { supabaseAdmin: chain };
});

import { dispatchReminder } from '@/lib/notifications/dispatcher';
import { sendEmail } from '@/lib/email/tosend';
import { supabaseAdmin } from '@/lib/supabase';

type FromResult = ReturnType<typeof supabaseAdmin.from>;

/**
 * 建構鏈式 query builder mock：
 * - select().eq().eq().gte().maybeSingle() → 查今日冪等
 * - insert().select().single() → 寫 notifications row
 * - update().eq() → 更新 sent_via
 */
function makeSupabaseMock(options: {
  existingToday?: unknown;
  insertedRow?: { id: string } | null;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
}): MockInstance {
  const maybeSingleIdempotency = vi.fn().mockResolvedValue({
    data: options.existingToday ?? null,
    error: null,
  });

  const selectChainIdempotency = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          maybeSingle: maybeSingleIdempotency,
        }),
      }),
    }),
  });

  const insertSingle = vi.fn().mockResolvedValue({
    data: options.insertedRow ?? { id: 'notif_new_id' },
    error: options.insertError ?? null,
  });
  const insertBuilder = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: insertSingle,
    }),
  });

  const updateEq = vi.fn().mockResolvedValue({ error: options.updateError ?? null });
  const updateBuilder = vi.fn().mockReturnValue({
    eq: updateEq,
  });

  const fromMock = vi.fn().mockReturnValue({
    select: selectChainIdempotency,
    insert: insertBuilder,
    update: updateBuilder,
  } as unknown as FromResult);

  (supabaseAdmin.from as unknown as MockInstance).mockImplementation(fromMock);
  return fromMock;
}

describe('lib/notifications/dispatcher.ts — dispatchReminder()', () => {
  const user = { id: 'user_123', email: 'alice@example.com' };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('email sent + notifications row written → sent_via "email+in_app"', async () => {
    makeSupabaseMock({});
    (sendEmail as unknown as MockInstance).mockResolvedValue({
      success: true,
      messageId: 'msg_abc',
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('email+in_app');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
      })
    );
  });

  it('email fails → falls back to in_app_only, does not throw', async () => {
    makeSupabaseMock({});
    (sendEmail as unknown as MockInstance).mockResolvedValue({
      success: false,
      error: 'tosend_http_500',
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('in_app_only');
    expect(result.error).toContain('tosend_http_500');
  });

  it('already sent today → skipped without calling sendEmail', async () => {
    makeSupabaseMock({
      existingToday: { id: 'existing_notif', sent_via: 'email+in_app' },
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('already_sent_today');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('missing email → fails gracefully with in_app_only (cannot email without address)', async () => {
    makeSupabaseMock({});

    const result = await dispatchReminder(
      { id: 'user_no_email', email: null },
      'calm_reminder'
    );

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('in_app_only');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
