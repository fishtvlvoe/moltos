## 1. 補齊 voice-conversation 測試（Signed URL generation before call；Post-call transcript stored via webhook；Emotion tags stripped before TTS playback）

- [x] 1.1 建立 `tests/api/elevenlabs-signed-url.test.ts`：覆蓋 Signed URL generation before call — 成功回傳 `{ url }` / 未授權回 401 / 缺 API key 回 500
- [x] 1.2 確認 `tests/api/elevenlabs-webhook.test.ts` 覆蓋 Post-call transcript stored via webhook 的四個 Scenario（空 transcript、部分失敗、invalid payload）
- [x] 1.3 建立 `lib/__tests__/elevenlabs.test.ts`：覆蓋 Emotion tags stripped before TTS playback — `[laughs]`、`[sighs]` 等標籤被去除，純文字不受影響
- [x] 1.4 建立 `tests/api/elevenlabs-call-lifecycle.test.ts`：覆蓋 Call session lifecycle management — connect/disconnect 狀態轉換

## 2. 補齊 text-conversation 測試（Chat agent connection and message dispatch；Chat messages stored to database；STT output converted）

- [x] 2.1 擴充 `tests/api/chat-agent.test.ts`：覆蓋 Chat agent connection and message dispatch — 訊息排隊等連線、連線後自動送出、空 AI 訊息不儲存
- [x] 2.2 擴充 `tests/api/chat-agent.test.ts`：覆蓋 Chat messages stored to database — user 和 AI 訊息寫入 DB，空白訊息不寫入
- [x] 2.3 建立 `tests/api/chat-history.test.ts`：覆蓋 Chat history retrieved per user — 已授權回傳訊息陣列、空 history 回傳 `[]`、未授權回 401
- [x] 2.4 建立 `lib/__tests__/speech.test.ts`：覆蓋 STT output converted from Simplified to Traditional Chinese — `开心` → `開心`，純英文不變

## 3. 補齊 calm-index 測試（Four Gmail dimensions extracted for calm index calculation；Calm index score computed as 0–100 integer；Calm index snapshot stored to database；Dashboard displays calm index visualization）

- [x] 3.1 確認 `lib/__tests__/calm-index-algo.test.ts` 覆蓋 Calm index score computed as 0–100 integer — score 在 0–100、level label 對應四個等級
- [x] 3.2 確認 `lib/__tests__/calm-index-bridge.test.ts` 覆蓋 Four Gmail dimensions extracted for calm index calculation — 14 天以下設 `dataInsufficient: true`，email body 不被請求
- [x] 3.3 建立 `tests/api/calm-index.test.ts`：覆蓋 Calm index snapshot stored to database — snapshot 寫入 DB，無 snapshot 時回 `{ score: null, level: null }`
- [x] 3.4 擴充 `tests/api/calm-index.test.ts`：覆蓋 Dashboard displays calm index visualization — 有 snapshot 回傳 score+level+dimensions，無資料回傳 null fields

## 4. 補齊 proactive-checkin 測試（AI sends a proactive greeting when chat loads；Silence detection triggers proactive outreach；AI responses are context-aware of user's life signals）

- [x] 4.1 確認 `lib/__tests__/gemini-prompts.test.ts` 覆蓋 AI responses are context-aware of user's life signals — 有 snapshot 時 prompt 含 score/level，無資料時 prompt 不含 `null`/`undefined`，time-of-day 包含在 prompt
- [x] 4.2 建立 `lib/__tests__/proactive-checkin.test.ts`：覆蓋 Silence detection triggers proactive outreach — 14 天沒互動設 `pending_checkin`，訊息不使用通用模板
- [x] 4.3 建立 `tests/api/chat-message.test.ts`：覆蓋 AI sends a proactive greeting when chat loads — 首次 session 觸發 greeting，內容隨時段變化，同 session 不重複

## 5. 安裝 coverage 工具並設定基線

- [x] 5.1 執行 `npm install -D @vitest/coverage-v8` 安裝 coverage 套件
- [x] 5.2 在 `vitest.config.ts` 加入 `coverage: { provider: 'v8', include: ['lib/**', 'app/api/**'], thresholds: { lines: 80 } }`
- [x] 5.3 執行 `npx vitest run --coverage` 確認 coverage 報告正常產生並達到 80% 行覆蓋率基線
