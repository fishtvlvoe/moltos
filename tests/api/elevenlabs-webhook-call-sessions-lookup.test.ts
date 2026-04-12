/**
 * tests/api/elevenlabs-webhook-call-sessions-lookup.test.ts
 *
 * 場景 3：Webhook 從 call_sessions 查出 user_id
 *
 * ✗ 紅燈原因：
 * - 目前 webhook route 尚未實作 getCallSession 查詢邏輯
 * - webhook 應該查 call_sessions 表，而不是用 fallback voice: 前綴
 * - 查出 user_id 後應用真實 user_id 存訊息
 *
 * 預期流程：
 * 1. Webhook 收到 conversation_id
 * 2. 呼叫 getCallSession(conversation_id) 查詢 call_sessions 表
 * 3. 用查出的 user_id 存訊息（不加 voice: 前綴）
 * 4. getCallSession 無記錄時 fallback voice:
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/elevenlabs-webhook/route';
import { NextRequest } from 'next/server';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

const mockSaveMessage = vi.fn().mockResolvedValue(undefined);
const mockGetCallSession = vi.fn().mockResolvedValue(null); // 預設無 call_sessions 記錄

vi.mock('@/lib/db', () => ({
  saveMessage: (...args: unknown[]) => mockSaveMessage(...args),
  getCallSession: (...args: unknown[]) => mockGetCallSession(...args),
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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/elevenlabs-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeValidPayload() {
  return {
    agent_id: 'agent_test_001',
    conversation_id: 'conv_abc123',
    transcript: [
      { role: 'user', message: '你好' },
      { role: 'agent', message: '你好！我是小默' },
      { role: 'user', message: '保養問題' },
      { role: 'agent', message: '可以幫忙' },
    ],
  };
}

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('POST /api/elevenlabs-webhook (call_sessions lookup)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ✗ 紅燈測試 1：webhook 應呼叫 getCallSession

  it('✗ webhook 收到 conversation_id 時應呼叫 getCallSession(conversation_id)', async () => {
    mockGetCallSession.mockResolvedValueOnce(null);

    await POST(makeRequest(makeValidPayload()));

    // ✗ 紅燈：目前 webhook route 尚未查詢 call_sessions
    expect(mockGetCallSession).toHaveBeenCalledOnce();
    expect(mockGetCallSession).toHaveBeenCalledWith('conv_abc123');
  });

  // ✗ 紅燈測試 2：查出 user_id 後應用真實 user_id 存訊息

  it('✗ 查出 user_id 後應用真實 user_id 存訊息（不加 voice: 前綴）', async () => {
    // Mock call_sessions 有這筆記錄
    mockGetCallSession.mockResolvedValueOnce({
      conversation_id: 'conv_abc123',
      user_id: 'real-user-id-789',
    });

    await POST(makeRequest(makeValidPayload()));

    // ✗ 紅燈：目前 webhook 可能用 voice: 前綴或沒有查詢 call_sessions
    expect(mockSaveMessage).toHaveBeenCalledTimes(4);

    // 驗證所有 saveMessage 呼叫的第 1 個參數都是真實 user_id
    mockSaveMessage.mock.calls.forEach((call) => {
      expect(call[0]).toBe('real-user-id-789');
      expect(call[0]).not.toMatch(/^voice:/);
    });
  });

  // ✗ 紅燈測試 3：多筆訊息應用同一個 user_id

  it('✗ 多筆訊息應用同一個 user_id（來自 call_sessions）', async () => {
    mockGetCallSession.mockResolvedValueOnce({
      conversation_id: 'conv_abc123',
      user_id: 'user_consistent_123',
    });

    await POST(makeRequest(makeValidPayload()));

    // 4 筆訊息都應該用同一個 user_id
    expect(mockSaveMessage).toHaveBeenCalledTimes(4);
    expect(mockSaveMessage.mock.calls[0][0]).toBe('user_consistent_123');
    expect(mockSaveMessage.mock.calls[1][0]).toBe('user_consistent_123');
    expect(mockSaveMessage.mock.calls[2][0]).toBe('user_consistent_123');
    expect(mockSaveMessage.mock.calls[3][0]).toBe('user_consistent_123');
  });

  // ✗ 紅燈測試 4：getCallSession 無記錄時 fallback voice:

  it('✗ call_sessions 查詢無記錄時，fallback 到 voice:{conversation_id}', async () => {
    mockGetCallSession.mockResolvedValueOnce(null);

    await POST(makeRequest(makeValidPayload()));

    // Fallback：用 voice: 前綴
    expect(mockSaveMessage).toHaveBeenCalledWith(
      'voice:conv_abc123',
      expect.any(String),
      expect.any(String)
    );
  });

  // ✗ 紅燈測試 5：getCallSession 拋出錯誤時容錯

  it('✗ getCallSession 拋出錯誤時應容錯（fallback voice:，不中斷 webhook）', async () => {
    mockGetCallSession.mockRejectedValueOnce(new Error('DB query error'));

    const res = await POST(makeRequest(makeValidPayload()));

    // Webhook 應仍回傳 200，使用 fallback user_id
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.saved).toBe(4);

    // 驗證用的是 fallback
    expect(mockSaveMessage).toHaveBeenCalledWith(
      'voice:conv_abc123',
      expect.any(String),
      expect.any(String)
    );
  });
});
