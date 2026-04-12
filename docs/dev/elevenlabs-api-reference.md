# ElevenLabs API 開發參考

> 整理日期：2026-04-09 | 用途：MOLTOS 語音 AI 整合選型依據

---

## 1. Conversational AI / Agents（即時對話）

**架構**：WebSocket 雙向串流，整合 TTS + STT + LLM（可選 Gemini / GPT / Claude）

```
wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}
```

**取得 Signed URL（避免 agent_id 暴露在前端）**：
```
GET https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={agent_id}
Headers: xi-api-key: {API_KEY}
```

> MOLTOS 已實作：`/api/elevenlabs-signed-url` 路由，透過後端代理取得 signed URL。

---

## 2. Text-to-Speech API

**Streaming Endpoint**：
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
```

### 模型比較

| 模型 ID | 用途 | 延遲 | 語言支援 |
|---------|------|------|---------|
| `eleven_turbo_v2_5` | **推薦：速度/品質平衡** | ~250ms | 多語言含繁中 |
| `eleven_multilingual_v2` | 最高品質 | ~400ms | 多語言含繁中 |
| `eleven_monolingual_v1` | 英語專用 | ~200ms | 英語 |

**繁體中文/台灣國語**：`eleven_turbo_v2_5` 和 `eleven_multilingual_v2` 均支援，發音自然度高。

---

## 3. 定價

| 功能 | 計費方式 | 費率 |
|------|---------|------|
| TTS | 按字元 | $0.30 / 1k characters（企業更低） |
| Conversational AI | 按分鐘 | ~$0.05 / min（不含 LLM/TTS 用量） |
| LLM（自帶 key） | 依所選 LLM | 可帶入自己的 Gemini/GPT key |

---

## 4. Node.js / TypeScript SDK

```bash
npm install elevenlabs
```

```typescript
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// TTS 串流
const stream = client.textToSpeech.stream(voiceId, {
  text: '你好，我是你的摩托斯 AI 助理',
  model_id: 'eleven_turbo_v2_5',
});
```

---

## 5. MOLTOS 現況

MOLTOS 已有：
- `/api/elevenlabs-signed-url` — 取得 Conversational AI signed URL
- `/api/elevenlabs-webhook` — 接收對話事件 webhook
- `call/page.tsx` — 語音通話頁面

**待確認**：目前 Conversational AI 使用的 LLM 後端是 ElevenLabs 內建還是自帶 key？
建議查看 ElevenLabs Agent 後台設定。

---

## 6. 對話 LLM 選型建議

| 選項 | 速度 | 理解力 | 成本 | 適合 MOLTOS |
|------|------|--------|------|------------|
| ElevenLabs 內建 LLM | 快 | 中 | 含在分鐘費 | ✅ 對話感知類任務 |
| 自帶 Gemini Flash | 中 | 高 | 低 | ⚠️ 延遲稍高 |
| 自帶 Claude Haiku | 快 | 高 | 低 | ✅ 推薦替換選項 |
| 自帶 GPT-4o Mini | 快 | 高 | 低 | ✅ 備選 |

> 結論（待驗證）：若 MOLTOS 對話場景不需要深度推理，ElevenLabs 內建 LLM + `eleven_turbo_v2_5` 是最低延遲方案。
