# Research: MOLTOS Care Web App

**Date**: 2026-04-02
**Status**: Complete

## R1: Google OAuth — 多 scope 一次授權

**Decision**: 使用 NextAuth.js Google Provider，在 OAuth 請求中同時要求 Gmail 和 YouTube 的 read-only scope。

**Rationale**:
- Google OAuth 支援在單一授權流程中請求多個 scope
- 使用者只需點一次「允許」，不需分別授權
- NextAuth.js 是 Next.js 生態最成熟的認證套件，支援自訂 scope

**Scopes required**:
- `https://www.googleapis.com/auth/gmail.readonly` — 讀取信件元資料
- `https://www.googleapis.com/auth/youtube.readonly` — 讀取訂閱與影片
- `openid email profile` — 基本使用者資料

**Alternatives considered**:
- 手刻 OAuth flow → 不必要，NextAuth.js 已封裝好
- 分兩次授權（先 Gmail 後 YouTube）→ 使用者體驗差，一次搞定

## R2: Gmail API — 元資料萃取策略

**Decision**: 使用 `users.messages.list` + `users.messages.get`（format: metadata），只讀 headers 不讀 body。

**Rationale**:
- 只需要 `Date`, `From`, `To`, `Subject` headers 來萃取維度數據
- `format: metadata` 比 `full` 快且省額度
- 不讀信件內容 = 最小權限原則 + 比賽資安加分

**萃取邏輯**:

| 維度 | Gmail 資料來源 | 計算方式 |
|------|---------------|---------|
| 訊息量 | `messages.list` 每日筆數 | 以 `internalDate` 按天分組計數 |
| 回覆延遲 | 比對同 thread 的收發時間差 | `threadId` 分組，計算 reply interval |
| 深夜活躍 | 23:00-05:00 發送的信件 | `internalDate` 篩選時間區間 |
| 未讀堆積 | `UNREAD` label 的信件數 | `messages.list(labelIds: ['UNREAD'])` 每日快照 |

**API 額度**:
- Gmail API 免費額度：每日 1,000,000,000 quota units
- `messages.list` = 5 units/request，`messages.get(metadata)` = 5 units/request
- 20 天資料 ≈ 2000 封信 → 10,050 units → 遠低於上限

**Alternatives considered**:
- 讀取信件 body 做 NLP 情緒分析 → 隱私風險太高，比賽資安扣分
- 使用 Gmail IMAP → 比 REST API 複雜，OAuth 整合不便

## R3: YouTube Data API — 訂閱頻道新影片

**Decision**: 使用 `subscriptions.list` 取得訂閱清單 → `search.list` 或 `playlistItems.list` 取得各頻道新影片。

**Rationale**:
- `subscriptions.list` 可取得使用者所有訂閱頻道
- 每個頻道的 uploads playlist 可用 `playlistItems.list` 取得最新影片（比 `search.list` 省額度）
- 額度：每日 10,000 units，`subscriptions.list` = 1 unit，`playlistItems.list` = 1 unit

**AI 摘要生成**:
- 將影片 title + description 餵給 Gemini Flash
- Prompt：「請用繁體中文，用 2-3 句話摘要這部影片的重點內容」
- 不需要轉錄影片（太慢、太貴），title + description 已足夠

**Alternatives considered**:
- 用 RSS feed 取代 API → 不需要 OAuth 但無法取得使用者個人訂閱
- 轉錄影片音訊做摘要 → Whisper API 成本高且延遲長，比賽場景不適合

## R4: Gemini API — 對話與摘要

**Decision**: 使用 Gemini 2.0 Flash (`gemini-2.0-flash`) 作為主要 AI 模型。

**Rationale**:
- 免費額度：每分鐘 15 requests、每日 1,500 requests → 足夠比賽展示
- 速度快（Flash 版本），回應時間 < 3 秒
- 與 Google 生態一致（OAuth、Gmail、YouTube 都是 Google）

**使用場景**:

| 場景 | System Prompt 策略 |
|------|-------------------|
| 對話回覆 | 注入使用者平靜指數 + 等級 + 異常維度作為 context |
| YouTube 摘要 | 固定 prompt：影片 title+description → 2-3 句摘要 |
| 主動問候 | 根據時間 + 平靜指數等級，生成個人化問候語 |

**Streaming**: 使用 `generateContentStream` 實現打字機效果，提升對話體驗。

**Alternatives considered**:
- Claude API → 品質好但跟 Google 生態不搭，且要額外管理 API key
- GPT-4o mini → 便宜但多一個供應商，增加複雜度

## R5: 斷網備案策略

**Decision**: 在 `lib/demo-data.ts` 預載一組完整的靜態資料，當 API 失敗時自動 fallback。

**Rationale**:
- 比賽通知明確提醒「請準備網路無法通暢時的備案」
- 預載資料 = 一個真實使用者的 20 天 Gmail 模擬數據 + 平靜指數計算結果 + 預生成的 AI 對話

**Fallback 層級**:
1. 正常模式：即時呼叫 Gmail/YouTube/Gemini API
2. 降級模式：API 超時 → 顯示最近一次快取的計算結果
3. 離線模式：完全斷網 → 使用 demo-data.ts 的靜態資料

**Alternatives considered**:
- 預錄操作影片 → 仍需準備，但作為最後手段而非主要備案
- 本地 LLM → 裝置限制，MacBook 跑 local model 太慢

## R6: 無資料庫策略

**Decision**: MVP 不使用資料庫，所有狀態存在 server-side session（NextAuth session）+ 記憶體快取。

**Rationale**:
- 比賽 demo 只需支援單一使用者
- 省去資料庫設定、migration、部署的複雜度
- 平靜指數計算結果快取在記憶體中，重新整理頁面時重新計算
- Chat 歷史存在前端 state（重新整理會清空，但比賽展示時不是問題）

**Alternatives considered**:
- Vercel KV (Redis) → 需要額外設定，MVP 不需要
- SQLite → 在 Vercel serverless 環境有限制
- PostgreSQL → 殺雞用牛刀
