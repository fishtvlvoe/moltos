## 1. Supabase migration — 新增 call_sessions 表

- [x] 1.1 在 `supabase/migrations/` 新增 migration 檔（檔名格式：`YYYYMMDDHHMMSS_add_call_sessions.sql`），內容：`CREATE TABLE call_sessions (conversation_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'));`，並加上 `CREATE INDEX idx_call_sessions_expires ON call_sessions(expires_at);`
- [x] 1.2 執行 `supabase db push` 將 migration 套用到遠端 DB，確認 `call_sessions` 表建立成功

## 2. lib/db.ts — 新增 call_sessions CRUD 函數

- [x] [P] 2.1 在 `lib/db.ts` 新增 `saveCallSession(conversationId: string, userId: string): Promise<void>`：用 `supabase.from('call_sessions').upsert({ conversation_id: conversationId, user_id: userId, expires_at: new Date(Date.now() + 86400000).toISOString() })`
- [x] [P] 2.2 在 `lib/db.ts` 新增 `getCallSession(conversationId: string): Promise<string | null>`：查 `call_sessions` 表回傳 `user_id`，找不到回傳 `null`

## 3. 新增 /api/call-sessions API route

- [x] 3.1 建立 `app/api/call-sessions/route.ts`，實作 `POST` handler：(a) 用 `getServerSession(authOptions)` 驗證登入，未授權回 401；(b) 從 body 取 `{ conversationId }`，缺少則回 400；(c) 取 `session.user.id`（Google ID）作為 `userId`；(d) 呼叫 `saveCallSession(conversationId, userId)`；(e) 回傳 `{ ok: true }`
- [x] 3.2 為 `app/api/call-sessions/route.ts` 建立對應測試 `tests/api/call-sessions.test.ts`，覆蓋：已授權 POST 存入成功（mock saveCallSession 驗證被呼叫）、缺少 conversationId 回 400、未授權回 401

## 4. app/(app)/call/page.tsx — 通話建立後寫入 call_sessions

- [x] 4.1 在 `call/page.tsx` 的 `startCall()` 函數中，`await conversation.startSession(...)` 完成後，取得 `conversationId`（呼叫 `conversation.getId()` 或從 startSession 回傳值取得）；若取得成功，POST 到 `/api/call-sessions`，body 為 `{ conversationId }`；失敗只 `console.warn`，不阻斷通話

## 5. app/api/elevenlabs-webhook/route.ts — 改用 call_sessions 查詢 user_id

- [x] 5.1 在 webhook handler 中，取得 `conversation_id` 後，先呼叫 `getCallSession(conversation_id)`；若回傳非 null 的 `userId`，使用該值；若回傳 null 則 fallback 到現有邏輯（`rawUserId ?? voice:${conversation_id}`）。清理後刪除 call_sessions 記錄（`supabase.from('call_sessions').delete().eq('conversation_id', conversation_id)`）

## 6. app/(app)/chat/page.tsx — 加長輪詢等待時間

- [x] 6.1 修改 `pollForNewMessages()` 函數：將 `maxAttempts` 改為 10，等待間隔改為漸進退避陣列 `[1500, 1500, 2000, 2000, 3000, 3000, 4000, 4000, 5000, 5000]`（毫秒），每次取對應索引的值，累積等待上限約 31 秒；`setTimeout(poll, intervals[attempts - 1] ?? 5000)`

## 7. 本機整合測試

- [ ] 7.1 在本機執行完整語音通話流程（需使用 ElevenLabs 真實 Agent）：通話結束後確認 `call_sessions` 表有對應記錄 → Chat 頁面等待後自動顯示 transcript → Supabase `conversations` 表中該記錄的 `user_id` 為 Google ID（非 `voice:` 前綴）。**Debug 清單**：(a) 確認 `conversation.getId()` 在 `startSession` 完成後回傳正確 `conversation_id`；(b) 確認 `/api/call-sessions` POST 成功（Supabase dashboard 確認有新增記錄）；(c) 確認 ElevenLabs webhook 有打到 `/api/elevenlabs-webhook`（Vercel log 或 ngrok 確認）
- [x] 7.2 執行 `npm run test` 確認所有測試通過，無 regression

## 8. 語音通話中對話文字即時同步 Bug（2026-04-12 新增）

> **現象**：語音通話進行中，AI 語音與使用者對話文字會「瞬間跳回對話框」，疑似代碼設計問題或 iOS Safari 限制，導致無法即時顯示通話中的對話資訊。

- [x] 8.1 在 `call/page.tsx` 中確認即時 transcript 顯示邏輯：通話頁面不顯示即時文字（設計上只有音量視覺化），`@11labs/react` SDK 不暴露 messages 狀態，transcript 由 webhook 事後寫入 DB。此 task 不適用（N/A）
- [x] 8.2 不適用：通話頁面無 transcript state 可被 visibility change 重置。Task 9 的 hard reload 機制已解決資料新鮮度問題
- [x] 8.3 不適用：通話頁面不顯示 transcript，無跳回/消失問題。真機驗證併入 7.1

## 9. 通話結束後頁面行為調整 — 手動導航 + Hard Reload（2026-04-12 新增）

> **動機**：`onDisconnect` 目前自動 `router.push('/chat?from=call')` 後，頁面不會自動重整，需靠 polling 等待 webhook 資料，使用者常看到空白或舊資料。改為讓使用者**手動點擊底部「對話」tab**，觸發 `window.location.href = '/chat'` full reload，確保一進 chat 頁面即拿到最新資料。

- [x] 9.1 修改 `app/(app)/call/page.tsx`：在 `onDisconnect` callback 中，移除 `setTimeout(() => router.push('/chat?from=call'), 1000)` 這行；通話結束後保持在通話頁面（綠色按鈕重新出現，頁面回到 idle 狀態），讓使用者自行決定下一步
- [x] 9.2 修改 `components/layout/tab-bar.tsx`：在「對話」tab 的點擊處理中，新增判斷：若 `usePathname() === '/call'`，則執行 `window.location.href = '/chat'`（瀏覽器 full reload）而非 Next.js soft navigate；其餘頁面保持原本 `<Link>` 行為不變
- [ ] 9.3 測試標準：掛斷通話後，頁面停留在通話介面（綠色開始按鈕可見、不自動跳頁）→ 點擊底部「對話」tab → 瀏覽器 full reload 進入 `/chat` → 頁面載入後即顯示最新對話記錄，無需 polling 等待（需真機驗證，併入 7.1）
