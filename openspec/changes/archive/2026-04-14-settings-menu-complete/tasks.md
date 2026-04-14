# Tasks: Settings Menu Complete

## 1. SVG Icon 替換 — MenuCard 改修 (實作 Icon 替換策略)

- [x] 1.1 [Tool: cursor] 實作「Settings menu displays navigation items with SVG icons」與「📐 icon 替換策略」：將 `components/settings/menu-card.tsx` 的 emoji icon 改為 Lucide SVG icon（Bell、Clock、Newspaper、Lock、Mail），遵循 Lucide React 元件樣式
- [x] 1.2 [Tool: cursor] 實作「Menu items are navigable to their respective pages」：為 MenuCard 新增 href 支持，使通知/提醒/資訊來源/隱私四項導向 `/settings/notifications`、`/settings/reminders`、`/settings/sources`、`/settings/privacy`
- [x] 1.3 [Tool: cursor] 實作「Menu items maintain visual consistency with Gmail settings」：驗證分隔線、hover 狀態、icon 大小 (24px) 與現有 Gmail 選單一致
- [x] 1.4 [Tool: cursor] 實作「Icon styling consistency」和「Touch target size」：驗證行動設備上 icon 大小 (24px)、顏色、可觸及性（最小 44×44px 觸達目標）
- [x] 1.5 [Tool: codex] 撰寫 MenuCard 元件測試，驗證所有 5 個 menu item 的 SVG icon 正確呈現、href 正確導向

## 2. 通知設定頁面實作 (實作頁面架構模式、資料模型設計、API 設計)

- [x] 2.1 [Tool: cursor] 建立 `app/(app)/settings/notifications/page.tsx` (Server Component)，遵循「🏗️ 頁面架構模式」：getServerSession → fetch notification_preferences from DB (JSON) → 傳遞給 status + controls 元件，架構與 Gmail 頁面一致
- [x] 2.2 [Tool: cursor] 建立 `components/settings/notification-status.tsx` (Server Component)，實作「User can view notification preferences」：展示當前三個通知頻道的開啟/關閉狀態（郵件、應用內、推播）
- [x] 2.3 [Tool: cursor] 建立 `components/settings/notification-controls.tsx` (Client Component)，實作「User can toggle notification channels」：含三個獨立的 toggle switch、loading state、error toast 處理
- [x] 2.4 [Tool: copilot-gpt5] 實作「🚦 API 設計」與「Notification preferences affect system behavior」：建立 `POST /api/settings/notifications` route（遵循 REST 慣例），接收 { channel, enabled } payload，驗證 channel 值，更新 users.notification_preferences JSON，確保此偏好設定會影響系統行為（trigger notification 時檢查偏好），返回 { success, error } 與 HTTP 狀態碼
- [x] 2.5 [Tool: cursor] 實作「Page follows consistent UI pattern」：確保通知頁面有返回按鈕、"通知設定" 標題、status card + controls card 的 Gmail 頁面相同架構
- [x] 2.6 [Tool: codex] 撰寫通知頁面和 API 測試，驗證三個 channel 獨立 toggle、error handling、toggle 失敗時恢復之前狀態

## 3. 提醒排程頁面實作 (實作頁面架構模式、資料模型設計、API 設計)

- [x] 3.1 [Tool: cursor] 建立 `app/(app)/settings/reminders/page.tsx` (Server Component)，遵循「🏗️ 頁面架構模式」：fetch reminder_schedule JSON from DB、顯示預設值（disabled、09:00、daily、[calm_index]），架構與 Gmail 頁面一致
- [x] 3.2 [Tool: cursor] 建立 `components/settings/reminder-status.tsx`，實作「User can view reminder schedule」：展示當前排程的 enabled 狀態、時間、頻率、選中的類型
- [x] 3.3 [Tool: cursor] 建立 `components/settings/reminder-form.tsx` (Client Component)，實作「User can enable/disable reminders」、「User can set reminder time」、「User can select reminder frequency/content types」：含 enabled toggle、時間選擇器、頻率下拉、類型 checkbox
- [x] 3.4 [Tool: cursor] 實作「User can set reminder time」的輸入驗證：時間選擇器只允許 00:00-23:59 有效值，無效時顯示錯誤訊息
- [x] 3.5 [Tool: cursor] 實作「User can select reminder content types」和「User can select reminder frequency」的驗證：checkbox for calm_index 和 chat_summary，當所有 reminder content types 都未選中時，顯示警告「Please select at least one reminder type」，禁止保存
- [x] 3.6 [Tool: copilot-gpt5] 實作「🚦 API 設計」：建立 `POST /api/settings/reminders` route，接收 { enabled, time, frequency, types: ["calm_index"|"chat_summary"] }，驗證 time 格式 (HH:MM)，更新 users.reminder_schedule JSON，返回 success/error
- [x] 3.7 [Tool: cursor] 實作「Page follows consistent UI pattern」：確保提醒頁面有返回按鈕、"提醒排程" 標題、status card + form card 的 Gmail 頁面相同架構
- [x] 3.8 [Tool: codex] 撰寫提醒頁面和 API 測試，驗證 enabled toggle、時間驗證、頻率選擇、類型選擇邏輯

## 4. 資訊來源頁面實作 (實作頁面架構模式、資料模型設計、API 設計)

- [x] 4.1 [Tool: cursor] 建立 `app/(app)/settings/sources/page.tsx` (Server Component)，遵循「🏗️ 頁面架構模式」：fetch source_priorities JSON 和 Gmail token 連接狀態，顯示 Gmail 為已連接來源，架構與 Gmail 頁面一致
- [x] 4.2 [Tool: cursor] 建立 `components/settings/sources-list.tsx`，實作「System displays connected information sources」和「User can view source connection status」：列出 Gmail、顯示連接狀態（Connected/Disconnected/Pending Authorization）、帳號資訊
- [x] 4.3 [Tool: cursor] 建立 `components/settings/source-config.tsx` (Client Component)，實作「User can manage source priority」和「User can set source sync frequency」：優先順序輸入、同步頻率下拉（hourly/daily/on-demand）
- [x] 4.4 [Tool: copilot-gpt5] 實作「🚦 API 設計」：建立 `POST /api/settings/sources` route，接收 { source, priority, sync_interval }，驗證 sync_interval (hourly|daily|on-demand)，更新 users.source_priorities JSON，返回 success/error
- [x] 4.5 [Tool: cursor] 實作「User can disconnect a source」的確認對話：點擊 Disconnect 顯示警告對話「確定要解除 Gmail 綁定嗎？平靜指數歷史將保留」
- [x] 4.6 [Tool: cursor] 實作「Page follows consistent UI pattern」：確保資訊來源頁面有返回按鈕、"資訊來源" 標題、sources-list + source-config 的 Gmail 頁面相同架構
- [x] 4.7 [Tool: codex] 撰寫資訊來源頁面和 API 測試，驗證 disconnect 邏輯、優先順序更新、同步頻率設定

## 5. 隱私與資料頁面實作 (實作頁面架構模式、隱私頁面內容、資料模型設計、API 設計)

- [x] 5.1 [Tool: cursor] 建立 `app/(app)/settings/privacy/page.tsx` (Server Component)，遵循「🏗️ 頁面架構模式」：fetch privacy_settings JSON from DB，傳遞給隱私元件，架構與 Gmail 頁面一致
- [x] 5.2 [Tool: cursor] 建立 `components/settings/privacy-policy.tsx`，實作「System displays data usage policy」與「🔐 隱私頁面內容」中的「Section 1：資料使用政策」：展示靜態隱私政策文本（email data、conversation history、calm index data、usage analytics），在 scrollable section 中展示完整政策
- [x] 5.3 [Tool: cursor] 建立 `components/settings/privacy-toggles.tsx` (Client Component)，實作「🔐 隱私頁面內容」中的「Section 2：隱私設定開關」和「System provides privacy preference toggles」：個性化/分析/推薦三個獨立 toggle，預設開啟
- [x] 5.4 [Tool: copilot-gpt5] 實作「🚦 API 設計」：建立 `POST /api/settings/privacy` route，接收 { personalization, analytics, recommendations }，更新 users.privacy_settings JSON，返回 success/error
- [x] 5.5 [Tool: cursor] 實作「🔐 隱私頁面內容」中的「Section 3：數據刪除」和「User can delete personal data」：整合既有 `ClearUserDataSection` 元件到隱私頁面 Danger Zone 區域，使用現有 delete API
- [x] 5.6 [Tool: cursor] 實作「Data deletion is integrated with existing clear data function」：確保隱私頁的 delete 按鈕呼叫相同的後端邏輯、顯示相同的成功訊息
- [x] 5.7 [Tool: cursor] 實作「Page follows consistent UI pattern」：確保隱私頁面有返回按鈕、"隱私與資料" 標題、policy card + toggles card + danger zone 的 Gmail 頁面相同架構
- [x] 5.8 [Tool: codex] 撰寫隱私頁面測試，驗證 toggle 邏輯、數據刪除整合、刪除成功後的狀態

## 6. 資料庫 Schema 更新 (實作資料模型設計)

- [x] 6.1 [Tool: copilot-gpt5] 實作「💾 資料模型設計」：檢查 users 表現有欄位，確認以下 JSON 欄位存在或可新增（無需 migration，若不存在用預設值）：
  - `notification_preferences`: { email, in_app, push }
  - `reminder_schedule`: { enabled, time, frequency, types }
  - `source_priorities`: { gmail: { connected, priority, sync_interval } }
  - `privacy_settings`: { personalization, analytics, recommendations }
- [x] 6.2 [Tool: codex] 建立必要的 Supabase migration（若欄位不存在）
- [x] 6.3 [Tool: codex] 驗證 migration 成功部署到測試環境

## 7. 整合與跨頁面一致性驗證

- [x] 7.1 [Tool: kimi] Code review：4 個新頁面的架構是否與 Gmail 頁面一致（ref: Page follows consistent UI pattern）
- [x] 7.2 [Tool: cursor] 驗證所有頁面的返回按鈕、標題、卡片佈局一致
- [x] 7.3 [Tool: cursor] 行動設備完整驗證（4 個新頁面 + MenuCard 改修）
- [x] 7.4 [Tool: codex] 完整端到端測試：從主設定頁導航到各功能頁面，修改設定，確認 API 正確更新

## 8. Icon 設計確認

- [x] 8.1 [Tool: cursor] 提交 Lucide icon 候選（Bell、Clock、Newspaper/Database、Lock、Mail）給設計師確認
- [x] 8.2 若設計師要求調整，更新 MenuCard icon 定義

## 9. 文件和發佈準備

- [x] 9.1 [Tool: copilot-gpt5] 撰寫 API 文件（endpoint 定義、payload 例子、error code）
- [x] 9.2 [Tool: cursor] 確認所有新頁面有合理的 error state 和 loading state
- [x] 9.3 [Tool: codex] 執行完整測試套件（npm test），確認所有單元測試和整合測試通過
- [x] 9.4 [Tool: codex] 部署到預發佈環境（Vercel preview），進行最後驗收

## 備註

**並行執行策略**：
- Tasks 2-5（四個頁面實作）可由不同開發者並行執行
- Task 1（MenuCard icon）應優先完成，解鎖四個頁面的導航
- Tasks 6-9（DB + 整合 + review）串行於頁面實作之後

**角色分配**：
- **cursor-agent**：所有 UI 元件（page、card、form）
- **copilot-gpt5**：API routes 和業務邏輯
- **codex**：測試驗證和 DB migration
- **kimi**：最後 code review（3+ 檔案）
