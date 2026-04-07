/**
 * tests/api/tts.test.ts
 *
 * TDD — Google Cloud TTS route 單元測試
 * 執行：npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/tts/route';
import { NextRequest } from 'next/server';

// Mock fetch（替換掉對外的 Google Cloud TTS API 呼叫）
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock 環境變數
vi.stubEnv('GOOGLE_CLOUD_TTS_API_KEY', 'test-key-123');

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Google Cloud TTS 回傳 base64 編碼的音訊
function makeTtsResponse(audioBase64 = 'AAAA') {
  return new Response(JSON.stringify({ audioContent: audioBase64 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('輸入有效文字 → 回傳 audio/mpeg + 狀態 200', async () => {
    mockFetch.mockResolvedValueOnce(makeTtsResponse());

    const req = makeRequest({ text: '你好，我是小默。' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('輸入空字串 → 回傳 400', async () => {
    const req = makeRequest({ text: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('沒有 text 欄位 → 回傳 400', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('純 emoji 過濾後為空 → 回傳 400', async () => {
    const req = makeRequest({ text: '😊🎉' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Google TTS API 回傳非 200 → 回傳 502', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{"error": {"message": "API key invalid"}}', { status: 400 })
    );

    const req = makeRequest({ text: '測試文字' });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it('呼叫時帶正確的 voice 名稱 zh-TW-Neural2-C', async () => {
    mockFetch.mockResolvedValueOnce(makeTtsResponse());

    const req = makeRequest({ text: '台灣女聲測試' });
    await POST(req);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(calledBody.voice.name).toBe('zh-TW-Neural2-C');
  });

  it('呼叫時帶正確的語言代碼 zh-TW', async () => {
    mockFetch.mockResolvedValueOnce(makeTtsResponse());

    const req = makeRequest({ text: '語言代碼測試' });
    await POST(req);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(calledBody.voice.languageCode).toBe('zh-TW');
  });
});
