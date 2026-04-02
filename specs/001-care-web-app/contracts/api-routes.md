# API Routes Contract

**Date**: 2026-04-02

## Authentication

### `GET /api/auth/[...nextauth]`

NextAuth.js 處理的 OAuth 流程。

- **Provider**: Google
- **Scopes**: `openid email profile gmail.readonly youtube.readonly`
- **Callback**: 授權成功後重導向到 `/dashboard`

## Gmail

### `GET /api/gmail/metrics`

從 Gmail 萃取維度數據。需要已認證的 session。

**Response 200**:
```json
{
  "dailyCounts": [{ "timestamp": 1711929600000, "value": 42 }],
  "replyLatencies": [{ "timestamp": 1711929600000, "value": 3600000 }],
  "nightActivity": [{ "timestamp": 1711929600000, "value": 15 }],
  "unreadCounts": [{ "timestamp": 1711929600000, "value": 23 }],
  "coverageDays": 20,
  "lastUpdated": 1711929600000
}
```

**Response 401**: `{ "error": "Unauthorized" }`
**Response 503**: `{ "error": "Gmail API unavailable", "fallback": true }` → 回傳 demo data

## Calm Index

### `GET /api/calm-index`

計算平靜指數。內部呼叫 `/api/gmail/metrics` 取得資料後計算。

**Response 200**:
```json
{
  "result": {
    "score": 72,
    "level": "mild",
    "dimensions": [...],
    "calculatedAt": 1711929600000,
    "alerts": [...]
  },
  "coverageDays": 18,
  "isStale": false,
  "createdAt": 1711929600000
}
```

## YouTube

### `GET /api/youtube/feed`

取得使用者訂閱頻道的最新影片。

**Query params**: `limit` (default: 5)

**Response 200**:
```json
{
  "videos": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "影片標題",
      "channelName": "頻道名",
      "thumbnailUrl": "https://i.ytimg.com/...",
      "publishedAt": "2026-04-02T10:00:00Z",
      "summary": "AI 生成的 2-3 句摘要",
      "url": "https://youtube.com/watch?v=..."
    }
  ]
}
```

## Chat

### `POST /api/chat`

與 Gemini AI 對話。使用 streaming response。

**Request body**:
```json
{
  "message": "使用者輸入的訊息",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**: `text/event-stream` (Server-Sent Events)

```
data: {"content": "你", "done": false}
data: {"content": "好", "done": false}
data: {"content": "！", "done": false}
data: {"content": "", "done": true}
```

**System Prompt 注入**:
Server 在呼叫 Gemini 時，自動注入使用者的平靜指數脈絡：

```
你是 MOLTOS Care，一個溫暖、有同理心的 AI 照護助理。
使用者目前的平靜指數為 {score}/100，等級為 {level}。
{alerts 描述}
請用繁體中文回應，語氣溫暖但不過度積極。
如果使用者的平靜指數偏低，用更溫柔的方式關心他。
```
