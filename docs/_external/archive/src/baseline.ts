/**
 * Moltos Calm Index - 個人基線建立模組
 *
 * 核心理念：每個人的「正常」都不同。
 * 使用 14 天滾動平均建立個人基線，搭配指數加權讓近期資料更有影響力。
 * 所有比較都是「自己 vs 自己的歷史」，不跟別人比。
 */

import type { DataPoint, Baseline, TimeRange } from './types.js';

/** 一天的毫秒數 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 計算指數加權移動平均（EWMA）的權重序列
 *
 * 原理：距離現在越近的資料，影響力越大。
 * 用衰減係數 alpha 控制「記憶長度」：
 * - alpha = 0.85 → 最近的資料權重最高，7 天前的權重約 32%
 * - alpha = 0.95 → 衰減更慢，歷史資料影響更持久
 *
 * @param length - 序列長度
 * @param alpha - 衰減係數（0-1），越大代表近期權重越高
 * @returns 正規化後的權重陣列（總和為 1），索引 0 = 最舊的資料
 */
export function computeExponentialWeights(length: number, alpha: number): number[] {
  if (length <= 0) return [];
  if (alpha <= 0 || alpha >= 1) {
    throw new Error(`衰減係數 alpha 必須介於 0 和 1 之間，收到: ${alpha}`);
  }

  const weights: number[] = [];
  for (let i = 0; i < length; i++) {
    // 索引 0 = 最舊，索引 length-1 = 最新
    // 最新的資料權重 = alpha^0 = 1，最舊的 = alpha^(length-1)
    weights.push(Math.pow(alpha, length - 1 - i));
  }

  // 正規化：讓所有權重加總為 1
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

/**
 * 計算加權平均值
 *
 * @param values - 數值陣列
 * @param weights - 對應的權重陣列（須與 values 等長，且總和為 1）
 * @returns 加權平均值
 */
export function weightedMean(values: number[], weights: number[]): number {
  if (values.length !== weights.length) {
    throw new Error(
      `values 和 weights 長度不一致: ${values.length} vs ${weights.length}`
    );
  }
  if (values.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
  }
  return sum;
}

/**
 * 計算加權標準差
 *
 * 使用 reliability weights 公式，避免偏差估計。
 * 參考：https://en.wikipedia.org/wiki/Weighted_arithmetic_mean#Reliability_weights
 *
 * @param values - 數值陣列
 * @param weights - 對應的權重陣列
 * @param mean - 加權平均值（避免重複計算）
 * @returns 加權標準差
 */
export function weightedStdDev(
  values: number[],
  weights: number[],
  mean: number
): number {
  if (values.length <= 1) return 0;

  // V1 = 權重總和, V2 = 權重平方和
  const v1 = weights.reduce((a, b) => a + b, 0);
  const v2 = weights.reduce((a, w) => a + w * w, 0);

  // 加權方差（Bessel 校正版）
  let weightedVariance = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - mean;
    weightedVariance += weights[i] * diff * diff;
  }

  // 校正係數：避免小樣本偏差
  const correction = v1 - v2 / v1;
  if (correction <= 0) return 0;

  return Math.sqrt(weightedVariance / correction);
}

/**
 * 從資料點中擷取指定天數的滾動視窗
 *
 * @param dataPoints - 原始資料點（不需要排序）
 * @param days - 視窗天數
 * @param referenceTime - 參考時間點（預設為最新資料的時間）
 * @returns 排序後的資料點子集
 */
export function extractRollingWindow(
  dataPoints: DataPoint[],
  days: number,
  referenceTime?: number
): DataPoint[] {
  if (dataPoints.length === 0) return [];

  // 按時間排序（由舊到新）
  const sorted = [...dataPoints].sort((a, b) => a.timestamp - b.timestamp);

  const endTime = referenceTime ?? sorted[sorted.length - 1].timestamp;
  const startTime = endTime - days * ONE_DAY_MS;

  return sorted.filter(
    (dp) => dp.timestamp > startTime && dp.timestamp <= endTime
  );
}

/**
 * 建立個人基線
 *
 * 使用指數加權的 14 天滾動平均，計算出個人的「正常範圍」。
 * 回傳的基線包含加權平均值和加權標準差，用於後續的 Z-score 異常偵測。
 *
 * @param dataPoints - 歷史資料點
 * @param days - 基線天數（預設 14）
 * @param decayFactor - 時間衰減係數（預設 0.85）
 * @param referenceTime - 參考時間點
 * @returns 個人基線，若資料不足回傳 null
 *
 * @example
 * ```ts
 * const baseline = buildBaseline(dailyMessageCounts, 14, 0.85);
 * if (baseline) {
 *   console.log(`你的平均訊息量: ${baseline.mean.toFixed(1)}`);
 *   console.log(`標準差: ${baseline.stdDev.toFixed(1)}`);
 * }
 * ```
 */
export function buildBaseline(
  dataPoints: DataPoint[],
  days: number = 14,
  decayFactor: number = 0.85,
  referenceTime?: number
): Baseline | null {
  const window = extractRollingWindow(dataPoints, days, referenceTime);

  // 最少需要 3 天資料才能建立有意義的基線
  if (window.length < 3) {
    return null;
  }

  const values = window.map((dp) => dp.value);
  const weights = computeExponentialWeights(values.length, decayFactor);

  const mean = weightedMean(values, weights);
  const stdDev = weightedStdDev(values, weights, mean);

  return {
    mean,
    stdDev,
    sampleCount: window.length,
    timeRange: {
      start: window[0].timestamp,
      end: window[window.length - 1].timestamp,
    },
  };
}
