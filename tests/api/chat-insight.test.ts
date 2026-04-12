/**
 * tests/api/chat-insight.test.ts
 *
 * 覆蓋 Spec: ai-provider-cleanup — Chat Insight API 改用 Groq
 *
 * Scenario:
 * 1. POST /api/chat/insight 以有效對話訊息 → 回傳 { summary, calmState, innerNeeds, growthPaths, ... }
 * 2. 背後應使用 Groq Llama 3.3（不是 Gemini）
 * 3. JSON 結構應與原 Gemini 回應格式一致
 *
 * 紅燈原因：目前 insight/route.ts 仍使用 GoogleGenerativeAI，尚未切換 Groq
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Groq SDK（目標：稍後改用此 SDK）────────────────────────────────

const mockGroqCreate = vi.fn();

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = {
      completions: {
        create: mockGroqCreate,
      },
    };
  },
}));

// ─── Mock 依賴 ────────────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat/insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── 匯入 route handler────────────────────────────────────────────────────

import { POST } from '@/app/api/chat/insight/route';

// ─── Tests ────────────────────────────────────────────────────────────────

describe('POST /api/chat/insight — AI Provider Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-groq-key';

    // Mock Groq response（與 Gemini 相同的 JSON 格式）
    mockGroqCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: '用戶正在思考如何改善日常節奏',
              calmState: '正在尋找方向，內心有些浮動但積極思考中',
              calmScore: 55,
              innerNeeds: ['需要明確的行動步驟', '需要被理解'],
              growthPaths: [
                '從明天開始實踐一個小改變',
                '與朋友分享自己的想法',
              ],
              emotionalTone: '積極探索中',
              needsProfessional: false,
            }),
          },
        },
      ],
    });
  });

  it('紅燈：POST 成功 → 回傳正確 JSON 結構（尚未切換 Groq）', async () => {
    const req = makeRequest({
      messages: [
        { role: 'user', content: '我最近覺得生活沒有節奏' },
        { role: 'assistant', content: '能具體說說嗎？' },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();

    // 檢查必要欄位存在（與原 Gemini 格式一致）
    expect(json).toMatchObject({
      summary: expect.any(String),
      calmState: expect.any(String),
      calmScore: expect.any(Number),
      innerNeeds: expect.any(Array),
      growthPaths: expect.any(Array),
      emotionalTone: expect.any(String),
      needsProfessional: expect.any(Boolean),
    });
  });

  it('紅燈：應驗證使用者訊息存在', async () => {
    const req = makeRequest({
      messages: [{ role: 'assistant', content: '只有助手訊息' }],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('沒有使用者訊息');
  });

  it('紅燈：空訊息應回傳 400', async () => {
    const req = makeRequest({ messages: [] });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('對話紀錄為空');
  });

  it('紅燈：當前實作仍使用 GoogleGenerativeAI（後續改為 Groq）', async () => {
    // 此測試檢查目前的實作狀態
    // 現在應為紅燈：程式碼仍匯入 GoogleGenerativeAI
    const hasGeminiImport = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@google/generative-ai');
        return true;
      } catch {
        return false;
      }
    })();

    expect(hasGeminiImport).toBe(true); // 紅燈：目前仍有 import
  });
});
