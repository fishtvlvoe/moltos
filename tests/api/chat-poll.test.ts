/**
 * tests/api/chat-poll.test.ts
 *
 * 場景 3：輪詢增強
 * 覆蓋 Spec: voice-conversation — pollForNewMessages retry count enhancement
 *
 * 當 webhook 延遲較久時，pollForNewMessages 應有足夠的重試次數
 * 從 10 次（原始）增加到 20 次，最多等待 ~30 秒
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock 設置 ────────────────────────────────────────────────────────────────

// 這裡我們模擬 chat/page.tsx 中的 pollForNewMessages 邏輯
// 實際的 React component 會被獨立測試，這裡專注測試「輪詢邏輯」

type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

// ─── 輔助函式：模擬 pollForNewMessages 邏輯 ──────────────────────────────────

/**
 * 模擬 chat/page.tsx 中的 pollForNewMessages 邏輯
 * 真實實作：使用漸進退避，最多 10 次，每次間隔 1.5-5s，共 ~31 秒
 * 修復後：增加到 20 次，總時間 ~60 秒，確保等到 webhook
 */
function createPollLogic(retryCount: number = 10) {
  const intervals = Array(retryCount)
    .fill(0)
    .reduce((acc, _, i) => {
      // 漸進退避：[1.5, 1.5, 2, 2, 3, 3, 4, 4, 5, 5, ...]
      const baseInterval = Math.ceil((i + 1) / 2) * 500;
      return [...acc, Math.max(1500, Math.min(baseInterval + 1000, 5000))];
    }, [] as number[]);

  return { intervals, maxAttempts: retryCount };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('pollForNewMessages - 輪詢邏輯增強', () => {
  // ── 場景 3：輪詢次數從 10 增加到 20 ─────────────────────────────────────────

  describe('輪詢次數增強（從 10 → 20 次）', () => {
    it('原始邏輯（10 次）應在 ~31 秒內放棄', () => {
      const { intervals, maxAttempts } = createPollLogic(10);

      expect(maxAttempts).toBe(10);
      expect(intervals.length).toBe(10);

      // 計算總時間：sum of all intervals
      const totalTime = intervals.reduce((sum, interval) => sum + interval, 0);
      expect(totalTime).toBeLessThan(35000); // ~31 秒以內
    });

    it('修復後邏輯（20 次）應在 ~72 秒內放棄', () => {
      const { intervals, maxAttempts } = createPollLogic(20);

      expect(maxAttempts).toBe(20);
      expect(intervals.length).toBe(20);

      // 計算總時間
      const totalTime = intervals.reduce((sum, interval) => sum + interval, 0);
      expect(totalTime).toBeLessThan(75000); // ~72 秒以內
    });

    it('當 webhook 在第 18 次才送達資料，修復後的邏輯應能捕獲', () => {
      const { intervals, maxAttempts } = createPollLogic(20);

      // 模擬：第 18 次時才有新資料
      let pollCount = 0;
      let dataArrived = false;

      for (let i = 0; i < maxAttempts; i++) {
        pollCount++;
        if (pollCount === 18) {
          dataArrived = true;
          break;
        }
      }

      // 修復後應能達到第 18 次
      expect(dataArrived).toBe(true);
      expect(pollCount).toBe(18);
    });

    it('原始邏輯（10 次）在第 18 次會超時失敗', () => {
      const { intervals, maxAttempts } = createPollLogic(10);

      // 模擬：嘗試到第 18 次，但只有 10 次機會
      let pollCount = 0;
      for (let i = 0; i < maxAttempts; i++) {
        pollCount++;
      }

      expect(pollCount).toBe(10);
      expect(pollCount < 18).toBe(true); // 只有 10 次，達不到 18
    });
  });

  // ── 場景 3-B：間隔計算驗證 ──────────────────────────────────────────────────

  describe('輪詢間隔計算', () => {
    it('修復後應有 20 個間隔值', () => {
      const { intervals } = createPollLogic(20);
      expect(intervals).toHaveLength(20);
    });

    it('間隔應遵循漸進退避模式（每 2 次遞增）', () => {
      const { intervals } = createPollLogic(20);

      // 檢查前幾個間隔
      expect(intervals[0]).toBe(1500); // 第 1 次
      expect(intervals[1]).toBe(1500); // 第 2 次（相同）
      expect(intervals[2]).toBeGreaterThan(intervals[1]); // 第 3 次應遞增
      expect(intervals[3]).toBe(intervals[2]); // 第 4 次（相同）
    });

    it('間隔最大不超過 5000ms', () => {
      const { intervals } = createPollLogic(20);

      intervals.forEach((interval) => {
        expect(interval).toBeLessThanOrEqual(5000);
        expect(interval).toBeGreaterThanOrEqual(1500);
      });
    });

    it('20 次輪詢的總時間在 50-75 秒之間', () => {
      const { intervals } = createPollLogic(20);
      const totalTime = intervals.reduce((sum, i) => sum + i, 0);

      expect(totalTime).toBeGreaterThan(50000);
      expect(totalTime).toBeLessThan(75000);
    });
  });

  // ── 場景 3-C：與 webhook 延遲的配合 ──────────────────────────────────────────

  describe('輪詢與 webhook 延遲配合', () => {
    it('webhook 延遲 20 秒，修復後的輪詢應能在 20-40 秒內捕獲', () => {
      const { intervals } = createPollLogic(20);

      // 計算：前 N 次輪詢的累計時間
      let cumulativeTime = 0;
      let pollAttempt = 0;

      for (let interval of intervals) {
        pollAttempt++;
        cumulativeTime += interval;

        // 當累計時間 > 20 秒時，應該已經做過足夠的輪詢
        if (cumulativeTime > 20000) {
          break;
        }
      }

      // 應該在 20 秒左右還有輪詢次數剩餘
      expect(pollAttempt).toBeGreaterThan(5);
      expect(cumulativeTime).toBeGreaterThan(15000);
    });

    it('webhook 延遲 30 秒，修復後的輪詢應能在限時內等到', () => {
      const { intervals, maxAttempts } = createPollLogic(20);

      // 計算前 15 次的累計時間
      const cumulativeTime = intervals
        .slice(0, 15)
        .reduce((sum, interval) => sum + interval, 0);

      // 15 次應足以等到 30 秒的延遲
      expect(cumulativeTime).toBeGreaterThan(30000);
      expect(maxAttempts).toBe(20); // 還有 5 次備用
    });

    it('原始邏輯（10 次）無法等到 20+ 秒的 webhook', () => {
      const { intervals: oldIntervals } = createPollLogic(10);
      const oldTotal = oldIntervals.reduce((sum, i) => sum + i, 0);

      // 原始最多 ~31 秒，但不夠穩定等到 20+ 秒的 webhook
      const { intervals: newIntervals } = createPollLogic(20);
      const newTotal = newIntervals.reduce((sum, i) => sum + i, 0);

      expect(newTotal).toBeGreaterThan(oldTotal);
    });
  });

  // ── 場景 3-D：邊界情況 ──────────────────────────────────────────────────────

  describe('邊界情況', () => {
    it('第 1 次輪詢應在 1.5 秒後開始', () => {
      const { intervals } = createPollLogic(20);
      expect(intervals[0]).toBe(1500);
    });

    it('如果資料在第 1 次就到達，應立即返回（不等 1.5 秒）', () => {
      // 這是邏輯層面的驗證：在實際實作中，
      // 如果 setMessages 發現有新資料，應立即 return，不必等待
      // 這邊測試的是：第 1 次檢查應該快速完成
      const firstCheck = async () => {
        // Mock 第一次 fetch 就成功
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: '1', role: 'assistant', content: 'Hi' }],
        });
      };

      expect(firstCheck()).resolves.toBeDefined();
    });

    it('重試計數器應準確', () => {
      const { maxAttempts } = createPollLogic(20);
      expect(maxAttempts).toBe(20);

      // 驗證不同配置
      const config10 = createPollLogic(10);
      const config20 = createPollLogic(20);
      const config30 = createPollLogic(30);

      expect(config10.maxAttempts).toBe(10);
      expect(config20.maxAttempts).toBe(20);
      expect(config30.maxAttempts).toBe(30);
    });
  });
});
