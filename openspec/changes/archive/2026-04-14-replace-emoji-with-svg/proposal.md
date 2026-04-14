## Why

系統內有 582 處 emoji 表情符號散布於 UI 元件、行銷素材、文件中，造成視覺風格不一致。透過統一改為 SVG 圖樣（使用 Lucide icon 或自訂 SVG），提升介面整體一致性、可維護性與品牌形象。

## What Changes

### 優先替換（Phase 1-2）

- **Runtime UI Icons**：`app/` 與 `components/` 中的用戶可見 emoji（`▼▲🚶😴💧📧⏰🌙▌✕●`）改為對應 Lucide SVG 或自訂 SVG
  - Review 頁面：`▼▲` → `ChevronDown/ChevronUp`
  - Wellness 卡片：`🚶😴💧` → `Footprints/Moon/Droplet`
  - Progress 卡片：`📧⏰🌙` → `Mail/Clock/Moon`
  - Message 氣泡：`▌` 游標 → 自訂 block cursor SVG
  - 其他：`✕●` → `X/Circle` icon

- **Marketing HTML**：`fishtvlove-carousel*.html` 中的社交互動 emoji（`♡♥❤️💬📤🔖📌➤⌘`）改為 SVG icon
  - Like：`♡♥❤️` → Heart / HeartFilled
  - Comment：`💬` → MessageCircle
  - Share：`📤` → Share
  - Save：`🔖📌` → Bookmark
  - 播放/指令：`➤⌘` → Play / Command

### 次優替換（Phase 3）

- **Markdown 文件**：`docs/` 中的狀態燈與標題裝飾 emoji（`✅✗❌🟢🔴🟡⭐🧠🚀`）改為 SVG 或保留（可選）
  - Checklist：`✅✗❌` → checkmark/cross SVG 或保留文字
  - 狀態燈：`🟢🔴🟡` → colored circle SVG
  - 星級：`⭐⭐⭐⭐⭐` → star rating SVG

### 次要保留（Phase 4+）

- **測試/腳本**：`tests/` 與 `.sh` 中的 `✗❌▶` 可選擇性保留或改為 ASCII

## Non-Goals

- 不修改第三方套件（如 npm 套件內的 emoji）
- 不改變功能行為，僅改變視覺表現
- 不一次性重寫所有文件，按優先級分階段進行
- 不新增依賴套件，優先使用既有 Lucide icon

## Capabilities

### New Capabilities

- `emoji-to-svg-icons`: 建立統一的 SVG icon 映射表，定義每個 emoji 對應的 Lucide icon 或自訂 SVG，支援在元件中直接替換

### Modified Capabilities

- `review-page-ui`: Review 頁面的展開/收合指示器從 `▼▲` 改為 `ChevronDown/ChevronUp`
- `wellness-card`: Wellness 卡片的活動/睡眠/水分 icon 從 emoji 改為 SVG
- `dashboard-today-progress`: 今日進度卡片的郵件/提醒/夜間 icon 從 emoji 改為 SVG
- `chat-message-ui`: 聊天氣泡的串流游標從 `▌` 改為自訂 SVG

## Impact

- **Affected specs**: review-page-ui, wellness-card, dashboard-today-progress, chat-message-ui, emoji-to-svg-icons（新增）
- **Affected code**: 
  - Components: `app/(app)/review/page.tsx`, `components/dashboard/wellness-card.tsx`, `components/dashboard/today-progress.tsx`, `components/chat/message-bubble.tsx`
  - Marketing: `docs/_external/archive/demo/fishtvlove-carousel*.html` (3 files)
  - Docs: `docs/dev/**/*.md` (15+ files)
  - Tests: `tests/api/*.test.ts` (8+ files)
