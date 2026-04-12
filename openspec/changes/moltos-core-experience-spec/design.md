## Context

這個 change 是純規格補齊，不新增功能、不修改程式碼。四個核心體驗（語音對話、文字對話、平靜指數、主動關心）的實作已存在，目標是用 Spectra spec 把「正確行為」寫清楚，作為補齊測試的依據。

## Goals / Non-Goals

**Goals:**
- 建立四個 spec 檔案，讓測試撰寫有明確的驗收標準
- 每個 Scenario 直接對應一個 Vitest 測試案例

**Non-Goals:**
- 不修改任何應用程式碼
- 不新增任何功能
- 不包含 UI 元件的視覺測試

## Decisions

### 每個核心體驗獨立一個 spec 目錄

四個 capability 各自有不同的測試邊界（API route、lib 模組、webhook），分開管理讓測試定位更清楚。合併成一個 spec 會讓測試範圍模糊。

### Scenario 只覆蓋 API 層和 lib 層，不覆蓋 UI 層

UI 互動（WebSocket 狀態、聊天泡泡渲染）屬於 component test 範疇，需要 Playwright 或 React Testing Library，是獨立的測試類型，不在本 change 範圍內。

## Risks / Trade-offs

- **[取捨] design.md 在純規格 change 中內容較薄**：本 change 沒有架構決策，design.md 主要用於記錄範圍邊界和排除原因，而非技術設計細節。
