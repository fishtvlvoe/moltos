# Tasks: MOLTOS Care Web App

**Input**: Design documents from `/specs/001-care-web-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: TDD — 每個核心邏輯先寫測試、確認 FAIL、再寫實作

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行（不同檔案、無依賴）
- **[Story]**: 所屬 User Story（US1-US5）
- **[TEST]**: 測試任務標記

---

## Phase 1: Setup

**Purpose**: 專案初始化，建立 Next.js + Vitest + Tailwind 骨架

- [ ] T001 初始化 Next.js 15 App Router 專案，執行 `npx create-next-app@latest` 於 `/app`
- [ ] T002 安裝核心依賴：`next-auth googleapis @google/generative-ai`
- [ ] T003 [P] 安裝 Tailwind CSS + shadcn/ui，設定設計稿色系（`#FAF8F4` 背景、`#C67A52` 強調色、IBM Plex Sans 字體）於 `tailwind.config.ts` + `app/globals.css`
- [ ] T004 [P] 安裝 Vitest + 設定 `vitest.config.ts`，確認 `npm test` 可執行
- [ ] T005 [P] 設定 `.env.example`（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL, GEMINI_API_KEY）
- [ ] T006 將 `moltos-calm-index/` 設定為 npm workspace local package，確認 `import { calculateCalmIndex } from '@moltos/calm-index'` 可用
- [ ] T007 [P] 建立 `lib/demo-data.ts` 骨架（空 export，後續填入）
- [ ] T008 [P] 建立 `lib/types.ts`，定義 GmailMetrics / CalmIndexSnapshot / ChatMessage / VideoSummary / DemoData 型別（參考 data-model.md）

**Checkpoint**: `npm run dev` 啟動成功，`npm test` 可執行（0 測試通過）

---

## Phase 2: Foundational（所有 Story 的前置）

**Purpose**: NextAuth Google OAuth + 共用 layout + 底部導航列

### Tests

- [ ] T009 [TEST] 撰寫 `lib/__tests__/auth.test.ts`：測試 NextAuth config 包含正確的 Google scopes（gmail.readonly + youtube.readonly），測試 session callback 正確傳遞 accessToken

### Implementation

- [ ] T010 實作 `lib/auth.ts`：NextAuth 設定，Google Provider + 自訂 scopes + session callback 注入 token — 通過 T009
- [ ] T011 實作 `app/api/auth/[...nextauth]/route.ts`：NextAuth route handler
- [ ] T012 [P] 實作 `app/layout.tsx`：根 layout（SessionProvider、IBM Plex Sans 字體、mobile-first 居中容器 max-w-md）
- [ ] T013 [P] 實作 `components/layout/tab-bar.tsx`：底部導航列（首頁/對話/回顧/設定），對應設計稿
- [ ] T014 [P] 建立 `components/ui/` shadcn/ui 元件：button, card, input, avatar, badge, separator

**Checkpoint**: 可以點 Google 登入 → 重導向回來 → session 有 accessToken，底部導航列可切換頁面

---

## Phase 3: User Story 1 — OAuth 登入與授權 (P1) 🎯 MVP

**Goal**: 使用者從歡迎頁登入 Google，授權後進入 Dashboard

**Independent Test**: 點「開始使用」→ Google OAuth → 進到 Dashboard

### Implementation

- [ ] T015 [US1] 實作 `app/onboarding/page.tsx`：歡迎頁面（logo、三大功能介紹、「開始使用」CTA 按鈕、「已有帳號？登入」連結），對應設計稿 `ciGlQ`
- [ ] T016 [US1] 實作 `app/page.tsx`：根路由 — 已登入導到 `/dashboard`，未登入導到 `/onboarding`
- [ ] T017 [US1] 實作 `app/dashboard/page.tsx` 骨架：顯示使用者名稱 + 問候語（「早安，{name}」），其餘卡片先放 placeholder

**Checkpoint**: 完整流程可走通 — Onboarding → OAuth → Dashboard 顯示名字

---

## Phase 4: User Story 2 — 平靜指數儀表板 (P1) 🎯 核心

**Goal**: 從 Gmail 萃取資料 → 計算平靜指數 → 視覺化呈現

**Independent Test**: 授權 Gmail 後，Dashboard 顯示平靜指數分數與四維度圖表

### Tests

- [ ] T018 [TEST] [P] [US2] 撰寫 `lib/__tests__/gmail.test.ts`：測試 Gmail 元資料轉換為四維度 DataPoint[]（給定模擬的 Gmail message list → 預期的 dailyCounts / replyLatencies / nightActivity / unreadCounts）
- [ ] T019 [TEST] [P] [US2] 撰寫 `lib/__tests__/calm-index-bridge.test.ts`：測試 GmailMetrics → CalmIndexInput 轉換（確認 DataPoint 格式正確），測試 calculateCalmIndex 回傳預期分數範圍
- [ ] T020 [TEST] [P] [US2] 撰寫 `moltos-calm-index/src/__tests__/calm-index.test.ts`：補寫演算法單元測試（正常資料 → calm、異常資料 → attention、資料不足 → null）

### Implementation

- [ ] T021 [US2] 實作 `lib/gmail.ts`：Gmail API 封裝 — `fetchGmailMetrics(accessToken)` 回傳 GmailMetrics，只讀 metadata 不讀 body — 通過 T018
- [ ] T022 [US2] 實作 `lib/calm-index-bridge.ts`：GmailMetrics → CalmIndexInput 轉換 + 呼叫 calculateCalmIndex — 通過 T019
- [ ] T023 [US2] 實作 `app/api/gmail/metrics/route.ts`：API Route，從 session 取 token → 呼叫 gmail.ts → 回傳 GmailMetrics JSON
- [ ] T024 [US2] 實作 `app/api/calm-index/route.ts`：API Route，呼叫 gmail metrics → calm-index-bridge → 回傳 CalmIndexSnapshot JSON
- [ ] T025 [P] [US2] 實作 `components/dashboard/calm-index-card.tsx`：平靜指數卡片（分數圓環、等級標籤、四維度橫條圖），對應設計稿 `9XOPa` 的「健康追蹤」區塊改造
- [ ] T026 [P] [US2] 實作 `components/dashboard/today-progress.tsx`：今日進度卡片（靜態假資料 placeholder）
- [ ] T027 [US2] 整合 `app/dashboard/page.tsx`：加入 calm-index-card + today-progress，從 `/api/calm-index` fetch 資料

**Checkpoint**: Dashboard 顯示真實 Gmail 計算出的平靜指數 + 四維度分析

---

## Phase 5: User Story 3 — AI 對話互動 (P1) 🎯 展示亮點

**Goal**: Chat 頁面串接 Gemini，AI 根據平靜指數脈絡回應

**Independent Test**: 發訊息 → AI 5 秒內回覆 → 回覆有脈絡感

### Tests

- [ ] T028 [TEST] [P] [US3] 撰寫 `lib/__tests__/gemini.test.ts`：測試 system prompt 組裝（給定 CalmIndexSnapshot → 預期 prompt 包含分數和等級），測試 streaming response 解析
- [ ] T029 [TEST] [P] [US3] 撰寫 `lib/__tests__/gemini-prompts.test.ts`：測試四種 prompt template（chat / summary / greeting / insight）都能正確填入變數

### Implementation

- [ ] T030 [US3] 實作 `lib/gemini.ts`：Gemini API 封裝 — `chatStream(message, history, calmContext)` 回傳 ReadableStream + `generateSummary(title, description)` + `generateGreeting(context)` — 通過 T028, T029
- [ ] T031 [US3] 實作 `app/api/chat/route.ts`：POST API Route，接收 message + history → 注入平靜指數 context → Gemini streaming response
- [ ] T032 [P] [US3] 實作 `components/chat/message-bubble.tsx`：訊息氣泡（user 右側深色、assistant 左側淺色 + avatar），對應設計稿 `AZjTx`
- [ ] T033 [P] [US3] 實作 `components/chat/chat-input.tsx`：輸入框（麥克風 icon + 文字輸入 + 送出按鈕），麥克風僅 UI 不接功能
- [ ] T034 [US3] 實作 `components/chat/chat-list.tsx`：訊息列表（auto scroll、streaming 打字機效果）
- [ ] T035 [US3] 實作 `app/chat/page.tsx`：整合 chat-list + chat-input + header，進入頁面時觸發 AI 主動問候

**Checkpoint**: 可以跟 AI 即時對話，AI 會根據平靜指數調整語氣

---

## Phase 6: User Story 4 — YouTube 今日摘要 (P2)

**Goal**: Dashboard 顯示使用者 YouTube 訂閱頻道的新影片 + AI 摘要

**Independent Test**: Dashboard 顯示至少 3 則影片摘要

### Tests

- [ ] T036 [TEST] [US4] 撰寫 `lib/__tests__/youtube.test.ts`：測試 subscriptions → channelId 萃取、playlistItems → VideoSummary 轉換

### Implementation

- [ ] T037 [US4] 實作 `lib/youtube.ts`：YouTube API 封裝 — `fetchLatestVideos(accessToken, limit)` 回傳 VideoSummary[]（含 AI 摘要） — 通過 T036
- [ ] T038 [US4] 實作 `app/api/youtube/feed/route.ts`：API Route，從 session 取 token → youtube.ts → 回傳影片列表 JSON
- [ ] T039 [US4] 實作 `components/dashboard/news-card.tsx`：今日摘要卡片（影片標題 + 頻道名 + 點擊展開 AI 摘要），對應設計稿 `9XOPa`
- [ ] T040 [US4] 整合 `app/dashboard/page.tsx`：加入 news-card，從 `/api/youtube/feed` fetch 資料

**Checkpoint**: Dashboard 顯示真實 YouTube 訂閱影片 + AI 生成摘要

---

## Phase 7: User Story 5 — 設定與 Gmail 管理 (P3)

**Goal**: 設定頁面顯示個人資料、Gmail 連接狀態、管理選項

**Independent Test**: 進入設定 → 看到 Gmail 狀態 → 可操作「重新授權」

### Implementation

- [ ] T041 [P] [US5] 實作 `components/settings/profile-card.tsx`：個人資料卡片（大頭貼 + 姓名 + email），對應設計稿 `flQbm`
- [ ] T042 [P] [US5] 實作 `components/settings/menu-card.tsx`：設定選單（通知設定、提醒排程、Gmail 整合、資訊來源、隱私與資料），大部分只有 UI 不接後端
- [ ] T043 [US5] 實作 `app/settings/page.tsx`：整合 profile-card + menu-card + 登出按鈕
- [ ] T044 [US5] 實作 `components/settings/gmail-status.tsx`：Gmail 連接狀態（已連接/未連接、email、同步頻率、郵件範圍、自動分類 toggle），對應設計稿 `uDKi8`
- [ ] T045 [US5] 實作 `app/settings/gmail/page.tsx`：Gmail 設定子頁面，整合 gmail-status + 重新授權按鈕 + 解除綁定按鈕

**Checkpoint**: 設定頁完整呈現，Gmail 狀態可見

---

## Phase 8: Polish & 斷網備案

**Purpose**: demo data、降級邏輯、視覺打磨

### Tests

- [ ] T046 [TEST] 撰寫 `lib/__tests__/demo-data.test.ts`：測試 demo data 結構符合 DemoData 型別，測試 fallback 邏輯（API 失敗 → 回傳 demo data）

### Implementation

- [ ] T047 填充 `lib/demo-data.ts`：完整的 20 天模擬資料（GmailMetrics + CalmIndexSnapshot + VideoSummary[] + ChatMessage[]） — 通過 T046
- [ ] T048 在所有 API Routes 加入 fallback 邏輯：catch error → 回傳 demo-data + `isStale: true`
- [ ] T049 在所有頁面加入 `?demo=true` query param 支援：強制使用 demo 模式
- [ ] T050 [P] 實作 `components/dashboard/wellness-card.tsx`：健康追蹤卡片（步數/睡眠/飲水，靜態假資料），對應設計稿 `9XOPa`
- [ ] T051 [P] 視覺檢查：所有頁面對照 Pencil 設計稿截圖，修正間距/顏色/字體不一致處
- [ ] T052 部署到 Vercel，設定環境變數，確認 production URL 可存取
- [ ] T053 完整流程走一遍：Onboarding → OAuth → Dashboard（平靜指數 + YouTube）→ Chat → Settings → Gmail Settings
- [ ] T054 斷網測試：關閉網路 → 加 `?demo=true` → 確認所有頁面正常顯示

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──→ Phase 2 (Foundational) ──→ Phase 3 (US1: OAuth)
                                                    │
                                              ┌─────┼─────┐
                                              ▼     ▼     ▼
                                          Phase 4  Phase 5  Phase 7
                                          (US2)    (US3)    (US5)
                                            │        │
                                            ▼        │
                                          Phase 6    │
                                          (US4)      │
                                            │        │
                                            └────┬───┘
                                                 ▼
                                             Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (OAuth)**: 無依賴 — 所有其他 Story 的前置
- **US2 (平靜指數)**: 依賴 US1（需要 OAuth token）
- **US3 (AI 對話)**: 依賴 US1（需要 session），最好在 US2 之後（可帶入平靜指數 context）
- **US4 (YouTube)**: 依賴 US1（需要 OAuth token），依賴 US3 的 gemini.ts（摘要生成）
- **US5 (設定)**: 依賴 US1（需要 session），其餘獨立

### TDD 流程（每個 Phase 內）

```
寫測試 → 確認 FAIL（紅燈）→ 寫實作 → 確認 PASS（綠燈）→ 重構（如需要）
```

## Implementation Strategy

### MVP（最小可展示）

1. Phase 1 + 2 → 骨架就緒
2. Phase 3 (US1) → 能登入
3. Phase 4 (US2) → 能看到平靜指數 ← **到這裡就有東西可以 demo**

### 完整 Demo

4. Phase 5 (US3) → AI 對話
5. Phase 6 (US4) → YouTube 摘要
6. Phase 7 (US5) → 設定頁
7. Phase 8 → 斷網備案 + 部署

## Summary

| 指標 | 數量 |
|------|------|
| 總任務數 | 54 |
| Phase 數 | 8 |
| 測試任務 | 9（T009, T018-T020, T028-T029, T036, T046 + 演算法） |
| 可平行任務 | 18 |
| MVP 最少任務 | ~27（Phase 1-4） |
