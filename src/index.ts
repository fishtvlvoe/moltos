/**
 * Moltos Calm Index
 * 平靜指數演算法核心框架
 *
 * 把生活的噪音，變成你內心的聲音。
 *
 * @packageDocumentation
 */

// 核心演算法
export { calculateCalmIndex } from './calm-index.js';
export type { CalmIndexInput } from './calm-index.js';

// 個人基線
export {
  buildBaseline,
  extractRollingWindow,
  computeExponentialWeights,
  weightedMean,
  weightedStdDev,
} from './baseline.js';

// 異常偵測
export {
  calculateZScore,
  detectAnomaly,
  detectConsecutiveAnomalies,
  zScoreToCalmScore,
  generateAlert,
} from './anomaly.js';
export type { AnomalyResult } from './anomaly.js';

// 語音情緒
export {
  analyzeVoiceEmotion,
  buildVoiceBaselines,
} from './voice-emotion.js';
export type { VoiceBaselines, VoiceHistory } from './voice-emotion.js';

// 型別定義
export type {
  DataPoint,
  TimeRange,
  MessageVolumeData,
  ReplyLatencyData,
  NightActivityData,
  UnreadPileupData,
  VoiceFeatures,
  VoiceEmotionResult,
  DimensionScore,
  DimensionName,
  CalmIndexResult,
  CalmLevel,
  Alert,
  Baseline,
  CalmIndexConfig,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';
