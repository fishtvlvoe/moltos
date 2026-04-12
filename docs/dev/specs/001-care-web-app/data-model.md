# Data Model: MOLTOS Care Web App

**Date**: 2026-04-02

> MVP 不使用資料庫。以下定義的是 TypeScript 型別，用於 API 傳輸和前端 state。

## Entities

### User (from NextAuth Session)

```typescript
interface User {
  id: string;              // Google sub ID
  name: string;            // 顯示名稱
  email: string;           // Gmail 地址
  image?: string;          // Google 大頭貼 URL
  accessToken: string;     // Google OAuth access token (server-side only)
  refreshToken: string;    // Google OAuth refresh token (server-side only)
}
```

### GmailMetrics

從 Gmail 元資料萃取的維度數據。Server-side 計算，只傳聚合結果到前端。

```typescript
interface GmailMetrics {
  /** 每日訊息量（收 + 發） */
  dailyCounts: DataPoint[];
  /** 每日平均回覆延遲（毫秒） */
  replyLatencies: DataPoint[];
  /** 每日深夜活躍分鐘數（23:00-05:00 的信件活動） */
  nightActivity: DataPoint[];
  /** 每日未讀信件數 */
  unreadCounts: DataPoint[];
  /** 資料涵蓋天數 */
  coverageDays: number;
  /** 最後更新時間 */
  lastUpdated: number;
}

// DataPoint 沿用 moltos-calm-index 的定義
interface DataPoint {
  timestamp: number;  // Unix ms
  value: number;
}
```

### CalmIndexSnapshot

平靜指數計算結果，直接使用 moltos-calm-index 的 `CalmIndexResult` 加上元資料。

```typescript
interface CalmIndexSnapshot {
  /** 計算結果（來自 calculateCalmIndex） */
  result: CalmIndexResult;
  /** 使用的 Gmail 資料涵蓋天數 */
  coverageDays: number;
  /** 是否為快取/離線資料 */
  isStale: boolean;
  /** 快照建立時間 */
  createdAt: number;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;              // 前端生成的 UUID
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;       // Unix ms
  isStreaming?: boolean;    // AI 回應串流中
}
```

### VideoSummary

```typescript
interface VideoSummary {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  publishedAt: string;     // ISO 8601
  summary?: string;        // AI 生成摘要（可能尚未生成）
  url: string;             // YouTube 影片連結
}
```

### DemoData (斷網備案)

```typescript
interface DemoData {
  user: Pick<User, 'name' | 'email' | 'image'>;
  gmailMetrics: GmailMetrics;
  calmIndex: CalmIndexSnapshot;
  videos: VideoSummary[];
  chatHistory: ChatMessage[];
}
```

## Entity Relationships

```
User (1) ─── has ──→ (1) GmailMetrics
User (1) ─── has ──→ (1) CalmIndexSnapshot
User (1) ─── has ──→ (*) ChatMessage
User (1) ─── has ──→ (*) VideoSummary

GmailMetrics ──→ feeds into ──→ CalmIndexSnapshot
CalmIndexSnapshot ──→ provides context for ──→ ChatMessage (AI responses)
```

## State Management

| 資料 | 儲存位置 | 生命週期 |
|------|---------|---------|
| User session | NextAuth server-side session | 登入後持續，token 過期自動 refresh |
| GmailMetrics | Server 記憶體快取 | 每次 Dashboard 載入重新計算，或使用快取（5 分鐘 TTL） |
| CalmIndexSnapshot | Server 記憶體快取 | 跟隨 GmailMetrics 更新 |
| ChatMessage | 前端 React state | 頁面重整即清空 |
| VideoSummary | Server 記憶體快取 | 每次 Dashboard 載入重新抓取，或使用快取（30 分鐘 TTL） |
| DemoData | 靜態 TypeScript 檔案 | 永久（編譯時打包） |
