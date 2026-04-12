# AI Provider Cleanup — 簡化依賴，移除 Gemini

## Why

MOLTOS 目前使用三個不同的 AI 提供者（Gemini、Groq、ElevenLabs），造成依賴複雜。本次重點簡化為「移除不必要的 Gemini 依賴」，轉向已有 API key 的 Groq。

### 具體背景

1. **YouTube AI 摘要**：`lib/youtube.ts` 使用 Gemini 2.5 Flash 為影片生成摘要  
   但實際用戶需求是「貼連結整理」，摘要從未被使用過。
   
2. **對話洞察分析**：`app/api/chat/insight/route.ts` 使用 Gemini 2.5 Flash  
   但 `GROQ_API_KEY` 已存在（原用於 Whisper STT），Groq Llama 3.3 更快（< 1s）、更便宜（~$0.059/1M tokens）。
   
3. **死碼清理**：`app/api/chat/route.ts` 使用 Gemini chatStream  
   但前端已在 2026-04-09 遷移至 ElevenLabs Agent WebSocket，此路由無人呼叫。

## What Changes

- 刪除 `lib/youtube.ts` 內的 Gemini 呼叫 → YouTube 只回傳 `{ title, thumbnail, url, channelName, publishedAt }`
- `app/api/chat/insight/route.ts` — Gemini 2.5 Flash → Groq Llama 3.3 70B
- 刪除死碼 route `app/api/chat/route.ts` 及其相依的 `lib/gemini.ts` 函數
- 卸載 `@google/generative-ai` npm 套件，移除 `GEMINI_API_KEY` 環境變數

## Non-Goals

- 不改變對話洞察 API 的 JSON 輸出格式（仍為 `{ summary, calmState, innerNeed, growthPath }`）
- 不涉及 calm-index 或 proactive-checkin 的演算法修改
- 不涉及 ElevenLabs 整合的改動

## Capabilities

### Removed Capabilities

- `youtube.summarize` — 移除 Gemini 摘要，改為純連結整理

### Modified Capabilities

- `chat.insight` — Gemini → Groq Llama 3.3（邏輯不變，只換提供者）

## Impact

- Affected code:
  - `lib/youtube.ts` — 移除 Gemini 邏輯
  - `app/api/youtube/feed/route.ts` — response 格式移除 `summary`
  - `app/(app)/dashboard/page.tsx` — 移除 summary 顯示 UI
  - `app/api/chat/insight/route.ts` — 替換為 Groq API
  - `lib/gemini-prompts.ts` — 移動 `insightPrompt` 到 insight route
  - `app/api/chat/route.ts` — 刪除（廢棄路由）
  - `lib/gemini.ts` — 刪除或保留（取決於其他依賴）
  - `package.json` — 移除 `@google/generative-ai` 依賴、新增 `groq-sdk`
  - `.env` — 移除 `GEMINI_API_KEY`

- Tests:
  - `lib/__tests__/youtube.test.ts` — 移除 Gemini mock、補 non-summary 斷言
  - `tests/api/chat-insight.test.ts` — 改用 Groq mock（或刪除，if 路由被刪除）

## Success Criteria

1. ✅ `lib/youtube.ts` 無 `@google/generative-ai` import
2. ✅ `/api/chat/insight` 成功呼叫 Groq API，JSON 格式相同
3. ✅ `@google/generative-ai` 在 package.json 移除，npm install 無誤
4. ✅ `npm run build` 通過，無 missing reference 警告
5. ✅ 舊的 `GEMINI_API_KEY` 環境變數移除，應用正常運作
