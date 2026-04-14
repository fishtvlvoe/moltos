## Context

系統內 582 處 emoji 分散於四大區域：
1. **Runtime UI（P0）**：React 元件中直接作為 icon 字串，影響所有用戶（review 展開符、wellness 指標、progress 卡片、message 游標）
2. **Marketing HTML（P1）**：靜態輪播圖的社交互動 icon（like、comment、share、save），影響品牌形象
3. **Markdown 文件（P2）**：檔案狀態燈、checklist、星級評分，主要供開發者閱讀
4. **測試/腳本（P3）**：測試名稱與註解中的失敗標記，無用戶可見性

現狀：emoji 與 SVG icon 混雜使用，缺乏統一風格指南。

## Goals / Non-Goals

**Goals：**
- 將所有用戶可見的 emoji（P0、P1）改為對應 SVG icon（Lucide 或自訂）
- 建立統一的 emoji → SVG 映射表，便於後續維護與擴展
- 提升視覺一致性，強化品牌形象
- 不增加新的依賴套件（使用既有 Lucide）

**Non-Goals：**
- 不修改文件內的 emoji（P2）可選擇性保留，不強制替換
- 不改變測試/腳本中的標記（P3）
- 不修改第三方套件內容
- 不改變任何功能邏輯

## Decisions

### 使用 Lucide icon 作為主要替換方案

**理由**：專案已依賴 Lucide（在 MenuCard 等元件中使用），無新依賴成本。Lucide 提供 200+ 常用 icon，涵蓋此次替換需求。

**替換映射表**：
- 展開/收合：`▼▲` → `ChevronDown/ChevronUp`
- 活動/睡眠/水分：`🚶😴💧` → `Footprints/Moon/Droplet`
- 郵件/時間/夜間：`📧⏰🌙` → `Mail/Clock/Moon`
- 社交互動：`♡❤️` → `Heart`，`💬` → `MessageCircle`，`📤` → `Share`，`🔖📌` → `Bookmark`

### 自訂 SVG 用於 Lucide 無對應的 icon

**理由**：`▌` 游標、`●` 錄音指示器在 Lucide 中無完美對應，需自訂最小 SVG。

**實作**：在 `components/icons/custom-icons.tsx` 中定義 React SVG 元件：
```tsx
export function BlockCursor({ className }: { className?: string }) {
  return <svg className={className} {...} />
}
export function RecordingDot({ className }: { className?: string }) {
  return <svg className={className} {...} />
}
```

### 分階段替換，避免一次性大改

**理由**：582 處 emoji 涵蓋 93 個檔案，一次性改動風險高、難以 review。按優先級分階段：
- **Phase 1**：Runtime UI（review、wellness、progress、message）— 10 個檔案，最高優先級
- **Phase 2**：Marketing HTML（3 個 carousel 檔案）— 視覺衝擊力高
- **Phase 3**：Markdown 文件（可選）— 開發者文件，無用戶可見性
- **Phase 4**：測試/腳本（可選）— 非生產代碼

### 建立 Emoji → SVG 映射表供全系統使用

**理由**：如果未來新增類似 emoji，維護者應有統一參考。

**實作**：在 `lib/icon-mapping.ts` 定義常數：
```ts
export const EMOJI_TO_ICON = {
  '▼': 'ChevronDown',
  '▲': 'ChevronUp',
  '🚶': 'Footprints',
  // ...
} as const;
```

供元件導入使用或文檔參考。

## Risks / Trade-offs

| 風險 | 影響 | 缺解方案 |
|------|------|---------|
| **Lucide 無對應 icon** | 某些 emoji（如 `▌▌▌`）在 Lucide 中無完美替代 | 改用自訂最小 SVG（成本低）或改變 UI 表現（如用漸變色塊代替游標） |
| **Marketing HTML 為靜態檔案** | 修改輪播 HTML 後，CDN 緩存可能延遲更新 | 使用 cache-busting 或 versioned URL，確保立即生效 |
| **測試名稱含 emoji** | 某些測試函數名稱用 `✗` 或 `❌` 作標記，改為文字後易引發命名衝突 | 改用統一前綴（如 `test_red_light_`）或保留 emoji（非強制） |
| **向後相容性** | 若第三方工具依賴 emoji 字串（如搜尋日誌），改為 SVG 後無法識別 | 保留註解說明原 emoji，或在舊 emoji 位置加註 fallback 文字 |

## Migration Plan

### Phase 1：Runtime UI（預計 4-6 小時）
1. 建立 `components/icons/custom-icons.tsx` 與 `lib/icon-mapping.ts`
2. 修改 5 個 React 元件（review、wellness、progress、message、其他）
3. 測試：單元測試、視覺檢查、行動裝置驗證
4. 部署：一次性 commit，Vercel preview 驗證

### Phase 2：Marketing HTML（預計 1-2 小時）
1. 修改 3 個 carousel HTML 檔案
2. 測試：視覺渲染、縮放、互動功能
3. 部署：Vercel 靜態內容重新部署

### Phase 3：Markdown 文件（可選，預計 2-3 小時）
1. 逐檔案掃瞄替換 emoji（可用 regex）
2. 測試：確保 markdown 渲染無誤
3. 部署：GitHub push

### Phase 4：測試/腳本（可選）
1. 評估是否替換或保留
2. 若替換，批量改為文字前綴

### 回滾策略
- **Phase 1-2**：git revert（原 emoji 字串在版本控制中保留）
- **Phase 3-4**：若影響文件可讀性，回復原 emoji（非生產影響）

## Open Questions

1. **Marketing HTML 的社交互動 icon 是否使用 Lucide SVG 或保留 HTML 原生實作？**（暫定：改為 Lucide Heart/MessageCircle 等）
2. **自訂游標 SVG 的尺寸與顏色是否與現有 `▌` 完全一致？**（需設計確認）
3. **測試檔中的 `✗❌` 是否強制替換為文字？**（暫定：保留，非 P0）
4. **Markdown 文件的狀態燈（`🟢🔴🟡`）改為 SVG 後是否影響 GitHub 渲染？**（需驗證）
