## Why

Gmail 整合是 MOLTOS 的核心功能，但用戶目前無法自助管理帳號。「解除綁定」按鈕無法運作，用戶無法切換不同的 Gmail 帳號，只能靠登出整個帳號重新開始（失去本地數據）。建立完整的 Gmail 帳號整合流程，讓用戶安心切換帳號。

## What Changes

- 新增「解除 Gmail 綁定」功能（清除 token，保留歷史數據）
- 新增「切換 Gmail 帳號」功能（授權新帳號，更新 token）
- 設定頁面展示清晰的帳號狀態（已連接/未連接/連接中）
- 解除綁定後，用戶不失去 MOLTOS 帳號本身，只失去 Gmail 數據同步

## Non-Goals (optional)

- 不支援同時綁定多個 Gmail 帳號（一帳號一 Gmail）
- 不支援本地恢復已刪除的 Gmail 數據
- 不支援 Google Workspace 特殊權限（一般 Gmail 帳號為主）

## Capabilities

### New Capabilities

- `gmail-account-management`: Gmail 帳號連接、解除、切換的完整流程及狀態管理

### Modified Capabilities

- `gmail-integration`: 從只支援初始連接，擴展為支援切換和解除

## Impact

- Affected specs: 新建 `gmail-account-management`，修改 `gmail-integration`
- Affected code:
  - `components/settings/gmail-actions.tsx` — 更換邏輯（目前錯誤實作為全帳號登出）
  - `app/api/gmail/disconnect/route.ts` — 新建 API endpoint
  - `lib/db.ts` — 新增 `removeGmailToken(userId)` 函數
  - `components/settings/gmail-status.tsx` — 狀態顯示組件
  - Database migration — 確保 users 表有 gmail_access_token / gmail_refresh_token 欄位
