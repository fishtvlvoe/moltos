# Quickstart: MOLTOS Care Web App

## Prerequisites

- Node.js 20+
- Google Cloud 專案（啟用 Gmail API + YouTube Data API v3）
- Google OAuth 2.0 Client ID & Secret
- Gemini API Key

## Setup

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 API：
   - Gmail API
   - YouTube Data API v3
4. 設定 OAuth consent screen（External，Test mode）
5. 建立 OAuth 2.0 Client ID（Web application）
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. 取得 Gemini API Key：前往 [Google AI Studio](https://aistudio.google.com/)

### 2. 環境變數

```bash
cp .env.example .env.local
```

填入：
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=random-secret-string
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
```

### 3. 安裝與啟動

```bash
npm install
npm run dev
```

### 4. 開啟瀏覽器

```
http://localhost:3000
```

## Demo Flow

1. 歡迎頁 → 點「開始使用」
2. Google OAuth 授權（Gmail + YouTube）
3. Dashboard：看到平靜指數 + YouTube 摘要
4. Chat：跟 AI 對話
5. Settings：查看 Gmail 連接狀態

## Offline Mode

如果 API 不可用，系統自動 fallback 到 demo 資料。
也可在 URL 加上 `?demo=true` 強制使用 demo 模式。
