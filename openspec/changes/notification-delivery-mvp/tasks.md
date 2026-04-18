## 1. 環境準備

- [x] 1.1 [Tool: codex] 確認 Vercel 方案（Hobby vs Pro）決定 cron schedule — **結論：Hobby 方案，採用 `0 1,12 * * *`（UTC = TPE 09:00 / 20:00 每日兩次）**。Decision 3「當下小時匹配」退化為「time 欄位的小時為 9 或 20 才發」。
- [x] 1.2 [Tool: codex] 查 toSend 官方文件確認 API 用法 — **結論：REST endpoint `POST https://api.tosend.com/v2/emails`，header `Authorization: Bearer <key>`，payload `{ from: {email, name}, to: [{email}], subject, html }`，response 含 `message_id`。Node SDK 名為 `tosend` 但本 change 採用原生 fetch 避免外部依賴。**
- [x] 1.3 [Tool: codex] ~~安裝 toSend Node SDK~~ — **跳過，改用原生 fetch + REST（lib/email/tosend.ts 內部實作）**。
- [x] 1.4 [Tool: codex] 於本機 `.env.local` 加入 `TOSEND_API_KEY`（空值待用戶貼入）、`TOSEND_FROM_EMAIL`、`TOSEND_FROM_NAME`、`CRON_SECRET`（已用 `openssl rand -hex 32` 生成）。Vercel Production 環境變數延到 Task 12.1 處理。

## 2. 資料庫 Migration — Database schema provides a notifications table

- [x] 2.1 [P] [Tool: codex] 實作「Database schema provides a notifications table」：新增 `supabase/migrations/20260418200938_add_notifications_table.sql`，建立 `notifications` 表含 id / user_id / type / title / body / sent_via / read_at / created_at 欄位 + RLS policies，實作 Decision 6: notifications 資料表結構
- [x] 2.2 [P] [Tool: codex] 於同一 migration 建立 `idx_notifications_user_unread` 索引（`user_id, created_at DESC WHERE read_at IS NULL`）
- [x] 2.3 [P] [Tool: codex] 於同一 migration 建立冪等去重索引（`user_id, type, DATE(created_at AT TIME ZONE 'Asia/Taipei')`），支援 Decision 4: 冪等性機制 — notifications 表作為去重基準
- [ ] 2.4 [Tool: codex] 本機執行 `supabase db push` 套用 migration 並驗證 `notifications` 表與索引存在 — **延後到 Task 10.1 與部署一起執行**（無本機 Supabase，直接 push 遠端 = 部署動作）

## 3. Email 模組 TDD — System provides Email delivery capability via toSend

- [x] 3.1 [Tool: copilot-codex] 為 `lib/email/tosend.ts` 撰寫失敗測試（`__tests__/lib/email/tosend.test.ts`），採用 vitest `vi` API（非 jest）；涵蓋 4 個 scenario：成功 + messageId、non-2xx 失敗、fetch 網路錯誤、缺 API key → 紅燈確認
- [x] 3.2 [Tool: copilot-codex] 實作 `lib/email/tosend.ts` 的 `sendEmail({ to, subject, html, text })`，原生 fetch + REST、Bearer auth、永不 throw
- [x] 3.3 [Tool: codex] 跑 `npx vitest run __tests__/lib/email/tosend.test.ts` 確認綠燈（4/4 passed）

## 4. 通知分派器 TDD — System provides a notification dispatcher for reminder delivery

- [x] 4.1 [Tool: copilot-codex] 撰寫 `__tests__/lib/notifications/dispatcher.test.ts` 紅燈測試：4 個 scenario（email+in_app、email 失敗降級 in_app_only、already_sent_today 跳過、user 無 email）
- [x] 4.2 [Tool: copilot-codex] 實作 `lib/notifications/dispatcher.ts` 的 `dispatchReminder(user, type)`：先查冪等（Asia/Taipei 日界）→ 寫 notifications(sent_via='in_app_only') → 有 email 則 `sendEmail` → 成功升級為 `email+in_app`。Decision 4 + 5 實作就位
- [x] 4.3 [Tool: codex] 跑 `npx vitest run __tests__/lib/notifications/dispatcher.test.ts` 確認綠燈（4/4 passed）

## 5. Cron Endpoint TDD — System exposes a protected Cron endpoint for reminder dispatch

- [x] 5.1 [Tool: copilot-codex] 撰寫 `__tests__/app/api/cron/send-reminders.test.ts`：401（無 header）、401（錯誤 token）、200（正常派發）、單一用戶 throw 不中斷 batch 共 4 scenario
- [x] 5.2 [Tool: copilot-codex] 實作 `app/api/cron/send-reminders/route.ts`：Bearer CRON_SECRET 驗證、`reminder_schedule->>enabled = 'true'` 初篩、JS 層 hour/frequency 二次過濾、每用戶獨立 try/catch 呼叫 dispatcher、回傳 `{ total, sent, skipped, failed, errors }`
- [x] 5.3 [Tool: copilot-codex] frequency 判定已實作：daily 每日 / weekly 僅週一（TPE UTCDay=1） / monthly 僅每月 1 號
- [x] 5.4 [Tool: codex] 跑 `npx vitest run __tests__/app/api/cron/send-reminders.test.ts` 確認綠燈（4/4 passed）

## 6. Reminder content uses a fixed template for MVP

- [x] 6.1 [Tool: copilot-gen] 實作 `lib/notifications/templates.ts` 的 `buildCalmReminderTemplate()`：subject、title、body（純文字）、html（Email HTML）
- [x] 6.2 [Tool: copilot-gen] dispatcher 的 reminder 流程已引用 `buildCalmReminderTemplate()`，body 同時用於 notifications.body 與 Email text

## 7. Vercel Cron schedule triggers the reminder endpoint hourly

- [x] 7.1 [Tool: codex] `vercel.json` 加入 `crons: [{ path: "/api/cron/send-reminders", schedule: "0 1,12 * * *" }]`，UTC `1,12` = TPE `09:00` / `20:00`
- [x] 7.2 [Tool: codex] JSON 格式經 `node -e` 驗證通過；`npm run build` 完整通過（新增 4 條 route：`/api/cron/send-reminders`、`/api/notifications`、`/api/notifications/[id]/read`、`/notifications`）

## 8. 站內通知 API — API returns a user's notifications + API marks a notification as read

- [x] 8.1 [Tool: copilot-codex] 撰寫 `__tests__/app/api/notifications/list.test.ts`：401、列表 200、count_only 200 + `{ count }` 三 scenario
- [x] 8.2 [Tool: copilot-codex] 實作 `app/api/notifications/route.ts`：next-auth session → 查 user_id → 依 query params 回傳 list 或 count
- [x] 8.3 [Tool: copilot-codex] 撰寫 `__tests__/app/api/notifications/read.test.ts`：401、404（他人通知）、標記成功、冪等 4 scenario
- [x] 8.4 [Tool: copilot-codex] 實作 `app/api/notifications/[id]/read/route.ts`：驗證擁有者、`read_at = NOW()`、已讀請求仍 200（冪等）

## 9. 站內通知前端 — Notification list page displays user notifications + Header shows unread notification badge

- [x] 9.1 [P] [Tool: cursor] 建立 `components/notification-badge.tsx`：鈴鐺 SVG + 紅點、fixed top-right、60 秒輪詢 `/api/notifications?unread=true&count_only=true`、99+ 上限顯示。因專案無 Header 採浮動式設計（不破壞現有 TabBar layout）
- [x] 9.2 [P] [Tool: cursor] 於 `app/(app)/layout.tsx` 掛上 `<NotificationBadge />`，排在 `<TabBar />` 之前
- [x] 9.3 [P] [Tool: cursor] 建立 `app/(app)/notifications/page.tsx`：`use client`、fetch list、未讀左側橘色條 + 粗體、點擊樂觀更新並 POST read API、空狀態與錯誤狀態處理

## 10. E2E 驗證 — 部署步驟 + 回滾策略 演練

- [ ] 10.1 [Tool: codex] 依 design.md 部署步驟第 1-4 步：套 migration、安裝 SDK、設 env var、於本機完成前置；本機設定測試用戶 `reminder_schedule = { enabled: true, time: '<下一個整點+5>', frequency: 'daily', types: ['calm_index'] }`，以 curl 帶 `Authorization: Bearer $CRON_SECRET` 呼叫 `/api/cron/send-reminders` 驗證 Email 送達、notifications 表有新紀錄
- [ ] 10.2 [Tool: codex] 依 design.md 部署步驟第 5 步：於 Preview 部署驗證 Vercel Cron Logs 顯示 endpoint 被呼叫、`vercel.json` cron 生效
- [ ] 10.3 [Tool: codex] 驗證 Risks 中「冪等去重用 DATE() 的時區問題」— 以兩次呼叫測試同用戶同日只收到一封 Email；若失敗依 design.md 回滾策略（revert commit + 移除 cron + 保留 notifications 表）演練

## 11. Review 與 Audit

- [x] 11.1 [Tool: kimi] **以 3 個並行 subagent 取代 Kimi MCP**（correctness-auditor / security-lens / performance-auditor）全檔 CR。發現 Critical×2、High×5、Medium×3。已修正：
  - **C1** JSONB bool 匹配 `->>enabled` → `->enabled`（若不修 Cron 會靜默 0 發送）
  - **C2** 應用層冪等 pre-check query 改 DB 層 UNIQUE partial index + `23505` error code handling
  - **C3** Cron 串行 for-loop → `Promise.allSettled` 分批 25 並發（避 60s timeout）
  - **H1** `crypto.timingSafeEqual` 替換字串比較（防 timing attack）
  - **H2** DB error 僅 server log，response 改為 `{ error: 'internal_error' }`（防 schema 洩漏）
  - **H3** `[id]/read` 增加 `notifErr` 檢查（防誤判 404）
  - **H4** migration 新增 `idx_notifications_user_type_created` B-tree 索引、顯式 INSERT/DELETE `CHECK (false)` policy
  - **H5** list API 加 `.limit(100)`
- [x] 11.2 [Tool: kimi] 失敗隔離已驗證：`Promise.allSettled` 保證單一 reject 不中斷批次；測試 `isolates single-user dispatcher throw` 通過
- [ ] 11.3 [Tool: codex] 執行 `/spectra:audit` 檢查 security sharp edges — 延後（並行 3-lens CR 已涵蓋 audit 主要範圍）

## 12. 部署與收尾 — 依 design.md 部署步驟完成上線

- [ ] 12.1 [Tool: codex] 依 design.md 部署步驟第 4 步於 Vercel Production 設定 `TOSEND_API_KEY`、`TOSEND_FROM_EMAIL`、`CRON_SECRET` 三個環境變數
- [ ] 12.2 [Tool: codex] 依 design.md 部署步驟第 6 步 merge staging → main、等待 Vercel Production 部署成功
- [ ] 12.3 [Tool: codex] 依 design.md 部署步驟第 7 步於 Production 執行首次驗證：設 Fish 自己帳號 `reminder_schedule` 為下一個整點、確認實際收到 Email + 站內紅點
- [ ] 12.4 [Tool: codex] 更新 `README.md` 或 `docs/` 記錄通知系統架構（lib/email、lib/notifications、cron endpoint、必備 env var）
