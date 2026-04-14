## Why

設定頁面現有 5 個選單項目，其中 4 個（通知設定、提醒排程、資訊來源、隱私與資料）仍是 UI 佔位符，無實際功能。同時，所有選單項目使用 emoji icon，與既有 UI 系統不一致（應改用 SVG icon）。本次變更補齊這 4 個功能的完整實作，並統一改用 SVG icon 以提升 UI 一致性和可維護性。

## What Changes

- **SVG Icon 替換**：將所有 5 個選單項目的 emoji icon（🔔 ⏰ 📰 🔒）替換為 Lucide/Heroicons SVG icon
- **通知設定頁面**：新增 `/settings/notifications` 頁面，支持郵件通知、應用內通知、推播通知的開關管理
- **提醒排程頁面**：新增 `/settings/reminders` 頁面，支持每日定時提醒設定（時間、頻率、類型）
- **資訊來源頁面**：新增 `/settings/sources` 頁面，展示已連接的資訊來源（如 Gmail），支持管理來源優先順序和更新頻率
- **隱私與資料頁面**：新增 `/settings/privacy` 頁面，展示資料使用政策、隱私設定和數據刪除選項，與既有「清除對話歷史」功能整合

## Non-Goals

- 不實作真實的推播通知（Notification API）— 保留應用內 toast 提醒
- 不支持分鐘級排程（提醒只支持每日/每週層級）
- 不實作與第三方服務的自動同步（如 Google Calendar）
- 不修改已完成的 Gmail 整合功能

## Capabilities

### New Capabilities

- `notification-settings`: 郵件、應用內、推播通知的開關管理
- `reminder-schedules`: 每日定時提醒設定與執行（時間、頻率、類型選擇）
- `information-sources`: 已連接資訊來源的展示與管理（優先順序、更新頻率）
- `privacy-data-management`: 資料使用政策展示、隱私設定、數據刪除流程

### Modified Capabilities

- `settings-menu`: 新增 4 個功能選單項目，將 emoji icon 替換為 SVG icon

## Impact

**Affected code**:
- `components/settings/menu-card.tsx`: icon 從 emoji 改成 SVG，新增 href 導向 4 個頁面
- `app/(app)/settings/notifications/page.tsx` (new)
- `app/(app)/settings/reminders/page.tsx` (new)
- `app/(app)/settings/sources/page.tsx` (new)
- `app/(app)/settings/privacy/page.tsx` (new)
- UI 元件：`components/settings/` 新增 4 個對應的設定卡片/表單元件
- 資料庫：users 表可能需要新增欄位（notification_preferences、reminder_schedule、source_priorities）
- API routes：`/api/settings/notifications`、`/api/settings/reminders` 等後端支持

**Related specs**:
- `gmail-account-management`: 資訊來源頁面會展示 Gmail 整合狀態
