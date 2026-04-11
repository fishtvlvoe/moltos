# ElevenLabs 全功能調查報告

> 整理日期：2026-04-09 | 用途：評估 MOLTOS 是否全面遷移至 ElevenLabs

---

## 1. ElevenLabs 有什麼功能？

| 功能模組 | 支援 | 說明 |
|---------|------|------|
| Text-to-Speech (TTS) | ✅ | 核心功能，多模型，可串流 |
| Conversational AI Agent | ✅ | 文字 + 語音雙模式，整合 LLM |
| Speech-to-Text (STT) | ✅ | 獨立 Transcription API |
| 圖片生成 | ❌ | **沒有**，ElevenLabs 專注音訊 AI |
| 影片生成 | ❌ | 沒有 |

> **關鍵結論：圖片生成不在 ElevenLabs 範圍內，仍需 fal.ai 處理。**

---

## 2. Conversational AI Agent

### 支援的 LLM（可自由選擇）

| 廠商 | 模型 |
|------|------|
| OpenAI | GPT-4o, GPT-4o mini, GPT-3.5 Turbo |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku/Sonnet/Opus |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash |
| ElevenLabs 內建 | 有（速度最快，能力較弱） |

> **建議：MOLTOS 對話用 Claude 3.5 Haiku（快 + 夠聰明）或 Gemini 1.5 Flash（省錢），
> 取代現在直連 Gemini 的方式，統一走 ElevenLabs Agent。**

### 文字模式（text_only）

- 啟用方式：API 請求中關閉音訊串流，或設定 `output_format: 'text_only'`
- 效果：跳過 TTS + STT，純文字進出，延遲最低
- 上下文連續：同一個 Agent 可以在文字/語音間無縫切換，對話記憶共用

### 工具調用（Function Calling）

```json
{
  "tools": [
    {
      "name": "generate_image",
      "description": "用戶要求生成圖片時呼叫",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string", "description": "圖片描述" }
        },
        "required": ["prompt"]
      }
    }
  ]
}
```

> 這樣 Agent 自動判斷「用戶說幫我畫一張圖」→ 呼叫 `generate_image` → 我們後端呼叫 fal.ai。

### 知識庫（Knowledge Base）

- 可上傳 PDF / 文字檔，Agent 回答時自動引用
- 適合：MOLTOS 的照護指南、情緒支持資料庫

---

## 3. TTS 模型速度比較

| 模型 ID | 延遲 | 品質 | 中文支援 |
|---------|------|------|---------|
| `eleven_turbo_v2_5` | ~250ms | 高 | ✅ 繁中 |
| `eleven_multilingual_v2` | ~400ms | 最高 | ✅ 繁中 |
| `eleven_flash_v2_5` | ~75ms | 中 | ✅ 繁中 |

> **最快：`eleven_flash_v2_5`，75ms，適合即時對話感知。**

---

## 4. 定價

| 功能 | 計費 | 費率 |
|------|------|------|
| TTS | 每 1,000 字元 | $0.30（量大可降） |
| Conversational AI | 每分鐘 | $0.15/min |
| STT | 每分鐘 | 待確認 |
| 圖片（fal.ai FLUX Schnell） | 每張 | ~$0.003 |

### 免費方案額度

- TTS：10,000 字元 / 月
- ConvAI：10 分鐘 / 月
- **結論：免費額度很快用完，上線前需要升級方案（Starter $5/月起）。**

---

## 5. Node.js SDK

```bash
npm install elevenlabs
```

```typescript
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Agent 文字對話
// 透過 WebSocket SDK 建立對話
```

---

## 6. MOLTOS 現況 vs 目標架構

### 現況

```
用戶文字輸入 → /api/chat → Gemini chatStream → 回應
用戶語音 → ElevenLabs Agent → webhook → 存 Supabase
```

### 目標（全統一）

```
用戶文字輸入 → ElevenLabs Agent（text_only）→ 回應
用戶語音 → ElevenLabs Agent（語音模式）→ 回應
用戶說「幫我畫圖」→ Agent 呼叫 generate_image tool → fal.ai FLUX → 圖片 URL 插入回應
```

> 兩條路徑合一：同一個 Agent，上下文共享，體感一致。
