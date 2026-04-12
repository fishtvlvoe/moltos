/**
 * tests/api/call-sessions.test.ts
 *
 * 覆蓋: /api/call-sessions POST handler
 *
 * Scenarios:
 * 1. 已授權 + 有效 conversationId → 呼叫 saveCallSession，回傳 { ok: true }
 * 2. 缺少 conversationId → 回傳 400
 * 3. 未授權 → 回傳 401
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/call-sessions/route';

// ─── Mock 依賴 ────────────────────────────────────────────────────────────────

const mockSaveCallSession = vi.fn();

vi.mock('@/lib/db', () => ({
  saveCallSession: (...args: unknown[]) => mockSaveCallSession(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth';
const mockGetServerSession = vi.mocked(getServerSession);

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/call-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/call-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCallSession.mockResolvedValue(undefined);
  });

  it('已授權 + 有效 conversationId → 呼叫 saveCallSession 並回傳 { ok: true }', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({ conversationId: 'conv_abc123' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockSaveCallSession).toHaveBeenCalledWith('conv_abc123', 'google-uid-123');
  });

  it('缺少 conversationId → 回傳 400', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });

  it('conversationId 為空字串 → 回傳 400', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', id: 'google-uid-123' },
    } as never);

    const req = makeRequest({ conversationId: '' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('未授權（無 session）→ 回傳 401', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({ conversationId: 'conv_abc123' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockSaveCallSession).not.toHaveBeenCalled();
  });
});
