## Why

目前設定頁的「提醒排程」和「通知偏好」雖已有 UI + 存入 DB（users 表的 `reminder_schedule`、`notification_preferences` 欄位），但後端沒有任何系統在讀這些欄位去實際發送通知。用戶設定了每天 09:00 提醒卻永遠不會收到 — 這是假設定。

MVP 階段需要讓「提醒排程」真正生效，避免用戶對產品失去信任；同時導入站內通知基礎建設（notifications 資料表 + 紅點提示），作為未來所有通知類型（對話摘要、主動關懷等）的統一通道。

## What Changes

- **新增 Email 發送能力**：整合 toSend 服務（AWS SES 底層），封裝 lib 提供給任何後端模組呼叫
- **新增 Vercel Cron 排程**：每小時觸發 `/api/cron/send-reminders`，讀取所有符合當下時間 + frequency 的用戶 `reminder_schedule`，發送平靜指數提醒 Email
- **新增 notifications 資料表**：`id, user_id, type, title, body, read_at, created_at` 五欄，承載站內通知紀錄
- **新增站內通知 API**：`GET /api/notifications`（列表）、`POST /api/notifications/[id]/read`（標為已讀）
- **新增通知頁面**：`/notifications` 顯示歷史通知列表
- **新增 Header 紅點**：未讀數 > 0 時顯示紅點，點擊跳轉通知頁
- **固定文案策略**：本次只實作「平靜指數提醒」一種通知類型，內容為固定樣板（如「記得關心一下自己」+ 今日平靜指數），不做 AI 摘要

## Non-Goals

- **不做 Web Push / Service Worker / VAPID**：iOS Safari 需用戶加到主畫面才支援、相容性複雜，MVP 階段以 Email + 站內通知即可達到「通知到達」的核心價值
- **不做 AI 對話摘要推送**：需先有穩定的摘要生成邏輯，留待後續 change
- **不讓 `notification_preferences`（三通道開關）真正生效**：MVP 只讓 reminder_schedule 生效，通知偏好在未來 change 處理
- **不處理 `source_priorities` 和 `privacy_settings` 的後端生效**：與本次範圍無關
- **不做 Email 退訂連結 / 偏好中心**：只做基本發送，合規細節（CAN-SPAM、GDPR unsubscribe）留待後續
- **不做 Email 模板設計系統**：MVP 使用純文字 + 簡單 HTML，未導入 react-email 或 MJML

## Capabilities

### New Capabilities

- `notification-delivery`: 後端通知發送基礎建設，涵蓋 Email 發送（toSend 整合）、Vercel Cron 排程、notifications 資料表與發送分派器（dispatcher），決定何時、對誰、透過哪些通道發送哪種通知
- `in-app-notifications`: 站內通知的使用者體驗，涵蓋通知列表頁、Header 未讀紅點、通知 API、已讀狀態管理

### Modified Capabilities

- `reminder-schedules`: 新增「提醒實際發送」的需求（原本只有 CRUD UI，現在需規範：當 enabled=true 且 frequency/time 符合當下條件時，系統 SHALL 透過 notification-delivery 發送提醒）

## Impact

- **Affected specs**: 新增 `notification-delivery`、`in-app-notifications`；修改 `reminder-schedules`
- **Affected code (新增)**:
  - `lib/email/tosend.ts` — toSend SDK 封裝
  - `lib/notifications/dispatcher.ts` — 通知分派器（判斷發送條件、選擇通道、寫入 DB）
  - `app/api/cron/send-reminders/route.ts` — Vercel Cron endpoint
  - `app/api/notifications/route.ts` — 列表 API
  - `app/api/notifications/[id]/read/route.ts` — 標為已讀 API
  - `app/(app)/notifications/page.tsx` — 通知列表頁
  - `components/notification-badge.tsx` — Header 紅點元件
  - `supabase/migrations/<timestamp>_add_notifications_table.sql` — 新資料表
- **Affected code (修改)**:
  - `vercel.json` — 新增 crons 陣列
  - `app/(app)/layout.tsx` 或 Header 元件 — 加入 notification-badge
- **Dependencies 新增**: `@tosend/sdk`（或其 npm 套件名，propose 階段以 placeholder 標記）
- **環境變數新增**: `TOSEND_API_KEY`、`TOSEND_FROM_EMAIL`、`CRON_SECRET`（Vercel Cron 驗證用）
- **外部服務**: 新增 toSend 服務依賴（AWS SES 底層，$0.30/1000 封，免費 200 封）
