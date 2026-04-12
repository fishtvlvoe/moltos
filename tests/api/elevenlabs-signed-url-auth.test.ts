/**
 * tests/api/elevenlabs-signed-url-auth.test.ts
 *
 * 場景 2：GET /api/elevenlabs-signed-url 認證檢查
 *
 * ✗ 紅燈原因：
 * - 目前 GET route 沒有檢查 next-auth session
 * - 無 session 應回 401，但目前可能直接回傳 signed URL
 *
 * 預期流程：
 * 1. 無 session → 401
 * 2. 有 session → 200，回傳 signed URL
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/elevenlabs-signed-url/route';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

const mockSaveCallSession = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveCallSession: (...args: unknown[]) => mockSaveCallSession(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({ data: [], error: null }),
    }),
  },
}));

// ─── 輔助函式 ─────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth';
const mockGetServerSession = vi.mocked(getServerSession);

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('GET /api/elevenlabs-signed-url (認證檢查)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCallSession.mockResolvedValue(undefined);
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
    process.env.NEXT_PUBLIC_CONVERSATION_ID = 'conv_test_123';
    process.env.NEXT_PUBLIC_USER_ID = 'user_real_456';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  // ✗ 紅燈測試 1：無 session 應回 401

  it('✗ 無 session 時應回 401', async () => {
    mockGetServerSession.mockResolvedValue(null);

    // ✗ 紅燈：目前 GET route 尚未檢查 session，可能直接回傳 signed URL
    const res = await GET();
    expect(res.status).toBe(401);
  });

  // ✗ 紅燈測試 2：有 session → 200 + signed URL

  it('✗ 有 session 時應回 200，回傳 signed URL', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-456' },
    } as never);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://api.elevenlabs.io/signed/token=abc' }),
      text: () => Promise.resolve(''),
    }));

    // ✗ 紅燈：目前 route 可能沒有檢查 session，或回傳格式錯誤
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('signedUrl');
    expect(json.signedUrl).toMatch(/^wss:\/\//);
  });

  // ✗ 已棄用（新設計）：GET /api/elevenlabs-signed-url 不應呼叫 saveCallSession
  // 根據 fix-call-transcript-red-light.test.ts，流程改為：
  // 1. GET signed-url → 只驗證 session，回傳 signed URL（不寫 DB）
  // 2. 前端 startSession() → 得到真實 conversation_id
  // 3. 前端 POST /api/call-sessions → 建立 conversation_id → user_id 映射
  // it('✗ 有 session 時應先呼叫 saveCallSession(conversation_id, user_id)', async () => { ... });
  // it('✗ saveCallSession 失敗時應容錯（仍回傳 200 + signed URL）', async () => { ... });
});
