# ElevenLabs Conversational AI 整合 — 分工表

**目標：** QITC 決賽（2026-04-25）前，把通話延遲從 4-6 秒降到 ~500ms，實現「像真人對話」體感
**日期：** 2026-04-08
**架構：** ElevenLabs Conversational AI（全雙工 WebSocket）取代現有 STT + LLM + TTS 分段式架構

---

## 代理能力表

| 代理 | 角色 | 能力範圍 | Token 成本 |
|------|------|---------|-----------|
| Opus | 指揮官 | 規劃、決策、派工、審核、跟用戶對話 | 高（只做決策） |
| Gemini CLI | 研究員 | 查外部文件、API 用法、技術比較 | 零（Gemini 免費額度） |
| Kimi | 分析師 | 3+ 檔案分析、架構理解、diff review | 零（Kimi MCP） |
| Sonnet #1 | 主力工程師 | 核心架構、SDK 整合 | 中 |
| Sonnet #2 | 測試工程師 | 紅燈測試撰寫 | 中 |
| Codex | 後端工程師 + 安全審核 | 獨立 API route + 安全驗證 | Codex 額度 |
| cursor-agent | UI 工程師 + 文件 | UI 調整、測試 fixture、spec/tasks | 零（本機） |
| Haiku | 雜務兵 | 型別定義、env 範本、設定檔、紀錄更新 | 低 |
| GitHub Copilot | 最終 CR | PR 自動 review | 訂閱內 |
| Chrome MCP | 驗收截圖 | 截圖驗證 UI | 零 |

---

## Phase 1 — 規劃（並行）

| 代理 | 任務 | 產出 |
|------|------|------|
| Opus | 跟用戶確認方向 | 方向決策 ✅ |
| Gemini CLI | 查 ElevenLabs Conversational AI 文件 + custom LLM webhook 接法 | 技術筆記 |
| Kimi | 分析現有 call/page.tsx + speech.ts，列出要改的檔案和函式 | 架構分析 |
| cursor-agent | 寫 spec.md + tasks.md | 規格文件 |

## Phase 2 — TDD 測試

| 代理 | 任務 | 檔案 |
|------|------|------|
| Sonnet #2 | 寫紅燈測試（ElevenLabs 連線、webhook、音訊播放） | tests/ |
| cursor-agent | 寫 mock fixture（假的 ElevenLabs response） | tests/fixtures/ |
| Kimi | review 測試覆蓋率 | — |

## Phase 3 — 實作（並行）

| 代理 | 任務 | 檔案 | 並行組 |
|------|------|------|--------|
| Sonnet #1 | SDK wrapper + 通話頁重構 | lib/elevenlabs.ts, call/page.tsx | A（串行） |
| Codex | custom LLM webhook route | app/api/elevenlabs-webhook/route.ts | B（並行） |
| cursor-agent | UI 狀態文字 + 動畫調整 | UI 元件 | C（並行） |
| Haiku | 型別定義 + env 範本 + 紀錄更新 | types/elevenlabs.d.ts, .env.example, today.md | D（並行） |

**並行規則：** 不同檔案可並行，同檔案必須串行。

## Phase 4 — Review（三層 CR）

| 層 | 代理 | 任務 |
|----|------|------|
| Layer 1 | Kimi | 全量 diff code review |
| Layer 2 | Codex | WebSocket 安全 + API Key 暴露檢查 |
| Layer 3 | GitHub Copilot | PR 自動 review（gh pr create 後觸發） |

## Phase 5 — 驗收

| 項目 | 方式 |
|------|------|
| 測試全綠 | npm test |
| UI 截圖 | Chrome MCP |
| 實機測試 | 用戶手機（iOS Safari/Chrome） |
| Demo 影片 | 錄製完美版備用 |

---

## 退路

如果 ElevenLabs Conversational AI 整合超過 2 天未完成 → 退回「保留現有架構 + 極限優化」：
- 靜音門檻 1200ms → 800ms
- STT 加速（Groq turbo）
- 逐句 TTS 確保首句最快出聲
- 目標延遲：2-3 秒（不完美但可接受）

---

## 時程

| 天數 | 做什麼 |
|------|--------|
| Day 1-2 | Phase 1-3（規劃 + 測試 + 實作） |
| Day 3 | Phase 4-5（Review + 驗收 + iOS 實測） |
| Day 4 | 錄製 demo 影片 |
| Day 5+ | buffer / 簡報準備 |

---

*決賽日：2026-04-25 | 剩餘 17 天*
