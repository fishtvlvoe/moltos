/**
 * Moltos Calm Index - 語音情緒分析模組
 *
 * 雙通道分析：文字情緒 + 語音聲學特徵 → 交叉驗證
 *
 * 語音焦慮的科學依據：
 * 1. 語速加快 → 焦慮時不自覺加速說話
 * 2. 音調升高 → 聲帶緊張導致基礎頻率上升
 * 3. 停頓增多 → 思緒混亂導致組織語言困難
 * 4. 音量不穩 → 情緒波動導致音量忽大忽小
 *
 * 本模組定義介面和計算邏輯，實際的語音特徵擷取
 * 需由外部 ASR/語音處理引擎提供。
 */

import type { VoiceFeatures, VoiceEmotionResult, Baseline } from './types.js';
import { buildBaseline } from './baseline.js';
import { calculateZScore } from './anomaly.js';
import type { DataPoint } from './types.js';

/** 語音特徵基線集合 */
export interface VoiceBaselines {
  speechRate: Baseline;
  fundamentalFrequency: Baseline;
  pauseRatio: Baseline;
  volumeVariability: Baseline;
}

/** 語音特徵歷史資料 */
export interface VoiceHistory {
  speechRates: DataPoint[];
  frequencies: DataPoint[];
  pauseRatios: DataPoint[];
  volumeVariabilities: DataPoint[];
}

/**
 * 從語音歷史資料建立各特徵的個人基線
 *
 * @param history - 語音特徵歷史資料
 * @param days - 基線天數（預設 14）
 * @param decayFactor - 時間衰減係數（預設 0.85）
 * @returns 基線集合，若任一特徵資料不足回傳 null
 */
export function buildVoiceBaselines(
  history: VoiceHistory,
  days: number = 14,
  decayFactor: number = 0.85
): VoiceBaselines | null {
  const speechRate = buildBaseline(history.speechRates, days, decayFactor);
  const fundamentalFrequency = buildBaseline(history.frequencies, days, decayFactor);
  const pauseRatio = buildBaseline(history.pauseRatios, days, decayFactor);
  const volumeVariability = buildBaseline(
    history.volumeVariabilities,
    days,
    decayFactor
  );

  // 任一特徵基線不足，無法進行語音分析
  if (!speechRate || !fundamentalFrequency || !pauseRatio || !volumeVariability) {
    return null;
  }

  return { speechRate, fundamentalFrequency, pauseRatio, volumeVariability };
}

/**
 * 分析語音情緒特徵
 *
 * 計算方式：
 * 1. 各特徵分別計算 Z-score（相對於個人基線）
 * 2. 焦慮方向加權（語速加快=焦慮、音調升高=焦慮、停頓增多=焦慮、音量不穩=焦慮）
 * 3. 四個特徵的焦慮指標做加權平均
 * 4. 信心度根據基線樣本數調整
 *
 * @param features - 當前語音特徵
 * @param baselines - 個人語音基線
 * @returns 語音情緒分析結果
 */
export function analyzeVoiceEmotion(
  features: VoiceFeatures,
  baselines: VoiceBaselines
): VoiceEmotionResult {
  // 計算各特徵的 Z-score
  const speechRateZ = calculateZScore(features.speechRate, baselines.speechRate);
  const pitchZ = calculateZScore(
    features.fundamentalFrequency,
    baselines.fundamentalFrequency
  );
  const pauseZ = calculateZScore(features.pauseRatio, baselines.pauseRatio);
  const volumeZ = calculateZScore(
    features.volumeVariability,
    baselines.volumeVariability
  );

  // 焦慮方向的 Z-score（正值 = 更焦慮）
  // 語速加快 → 正值 = 焦慮
  // 音調升高 → 正值 = 焦慮
  // 停頓增多 → 正值 = 焦慮
  // 音量不穩 → 正值 = 焦慮
  const anxietyContributions = {
    speechRate: Math.max(0, speechRateZ),   // 只計算加快的部分
    pitch: Math.max(0, pitchZ),              // 只計算升高的部分
    pauseRatio: Math.max(0, pauseZ),         // 只計算增多的部分
    volumeVariability: Math.max(0, volumeZ), // 只計算不穩的部分
  };

  // 加權平均（語速和音調權重較高，因為研究顯示它們是最可靠的焦慮指標）
  const weights = {
    speechRate: 0.30,
    pitch: 0.30,
    pauseRatio: 0.20,
    volumeVariability: 0.20,
  };

  const weightedAnxiety =
    anxietyContributions.speechRate * weights.speechRate +
    anxietyContributions.pitch * weights.pitch +
    anxietyContributions.pauseRatio * weights.pauseRatio +
    anxietyContributions.volumeVariability * weights.volumeVariability;

  // 將加權 Z-score 轉換為 0-100 的焦慮分數
  // 使用 Sigmoid 映射：Z=0 → 0 分，Z=3 → 約 95 分
  const anxietyScore = Math.round(
    Math.min(100, 100 * (1 - 1 / (1 + Math.exp(1.5 * (weightedAnxiety - 1)))))
  );

  // 信心度：基於最小樣本數
  const minSamples = Math.min(
    baselines.speechRate.sampleCount,
    baselines.fundamentalFrequency.sampleCount,
    baselines.pauseRatio.sampleCount,
    baselines.volumeVariability.sampleCount
  );
  // 3 個樣本 → 信心度 0.3，14 個樣本 → 信心度 1.0
  const confidence = Math.min(1, Math.max(0, (minSamples - 2) / 12));

  return {
    anxietyScore,
    featureDeviations: {
      speechRate: speechRateZ,
      pitch: pitchZ,
      pauseRatio: pauseZ,
      volumeVariability: volumeZ,
    },
    confidence,
  };
}
