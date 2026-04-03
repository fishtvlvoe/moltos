/**
 * T019: GmailMetrics → CalmIndexInput 轉換測試
 *
 * 測試 convertToCalmInput 和 computeCalmIndex 的正確性。
 * 注意：calm-index-bridge.ts 尚不存在，此測試先跑 FAIL（TDD 紅燈）。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GmailMetrics } from '@/lib/types';
import type { CalmIndexInput } from '@moltos/calm-index';

/**
 * 建立測試用的完整 GmailMetrics 資料（14 天）
 */
function buildTestMetrics(overrides?: Partial<GmailMetrics>): GmailMetrics {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 建立 14 天的穩定資料點（每天固定值，方便測試）
  const makeDataPoints = (baseValue: number, days = 14) =>
    Array.from({ length: days }, (_, i) => ({
      timestamp: now - (days - i) * DAY_MS,
      value: baseValue + (i % 3), // 小幅波動讓基線不是 0
    }));

  return {
    dailyCounts: makeDataPoints(10),
    replyLatencies: makeDataPoints(3600000), // 1 小時回覆延遲（毫秒）
    nightActivity: makeDataPoints(5),
    unreadCounts: makeDataPoints(2),
    coverageDays: 14,
    lastUpdated: now,
    ...overrides,
  };
}

describe('convertToCalmInput', () => {
  let convertToCalmInput: (metrics: GmailMetrics) => CalmIndexInput;

  beforeEach(async () => {
    const module = await import('@/lib/calm-index-bridge');
    convertToCalmInput = module.convertToCalmInput;
  });

  it('應正確對應 dailyCounts → messageVolume.dailyCounts', async () => {
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    expect(input.messageVolume).toBeDefined();
    expect(input.messageVolume!.dailyCounts).toEqual(metrics.dailyCounts);
  });

  it('應正確對應 replyLatencies → replyLatency.latencies', async () => {
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    expect(input.replyLatency).toBeDefined();
    expect(input.replyLatency!.latencies).toEqual(metrics.replyLatencies);
  });

  it('應正確對應 nightActivity → nightActivity.nightMinutes', async () => {
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    expect(input.nightActivity).toBeDefined();
    expect(input.nightActivity!.nightMinutes).toEqual(metrics.nightActivity);
  });

  it('應正確對應 unreadCounts → unreadPileup.unreadCounts', async () => {
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    expect(input.unreadPileup).toBeDefined();
    expect(input.unreadPileup!.unreadCounts).toEqual(metrics.unreadCounts);
  });

  it('回傳的 CalmIndexInput 不應包含 voiceEmotion（Gmail 沒有語音資料）', async () => {
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    expect(input.voiceEmotion).toBeUndefined();
  });
});

describe('computeCalmIndex', () => {
  let computeCalmIndex: (metrics: GmailMetrics) => ReturnType<typeof import('@/lib/calm-index-bridge').computeCalmIndex>;

  beforeEach(async () => {
    const module = await import('@/lib/calm-index-bridge');
    computeCalmIndex = module.computeCalmIndex as any;
  });

  it('正常 14 天資料 → 回傳 CalmIndexSnapshot，分數在 0-100', async () => {
    const metrics = buildTestMetrics();
    const snapshot = computeCalmIndex(metrics);

    expect(snapshot).toBeDefined();
    expect(snapshot.result).toBeDefined();
    expect(snapshot.result.score).toBeGreaterThanOrEqual(0);
    expect(snapshot.result.score).toBeLessThanOrEqual(100);
  });

  it('快照應包含正確的 coverageDays', async () => {
    const metrics = buildTestMetrics({ coverageDays: 14 });
    const snapshot = computeCalmIndex(metrics);

    expect(snapshot.coverageDays).toBe(14);
  });

  it('快照的 isStale 預設為 false', async () => {
    const metrics = buildTestMetrics();
    const snapshot = computeCalmIndex(metrics);

    expect(snapshot.isStale).toBe(false);
  });

  it('快照的 createdAt 應接近 Date.now()', async () => {
    const before = Date.now();
    const metrics = buildTestMetrics();
    const snapshot = computeCalmIndex(metrics);
    const after = Date.now();

    expect(snapshot.createdAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.createdAt).toBeLessThanOrEqual(after);
  });

  it('result 應包含 level 和 dimensions 陣列', async () => {
    const metrics = buildTestMetrics();
    const snapshot = computeCalmIndex(metrics);

    expect(snapshot.result.level).toMatch(/^(calm|mild|moderate|attention)$/);
    expect(Array.isArray(snapshot.result.dimensions)).toBe(true);
  });
});

describe('computeCalmIndex — 空資料邊界情況', () => {
  it('空 dailyCounts → calculateCalmIndex 回傳 null，snapshot.result 為 null', async () => {
    const { computeCalmIndex } = await import('@/lib/calm-index-bridge');

    const emptyMetrics: GmailMetrics = {
      dailyCounts: [],
      replyLatencies: [],
      nightActivity: [],
      unreadCounts: [],
      coverageDays: 0,
      lastUpdated: Date.now(),
    };

    // calculateCalmIndex 對空資料回傳 null
    // computeCalmIndex 應將 result 設為 null（呼叫端需檢查）
    const snapshot = computeCalmIndex(emptyMetrics);
    expect(snapshot.result).toBeNull();
  });
});
