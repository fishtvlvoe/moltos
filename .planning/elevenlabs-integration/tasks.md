# ElevenLabs Conversational AI 整合 — 任務清單

## Phase 1 — 規劃 ✅
- [x] 方向決策：選定 ElevenLabs Conversational AI
- [x] Gemini 研究：SDK 用法、custom LLM webhook 接法、iOS 限制、費用
- [x] Kimi 分析：現有架構改動範圍，列出保留/刪除/改寫清單
- [x] 撰寫 spec.md + tasks.md

## Phase 2 — TDD 測試
- [ ] [Sonnet #2] 寫 ElevenLabs webhook 紅燈測試（tests/api/elevenlabs-webhook.test.ts）
  - 測試 POST 接收格式正確
  - 測試呼叫 Gemini + 回傳 SSE 串流
  - 測試 Supabase saveMessage 異步存檔
- [ ] [cursor-agent] 寫 mock fixture（tests/fixtures/elevenlabs-request.json）
- [ ] [Kimi] review 測試覆蓋率

## Phase 3 — 實作
### Wave A（並行）
- [ ] [Sonnet #1] 建立 lib/elevenlabs.ts — SDK wrapper + 型別定義
- [ ] [Codex] 建立 app/api/elevenlabs-webhook/route.ts — Custom LLM webhook
- [ ] [Haiku] 建立 types/elevenlabs.d.ts — 型別定義
- [ ] [Haiku] 更新 .env.example — 加 ELEVENLABS_AGENT_ID

### Wave B（等 Wave A 完成）
- [ ] [Sonnet #1] 改寫 app/(app)/call/page.tsx — 接 useConversation() hook
- [ ] [cursor-agent] 調整通話 UI 狀態文字和動畫

### Wave C（清理）
- [ ] [Sonnet #1] 刪除不再需要的檔案：recorder.ts, sentence-splitter.ts, api/stt, api/tts
- [ ] [Sonnet #1] 清理 lib/speech.ts（只留 iOS 音訊解鎖）
- [ ] [Sonnet #1] 清理 lib/gemini.ts（移除 chatStream，保留 buildSystemPrompt）
- [ ] [Haiku] 更新 package.json — 移除不需要的依賴，加 @11labs/react

### Wave D（測試修復）
- [ ] [Sonnet #2] 修復因刪除檔案導致的測試失敗
- [ ] [Sonnet #2] 確保 npm test 全綠

## Phase 4 — Review
- [ ] [Kimi] Layer 1: 全量 diff code review
- [ ] [Codex] Layer 2: WebSocket 安全 + API Key 暴露檢查
- [ ] [GitHub Copilot] Layer 3: PR 自動 review

## Phase 5 — 驗收
- [ ] npm test 全綠
- [ ] Chrome MCP 截圖驗證通話 UI
- [ ] iOS 實機測試（用戶手機）
- [ ] 錄製 demo 影片（決賽備用）

## 前置條件（用戶操作）
- [ ] 在 ElevenLabs 後台建立 Conversational AI Agent
- [ ] 設定 Agent 語言、聲音、Custom LLM webhook URL
- [ ] 取得 Agent ID 填入 .env
