import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

import { POST } from '@/app/api/notifications/[id]/read/route';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';

function setupChains(opts: {
  user: { id: string } | null;
  notification: { id: string; user_id: string } | null;
  updateError?: { message: string } | null;
}) {
  (supabaseAdmin.from as unknown as MockInstance).mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: opts.user, error: null }),
          }),
        }),
      };
    }
    if (table === 'notifications') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.notification,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

describe('POST /api/notifications/[id]/read', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n1' }),
    });
    expect(res.status).toBe(401);
  });

  it('marks notification as read → 200', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    setupChains({
      user: { id: 'user_db_id' },
      notification: { id: 'n1', user_id: 'user_db_id' },
    });
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n1' }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when notification doesn't belong to user", async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    setupChains({
      user: { id: 'user_db_id' },
      notification: null,
    });
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n_other' }),
    });
    expect(res.status).toBe(404);
  });

  it('is idempotent for already-read notification → 200', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    setupChains({
      user: { id: 'user_db_id' },
      notification: { id: 'n1', user_id: 'user_db_id' },
    });
    const res1 = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n1' }),
    });
    const res2 = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n1' }),
    });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });
});
