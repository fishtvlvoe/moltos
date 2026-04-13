## Why

用戶的分析需要更好的呈現方式。之前每日分析結果橫向堆疊，導致頁面超長且難以掌握趨勢。改為曲線圖後，用戶能快速看到一週或一月的模式，但仍需保留查看單日詳細分析的能力。同時，「分析最近對話」按鈕太小，容易被忽略。

## What Changes

- 回顧頁面主要展示方式從每日堆疊改為曲線圖（已完成），現在補充細節設計
- 「分析最近對話」按鈕改名為「平靜分析」，並調大按鈕尺寸（padding + font size）
- 曲線圖下方支援點擊某一天查看詳細分析（drill-down 功能）
- 響應式設計優化：手機上卡片排版改為更清晰的格式，文字放大
- 新帳號用戶看到平靜指數時，應顯示「需要 14 天郵件數據」的說明，而非空白或 error state

## Non-Goals (optional)

- 不修改平靜指數的計算邏輯（邏輯已在 calm-index spec 定義）
- 不支援自訂曲線圖時間範圍（預設 14 天或 1 月）
- 不在此變更中新增其他分析圖表

## Capabilities

### New Capabilities

- `review-page-ui`: 回顧頁面的 UI 設計、按鈕規格、曲線圖互動（drill-down）、卡片排版

### Modified Capabilities

- `calm-index`: 新增平靜指數無數據時的 UI 說明文案

## Impact

- Affected specs: 新建 `review-page-ui`，修改 `calm-index`
- Affected code:
  - `app/(app)/review/page.tsx` — 按鈕尺寸/文字（L382-391）、分析卡片手機排版（L314-376）、曲線圖互動邏輯
  - `components/dashboard/calm-index-card.tsx` — error message 文案（L204-206）
