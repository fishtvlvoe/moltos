/**
 * Moltos Calm Index - 基本使用範例
 *
 * 這個範例展示如何使用平靜指數框架：
 * 1. 準備歷史資料
 * 2. 計算平靜指數
 * 3. 解讀結果
 */

import {
  calculateCalmIndex,
  buildBaseline,
  analyzeVoiceEmotion,
  buildVoiceBaselines,
  type DataPoint,
  type CalmIndexInput,
  type VoiceHistory,
  type VoiceFeatures,
} from '../src/index.js';

// ─── 工具函式：產生模擬資料 ───

const ONE_DAY = 24 * 60 * 60 * 1000;

/** 產生指定天數的模擬資料點 */
function generateDailyData(
  days: number,
  baseMean: number,
  stdDev: number,
  startTime?: number
): DataPoint[] {
  const start = startTime ?? Date.now() - days * ONE_DAY;
  const points: DataPoint[] = [];

  for (let i = 0; i < days; i++) {
    // 用 Box-Muller 變換產生常態分佈亂數
    const u1 = Math.random();
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const value = Math.max(0, baseMean + normal * stdDev);

    points.push({
      timestamp: start + i * ONE_DAY,
      value: Math.round(value * 10) / 10,
    });
  }

  return points;
}

// ─── 範例 1：基本平靜指數計算 ───

console.log('=== 範例 1：正常狀態的平靜指數 ===\n');

// 模擬一個「正常」的使用者：過去 20 天的行為模式穩定
const normalInput: CalmIndexInput = {
  messageVolume: {
    dailyCounts: generateDailyData(20, 50, 10), // 平均每天 50 則訊息
  },
  replyLatency: {
    latencies: generateDailyData(20, 300, 60), // 平均回覆延遲 300 秒
  },
  nightActivity: {
    nightMinutes: generateDailyData(20, 10, 5), // 平均深夜活躍 10 分鐘
  },
  unreadPileup: {
    unreadCounts: generateDailyData(20, 5, 3), // 平均未讀 5 則
  },
};

const normalResult = calculateCalmIndex(normalInput);
if (normalResult) {
  console.log(`平靜指數: ${normalResult.score}/100`);
  console.log(`等級: ${normalResult.level}`);
  console.log(`維度明細:`);
  normalResult.dimensions.forEach((d) => {
    console.log(
      `  ${d.dimension}: ${d.score}/100 (Z=${d.zScore.toFixed(2)}, 異常=${d.isAnomalous})`
    );
  });
  console.log(`警示: ${normalResult.alerts.length} 個`);
}

// ─── 範例 2：異常狀態偵測 ───

console.log('\n=== 範例 2：異常狀態偵測 ===\n');

// 模擬一個「近期壓力增大」的使用者：
// - 前 14 天正常
// - 最近 6 天訊息量暴增、深夜活躍度上升、未讀堆積
const now = Date.now();
const baselineStart = now - 20 * ONE_DAY;

// 前 14 天正常
const normalDays = generateDailyData(14, 50, 10, baselineStart);

// 最近 6 天異常
const abnormalDays: DataPoint[] = [];
for (let i = 0; i < 6; i++) {
  abnormalDays.push({
    timestamp: baselineStart + (14 + i) * ONE_DAY,
    value: 120 + Math.random() * 30, // 訊息量暴增到 120-150
  });
}

const stressedInput: CalmIndexInput = {
  messageVolume: {
    dailyCounts: [...normalDays, ...abnormalDays],
  },
  nightActivity: {
    nightMinutes: [
      ...generateDailyData(14, 10, 5, baselineStart),
      // 最近 6 天深夜活躍度飆升
      ...Array.from({ length: 6 }, (_, i) => ({
        timestamp: baselineStart + (14 + i) * ONE_DAY,
        value: 60 + Math.random() * 30,
      })),
    ],
  },
  unreadPileup: {
    unreadCounts: [
      ...generateDailyData(14, 5, 3, baselineStart),
      // 最近 6 天未讀持續攀升
      ...Array.from({ length: 6 }, (_, i) => ({
        timestamp: baselineStart + (14 + i) * ONE_DAY,
        value: 20 + i * 10, // 20, 30, 40, 50, 60, 70
      })),
    ],
  },
};

const stressedResult = calculateCalmIndex(stressedInput);
if (stressedResult) {
  console.log(`平靜指數: ${stressedResult.score}/100`);
  console.log(`等級: ${stressedResult.level}`);
  console.log(`維度明細:`);
  stressedResult.dimensions.forEach((d) => {
    const flag = d.isAnomalous ? ' ⚠' : '';
    console.log(
      `  ${d.dimension}: ${d.score}/100 (Z=${d.zScore.toFixed(2)})${flag}`
    );
  });
  console.log(`\n警示 (${stressedResult.alerts.length} 個):`);
  stressedResult.alerts.forEach((a) => {
    console.log(`  [${a.severity.toUpperCase()}] ${a.message}`);
  });
}

// ─── 範例 3：語音情緒分析 ───

console.log('\n=== 範例 3：語音情緒分析 ===\n');

// 模擬語音歷史資料
const voiceHistory: VoiceHistory = {
  speechRates: generateDailyData(14, 180, 15),      // 平均語速 180 字/分
  frequencies: generateDailyData(14, 200, 20),       // 平均基礎頻率 200Hz
  pauseRatios: generateDailyData(14, 0.15, 0.03),   // 平均停頓比 15%
  volumeVariabilities: generateDailyData(14, 0.2, 0.05), // 平均音量變異 0.2
};

const baselines = buildVoiceBaselines(voiceHistory);

if (baselines) {
  // 模擬一段焦慮的語音特徵
  const anxiousVoice: VoiceFeatures = {
    speechRate: 230,              // 語速明顯加快
    fundamentalFrequency: 260,    // 音調升高
    pauseRatio: 0.28,             // 停頓增多
    volumeVariability: 0.35,      // 音量不穩定
  };

  const voiceResult = analyzeVoiceEmotion(anxiousVoice, baselines);
  console.log(`焦慮分數: ${voiceResult.anxietyScore}/100`);
  console.log(`信心度: ${(voiceResult.confidence * 100).toFixed(0)}%`);
  console.log(`各特徵偏離 (Z-score):`);
  console.log(`  語速: ${voiceResult.featureDeviations.speechRate.toFixed(2)}`);
  console.log(`  音調: ${voiceResult.featureDeviations.pitch.toFixed(2)}`);
  console.log(`  停頓: ${voiceResult.featureDeviations.pauseRatio.toFixed(2)}`);
  console.log(`  音量: ${voiceResult.featureDeviations.volumeVariability.toFixed(2)}`);
}

// ─── 範例 4：自訂設定 ───

console.log('\n=== 範例 4：自訂設定 ===\n');

// 可以調整各參數
const customResult = calculateCalmIndex(normalInput, {
  zScoreThreshold: 2.0,    // 更高的警示閾值（更不敏感）
  timeDecayFactor: 0.9,    // 更慢的時間衰減
  weights: {
    messageVolume: 0.30,   // 更重視訊息量
    replyLatency: 0.25,    // 更重視回覆速度
    nightActivity: 0.20,
    unreadPileup: 0.15,
    voiceEmotion: 0.10,    // 降低語音權重
  },
});

if (customResult) {
  console.log(`自訂設定平靜指數: ${customResult.score}/100`);
  console.log(`等級: ${customResult.level}`);
}
