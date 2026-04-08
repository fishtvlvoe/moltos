# 語音通話升級計畫
**目標：** QITC 決賽（2026-04-25）前讓評審聽到自然人聲 + 對話不卡死
**日期：** 2026-04-07

---

## 一、凍結問題根因診斷

### 根因（已確認）

```
call/page.tsx line 99:
if (!userText.trim()) continue;   ← 靜默 continue，UI 永遠顯示「正在聆聽...」
```

**完整凍結流程：**
```
1. iOS webkitSpeechRecognition 啟動
2. 辨識不到語音（iOS 問題）→ 回傳空字串（不是 error，不會累計 consecutiveErrors）
3. if (!userText.trim()) continue  → 靜默跳回迴圈
4. setState('listening') 再次顯示「正在聆聽...」
5. 對用戶看起來：完全凍結，無限等待
```

**根因：** iOS Chrome/Safari 的 `webkitSpeechRecognition` 不可靠，無法持續回傳辨識結果。這是平台限制，無法用小修補解決。

---

## 二、方案比較

### 現有架構（有根本缺陷）
```
Web Speech API (STT) → Gemini streaming → Google WaveNet TTS
問題：iOS STT 不穩定 / WaveNet 聲音機械 / 整體延遲 5-8 秒
```

### 方案 A：ElevenLabs Conversational AI（推薦）⭐
```
ElevenLabs SDK (WebSocket)
├── STT: Deepgram（比 Web Speech API 穩定 10 倍）
├── LLM: 可接自訂 agent（連接我們的 Gemini / 小默人設）
└── TTS: ElevenLabs v3（目前最自然的中文 TTS）

延遲：~500ms（全雙工 WebSocket，說話時可打斷）
聲音：自然度業界第一，有呼吸感和情緒
費用：$5/月（含 30,000 字，足夠 demo）
iOS 支援：官方 SDK 原生處理所有 iOS 音訊限制
```

### 方案 B：OpenAI Realtime API（最快延遲）
```
OpenAI WebSocket Realtime API
├── STT: Whisper 內建
├── LLM: GPT-4o（無法換成 Gemini）
└── TTS: 內建 6 種聲線（alloy/shimmer 對中文最自然）

延遲：~300ms（最低）
聲音：自然，但不及 ElevenLabs
費用：~$2-3/月（10 分鐘）
限制：無法使用 Gemini，小默人設需遷移到 system prompt
```

### 方案 C：保留架構，換 STT + TTS（最低風險）
```
MediaRecorder (瀏覽器原生) → Whisper API (STT) → Gemini streaming → ElevenLabs TTS

STT 改法：
- 用 MediaRecorder 錄音（比 Web Speech API 穩定）
- 靜音偵測用 AudioWorklet（音量分析）
- 錄音檔送 OpenAI Whisper API 轉文字

TTS 改法：
- Google WaveNet → ElevenLabs Streaming TTS
- 支援逐句串流播放（延遲最低）

延遲：~1.5-2 秒（比現在好很多）
費用：Whisper $0.006/分鐘 + ElevenLabs $5/月
難度：中（改動 speech.ts + call/page.tsx）
```

---

## 三、推薦方案：A（ElevenLabs Conversational AI）+ C 備選

### 決策理由
- QITC demo 最重要的是「不卡死」和「聲音自然」
- ElevenLabs SDK 已處理所有 iOS 音訊問題，開箱即用
- 自訂 LLM agent 可以接入我們的 Gemini + 小默人設
- 費用極低（$5/月 免費試用就夠 demo）

---

## 四、實作計畫（方案 A）

### Phase 1：取得 ElevenLabs API Key 並測試聲音（30 分鐘）
```
1. 到 elevenlabs.io 註冊免費帳號（10,000 字/月免費）
2. 試聽中文聲音：
   - Rachel（自然女聲）
   - Aria
   - 或搜尋 Chinese/Mandarin voices
3. 找到最自然的台灣口音聲線
4. 記下 Voice ID
```

### Phase 2：建立 ElevenLabs Conversational Agent（1 小時）
```
1. 在 ElevenLabs 後台建立 Conversational AI Agent
2. System Prompt 輸入小默的人設（從現有 Gemini prompt 複製）
3. 設定語言：zh-TW
4. 選定聲線
5. 取得 Agent ID
```

### Phase 3：整合到 Next.js（2-3 小時）
```
安裝 SDK：
npm install @11labs/react

修改 app/(app)/call/page.tsx：
- 移除現有 Web Speech API + Gemini + Google TTS 邏輯
- 使用 useConversation() hook
- 保留現有 UI（wave animation、掛斷按鈕等）

修改 app/api/chat/route.ts（可選）：
- ElevenLabs 可以直接在 Agent 設定 webhook 呼叫我們的 /api/chat
- 讓小默的對話記憶、洞察分析功能繼續運作
```

### Phase 4：TDD 測試
```
新增測試：
- tests/api/elevenlabs.test.ts：API 連線測試
- 修改 tests/api/tts.test.ts：加入 ElevenLabs fallback 測試
```

---

## 五、方案 C 實作細節（備選，若 A 整合困難）

### STT 替換（MediaRecorder + Whisper）

**新增 app/api/stt/route.ts：**
```typescript
// 接收錄音 blob → 送 OpenAI Whisper → 回傳文字
POST /api/stt
Body: FormData { audio: Blob, language: 'zh' }
Response: { text: string }
```

**修改 lib/speech.ts：**
```typescript
// 新增 startRecording() / stopRecording() 函式
// 用 MediaRecorder 錄音 + AudioWorklet 靜音偵測
// 取代 listenUntilSilence()
```

### TTS 替換（ElevenLabs Streaming）

**修改 app/api/tts/route.ts：**
```typescript
// Google TTS → ElevenLabs Streaming
// 支援 text streaming，逐句播放延遲更低
```

---

## 六、費用總覽

| 服務 | 免費額度 | 付費方案 | 月費估算（MOLTOS） |
|------|---------|---------|-----------------|
| ElevenLabs TTS/Agent | 10,000 字/月 | $5/月 (30k字) | **$5** |
| OpenAI Whisper STT | 無 | $0.006/分鐘 | **~$0.06** |
| Google Cloud TTS | 1M字/月（現有） | 可繼續用或停掉 | $0 |
| Gemini LLM | 免費額度 | 依用量 | $0-1 |
| **合計** | | | **~$5-6/月** |

---

## 七、TDD 測試計畫

待實作時新增：
- [ ] `tests/api/stt.test.ts` — Whisper STT 端點測試
- [ ] `tests/api/elevenlabs.test.ts` — ElevenLabs TTS 端點測試
- [ ] `tests/utils/audio-recorder.test.ts` — MediaRecorder 邏輯測試

現有測試（已通過 102 個）保持不變。

---

## 八、風險與退路

| 風險 | 機率 | 退路 |
|------|------|------|
| ElevenLabs 中文聲音不夠自然 | 低 | 試多個 voice ID |
| ElevenLabs Agent 無法接 Gemini | 中 | 改用 OpenAI Realtime API |
| 整合時間不夠（決賽前） | 低 | 先用方案 C（更快上線）|

---

## 九、等你回來要做的決定

1. **ElevenLabs 還是 OpenAI Realtime？**（聲音 vs 延遲的取捨）
2. **是否用 ElevenLabs Agent 還是只用 ElevenLabs TTS？**（換全套 vs 只換聲音）
3. **你有 ElevenLabs 帳號嗎？** 如果沒有，需要你先去申請

---

*計畫完成日期：2026-04-07 | 決賽日：2026-04-25 | 剩餘 18 天*
