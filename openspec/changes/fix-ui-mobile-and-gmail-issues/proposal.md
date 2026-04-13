## Why

系統有四個小 bug 影響用戶體驗：按鈕太小容易被忽略、手機上卡片文字難以閱讀、新帳號看不懂平靜指數為何無數據、Gmail 帳號無法切換。這些都是快速修復的小改動，集中在本變更中一起完成。

## What Changes

### Bug #1：按鈕優化
- 回顧頁面「分析最近對話」按鈕太小，改大按鈕尺寸（padding + font size）
- 按鈕文字改為「平靜分析」

### Bug #2：卡片排版
- 分析完對話後的卡片在手機上文字太小（`text-sm`）
- 調整為 mobile 時 `text-base`，加邊框、陰影，改進排版

### Bug #3：平靜指數說明
- 新帳號登入後，平靜指數區塊顯示模糊的「資料暫時無法載入」
- 改為清晰文案：「需要至少 14 天的郵件數據才能計算平靜指數」

### Bug #4：Gmail 解除綁定
- 「移除 Gmail 關聯」按鈕無法運作（目前實作為全帳號登出，非本意）
- 實作真正的解除綁定：清除 token，保留帳號和歷史數據
- 支援重新授權新 Gmail 帳號

## Non-Goals (optional)

- 不涉及平靜指數計算邏輯變更
- 不修改曲線圖互動（曲線圖已完成，此變更只改 UI 細節）
- 不新增帳號遷移功能

## Capabilities

This change implements specifications defined in parent changes (review-page-redesign and gmail-integration-complete). No new capability definitions needed — all requirements are already specified.

## Impact

- Affected code:
  - `components/review/analyze-button.tsx` — 按鈕大小 + 文字
  - `components/dashboard/analysis-card.tsx` — 卡片排版（手機）
  - `components/dashboard/calm-index-card.tsx` — 無數據說明文案
  - `components/settings/gmail-actions.tsx` — 解除綁定邏輯
  - `app/api/gmail/disconnect/route.ts` — 新建 API endpoint
  - `lib/db.ts` — 新增 token 清除函數
  - Tests — 相應的測試更新
