# Fix Chat Input Speech Conflict - Implementation Tasks

## 1. Decision 1: 將 recognitionInstance 改為 useRef（component 級別）

- [x] 1.1 [Tool: cursor-agent] Modify chat-input.tsx: add useRef to store component-level recognitionInstance — implements "Component-level speech recognition instance management" requirement
- [x] 1.2 [Tool: cursor-agent] Verify textarea onChange and onKeyDown handlers capture input correctly
- [x] 1.3 [Tool: cursor-agent] Test microphone button click initiates listening without global state conflicts

## 2. Decision 2: 完全清理舊實例（timeout + abort）and Decision 4: stopListening() 需要傳遞 ref 參數

- [x] 2.1 [Tool: copilot-gpt-5.2] Refactor stopListening() in speech.ts to accept ref parameter and implement timeout cleanup — implements "Timeout-based instance cleanup" requirement
- [x] 2.2 [Tool: copilot-gpt-5.2] Add abort() fallback if onend does not fire within 2 seconds
- [x] 2.3 [Tool: copilot-gpt-5.2] Update chat-input.tsx handleMicStop() to call stopListening(recognitionRef)
- [x] 2.4 [Tool: cursor-agent] Verify interim callback is isolated to component level and other components do not receive "Callback isolation" callbacks

## 3. Decision 3: 為 textarea 加焦點管理

- [x] 3.1 [Tool: cursor-agent] Add useEffect to chat-input.tsx for focus restoration: restore textarea focus when isListening becomes false — implements "Focus restoration after speech recognition" requirement
- [x] 3.2 [Tool: cursor-agent] Add guard: check document.activeElement !== textareaRef.current before setting focus — prevents "No focus thrashing"
- [x] 3.3 [Tool: cursor-agent] Test focus is restored after listening stops without disrupting user manually clicked elements
- [x] 3.4 [Tool: cursor-agent] Test textarea focus is maintained and not hijacked while ElevenLabs WebSocket is active — validates "Concurrent SDK focus management" requirement

## 4. Testing and Verification

- [x] 4.1 [Tool: copilot-gpt-5.2] Write test: component-level instance isolation (verify new instance does not fail if old instance still exists)
- [x] 4.2 [Tool: copilot-gpt-5.2] Write test: 2-second timeout cleanup (verify abort() is called if onend does not fire)
- [x] 4.3 [Tool: copilot-gpt-5.2] Write test: interim callback isolation (verify callback does not leak to other components)
- [x] 4.4 [Tool: copilot-gpt-5.2] Write test: focus restoration (verify focus is set exactly once and not on every render)
- [x] 4.5 [Tool: cursor-agent] Manual test on mobile: user can type text input while ElevenLabs WebSocket is connected
- [x] 4.6 [Tool: cursor-agent] Manual test on mobile: user can switch between voice and text input seamlessly
- [x] 4.7 [Tool: cursor-agent] Run npm test to verify no regressions in existing tests

## 5. Code Quality and Finalization

- [x] 5.1 [Tool: kimi-MCP] Code Review: verify implementation matches all ADDED requirements from specs
- [x] 5.2 [Tool: kimi-MCP] Code Review: verify component-level instance management is isolated and prevents global conflicts
- [x] 5.3 [Tool: cursor-agent] Run npm run lint to check code quality
- [x] 5.4 [Tool: cursor-agent] Screenshot desktop chat input with textarea focused and typing working
- [x] 5.5 [Tool: cursor-agent] Screenshot mobile chat input with text input visible and functional
- [x] 5.6 [Tool: cursor-agent] Commit with message: `fix(chat-input): isolate speech recognition to component level, add focus management`
