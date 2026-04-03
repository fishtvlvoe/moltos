/**
 * Moltos Calm Index - 型別定義
 *
 * 定義平靜指數系統中所有資料結構與介面。
 * 設計原則：只與自己比較，不與他人比較。
 */

// ─── 基礎資料點 ───

/** 帶時間戳記的數值資料點 */
export interface DataPoint {
  /** Unix 時間戳記（毫秒） */
  timestamp: number;
  /** 數值 */
  value: number;
}

/** 時間區間定義 */
export interface TimeRange {
  /** 起始時間（Unix 毫秒） */
  start: number;
  /** 結束時間（Unix 毫秒） */
  end: number;
}

// ─── 五大輸入維度 ───

/** 訊息量趨勢資料 */
export interface MessageVolumeData {
  /** 每日訊息量歷史（至少 14 天） */
  dailyCounts: DataPoint[];
}

/** 回覆速度資料 */
export interface ReplyLatencyData {
  /** 每則訊息的回覆延遲（毫秒） */
  latencies: DataPoint[];
}

/** 深夜活躍度資料（23:00-05:00） */
export interface NightActivityData {
  /** 每日深夜時段的活躍分鐘數 */
  nightMinutes: DataPoint[];
}

/** 未讀堆積資料 */
export interface UnreadPileupData {
  /** 每日未讀訊息數量快照 */
  unreadCounts: DataPoint[];
}

/** 語音情緒特徵原始資料 */
export interface VoiceFeatures {
  /** 語速（字/分鐘） */
  speechRate: number;
  /** 基礎頻率 F0（Hz），反映音調高低 */
  fundamentalFrequency: number;
  /** 停頓比例（0-1），停頓總時長 / 語音總時長 */
  pauseRatio: number;
  /** 音量變異係數（標準差/平均值），反映情緒穩定度 */
  volumeVariability: number;
}

/** 語音情緒分析結果 */
export interface VoiceEmotionResult {
  /** 語音焦慮分數（0-100，0=平靜，100=極度焦慮） */
  anxietyScore: number;
  /** 各特徵的 Z-score 偏離值 */
  featureDeviations: {
    speechRate: number;
    pitch: number;
    pauseRatio: number;
    volumeVariability: number;
  };
  /** 信心度（0-1），樣本太少時信心度低 */
  confidence: number;
}

// ─── 平靜指數輸出 ───

/** 單一維度的分析結果 */
export interface DimensionScore {
  /** 維度名稱 */
  dimension: DimensionName;
  /** 該維度的平靜分數（0-100） */
  score: number;
  /** Z-score 偏離值（正值=比平常高，負值=比平常低） */
  zScore: number;
  /** 是否觸發警示（|Z| > 閾值） */
  isAnomalous: boolean;
  /** 權重（加權後對總分的影響比例） */
  weight: number;
}

/** 五大維度名稱 */
export type DimensionName =
  | 'messageVolume'
  | 'replyLatency'
  | 'nightActivity'
  | 'unreadPileup'
  | 'voiceEmotion';

/** 平靜指數最終結果 */
export interface CalmIndexResult {
  /** 綜合平靜指數（0-100） */
  score: number;
  /** 風險等級 */
  level: CalmLevel;
  /** 各維度詳細分數 */
  dimensions: DimensionScore[];
  /** 計算時間戳記 */
  calculatedAt: number;
  /** 觸發的警示列表 */
  alerts: Alert[];
}

/** 平靜等級定義 */
export type CalmLevel = 'calm' | 'mild' | 'moderate' | 'attention';

/** 警示資訊 */
export interface Alert {
  /** 觸發的維度 */
  dimension: DimensionName;
  /** 警示等級 */
  severity: 'info' | 'warning' | 'critical';
  /** 描述訊息 */
  message: string;
}

// ─── 基線相關 ───

/** 個人基線資料 */
export interface Baseline {
  /** 平均值 */
  mean: number;
  /** 標準差 */
  stdDev: number;
  /** 樣本數 */
  sampleCount: number;
  /** 基線計算的時間範圍 */
  timeRange: TimeRange;
}

// ─── 設定 ───

/** 平靜指數計算設定 */
export interface CalmIndexConfig {
  /** 基線計算天數（預設 14） */
  baselineDays: number;
  /** Z-score 警示閾值（預設 1.5） */
  zScoreThreshold: number;
  /** 深夜時段起始小時（預設 23） */
  nightStartHour: number;
  /** 深夜時段結束小時（預設 5） */
  nightEndHour: number;
  /** 各維度權重 */
  weights: Record<DimensionName, number>;
  /** 時間衰減係數（0-1，越大代表近期資料權重越高，預設 0.85） */
  timeDecayFactor: number;
}

/** 預設設定值 */
export const DEFAULT_CONFIG: CalmIndexConfig = {
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
