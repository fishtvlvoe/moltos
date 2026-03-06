/**
 * Moltos Calm Index - 平靜指數核心演算法
 *
 * 把生活的噪音，變成你內心的聲音。
 *
 * 平靜指數是一個 0-100 的綜合分數：
 * - 100 = 平靜（你的行為模式跟平常一樣）
 * - 50-70 = 輕微波動（有些維度偏離基線）
 * - 30-50 = 需要留意（多個維度持續偏離）
 * - 0-30 = 需要關注（明顯且持續的模式改變）
 *
 * 核心設計原則：
 * 1. 正面框架 — 顯示「平靜程度」而非「焦慮程度」
 * 2. 個人基線 — 只跟自己比，不跟別人比
 * 3. 持續性偵測 — 過濾單日波動，聚焦趨勢改變
 * 4. 五維交叉 — 多個維度同時異常才提高警示等級
 */

import type {
  CalmIndexResult,
  CalmIndexConfig,
  CalmLevel,
  DimensionScore,
  DimensionName,
  Alert,
  DataPoint,
  MessageVolumeData,
  ReplyLatencyData,
  NightActivityData,
  UnreadPileupData,
  VoiceEmotionResult,
  DEFAULT_CONFIG,
} from './types.js';

import { buildBaseline, extractRollingWindow } from './baseline.js';
import {
  detectAnomaly,
  detectConsecutiveAnomalies,
  zScoreToCalmScore,
  generateAlert,
} from './anomaly.js';

/** 重新匯出預設設定（避免循環依賴問題的型別匯入） */
const DEFAULT_CALM_CONFIG: CalmIndexConfig = {
  baselineDays: 14,
  zScoreThreshold: 1.5,
  nightStartHour: 23,
  nightEndHour: 5,
  timeDecayFactor: 0.85,
  weights: {
    messageVolume: 0.20,
    replyLatency: 0.20,
    nightActivity: 0.20,
    unreadPileup: 0.20,
    voiceEmotion: 0.20,
  },
};

/**
 * 計算單一維度的平靜分數
 *
 * 流程：
 * 1. 從歷史資料建立個人基線
 * 2. 用最新資料點計算 Z-score
 * 3. 將 Z-score 轉換為平靜分數
 * 4. 偵測連續異常天數
 * 5. 如果有連續異常，進一步下修分數
 *
 * @param dimension - 維度名稱
 * @param dataPoints - 歷史資料點
 * @param currentValue - 當前觀測值
 * @param config - 設定
 * @param inverted - 是否為反轉維度（數值降低 = 好）
 * @returns 維度分數，若資料不足回傳 null
 */
function scoreDimension(
  dimension: DimensionName,
  dataPoints: DataPoint[],
  currentValue: number,
  config: CalmIndexConfig,
  inverted: boolean = false
): { dimensionScore: DimensionScore; alert: Alert | null } | null {
  const baseline = buildBaseline(
    dataPoints,
    config.baselineDays,
    config.timeDecayFactor
  );

  if (!baseline) {
    // 資料不足，回傳中性分數（不影響總分判斷）
    return null;
  }

  const anomalyResult = detectAnomaly(
    currentValue,
    baseline,
    config.zScoreThreshold
  );

  // 計算連續異常天數
  const recentWindow = extractRollingWindow(dataPoints, 7);
  const consecutiveDays = detectConsecutiveAnomalies(
    recentWindow,
    baseline,
    config.zScoreThreshold
  );

  // 基礎平靜分數
  let score = zScoreToCalmScore(anomalyResult.zScore, inverted);

  // 連續異常懲罰：每多一天連續異常，額外扣 5 分
  // 但最多扣 25 分（5 天封頂），避免分數直接歸零
  if (consecutiveDays > 1) {
    const penalty = Math.min(25, (consecutiveDays - 1) * 5);
    score = Math.max(0, score - penalty);
  }

  const dimensionScore: DimensionScore = {
    dimension,
    score,
    zScore: anomalyResult.zScore,
    isAnomalous: anomalyResult.isAnomalous,
    weight: config.weights[dimension],
  };

  const alert = generateAlert(dimension, anomalyResult, consecutiveDays);

  return { dimensionScore, alert };
}

/**
 * 根據綜合分數判定平靜等級
 *
 * @param score - 綜合平靜分數 0-100
 * @returns 平靜等級
 */
function determineCalmLevel(score: number): CalmLevel {
  if (score >= 75) return 'calm';
  if (score >= 50) return 'mild';
  if (score >= 30) return 'moderate';
  return 'attention';
}

/** 平靜指數計算輸入 */
export interface CalmIndexInput {
  /** 訊息量趨勢資料 */
  messageVolume?: MessageVolumeData;
  /** 回覆速度資料 */
  replyLatency?: ReplyLatencyData;
  /** 深夜活躍度資料 */
  nightActivity?: NightActivityData;
  /** 未讀堆積資料 */
  unreadPileup?: UnreadPileupData;
  /** 語音情緒分析結果（由外部語音處理引擎提供） */
  voiceEmotion?: VoiceEmotionResult;
  /** 當前時間戳記（預設為 Date.now()） */
  currentTime?: number;
}

/**
 * 計算平靜指數
 *
 * 這是整個框架的主要入口。接收五大維度的資料，回傳綜合平靜指數。
 *
 * 設計決策：
 * - 不是所有維度都必須有資料（語音可能沒有、訊息量可能不足 14 天）
 * - 有資料的維度會自動重新分配權重（確保總權重 = 1）
 * - 至少需要 1 個維度有足夠資料才能計算
 *
 * @param input - 各維度的輸入資料
 * @param config - 計算設定（可部分覆寫預設值）
 * @returns 平靜指數結果，若資料完全不足回傳 null
 *
 * @example
 * ```ts
 * const result = calculateCalmIndex({
 *   messageVolume: { dailyCounts: last30Days },
 *   replyLatency: { latencies: recentLatencies },
 *   nightActivity: { nightMinutes: nightData },
 * });
 *
 * if (result) {
 *   console.log(`平靜指數: ${result.score}`);
 *   console.log(`等級: ${result.level}`);
 *   result.alerts.forEach(a => console.log(a.message));
 * }
 * ```
 */
export function calculateCalmIndex(
  input: CalmIndexInput,
  config?: Partial<CalmIndexConfig>
): CalmIndexResult | null {
  const mergedConfig: CalmIndexConfig = {
    ...DEFAULT_CALM_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_CALM_CONFIG.weights,
      ...config?.weights,
    },
  };

  const now = input.currentTime ?? Date.now();
  const dimensionScores: DimensionScore[] = [];
  const alerts: Alert[] = [];

  // ── 維度 1：訊息量趨勢 ──
  if (input.messageVolume && input.messageVolume.dailyCounts.length > 0) {
    const data = input.messageVolume.dailyCounts;
    const latest = data[data.length - 1];
    const result = scoreDimension(
      'messageVolume',
      data,
      latest.value,
      mergedConfig,
      false // 訊息量偏高偏低都可能是問題
    );
    if (result) {
      dimensionScores.push(result.dimensionScore);
      if (result.alert) alerts.push(result.alert);
    }
  }

  // ── 維度 2：回覆速度變化 ──
  if (input.replyLatency && input.replyLatency.latencies.length > 0) {
    const data = input.replyLatency.latencies;
    const latest = data[data.length - 1];
    const result = scoreDimension(
      'replyLatency',
      data,
      latest.value,
      mergedConfig,
      false // 延遲增加 = Z 正值 = 不好
    );
    if (result) {
      dimensionScores.push(result.dimensionScore);
      if (result.alert) alerts.push(result.alert);
    }
  }

  // ── 維度 3：深夜活躍度 ──
  if (input.nightActivity && input.nightActivity.nightMinutes.length > 0) {
    const data = input.nightActivity.nightMinutes;
    const latest = data[data.length - 1];
    const result = scoreDimension(
      'nightActivity',
      data,
      latest.value,
      mergedConfig,
      false // 深夜活躍增加 = 不好
    );
    if (result) {
      dimensionScores.push(result.dimensionScore);
      if (result.alert) alerts.push(result.alert);
    }
  }

  // ── 維度 4：未讀堆積 ──
  if (input.unreadPileup && input.unreadPileup.unreadCounts.length > 0) {
    const data = input.unreadPileup.unreadCounts;
    const latest = data[data.length - 1];
    const result = scoreDimension(
      'unreadPileup',
      data,
      latest.value,
      mergedConfig,
      false // 未讀增加 = 不好
    );
    if (result) {
      dimensionScores.push(result.dimensionScore);
      if (result.alert) alerts.push(result.alert);
    }
  }

  // ── 維度 5：語音情緒 ──
  if (input.voiceEmotion) {
    // 語音情緒由外部分析完成，這裡直接使用焦慮分數
    // 焦慮分數 0-100 需反轉為平靜分數
    const calmFromVoice = Math.max(0, 100 - input.voiceEmotion.anxietyScore);
    // 根據信心度調整：信心度低時拉向中性值 (75)
    const adjustedScore = Math.round(
      calmFromVoice * input.voiceEmotion.confidence +
      75 * (1 - input.voiceEmotion.confidence)
    );

    const voiceScore: DimensionScore = {
      dimension: 'voiceEmotion',
      score: adjustedScore,
      zScore: (100 - input.voiceEmotion.anxietyScore - 50) / 25, // 近似 Z-score
      isAnomalous: input.voiceEmotion.anxietyScore > 60,
      weight: mergedConfig.weights.voiceEmotion,
    };
    dimensionScores.push(voiceScore);

    if (input.voiceEmotion.anxietyScore > 60) {
      alerts.push({
        dimension: 'voiceEmotion',
        severity: input.voiceEmotion.anxietyScore > 80 ? 'critical' : 'warning',
        message: `語音情緒分析顯示焦慮指標偏高（${input.voiceEmotion.anxietyScore}/100）`,
      });
    }
  }

  // ── 沒有任何可用維度 ──
  if (dimensionScores.length === 0) {
    return null;
  }

  // ── 重新分配權重 ──
  // 只有有資料的維度參與計算，權重按比例放大到總和為 1
  const totalActiveWeight = dimensionScores.reduce((sum, d) => sum + d.weight, 0);
  const normalizedScores = dimensionScores.map((d) => ({
    ...d,
    weight: d.weight / totalActiveWeight,
  }));

  // ── 計算加權總分 ──
  const compositeScore = Math.round(
    normalizedScores.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  // ── 多維度交叉懲罰 ──
  // 當多個維度同時異常時，額外下修分數（多維度同時出問題比單一維度更嚴重）
  const anomalousCount = normalizedScores.filter((d) => d.isAnomalous).length;
  let crossPenalty = 0;
  if (anomalousCount >= 3) {
    crossPenalty = (anomalousCount - 2) * 5; // 3 個異常扣 5 分，4 個扣 10 分...
  }

  const finalScore = Math.max(0, Math.min(100, compositeScore - crossPenalty));

  return {
    score: finalScore,
    level: determineCalmLevel(finalScore),
    dimensions: normalizedScores,
    calculatedAt: now,
    alerts,
  };
}
