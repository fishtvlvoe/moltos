/**
 * tests/api/elevenlabs-webhook.test.ts — ElevenLabs Post-conversation Webhook 單元測試
 *
 * 測試覆蓋：
 * 1. 正常通話紀錄 → 逐條存入 Supabase，回傳 saved 筆數
 * 2. 空 transcript → 回傳 saved: 0，不呼叫 saveMessage
 * 3. 單筆存入失敗不中斷整批（容錯）
 * 4. 無效 JSON body → 回傳 400
 * 5. agent 角色 → 存成 assistant
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/elevenlabs-webhook/route';
import { NextRequest } from 'next/server';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

// Mock saveMessage：預設成功
const mockSaveMessage = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveMessage: (...args: unknown[]) => mockSaveMessage(...args),
}));

// Mock supabaseAdmin（被 lib/db 間接使用）
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({ data: [], error: null }),
    }),
  },
}));

// ─── 輔助函式 ─────────────────────────────────────────────────────────────────

/** 建立標準 POST 請求 */
function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/elevenlabs-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** 建立有效的 post-conversation webhook payload */
function makeValidPayload() {
  return {
    agent_id: 'agent_test_001',
    conversation_id: 'conv_abc123',
    transcript: [
      { role: 'user', message: '你好' },
      { role: 'agent', message: '你好！我是小默，請問有什麼可以幫助你？' },
      { role: 'user', message: '我想了解摩托車保養' },
      { role: 'agent', message: '當然！定期保養很重要……' },
    ],
    metadata: { duration: 120 },
  };
}

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('POST /api/elevenlabs-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. 正常通話紀錄存入 ───────────────────────────────────────────────────────

  describe('正常通話紀錄', () => {
    it('有效 payload → 回傳 200 與正確 saved 筆數', async () => {
      const res = await POST(makeRequest(makeValidPayload()));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.saved).toBe(4); // 4 筆非空訊息
    });

    it('逐條呼叫 saveMessage，筆數與 transcript 一致', async () => {
      await POST(makeRequest(makeValidPayload()));
      expect(mockSaveMessage).toHaveBeenCalledTimes(4);
    });

    it('userId 格式為 voice:{conversation_id}', async () => {
      await POST(makeRequest(makeValidPayload()));
      // 每次呼叫的第一個參數都是 voiceUserId
      expect(mockSaveMessage).toHaveBeenCalledWith(
        'voice:conv_abc123',
        expect.any(String),
        expect.any(String)
      );
    });

    it('agent 角色 → 存成 assistant', async () => {
      await POST(makeRequest(makeValidPayload()));

      // 找出 role 為 assistant 的呼叫
      const assistantCalls = mockSaveMessage.mock.calls.filter(
        (call) => call[1] === 'assistant'
      );
      expect(assistantCalls.length).toBe(2); // payload 有 2 個 agent 訊息
    });

    it('user 角色 → 存成 user', async () => {
      await POST(makeRequest(makeValidPayload()));

      const userCalls = mockSaveMessage.mock.calls.filter(
        (call) => call[1] === 'user'
      );
      expect(userCalls.length).toBe(2); // payload 有 2 個 user 訊息
    });

    it('transcript 用 content 欄位（fallback）也可正常儲存', async () => {
      const payload = {
        conversation_id: 'conv_fallback',
        transcript: [
          { role: 'user', content: '用 content 欄位的訊息' },
        ],
      };
      const res = await POST(makeRequest(payload));
      const json = await res.json();
      expect(json.saved).toBe(1);
      expect(mockSaveMessage).toHaveBeenCalledWith(
        'voice:conv_fallback',
        'user',
        '用 content 欄位的訊息'
      );
    });
  });

  // ── 2. 空 transcript 或缺少 transcript ───────────────────────────────────────

  describe('空 transcript', () => {
    it('transcript 為空陣列 → 回傳 saved: 0，不呼叫 saveMessage', async () => {
      const res = await POST(
        makeRequest({ conversation_id: 'conv_empty', transcript: [] })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.saved).toBe(0);
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });

    it('缺少 transcript 欄位 → 回傳 saved: 0', async () => {
      const res = await POST(
        makeRequest({ conversation_id: 'conv_no_transcript' })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.saved).toBe(0);
    });

    it('transcript 為 null → 回傳 saved: 0', async () => {
      const res = await POST(
        makeRequest({ conversation_id: 'conv_null', transcript: null })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.saved).toBe(0);
    });

    it('transcript 內全為空字串 → 跳過，saved: 0', async () => {
      const res = await POST(
        makeRequest({
          conversation_id: 'conv_blank',
          transcript: [
            { role: 'user', message: '   ' },
            { role: 'agent', message: '' },
          ],
        })
      );
      const json = await res.json();
      expect(json.saved).toBe(0);
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });
  });

  // ── 3. saveMessage 部分失敗（容錯）────────────────────────────────────────────

  describe('容錯處理', () => {
    it('部分訊息存入失敗 → 繼續處理其餘筆數，回傳成功存入數', async () => {
      // 第 1 筆失敗，第 2、3、4 筆成功
      mockSaveMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue(undefined);

      const res = await POST(makeRequest(makeValidPayload()));
      expect(res.status).toBe(200);
      const json = await res.json();
      // 第 1 筆失敗不計入，其餘 3 筆成功
      expect(json.saved).toBe(3);
    });
  });

  // ── 4. 無效 request body ──────────────────────────────────────────────────────

  describe('錯誤處理', () => {
    it('無效 JSON body → 回傳 400', async () => {
      const req = new NextRequest('http://localhost/api/elevenlabs-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-valid-json{{{',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('無效 JSON body → 不呼叫 saveMessage', async () => {
      const req = new NextRequest('http://localhost/api/elevenlabs-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'broken-json',
      });
      await POST(req);
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });
  });
});
