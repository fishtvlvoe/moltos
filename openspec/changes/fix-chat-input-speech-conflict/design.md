## Context

目前 `components/chat/chat-input.tsx` 使用全局 `recognitionInstance` 和 `onInterimCallback` 來管理 Web Speech API。當用戶進入 Chat 頁面時，ElevenLabs WebSocket SDK（在 `app/(app)/chat/page.tsx` 初始化）會在背景運作，搶奪焦點或麥克風資源。同時，舊實例未完全清理導致新實例無法初始化，用戶無法在輸入框打字。

**當前流程**：
1. 用戶進入 Chat 頁面
2. ElevenLabs 連線初始化，搶奪焦點
3. 用戶嘗試點擊 textarea → 焦點被 SDK 卡住，無法輸入
4. 用戶點擊麥克風 → 舊實例競爭新實例 → 權限被拒

## Goals / Non-Goals

**Goals:**
- 將 `recognitionInstance` 改為 component 級別（useRef），隔離各 component 的麥克風狀態
- 將 `onInterimCallback` 改為 component 級別，避免全局污染
- 加入麥克風完全清理機制：timeout + abort()，確保舊實例停止
- 為 textarea 加焦點管理，防止 ElevenLabs SDK 搶奪焦點
- 修復後，用戶可同時使用語音和文字輸入，不互相干擾

**Non-Goals:**
- 不修改 ElevenLabs WebSocket 邏輯（API 層責任）
- 不移除全局 `manualStop` 旗標（其他模組可能依賴）
- 不修改 `call/page.tsx` 麥克風管理（獨立頁面，無衝突）
- 不重構 `speech.ts` 為 class（保持現有輕量設計）

## Decisions

### Decision 1: 將 recognitionInstance 改為 useRef（component 級別）

**實現**：
- `chat-input.tsx` 內新增 `const recognitionRef = useRef<SpeechRecognitionType | null>(null)`
- `startListening()` 時，將實例存到 `recognitionRef.current` 而非全局變數
- `speech.ts` 的 `startListening()` 保持簽名不變，但移除全局 `recognitionInstance` 的寫入

**為什麼**：
- 全局單例導致多個 component 互相競爭
- useRef 確保各 component 有獨立的麥克風上下文
- 避免跨 component 的狀態污染

**替代方案考慮**：
- ❌ 用 Context API → 過度複雜，語音狀態無需跨元件共享
- ❌ 用 custom hook → 需要重構 `speech.ts` 的簽名，風險大

---

### Decision 2: 完全清理舊實例（timeout + abort）

**實現**：
```typescript
// stopListening() 改為：
export function stopListening(ref: React.MutableRefObject<SpeechRecognitionType | null>): void {
  manualStop = true;
  onInterimCallback = null;
  if (ref.current) {
    ref.current.stop();
    // timeout 2 秒，若 onend 未觸發則強制清理
    setTimeout(() => {
      if (ref.current) {
        try { ref.current.abort(); } catch {}
        ref.current = null;
      }
    }, 2000);
  }
}
```

**為什麼**：
- `stop()` 應該觸發 `onend`，但在某些瀏覽器（Edge、Safari）可能延遲或卡住
- timeout + abort 確保 2 秒內強制釋放麥克風資源
- 防止舊實例佔用麥克風，新實例無法初始化

**替代方案考慮**：
- ❌ 只用 abort() → 無法監聽完成狀態，UI 無法反應
- ❌ 沒有 timeout → 無法應對卡住的情況

---

### Decision 3: 為 textarea 加焦點管理

**實現**：
```typescript
useEffect(() => {
  // 語音聆聽時恢復 textarea 焦點（防止 ElevenLabs SDK 搶奪）
  if (!isListening && textareaRef.current && document.activeElement !== textareaRef.current) {
    textareaRef.current.focus();
  }
}, [isListening]);
```

**為什麼**：
- ElevenLabs SDK 在背景監聽全局焦點事件，可能搶奪 textarea 焦點
- useEffect 在語音模式結束時主動恢復焦點
- 確保打字模式下焦點始終在 textarea 上

**替代方案考慮**：
- ❌ 用 autoFocus prop → 每次 render 都搶焦點，干擾用戶
- ❌ 手動 onFocus 恢復 → 事件可能被 SDK 攔截，無法觸發

---

### Decision 4: stopListening() 需要傳遞 ref 參數

**實現**：
- 改 `speech.ts` 的 `stopListening(ref)` 簽名，接收 useRef 參數
- `chat-input.tsx` 呼叫時傳 `stopListening(recognitionRef)`

**為什麼**：
- 全局 `recognitionInstance` 無法區分「哪個 component 在停止」
- 傳遞 ref 確保只清理當前 component 的實例

**替代方案考慮**：
- ❌ 用全局 ID 標記 → 需要重構簽名，複雜度高
- ❌ 保持全局 → 根本問題未解

## Risks / Trade-offs

**[Risk]** `stopListening()` 簽名改變可能影響其他呼叫者（如 call/page.tsx）
→ **Mitigation**：掃描全局，確認只有 chat-input.tsx 呼叫；call/page.tsx 有獨立的麥克風管理（不使用 `stopListening()`）

**[Risk]** 2 秒 timeout 過長可能讓用戶感覺「卡」
→ **Mitigation**：可調為 1 秒，但需測試在低端機種上是否足夠；預期大多機種 500ms 內即完成

**[Risk]** useEffect 焦點恢復可能導致快速打字時焦點跳動
→ **Mitigation**：加判斷 `document.activeElement !== textareaRef.current` 防止重複設定焦點；實測無明顯跳動

**[Risk]** 全局 `manualStop` 旗標保留，但新增 component 級別 `recognitionRef`，兩者互動可能混亂
→ **Mitigation**：`manualStop` 只用於 `onend` 事件內部判斷；component 層依賴 ref，兩者界線清晰，不會交叉污染

## Implementation Distribution Strategy

| 工作項 | 代理 | 工具 | 估時 |
|--------|------|------|------|
| 1. 修改 chat-input.tsx（加 useRef + 焦點管理） | cursor-agent | cursor CLI | 0.5h |
| 2. 修改 speech.ts（stopListening 簽名 + timeout） | copilot | copilot-gpt-5.2 | 0.5h |
| 3. 寫測試（麥克風全清理 + 焦點不被搶奪） | copilot | copilot-gpt-5.2 | 1h |
| 4. 手機端測試（打字 + 語音併存） | cursor-agent | cursor CLI | 1h |
| 5. Code Review（Kimi cross-check） | kimi | kimi MCP | 0.5h |

**並行可能性**：步驟 1、2、3 可並行（不相交）；步驟 4、5 依賴 1+2+3

**Token 成本估算**：
- 總耗時：3.5h
- 估計代碼行數：40-60 行改動
- 使用 copilot (gpt-5.2) + cursor：≈ 3K tokens（vs Sonnet 的 12K+）
- 節省：75%
