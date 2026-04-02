# Implementation Plan: MOLTOS Care Web App

**Branch**: `001-care-web-app` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-care-web-app/spec.md`

## Summary

建立 MOLTOS 互動式照護網頁應用，透過 Google OAuth 授權存取使用者 Gmail 與 YouTube 資料，運用 moltos-calm-index 演算法計算個人平靜指數，並串接 Gemini API 提供 AI 對話關懷功能。目標為 2026-04-25 Best AI Awards 決賽展示完整互動 demo。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, googleapis, @google/generative-ai
**Storage**: 無持久化資料庫（MVP 使用 server-side session + 記憶體快取）
**Testing**: Vitest（單元測試）、Playwright（E2E，選用）
**Target Platform**: Web（Mobile-first responsive，桌面居中容器）
**Project Type**: web-service（全端 Next.js 應用）
**Performance Goals**: 平靜指數計算 < 3 秒（含 Gmail API fetch），AI 回覆 < 5 秒
**Constraints**: 23 天開發期、一人團隊、比賽現場需準備斷網備案
**Scale/Scope**: 單一使用者 demo（比賽展示用），5 個頁面

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Demo-First | ✅ PASS | 開發順序依展示流程排列，斷網備案列為 FR-012 |
| II. Google-Ecosystem | ✅ PASS | 全部使用 Google 服務（OAuth + Gmail + YouTube + Gemini） |
| III. Algorithm-Core | ✅ PASS | moltos-calm-index 作為本地 package 直接引入 |
| IV. Privacy-by-Design | ✅ PASS | Gmail 資料 server-side 處理，前端只接收聚合數據 |
| V. Deadline-Driven | ✅ PASS | 4 週里程碑明確，假資料策略備案健康追蹤區塊 |

## Project Structure

### Documentation (this feature)

```text
specs/001-care-web-app/
├── plan.md              # 本檔案
├── research.md          # Phase 0：技術研究
├── data-model.md        # Phase 1：資料模型
├── quickstart.md        # Phase 1：快速啟動指南
├── contracts/           # Phase 1：API 合約
│   ├── api-routes.md
│   └── gemini-prompts.md
├── checklists/
│   └── requirements.md  # Spec 品質檢查表
└── tasks.md             # Phase 2：任務清單（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
app/                          # Next.js App Router
├── layout.tsx                # 根 layout（字體、主題）
├── page.tsx                  # 重導向到 /onboarding 或 /dashboard
├── globals.css               # Tailwind 全域樣式
├── onboarding/
│   └── page.tsx              # 歡迎頁（Onboarding）
├── dashboard/
│   └── page.tsx              # 儀表板（平靜指數 + 今日摘要 + 健康追蹤）
├── chat/
│   └── page.tsx              # AI 對話
├── settings/
│   ├── page.tsx              # 設定主頁
│   └── gmail/
│       └── page.tsx          # Gmail 設定
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts      # NextAuth Google OAuth handler
│   ├── gmail/
│   │   └── metrics/
│   │       └── route.ts      # Gmail 元資料萃取 → 維度數據
│   ├── youtube/
│   │   └── feed/
│   │       └── route.ts      # YouTube 訂閱頻道新影片
│   ├── calm-index/
│   │   └── route.ts          # 平靜指數計算
│   └── chat/
│       └── route.ts          # Gemini AI 對話（streaming）

components/                   # 共用 UI 元件
├── ui/                       # shadcn/ui 元件
├── layout/
│   ├── tab-bar.tsx           # 底部導航列
│   └── status-bar.tsx        # 頂部狀態列（可選）
├── dashboard/
│   ├── calm-index-card.tsx   # 平靜指數卡片（分數 + 等級 + 維度圖表）
│   ├── today-progress.tsx    # 今日進度
│   ├── news-card.tsx         # 今日摘要（YouTube）
│   └── wellness-card.tsx     # 健康追蹤（假資料）
├── chat/
│   ├── message-bubble.tsx    # 訊息氣泡
│   ├── chat-input.tsx        # 輸入框
│   └── chat-list.tsx         # 訊息列表
└── settings/
    ├── profile-card.tsx      # 個人資料卡片
    ├── menu-card.tsx         # 設定選單
    └── gmail-status.tsx      # Gmail 連接狀態

lib/                          # 核心邏輯
├── auth.ts                   # NextAuth 設定（Google Provider + scopes）
├── gmail.ts                  # Gmail API 封裝（元資料萃取 → 維度數據）
├── youtube.ts                # YouTube API 封裝（訂閱頻道 + 影片列表）
├── gemini.ts                 # Gemini API 封裝（對話 + 摘要生成）
├── calm-index-bridge.ts      # moltos-calm-index 橋接（DataPoint 轉換）
├── demo-data.ts              # 斷網備案用的靜態假資料
└── types.ts                  # 共用型別定義

moltos-calm-index/            # 既有演算法 package（已開發完成）
├── src/
│   ├── calm-index.ts
│   ├── baseline.ts
│   ├── anomaly.ts
│   ├── voice-emotion.ts
│   ├── types.ts
│   └── index.ts
└── package.json

public/                       # 靜態資源
├── moltos-logo.svg
└── fonts/
```

**Structure Decision**: 採用 Next.js App Router 單一專案結構。前後端在同一專案中，API Routes 處理 server-side 邏輯（Gmail/YouTube/Gemini），避免額外的後端部署。moltos-calm-index 作為本地 workspace package 引入。

## Complexity Tracking

> 無 Constitution 違規，本區段留空。
