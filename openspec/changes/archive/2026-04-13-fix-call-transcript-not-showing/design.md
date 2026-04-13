## Context

現有的語音通話流程：
1. 前端 Call 頁面呼叫 `/api/elevenlabs-signed-url` 取得 signed URL
2. 用 `conversation.startSession({ signedUrl, dynamicVariables: { user_id: googleId } })` 建立通話
3. 通話結束後 ElevenLabs 非同步 POST `/api/elevenlabs-webhook`，payload 包含完整 transcript
4. Webhook 從 payload 的 `conversation_initiation_client_data.dynamic_variables.user_id` 取 user_id
5. 若 ElevenLabs 未回傳此欄位，fallback 到 `voice:${conversation_id}`

問題：ElevenLabs Agent 不保證將 `dynamicVariables` 原封不動回傳在 webhook payload，導致 fallback 啟動，user_id 與實際登入用戶的 Google ID 不符，Chat 頁面查詢不到該筆記錄。

## Goals / Non-Goals

**Goals:**

- 確保 webhook 存入的 transcript 能被正確的 user_id 查詢到
- 延長 Chat 頁面輪詢時間，容忍 ElevenLabs webhook 的延遲（最多 30 秒）
- 不依賴 ElevenLabs 的 dynamic_variables 回傳行為

**Non-Goals:**

- 不改變 transcript 顯示格式
- 不實作 webhook HMAC 驗證
- 不處理 ElevenLabs Dashboard 設定

## Decisions

### 決策 1：用 call_sessions 表橋接 conversation_id → user_id

**方案**：在 Supabase 新增 `call_sessions` 表：

```sql
CREATE TABLE call_sessions (
  conversation_id TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day'
);
```

**流程**：
- `/api/elevenlabs-signed-url` 呼叫時，ElevenLabs SDK 會回傳 `conversationId`（或在 `startSession` 回傳）
- 問題：`conversationId` 是在 `startSession()` 之後才拿到的（前端），後端 signed-url route 拿不到

**修正後流程**：
- `conversationId` 在前端 `startSession()` 完成後取得：`conversation.getId()` 或 `startSession()` 的回傳值
- 前端取得 `conversationId` 後，立即 POST 到新 API endpoint `/api/call-sessions`（帶 auth），後端驗證 session 後存入 `call_sessions`
- Webhook 收到時，用 `conversation_id` 查 `call_sessions` 取得正確 `user_id`

**替代方案（被排除）**：直接在 signed-url 回傳前生成預期的 conversation_id — ElevenLabs 不提供此功能。

### 決策 2：poll 改為漸進退避，上限 30 秒

```
嘗試次數: 1  2  3  4  5  6  7  8  9  10
等待間隔: 1.5 1.5 2  2  3  3  4  4  5  5  (秒)
累積時間: 1.5 3  5  7  10 13 17 21 26 31
```

超過 10 次後停止輪詢，不再等待。保留 UX 上的「載入中」指示器直到輪詢結束。

### 決策 3：call_sessions TTL 清理

`expires_at` 設為 1 天後，Supabase 定期用 pg_cron 清理過期記錄（或用 Row Level Security + trigger）。不在應用層實作清理邏輯。

## Risks / Trade-offs

| 風險 | 說明 | 對策 |
|------|------|------|
| `call_sessions` 寫入競態 | 前端 `startSession` 完成前 webhook 先到 | Webhook 查不到時 fallback 到 `voice:conversationId`（現有行為），不阻斷 |
| ElevenLabs 不回傳 `conversationId` | SDK 版本問題 | 記錄 warning，fallback 到舊邏輯，不 crash |
| call_sessions 洩漏 user_id | Supabase RLS 設定不當 | `/api/call-sessions` 強制 auth 驗證，RLS 限制只有 service_role 可讀 |
