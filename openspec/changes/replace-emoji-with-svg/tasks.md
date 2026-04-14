# Tasks: Replace Emoji with SVG Icons

## 1. Setup — Icon mapping and custom SVG components

- [x] 1.1 Create `lib/icon-mapping.ts` with emoji-to-Lucide mappings (per Icon mapping table requirement and 📐 icon 替換策略 in proposal; supports design decision "建立 Emoji → SVG 映射表供全系統使用")
- [x] 1.2 Create `components/icons/custom-icons.tsx` with `BlockCursor` and `RecordingDot` SVG components per Custom SVG components for unmappable emoji requirement (per 自訂 SVG 用於 Lucide 無對應的 icon decision; aligns with design decision "自訂 SVG 用於 Lucide 無對應的 icon")
- [x] 1.3 Create index export `components/icons/index.ts` to provide unified icon import point per Icon import consistency requirement (implements design decision "建立 Emoji → SVG 映射表供全系統使用")
- [x] 1.4 Write unit tests for icon mapping and custom SVG components ensuring Icon import consistency and fallback behavior (validates design decision "建立 Emoji → SVG 映射表供全系統使用")

## 2. Review Page UI — Replace chevron and error icons

- [x] 2.1 Replace `▼▲` emoji with `ChevronDown/ChevronUp` from Lucide in `app/(app)/review/page.tsx` (per Collapsible insights section requirement; part of design decision "phase 1：runtime ui（預計 4-6 小時）")
- [x] 2.2 Replace `✕` emoji with `X` icon from Lucide in review page (per Error state indicators requirement)
- [x] 2.3 Verify collapsible behavior still works with new SVG icons
- [x] 2.4 Test review page on mobile devices to ensure icon sizing is correct
- [x] 2.5 Write unit tests for review page chevron toggle behavior

## 3. Wellness Card — Replace health metric icons

- [x] 3.1 Replace `🚶` emoji with `Footprints` icon from Lucide in `components/dashboard/wellness-card.tsx` (per Activity indicator icon requirement)
- [x] 3.2 Replace `😴` emoji with `Moon` icon from Lucide in wellness card (per Sleep indicator icon requirement)
- [x] 3.3 Replace `💧` emoji with `Droplet` icon from Lucide in wellness card (per Hydration indicator icon requirement)
- [x] 3.4 Verify icon colors and sizes match original emoji appearance
- [x] 3.5 Write unit tests for wellness card rendering

## 4. Dashboard Today Progress — Replace progress indicator icons

- [x] 4.1 Replace `📧` emoji with `Mail` icon from Lucide in `components/dashboard/today-progress.tsx` (per Email progress indicator icon requirement)
- [x] 4.2 Replace `⏰` emoji with `Clock` icon from Lucide in progress card (per Reminder time indicator icon requirement)
- [x] 4.3 Replace `🌙` emoji with `Moon` icon from Lucide in progress card (per Night mode indicator icon requirement)
- [x] 4.4 Ensure progress values and thresholds are unaffected by icon changes
- [x] 4.5 Write unit tests for today progress card

## 5. Chat Message UI — Replace streaming cursor

- [x] 5.1 Integrate custom `BlockCursor` SVG component in `components/chat/message-bubble.tsx` (per Streaming message cursor indicator requirement)
- [x] 5.2 Implement cursor animation matching original `▌` blinking behavior (per Streaming cursor animates smoothly requirement)
- [x] 5.3 Ensure cursor displays only during streaming and disappears on completion (per Cursor disappears when streaming completes requirement)
- [x] 5.4 Test cursor visibility on different message types and screen sizes
- [x] 5.5 Write unit tests for cursor animation and lifecycle

## 6. Marketing HTML — Replace social interaction emoji

- [ ] 6.1 Replace `♡♥❤️` emoji with `Heart` icon SVG in `docs/_external/archive/demo/fishtvlove-carousel.html` (per 使用 Lucide icon 作為主要替換方案; part of design decision "phase 2：marketing html（預計 1-2 小時）" implementing "分階段替換，避免一次性大改")
- [ ] 6.2 Replace `💬` emoji with `MessageCircle` icon SVG in carousel files (per 社交互動 icon 替換)
- [ ] 6.3 Replace `📤` emoji with `Share` icon SVG in carousel files
- [ ] 6.4 Replace `🔖📌` emoji with `Bookmark` icon SVG in carousel files
- [ ] 6.5 Replace `➤⌘` emoji with `Play` and `Command` icon SVG in carousel files
- [ ] 6.6 Test carousel interactions and icon clicks on desktop and mobile
- [ ] 6.7 Verify no CDN caching issues with updated HTML files

## 7. Testing and Documentation

- [ ] 7.1 Run full unit test suite (`npm test`) to verify all emoji replacements don't break functionality (validates "回滾策略" for safe rollback)
- [ ] 7.2 Run build check (`npm run build`) to ensure no TypeScript errors (part of "phase 1：runtime ui（預計 4-6 小時）")
- [ ] 7.3 Verify visual consistency across all replaced icons (screenshot comparison) (validates "分階段替換，避免一次性大改")
- [ ] 7.4 Update `docs/design-system.md` or similar to document icon usage patterns (supports design decision "建立 Emoji → SVG 映射表供全系統使用"; optional, per Non-Goals in proposal)
- [ ] 7.5 Test accessibility with screen reader to ensure SVG icons have proper labels (implements "phase 4：測試/腳本（可選）")

## 8. Integration and Deployment

- [ ] 8.1 Verify all 5 modified capabilities are correctly replaced (per Phase 1: Runtime UI — 10 個檔案 in design)
- [ ] 8.2 Create single commit with message: `feat(ui): replace all emoji with SVG icons (Lucide + custom SVG)`
- [ ] 8.3 Push to staging branch and verify Vercel preview
- [ ] 8.4 Run E2E tests on preview deployment to verify no regressions
- [ ] 8.5 Get visual approval from design team on icon replacements
- [ ] 8.6 Merge to main and deploy to production

## 9. Phase 2 — Marketing HTML (Optional follow-up)

- [ ] 9.1 Update remaining carousel files if not included in Phase 1 (part of design decision "phase 2：marketing html（預計 1-2 小時）")
- [ ] 9.2 Deploy marketing updates and verify cache invalidation (implements "回滾策略" - cache-busting for CDN)

## 10. Phase 3 — Markdown Documentation (Optional)

- [ ] 10.1 Replace Markdown file emoji for status lights and ratings (part of design decision "phase 3：markdown 文件（可選，預計 2-3 小時）")
- [ ] 10.2 Update docs and commit (part of design decision "phase 3：markdown 文件（可選，預計 2-3 小時）")

## 備註

**並行執行策略**：
- Tasks 2-5 可由不同開發者並行執行（不同元件，無依賴）
- Task 1 應優先完成，解鎖後續 emoji 替換
- Tasks 6-10 串行於 Phase 1-2 之後

**優先順序**：
- **P0**：Tasks 1-5（Runtime UI）— 最高優先，直接影響用戶介面
- **P1**：Task 6（Marketing HTML）— 中優先，視覺/品牌衝擊力高
- **P2-P3**：Tasks 9-10（文件/測試）— 可選，不影響生產功能
