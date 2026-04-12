# 用戶主導資料刪除功能 — Proposal

## 問題

用戶目前無法主動清除自己在 MOLTOS 中的對話紀錄和分析資料。歐盟 GDPR、各國隱私法都要求用戶有「被遺忘權」（right to erasure），用戶應能隨時清除自己的個人資料，且系統應不留痕跡。

## 方案

在設定頁新增「清除所有對話紀錄」功能，讓用戶一鍵刪除：

1. **本地資料庫清除**
   - `conversations` 表 — 所有對話訊息
   - `conversation_insights` 表 — AI 生成的洞察分析結果
   - `calm_index_history` 表 — 平靜指數歷史分數

2. **遠端 ElevenLabs 清除**
   - 呼叫 ElevenLabs `DELETE /v1/convai/conversations/{conversation_id}` API，清除 ElevenLabs 後台的對話記錄

3. **刪除確認流程**
   - 設定頁顯示「刪除所有對話紀錄」按鈕（紅色警告按鈕）
   - 點擊後顯示確認對話框：「此操作無法復原，所有對話、分析、平靜指數歷史將被永久刪除」
   - 使用者確認後執行刪除

## 資安設計

**傳輸加密**：已內建（HTTPS + TLS）

**資料庫加密**（後續迭代）：
- 計畫在下一版本實作欄位級加密（`conversations.content` AES 加密）
- 本版本先確保刪除機制完整、不留痕跡

**刪除保證**：
- Supabase `DELETE` 是硬刪除（非軟刪除），執行後資料消失無法恢復
- ElevenLabs API 確認刪除成功後，才視為完全清除

## 實作順序

1. Settings 頁面 UI — 加刪除按鈕 + 確認對話框
2. 後端 DELETE API — `/api/user/data`
3. ElevenLabs 整合 — 查詢所有 conversation_id，逐個刪除
4. 測試 + 文件
