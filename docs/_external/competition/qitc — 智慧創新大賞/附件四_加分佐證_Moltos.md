# 附件四：加分佐證文件

**作品名稱**：Moltos — 主動式心理健康守護 AI
**申請單位**：核流有限公司（統編 83287091）
**負責人**：余啓彰

---

## 一、開源平台登錄（GitHub）

### 專案資訊

| 項目 | 內容 |
|------|------|
| Repository 名稱 | Moltos Calm Index Framework |
| 網址 | https://github.com/fishtvlvoe/moltos |
| 授權 | MIT License |
| 程式語言 | TypeScript（100%） |
| 核心功能 | 平靜指數演算法核心框架 |

### 開源內容說明

Moltos 將核心的**平靜指數演算法（Calm Index Algorithm）**以 MIT License 開源，包含：

1. **平靜指數計算引擎**（`calm-index.ts`）— 五維綜合評分演算法
2. **個人基線建立**（`baseline.ts`）— 14 天指數加權移動平均（EWMA）
3. **異常偏離偵測**（`anomaly.ts`）— Z-score 異常偵測 + Sigmoid 轉換
4. **語音情緒分析介面**（`voice-emotion.ts`）— 雙通道（文字+語音）交叉驗證
5. **完整型別定義**（`types.ts`）— 嚴格 TypeScript 型別系統
6. **使用範例**（`examples/`）— 基本使用範例程式碼

### 開源目的

促進心理健康 AI 領域的技術交流。我們相信，心理健康監測的核心演算法應該是透明的、可驗證的、可被審視的。

---

## 二、AI 輕量化策略

### 多模型智慧路由（Multi-Model Smart Routing）

Moltos 採用分層 AI 策略，根據任務複雜度動態選擇模型：

| 場景 | 佔比 | 模型 | 單次成本 |
|------|------|------|----------|
| 日常 check-in、摘要整理 | 80% | Gemini Flash / GPT-4o mini | ~$0.0003 |
| 深度情緒對話、危機回應 | 20% | GPT-4o | ~$0.003 |
| 平靜指數計算 | 100% | 本地輕量演算法 | $0 |

### 成本效益

| 指標 | 數值 |
|------|------|
| 每用戶每月 AI 成本 | **$0.24** |
| 對比 ChatGPT Plus（$20/月） | 低 **83 倍** |
| 對比全用 GPT-4o 方案 | 低 **19 倍** |
| 平靜指數雲端 API 成本 | **$0**（本地計算） |

### 輕量化 ≠ 低品質

- 危機回應（自傷/自殺偵測）一律使用最強模型
- 深度情緒對話自動升級至 GPT-4o
- 平靜指數在裝置端本地計算，零延遲、零雲端成本

詳細技術說明請見附件：`AI輕量化佐證說明.md`

---

## 三、Crunchbase 登錄

| 項目 | 內容 |
|------|------|
| 公司名稱 | 核流有限公司 (NiCoreFlow Co., Ltd.) |
| 網址 | https://www.crunchbase.com/organization/nicoreflow |
| 產品 | Moltos — 主動式心理健康守護 AI |
| 分類 | Artificial Intelligence / Mental Health / SaaS |
| 階段 | Pre-Seed |
| 成立 | 2020 年 |

---

## 四、LinkedIn 團隊成員

| 項目 | 內容 |
|------|------|
| 姓名 | 余啓彰（fishtv 老魚） |
| 職稱 | 核流有限公司 創辦人 |
| LinkedIn | https://www.linkedin.com/in/fishtvlove/ |
| 經歷 | 5+ 年獨立開發經驗，產品橫跨 ERP 系統、金流整合、LINE Bot 開發 |

（LinkedIn 頁面截圖請見附件）
