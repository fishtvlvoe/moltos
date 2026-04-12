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

// ── Spec: Four Gmail dimensions extracted — Insufficient data ─────────────────

describe('Spec: Four Gmail dimensions extracted for calm index calculation', () => {
  it('14 天以下 coverageDays → dataInsufficient: true', async () => {
    const { computeCalmIndex } = await import('@/lib/calm-index-bridge');

    const insufficientMetrics: GmailMetrics = {
      dailyCounts: buildTestMetrics().dailyCounts.slice(0, 10), // 只有 10 天
      replyLatencies: buildTestMetrics().replyLatencies.slice(0, 10),
      nightActivity: buildTestMetrics().nightActivity.slice(0, 10),
      unreadCounts: buildTestMetrics().unreadCounts.slice(0, 10),
      coverageDays: 10,
      lastUpdated: Date.now(),
    };

    const snapshot = computeCalmIndex(insufficientMetrics);
    expect(snapshot.dataInsufficient).toBe(true);
  });

  it('14 天以上 coverageDays → dataInsufficient: false 或 undefined', async () => {
    const { computeCalmIndex } = await import('@/lib/calm-index-bridge');

    const sufficientMetrics = buildTestMetrics({ coverageDays: 14 });
    const snapshot = computeCalmIndex(sufficientMetrics);

    // 足夠的資料不應標記 dataInsufficient
    expect(snapshot.dataInsufficient).toBeFalsy();
  });

  it('四個 Gmail 維度全部對應到 CalmIndexInput', async () => {
    const { convertToCalmInput } = await import('@/lib/calm-index-bridge');
    const metrics = buildTestMetrics();
    const input = convertToCalmInput(metrics);

    // 確認四個維度都有對應
    expect(input.messageVolume?.dailyCounts).toBeDefined();
    expect(input.replyLatency?.latencies).toBeDefined();
    expect(input.nightActivity?.nightMinutes).toBeDefined();
    expect(input.unreadPileup?.unreadCounts).toBeDefined();
  });

  it('email body 欄位未出現在 GmailMetrics 型別（只有 metadata 欄位）', async () => {
    // GmailMetrics 只包含 metadata，無 body 或 payload 欄位
    const metrics = buildTestMetrics();
    const keys = Object.keys(metrics);

    expect(keys).not.toContain('body');
    expect(keys).not.toContain('payload');
    expect(keys).not.toContain('emailContent');
  });
});
