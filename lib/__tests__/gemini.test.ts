/**
 * T028: Gemini API 封裝測試
 *
 * 測試重點：
 * 1. buildSystemPrompt(calmSnapshot) — 有平靜指數時，prompt 包含分數和等級
 * 2. buildSystemPrompt(null) — 沒有平靜指數時，prompt 仍然合理
 * 3. formatChatHistory(messages) — ChatMessage[] → Gemini Content[] 格式轉換
 *
 * 注意：mock 掉 @google/generative-ai，不真正呼叫 API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatMessage, CalmIndexSnapshot } from '@/lib/types';

// ─── Mock @google/generative-ai ──────────────────────────────────────────────

// 建立可追蹤呼叫的 mock 物件
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
  generateContentStream: mockGenerateContentStream,
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// ─── 測試資料 ────────────────────────────────────────────────────────────────

/**
 * 建立測試用的 CalmIndexSnapshot（calm 等級）
 */
function buildCalmSnapshot(overrides?: Partial<CalmIndexSnapshot['result']>): CalmIndexSnapshot {
  return {
    result: {
      score: 80,
      level: 'calm',
      dimensions: [],
      calculatedAt: Date.now(),
      alerts: [],
      ...overrides,
    },
    coverageDays: 14,
    isStale: false,
    createdAt: Date.now(),
  };
}

/**
 * 建立測試用的聊天記錄
 */
function buildChatMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-1',
      role: 'user',
      content: '你好，我今天感覺很緊張',
      timestamp: Date.now() - 10000,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '我理解你的感受，能說說是什麼讓你感到緊張嗎？',
      timestamp: Date.now() - 5000,
    },
    {
      id: 'msg-3',
      role: 'user',
      content: '工作壓力很大',
      timestamp: Date.now(),
    },
  ];
}

// ─── buildSystemPrompt 測試 ──────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  let buildSystemPrompt: (snapshot: CalmIndexSnapshot | null) => string;

  beforeEach(async () => {
    // 每個測試前重新 import，確保 mock 狀態乾淨
    const module = await import('@/lib/gemini');
    buildSystemPrompt = module.buildSystemPrompt;
  });

  it('有平靜指數時，prompt 應包含分數', () => {
    const snapshot = buildCalmSnapshot({ score: 80 });
    const prompt = buildSystemPrompt(snapshot);
    expect(prompt).toContain('80');
  });

  it('有平靜指數時，prompt 應包含分數資訊', () => {
    const snapshot = buildCalmSnapshot({ score: 65, level: 'mild' });
    const prompt = buildSystemPrompt(snapshot);
    expect(prompt).toContain('65');
  });

  it('calmSnapshot 為 null 時，prompt 仍為非空字串', () => {
    const prompt = buildSystemPrompt(null);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(10);
  });

  it('calmSnapshot 為 null 時，prompt 不含 undefined 或 null 字串', () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).not.toContain('undefined');
    expect(prompt).not.toContain('null');
  });

  it('attention 等級時，prompt 應包含建議尋求專業協助的相關提示', () => {
    const snapshot = buildCalmSnapshot({ score: 30, level: 'attention' });
    const prompt = buildSystemPrompt(snapshot);
    expect(prompt).toContain('30');
    expect(prompt).toContain('專業');
  });

  it('prompt 應包含 MOLTOS 身份說明', () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt.toLowerCase()).toContain('moltos');
  });
});

// ─── formatChatHistory 測試 ──────────────────────────────────────────────────

describe('formatChatHistory', () => {
  let formatChatHistory: (
    messages: ChatMessage[]
  ) => Array<{ role: string; parts: Array<{ text: string }> }>;

  beforeEach(async () => {
    const module = await import('@/lib/gemini');
    formatChatHistory = module.formatChatHistory;
  });

  it('應將 ChatMessage[] 轉換為 Gemini Content[] 格式', () => {
    const messages = buildChatMessages();
    const result = formatChatHistory(messages);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(messages.length);
  });

  it('每個 Content 物件應有 role 和 parts 欄位', () => {
    const messages = buildChatMessages();
    const result = formatChatHistory(messages);

    result.forEach((content) => {
      expect(content).toHaveProperty('role');
      expect(content).toHaveProperty('parts');
      expect(Array.isArray(content.parts)).toBe(true);
    });
  });

  it('user role 應對應 Gemini 的 user role', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
    ];
    const result = formatChatHistory(messages);
    expect(result[0].role).toBe('user');
  });

  it('assistant role 應對應 Gemini 的 model role', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'assistant', content: '你好', timestamp: Date.now() },
    ];
    const result = formatChatHistory(messages);
    // Gemini SDK 使用 "model" 代表助理角色
    expect(result[0].role).toBe('model');
  });

  it('每個 part 應包含對應的 text 內容', () => {
    const messages = buildChatMessages();
    const result = formatChatHistory(messages);

    messages.forEach((msg, i) => {
      expect(result[i].parts[0].text).toBe(msg.content);
    });
  });

  it('空陣列輸入應回傳空陣列', () => {
    const result = formatChatHistory([]);
    expect(result).toEqual([]);
  });

  it('isStreaming 欄位不應影響轉換結果', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'assistant', content: '串流中...', timestamp: Date.now(), isStreaming: true },
    ];
    const result = formatChatHistory(messages);
    expect(result[0].parts[0].text).toBe('串流中...');
  });
});

// ─── chatStream 基本測試 ─────────────────────────────────────────────────────

describe('chatStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock generateContentStream 回傳一個假的 stream response
    mockGenerateContentStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => '你好，' };
        yield { text: () => '我是 MOLTOS' };
      })(),
    });
  });

  it('應回傳 ReadableStream', async () => {
    const { chatStream } = await import('@/lib/gemini');
    const stream = await chatStream('你好', [], null);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('stream 應能被讀取並包含文字', async () => {
    const { chatStream } = await import('@/lib/gemini');
    const stream = await chatStream('你好', [], null);

    const reader = stream.getReader();
    const chunks: string[] = [];

    let done = false;
    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (isDone) {
        done = true;
      } else {
        chunks.push(value);
      }
    }

    const fullText = chunks.join('');
    expect(fullText).toContain('你好，');
    expect(fullText).toContain('我是 MOLTOS');
  });

  it('應使用 systemInstruction 呼叫 Gemini', async () => {
    const { chatStream } = await import('@/lib/gemini');
    await chatStream('測試訊息', [], null);

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        systemInstruction: expect.any(String),
      })
    );
  });
});

// ─── generateGreeting 基本測試 ───────────────────────────────────────────────

describe('generateGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock generateContent 回傳問候文字
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '嗨，小明！今天過得如何？',
      },
    });
  });

  it('應回傳字串', async () => {
    const { generateGreeting } = await import('@/lib/gemini');
    const result = await generateGreeting('小明', null);
    expect(typeof result).toBe('string');
  });

  it('回傳的問候語應為非空字串', async () => {
    const { generateGreeting } = await import('@/lib/gemini');
    const result = await generateGreeting('小明', null);
    expect(result.length).toBeGreaterThan(0);
  });
});
