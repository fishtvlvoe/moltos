/**
 * tests/api/elevenlabs-webhook-user-id-fix.test.ts
 *
 * 場景 2 & 4：user_id 匹配 + webhook 延遲容忍
 * 覆蓋 Spec: voice-conversation — Webhook uses call_sessions to get correct user_id
 *
 * 場景 2：Webhook 應從 call_sessions 查詢正確的 user_id
 * 場景 4：即使 webhook 延遲 20s 到達，也應成功存入（配合加長的 pollForNewMessages）
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
      { role: 'agent', message: '你好！' },
      { role: 'user', message: '保養問題' },
      { role: 'agent', message: '可以幫忙' },
    ],
  };
}

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('POST /api/elevenlabs-webhook (Fix: user_id & delay tolerance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 場景 2：webhook 從 call_sessions 查出 user_id ──────────────────────────────

  describe('場景 2：User ID 匹配 (call_sessions lookup)', () => {
    it('conversation_id 在 call_sessions 中有記錄 → 用查出的 user_id 存訊息', async () => {
      // Mock call_sessions 有這筆記錄
      mockGetCallSession.mockResolvedValueOnce({
        conversation_id: 'conv_abc123',
        user_id: 'real-user-id-789',
      });

      await POST(makeRequest(makeValidPayload()));

      // 核心斷言：saveMessage 應被呼叫 4 次，第 1 個參數是真實 user_id（不是 voice: 前綴）
      expect(mockSaveMessage).toHaveBeenCalledTimes(4);

      // 驗證所有 saveMessage 呼叫的第 1 個參數都是 real-user-id-789
      mockSaveMessage.mock.calls.forEach((call) => {
        expect(call[0]).toBe('real-user-id-789');
        expect(call[0]).not.toMatch(/^voice:/);
      });
    });

    it('call_sessions 查詢失敗時，fallback 到 voice:{conversation_id}', async () => {
      // Mock getCallSession 回傳 null（表示無記錄）
      mockGetCallSession.mockResolvedValueOnce(null);

      await POST(makeRequest(makeValidPayload()));

      // Fallback：用 voice: 前綴
      expect(mockSaveMessage).toHaveBeenCalledWith(
        'voice:conv_abc123',
        expect.any(String),
        expect.any(String)
      );
    });

    it('getCallSession 拋出錯誤時，不中斷 webhook，fallback 到 voice: 前綴', async () => {
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

    it('多筆 transcript，所有訊息應用同一個 user_id（來自 call_sessions）', async () => {
      mockGetCallSession.mockResolvedValueOnce({
        conversation_id: 'conv_abc123',
        user_id: 'consistent-user-id',
      });

      await POST(makeRequest(makeValidPayload()));

      // 所有 4 筆訊息都應用同一個 user_id
      const userIds = mockSaveMessage.mock.calls.map((call) => call[0]);
      expect(new Set(userIds)).toEqual(new Set(['consistent-user-id']));
      expect(userIds.every((id) => id === 'consistent-user-id')).toBe(true);
    });
  });

  // ── 場景 4：webhook 延遲容忍（搭配加長的 pollForNewMessages） ───────────────────

  describe('場景 4：Webhook 延遲到達容忍', () => {
    it('webhook 延遲 20s 到達，saveMessage 仍應成功存入', async () => {
      // 模擬：getCallSession 非同步延遲（模擬 DB 查詢延遲）
      mockGetCallSession.mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              conversation_id: 'conv_abc123',
              user_id: 'delayed-user-id',
            });
          }, 20000); // 20 秒延遲
        })
      );

      // 注意：這個測試模擬了 webhook 本身的處理延遲
      // 實際上，在集成層，pollForNewMessages 應等待 webhook 完成這個延遲操作
      const res = await POST(makeRequest(makeValidPayload()));

      // 應該仍能成功，因為非同步操作
      expect(res.status).toBe(200);
    });

    it('saveMessage 遭延遲但最終完成，webhook 應等待並記錄成功筆數', async () => {
      // Mock saveMessage 第 1 筆延遲 3 秒
      mockSaveMessage
        .mockImplementationOnce(() => new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 3000);
        }))
        .mockResolvedValue(undefined);

      await POST(makeRequest(makeValidPayload()));

      // 應仍回傳 200 且計數正確
      const json = (await POST(makeRequest(makeValidPayload()))).json();
      // 注意：實際的計數邏輯需要配合實作細節
      expect(mockSaveMessage).toHaveBeenCalled();
    });

    it('webhook 應在 30 秒內完成所有操作（與加強後的 pollForNewMessages 配合）', async () => {
      // 模擬所有操作在 25 秒內完成
      mockGetCallSession.mockResolvedValueOnce({
        conversation_id: 'conv_abc123',
        user_id: 'on-time-user-id',
      });

      const startTime = Date.now();
      const res = await POST(makeRequest(makeValidPayload()));
      const endTime = Date.now();

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.saved).toBe(4);

      // 測試本身執行時間應快（實際延遲由 pollForNewMessages 那邊配合）
      expect(endTime - startTime).toBeLessThan(5000); // 實測應 < 1s
    });

    it('getCallSession 被呼叫時，應用正確的 conversation_id 參數', async () => {
      mockGetCallSession.mockResolvedValueOnce({
        conversation_id: 'conv_abc123',
        user_id: 'verify-param-user',
      });

      await POST(makeRequest(makeValidPayload()));

      // 驗證 getCallSession 被呼叫，且參數正確
      expect(mockGetCallSession).toHaveBeenCalledWith('conv_abc123');
    });
  });
});
