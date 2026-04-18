import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock('@/lib/notifications/dispatcher', () => ({
  dispatchReminder: vi.fn(),
}));

import { GET } from '@/app/api/cron/send-reminders/route';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchReminder } from '@/lib/notifications/dispatcher';

// 取當下 TPE 小時，讓 reminder_schedule.time 能通過 hour 篩選
function currentTpeHourString(): string {
  const tpe = new Date(Date.now() + 8 * 3600_000);
  return `${String(tpe.getUTCHours()).padStart(2, '0')}:00`;
}

function mockEligibleUsersQuery(users: unknown[], error: { message: string } | null = null) {
  (supabaseAdmin.from as unknown as MockInstance).mockImplementation(
    () =>
      ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: users, error }),
        }),
      }) as never
  );
}

describe('GET /api/cron/send-reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: 'test_secret_123456789' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function makeReq(authHeader?: string) {
    const headers = new Headers();
    if (authHeader) headers.set('authorization', authHeader);
    return new Request('http://localhost/api/cron/send-reminders', { headers });
  }

  it('returns 401 without CRON_SECRET auth header', async () => {
    const response = await GET(makeReq());
    expect(response.status).toBe(401);
  });

  it('returns 401 with wrong bearer token (same length for timing-safe path)', async () => {
    const response = await GET(makeReq('Bearer wrong_secret_with_padding')); // 30 chars
    expect(response.status).toBe(401);
  });

  it('returns 200 and summary with valid CRON_SECRET', async () => {
    mockEligibleUsersQuery([
      {
        id: 'u1',
        email: 'u1@example.com',
        reminder_schedule: {
          enabled: true,
          time: currentTpeHourString(),
          frequency: 'daily',
          types: ['calm_index'],
        },
      },
    ]);

    (dispatchReminder as unknown as MockInstance).mockResolvedValue({
      status: 'sent',
      sentVia: 'email+in_app',
    });

    const response = await GET(makeReq('Bearer test_secret_123456789'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ total: 1, sent: 1, skipped: 0, failed: 0 });
  });

  it('isolates single-user dispatcher throw so batch keeps running', async () => {
    mockEligibleUsersQuery([
      {
        id: 'u1',
        email: 'u1@example.com',
        reminder_schedule: {
          enabled: true,
          time: currentTpeHourString(),
          frequency: 'daily',
        },
      },
      {
        id: 'u2',
        email: 'u2@example.com',
        reminder_schedule: {
          enabled: true,
          time: currentTpeHourString(),
          frequency: 'daily',
        },
      },
    ]);

    (dispatchReminder as unknown as MockInstance)
      .mockRejectedValueOnce(new Error('boom on u1'))
      .mockResolvedValueOnce({ status: 'sent', sentVia: 'email+in_app' });

    const response = await GET(makeReq('Bearer test_secret_123456789'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.failed).toBe(1);
    expect(body.sent).toBe(1);
  });

  it('returns 500 with generic error on DB failure (no leakage)', async () => {
    mockEligibleUsersQuery([], { message: 'relation "users" does not exist' });
    const response = await GET(makeReq('Bearer test_secret_123456789'));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'internal_error' });
  });
});
