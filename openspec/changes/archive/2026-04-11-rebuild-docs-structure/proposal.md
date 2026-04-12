## Why

目前 `docs/` 目錄結構混雜：開發文件、比賽資料、競品分析、設計檔案全部塞在同一層，目錄命名中英夾雜且含空格，導致 CLI 操作困難、AI 工具難以定位關鍵文件、新加入者（含 AI 助手）無法快速理解系統架構。

## What Changes

- **重命名所有目錄**：移除中文、空格、數字前綴，改為純 kebab-case 英文命名
- **分離非開發文件**：將 `competition/`（比賽資料）與 `competitors/`（競品分析）移出主 `docs/` 或移至獨立子目錄 `_external/`
- **建立核心開發文件**：補齊缺失的 `architecture.md`（系統架構）、`decisions/`（ADR 記錄）、`api.md`（API 路由說明）
- **移除過時內容**：清理 `archive/` 下的舊原型程式碼（已非文件）
- **統一目錄樹**：制定 `docs/` 的正式目錄規範，寫入 `docs/README.md`

## Non-Goals

- 不修改 `openspec/` 的任何內容（Spectra 管轄範圍）
- 不重寫現有技術文件的內文，只調整結構與命名
- 不動 `docs/5-design/` 的 `.pen` 設計檔（Pencil 管轄）
- 不決定競品分析文件的最終去留，只移動到 `_external/` 暫存

## Capabilities

### New Capabilities

- `docs-structure`: 定義 `docs/` 目錄的標準結構、命名規範、各子目錄用途，以及維護指引

### Modified Capabilities

(none)

## Impact

- 影響目錄：`docs/0-code-guide*/`、`docs/1-competition*/`、`docs/2-general*/`、`docs/3-dev*/`、`docs/4-competitors*/`
- 新增文件：`docs/README.md`、`docs/dev/architecture.md`
- 移動目標：`docs/1-competition*/` → `docs/_external/competition/`、`docs/4-competitors*/` → `docs/_external/competitors/`
- 受影響的 AI 上下文：`CLAUDE.md` 中的 docs 路徑引用可能需更新
