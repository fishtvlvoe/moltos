## Why

用戶在 Chat 頁面點擊輸入框時無法打字，只能使用語音。根本原因是 `recognitionInstance` 全局單例導致多個麥克風實例互相競爭，加上 ElevenLabs WebSocket SDK 在背景搶奪焦點，導致 textarea 無法聚焦。此修復確保語音與文字輸入可併存，提升用戶體驗。

## What Changes

- 將 `recognitionInstance` 從全局變數改為 component 級別（useRef），隔離各 component 的麥克風實例
- 將 `onInterimCallback` 從全局函式改為 component 級別回調
- 加入麥克風完全清理機制：timeout + abort() 確保舊實例徹底停止
- 為 textarea 加入焦點管理：在語音聆聽時恢復 textarea 焦點，確保打字模式下焦點不被 SDK 搶奪
- 在 `stopListening()` 加入 2 秒 timeout，若 `onend` 未觸發則強制清理

## Non-Goals

- 不修改 ElevenLabs WebSocket 連線邏輯（責任在 API 層）
- 不修改語音辨識的轉錄結果（只改硬體存取層）
- 不修改 call/page.tsx 的麥克風管理（該頁面獨立）

## Capabilities

### New Capabilities

- `chat-input-focus-management`: 確保 textarea 在語音聆聽期間保有焦點，防止 ElevenLabs SDK 搶奪焦點

### Modified Capabilities

- `web-speech-api-integration`: 將全局麥克風實例改為 component 級別，支援多個 component 同時控制麥克風狀態

## Impact

- **Affected code**:
  - `components/chat/chat-input.tsx` — 主要改動，新增 useRef 管理、焦點恢復邏輯
  - `lib/speech.ts` — 簡化為純工具函式，移除全局狀態
  - `app/(app)/chat/page.tsx` — 無變更（ElevenLabs 連線邏輯保持）

- **Affected specs**: 新增 `web-speech-api-integration`、`chat-input-focus-management` 兩個 spec
- **No breaking changes**: 修復為純後向相容
