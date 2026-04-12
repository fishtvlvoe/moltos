## 1. 分離非開發文件（Development docs and external docs are separated；比賽資料與競品分析移至 `_external/`，不刪除；archive/ 下的舊原型程式碼移至 `_external/archive/`）

- [x] 1.1 建立目標目錄：`docs/_external/competition/`、`docs/_external/competitors/`、`docs/_external/archive/`，確認 Development docs and external docs are separated
- [x] 1.2 將 `docs/1-competition — 比賽資料/` 下所有檔案移至 `docs/_external/competition/`，符合 Existing docs content is preserved during restructure
- [x] 1.3 將 `docs/4-competitors — 競品分析/` 下所有檔案移至 `docs/_external/competitors/`，符合 Existing docs content is preserved during restructure
- [x] 1.4 將 `archive/` 下的舊原型程式碼移至 `_external/archive/`（設計決策：`archive/` 下的舊原型程式碼移至 `_external/archive/`），符合 Existing docs content is preserved during restructure
- [x] 1.5 刪除已清空的舊目錄：`docs/1-competition — 比賽資料/`、`docs/4-competitors — 競品分析/`、`docs/2-general — 一般文書/archive — 舊檔案/`

## 2. 重命名目錄為 ASCII-only kebab-case（Directory names use ASCII-only kebab-case；目錄命名採純 kebab-case，移除所有中文與空格）

- [x] 2.1 重命名 `docs/0-code-guide — 代碼說明/` → `docs/dev/code-guide/`，套用 Directory names use ASCII-only kebab-case
- [x] 2.2 移動 `docs/2-general — 一般文書/` 殘餘內容（`PROJECT.md`、`ai.md`、`ssh-moltos.md`）→ `docs/dev/general/`
- [x] 2.3 移動 `docs/3-dev — 開發文件/` 殘餘內容（specs、API 文件、引擎參考）→ `docs/dev/`（攤平一層）
- [x] 2.4 移動 `docs/3-dev/` 的 `handoff-elevenlabs-chat.md` → `docs/dev/handoffs/`
- [x] 2.5 重命名 `docs/5-design — 設計文件/` → `docs/design/`（僅目錄，不動 `.pen` 檔內容）
- [x] 2.6 驗證：執行 `ls docs/` 確認不再有含空格或中文的目錄名稱，Directory names use ASCII-only kebab-case 達成

## 3. 建立 `docs/dev/architecture.md`（docs/dev/architecture.md exists；補齊 `dev/architecture.md` 作為 AI Session 的首要讀取點）

- [x] 3.1 撰寫系統概覽：Moltos 是什麼、解決什麼問題，確認 docs/dev/architecture.md exists
- [x] 3.2 列出主要模組：frontend（Next.js App Router）、backend API routes、ElevenLabs 整合、Gemini 整合
- [x] 3.3 描述資料流：使用者 → Chat/Call UI → API Route → ElevenLabs/Gemini → 回應
- [x] 3.4 列出 Tech Stack：TypeScript 5.x、Next.js 15、Tailwind CSS、shadcn/ui、googleapis、ElevenLabs SDK

## 4. 建立 `docs/dev/decisions/` 與初始 ADR（decisions/ directory contains ADR files；Explaining why ElevenLabs was chosen）

- [x] 4.1 建立目錄 `docs/dev/decisions/`，確認 decisions/ directory contains ADR files
- [x] 4.2 撰寫 `docs/dev/decisions/001-elevenlabs-tts.md`：Explaining why ElevenLabs was chosen 為 TTS 方案

## 5. 建立 `docs/README.md` 目錄索引（docs/README.md exists as directory index）

- [x] 5.1 撰寫 `docs/README.md`，列出所有頂層目錄及一行說明：`dev/`、`design/`、`_external/`，確認 docs/README.md exists as directory index
- [x] 5.2 在 `docs/_external/README.md` 說明「此目錄為外部參考資料，不描述系統行為」

## 6. 更新 CLAUDE.md 路徑引用

- [x] 6.1 搜尋 `CLAUDE.md` 中所有舊的 docs 路徑引用（如 `3-dev`、`0-code-guide`）
- [x] 6.2 將舊路徑更新為新路徑（`docs/dev/`、`docs/design/`、`docs/_external/`）— CLAUDE.md 無舊路徑引用，不需變更
