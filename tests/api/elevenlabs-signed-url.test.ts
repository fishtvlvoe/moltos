/**
 * tests/api/elevenlabs-signed-url.test.ts
 *
 * 覆蓋 Spec: voice-conversation — Signed URL generation before call
 *
 * Scenarios:
 * 1. 成功回傳 { signedUrl: string }
 * 2. 未授權（缺 session）→ 此 route 無 session 保護，改測 API key 缺失 → 500
 * 3. 缺少 ELEVENLABS_API_KEY → 500
 * 4. ElevenLabs API 回傳非 200 → 轉發錯誤狀態碼
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/elevenlabs-signed-url/route';

// ─── 輔助 ─────────────────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/elevenlabs-signed-url', {
    method: 'GET',
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/elevenlabs-signed-url', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('Signed URL generation before call — 成功回傳 signedUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://api.elevenlabs.io/signed/token=abc' }),
      text: () => Promise.resolve(''),
    }));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.signedUrl).toBe('string');
    expect(body.signedUrl).toBe('wss://api.elevenlabs.io/signed/token=abc');
  });

  it('Missing API key — 缺少 ELEVENLABS_API_KEY → 500', async () => {
    delete process.env.ELEVENLABS_API_KEY;

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it('Missing Agent ID — 缺少 NEXT_PUBLIC_ELEVENLABS_AGENT_ID → 500', async () => {
    delete process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it('ElevenLabs API 非 200 → 轉發錯誤狀態碼', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Unauthorized'),
    }));

    const res = await GET();

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('API 呼叫帶上 xi-api-key header — API key 不外洩到 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signed_url: 'wss://test' }),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await GET();

    // 確認有帶 API key 呼叫 ElevenLabs
    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1]?.headers?.['xi-api-key']).toBe('test-api-key');

    // response body 不含 API key
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('test-api-key');
  });
});
