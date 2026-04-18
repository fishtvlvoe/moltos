## Context

**現況**：
- `users` 表已有 `reminder_schedule` 欄位（JSONB，含 `enabled/time/frequency/types`）和 `notification_preferences` 欄位（JSONB，含 `email/in_app/push` 布林值）
- 設定頁 `/settings/reminders` 和 `/settings/notifications` 可寫入上述欄位
- 無任何後端系統讀取這些欄位 → 設定不會生效

**限制**：
- 部署在 Vercel（Hobby 或 Pro 方案，cron 上限依方案不同）
- Next.js 15 App Router + Supabase（Postgres 15 + Auth）
- 用戶量初期 < 1000，單次 cron 執行應可在 60 秒內完成
- 尚無 email 發送基礎設施（無 Resend/SendGrid 等整合）
- iOS Safari 對 Web Push 支援受限（需 PWA 安裝），Android 支援較佳但仍需 VAPID + Service Worker

**Stakeholders**：
- 用戶：期待「設定了就會收到」的基本產品信任
- 開發者（fish）：避免假功能堆積、建立可擴展的通知基礎建設
- toSend 服務：外部依賴，需監控配額與可用性

## Goals / Non-Goals

**Goals:**

- 實現「reminder_schedule 真正生效」— 用戶設定 09:00 提醒，09:00 ± 1 小時內會收到 Email
- 建立站內通知基礎建設（`notifications` 表 + 列表頁 + 紅點），作為未來所有通知類型的統一通道
- toSend 整合抽象化為 lib，讓未來其他通知（對話摘要、主動關懷）可直接呼叫
- 失敗隔離：單一用戶發送失敗不影響其他用戶；toSend API 掛掉時降級為只寫站內通知
- 冪等性：cron 重複執行不會重複發送通知給同一用戶同一時段

**Non-Goals:**

- Web Push（iOS 相容性 + Service Worker 複雜度，留待後續）
- AI 對話摘要推送（需先有穩定摘要邏輯）
- 其他三個設定（notification_preferences 通道開關、source_priorities、privacy_settings）的後端生效
- 通知偏好的完整個人化（目前 `notification_preferences.email` 即使設為 false 仍會發送提醒；這是已知限制，MVP 不處理）
- Email 退訂連結、偏好中心、完整合規（CAN-SPAM / GDPR）
- Email 模板系統（react-email / MJML）— MVP 用純字串模板
- 通知的已讀狀態跨裝置同步（目前依賴 DB 寫入，已天然跨裝置）

## Decisions

### Decision 1: Email 服務選擇 — toSend（AWS SES 底層）

**選擇**：toSend（https://tosend.com）

**理由**：
- 用戶已明確指定
- AWS SES 底層，送達率穩定（官方聲稱 99.4%）
- 定價 $0.30 / 1000 封，適合規模化
- 提供 Node SDK、SMTP relay、REST API 三種整合方式
- 200 封免費額度可供 MVP 驗證

**Alternatives considered**：
- **Resend**：免費額度更高（3000/月），社群資源豐富 — 但用戶選定 toSend，尊重決策
- **SendGrid / Mailgun / AWS SES 直接整合**：功能更全，但 MVP 階段不需要進階功能，增加整合成本
- **Next.js 原生 nodemailer + Gmail SMTP**：免費但送達率差、容易被標為垃圾郵件、Gmail 每日額度低

### Decision 2: 排程方式 — Vercel Cron（每小時觸發）

**選擇**：Vercel Cron，`0 * * * *`（每小時整點），單一 endpoint `/api/cron/send-reminders`

**理由**：
- 與 Vercel 平台原生整合，設定只需 `vercel.json`，無外部依賴
- 每小時執行一次對 MVP 精度足夠（用戶設定 09:00 → 09:00 ± 1 小時內收到）
- 用戶 `reminder_schedule.time` 是 `HH:MM`，cron 於整點執行時比對「小時」即可
- Hobby 方案支援簡單 cron；如未來升級 Pro 可改為更密集排程

**Alternatives considered**：
- **Supabase pg_cron**：DB 層執行，延遲更低，但需寫 SQL function 呼叫外部 HTTP API，錯誤處理複雜
- **GitHub Actions**：免費但多一層依賴、觸發延遲大（分鐘級），監控整合較差
- **每分鐘 cron 精確匹配 `HH:MM`**：需 Pro 方案，MVP 階段不必要
- **讓用戶選定時區**：MVP 假設所有用戶為 `Asia/Taipei` UTC+8；未來跨國需擴充

### Decision 3: 發送條件判定 — 「當下小時匹配」

**選擇**：cron 於每小時整點觸發，篩選條件為 `reminder_schedule.enabled = true AND hour_of(reminder_schedule.time) = current_hour_in_taipei`

**理由**：
- 與 Decision 2 的每小時 cron 匹配
- SQL 可用 `EXTRACT(HOUR FROM ...)` 或字串 `SUBSTRING` 比對
- 簡單、可測試、冪等（搭配 Decision 4）

**Alternatives considered**：
- **容忍 ±30 分鐘**：增加匹配邏輯複雜度，MVP 不必要
- **讓用戶指定分鐘也精確執行**：需分鐘級 cron，成本與複雜度不符 MVP

### Decision 4: 冪等性機制 — notifications 表作為去重基準

**選擇**：每次 cron 執行前，先查 `notifications` 表當日該用戶該類型是否已存在紀錄，若有則跳過

**理由**：
- cron 可能因重試、手動觸發而重複執行
- 以 `(user_id, type, DATE(created_at))` 作為去重鍵，每日最多一筆同類型通知
- 不需額外 dedup table，利用既有資料模型

**Alternatives considered**：
- **Redis 分散式鎖**：MVP 階段不引入新基礎設施
- **用 Supabase advisory lock**：可行但增加 SQL 複雜度
- **不做冪等**：重複寄信體驗差，必須做

### Decision 5: 失敗隔離策略 — 每用戶獨立 try/catch + 降級寫入站內

**選擇**：迴圈處理每個符合條件的用戶時，個別 try/catch：
- toSend 成功 → 寫 notifications 表（含 `sent_via: 'email'`）
- toSend 失敗 → 只寫 notifications 表（含 `sent_via: 'in_app_only'`），記 log 不 throw
- 整個 cron endpoint 最終統計「成功/失敗 N 位用戶」回傳

**理由**：
- 單一用戶失敗不影響其他用戶（batch job 常見模式）
- toSend 掛掉時仍保證站內通知可用，降級而非全失敗
- 方便 Vercel Cron Logs 觀察

**Alternatives considered**：
- **失敗整批 rollback**：用戶少的失敗導致多數正常用戶收不到，負面影響大
- **異步 queue（如 Inngest / QStash）**：MVP 不必要，cron 同步處理即可

### Decision 6: notifications 資料表結構

**選擇**：

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- 'calm_reminder' | 未來擴充
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_via TEXT NOT NULL,          -- 'email' | 'in_app_only' | 'email+in_app'
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_type_date ON notifications(user_id, type, DATE(created_at));
```

**理由**：
- `type` 用字串不用 enum，方便未來擴充通知類型
- `sent_via` 紀錄實際發送通道，利於追蹤降級情況
- 兩個 index：一個服務「查未讀」，一個服務「冪等去重」
- `ON DELETE CASCADE` 避免用戶刪除後留孤兒資料

**Alternatives considered**：
- **用 enum type for `type`**：彈性差，每次新增類型要 migration
- **分拆 `delivery_log` 表**：MVP 不必要，發送紀錄和站內通知合一即可

### Decision 7: Cron endpoint 驗證 — `CRON_SECRET` header

**選擇**：`/api/cron/send-reminders` 檢查 `Authorization: Bearer $CRON_SECRET` header，vercel.json 設定 cron 時自動注入；非 Vercel 來源請求一律 401

**理由**：
- Vercel Cron 官方推薦的驗證機制
- 防止外部觸發惡意觸發重複寄信
- `CRON_SECRET` 是獨立環境變數，不與其他 secret 混用

**Alternatives considered**：
- **IP 白名單**：Vercel IP 會變動，不可靠
- **完全公開 endpoint**：安全風險

### Decision 8: Header 紅點元件 — 輪詢查未讀數

**選擇**：`<NotificationBadge />` 元件，掛在 `(app)/layout.tsx`，每 60 秒打一次 `GET /api/notifications?unread=true&count_only=true` 取得未讀數

**理由**：
- 無須 WebSocket / SSE 基礎設施（MVP 簡化）
- 60 秒精度對通知系統足夠（不是即時聊天）
- API 加 `count_only` 參數只回傳數字，輕量

**Alternatives considered**：
- **SWR / React Query 自動重取**：可以，但引入新依賴，MVP 先用 `useEffect + setInterval`
- **Supabase Realtime 訂閱**：需要 auth 層整合，MVP 不必要

## Risks / Trade-offs

- **[toSend 服務掛掉]** → 降級為僅站內通知（Decision 5），用戶仍可在 App 內看到；需監控 toSend 可用性、考慮未來加 Resend 備援
- **[寄信量爆增導致 toSend 配額超支]** → MVP 用量低（用戶數 × 每日最多 1 封）不太可能；未來加用戶數限制或升級方案
- **[時區假設為 Asia/Taipei]** → 國際化時失效；記入未來改進清單，UI 可先固定為台灣時區
- **[Vercel Cron Hobby 方案限制]** → Hobby 方案 Cron 每日最多 2 次，每小時 cron 需要 Pro 方案（$20/月）；部署前需確認方案，否則改為每日固定 2 次（如 09:00 / 20:00）
- **[notifications 表無限成長]** → 初期不處理，未來加每用戶保留 90 天或 100 筆的清理策略
- **[Header 輪詢造成伺服器負載]** → 60 秒一次 × N 用戶，MVP 用戶數少可承受；未來用戶 > 1000 再改 Realtime
- **[冪等去重用 DATE() 的時區問題]** → Postgres `DATE()` 預設 UTC，需改為 `DATE(created_at AT TIME ZONE 'Asia/Taipei')`，否則跨日邊界可能誤判
- **[Email 被標垃圾信]** → toSend 基於 AWS SES 送達率佳，但首次發送量大時可能觸發；MVP 用量低風險小，若觸發需配置 SPF/DKIM/DMARC（toSend 文件應有指引）

## Migration Plan

### 部署步驟

1. **建立 Supabase migration**：`notifications` 表 + 兩個 index
2. **本機執行 migration**：`supabase db push`
3. **安裝 toSend SDK**：`npm install <tosend-package>`（propose 階段後確認套件名）
4. **設定環境變數**（Vercel + 本機 `.env.local`）：`TOSEND_API_KEY`, `TOSEND_FROM_EMAIL`, `CRON_SECRET`
5. **部署預覽**（Preview branch）：驗證 cron endpoint 可被 Vercel Cron 正確呼叫、toSend SDK 可送信
6. **Production 部署**：merge 到 main
7. **首次驗證**：
   - 設一個測試用戶 `reminder_schedule.time = '<下一個整點>'`
   - 等待 cron 觸發
   - 確認 Vercel Cron Logs、用戶收到 Email、notifications 表有新紀錄

### 回滾策略

- **代碼層**：revert 到前一個 commit 即可，舊版本不讀 `reminder_schedule` 不會出錯
- **DB 層**：`notifications` 表為新增，不回滾仍相容；如需徹底清除可執行 `DROP TABLE notifications`
- **Cron 層**：移除 `vercel.json` 的 crons 陣列並重新部署

## Open Questions

- **toSend 確切 npm 套件名稱**：propose 階段無法確認，`tasks.md` 的實作任務需於實作時查文件確認；若 toSend 無官方 Node SDK，改用 REST API + fetch 實作（lib 抽象不受影響）
- **Vercel 方案確認**：目前 moltos-care 是 Hobby 還是 Pro？若 Hobby，每小時 cron 不可行，需改為 `0 9,20 * * *`（每日兩次）；這個決定影響 `vercel.json` 的 cron schedule，實作時需確認
- **Email 發件人地址**：`TOSEND_FROM_EMAIL` 要用什麼？需 Fish 於 toSend 驗證的 domain（如 `noreply@moltos.care`）
- **平靜指數數據來源**：提醒 Email 是否包含「今日平靜指數」數字？若包含需呼叫 `lib/calm-index`；若不包含只放固定文案更簡單。MVP 建議**只放固定文案**，避免引入額外 DB 查詢與計算，實作時可選
