## Context

目前 `docs/` 有 6 個頂層目錄，命名採中英混雜 + 數字前綴 + 空格格式（例如 `3-dev — 開發文件`），在 CLI 操作時需加引號，在 AI 上下文讀取時容易截斷路徑。目錄分類邏輯也不清晰：開發技術參考（ElevenLabs API 文件）、比賽資料、競品分析、舊原型程式碼全部混在同一層。

主要使用者：AI 開發助手（Claude Code / Cursor）每次 session 都需要快速定位架構文件；人類開發者（Fish + 未來合作者）需要一眼看懂各目錄用途。

## Goals / Non-Goals

**Goals:**
- 所有目錄名稱改為 ASCII-only kebab-case，CLI 友好
- 開發相關文件（`dev/`）與非開發文件（`_external/`）明確分離
- `dev/` 下補齊最小必要文件：`architecture.md`、`decisions/`
- 提供 `docs/README.md` 作為人類與 AI 的目錄索引

**Non-Goals:**
- 不修改 `openspec/`（Spectra 管轄）
- 不修改 `.pen` 設計檔（Pencil 管轄）
- 不重寫既有文件內文（只移動 + 重命名）
- 不決定競品/比賽資料的長期歸屬，`_external/` 為暫存

## Decisions

### 目錄命名採純 kebab-case，移除所有中文與空格

**理由**：`docs/3-dev — 開發文件/` 在 shell 中需要 `"..."` 包裹，AI 工具讀路徑時容易截斷在 `—` 符號。改為 `docs/dev/` 後，`ls docs/dev` 可直接運作，Glob 模式 `docs/dev/**` 也不需跳脫。

**替代方案排除**：
- 保留中文但移除空格（如 `docs/3dev開發文件/`）— 仍有 Unicode 路徑問題，排除
- 完全只用數字（如 `docs/3/`）— 語意消失，排除

### 比賽資料與競品分析移至 `_external/`，不刪除

**理由**：比賽文件（簡報稿、作品說明書）和競品分析是「產品決策參考資料」，不是「系統怎麼運作的說明」。兩者性質不同，混在 `docs/` 會讓 AI 把比賽評審語言誤讀為系統規格。`_external/` 前綴的底線慣例（類似 `_archive`）表示「不是主要開發文件」。

**替代方案排除**：
- 移到 repo 根目錄的 `references/` — 路徑變長，沒有明顯好處
- 直接刪除 — 比賽文件有歷史價值，且競品分析仍有參考意義，不刪

### `archive/` 下的舊原型程式碼移至 `_external/archive/`

**理由**：`docs/2-general/archive/` 裡有 TypeScript 原型程式碼（`src/anomaly.ts` 等），這不是文件，是舊版實作。放在 `docs/` 裡會混淆「文件 = 說明系統」的定義。移到 `_external/archive/` 保留歷史，但排出開發文件主路徑。

### 補齊 `dev/architecture.md` 作為 AI Session 的首要讀取點

**理由**：AI 每次 session 開始都需要理解「這個系統是什麼、主要模組是哪些、資料流怎麼走」。目前沒有這份文件，導致 AI 要讀 5+ 個零散檔案才能重建上下文。`architecture.md` 讓 1 個檔案解決這個問題。

## Risks / Trade-offs

- **[風險] 移動檔案後現有 CLAUDE.md 路徑引用會失效** → 緩解：tasks 中明確列出需要更新 `CLAUDE.md` 路徑引用的步驟
- **[風險] `_external/` 命名對人類開發者不直覺** → 取捨：接受，因為機器可讀性優先，`docs/README.md` 會說明各目錄用途
- **[取捨] 不重寫文件內文** → 代表 `architecture.md` 需要從頭撰寫，內容品質取決於執行時的理解深度
