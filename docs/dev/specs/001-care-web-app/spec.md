# Feature Specification: MOLTOS Care Web App

**Feature Branch**: `001-care-web-app`
**Created**: 2026-04-02
**Status**: Draft
**Input**: 建立 MOLTOS 互動式照護網頁應用，串接 Gmail + YouTube API + Gemini，在 4/25 Best AI Awards 決賽展示完整 demo

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 首次登入與授權（Priority: P1）

使用者第一次進入 MOLTOS 網頁，看到歡迎頁面介紹三大功能（主動關心、資訊管家、每日回顧），點擊「開始使用」後透過 Google 帳號登入，一次授權即可存取 Gmail 和 YouTube 資料。

**Why this priority**: 沒有登入授權，後續所有功能都無法運作。這是整個 demo 流程的起點。

**Independent Test**: 使用者可以點擊「開始使用」→ 完成 Google OAuth → 看到 Dashboard，即驗證此流程成功。

**Acceptance Scenarios**:

1. **Given** 使用者首次造訪網頁，**When** 點擊「開始使用」，**Then** 導向 Google OAuth 授權畫面，scope 包含 Gmail read-only 和 YouTube read-only
2. **Given** 使用者完成 Google 授權，**When** 重新導向回網頁，**Then** 進入 Dashboard 頁面，顯示個人化問候語
3. **Given** 使用者拒絕授權，**When** 取消 OAuth 流程，**Then** 回到歡迎頁面並顯示提示訊息

---

### User Story 2 — 平靜指數儀表板（Priority: P1）

使用者登入後在 Dashboard 看到自己的平靜指數分數、各維度分析、以及趨勢圖表。系統從 Gmail 資料中萃取四大維度（訊息量、回覆延遲、深夜活躍、未讀堆積），透過平靜指數演算法計算出 0-100 分數。

**Why this priority**: 平靜指數是產品的技術核心，也是比賽評審最關注的 AI 創新點。

**Independent Test**: 授權 Gmail 後，Dashboard 顯示平靜指數分數與四個維度的視覺化圖表。

**Acceptance Scenarios**:

1. **Given** 使用者已授權 Gmail，**When** 進入 Dashboard，**Then** 系統讀取近 20 天的 Gmail 資料並計算平靜指數
2. **Given** 計算完成，**When** Dashboard 載入，**Then** 顯示綜合平靜指數（0-100）、等級標籤（calm/mild/moderate/attention）、四維度分數
3. **Given** Gmail 資料不足 14 天，**When** 計算基線，**Then** 以現有資料計算並標註「資料累積中，分析精度將隨時間提升」
4. **Given** 有維度觸發警示，**When** Dashboard 顯示結果，**Then** 以視覺提示（顏色、圖示）標記異常維度

---

### User Story 3 — AI 對話互動（Priority: P1）

使用者在 Chat 頁面與 Care AI 對話。AI 會根據使用者的平靜指數結果主動關心、提供建議。使用者可以自由聊天，AI 理解使用者的 Gmail 行為脈絡並給出個人化回應。

**Why this priority**: 聊天互動是比賽現場最直覺的展示方式，評審可以即時體驗 AI 的回應品質。

**Independent Test**: 使用者發送訊息後，AI 在 5 秒內回覆具有脈絡感的個人化回應。

**Acceptance Scenarios**:

1. **Given** 使用者進入 Chat 頁面，**When** 頁面載入，**Then** AI 根據當前時間和平靜指數狀態，發送一則主動問候訊息
2. **Given** 使用者輸入訊息，**When** 按下送出，**Then** AI 在 5 秒內回覆，回覆內容應參考使用者的平靜指數脈絡
3. **Given** 使用者平靜指數為 attention 等級，**When** AI 回應，**Then** 語氣更加溫柔關心，並建議可能的舒壓方式
4. **Given** AI 偵測到 YouTube 追蹤頻道有新影片，**When** 在對話中，**Then** 主動提及並提供摘要選項

---

### User Story 4 — 今日資訊摘要（Priority: P2）

Dashboard 的「今日摘要」區塊顯示使用者訂閱的 YouTube 頻道最新影片摘要。系統透過 YouTube Data API 抓取使用者訂閱頻道的最新影片，由 AI 生成簡短摘要。

**Why this priority**: 展示 MOLTOS 不只是心理健康工具，也是「資訊管家」，對應 Editor 角色。

**Independent Test**: Dashboard 顯示至少 3 則來自使用者 YouTube 訂閱的最新影片摘要。

**Acceptance Scenarios**:

1. **Given** 使用者已授權 YouTube，**When** Dashboard 載入，**Then** 顯示使用者訂閱頻道最近 24 小時內的新影片列表
2. **Given** 有新影片，**When** 點擊影片摘要，**Then** 展開 AI 生成的摘要（2-3 句話概述內容重點）
3. **Given** 訂閱頻道在 24 小時內沒有新影片，**When** Dashboard 載入，**Then** 顯示「今天沒有新影片，你訂閱的頻道都還在休息」

---

### User Story 5 — 設定與 Gmail 管理（Priority: P3）

使用者在設定頁面管理個人檔案、查看 Gmail 連接狀態、調整同步頻率和郵件範圍。可以重新授權或解除 Gmail 綁定。

**Why this priority**: 設定頁面展示產品的完整度與使用者控制權，但不是核心展示流程。

**Independent Test**: 使用者可以進入設定頁面，看到 Gmail 連接狀態，並能操作「重新授權」。

**Acceptance Scenarios**:

1. **Given** 使用者進入設定頁面，**When** 頁面載入，**Then** 顯示個人資料（姓名、email）、Gmail 連接狀態
2. **Given** Gmail 已連接，**When** 進入 Gmail 設定子頁面，**Then** 顯示同步頻率、郵件範圍、自動分類開關
3. **Given** 使用者點擊「解除綁定」，**When** 確認操作，**Then** 撤銷 Gmail 授權，Dashboard 不再顯示平靜指數

---

### Edge Cases

- Gmail API 額度用盡或暫時不可用時，Dashboard 應顯示快取的最近一次計算結果
- Google OAuth token 過期時，應自動嘗試 refresh；若 refresh 失敗，引導使用者重新授權
- 使用者 Gmail 幾乎沒有信件（新帳號）時，應顯示友善提示而非空白畫面
- Gemini API 回應超時時，Chat 應顯示「AI 正在思考中…」並設定 15 秒超時後提示重試
- 比賽現場網路不穩時，系統應能以預載入的資料運作（斷網備案）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 支援 Google OAuth 2.0 登入，一次授權取得 Gmail read-only 和 YouTube read-only scope
- **FR-002**: 系統 MUST 從 Gmail API 讀取使用者近 20 天的信件元資料（時間戳記、已讀/未讀狀態），不讀取信件內容
- **FR-003**: 系統 MUST 從 Gmail 元資料中萃取四大維度：每日收發量、回覆延遲、深夜活躍度（23:00-05:00）、未讀堆積數
- **FR-004**: 系統 MUST 使用 moltos-calm-index 演算法計算綜合平靜指數（0-100）與各維度分數
- **FR-005**: 系統 MUST 在 Dashboard 視覺化呈現平靜指數分數、等級、各維度圖表
- **FR-006**: 系統 MUST 提供 Chat 介面，使用者可與 AI 即時對話
- **FR-007**: AI 回應 MUST 透過 Gemini API 生成，且參考使用者的平靜指數脈絡
- **FR-008**: 系統 MUST 從 YouTube Data API 抓取使用者訂閱頻道的最新影片
- **FR-009**: 系統 MUST 透過 AI 為 YouTube 影片生成簡短摘要
- **FR-010**: 系統 MUST 提供設定頁面，顯示 Gmail 連接狀態並支援重新授權/解除綁定
- **FR-011**: 所有 Gmail 資料處理 MUST 在 server-side 完成，前端只接收聚合後的統計數據
- **FR-012**: 系統 MUST 提供斷網備案模式，以預載入的靜態資料運作

### Key Entities

- **User**: 使用者帳號，關聯 Google OAuth token、偏好設定
- **CalmIndexSnapshot**: 平靜指數計算結果快照，包含分數、等級、各維度分數、計算時間
- **GmailMetrics**: 從 Gmail 萃取的四維度聚合數據（每日計數），不含信件原始內容
- **ChatMessage**: 使用者與 AI 的對話訊息，包含角色（user/assistant）、內容、時間戳記
- **VideoSummary**: YouTube 影片摘要，包含影片標題、頻道名、AI 生成摘要、發布時間

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者從開啟網頁到看到平靜指數，整個流程可在 3 分鐘內完成（含 OAuth 授權）
- **SC-002**: AI 對話回應時間在 5 秒以內
- **SC-003**: 平靜指數計算結果與 moltos-calm-index 演算法的單元測試結果一致
- **SC-004**: 比賽評審可在 6 分鐘內完整走過：登入 → 看到平靜指數 → 與 AI 對話 → 查看資訊摘要 的完整流程
- **SC-005**: 斷網備案模式下，所有頁面可正常顯示（使用預載資料）
- **SC-006**: 展示畫面符合 Pencil 設計稿的視覺風格（奶油白背景、赤陶色強調色、IBM Plex Sans 字體）

## Assumptions

- 使用者有 Google 帳號且 Gmail 中有足夠的信件歷史（至少 7 天）供分析
- Google Cloud 專案已開通 Gmail API、YouTube Data API v3、OAuth consent screen
- Gemini API 的免費額度足夠比賽展示使用（Gemini 2.0 Flash 免費層）
- 比賽現場有可用的網路（但需準備斷網備案）
- 部署在 Vercel 上，demo 網址可直接存取
- 健康追蹤區塊（步數、睡眠、飲水）使用靜態假資料展示，標註為「未來迭代」
- 語音輸入功能暫不實作，僅保留 UI 圖示作為未來規劃展示
