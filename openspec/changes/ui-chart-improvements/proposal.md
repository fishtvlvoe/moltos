# UI / Chart Improvements

## Problem

從 2026-04-12 測試回饋中，發現三個需要改善的 UI/UX 問題：

1. **分析按鈕放錯位置**：「分析對話洞察」按鈕目前嵌在 `chat/page.tsx` 的對話框底部，視覺上讓對話介面看起來像在做醫療診斷，不符合產品定位。

2. **回顧頁缺少分析入口**：使用者想主動回顧對話分析時，需要在「回顧」頁面的「對話洞察」區塊提供觸發入口，目前沒有。

3. **趨勢圖顯示錯誤**：`review/page.tsx` 的「平靜指數趨勢」圖表把每一筆 `calm_index` 記錄各畫成一條水平 bar，導致同一天（如 4/7）出現 15+ 條 bar，無法看出趨勢，且需要大量滾動。正確做法是按日聚合（取當天最後一筆或平均值），用折線圖（line chart）呈現，X 軸是日期，Y 軸是分數 0–100。

## Proposed Solution

### Fix 1 — 移除 chat 頁的分析按鈕

從 `chat/page.tsx` 的對話框 UI 中移除「分析對話洞察」按鈕及相關的 `analyzingInsight` 狀態、`handleAnalyzeInsight` handler。對話介面只保留純粹的對話功能。

### Fix 2 — 在回顧頁加入分析入口

在 `review/page.tsx` 的「對話洞察」卡片底部，加一個「分析最近對話」按鈕，讓使用者可以主動觸發分析。按鈕呼叫現有的 `/api/analyze-insight` endpoint（或從 chat 頁 extract 出來的分析邏輯）。

### Fix 3 — 趨勢圖重設計

1. 安裝 `recharts`（shadcn/ui 官方推薦圖表套件）
2. 在 `review/page.tsx` 中，將 `history` 陣列按日期（YYYY-MM-DD）聚合，每天取最後一筆分數作為當日代表值
3. 用 `recharts` 的 `LineChart` 繪製：X 軸是日期（格式 M/D），Y 軸是 0–100，折線顏色對應分數等級（綠/橘/紅）
4. 資料點加上 tooltip 顯示日期、分數、等級文字
5. 圖表高度固定 200px，不隨資料量增加而拉長

## Non-Goals

- 不改變分析 API 的邏輯或 response 格式
- 不改變「對話洞察」歷史記錄的卡片樣式
- 不修改 `calm_index` 的計算方式

## Success Criteria

1. `chat/page.tsx` 的對話框中不再出現「分析對話洞察」按鈕
2. `review/page.tsx` 的「對話洞察」區塊底部有「分析最近對話」按鈕，點擊後觸發分析並在同頁顯示結果
3. 趨勢圖改為折線圖，同一天只有一個資料點，圖表高度固定不滾動，有 tooltip

## Impact

- `app/(app)/chat/page.tsx` — 移除分析按鈕及相關 handler
- `app/(app)/review/page.tsx` — 加入分析按鈕 + 重寫趨勢圖
- `package.json` — 新增 recharts 依賴
