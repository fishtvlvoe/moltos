/**
 * tests/api/calm-index.test.ts
 *
 * 覆蓋 Spec: calm-index
 *
 * Task 3.3 — Calm index snapshot stored to database:
 *   - snapshot 寫入 DB
 *   - 無 snapshot 時回 { score: null, level: null }
 *
 * Task 3.4 — Dashboard displays calm index visualization:
 *   - 有 snapshot 回傳 score+level+dimensions
 *   - 無資料回傳 null fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/calm-index/route';
import { NextRequest } from 'next/server';

// ─── Mock 依賴 ────────────────────────────────────────────────────────────────

const mockSaveCalmIndex = vi.fn().mockResolvedValue(undefined);
const mockUpsertUser = vi.fn().mockResolvedValue('mock-user-id');
const mockFetchGmailMetrics = vi.fn();
const mockComputeCalmIndex = vi.fn();

vi.mock('@/lib/db', () => ({
  saveCalmIndex: (...args: unknown[]) => mockSaveCalmIndex(...args),
  upsertUser: (...args: unknown[]) => mockUpsertUser(...args),
}));

vi.mock('@/lib/gmail', () => ({
  fetchGmailMetrics: (...args: unknown[]) => mockFetchGmailMetrics(...args),
}));

vi.mock('@/lib/calm-index-bridge', () => ({
  computeCalmIndex: (...args: unknown[]) => mockComputeCalmIndex(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/demo-data', () => ({
  demoData: {
    calmIndex: {
      result: { score: 75, level: 'mild', dimensions: [], alerts: [], calculatedAt: Date.now() },
      coverageDays: 14,
      isStale: false,
      createdAt: Date.now(),
    },
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/calm-index'): NextRequest {
  return new NextRequest(url, { method: 'GET' });
}

const validSnapshot = {
  result: {
    score: 82,
    level: 'calm',
    dimensions: [
      { name: 'messageVolume', score: 85, isAnomalous: false },
      { name: 'replyLatency', score: 80, isAnomalous: false },
      { name: 'nightActivity', score: 90, isAnomalous: false },
      { name: 'unreadPileup', score: 75, isAnomalous: false },
    ],
    alerts: [],
    calculatedAt: Date.now(),
  },
  coverageDays: 14,
  isStale: false,
  createdAt: Date.now(),
};

async function withAuthSession(fn: () => Promise<void>) {
  const { getServerSession } = await import('next-auth');
  vi.mocked(getServerSession).mockResolvedValue({
    user: { email: 'test@example.com', name: 'Test User' },
    accessToken: 'mock-access-token',
    expires: '2099-01-01',
  } as never);
  await fn();
}

async function withNoSession(fn: () => Promise<void>) {
  const { getServerSession } = await import('next-auth');
  vi.mocked(getServerSession).mockResolvedValue(null);
  await fn();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/calm-index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Task 3.3: Calm index snapshot stored to database ─────────────────────

  describe('Calm index snapshot stored to database', () => {
    it('計算完成後 snapshot 寫入 DB', async () => {
      mockFetchGmailMetrics.mockResolvedValue({});
      mockComputeCalmIndex.mockReturnValue(validSnapshot);

      await withAuthSession(async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(200);
        expect(mockSaveCalmIndex).toHaveBeenCalledWith('mock-user-id', validSnapshot);
      });
    });

    it('DB 寫入失敗不影響 API 回傳（200 + snapshot）', async () => {
      mockFetchGmailMetrics.mockResolvedValue({});
      mockComputeCalmIndex.mockReturnValue(validSnapshot);
      mockSaveCalmIndex.mockRejectedValue(new Error('DB connection failed'));

      await withAuthSession(async () => {
        const res = await GET(makeRequest());
        // DB 失敗不阻斷，仍回傳 200
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.result.score).toBe(82);
      });
    });

    it('snapshot.result 為 null（資料不足）→ 回傳 422，不寫 DB', async () => {
      mockFetchGmailMetrics.mockResolvedValue({});
      mockComputeCalmIndex.mockReturnValue({ result: null, coverageDays: 5, isStale: false, createdAt: Date.now() });

      await withAuthSession(async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(422);
        expect(mockSaveCalmIndex).not.toHaveBeenCalled();
      });
    });

    it('未授權請求 → 401，不查 Gmail 也不寫 DB', async () => {
      await withNoSession(async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(401);
        expect(mockFetchGmailMetrics).not.toHaveBeenCalled();
        expect(mockSaveCalmIndex).not.toHaveBeenCalled();
      });
    });
  });

  // ── Task 3.4: Dashboard displays calm index visualization ────────────────

  describe('Dashboard displays calm index visualization', () => {
    it('有 snapshot → 回傳 score + level + dimensions', async () => {
      mockFetchGmailMetrics.mockResolvedValue({});
      mockComputeCalmIndex.mockReturnValue(validSnapshot);

      await withAuthSession(async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(200);
        const body = await res.json();

        expect(typeof body.result.score).toBe('number');
        expect(body.result.level).toBe('calm');
        expect(Array.isArray(body.result.dimensions)).toBe(true);
        expect(body.result.dimensions).toHaveLength(4);
      });
    });

    it('四個維度各自含有 name、score、isAnomalous', async () => {
      mockFetchGmailMetrics.mockResolvedValue({});
      mockComputeCalmIndex.mockReturnValue(validSnapshot);

      await withAuthSession(async () => {
        const res = await GET(makeRequest());
        const body = await res.json();

        for (const dim of body.result.dimensions) {
          expect(typeof dim.name).toBe('string');
          expect(typeof dim.score).toBe('number');
          expect(typeof dim.isAnomalous).toBe('boolean');
        }
      });
    });

    it('demo=true → 回傳 demo snapshot（無需授權）', async () => {
      const res = await GET(makeRequest('http://localhost/api/calm-index?demo=true'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBeDefined();
    });
  });
});
