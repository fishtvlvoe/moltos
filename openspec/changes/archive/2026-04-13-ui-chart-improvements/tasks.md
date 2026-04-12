# UI / Chart Improvements — Tasks

## 1. 安裝 recharts

- [x] 1.1 執行 `npm install recharts`，確認安裝成功且 `package.json` 更新
- [x] 1.2 確認 `npm run build` 仍然通過，無 TypeScript 或 peer-dependency 錯誤

## 2. 移除 chat 頁的「分析對話洞察」按鈕

- [x] 2.1 在 `app/(app)/chat/page.tsx` 中，移除「分析對話洞察」按鈕的 JSX（約 line 350–360 的 button element）
- [x] 2.2 移除 `analyzingInsight` state、`handleAnalyzeInsight` handler，以及相關的 `import`（若僅此用途）
- [x] 2.3 確認移除後對話框版面正常，無空白或 layout 跑版

## 3. 在回顧頁加入「分析最近對話」入口

- [x] 3.1 在 `app/(app)/review/page.tsx` 的「對話洞察」卡片（`CardContent` 底部）新增一個按鈕：文字「分析最近對話」，樣式與現有 Button 元件一致（`variant="outline"` 或 `variant="ghost"`）
- [x] 3.2 按鈕點擊後呼叫 `/api/analyze-insight`（POST，body 與 chat 頁相同）；顯示 loading 狀態（spinner 或按鈕 disabled + 文字改為「分析中…」）
- [x] 3.3 分析完成後，重新 fetch insights 列表（呼叫現有 `fetchInsights()`），讓新的洞察卡片即時出現在上方列表，不需要重新整理頁面
- [x] 3.4 若 API 回傳錯誤，顯示 toast 或 inline error message（文字：「分析失敗，請稍後再試」）

## 4. 趨勢圖重設計 — 折線圖

- [x] 4.1 在 `app/(app)/review/page.tsx` 的 `history` 資料處理邏輯中，新增聚合函數 `groupByDay(history)`：將陣列按 `createdAt` 的日期（YYYY-MM-DD）分組，每組取**最後一筆**（最新記錄）作為當日代表值，回傳格式 `{ date: 'M/D', score: number, level: string }[]`，並按日期排序（最舊→最新）
- [x] 4.2 將現有的水平 bar 列表（`history.map(...)` 的 div 結構）替換為 `recharts` 的 `LineChart`，設定：
  - 容器：`width="100%"` `height={200}`
  - `XAxis`：`dataKey="date"`，`tick` 字型大小 10px，`#8A8A8A`
  - `YAxis`：`domain={[0, 100]}`，`width={28}`，`tick` 字型大小 10px
  - `Line`：`type="monotone"`，`dataKey="score"`，`stroke="#7C5CBA"`，`strokeWidth={2}`，`dot={{ r: 3 }}`，`activeDot={{ r: 5 }}`
  - `Tooltip`：自訂 content，顯示日期、分數、等級文字（中文）
  - `CartesianGrid`：`strokeDasharray="3 3"`，`stroke="#EDE8E0"`
- [x] 4.3 若 `groupByDay` 結果只有 1 個資料點，改顯示單一分數卡片（不畫折線圖，因為一個點無法顯示趨勢），加上文字「資料累積中，將在有更多記錄後顯示趨勢」
- [x] 4.4 截圖確認：圖表高度固定 200px，X 軸日期不重複，tooltip 正常顯示，整頁不再需要大量垂直滾動

## 5. 測試與驗證

- [x] 5.1 執行 `npm run test` 確認無 regression
- [x] 5.2 在有多天記錄的帳號（含同一天多筆）中，驗證折線圖每天只顯示一個資料點
- [x] 5.3 確認「對話框不再有分析按鈕」且「回顧頁的分析按鈕可正常觸發分析並更新列表」
