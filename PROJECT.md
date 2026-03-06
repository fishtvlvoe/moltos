# Care Engine — 專案概述

## 一句話描述

把生活的噪音，變成你內心的聲音——一個主動守護你心理健康的 AI 夥伴

---

## 產品定位

| 項目 | 內容 |
|------|------|
| 目標用戶 | 忙碌的專業人士、創業者、自由工作者 |
| 核心價值 | 幫你在訊息洪流中聽到自己真正的聲音，在你快撐不住時主動找你 |
| 競品差異 | ChatGPT 不會主動關心你；Woebot/Wysa 不了解你的真實生活；Moltos 整合你的通訊管道，真正理解你的處境 |
| 定價 | 免費版 + Pro $7.99/月 |
| 通訊管道 | Phase 1: Telegram → Phase 2: + LINE → Phase 3: + WhatsApp |

---

## 核心論述

> 把生活的噪音，變成你內心的聲音。

現代人每天被訊息淹沒——LINE 999+、老闆訊息、客戶催件。
在這些噪音之間，沒有人問他們：「你自己還好嗎？」

Moltos 做三件事：
1. 過濾噪音：整合 LINE/Gmail/Slack，幫你排序優先級
2. 聽見聲音：從你的行為模式中，發現你自己還沒注意到的狀態
3. 接住你：在你需要傾訴時，提供一個安全的、不評判的空間

我們不是治療師，不做診斷。
我們是一個窗口——幫你發現自己，然後選擇你要怎麼面對。

---

## 五大 AI 角色

| 角色 | 功能 | 白話說 |
|------|------|--------|
| Reporter | 定時問你「在幹嘛？」，記錄你的回答 | 主動關心你的秘書 |
| Advisor | 每日/每週回顧，分析你的時間花在哪 | 幫你做每日檢討的教練 |
| Editor | 從 YouTube/RSS/X 抓資料，整理摘要推給你 | 幫你剪報的助理 |
| Coach | 追蹤運動、飲食、健康目標 | 健身教練 |
| Tutor | 追蹤學習進度、推薦教材 | 家教老師 |

MVP 優先做：**Reporter + Editor + Advisor**（覆蓋社群 60% 需求）

---

## 技術架構

```
通訊管道（嘴巴）
  Telegram / LINE / WhatsApp / Email
        │
        ▼
  ① 接口層（翻譯器）
     各平台格式 → 統一格式
        │
        ▼
  ② AI 大腦
     理解意思 → 決定怎麼回
     （Gemini Flash 日常 / GPT-4o 深度分析）
        │
        ▼
  ③ 記憶（PostgreSQL）
     記住用戶說過的話、偏好、習慣
        │
        ▼
  ④ 排程器（Bull MQ + Redis）
     幾點該問用戶、幾點該發回顧
        │
        ▼
  ⑤ 資料抓取器
     YouTube / RSS / X / Gmail
        │
        ▼
  ⑥ 輸出器
     存到 Obsidian / 推通知
```

---

## 技術棧

| 類別 | 技術 | 用途 |
|------|------|------|
| 語言 | TypeScript | 前後端統一語言 |
| 後端框架 | Node.js + Fastify | API 伺服器 |
| 資料庫 | PostgreSQL | 用戶資料、對話記錄、記憶 |
| 快取/排程 | Redis + Bull MQ | 定時任務排程 |
| AI | Gemini Flash / GPT-4o mini / GPT-4o | 多模型混用，按任務選模型 |
| Telegram Bot | Grammy (TypeScript) | Telegram Bot 框架 |
| Gmail | Gmail API (OAuth 2.0) | 讀取/分類 Email |
| Email 發送 | Resend + Amazon SES | Resend：開發期 + AI Agent 發信（免費 3,000 封/月）；SES：量大後切換（$0.10/千封） |
| 訂閱付費 | Recur（recur.tw） | 台灣信用卡訂閱收款，手續費 2.4%，月營收 10 萬內平台費 $0 |
| 部署 | Railway 或 Fly.io | 按量付費雲端平台 |

---

## 成本估算

### 每位用戶每月成本

| 項目 | 成本 |
|------|------|
| AI API（混搭模型） | ~$0.24 |
| 伺服器分攤 | ~$0.10 |
| **合計** | **~$0.34** |
| 用戶付費 | $7.99 |
| **毛利率** | **~96%** |

### 付費流程（Recur）

```
用戶在 Telegram 說「升級 Pro」
        │
        ▼
  Bot 回傳付費連結（Recur Hosted Checkout）
        │
        ▼
  用戶在網頁刷台灣信用卡（PAYUNi 金流）
        │
        ▼
  Recur Webhook → Server 標記用戶為 Pro → 解鎖功能
```

- 手續費 2.4%（NT$255 月費 → 實收 NT$248.88）
- 月營收 10 萬內平台費 $0，MVP 零固定成本
- 自動續費、催繳、寬限期全由 Recur 處理

### Email 發送策略

| 階段 | 工具 | 原因 |
|------|------|------|
| MVP（< 1,000 人） | Resend | 免費 3,000 封/月，開箱即用 |
| 規模化（> 1,000 人） | Amazon SES | $0.10/千封，便宜 10 倍以上 |
| AI Agent 自動發信 | Resend | MCP 支援，AI 直接呼叫 |

### 平台固定成本

| 項目 | 月費 |
|------|------|
| Railway（伺服器） | ~$5（初期） |
| Redis（排程用） | ~$5 |
| PostgreSQL（資料庫） | ~$0（Railway 內建） |
| 網域 | ~$1 |
| **月固定成本** | **~$11** |

→ 只要 2 個付費用戶就能打平成本

---

## 免費 vs 付費

| 功能 | 免費版 | Pro $7.99/月 |
|------|--------|-------------|
| AI 主動 check-in | 每天 3 次 | 無限次 |
| 每日對話量 | 5 則 | 無限 |
| 資訊來源追蹤 | 1 個 | 無限 |
| 每週回顧報告 | ✅ | ✅ |
| 每日回顧 | ❌ | ✅ |
| 自訂提醒頻率 | ❌ | ✅ |
| Obsidian 同步 | ❌ | ✅ |
| Gmail 整合 | ❌ | ✅ |
| 全部 5 個 AI 角色 | 只有 Reporter | 全部解鎖 |

---

## 社群驗證（用AI發電 PathUnfold 社群 30 人）

### 需求分佈

| 需求類型 | 人數 | 佔比 | 我們做不做 |
|---------|------|------|----------|
| 資訊收集 + 摘要推送 | 12 | 40% | ✅ Editor 角色 |
| 個人記錄 + 回顧 | 6 | 20% | ✅ Reporter + Advisor |
| 電商/內容自動化 | 5 | 17% | ❌ 超出範疇 |
| 學習輔助 | 4 | 13% | ⏳ Phase 2 |
| 進階自動化 | 3 | 10% | ❌ 超出範疇 |

MVP 覆蓋率：**60%**（18/30 人的需求）

---

## 語音互動

### 策略：Phase 1 語音訊息 → Phase 2 即時通話

| | 語音訊息（Phase 1） | 即時通話（Phase 2） |
|---|---------|---------|
| 體驗 | 像傳 LINE 語音，一來一回 | 像打電話，即時對話 |
| 延遲 | 2~3 秒 | 幾乎即時 |
| 每月成本/人 | ~$0.30 | ~$9~15 |
| 開發難度 | 簡單 | 較難 |
| 支援平台 | Telegram / LINE / WhatsApp 都支援 | 需獨立 App 或網頁 |

### 語音技術選型

| 功能 | 技術 | 成本 |
|------|------|------|
| 語音→文字 | OpenAI Whisper API | $0.006/分鐘 |
| 文字→語音 | OpenAI TTS（自然度高） | $0.015/千字 |
| 即時通話（Phase 2） | Vapi 或 OpenAI Realtime API | $0.06~0.10/分鐘 |
| 聲音自訂（Phase 2） | ElevenLabs（可克隆聲音） | $0.03/千字 |

---

## 平台/App 策略

### 核心原則：不做 App，用聊天平台當入口

用戶不需要下載新 App，直接在 Telegram/LINE 裡跟 AI 對話。只有「設定」才需要開網頁。

### 三階段演進

| 階段 | 用戶接觸點 | 設定介面 | 開發成本 |
|------|-----------|---------|---------|
| Phase 1 | Telegram Bot | Next.js 網頁（設定用） | 最低，專注核心功能 |
| Phase 2 | + LINE / PWA | PWA 升級（可裝到手機桌面） | 中等，網頁變 App 體驗 |
| Phase 3 | + WhatsApp / React Native | 獨立 App（上架 App Store） | 較高，但同語言 TypeScript |

### 為什麼選 React Native 而不是 Flutter？

| 比較 | React Native | Flutter |
|------|-------------|---------|
| 語言 | TypeScript（跟後端一樣） | Dart（要學新語言） |
| 團隊效率 | 前後端同一門語言 | 前後端兩門語言 |
| 生態 | npm 套件直接用 | 要找 Dart 版套件 |
| 結論 | ✅ 全棧 TypeScript，省人力 | ❌ 多一門語言，多一份維護 |

---

## 開發階段

### Phase 1 — MVP（驗證產品是否有人要）
- Telegram Bot 基礎架構（Grammy）
- Reporter：主動 check-in + 記錄
- Editor v2：RSS/YouTube 資訊抓取 + 每日摘要
- Advisor：每日回顧 + 建議
- 語音訊息支援（Whisper + OpenAI TTS）
- Next.js 設定面板（帳號、排程、資訊來源管理）
- PostgreSQL + Redis 基礎建設

### Phase 2 — 擴展功能
- Gmail 整合模組（OAuth 2.0 + 自動分類）
- LINE 通道
- Tutor + Coach 角色
- Obsidian 同步
- PWA 升級（網頁可安裝到手機桌面）
- 即時語音通話（Vapi / OpenAI Realtime）
- 聲音自訂（ElevenLabs）

### Phase 3 — 規模化
- WhatsApp 通道
- React Native App（上架 App Store / Google Play）
- Plugin API（讓進階用戶自建 skill）
- 團隊/企業版

---

## 設計資源

### 設計風格

| 項目 | 內容 |
|------|------|
| 風格 | Industrial Humanist（溫暖私人助理風） |
| 背景色 | #FAF8F4（奶油白） |
| 強調色 | #C67A52（赤陶色） |
| 字體 | IBM Plex Sans |
| 圓角 | 16px 卡片 / 36px 膠囊按鈕 |

### 設計檔案

- 新設計檔（Pencil）：5 個手機畫面 — Chat、Dashboard、Onboarding、Settings、Gmail Settings
- 舊參考設計：`/Users/fishtv/Downloads/gmail-ai.pen`（廠商管理系統，4/6 畫面可複用）

---

## 相關檔案

| 檔案 | 位置 |
|------|------|
| 專案根目錄 | `/Users/fishtv/Development/care-engine/` |
| 設計哲學 | `/Users/fishtv/Development/1-設計哲學/` |
| 社群研究 | PathUnfold 用AI發電 Circle.so 社群 |
| 舊 Pencil 設計 | `/Users/fishtv/Downloads/gmail-ai.pen` |

---

## 對話紀錄

### 2026-02-28 — Rork 加速可行性評估

#### 背景

評估 [Rork](https://docs.rork.com/)（AI App 生成平台）是否能加速 Care Engine 開發。

#### Rork 技術概要

| 項目 | 內容 |
|------|------|
| 定位 | 用自然語言描述 → 自動生成手機 App |
| 技術棧 | React Native + Expo（Pro 版）/ Swift（Max 版） |
| 後端 | 內建 Supabase（認證 + 資料庫），Beta 階段 |
| 部署 | 直接上架 App Store / Google Play |
| 程式碼 | 可匯出、可同步 GitHub |

#### 結論：目前階段不適用

Rork 是做 App「殼」的工具，但 Care Engine 的產品核心是「AI 後端大腦」，不是 App。

**產品三層架構：**

```
③ 手機 App（殼）        ← Rork 能做，但 Phase 3 才需要
② 通訊管道（Telegram）   ← Phase 1 用 Bot，不需要 App
① 後端大腦（核心）       ← AI + 排程 + 記憶，Rork 做不了
```

**Rork 的 Supabase 後端無法滿足的需求：**

- Bull MQ 定時排程（主動 check-in 的核心機制）
- AI 多模型切換（Gemini Flash / GPT-4o）
- RSS / YouTube 資料抓取
- Telegram Bot 整合

**決策：Phase 1 專注後端 + Telegram Bot，Phase 3 再考慮用 Rork 做 App。**

#### 為什麼 Phase 3（App）排在後面

1. **後端是前提** — App 沒有後端等於空殼
2. **驗證優先** — 先用 Telegram Bot 確認有人要，再投資做 App
3. **一人公司資源有限** — 同時做 App + 後端 = 兩條戰線
4. **App 不是差異化** — 競爭力是「AI 主動關心」，不是「有一個 App」
5. **Telegram Bot 優勢** — 秒上線、零審核、改 bug 即時生效

### 2026-03-06 — 產品定位確認：從工具到心理健康守護

#### 核心轉向
- 原定位：AI 生活助理（幫你記東西、抓資料、回顧）
- 新定位：主動守護心理健康的 AI 夥伴（把噪音變成聲音）

#### 關鍵決策
1. 壓力指數 → 平靜指數（正面框架，100 = 完全平靜）
2. 危機分流協議：遇到自殺意念時，誠實告知 AI 身份 + 提供專線
3. 兩層綁定：基礎層（純對話）+ 進階層（整合通訊管道）
4. 核心 slogan：「把生活的噪音，變成你內心的聲音」
5. 創辦人故事：輕度憂鬱經歷，是在跟 AI 對話中才發現自己的狀態

#### 量化指標
- 平靜指數趨勢追蹤
- 待辦完成率（狀態穩定度）
- 對話內容分析（工作 vs 生活平衡）
- 沉默偵測（兩週沒互動 → 主動關心）

#### 產品作品名稱
- 品牌：Moltos
- 網域：moltos.net
- 競賽作品名：Moltos — AI 主動關懷助理
