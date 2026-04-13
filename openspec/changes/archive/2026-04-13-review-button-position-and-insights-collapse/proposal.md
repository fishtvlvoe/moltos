## Why

用戶在回顧頁面積累多張對話洞察卡片後，必須滾到最下方才能找到「平靜分析」按鈕，導致分析流程不直觀。同時，對話洞察列表展開時佔據過多垂直空間，壓低了主要功能（曲線圖分析）的視覺重要性。

## What Changes

1. **按鈕位置調整**：將「平靜分析」按鈕從對話洞察卡片下方移至曲線圖下方（按鈕成為平靜指數區塊的一部分）
2. **摺疊卡片設計**：對話洞察改為可摺疊卡片，預設收起（顯示「▼ 對話洞察（收起）」），用戶點擊標題展開/收起
3. **卡片內容簡化**：摺疊狀態下只顯示標題（日期 + calm score），展開後顯示完整內容

## Non-Goals

- 不修改卡片內的資料結構或 API 響應格式
- 不改變單張卡片的內容（標題、摘要、需求、成長路徑等）
- 不新增搜尋或篩選功能

## Capabilities

### New Capabilities

- `insights-collapse-ui`: 對話洞察卡片的摺疊/展開互動及狀態管理

### Modified Capabilities

- `review-page-ui`: 調整平靜指數和對話洞察的頁面結構與按鈕位置

## Impact

**Affected code:**
- `app/(app)/review/page.tsx` — JSX 結構重組、新增 `insightsExpanded` state、重排按鈕位置
- 無新檔案或模組變動

**Affected specs:**
- `review-page-ui` — 新增「摺疊卡片」和「按鈕位置」的需求說明
