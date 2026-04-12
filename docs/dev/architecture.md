# Moltos — 系統架構

> 這份文件是 AI Session 的首要讀取點。讀完這份文件，應該能回答「這個系統是什麼、主要模組在哪、資料怎麼流動」。

---

## 系統概覽

**Moltos** 是一個主動守護心理健康的 AI 夥伴 Web App，核心主張是「把生活的噪音，變成你內心的聲音」。

與 ChatGPT、Woebot 等工具的差異：
- 不只是被動回應，而是**主動關心**用戶狀態
- 整合用戶的真實生活脈絡（Gmail、YouTube）
- 追蹤**平靜指數**（Calm Index），長期了解用戶的心理健康趨勢

**目前階段（001-care-web-app）**：Web App，核心功能為 AI 語音對話（Chat + Call）、情緒追蹤、洞察分析。

---

## Tech Stack

| 層級 | 技術 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Runtime | Node.js 20+ |
| UI | Tailwind CSS + shadcn/ui |
| 語音合成 / 對話 | ElevenLabs Conversational AI SDK |
| 文字 AI | Google Gemini (Flash / Pro) |
| 認證 | NextAuth.js (Google OAuth) |
| 資料庫 | Supabase (PostgreSQL) |
| 部署 | Vercel |
| 外部整合 | Gmail API、YouTube Data API |

---

## 主要模組

```
moltos/
├── app/                    # Next.js App Router 頁面 + API Routes
│   ├── api/
│   │   ├── auth/           # NextAuth session 處理
│   │   ├── chat/           # 對話管理（message / history / insight）
│   │   ├── calm-index/     # 平靜指數計算 API
│   │   ├── elevenlabs-signed-url/  # ElevenLabs 鑑權 URL 產生
│   │   ├── elevenlabs-webhook/     # ElevenLabs 對話結束後回呼
│   │   ├── generate-image/ # 圖像生成（fal.ai）
│   │   ├── gmail/          # Gmail 整合
│   │   └── youtube/        # YouTube 整合
│   ├── onboarding/         # 新用戶引導流程
│   └── (root page)         # 主儀表板
│
├── components/             # UI 元件
│   ├── chat/               # 對話 UI（ChatInterface、MessageBubble）
│   ├── dashboard/          # 儀表板元件（CalmIndex、Insights）
│   ├── layout/             # 頁面佈局（Sidebar、Header）
│   └── settings/           # 設定頁面元件
│
├── lib/                    # 核心業務邏輯
│   ├── gemini.ts           # Gemini API 呼叫封裝
│   ├── gemini-prompts.ts   # Gemini 系統提示詞
│   ├── elevenlabs.ts       # ElevenLabs API 封裝
│   ├── calm-index-bridge.ts # 平靜指數演算法銜接層
│   ├── supabase.ts         # Supabase 客戶端
│   ├── auth.ts             # NextAuth 設定
│   ├── gmail.ts            # Gmail API 封裝
│   ├── youtube.ts          # YouTube API 封裝
│   └── types.ts            # 共用 TypeScript 型別
│
└── types/                  # 全域型別定義
```

---

## 資料流

### Chat（文字對話）

```
用戶輸入訊息
    │
    ▼
POST /api/chat/message
    │
    ├── 讀取對話歷史 (Supabase)
    ├── 呼叫 Gemini API (lib/gemini.ts)
    │     └── 系統提示：lib/gemini-prompts.ts
    ├── 寫入回覆 (Supabase)
    └── 回傳 AI 回覆 → ChatInterface 渲染
```

### Call（語音對話，ElevenLabs Conversational AI）

```
用戶點擊「開始通話」
    │
    ▼
GET /api/elevenlabs-signed-url
    │  產生帶鑑權的 WebSocket URL（含 Agent ID）
    ▼
ElevenLabs SDK 建立 WebSocket 連線
    │  雙向語音串流（麥克風 ↔ ElevenLabs）
    ▼
通話結束
    │
    ▼
POST /api/elevenlabs-webhook（ElevenLabs 回呼）
    │  寫入對話紀錄 + 觸發洞察分析
    ▼
Supabase 儲存完整對話
```

### Calm Index（平靜指數）

```
對話完成 / 用戶主動更新
    │
    ▼
POST /api/calm-index
    │
    ├── 讀取近期對話情緒資料
    ├── lib/calm-index-bridge.ts 計算指數（0–100）
    └── 寫入 Supabase → Dashboard 顯示趨勢圖
```

---

## 外部服務依賴

| 服務 | 用途 | 關鍵檔案 |
|------|------|---------|
| ElevenLabs | 語音合成 + Conversational AI | `lib/elevenlabs.ts`, `app/api/elevenlabs-*` |
| Google Gemini | 文字對話 AI、洞察生成 | `lib/gemini.ts`, `lib/gemini-prompts.ts` |
| Supabase | 資料庫（對話紀錄、用戶資料、Calm Index） | `lib/supabase.ts`, `lib/db.ts` |
| Google OAuth | 用戶認證 | `lib/auth.ts` |
| Gmail API | 讀取用戶郵件（情境整合） | `lib/gmail.ts` |
| YouTube API | 讀取觀看紀錄（情境整合） | `lib/youtube.ts` |
| fal.ai | 圖像生成 | `app/api/generate-image` |

---

## 重要設計決策

詳細 ADR 見 `docs/dev/decisions/`。

- **為什麼選 ElevenLabs**：見 `decisions/001-elevenlabs-tts.md`
- **Session 策略**：NextAuth 使用 JWT strategy（middleware 保護路由要求）
- **TTS 情緒標籤過濾**：Gemini 回應中的情緒標籤（`[laughs]`、`[sighs]` 等）在送入 TTS 前必須過濾掉，避免念出來

---

## 環境變數

見 `.env.local`（本機）或 Vercel Dashboard（線上）。關鍵變數：

- `ELEVENLABS_API_KEY`、`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
- `GOOGLE_AI_API_KEY`（Gemini）
- `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`（OAuth）
- `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
