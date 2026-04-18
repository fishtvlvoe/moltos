import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('@/lib/email/tosend', () => ({
  sendEmail: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

import { dispatchReminder } from '@/lib/notifications/dispatcher';
import { sendEmail } from '@/lib/email/tosend';
import { supabaseAdmin } from '@/lib/supabase';

interface InsertSetup {
  insertData?: { id: string } | null;
  insertError?: { code?: string; message?: string } | null;
  updateError?: { code?: string } | null;
}

function setupSupabaseFrom(opts: InsertSetup) {
  const insertSingle = vi.fn().mockResolvedValue({
    data: opts.insertData ?? { id: 'notif_new_id' },
    error: opts.insertError ?? null,
  });
  const insertBuilder = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: insertSingle }),
  });
  const updateBuilder = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });

  (supabaseAdmin.from as unknown as MockInstance).mockImplementation(() => ({
    insert: insertBuilder,
    update: updateBuilder,
  }) as never);
}

describe('lib/notifications/dispatcher.ts — dispatchReminder()', () => {
  const user = { id: 'user_123', email: 'alice@example.com' };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('insert + email success → sent_via "email+in_app"', async () => {
    setupSupabaseFrom({ insertData: { id: 'nid' } });
    (sendEmail as unknown as MockInstance).mockResolvedValue({
      success: true,
      messageId: 'msg_abc',
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('email+in_app');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@example.com' })
    );
  });

  it('email fails → falls back to in_app_only, does not throw', async () => {
    setupSupabaseFrom({ insertData: { id: 'nid' } });
    (sendEmail as unknown as MockInstance).mockResolvedValue({
      success: false,
      error: 'tosend_http_500',
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('in_app_only');
    expect(result.error).toContain('tosend_http_500');
  });

  it('DB UNIQUE violation (23505) → skipped without calling sendEmail', async () => {
    setupSupabaseFrom({
      insertData: null,
      insertError: { code: '23505', message: 'duplicate key' },
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('already_sent_today');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('other DB error → failed', async () => {
    setupSupabaseFrom({
      insertData: null,
      insertError: { code: '42P01', message: 'relation not found' },
    });

    const result = await dispatchReminder(user, 'calm_reminder');

    expect(result.status).toBe('failed');
    expect(result.error).toContain('42P01');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('user has no email → in_app_only without calling sendEmail', async () => {
    setupSupabaseFrom({ insertData: { id: 'nid' } });

    const result = await dispatchReminder(
      { id: 'user_no_email', email: null },
      'calm_reminder'
    );

    expect(result.status).toBe('sent');
    expect(result.sentVia).toBe('in_app_only');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
