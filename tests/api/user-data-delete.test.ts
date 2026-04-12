/**
 * tests/api/user-data-delete.test.ts
 *
 * TDD: DELETE /api/user/data
 *
 * Requirements:
 * - No session -> 401
 * - With session -> delete user data across:
 *   - conversations (user_id)
 *   - conversation_insights (conversation_id IN user's conversations)
 *   - calm_index_history (user_id)
 * - Also calls ElevenLabs DELETE per conversation_id (non-blocking; errors tolerated)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DELETE } from '@/app/api/user/data/route';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

type MockSessionUser = { id?: string; email?: string; name?: string };

async function withSession(user: MockSessionUser | null, fn: () => Promise<void>) {
  const { getServerSession } = await import('next-auth');
  vi.mocked(getServerSession).mockResolvedValue(
    user ? ({ user, expires: '2099-01-01' } as never) : (null as never)
  );
  await fn();
}

function setupSupabaseMocks(params: {
  userId: string;
  conversationIds: string[];
}) {
  const { userId, conversationIds } = params;

  const mockConversationsSelectEq = vi.fn().mockResolvedValue({
    data: conversationIds.map((id) => ({ id })),
    error: null,
  });
  const mockConversationsDeleteEq = vi.fn().mockResolvedValue({ error: null });

  const conversationsTable = {
    select: vi.fn().mockReturnValue({
      eq: mockConversationsSelectEq,
    }),
    delete: vi.fn().mockReturnValue({
      eq: mockConversationsDeleteEq,
    }),
  };

  const mockInsightsIn = vi.fn().mockResolvedValue({ error: null });
  const conversationInsightsTable = {
    delete: vi.fn().mockReturnValue({
      in: mockInsightsIn,
    }),
  };

  const mockCalmHistoryEq = vi.fn().mockResolvedValue({ error: null });
  const calmIndexHistoryTable = {
    delete: vi.fn().mockReturnValue({
      eq: mockCalmHistoryEq,
    }),
  };

  mockFrom.mockImplementation((table: string) => {
    if (table === 'conversations') return conversationsTable;
    if (table === 'conversation_insights') return conversationInsightsTable;
    if (table === 'calm_index_history') return calmIndexHistoryTable;
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    mockConversationsSelectEq,
    mockConversationsDeleteEq,
    mockInsightsIn,
    mockCalmHistoryEq,
    userId,
    conversationIds,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DELETE /api/user/data — user data deletion', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-api-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('DELETE /api/user/data without session → 401 Unauthorized', async () => {
    await withSession(null, async () => {
      const res = await DELETE();
      expect(res.status).toBe(401);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  it("With session, delete conversations where user_id = session.user.id", async () => {
    const userId = 'user-123';
    const { mockConversationsSelectEq, mockConversationsDeleteEq, conversationIds } =
      setupSupabaseMocks({ userId, conversationIds: ['conv-1', 'conv-2'] });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', mockFetch);

    await withSession({ id: userId }, async () => {
      const res = await DELETE();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ success: true, deletedCount: conversationIds.length });

      expect(mockConversationsSelectEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockConversationsDeleteEq).toHaveBeenCalledWith('user_id', userId);

      // ElevenLabs DELETE called per conversation_id
      expect(mockFetch).toHaveBeenCalledTimes(conversationIds.length);
      for (const id of conversationIds) {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`/v1/convai/conversation/${id}`),
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({ 'xi-api-key': expect.any(String) }),
          })
        );
      }
    });
  });

  it("Delete conversation_insights where conversation_id IN (user's conversations)", async () => {
    const userId = 'user-123';
    const { mockInsightsIn, conversationIds } = setupSupabaseMocks({
      userId,
      conversationIds: ['conv-11', 'conv-22', 'conv-33'],
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') }));

    await withSession({ id: userId }, async () => {
      const res = await DELETE();
      expect(res.status).toBe(200);
      expect(mockInsightsIn).toHaveBeenCalledWith('conversation_id', conversationIds);
    });
  });

  it('Delete calm_index_history where user_id = session.user.id', async () => {
    const userId = 'user-999';
    const { mockCalmHistoryEq } = setupSupabaseMocks({
      userId,
      conversationIds: [],
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') }));

    await withSession({ id: userId }, async () => {
      const res = await DELETE();
      expect(res.status).toBe(200);
      expect(mockCalmHistoryEq).toHaveBeenCalledWith('user_id', userId);
    });
  });
});
