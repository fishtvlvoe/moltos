## Why

目前系統主要以 Gmail 行為訊號、平靜指數與 AI 對話為核心，較偏向「被動觀測」與「事後回顧」。這次改版要補上「每日低摩擦、私密、可及時介入」的主流程，降低壓力與焦慮在日常中累積到危機才處理的風險，並為 4 月底啟動的商業化版本先建立可落地的產品與法規邊界。

## What Changes

- 新增「機密基線評估 + 每日 check-in」能力：用戶在 onboarding 完成壓力/情緒基線，之後每日可用 60 秒語音或引導式日記完成檢查。
- 新增「可穿戴資料同步」能力：導入睡眠品質與 HRV 等訊號，與主觀 check-in 整合成情緒風險趨勢。
- 新增「個人化微介入」能力：依趨勢推薦 3 分鐘呼吸、CBT 重構、感恩書寫、grounding 等低門檻練習。
- 新增「風險分級與升級引導」能力：當趨勢達門檻時，觸發溫和提示、顯示非醫療聲明，並導向合作心理師預約。
- 新增「商業化能力」：Freemium 與 $12.99/月進階層、企業白標與治療師轉介收益的產品化支撐。
- 調整儀表板、回顧與導航資訊架構，改為 Today / Insights / Support 三主軸與「安定、無壓迫」視覺語言。

## Non-Goals (optional)

- 本次不建立醫療診斷、臨床治療或危機熱線替代機制；產品定位為早期支持與轉介。
- 本次不追求高壓 gamification（如 streak、排名、競賽）；避免造成使用壓力。
- 本次不以「模型準確率優化」作為第一里程碑，優先完成風險分級責任邊界、可驗證成效指標與介入流程閉環。

## Capabilities

### New Capabilities

- `baseline-assessment-daily-checkin`: 機密基線評估與每日語音/日記 check-in 流程。
- `wearable-biometric-sync`: 睡眠與 HRV 等穿戴裝置資料同步、授權與更新策略。
- `personalized-micro-interventions`: 依風險趨勢推送個人化微介入與完成紀錄。
- `trend-risk-alerts-and-escalation`: 趨勢風險門檻、升級提示、非醫療聲明與心理師導流。
- `therapist-directory-booking`: 心理師名錄、篩選、預約與轉介追蹤整合。
- `mental-health-subscription-commercialization`: Freemium / 付費層、企業白標、轉介收益與訂閱管理。

### Modified Capabilities

- `calm-index`: 從 Gmail 行為訊號擴充為多來源（check-in + wearable + 行為）趨勢風險輸入。
- `proactive-checkin`: 從「14 天靜默關懷」擴充為每日節奏 check-in 與分級觸發邏輯。
- `privacy-data-management`: 新增語音、日記、生理資料的授權、保存、刪除與可攜要求。

## Impact

- Affected specs:
  - New: `baseline-assessment-daily-checkin`, `wearable-biometric-sync`, `personalized-micro-interventions`, `trend-risk-alerts-and-escalation`, `therapist-directory-booking`, `mental-health-subscription-commercialization`
  - Modified: `calm-index`, `proactive-checkin`, `privacy-data-management`
- Affected code (expected):
  - `app/onboarding/page.tsx`
  - `app/(app)/dashboard/page.tsx`
  - `app/(app)/review/page.tsx`
  - `components/layout/tab-bar.tsx`
  - `components/dashboard/calm-index-card.tsx`
  - `app/(app)/settings/privacy/page.tsx`
  - `app/(app)/settings/sources/page.tsx`
  - `app/(app)/settings/reminders/page.tsx`
  - `app/api/chat/insight/route.ts`
  - `app/api/analyze-insight/route.ts`
  - `lib/proactive-checkin.ts`
- Affected systems / dependencies:
  - 穿戴裝置資料串接（供應商待定）
  - 語音情緒分析管線（現有語音能力擴充）
  - 訂閱金流與企業授權管理
  - 心理師名錄與預約合作 API/流程
