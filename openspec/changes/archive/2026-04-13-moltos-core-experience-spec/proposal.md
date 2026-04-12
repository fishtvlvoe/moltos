## Why

目前 Moltos 的四個核心體驗（語音對話、文字對話、主動關心、平靜指數）已有部分程式碼實作，但缺乏正式的需求規格（spec），導致測試難以撰寫、驗收標準模糊。現在到了需要補齊 TDD 基礎的階段，必須先把「什麼是正確行為」寫清楚，再根據規格補測試。

## What Changes

- 為四個核心體驗各自建立獨立的 Spectra spec，明確定義 Requirements 與 Scenarios
- 每個 spec 的 Scenario 直接對應可撰寫的測試案例
- 現有程式碼不修改，這是純粹的規格補齊動作

## Non-Goals

- 不新增任何功能，不修改任何程式碼
- 不覆蓋 `docs/dev/specs/001-care-web-app/spec.md`（舊 speckit 格式文件保留作歷史參考）
- 不包含 UI 元件測試規格（Storybook / visual regression 是獨立範圍）
- 不包含 Gmail 和 YouTube 整合的細部 spec（那是資料來源層，不是核心體驗層）

## Capabilities

### New Capabilities

- `voice-conversation`: 語音對話體驗規格——ElevenLabs Call 的連線建立、對話流程、結束與紀錄寫入
- `text-conversation`: 文字對話體驗規格——ElevenLabs Chat Agent 的訊息傳送、AI 回應、對話記憶
- `calm-index`: 平靜指數計算規格——從 Gmail 元資料萃取維度、演算法計算、儀表板顯示
- `proactive-checkin`: 主動關心規格——AI 主動問候觸發條件、沉默偵測、情境感知回應

### Modified Capabilities

(none)

## Impact

- 新增規格文件：`openspec/specs/voice-conversation/spec.md`、`openspec/specs/text-conversation/spec.md`、`openspec/specs/calm-index/spec.md`、`openspec/specs/proactive-checkin/spec.md`
- 影響測試範圍：`tests/api/`、`lib/__tests__/`（補測試時以這些 spec 為依據）
- 不修改任何應用程式碼
