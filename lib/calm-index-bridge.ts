/**
 * T022: GmailMetrics → CalmIndexInput 轉換橋接層
 *
 * 職責：
 * 1. 將 GmailMetrics 的四個維度轉換為 @moltos/calm-index 接受的 CalmIndexInput 格式
 * 2. 呼叫 calculateCalmIndex 計算平靜指數
 * 3. 包裝成 CalmIndexSnapshot（含新鮮度、建立時間等後設資料）
 */

import { calculateCalmIndex } from '@moltos/calm-index';
import type { CalmIndexInput } from '@moltos/calm-index';
import type { GmailMetrics, CalmIndexSnapshot } from './types';

/**
 * 將 GmailMetrics 轉換為 CalmIndexInput 格式
 *
 * 欄位對應關係：
 * - dailyCounts      → messageVolume.dailyCounts
 * - replyLatencies   → replyLatency.latencies
 * - nightActivity    → nightActivity.nightMinutes
 * - unreadCounts     → unreadPileup.unreadCounts
 *
 * @param metrics - Gmail 指標資料
 * @returns 平靜指數計算輸入格式
 */
export function convertToCalmInput(metrics: GmailMetrics): CalmIndexInput {
  return {
    messageVolume: { dailyCounts: metrics.dailyCounts },
    replyLatency: { latencies: metrics.replyLatencies },
    nightActivity: { nightMinutes: metrics.nightActivity },
    unreadPileup: { unreadCounts: metrics.unreadCounts },
    // voiceEmotion 不包含：Gmail 資料無語音維度
  };
}

/**
 * 計算平靜指數快照
 *
 * 將 GmailMetrics 轉換後送入演算法，回傳帶有後設資料的快照。
 * 若資料不足（calculateCalmIndex 回傳 null），result 欄位設為 null，
 * 由呼叫端（API route）負責處理 422 錯誤。
 *
 * @param metrics - Gmail 指標資料
 * @returns 包含計算結果與後設資料的快照
 */
export function computeCalmIndex(metrics: GmailMetrics): CalmIndexSnapshot {
  const input = convertToCalmInput(metrics);
  // calculateCalmIndex 資料不足時回傳 null，呼叫端需檢查
  const result = calculateCalmIndex(input);

  return {
    result: result!, // null 時由呼叫端（API route）回傳 422
    coverageDays: metrics.coverageDays,
    isStale: false,
    createdAt: Date.now(),
    // 資料覆蓋天數不足 14 天時標記，呼叫端可用於 UI 提示
    dataInsufficient: metrics.coverageDays < 14 ? true : undefined,
  };
}
