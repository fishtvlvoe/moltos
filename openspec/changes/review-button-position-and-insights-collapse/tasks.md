# Review Button Position and Insights Collapse - Implementation Tasks

## 1. JSX Structure Reorganization (decision: 按鈕位置重組)

- [x] [P] 1.1 Move "平靜分析" button from insights section to calm index section — implement Analyze Button Position requirement
- [x] [P] 1.2 Update page layout order: Calm Index Trend card with button, then Insights card below — implements Review page section layout requirement
- [x] 1.3 Verify button positioning visually on desktop and mobile (<768px)

## 2. Insights Collapse State and Interaction (decision: State 管理方式：使用本地 React state)

- [x] 2.1 Add `const [insightsExpanded, setInsightsExpanded] = useState(false)` to ReviewPage component — implements Insights collapse state persistence requirement, using State 管理方式 design decision
- [x] 2.2 Create collapsible heading for insights section with "▼ 對話洞察 ({count} 筆)" when collapsed — implements Insights card collapse state requirement, using 摺疊卡片的標題與內容 design decision
- [x] 2.3 Implement onClick handler to toggle `insightsExpanded` state
- [x] 2.4 Conditionally render insights cards based on `insightsExpanded` state (hidden when collapsed) — using 卡片結構調整 design decision
- [x] 2.5 Update heading to show "▲ 對話洞察" when expanded

## 3. Mobile Responsiveness

- [x] [P] 3.1 Test button accessibility and visibility on mobile (<768px) — verify Analyze button on mobile scenario
- [x] [P] 3.2 Verify collapsed insights state reduces initial page height on mobile
- [x] 3.3 Test collapse/expand interaction on touch devices

## 4. Testing and Validation

- [x] 4.1 Verify collapse/expand toggle works correctly (clicking heading toggles state)
- [x] 4.2 Verify collapsed state hides all insight cards and shows count
- [x] 4.3 Verify expanded state shows all cards with proper spacing
- [x] 4.4 Confirm button position is consistent with spec (below curve graph, above insights section) — verify Multiple insights displayed scenario
- [x] 4.5 Test with multiple insights (10+ items) to confirm layout handles long lists
- [x] 4.6 Run npm test to ensure no regressions
- [x] 4.7 Run npm run lint to check code quality

## 5. Finalization

- [x] 5.1 Take desktop screenshot showing new layout
- [x] 5.2 Take mobile screenshot showing collapsed insights and accessible button
- [x] 5.3 Commit with message: `feat(review): reorganize layout — move button, add insights collapse`
