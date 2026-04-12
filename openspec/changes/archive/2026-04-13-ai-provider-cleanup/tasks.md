# AI Provider Cleanup — Tasks

## 1. 移除 YouTube AI 摘要，簡化為純連結整理

> **動機**：`lib/youtube.ts` 使用 Gemini 2.5 Flash 為 YouTube 影片生成摘要，但用戶實際需求只是貼連結整理。移除 Gemini 依賴，改為只抓標題 + 縮圖 + 連結。

- [x] 1.1 修改 `lib/youtube.ts`：移除 `GoogleGenerativeAI` import、`GEMINI_MODEL` 常數、Gemini 呼叫區塊（step 5 的 `generateContent` 呼叫），讓函數只回傳 `{ title, thumbnail, url, channelName, publishedAt }`，不含 `summary` 欄位
- [x] 1.2 更新 `app/api/youtube/feed/route.ts`：確認 response 格式移除 `summary` 欄位，調整回傳型別
- [x] 1.3 更新 `app/(app)/dashboard/page.tsx`：移除顯示 `summary` 的 UI 區塊（若有）；卡片只顯示標題 + 縮圖 + 連結
- [x] 1.4 更新 `lib/__tests__/youtube.test.ts`：移除所有 `@google/generative-ai` mock 和 Gemini 相關測試案例；補上「無 summary 欄位」的斷言
- [x] 1.5 確認 `@google/generative-ai` 在移除後是否還被其他地方使用；若只剩 insight route 使用，保留 package，待 Task 2 完成後一起移除

## 2. 對話洞察分析：Gemini → Groq（Llama 3.3 70B）

> **動機**：`GROQ_API_KEY` 已在 `.env` 中（原用於 Whisper STT）。Groq 的 Llama 3.3 70B 比 Gemini 2.5 Flash 更快（< 1 秒）且更便宜（~$0.059/1M tokens），且已有 API key，無需額外申請。

- [x] 2.1 安裝 Groq SDK：`npm install groq-sdk`，確認 `package.json` 更新
- [x] 2.2 修改 `app/api/chat/insight/route.ts`：
  - 移除 `import { GoogleGenerativeAI }` 和 `GEMINI_MODEL` 常數
  - 改用 `import Groq from 'groq-sdk'`
  - 呼叫方式：`groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [...], response_format: { type: 'json_object' } })`
  - `GROQ_API_KEY` 已在環境變數中，直接使用
- [x] 2.3 測試：本機呼叫 `/api/chat/insight`，確認 JSON 回傳格式與原本相同（`summary`, `calmState`, `innerNeed`, `growthPath` 欄位存在）
- [x] 2.4 若 Groq 替換成功，且 Task 1 完成後 `@google/generative-ai` 無其他使用者，執行 `npm uninstall @google/generative-ai` 並移除 `GEMINI_API_KEY` 環境變數
- [x] 2.5 更新 `lib/gemini-prompts.ts`：`insightPrompt` 函數移到 insight route 或獨立的 `lib/insight-prompts.ts`，解除對 gemini 模組的耦合

## 3. 清除死碼：`/api/chat` 路由

> **現況**：`app/api/chat/route.ts` 使用 Gemini chatStream，但前端自 2026-04-09 起已遷移至 ElevenLabs Agent WebSocket，此路由不再被呼叫。

- [x] 3.1 確認 `app/api/chat/route.ts` 確實無任何前端或後端呼叫：`grep -rn "/api/chat'" app/ --include="*.ts" --include="*.tsx"` 結果中不應有直接 fetch 此路由的程式碼（`/api/chat/message`、`/api/chat/history`、`/api/chat/insight` 除外）
- [x] 3.2 刪除 `app/api/chat/route.ts`
- [x] 3.3 確認刪除後 `npm run build` 通過，無 missing reference 錯誤
- [x] 3.4 確認 `lib/gemini.ts` 的 `chatStream` 和 `generateGreeting` 函數是否還有其他呼叫者；若無，將 `lib/gemini.ts` 標記為候選刪除（在 Task 2 完成後一起處理）
