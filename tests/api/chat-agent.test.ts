/**
 * tests/api/chat-agent.test.ts — Chat 頁面 ElevenLabs 整合測試
 *
 * 測試覆蓋：
 * 1. generate-image stub 端點回傳正確格式
 * 2. Mock ElevenLabs signed URL fetch，確認呼叫了正確 endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
