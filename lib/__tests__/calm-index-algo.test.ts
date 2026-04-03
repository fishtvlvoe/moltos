/**
 * T020: @moltos/calm-index 演算法單元測試
 *
 * moltos-calm-index 是 git submodule（read-only），
 * 因此把演算法測試改寫在此處，直接 import from @moltos/calm-index。
 *
 * 測試三個核心情境：
 * 1. 正常 14 天資料 → score 在合理範圍（50-100）
 * 2. 異常資料（突然暴增）→ 分數降低，level 可能是 mild / attention
 * 3. 空資料 → 回傳 null
 */

import { describe, it, expect } from 'vitest';
import { calculateCalmIndex } from '@moltos/calm-index';
import type { CalmIndexInput, DataPoint } from '@moltos/calm-index';

// ── 輔助函式 ──

/**
 * 建立 N 天的穩定 DataPoint 陣列
 * @param days - 天數
 * @param baseValue - 基礎值（每天小幅隨機波動）
 */
function buildStableDataPoints(days: number, baseValue: number): DataPoint[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  return Array.from({ length: days }, (_, i) => ({
    timestamp: now - (days - i) * DAY_MS,
    // 小幅雜訊（±10%），讓基線計算有意義的標準差
    value: baseValue * (0.9 + 0.2 * ((i * 37 + 13) % 10) / 10),
  }));
}

/**
 * 建立最後一天數值突然暴增的 DataPoint 陣列
 * 前 13 天穩定，最後 1 天值爆增 10 倍
 */
function buildAnomalousDataPoints(days: number, baseValue: number, spikeFactor = 10): DataPoint[] {
  const stable = buildStableDataPoints(days - 1, baseValue);
  const now = Date.now();
  const spike: DataPoint = {
    timestamp: now - 1000, // 幾秒前
    value: baseValue * spikeFactor,
  };
  return [...stable, spike];
}

describe('calculateCalmIndex — 正常 14 天資料', () => {
  it('穩定的 14 天訊息量 → score 應在 50-100 範圍', () => {
    const input: CalmIndexInput = {
      messageVolume: {
        dailyCounts: buildStableDataPoints(15, 10), // 15 天確保有足夠基線
      },
    };

    const result = calculateCalmIndex(input);

    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(50);
    expect(result!.score).toBeLessThanOrEqual(100);
  });

  it('多維度穩定 14 天資料 → score 應在 50-100，level 為 calm 或 mild', () => {
    const input: CalmIndexInput = {
      messageVolume: { dailyCounts: buildStableDataPoints(15, 10) },
      replyLatency: { latencies: buildStableDataPoints(15, 3600000) },
      nightActivity: { nightMinutes: buildStableDataPoints(15, 5) },
      unreadPileup: { unreadCounts: buildStableDataPoints(15, 2) },
    };

    const result = calculateCalmIndex(input);

    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(50);
    expect(result!.score).toBeLessThanOrEqual(100);
    // 穩定資料期望的等級
    expect(['calm', 'mild']).toContain(result!.level);
  });

  it('應回傳包含 score、level、dimensions、alerts 的結構', () => {
    const input: CalmIndexInput = {
      messageVolume: { dailyCounts: buildStableDataPoints(15, 10) },
    };

    const result = calculateCalmIndex(input);

    expect(result).not.toBeNull();
    expect(typeof result!.score).toBe('number');
    expect(result!.level).toMatch(/^(calm|mild|moderate|attention)$/);
    expect(Array.isArray(result!.dimensions)).toBe(true);
    expect(Array.isArray(result!.alerts)).toBe(true);
    expect(typeof result!.calculatedAt).toBe('number');
  });
});

describe('calculateCalmIndex — 異常資料（突然暴增）', () => {
  it('訊息量突然暴增 10 倍 → 分數應低於穩定基線', () => {
    // 穩定基線分數
    const stableInput: CalmIndexInput = {
      messageVolume: { dailyCounts: buildStableDataPoints(15, 10) },
    };
    const stableResult = calculateCalmIndex(stableInput);

    // 暴增資料
    const anomalousInput: CalmIndexInput = {
      messageVolume: { dailyCounts: buildAnomalousDataPoints(15, 10, 10) },
    };
    const anomalousResult = calculateCalmIndex(anomalousInput);

    expect(stableResult).not.toBeNull();
    expect(anomalousResult).not.toBeNull();

    // 異常資料的分數應低於穩定資料
    expect(anomalousResult!.score).toBeLessThan(stableResult!.score);
  });

  it('多維度同時異常 → level 應為 mild 或 attention（非 calm）', () => {
    // 所有維度同時暴增
    const input: CalmIndexInput = {
      messageVolume: { dailyCounts: buildAnomalousDataPoints(15, 10, 8) },
      replyLatency: { latencies: buildAnomalousDataPoints(15, 3600000, 8) },
      nightActivity: { nightMinutes: buildAnomalousDataPoints(15, 5, 8) },
    };

    const result = calculateCalmIndex(input);

    expect(result).not.toBeNull();
    // 多維度同時異常不應該顯示 calm
    expect(result!.level).not.toBe('calm');
  });

  it('異常資料應產生 alerts 列表（非空）', () => {
    const input: CalmIndexInput = {
      messageVolume: { dailyCounts: buildAnomalousDataPoints(15, 10, 15) },
    };

    const result = calculateCalmIndex(input);

    expect(result).not.toBeNull();
    // 極端異常（15 倍）應觸發警示
    expect(result!.alerts.length).toBeGreaterThan(0);
  });
});

describe('calculateCalmIndex — 空資料邊界情況', () => {
  it('完全空的輸入 → 回傳 null', () => {
    const result = calculateCalmIndex({});
    expect(result).toBeNull();
  });

  it('所有維度空陣列 → 回傳 null', () => {
    const input: CalmIndexInput = {
      messageVolume: { dailyCounts: [] },
      replyLatency: { latencies: [] },
      nightActivity: { nightMinutes: [] },
      unreadPileup: { unreadCounts: [] },
    };

    const result = calculateCalmIndex(input);
    expect(result).toBeNull();
  });

  it('資料點只有 1 筆（不足以建立基線）→ 回傳 null', () => {
    const input: CalmIndexInput = {
      messageVolume: {
        dailyCounts: [{ timestamp: Date.now(), value: 10 }],
      },
    };

    const result = calculateCalmIndex(input);
    // 只有 1 筆資料無法建立有意義的基線，應回傳 null
    expect(result).toBeNull();
  });
});
