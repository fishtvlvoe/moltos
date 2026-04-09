# ElevenLabs Conversational AI 整合規格

## 目標
QITC 決賽（2026-04-25）前，將語音通話從分段式架構（錄音→STT→LLM→TTS→播放，延遲 4-6 秒）遷移至 ElevenLabs Conversational AI（全雙工 WebSocket，延遲 ~500ms），實現「像真人對話」體感。

## 現有架構（待替換）
- STT：Groq Whisper（/api/stt/route.ts）
- LLM：Gemini 2.5 Flash（lib/gemini.ts chatStream）
- TTS：ElevenLabs REST API（/api/tts/route.ts, eleven_turbo_v2_5）
- 錄音：MediaRecorder + VAD（lib/recorder.ts）
- 播放：lib/speech.ts speak + speakWithInterrupt
- 逐句切割：lib/sentence-splitter.ts

## 新架構
- ElevenLabs Conversational AI SDK（@11labs/react useConversation hook）
- Custom LLM webhook 接 Gemini 2.5 Flash（保留小默人設 + 平靜指數）
- 全雙工 WebSocket，內建 STT + TTS + 打斷

## 技術規格

### 前端（call/page.tsx）
- 使用 useConversation() hook
- startSession({ agentId }) 在用戶按通話按鈕時觸發（iOS 音訊解鎖）
- endSession() 在掛斷時觸發
- 保留現有 UI：波浪動畫、狀態文字、掛斷按鈕
- 音量視覺化改接 SDK 的音量事件
- 狀態顯示：connecting → listening → speaking → idle

### 後端（Custom LLM Webhook）
- 新增 app/api/elevenlabs-webhook/route.ts
- 接收 ElevenLabs POST：{ conversation_id, history, query }
- 呼叫 buildSystemPrompt()（含平靜指數）
- 呼叫 Gemini 2.5 Flash 串流
- 回傳 SSE 串流給 ElevenLabs
- 異步存對話到 Supabase（saveMessage）

### 刪除的檔案/模組
- lib/recorder.ts（整個刪除）
- lib/sentence-splitter.ts（整個刪除）
- app/api/stt/route.ts（整個刪除）
- app/api/tts/route.ts（整個刪除）
- lib/speech.ts 大部分函式（只保留 initSharedAudioContext 簡化版）

### 保留的功能
- lib/gemini.ts: buildSystemPrompt()（人設 prompt）
- app/api/chat/route.ts: Supabase saveMessage 邏輯（搬到 webhook）
- UI 元件：波浪動畫、按鈕、狀態文字

### 環境變數
- ELEVENLABS_AGENT_ID（從 ElevenLabs 後台取得）
- 現有 ELEVENLABS_API_KEY 保留

### ElevenLabs Agent 設定（後台）
- 語言：zh-TW
- 聲音：待選定（Multilingual v2 支援中文的聲線）
- LLM：Custom LLM，webhook URL 指向 /api/elevenlabs-webhook
- First message：小默的開場問候

## 驗收標準
1. 通話延遲 < 1.5 秒（端到端）
2. iOS Safari/Chrome 正常運作
3. 小默人設完整保留（口語、台灣用語、平靜指數分級）
4. 對話存入 Supabase
5. npm test 全綠
6. 可錄製完美 demo 影片

## 退路
整合超過 2 天未完成 → 退回現有架構 + 極限優化（目標延遲 2-3 秒）
