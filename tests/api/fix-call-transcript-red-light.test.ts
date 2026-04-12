/**
 * tests/api/fix-call-transcript-red-light.test.ts
 *
 * 修復 call-transcript-not-showing 的紅燈測試
 * 基於 Kimi 診斷的根本設計問題
 *
 * ✗ 紅燈測試列表（測試應該實作但還沒有的行為）
 *
 * 問題分析：
 * - 當前 GET /api/elevenlabs-signed-url 呼叫 saveCallSession(env_var_conversation_id)
 * - 但真實 conversation_id 是由 ElevenLabs 在 startSession() 後才生成的
 * - 導致 webhook 用真實 conversation_id 查詢時查不到正確的 user_id
 * - 最終 transcript 被存成 voice:conv_xxx 而不是真實 user_id
 *
 * 正確的流程應該是：
 * 1. GET /api/elevenlabs-signed-url
 *    → 只回傳 signed URL（不寫 DB，因為 conversation_id 還未生成）
 *    → 應驗證 session（需認證）
 *
 * 2. 前端 startSession({signedUrl})
 *    → ElevenLabs 返回真實 conversation_id
 *
 * 3. 前端 POST /api/call-sessions { conversationId: real_id }
 *    → 建立 conversation_id → user_id 的映射，寫入 call_sessions
 *
 * 4. Webhook 到達
 *    → 從 call_sessions 查出 user_id（已實作 ✓）
 *    → 用正確 user_id 存 conversations（已實作 ✓）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as signedUrlGet } from '@/app/api/elevenlabs-signed-url/route';
import { POST as callSessionsPost } from '@/app/api/call-sessions/route';
import { NextRequest } from 'next/server';

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
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// ─── 輔助函式 ─────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth';
const mockGetServerSession = vi.mocked(getServerSession);

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('Fix call-transcript-not-showing (紅燈測試)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
    // ❌ 重點：不設定 NEXT_PUBLIC_CONVERSATION_ID，讓 route 無法用 env var 作為 conversation_id
    delete process.env.NEXT_PUBLIC_CONVERSATION_ID;
    process.env.NEXT_PUBLIC_USER_ID = 'google-uid-123';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  // ✗ 紅燈測試 1：GET signed-url 應該 NOT 呼叫 saveCallSession
  // 因為此時 conversation_id 還未生成

  it('✗ GET /api/elevenlabs-signed-url 應該 NOT 呼叫 saveCallSession（缺少真實 conversation_id）', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://api.elevenlabs.io/signed/token=abc' }),
      text: () => Promise.resolve(''),
    }));

    const res = await signedUrlGet();
    expect(res.status).toBe(200);

    // ✗ 紅燈：目前實作會呼叫 saveCallSession，但不應該
    // 因為沒有真實 conversation_id
    expect(mockSaveCallSession).not.toHaveBeenCalled(); // ❌ 會失敗（目前會呼叫）
  });

  // ✗ 紅燈測試 2：GET signed-url 應驗證 session（無 session → 401）

  it('✗ GET /api/elevenlabs-signed-url 無 session 時應回 401', async () => {
    mockGetServerSession.mockResolvedValue(null);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://test' }),
      text: () => Promise.resolve(''),
    }));

    const res = await signedUrlGet();

    // ✗ 紅燈：目前實作用 query param 或 env var，沒有 session 檢查
    expect(res.status).toBe(401); // ❌ 會失敗（目前回 200）
  });

  // ✗ 紅燈測試 3：前端必須先 POST call-sessions 才能開始通話
  // 目前沒有強制此步驟

  it('✗ 完整流程驗證：GET signed-url 後，必須 POST call-sessions 才能成功對應', async () => {
    // Step 1: GET signed-url（拿到 signed URL）
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://test' }),
      text: () => Promise.resolve(''),
    }));

    const res1 = await signedUrlGet();
    expect(res1.status).toBe(200);

    // Step 2: 前端 startSession() 得到真實 conversation_id
    const realConversationId = 'conv_real_xyz123';

    // Step 3: 前端 POST call-sessions 建立對應
    const callSessionsReq = new NextRequest('http://localhost/api/call-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: realConversationId }),
    });

    const res2 = await callSessionsPost(callSessionsReq);
    expect(res2.status).toBe(200);

    // ✗ 紅燈：驗證 saveCallSession 被呼叫時用的是真實 conversation_id
    // 但目前實作在 GET 時已呼叫（用了錯誤的 env var conversation_id）
    expect(mockSaveCallSession).toHaveBeenCalledWith(realConversationId, 'google-uid-123');
    // ❌ 這會失敗，因為 GET 時呼叫的是 env var 或空字串
  });

  // ✗ 紅燈測試 4：POST call-sessions 應驗證 session

  it('✗ POST /api/call-sessions 無 session 時應回 401', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/call-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv_real_xyz' }),
    });

    const res = await callSessionsPost(req);

    // ✗ 紅燈：驗證認證
    expect(res.status).toBe(401);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });

  // ✗ 紅燈測試 5：POST call-sessions 應驗證 conversationId 非空

  it('✗ POST /api/call-sessions conversationId 空時應回 400', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = new NextRequest('http://localhost/api/call-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: '' }),
    });

    const res = await callSessionsPost(req);

    expect(res.status).toBe(400);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });

  // ✗ 紅燈測試 6：POST call-sessions 應呼叫 saveCallSession 並回 200

  it('✗ POST /api/call-sessions 有效時應呼叫 saveCallSession 並回 200 { ok: true }', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const realConvId = 'conv_real_abc123';
    const req = new NextRequest('http://localhost/api/call-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: realConvId }),
    });

    const res = await callSessionsPost(req);

    expect(res.status).toBe(200);
    expect(mockSaveCallSession).toHaveBeenCalledWith(realConvId, 'google-uid-123');

    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});
