# Moltos Calm Index

> 把生活的噪音，變成你內心的聲音。
> *Turn life's noise into your inner voice.*

**平靜指數演算法核心框架** — 透過行為模式分析，以正面框架量化個人心理平靜程度。

*Core algorithm framework for personal mental wellness monitoring through behavioral pattern analysis.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)

---

## 核心理念 | Core Philosophy

平靜指數的設計基於三個原則：

1. **正面框架** — 顯示「你有多平靜」而非「你有多焦慮」（100 = 平靜，0 = 需要關注）
2. **只跟自己比** — 每個人的基線都不同，所有分析都基於個人 14 天滾動歷史
3. **持續性偵測** — 過濾單日波動，聚焦真正的趨勢改變

*The Calm Index is built on three principles: positive framing (measuring calmness, not anxiety), personal baselines (comparing only to yourself), and persistence detection (filtering daily noise to focus on real trend changes).*

---

## 安裝 | Installation

```bash
npm install @moltos/calm-index
```

---

## 快速開始 | Quick Start

```typescript
import { calculateCalmIndex } from '@moltos/calm-index';

const result = calculateCalmIndex({
  messageVolume: {
    dailyCounts: last20DaysMessageCounts,
  },
  replyLatency: {
    latencies: last20DaysReplyLatencies,
  },
  nightActivity: {
    nightMinutes: last20DaysNightActivity,
  },
  unreadPileup: {
    unreadCounts: last20DaysUnreadCounts,
  },
});

if (result) {
  console.log(`平靜指數: ${result.score}/100`);
  console.log(`等級: ${result.level}`); // 'calm' | 'mild' | 'moderate' | 'attention'

  // 查看各維度細節
  result.dimensions.forEach(d => {
    console.log(`${d.dimension}: ${d.score} (Z=${d.zScore.toFixed(2)})`);
  });

  // 查看警示
  result.alerts.forEach(a => {
    console.log(`[${a.severity}] ${a.message}`);
  });
}
```

---

## 五大輸入維度 | Five Input Dimensions

| 維度 | 說明 | 異常指標 |
|------|------|----------|
| **訊息量趨勢** Message Volume | 與個人 14 天滾動基線比較 | 偏離超過 1.5 個標準差 |
| **回覆速度變化** Reply Latency | 回覆延遲的趨勢分析 | 延遲持續拉長 = 處理能力下降 |
| **深夜活躍度** Night Activity | 23:00-05:00 活躍度 | 異常上升 = 失眠或過勞 |
| **未讀堆積趨勢** Unread Pileup | 未讀訊息數量趨勢 | 持續攀升且不回落 = 逃避或癱瘓 |
| **語音情緒特徵** Voice Emotion | 語速、音調、停頓、音量 | 語速加快 + 音調升高 + 停頓增多 = 焦慮 |

不是所有維度都必須提供資料。框架會自動根據可用維度重新分配權重。

*Not all dimensions are required. The framework automatically redistributes weights based on available data.*

---

## API 文件 | API Reference

### `calculateCalmIndex(input, config?)`

計算綜合平靜指數。

**參數：**

```typescript
interface CalmIndexInput {
  messageVolume?: { dailyCounts: DataPoint[] };
  replyLatency?: { latencies: DataPoint[] };
  nightActivity?: { nightMinutes: DataPoint[] };
  unreadPileup?: { unreadCounts: DataPoint[] };
  voiceEmotion?: VoiceEmotionResult;
  currentTime?: number;
}
```

**回傳：**

```typescript
interface CalmIndexResult {
  score: number;          // 0-100 綜合平靜指數
  level: CalmLevel;       // 'calm' | 'mild' | 'moderate' | 'attention'
  dimensions: DimensionScore[];  // 各維度詳細分數
  calculatedAt: number;   // 計算時間戳記
  alerts: Alert[];        // 觸發的警示列表
}
```

### `buildBaseline(dataPoints, days?, decayFactor?)`

建立個人基線（指數加權 14 天滾動平均）。

```typescript
const baseline = buildBaseline(dailyData, 14, 0.85);
// baseline.mean     → 加權平均值
// baseline.stdDev   → 加權標準差
// baseline.sampleCount → 樣本數
```

### `analyzeVoiceEmotion(features, baselines)`

分析語音情緒特徵，回傳焦慮分數。

```typescript
const result = analyzeVoiceEmotion(
  { speechRate: 230, fundamentalFrequency: 260, pauseRatio: 0.28, volumeVariability: 0.35 },
  voiceBaselines
);
// result.anxietyScore → 0-100 焦慮分數
// result.confidence   → 0-1 信心度
```

### `calculateZScore(value, baseline)`

計算單一數值相對於基線的 Z-score。

### `detectConsecutiveAnomalies(recentData, baseline, threshold?)`

偵測連續異常天數。

---

## 演算法說明 | Algorithm Details

### 個人基線（Exponential Weighted Moving Average）

使用指數加權移動平均建立個人基線，近期資料權重高於遠期：

```
權重 = alpha^(n-i)，其中 i = 時間索引（0 = 最舊）
alpha = 0.85（預設），代表 7 天前的資料權重約為最新資料的 32%
```

### Z-score 異常偵測

```
Z-score = (觀測值 - 加權平均) / 加權標準差
```

- |Z| < 1.5 → 正常波動範圍
- |Z| >= 1.5 → 觸發警示
- |Z| >= 2.5 或連續 >= 5 天 → 嚴重警示

### 平靜分數轉換（Sigmoid Decay）

Z-score 透過反向 Sigmoid 函數轉換為 0-100 分數：

```
score = 100 / (1 + e^(k * (|Z| - midpoint)))
```

在閾值附近產生明顯轉折，避免分數在正常範圍內波動過大。

### 多維度交叉懲罰

當 3 個以上維度同時異常時，額外扣分：

```
交叉懲罰 = (異常維度數 - 2) * 5
```

---

## 自訂設定 | Custom Configuration

```typescript
const result = calculateCalmIndex(input, {
  baselineDays: 14,        // 基線天數
  zScoreThreshold: 1.5,    // Z-score 警示閾值
  timeDecayFactor: 0.85,   // 時間衰減係數
  nightStartHour: 23,      // 深夜起始
  nightEndHour: 5,         // 深夜結束
  weights: {               // 各維度權重（總和建議為 1）
    messageVolume: 0.20,
    replyLatency: 0.20,
    nightActivity: 0.20,
    unreadPileup: 0.20,
    voiceEmotion: 0.20,
  },
});
```

---

## 型別定義 | Type Definitions

所有型別定義匯出自 `@moltos/calm-index`，包含：

- `DataPoint` — 帶時間戳記的數值資料點
- `Baseline` — 個人基線（平均值、標準差、樣本數）
- `CalmIndexResult` — 平靜指數計算結果
- `DimensionScore` — 單一維度分析結果
- `Alert` — 警示資訊
- `VoiceFeatures` — 語音聲學特徵
- `VoiceEmotionResult` — 語音情緒分析結果
- `CalmIndexConfig` — 計算設定

完整型別定義請參考 [`src/types.ts`](src/types.ts)。

---

## 開發 | Development

```bash
# 安裝依賴
npm install

# 編譯 TypeScript
npm run build

# 監聽模式開發
npm run dev
```

---

## 授權 | License

[MIT License](LICENSE) - 2026 核流有限公司 (Moltos Inc.)

**[moltos.net](https://moltos.net)**
