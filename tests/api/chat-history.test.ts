/**
 * tests/api/chat-history.test.ts
 *
 * 覆蓋 Spec: text-conversation — Chat history retrieved per user
 *
 * Scenarios:
 * 1. 已授權用戶 → 回傳訊息陣列（按 created_at 升序）
 * 2. 空 history → 回傳 HTTP 200 with []
 * 3. 未授權請求 → 回傳 HTTP 401
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/chat/history/route';

// ─── Mock 依賴 ────────────────────────────────────────────────────────────────

const mockGetMessages = vi.fn();
const mockUpsertUser = vi.fn();

vi.mock('@/lib/db', () => ({
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  upsertUser: (...args: unknown[]) => mockUpsertUser(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function withSession(
  user: { id?: string; email?: string; name?: string } | null,
  fn: () => Promise<void>
) {
  const { getServerSession } = await import('next-auth');
  vi.mocked(getServerSession).mockResolvedValue(
    user ? { user, expires: '2099-01-01' } : null
  );
  await fn();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/chat/history — Chat history retrieved per user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('已授權用戶 → 回傳訊息陣列', async () => {
    const mockMessages = [
      { id: '1', role: 'user', content: '你好', created_at: '2026-01-01T10:00:00Z' },
      { id: '2', role: 'assistant', content: '我是小默', created_at: '2026-01-01T10:00:05Z' },
    ];
    mockGetMessages.mockResolvedValue(mockMessages);

    await withSession({ id: 'user-123', email: 'test@example.com' }, async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });
  });

  it('訊息依 created_at 升序排列（由 DB 層保證，API 層直接回傳）', async () => {
    const mockMessages = [
      { id: '1', role: 'user', content: '第一則', created_at: '2026-01-01T10:00:00Z' },
      { id: '2', role: 'assistant', content: '第二則', created_at: '2026-01-01T10:00:05Z' },
      { id: '3', role: 'user', content: '第三則', created_at: '2026-01-01T10:00:10Z' },
    ];
    mockGetMessages.mockResolvedValue(mockMessages);

    await withSession({ id: 'user-123', email: 'test@example.com' }, async () => {
      const res = await GET();
      const body = await res.json();

      // 確認順序與 DB 返回一致（升序）
      expect(body[0].content).toBe('第一則');
      expect(body[1].content).toBe('第二則');
      expect(body[2].content).toBe('第三則');
    });
  });

  it('空 history → 回傳 HTTP 200 with []', async () => {
    mockGetMessages.mockResolvedValue([]);

    await withSession({ id: 'user-123', email: 'test@example.com' }, async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  it('未授權請求 → 回傳 HTTP 401', async () => {
    await withSession(null, async () => {
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  it('未授權時不呼叫 getMessages', async () => {
    await withSession(null, async () => {
      await GET();
      expect(mockGetMessages).not.toHaveBeenCalled();
    });
  });

  it('有 Google ID 時用 Google ID 查詢，不呼叫 upsertUser', async () => {
    mockGetMessages.mockResolvedValue([]);

    await withSession({ id: 'google-id-456', email: 'test@example.com' }, async () => {
      await GET();
      expect(mockGetMessages).toHaveBeenCalledWith('google-id-456', expect.any(Number));
      expect(mockUpsertUser).not.toHaveBeenCalled();
    });
  });

  it('沒有 Google ID 時 fallback 到 upsertUser 取得 UUID', async () => {
    mockUpsertUser.mockResolvedValue('fallback-uuid-789');
    mockGetMessages.mockResolvedValue([]);

    await withSession({ email: 'test@example.com' }, async () => {
      await GET();
      expect(mockUpsertUser).toHaveBeenCalledWith('test@example.com', undefined);
      expect(mockGetMessages).toHaveBeenCalledWith('fallback-uuid-789', expect.any(Number));
    });
  });
});
