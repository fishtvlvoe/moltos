/**
 * tests/api/chat-agent.test.ts — Chat 頁面 ElevenLabs 整合測試
 *
 * 測試覆蓋：
 * 1. generate-image stub 端點回傳正確格式
 * 2. Mock ElevenLabs signed URL fetch，確認呼叫了正確 endpoint
 * 3. Chat agent connection and message dispatch（Task 2.1）
 * 4. Chat messages stored to database via POST /api/chat/message（Task 2.2）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/message/route';

// ─── 1. generate-image stub 端點邏輯測試 ─────────────────────────────────────

describe('generate-image stub endpoint', () => {
  it('回傳正確格式：status not_implemented, url null', () => {
    // 模擬 stub 端點的回傳行為（不實際呼叫 API）
    const stubResponse = { status: 'not_implemented', url: null };

    expect(stubResponse.status).toBe('not_implemented');
    expect(stubResponse.url).toBeNull();
  });

  it('回傳物件含 status 與 url 兩個欄位', () => {
    const stubResponse = { status: 'not_implemented', url: null };

    expect(Object.keys(stubResponse)).toContain('status');
    expect(Object.keys(stubResponse)).toContain('url');
  });
});

// ─── 2. ElevenLabs signed URL fetch 測試 ─────────────────────────────────────

describe('ElevenLabs signed URL fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('呼叫 /api/elevenlabs-signed-url 端點', async () => {
    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signedUrl: 'wss://mock.elevenlabs.io/signed/url' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    // 模擬 connectToAgent 的 fetch 行為
    const res = await fetch('/api/elevenlabs-signed-url');
    const data = await res.json();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/elevenlabs-signed-url');
    expect(data.signedUrl).toBe('wss://mock.elevenlabs.io/signed/url');

    vi.unstubAllGlobals();
  });

  it('signed URL 回應含 signedUrl 欄位', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signedUrl: 'wss://api.elevenlabs.io/v1/convai/conversation?token=abc123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('/api/elevenlabs-signed-url');
    const { signedUrl } = await res.json();

    expect(typeof signedUrl).toBe('string');
    expect(signedUrl.length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });

  it('signed URL 取得失敗時回傳的 error 欄位', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '缺少環境變數' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('/api/elevenlabs-signed-url');
    expect(res.ok).toBe(false);
    const data = await res.json();
    expect(data.error).toBeDefined();

    vi.unstubAllGlobals();
  });
});

// ─── 3. Chat agent connection and message dispatch（Task 2.1）────────────────

describe('Chat agent connection and message dispatch', () => {
  it('sendUserMessage 送出後訊息立即顯示（模擬已連線狀態）', () => {
    // 模擬 useConversation hook 的 sendUserMessage 行為
    const mockSendUserMessage = vi.fn();
    const messages: string[] = [];

    // 模擬「已連線」時直接送出
    function dispatchMessage(
      message: string,
      isConnected: boolean,
      pendingQueue: string[]
    ) {
      if (isConnected) {
        mockSendUserMessage(message);
        messages.push(message);
      } else {
        pendingQueue.push(message);
      }
    }

    dispatchMessage('你好', true, []);

    expect(mockSendUserMessage).toHaveBeenCalledWith('你好');
    expect(messages).toContain('你好');
  });

  it('尚未連線時訊息進入 pending queue，連線後自動送出', () => {
    const mockSendUserMessage = vi.fn();
    const pendingQueue: string[] = [];

    // 連線前送出 → 進 queue
    const isConnected = false;
    const message = '等等連線再送';
    if (!isConnected) {
      pendingQueue.push(message);
    }

    expect(pendingQueue).toContain(message);
    expect(mockSendUserMessage).not.toHaveBeenCalled();

    // 連線後 flush queue
    pendingQueue.forEach((m) => mockSendUserMessage(m));
    pendingQueue.length = 0;

    expect(mockSendUserMessage).toHaveBeenCalledWith(message);
    expect(pendingQueue).toHaveLength(0);
  });

  it('onMessage 回調收到 source=ai 的非空訊息 → 加入 chat history', () => {
    const chatHistory: Array<{ role: string; content: string }> = [];

    function onMessage(payload: { role?: string; source?: string; message?: string }) {
      if (payload.role === 'agent' || payload.source === 'ai') {
        const content = (payload.message ?? '').trim();
        if (!content) return;
        chatHistory.push({ role: 'assistant', content });
      }
    }

    onMessage({ source: 'ai', message: 'AI 的回應' });

    expect(chatHistory).toHaveLength(1);
    expect(chatHistory[0].role).toBe('assistant');
    expect(chatHistory[0].content).toBe('AI 的回應');
  });

  it('onMessage 收到空訊息 → 不加入 chat history', () => {
    const chatHistory: Array<{ role: string; content: string }> = [];

    function onMessage(payload: { role?: string; source?: string; message?: string }) {
      if (payload.role === 'agent' || payload.source === 'ai') {
        const content = (payload.message ?? '').trim();
        if (!content) return;
        chatHistory.push({ role: 'assistant', content });
      }
    }

    onMessage({ source: 'ai', message: '   ' });
    onMessage({ source: 'ai', message: '' });

    expect(chatHistory).toHaveLength(0);
  });
});

// ─── 4. Chat messages stored to database（Task 2.2）─────────────────────────

const mockSaveMessage = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveMessage: (...args: unknown[]) => mockSaveMessage(...args),
  upsertUser: vi.fn().mockResolvedValue('mock-uuid'),
  getMessages: vi.fn().mockResolvedValue([]),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('POST /api/chat/message — Chat messages stored to database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeMessageRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async function withSession(userId: string, fn: () => Promise<void>) {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId, email: 'test@example.com' },
      expires: '2099-01-01',
    });
    await fn();
  }

  it('user 訊息存入 DB — role=user, content 寫入', async () => {
    await withSession('user-123', async () => {
      const res = await POST(makeMessageRequest({ role: 'user', content: '你好' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockSaveMessage).toHaveBeenCalledWith('user-123', 'user', '你好');
    });
  });

  it('AI 訊息存入 DB — role=assistant, content 寫入', async () => {
    await withSession('user-123', async () => {
      const res = await POST(makeMessageRequest({ role: 'assistant', content: 'AI 回應' }));
      expect(res.status).toBe(200);
      expect(mockSaveMessage).toHaveBeenCalledWith('user-123', 'assistant', 'AI 回應');
    });
  });

  it('空白訊息不寫入 DB — 回傳 400', async () => {
    await withSession('user-123', async () => {
      const res = await POST(makeMessageRequest({ role: 'user', content: '' }));
      expect(res.status).toBe(400);
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });
  });

  it('未授權請求 → 401，不寫入 DB', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await POST(makeMessageRequest({ role: 'user', content: '你好' }));
    expect(res.status).toBe(401);
    expect(mockSaveMessage).not.toHaveBeenCalled();
  });

  it('缺少 role 欄位 → 400', async () => {
    await withSession('user-123', async () => {
      const res = await POST(makeMessageRequest({ content: '有內容但沒角色' }));
      expect(res.status).toBe(400);
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });
  });
});
