import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

import { GET } from '@/app/api/notifications/route';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';

function chainResolvingTo(result: { data: unknown; error: unknown }) {
  // users lookup: .from('users').select().eq().maybeSingle()
  const usersChain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user_db_id' },
          error: null,
        }),
      }),
    }),
  };

  // notifications list: from().select().eq().order()
  // unread filter:      from().select().eq().is().order()
  // count_only:         from().select('*', { count: 'exact', head: true }).eq()
  const notificationsChain = {
    select: vi.fn().mockImplementation((_cols: string, opts?: { head?: boolean }) => {
      if (opts?.head) {
        return {
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: (result.data as number) ?? 0, error: result.error }),
          }),
        };
      }
      const order = vi.fn().mockResolvedValue(result);
      const isMethod = vi.fn().mockReturnValue({ order });
      return {
        eq: vi.fn().mockReturnValue({
          is: isMethod,
          order,
        }),
      };
    }),
  };

  (supabaseAdmin.from as unknown as MockInstance).mockImplementation((table: string) => {
    if (table === 'users') return usersChain as never;
    if (table === 'notifications') return notificationsChain as never;
    throw new Error(`unexpected table ${table}`);
  });
}

describe('GET /api/notifications', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/notifications'));
    expect(res.status).toBe(401);
  });

  it('returns list 200 with array', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    chainResolvingTo({
      data: [
        { id: 'n1', title: 't', body: 'b', sent_via: 'email', read_at: null, created_at: '2026-04-19T00:00:00Z', type: 'calm_reminder' },
      ],
      error: null,
    });
    const res = await GET(new Request('http://localhost/api/notifications'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.notifications)).toBe(true);
    expect(body.notifications).toHaveLength(1);
  });

  it('returns count_only 200 with { count }', async () => {
    (getServerSession as unknown as MockInstance).mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    chainResolvingTo({ data: 7, error: null });
    const res = await GET(
      new Request('http://localhost/api/notifications?unread=true&count_only=true')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('count');
    expect(body.count).toBe(7);
  });
});
