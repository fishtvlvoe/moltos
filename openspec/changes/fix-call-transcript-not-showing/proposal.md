## Problem

語音通話結束後，系統跳回 Chat 頁面，但通話文字記錄（transcript）不會出現在對話框中。

具體行為：
- 用戶完成語音通話，`onDisconnect` 觸發 `router.push('/chat?from=call')`
- Chat 頁面偵測到 `?from=call` 後啟動 `pollForNewMessages()`
- 輪詢最多 7 次 × 1.5 秒 = 10.5 秒後放棄
- 即使 webhook 最終寫入成功，畫面也不會更新

## Root Cause

兩個問題同時存在，互相疊加：

**主因 — user_id 不匹配**：
ElevenLabs webhook payload 中，transcript 要用哪個 `user_id` 存入 DB，取決於 `conversation_initiation_client_data.dynamic_variables.user_id`。
- Call 頁面啟動時用 `dynamicVariables: { user_id: googleId }` 帶入 Google ID
- 但 ElevenLabs Agent 若未在 Dashboard 設定允許回傳 `dynamic_variables`，webhook payload 裡此欄位為空
- Webhook fallback 到 `voice:${conversation_id}` 作為 user_id 存入 Supabase
- History API 查詢時用的是 Google ID，兩者不符 → 永遠查不到這筆記錄

**次因 — 輪詢時間不足**：
`pollForNewMessages` 最多等 10.5 秒。ElevenLabs 的 post-call webhook 實際延遲可能達 15–30 秒，導致輪詢在 webhook 到達前就放棄。

## Proposed Solution

**Fix 1（主因）— 建立 call_sessions 對應表**：
在 `/api/elevenlabs-signed-url` 回傳 signed URL 前，在 Supabase 的 `call_sessions` 表中插入一筆 `(conversation_id → user_id)` 對應記錄。Webhook 收到後查此表取得正確的 Google ID，再用正確 user_id 存入 conversations。

**Fix 2（次因）— 加長輪詢等待時間**：
將 `maxAttempts` 從 7 次改為 20 次（30 秒上限），並採用漸進退避：1.5s、1.5s、2s、2s、3s、3s、5s... 讓 webhook 有足夠時間到達。

## Non-Goals

- 不改變 ElevenLabs Agent Dashboard 設定（不依賴 dynamic_variables 回傳）
- 不實作 webhook 的 HMAC 驗證（現有行為保持不變）
- 不改變 transcript 在 Chat 頁面的顯示格式

## Success Criteria

1. 語音通話結束後，等待最多 30 秒，Chat 頁面自動顯示本次通話的所有文字記錄
2. `conversations` 表中語音通話記錄的 `user_id` 與該用戶的 Google ID 一致
3. 重複通話時，每次的 transcript 都正確顯示（不混用其他 session 的記錄）
4. `call_sessions` 表在通話結束後自動清理（TTL 1 天）

## Impact

- Affected code:
  - `app/api/elevenlabs-signed-url/route.ts` — 呼叫前先寫入 call_sessions
  - `app/api/elevenlabs-webhook/route.ts` — 改從 call_sessions 查詢 user_id
  - `app/(app)/chat/page.tsx` — 加長 pollForNewMessages 等待時間
  - `lib/db.ts` — 新增 saveCallSession / getCallSession / deleteCallSession
  - Supabase migration — 新增 `call_sessions` 表（id, user_id, created_at, expires_at）
