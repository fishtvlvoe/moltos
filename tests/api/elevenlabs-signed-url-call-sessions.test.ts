/**
 * tests/api/elevenlabs-signed-url-call-sessions.test.ts
 *
 * 場景 1：call_sessions 存取
 * 覆蓋 Spec: voice-conversation — Before call, save conversation_id → user_id mapping
 *
 * 當呼叫 GET /api/elevenlabs-signed-url 時，應該先在 DB 存入 call_sessions 記錄
 * 使得後續 webhook 可以從 conversation_id 查出正確的 user_id
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/elevenlabs-signed-url/route';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

const mockSaveCallSession = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveCallSession: (...args: unknown[]) => mockSaveCallSession(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({ data: [], error: null }),
    }),
  },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/elevenlabs-signed-url (Fix: call_sessions)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
    process.env.NEXT_PUBLIC_CONVERSATION_ID = 'conv_test_123';
    process.env.NEXT_PUBLIC_USER_ID = 'user_real_456';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  // ── 場景 1：呼叫前，saveCallSession 應被呼叫 ──────────────────────────────────

  describe('saveCallSession - call_sessions 表新增記錄', () => {
    it('成功呼叫 signed-url API 時，應先調用 saveCallSession(conversation_id, user_id)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'wss://api.elevenlabs.io/signed/token=abc' }),
        text: () => Promise.resolve(''),
      }));

      const res = await GET();
      expect(res.status).toBe(200);

      // 核心斷言：saveCallSession 應被呼叫一次，參數為 (conversation_id, user_id)
      expect(mockSaveCallSession).toHaveBeenCalledOnce();
      expect(mockSaveCallSession).toHaveBeenCalledWith('conv_test_123', 'user_real_456');
    });

    it('saveCallSession 失敗時，API 應仍回傳 200（不中斷通話流程）', async () => {
      // Mock saveCallSession 拋出錯誤
      mockSaveCallSession.mockRejectedValueOnce(new Error('DB write failed'));

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'wss://test' }),
        text: () => Promise.resolve(''),
      }));

      const res = await GET();

      // 即使 DB 失敗，也應回傳 signed_url（容錯設計）
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.signedUrl).toBeDefined();
    });

    it('缺少 NEXT_PUBLIC_CONVERSATION_ID 時，不呼叫 saveCallSession', async () => {
      delete process.env.NEXT_PUBLIC_CONVERSATION_ID;

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'wss://test' }),
        text: () => Promise.resolve(''),
      }));

      const res = await GET();

      // saveCallSession 不應被呼叫，因為缺少 conversation_id
      expect(mockSaveCallSession).not.toHaveBeenCalled();
    });

    it('缺少 NEXT_PUBLIC_USER_ID 時，不呼叫 saveCallSession', async () => {
      delete process.env.NEXT_PUBLIC_USER_ID;

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'wss://test' }),
        text: () => Promise.resolve(''),
      }));

      const res = await GET();

      // saveCallSession 不應被呼叫，因為缺少 user_id
      expect(mockSaveCallSession).not.toHaveBeenCalled();
    });
  });
});
