## Context

目前 `app/(app)/review/page.tsx` 的佈局是：
1. 平靜指數趨勢卡片（曲線圖）
2. 平靜分析按鈕（在卡片內）
3. 對話洞察卡片列表（全部展開）

用戶若要重新分析，需要滾動到底部才能找到按鈕。當對話洞察卡片多時（10+ 張），頁面變得很長。

## Goals / Non-Goals

**Goals:**
- 將「平靜分析」按鈕移到對話洞察上方，減少用戶滾動
- 對話洞察預設摺疊，縮減初始頁面高度
- 保持點擊展開後的完整內容體驗

**Non-Goals:**
- 不改變卡片數據結構或 API
- 不新增分頁或虛擬滾動
- 不修改卡片樣式（顏色、字體等）

## Decisions

### 1. State 管理方式：使用本地 React state

用 `const [insightsExpanded, setInsightsExpanded] = useState(false)` 管理摺疊狀態。

**理由**：摺疊狀態是臨時 UI 狀態，無需持久化或跨頁面共享。

**替代方案考慮**：
- URL query 參數（?insights=expanded）— 過度複雜，且刷新後狀態丟失
- localStorage — 無必要持久化

### 2. 按鈕位置重組

在 JSX 結構中，將 `<Button>平靜分析</Button>` 移出「對話洞察」卡片，放在曲線圖卡片的最後（CardContent 內）。

**理由**：邏輯上，按鈕屬於「平靜指數」區塊的完整體驗，而非「對話洞察」。

### 3. 摺疊卡片的標題與內容

**摺疊時**（insightsExpanded === false）：
- 顯示：`<div onClick={() => setInsightsExpanded(true)}>▼ 對話洞察（${insights.length} 筆）</div>`
- 不顯示卡片內容

**展開時**（insightsExpanded === true）：
- 顯示：`▲ 對話洞察`
- 顯示所有卡片（現有邏輯保持不變）
- 點擊標題可收起

### 4. 卡片結構調整

摺疊狀態下：
```tsx
<Card>
  <CardHeader className="cursor-pointer" onClick={() => setInsightsExpanded(true)}>
    <CardTitle>▼ 對話洞察（{insights.length} 筆）</CardTitle>
  </CardHeader>
</Card>
```

展開狀態下：現有結構不變。

## Risks / Trade-offs

**[Risk]** 展開後頁面仍可能很長（若卡片多）
→ **Mitigation**：接受此行為；未來可考慮虛擬滾動或分頁（非本 change 範圍）

**[Risk]** 用戶不知道可以摺疊
→ **Mitigation**：使用視覺指標「▼ / ▲」，摺疊標題可點擊（cursor-pointer）

## Implementation Distribution Strategy

**工作項 → 承擔代理 → 工具 → 估時**

| 工作項 | 代理 | 工具 | 估時 |
|--------|------|------|------|
| 1. 重組 JSX 結構 | Cursor | cursor-agent | 1h |
| 2. 新增 insightsExpanded state | Copilot | copilot-codex | 0.5h |
| 3. 測試摺疊/展開互動 | Codex | codex | 1h |
| 4. 樣式微調（可選） | Cursor | cursor-agent | 0.5h |

**並行可能性**：步驟 1 和 2 可並行（不相交）；步驟 3 依賴 1+2。

**Token 成本估算**：
- 總耗時：3h
- 估計代碼行數：30-50 行改動
- 使用 Copilot (gpt-5.2) + Codex：≈ 5K tokens（vs Sonnet 的 15K+）
- 節省：70%
