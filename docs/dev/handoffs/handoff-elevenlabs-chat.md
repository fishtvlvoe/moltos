---
name: handoff-elevenlabs-chat
description: ElevenLabs Agent 文字對話整合，含 PWA、語音辨識簡繁轉換、對話記錄修復
type: project
---

# ElevenLabs Chat 整合 交接

**狀態：** 主要功能完成並 commit，branch ahead 1（尚未 push）
**日期：** 2026-04-09

## 做了什麼

### 核心功能
- **方案 B：文字對話遷移至 ElevenLabs Agent**（commit `5b41f1c`）
  - `chat/page.tsx` 改用 `@11labs/react` SDK 的 `useConversation`，純文字模式（不開麥）
  - 用 `sendUserMessage()` 送出用戶訊息，`onMessage` callback 接收 AI 回應
  - 保留 TTS 開關（`speak()` 播放 AI 回應語音）
  - 待連線訊息佇列（`pendingMessageRef`）— 未連線時送訊息會等連線後自動送出

### 修復項目
- 修復 session userId 空值導致對話存不進 DB（commit `b65674e`）
- 統一用 Google ID 存取對話（文字/語音記錄合併顯示）（commit `b67fbe3`）
- 掛斷後重新連線 + webhook debug log（commit `9aa3046`）
- STT 語音辨識輸出簡體 → 用 opencc-js 轉繁體（commit `56b3da0`）
- `@ts-ignore` 讓 opencc-js 順利 build（commit `03dae38`）

### 基礎設施
- PWA manifest、圖示、apple-touch-icon（commit `f9ea848`）
- 新增 `generate-image` API route（commit `5b41f1c` 附帶）
- 寫入參考文件：`docs/elevenlabs-api-reference.md`、`fal-ai-api-reference.md`、`elevenlabs-full-capability.md`

### 測試
- 新增 `tests/api/chat-agent.test.ts`（ElevenLabs Agent 整合測試）

## 還沒做的
- [ ] **push origin**（branch 目前 ahead 1，尚未推到 remote）
- [ ] **Call 對話內容進 Chat 頁面** — 語音通話（Call）結束後，對話內容尚未出現在 Chat 頁面（上個 session 用戶確認此問題存在）
- [ ] **`tsconfig.tsbuildinfo` 髒檔** — 目前 working tree 有這個 modified 檔，考慮加入 `.gitignore`
- [ ] 確認 ElevenLabs Agent webhook 的對話記錄流程是否完整（Call 路徑）

## 關鍵決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 文字對話架構 | 方案 B（ElevenLabs Agent SDK） | 方案 A（REST API）延遲高，方案 B 用 WebSocket 實時雙向 |
| 語音辨識簡繁 | opencc-js server-side 轉換 | STT（Google/ElevenLabs）輸出簡體，DB 統一存繁體 |
| 對話 ID 統一 | Google ID（非 session token） | session token 會換，Google ID 穩定，文字/語音記錄才能合併 |
| TTS | 保留開關，預設關 | 用戶可選，不強制播音 |

## 改了哪些檔案

```
app/(app)/chat/page.tsx               — ElevenLabs SDK 整合，重構文字對話
app/api/generate-image/route.ts       — 新增圖片生成 API
tests/api/chat-agent.test.ts          — 新增整合測試
docs/elevenlabs-api-reference.md      — ElevenLabs API 參考
docs/elevenlabs-full-capability.md    — ElevenLabs 能力說明
docs/fal-ai-api-reference.md          — fal.ai API 參考
tsconfig.tsbuildinfo                  — 自動產生（髒檔，建議加 .gitignore）
```

## 環境注意

- Branch: `001-care-web-app`
- ElevenLabs Agent ID 在 `.env.local`（`ELEVENLABS_AGENT_ID`）
- opencc-js 在 webhook server-side 使用，需確認 build 環境有正確安裝
