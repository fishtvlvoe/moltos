# ADR 001: 選用 ElevenLabs 作為 TTS 與語音對話方案

**日期：** 2026-04
**狀態：** 已採用

---

## 背景

Moltos 的核心互動是「AI 夥伴語音對話」。需要一個能做到以下事情的服務：

1. 高品質語音合成（TTS），讓 AI 說話聽起來像真人，不是機器音
2. 即時語音對話（STT + LLM + TTS 的完整迴路），不需要自己串接三個服務
3. 能自訂 AI 角色的個性與說話風格（系統提示詞）
4. 支援繁體中文

---

## 考慮的選項

| 方案 | 優點 | 缺點 |
|------|------|------|
| **ElevenLabs Conversational AI** | 一站式（STT+LLM+TTS）、API 完整、SDK 成熟（`@11labs/react`）、聲音品質頂尖 | 成本較高、LLM 由 ElevenLabs 內部處理（較難換模型） |
| **OpenAI Realtime API** | GPT 模型強、生態熟悉 | 2026 初仍在 beta、延遲不穩定 |
| **自組（Whisper + Gemini + gTTS）** | 完全控制 | 延遲高（串接三個 API）、TTS 品質差、維護成本高 |
| **Google Cloud TTS** | 有中文支援、成本低 | 聲音品質不如 ElevenLabs、沒有 Conversational AI 迴路 |

---

## 決策

**選用 ElevenLabs**，理由如下：

1. **Conversational AI SDK 讓語音對話開發成本極低**：`useConversation` hook 處理 WebSocket、麥克風、音訊播放，不需要自己管理底層
2. **聲音品質是產品差異化**：Moltos 的 AI 夥伴需要讓用戶感覺「有溫度」，TTS 品質直接影響這個感知
3. **架構簡單**：Chat 和 Call 都走 ElevenLabs Agent，對話記錄由 webhook 統一寫入 Supabase

---

## 實作細節

- **Signed URL 流程**：前端先呼叫 `/api/elevenlabs-signed-url`，後端用 `ELEVENLABS_API_KEY` 產生帶鑑權的 WebSocket URL，前端用這個 URL 連接 Agent，不暴露 API Key
- **Webhook**：對話結束後，ElevenLabs 呼叫 `/api/elevenlabs-webhook`，後端寫入對話紀錄並觸發洞察分析
- **情緒標籤過濾**：Gemini 生成的文字有時含 `[laughs]`、`[sighs]` 等標籤，送入 TTS 前必須過濾，否則 ElevenLabs 會照念出來（見 `lib/gemini-prompts.ts`）
- **Chat 模式**：文字對話也透過 ElevenLabs Agent（`useConversation` + `sendUserMessage()`），而非直接呼叫 Gemini，讓 Chat 和 Call 共用同一套 Agent 邏輯

---

## 取捨

- ElevenLabs 的 LLM 不是 Gemini，Chat 模式目前是 ElevenLabs 自管 LLM + Gemini 洞察分析並行。若未來需要完全控制 LLM，需要評估 Custom LLM 方案
- 成本：ElevenLabs 按分鐘計費，需監控用量
