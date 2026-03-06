/**
 * Moltos Calm Index - 異常偏離偵測模組
 *
 * 使用 Z-score 方法偵測行為模式的持續性改變。
 * 關鍵設計：過濾掉正常的日常波動，只在模式「持續」偏離時才觸發警示。
 *
 * Z-score 白話解釋：
 * 「你今天的數值，偏離你平常多遠？」
 * - Z = 0 → 跟平常一樣
 * - Z = 1 → 比平常多 1 個標準差（約 68% 的日子都在這範圍內）
 * - Z = 1.5 → 超出正常波動範圍（預設警示閾值）
 * - Z = 2 → 明顯異常（約 95% 的日子不會到這）
 */

import type { Baseline, DataPoint, Alert, DimensionName } from './types.js';

/** 異常偵測結果 */
export interface AnomalyResult {
  /** Z-score 值 */
  zScore: number;
  /** 是否為異常 */
  isAnomalous: boolean;
  /** 偏離方向（higher = 比基線高，lower = 比基線低） */
  direction: 'higher' | 'lower' | 'normal';
  /** 連續異常天數 */
  consecutiveDays: number;
}

/**
 * 計算單一數值相對於基線的 Z-score
 *
 * Z-score = (觀測值 - 平均值) / 標準差
 *
 * 處理邊界情況：
 * - 標準差為 0（所有歷史值完全相同）→ 如果觀測值也相同回傳 0，否則回傳 +/-3
 * - 標準差極小 → 設定最小標準差避免除以接近零的數
 *
 * @param value - 當前觀測值
 * @param baseline - 個人基線
 * @returns Z-score 值
 */
export function calculateZScore(value: number, baseline: Baseline): number {
  // 最小標準差：避免除以 0 或極小值導致 Z-score 爆炸
  const MIN_STD_DEV = 0.001;

  if (baseline.stdDev < MIN_STD_DEV) {
    // 歷史值幾乎完全相同
    if (Math.abs(value - baseline.mean) < MIN_STD_DEV) {
      return 0; // 觀測值也相同，沒有偏離
    }
    // 觀測值不同，視為明顯異常（限制在 +/-3 避免誇大）
    return value > baseline.mean ? 3 : -3;
  }

  return (value - baseline.mean) / baseline.stdDev;
}

/**
 * 偵測單一維度的異常
 *
 * @param value - 當前觀測值
 * @param baseline - 個人基線
 * @param threshold - Z-score 閾值（預設 1.5）
 * @returns 異常偵測結果
 */
export function detectAnomaly(
  value: number,
  baseline: Baseline,
  threshold: number = 1.5
): AnomalyResult {
  const zScore = calculateZScore(value, baseline);
  const absZ = Math.abs(zScore);
  const isAnomalous = absZ >= threshold;

  let direction: AnomalyResult['direction'] = 'normal';
  if (isAnomalous) {
    direction = zScore > 0 ? 'higher' : 'lower';
  }

  return {
    zScore,
    isAnomalous,
    direction,
    consecutiveDays: 0, // 需搭配 detectConsecutiveAnomalies 計算
  };
}

/**
 * 偵測連續異常天數
 *
 * 重要設計理念：單日異常可能只是意外（例如趕案子熬夜一天），
 * 但連續 3 天以上的異常才代表真正的模式改變。
 *
 * @param recentData - 最近幾天的資料點（由舊到新排序）
 * @param baseline - 個人基線
 * @param threshold - Z-score 閾值
 * @returns 從最新一天往回算的連續異常天數
 */
export function detectConsecutiveAnomalies(
  recentData: DataPoint[],
  baseline: Baseline,
  threshold: number = 1.5
): number {
  if (recentData.length === 0) return 0;

  // 從最新的資料往回檢查
  const sorted = [...recentData].sort((a, b) => b.timestamp - a.timestamp);

  let consecutive = 0;
  for (const dp of sorted) {
    const result = detectAnomaly(dp.value, baseline, threshold);
    if (result.isAnomalous) {
      consecutive++;
    } else {
      break; // 遇到正常值就中斷計算
    }
  }

  return consecutive;
}

/**
 * 將 Z-score 轉換為 0-100 的平靜分數
 *
 * 轉換邏輯（使用 Sigmoid 衰減）：
 * - Z = 0 → 分數 100（完全正常）
 * - Z = 1 → 分數約 73
 * - Z = 1.5 → 分數約 55（警示閾值）
 * - Z = 2 → 分數約 38
 * - Z = 3 → 分數約 12
 * - Z >= 4 → 趨近 0
 *
 * 使用反向 Sigmoid 讓分數在閾值附近有明顯的轉折，
 * 而不是線性下降（避免分數在正常範圍內波動太大造成誤報）。
 *
 * @param zScore - Z-score 值（取絕對值）
 * @param inverted - 是否反轉（某些維度 Z-score 低 = 好，例如回覆延遲降低）
 * @returns 平靜分數 0-100
 */
export function zScoreToCalmScore(
  zScore: number,
  inverted: boolean = false
): number {
  // 取絕對值處理方向
  const absZ = Math.abs(zScore);

  // 如果是反轉維度且 Z-score 方向有利，給予滿分
  if (inverted && zScore < 0) {
    return 100;
  }
  if (!inverted && zScore < 0) {
    // 非反轉維度，Z-score 為負表示低於基線
    // 某些維度（如訊息量）降低可能是正面的，這裡用絕對值處理
    return zScoreToCalmScore(absZ);
  }

  // Sigmoid 衰減函數：分數 = 100 / (1 + e^(k * (z - midpoint)))
  // k 控制轉折的陡峭度，midpoint 控制轉折點
  const k = 1.8;
  const midpoint = 1.5;
  const score = 100 / (1 + Math.exp(k * (absZ - midpoint)));

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * 產生警示訊息
 *
 * 根據異常偵測結果和連續天數，產生適當的警示。
 * 嚴重程度分級：
 * - info：偏離 1.5-2 個標準差，或連續 1-2 天
 * - warning：偏離 2-2.5 個標準差，或連續 3-4 天
 * - critical：偏離 > 2.5 個標準差，或連續 >= 5 天
 *
 * @param dimension - 維度名稱
 * @param result - 異常偵測結果
 * @param consecutiveDays - 連續異常天數
 * @returns 警示物件，若無異常回傳 null
 */
export function generateAlert(
  dimension: DimensionName,
  result: AnomalyResult,
  consecutiveDays: number
): Alert | null {
  if (!result.isAnomalous) return null;

  const absZ = Math.abs(result.zScore);

  // 決定嚴重程度
  let severity: Alert['severity'] = 'info';
  if (absZ > 2.5 || consecutiveDays >= 5) {
    severity = 'critical';
  } else if (absZ > 2 || consecutiveDays >= 3) {
    severity = 'warning';
  }

  // 維度中文名稱對照
  const dimensionLabels: Record<DimensionName, string> = {
    messageVolume: '訊息量',
    replyLatency: '回覆速度',
    nightActivity: '深夜活躍度',
    unreadPileup: '未讀堆積',
    voiceEmotion: '語音情緒',
  };

  const label = dimensionLabels[dimension];
  const directionText = result.direction === 'higher' ? '偏高' : '偏低';

  let message = `${label}${directionText}，偏離基線 ${absZ.toFixed(1)} 個標準差`;
  if (consecutiveDays > 1) {
    message += `（已連續 ${consecutiveDays} 天）`;
  }

  return { dimension, severity, message };
}
