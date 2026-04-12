/**
 * tests/api/call-sessions-auth-fix.test.ts
 *
 * 場景 1：POST /api/call-sessions 認證檢查 + saveCallSession
 *
 * ✗ 紅燈原因：
 * - 目前 route 沒有檢查 next-auth session → 應回 401 if 無 session
 * - 目前沒有呼叫 saveCallSession(conversationId, userId)
 * - 目前沒有驗證 conversationId 非空
 *
 * 預期流程：
 * 1. 無 session → 401，不呼叫 saveCallSession
 * 2. 有 session + 有效 conversationId → 呼叫 saveCallSession，回 200 { ok: true }
 * 3. 缺 conversationId → 400
 * 4. conversationId 空 → 400
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/call-sessions/route';

// ─── Mock 外部依賴 ────────────────────────────────────────────────────────────

const mockSaveCallSession = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  saveCallSession: (...args: unknown[]) => mockSaveCallSession(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// ─── 輔助函式 ─────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth';
const mockGetServerSession = vi.mocked(getServerSession);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/call-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── 測試套件 ─────────────────────────────────────────────────────────────────

describe('POST /api/call-sessions (認證 + saveCallSession)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCallSession.mockResolvedValue(undefined);
  });

  // ✗ 紅燈測試 1：無 session 應回 401

  it('✗ 無 session 時應回 401，未呼叫 saveCallSession', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({ conversationId: 'conv_abc123' });
    const res = await POST(req);

    // ✗ 紅燈：目前 route 尚未檢查 session，不會回 401
    expect(res.status).toBe(401);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });

  // ✗ 紅燈測試 2：有 session + 有效 conversationId → saveCallSession + 200

  it('✗ 有 session + 有效 conversationId → 呼叫 saveCallSession，回 200 { ok: true }', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({ conversationId: 'conv_abc123' });
    const res = await POST(req);

    // ✗ 紅燈：目前 route 可能沒有正確呼叫 saveCallSession，或回傳格式錯誤
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(mockSaveCallSession).toHaveBeenCalledOnce();
    expect(mockSaveCallSession).toHaveBeenCalledWith('conv_abc123', 'google-uid-123');
  });

  // ✗ 紅燈測試 3：缺 conversationId 應回 400

  it('✗ 缺 conversationId 時應回 400', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({});
    const res = await POST(req);

    // ✗ 紅燈：目前 route 尚未驗證 conversationId 必填
    expect(res.status).toBe(400);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });

  // ✗ 紅燈測試 4：conversationId 空字串應回 400

  it('✗ conversationId 空字串時應回 400', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({ conversationId: '' });
    const res = await POST(req);

    // ✗ 紅燈：目前 route 尚未驗證 conversationId 非空
    expect(res.status).toBe(400);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });
});
