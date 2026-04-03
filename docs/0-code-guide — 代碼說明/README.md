# MOLTOS Care Web App — 代碼說明

## 啟動方式

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數（複製 .env.example 改名 .env，填入 Google OAuth + Gemini API Key）
cp .env.example .env

# 3. 啟動開發伺服器
npm run dev
# → http://localhost:3000

# 4. 跑測試
npm test

# 5. 產品建置
npm run build
```

## Demo 模式（不需登入/不需網路）

```
http://localhost:3000/dashboard?demo=true
```

## 部署

```bash
vercel --prod
```

Production URL: https://moltos-care.vercel.app

## 代碼結構

```
根目錄/
├── app/                        ← 頁面路由（Next.js App Router）
│   ├── (app)/                  ← 有底部 TabBar 的頁面
│   │   ├── chat/page.tsx       ← AI 對話頁
│   │   ├── dashboard/page.tsx  ← 首頁儀表板
│   │   ├── settings/           ← 設定頁 + Gmail 子頁
│   │   └── layout.tsx          ← 共用 TabBar layout
│   ├── api/                    ← API Routes
│   │   ├── auth/               ← NextAuth（Google OAuth）
│   │   ├── calm-index/         ← 平靜指數計算
│   │   ├── chat/               ← Gemini AI 串流對話
│   │   ├── gmail/metrics/      ← Gmail 元資料
│   │   └── youtube/feed/       ← YouTube 訂閱摘要
│   ├── onboarding/page.tsx     ← 歡迎頁
│   └── page.tsx                ← 根路由（導向 dashboard 或 onboarding）
├── components/                 ← UI 元件
│   ├── chat/                   ← 對話相關（氣泡、輸入框、列表）
│   ├── dashboard/              ← 儀表板卡片（平靜指數、進度、YouTube、健康）
│   ├── layout/                 ← TabBar
│   ├── settings/               ← 設定頁元件
│   └── ui/                     ← shadcn/ui 基礎元件
├── lib/                        ← 核心邏輯
│   ├── __tests__/              ← 測試（87 tests）
│   ├── auth.ts                 ← NextAuth 設定
│   ├── gmail.ts                ← Gmail API 封裝
│   ├── youtube.ts              ← YouTube API 封裝
│   ├── gemini.ts               ← Gemini AI 封裝
│   ├── gemini-prompts.ts       ← Prompt templates
│   ├── calm-index-bridge.ts    ← 平靜指數橋接層
│   ├── demo-data.ts            ← Demo 假資料
│   ├── demo-mode.ts            ← Demo 模式 helper
│   └── types.ts                ← TypeScript 型別
└── moltos-calm-index/          ← 平靜指數演算法（git submodule）
```

## 技術棧

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- NextAuth (Google OAuth)
- Gmail API + YouTube Data API v3
- Gemini 2.5 Flash
- @moltos/calm-index（自研演算法）
- Vitest（87 tests）
- Vercel 部署
