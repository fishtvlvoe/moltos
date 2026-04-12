/**
 * tests/api/call-sessions-race-condition.test.ts
 *
 * 場景：Race Condition 和時序問題的紅燈測試
 *
 * ✗ 紅燈原因：
 * - 當前架構：GET /api/elevenlabs-signed-url 呼叫 saveCallSession
 *   但 conversation_id 是 ElevenLabs 生成的，客端拿到 signed URL 後才得到真實 conversation_id
 * - Race Condition：webhook 可能在 saveCallSession 完成前到達
 * - 時序問題：conversation_id 在 startSession() 後才知道，不應該在 GET signed-url 時寫
 *
 * 正確流程應該是：
 * 1. GET /api/elevenlabs-signed-url → 只回 signed URL（不寫 DB）
 * 2. 前端 startSession({signedUrl}) → 得到 conversation_id
 * 3. 前端 POST /api/call-sessions { conversationId } → 才寫 DB
 * 4. Webhook 到達 → 從 call_sessions 查出 user_id
 *
 * 目前問題：step 1 就寫了不對的 conversation_id，或寫了錯誤的 mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as callSessionsPost } from '@/app/api/call-sessions/route';
import { GET as signedUrlGet } from '@/app/api/elevenlabs-signed-url/route';
import { POST as webhookPost } from '@/app/api/elevenlabs-webhook/route';
import { NextRequest } from 'next/server';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

const mockSaveCallSession = vi.fn().mockResolvedValue(undefined);
const mockGetCallSession = vi.fn().mockResolvedValue(null);
const mockDeleteCallSession = vi.fn().mockResolvedValue(undefined);
const mockSaveMessage = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveCallSession: (...args: unknown[]) => mockSaveCallSession(...args),
  getCallSession: (...args: unknown[]) => mockGetCallSession(...args),
  deleteCallSession: (...args: unknown[]) => mockDeleteCallSession(...args),
  saveMessage: (...args: unknown[]) => mockSaveMessage(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { email: 'test@example.com', id: 'google-uid-123' },
  }),
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

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('Call Session Race Condition & Timing Issues (紅燈測試)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
    process.env.NEXT_PUBLIC_CONVERSATION_ID = 'conv_env_123'; // env var（測試用）
    process.env.NEXT_PUBLIC_USER_ID = 'google-uid-123';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  // ✗ 紅燈測試 1：GET signed-url 不應該用 env var 的 conversation_id 寫 DB
  // 因為真實 conversation_id 尚未生成

  it('✗ GET /api/elevenlabs-signed-url 用 env var conversation_id 寫 DB 是錯的', async () => {
    // 當前實作：直接用 env var conversation_id 呼叫 saveCallSession
    // 但 env var 只是測試用，真實 conversation_id 應該由 ElevenLabs 生成

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://api.elevenlabs.io/signed/token=abc' }),
      text: () => Promise.resolve(''),
    }));

    const res = await signedUrlGet();
    expect(res.status).toBe(200);

    // ✗ 紅燈：現在會呼叫 saveCallSession('conv_env_123', 'google-uid-123')
    // 但 conv_env_123 不是真實的 conversation_id
    // 後續 webhook 用真實 conversation_id 查詢時會查不到
    expect(mockSaveCallSession).toHaveBeenCalled();
    const callArgs = mockSaveCallSession.mock.calls[0];
    expect(callArgs[0]).toBe('conv_env_123'); // ✗ 錯誤的 conversation_id
  });

  // ✗ 紅燈測試 2：Webhook 用真實 conversation_id 查詢，會查不到用 env var 寫的記錄

  it('✗ Webhook 用真實 conversation_id 查詢，會查不到（時序錯誤）', async () => {
    // Scenario：
    // 1. 前端呼叫 GET /api/elevenlabs-signed-url，寫入 call_sessions('conv_env_123', user_id)
    // 2. 前端拿到 signed URL，startSession()，得到真實 conversation_id = 'conv_real_abc123'
    // 3. Webhook 到達，用 conversation_id = 'conv_real_abc123' 查詢
    // 4. getCallSession('conv_real_abc123') 返回 null（因為寫的是 conv_env_123）

    // Mock：GET signed-url 寫的是 env var conversation_id
    mockSaveCallSession.mockResolvedValueOnce(undefined);

    // Webhook 用真實 conversation_id 查詢
    const realConversationId = 'conv_real_abc123';
    mockGetCallSession.mockResolvedValueOnce(null); // ✗ 查不到

    const webhookReq = new NextRequest('http://localhost/api/elevenlabs-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: realConversationId,
        transcript: [{ role: 'user', message: 'hello' }],
      }),
    });

    await webhookPost(webhookReq);

    // ✗ 紅燈：getCallSession 應該查到，但會是 null
    expect(mockGetCallSession).toHaveBeenCalledWith(realConversationId);
    // 因為時序錯誤，webhook 用的 user_id 會是 fallback voice:
    expect(mockSaveMessage).toHaveBeenCalledWith(
      `voice:${realConversationId}`,
      expect.any(String),
      expect.any(String)
    );
  });

  // ✗ 紅燈測試 3：正確流程應該是：前端先 startSession，後 POST call-sessions

  it('✗ 當前架構沒有明確強制「前端必須先 POST call-sessions」的步驟', async () => {
    // 正確流程：
    // 1. GET signed-url → 只回傳 signed URL，不寫 DB
    // 2. 前端 startSession() → 得到 real conversation_id
    // 3. 前端 POST call-sessions { conversationId: real_conv_id }
    // 4. Webhook 查詢 call-sessions

    // 但當前實作在 step 1 就寫了，並且寫的是錯誤的 conversation_id
    // 沒有強制步驟 3，或步驟 3 可以不做

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://test' }),
      text: () => Promise.resolve(''),
    }));

    // 前端跳過了 POST call-sessions，直接讓 webhook 到達
    const realConvId = 'conv_real_xyz';
    mockGetCallSession.mockResolvedValueOnce(null); // ✗ 找不到，因為沒有 POST

    const webhookReq = new NextRequest('http://localhost/api/elevenlabs-webhook', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: realConvId,
        transcript: [{ role: 'user', message: 'hi' }],
      }),
    });

    await webhookPost(webhookReq);

    // ✗ 紅燈：應該強制前端必須 POST call-sessions，但目前沒有檢查
    expect(mockGetCallSession).toHaveBeenCalledWith(realConvId);
  });

  // ✗ 紅燈測試 4：多個用戶快速調用時的 race condition

  it('✗ 多個用戶同時調用 GET signed-url，會寫多筆錯誤的 call_sessions 記錄', async () => {
    // User A 和 User B 同時呼叫 GET signed-url
    // 都用 env var conversation_id 寫 call_sessions
    // 後面的 webhook 用真實 conversation_id 查詢時全部失敗

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://test' }),
      text: () => Promise.resolve(''),
    }));

    // User A
    const resA = await signedUrlGet();
    expect(resA.status).toBe(200);

    // User B
    const resB = await signedUrlGet();
    expect(resB.status).toBe(200);

    // 都寫了相同的 env var conversation_id（時序錯誤）
    expect(mockSaveCallSession).toHaveBeenCalledTimes(2);
    mockSaveCallSession.mock.calls.forEach((call) => {
      expect(call[0]).toBe('conv_env_123'); // ✗ 都是同一個錯誤的 conversation_id
    });

    // 後面兩個 webhook 用不同的真實 conversation_id 到達
    // 都查不到
    const realConvA = 'conv_real_aaa';
    const realConvB = 'conv_real_bbb';

    mockGetCallSession.mockResolvedValueOnce(null);
    const webhookA = new NextRequest('http://localhost/api/elevenlabs-webhook', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: realConvA,
        transcript: [{ role: 'user', message: 'a' }],
      }),
    });
    await webhookPost(webhookA);

    mockGetCallSession.mockResolvedValueOnce(null);
    const webhookB = new NextRequest('http://localhost/api/elevenlabs-webhook', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: realConvB,
        transcript: [{ role: 'user', message: 'b' }],
      }),
    });
    await webhookPost(webhookB);

    // ✗ 紅燈：都用了 fallback voice: 前綴，user_id 匹配錯誤
    expect(mockSaveMessage).toHaveBeenCalledWith(
      `voice:${realConvA}`,
      expect.any(String),
      expect.any(String)
    );
    expect(mockSaveMessage).toHaveBeenCalledWith(
      `voice:${realConvB}`,
      expect.any(String),
      expect.any(String)
    );
  });
});
