<!-- Sync Impact Report
Version change: 0.0.0 → 1.0.0
Added principles: Demo-First, Google-Ecosystem, Algorithm-Core, Privacy-by-Design, Deadline-Driven
Added sections: Technology Constraints, Competition Requirements
Removed sections: none
Templates requiring updates: ⚠ pending (spec, plan, tasks — will align in next steps)
Follow-up TODOs: none
-->

# 摩托斯 MOLTOS Constitution

## Core Principles

### I. Demo-First（展示優先）

所有功能開發以「4/25 決賽能完整展示」為最高優先級。

- 每個功能 MUST 有可見的 UI 回饋，不做「背景執行但看不到結果」的東西
- 開發順序 MUST 依照展示流程排列：Onboarding → OAuth → Dashboard → Chat → Settings
- 無法在截止日前完成的功能，使用靜態假資料呈現 UI，標註為「未來迭代」
- 斷網備案 MUST 準備：預錄操作影片 + 靜態 demo 資料

### II. Google-Ecosystem（Google 生態優先）

所有外部 API 串接優先使用 Google 服務，降低整合複雜度。

- 認證 MUST 統一使用 Google OAuth 2.0（一次授權，多服務存取）
- 信件分析 MUST 使用 Gmail API（read-only scope）
- 資訊摘要 MUST 使用 YouTube Data API v3
- AI 生成 MUST 使用 Gemini API（同一個 Google Cloud 專案）
- 第三方服務（如 Claude API）僅作為 fallback，不作為主要路徑

### III. Algorithm-Core（演算法核心）

平靜指數演算法（moltos-calm-index）是產品的技術核心，MUST 被正確整合。

- 前端展示的所有數值 MUST 來自 `calculateCalmIndex()` 的計算結果
- 演算法參數（基線天數、Z-score 閾值、權重）MUST 可配置，展示時可即時調整
- 資料流：Gmail 原始資料 → 維度萃取 → 演算法計算 → 視覺化呈現
- 至少展示 4 個維度：訊息量、回覆延遲、深夜活躍、未讀堆積

### IV. Privacy-by-Design（隱私優先設計）

處理使用者 Gmail 資料，資安 MUST 作為核心考量（比賽評分項目）。

- Gmail 資料 MUST 只在 server-side 處理，不傳送原始信件內容到前端
- 前端只接收聚合後的統計數據（每日計數、延遲中位數等）
- OAuth token MUST 存在 server-side session，不暴露到 client
- 所有 API key MUST 使用環境變數，不寫死在程式碼中
- 展示時 MUST 能說明資料處理流程與隱私保護機制

### V. Deadline-Driven（時程驅動）

23 天開發期，一人團隊，MUST 嚴格控制範圍。

- 每週有明確的里程碑（W1 骨架、W2 核心功能、W3 AI + 打磨、W4 簡報）
- 新功能需求 MUST 經過「能在剩餘時間內完成嗎？」的檢查才能加入
- 技術選型 MUST 優先考慮「最快能跑起來」而非「最佳實踐」
- 遇到卡關超過 2 小時的問題，MUST 切換為假資料方案繼續推進

## Technology Constraints

| 層級 | 技術 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 全端框架，API Routes 內建，InkGo 專案有經驗 |
| 樣式 | Tailwind CSS + shadcn/ui | 快速建立符合設計稿的 UI |
| 演算法 | @moltos/calm-index (本地 package) | 已開發完成的平靜指數演算法 |
| 認證 | NextAuth.js + Google Provider | 處理 OAuth 2.0 流程 |
| Gmail | googleapis (npm) | 官方 Node.js SDK |
| YouTube | googleapis (npm) | 同上，共用 SDK |
| AI | @google/generative-ai (Gemini) | Google 生態一致性 |
| 部署 | Vercel | 免費額度、秒部署、Edge Functions |
| 語言 | TypeScript | 型別安全，與 calm-index 一致 |

## Competition Requirements

此專案參加 **2026 Best AI Awards 智慧創新大賞**（AI 應用類）。

決賽日期：2026-04-25，台北南港展覽館二館 4F。

評審重點（MUST 在簡報與系統展示中涵蓋）：

1. **系統展示** — 完整的互動 demo，使用者可現場操作
2. **AI 工具使用範圍** — 說明 Gemini 在哪些環節參與（信件分析摘要、關懷建議生成、對話互動）
3. **創新性** — 平靜指數演算法（EWMA + Z-score + Sigmoid + 多維交叉懲罰）的獨特設計
4. **資安考量** — OAuth scope 最小化、server-side 資料處理、不儲存原始信件
5. **AI 程度** — 輔助決策（平靜指數計算）+ 自主行動（主動推送關懷訊息）
6. **AI 輕量化** — Gemini Flash 模型 + 只傳聚合數據而非原始信件

參賽身份：企業組（核流有限公司），不受學生組匿名審查限制，簡報可展示公司品牌。

## Governance

- 此 Constitution 為最高指導原則，所有開發決策 MUST 符合上述原則
- 範圍變更 MUST 經過 Deadline-Driven 原則的時間可行性評估
- 技術選型變更 MUST 有明確理由且不影響展示時程

**Version**: 1.0.0 | **Ratified**: 2026-04-02 | **Last Amended**: 2026-04-02
