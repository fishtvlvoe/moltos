# 用戶主導資料刪除功能 — Tasks

## 1. Settings 頁面 UI — 新增刪除按鈕

- [ ] 1.1 在 `app/(app)/settings/page.tsx` 中新增「危險區域」section，顯示「刪除所有對話紀錄」按鈕（紅色背景 `bg-red-500` / 深紅文字）
- [ ] 1.2 點擊按鈕後顯示確認對話框（用 `shadcn/ui` Dialog）：標題「確認刪除」、內文「此操作無法復原，所有對話、分析、平靜指數歷史將被永久刪除」、兩個按鈕（取消 / 確認）
- [ ] 1.3 確認後呼叫 `DELETE /api/user/data`，顯示 loading 狀態；成功後顯示「已刪除」提示並重新整理，失敗時顯示錯誤訊息

## 2. 後端 DELETE API — `/api/user/data`

- [ ] 2.1 建立 `app/api/user/data/route.ts`，實作 `DELETE` handler：
  - 用 `getServerSession(authOptions)` 驗證登入，未授權回 401
  - 取 `session.user.id`（Google ID）或用戶 UUID 作為 `userId`
  - 呼叫 `deleteUserData(userId)` 函數（見 Task 2.3）
  - 成功回傳 `{ ok: true, message: '已刪除所有對話紀錄' }`，失敗回 500 + 錯誤訊息
- [ ] 2.2 為 `app/api/user/data/route.ts` 建立測試 `tests/api/user-data.test.ts`，覆蓋：已授權 DELETE 執行成功、未授權回 401、資料庫操作失敗回 500

## 3. 資料庫清除邏輯

- [ ] 3.1 在 `lib/db.ts` 新增 `deleteUserData(userId: string): Promise<void>` 函數：
  - 先從 `conversations` 表查詢該 `userId` 的所有 `conversation_id`（用於 ElevenLabs 刪除）
  - 刪除 `conversations` 表中該 `userId` 的所有記錄
  - 刪除 `conversation_insights` 表中該 `userId` 的所有記錄
  - 刪除 `calm_index_history` 表中該 `userId` 的所有記錄
  - 呼叫 `deleteElevenLabsConversations(conversationIds)` 刪除 ElevenLabs 端（見 Task 3.2）
  - 若任何步驟失敗，拋出 Error，由 API route 捕捉並回傳 500

## 4. ElevenLabs 刪除整合

- [ ] 4.1 在 `lib/elevenlabs.ts`（或 `lib/elevenlabs-api.ts` 新建）新增 `deleteElevenLabsConversations(conversationIds: string[]): Promise<void>`：
  - 用 `ELEVENLABS_API_KEY` 和 `fetch` 逐個呼叫 `DELETE /v1/convai/conversations/{conversation_id}`
  - 若單個刪除失敗，記錄 warning 但不中斷（其餘 conversation 繼續刪）
  - 所有嘗試完成後，若有部分失敗則拋出 Error：「ElevenLabs 部分對話刪除失敗，本地已清除」
  - 若全部成功則回傳 void
- [ ] 4.2 測試 ElevenLabs 刪除：用 mock 或 stub 模擬 ElevenLabs API，驗證正確的請求被發出

## 5. 整合測試

- [ ] 5.1 本機完整流程測試：
  - 登入後進設定頁，點「刪除所有對話紀錄」
  - 確認對話框彈出，點「確認」
  - 等待 loading 完成，確認「已刪除」提示顯示
  - 檢查 Supabase `conversations`、`conversation_insights`、`calm_index_history` 表，該用戶的記錄已清除
  - 檢查 Vercel log，確認 ElevenLabs DELETE 呼叫成功（或檢查 ElevenLabs 後台）
- [ ] 5.2 執行 `npm run test` 確認所有測試通過

## 6. 文件更新

- [ ] 6.1 在 `docs/dev/` 新增或更新「資料隱私」文件，說明：
  - 用戶可透過設定頁刪除所有對話紀錄
  - 刪除操作無法復原
  - 本地 + ElevenLabs 後台雙端刪除
  - 傳輸使用 HTTPS 加密（現況）
  - 資料庫加密計畫（後續迭代）
