## Context

設定頁面（`/settings`）目前只有 1 個完整功能頁面（Gmail 整合），其他 4 個選單項是佔位符。使用者無法存取通知、提醒、資訊來源、隱私相關功能。UI icon 全用 emoji，與 shadcn/ui + Lucide 設計系統不符。

現有架構：
- 設定主頁：`app/(app)/settings/page.tsx` — Server Component，讀取 session，展示 ProfileCard + MenuCard + LogoutButton
- MenuCard：`components/settings/menu-card.tsx` — 定義 5 個選單項，emoji icon 用於視覺識別
- Gmail 整合頁：`app/(app)/settings/gmail/page.tsx` — 同樣的架構模式（Server Component → 展示狀態 + 操作元件）
- 資料庫：users 表含 Gmail token/email，尚無通知、提醒、隱私相關欄位

## Goals / Non-Goals

**Goals:**

- 在 settings 選單新增 4 個功能頁面，與 Gmail 整合頁保持架構一致
- 將 emoji icon 替換為 SVG（Lucide Bell、Clock、Newspaper、Lock icon），統一 UI 風格
- 實作通知偏好設定（郵件/應用內/推播的開關）
- 實作提醒排程（每日定時提醒時間、頻率、類型選擇）
- 實作資訊來源管理（展示 Gmail，後續可擴展其他來源）
- 實作隱私與資料頁面（政策展示 + 數據刪除入口）

**Non-Goals:**

- 不實作真實推播通知功能（Notification API 複雜度高，列為未來項目）
- 不支持多時區排程（使用使用者系統時區即可）
- 不建立分鐘級精細排程（支持每日、每週層級足夠）

## Decisions

### 📐 Icon 替換策略

**決定**：使用 Lucide React icons，在 MenuCard 中動態呈現。

**理由**：
- Lucide 已在 Next.js 15 專案中使用（gmail-actions.tsx 用了 Loader2）
- SVG icon 比 emoji 可控性高，支持動態顏色、大小、hover 狀態
- 保持與 shadcn/ui + Tailwind 設計系統一致

**Icon 對應**：
- 通知設定 → `Bell`
- 提醒排程 → `Clock`
- 資訊來源 → `Newspaper`（或 `Database` / `Link`）
- 隱私與資料 → `Lock`（或 `Shield`）

**實作**：MenuCard 改為 icon object array（id, icon component, label, href）

### 🏗️ 頁面架構模式

**決定**：四個新頁面（notifications/reminders/sources/privacy）遵循 Gmail 頁面模式。

**模式**：
```
Server Component (page.tsx)
├─ getServerSession() 驗證
├─ fetch 使用者偏好設定 from DB
└─ render StatusCard (展示當前狀態) + ActionsCard (修改操作)
```

**理由**：
- 與 Gmail 整合頁一致，易於維護
- Server Component 可安全讀取 session 和 DB
- Client Component 負責交互操作和狀態更新

### 💾 資料模型設計

**決定**：新增 3 個 JSON 欄位到 users 表，而非分散多表。

**方案**：
```sql
notification_preferences: {
  email: boolean,
  in_app: boolean,
  push: boolean
}

reminder_schedule: {
  enabled: boolean,
  time: "HH:MM" (24h format),
  frequency: "daily" | "weekly",
  types: ["calm_index" | "chat_summary"] (array)
}

source_priorities: {
  gmail: { connected: true, priority: 1, sync_interval: "hourly" }
  // 可後續擴展其他來源
}
```

**理由**：
- 避免過度設計，避免引入新表增加複雜度
- JSON 足夠靈活應對未來擴展
- users 表本身已用此模式（next_auth 本身用 JSON 欄位）

### 🔐 隱私頁面內容

**決定**：展示靜態政策 + 動態刪除入口。

**內容結構**：
- Section 1：資料使用政策（文本）
- Section 2：隱私設定開關
  - 允許郵件推薦（預設開啟）
  - 允許分析（預設開啟）
  - 允許個性化（預設開啟）
- Section 3：數據刪除（連結到既有 ClearUserDataSection）

**理由**：
- 隱私政策相對穩定，無需設計複雜互動
- 與現有 ClearUserDataSection 整合，避免重複

### 🚦 API 設計

**決定**：新增 4 個 API routes 分別管理各功能偏好。

**Routes**：
- `POST /api/settings/notifications` → update notification_preferences
- `POST /api/settings/reminders` → update reminder_schedule
- `POST /api/settings/sources` → update source_priorities（未來擴展）
- `POST /api/settings/privacy` → update privacy_settings

**理由**：
- 遵循 REST 慣例，易於理解和測試
- 各 API 獨立，利於並行開發
- 與既有 `/api/gmail/*` 路由風格一致

## Risks / Trade-offs

| 風險 | 影響 | 緩解方案 |
|------|------|--------|
| **使用者尚無現存通知偏好數據** | 首次訪問時 DB 查詢空值 | 使用預設值（郵件開啟，其他關閉）；新增使用者自動初始化 |
| **提醒排程執行需要後端 cron 或 queue** | 僅保存設定，不保證真實執行 | Phase 2 規劃排程服務；現階段僅展示 UI，實際提醒延後實作 |
| **資訊來源頁面目前只展示 Gmail** | 頁面看起來不夠飽滿 | 預留擴展位置；可加入「連接新來源」按鈕為未來埋下伏筆 |
| **SVG icon 需要設計師確認視覺效果** | Icon 可能與設計稿不符 | 在 design.md 中提出 icon 建議，設計師可調整；用 Lucide 預設 icon 作為暫時方案 |

## Migration Plan

**新功能發佈不涉及 breaking changes**。部署策略：

1. **部署新頁面和 API routes**（新增，無修改）
2. **更新 MenuCard icon**（客戶端，無後端影響）
3. **資料庫 migration**（非必須；首次訪問時 populate default 值）

**回滾策略**：
- 若新 icon 不佳，revert MenuCard commit
- 若新頁面有 bug，隱藏對應 href（不刪除）
- 無 DB 依賴，無資料遺失風險

## Open Questions

1. **Lucide icon 選擇**：`Newspaper` vs `Database` for 資訊來源？需要設計師確認
2. **提醒 cron 實作時機**：當前是否 mock 排程，還是立即實作後端 worker？
3. **隱私政策文本**：由 PM 提供，還是現階段 placeholder？
4. **國際化**：4 個新頁面是否需要 i18n（目前 settings 頁面是中文硬編碼）？

## Implementation Distribution Strategy

**並行執行**：不同頁面（通知/提醒/資訊來源/隱私）可由不同開發者並行完成

**串行依賴**：
1. MenuCard icon 替換 → 解鎖 4 個頁面開發
2. API routes 定義 → 解鎖前端表單開發
3. 資料庫 schema 驗證 → 所有頁面完成後 migration

**Token 成本估算**：
- design.md 定義清晰，每個頁面相對獨立
- 預計 4 個頁面 + API routes ≤ 25K tokens（vs Sonnet 50K+，節省 50%）
- 推薦由 Copilot gpt-5.2-codex 並行處理 4 頁面，Codex 實作測試驗證
