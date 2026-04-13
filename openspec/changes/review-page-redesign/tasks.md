# Review Page Redesign - Implementation Tasks

## 1. Analyze Button Sizing and Labeling (decision: button size and text update)

- [ ] 1.1 Update `app/(app)/review/page.tsx` L389: change button text from "分析最近對話" to "平靜分析" — implements decision: button size and text update
- [ ] 1.2 Update `app/(app)/review/page.tsx` L388: increase button size from `size="sm"` to default, and adjust padding class
- [ ] 1.3 Update `app/(app)/review/page.tsx` L388: increase font size from `text-xs` to `text-base`
- [ ] 1.4 Test Analyze Button Sizing and Labeling on desktop and mobile

## 2. Analysis Card Responsive Layout (decision: mobile card responsive typography)

- [ ] 2.1 Update `app/(app)/review/page.tsx` L314-376 (insight cards): apply responsive font size classes `text-sm md:text-base` — implements decision: mobile card responsive typography
- [ ] 2.2 Update `app/(app)/review/page.tsx` L314-376: apply responsive padding `p-2 md:p-4`
- [ ] 2.3 Update `app/(app)/review/page.tsx` L314-376: add border and shadow styling (border + rounded-lg + shadow-sm)
- [ ] 2.4 Test Analysis Card Responsive Layout on mobile device (<768px)
- [ ] 2.5 Test card layout on desktop (≥768px) — verify no layout breakage

## 3. Calm Index Status Communication and Data Insufficient Message (decision: data insufficient message)

- [ ] 3.1 Update `components/dashboard/calm-index-card.tsx` L204-206: replace error message text — implements decision: data insufficient message
- [ ] 3.2 Replace "資料暫時無法載入，請稍後再試。" with "需要至少 14 天的郵件數據才能計算平靜指數" per Calm Index Status Communication requirement
- [ ] 3.3 Verify Data Insufficient Message (modified) displays clearly for new accounts
- [ ] 3.4 Verify Calm Index Display shows the curve graph for accounts with 14+ days data

## 4. Curve Graph Drill-Down Interaction (decision: curve graph drill-down ux)

Note: Optional/future — include if timeline permits.

- [ ] 4.1 Implement Curve Graph Drill-Down Interaction in `app/(app)/review/page.tsx`: add state for selected day + click handler on graph dots — implements decision: curve graph drill-down ux
- [ ] 4.2 Add detail card component and close/dismiss button below the curve graph
- [ ] 4.3 Test drill-down: click graph point → detail card appears → click away → returns to graph

## 5. Testing and Validation

- [ ] 5.1 Run `npm test` to ensure no existing tests break
- [ ] 5.2 Run `npm run lint` to check code style
- [ ] 5.3 Take mobile screenshot showing updated button and card layout
- [ ] 5.4 Take desktop screenshot showing no layout regressions
- [ ] 5.5 Commit with message: `feat(review): improve button size, text, and mobile card layout`

## 6. Deployment

- [ ] 6.1 Create PR with all changes
- [ ] 6.2 Request code review focusing on responsive design
- [ ] 6.3 Merge and deploy to staging
- [ ] 6.4 QA verification on real mobile device
- [ ] 6.5 Deploy to production
