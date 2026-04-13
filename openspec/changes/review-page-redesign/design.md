## Context

The review page previously displayed daily analysis results in a stacked, horizontal layout, causing extreme page length (100+ lines for 14 days of data). Users complained they couldn't see trends easily. We switched to a curve graph to show calm index trends over time, but still need to optimize the UI around it:

1. The "Analyze Recent Conversations" button is too small and easy to miss
2. Analysis cards on mobile have `text-sm` font, too hard to read without manual zoom
3. New accounts see a vague "資料暫時無法載入" message instead of understanding they need 14 days of data
4. The curve graph needs drill-down capability (click a day to see details)

## Goals / Non-Goals

**Goals:**

- Increase button prominence and clarity (size + label)
- Optimize card readability on mobile (responsive font sizing, better layout)
- Provide clear messaging for new accounts about calm index data requirements
- Support day-level detail view from the curve graph
- Maintain backward compatibility with existing data

**Non-Goals:**

- Changing calm index calculation logic (defined in calm-index spec)
- Customizable time ranges for the curve graph (fixed at 14 days or 1 month)
- Adding new analysis metrics or visualizations
- Changing the curve graph rendering library

## Decisions

### Decision: Button Size and Text Update

**Choice**: Increase button padding from `p-2` → `p-3`, font size from `text-sm` → `text-base`, and change text from "分析最近對話" to "平靜分析".

**Rationale**: 
- Larger button is more discoverable and thumb-friendly on mobile
- "平靜分析" (Calm Analysis) is more descriptive and brand-aligned than "分析最近對話" (Analyze Recent Conversations)
- Follows accessibility standards for touch targets (44px minimum height)

**Alternatives considered**:
- Using a different color scheme to stand out — rejected because existing design doesn't need more colors
- Adding an icon to the button — rejected because "平靜分析" is clear enough and icon adds visual clutter

### Decision: Mobile Card Responsive Typography

**Choice**: Use Tailwind responsive classes: `text-sm md:text-base` for font size, `p-2 md:p-4` for padding, and add border + shadow styling.

**Rationale**:
- Tailwind breakpoints are already used throughout the project
- `text-base` is readable on mobile without manual zoom
- Border and shadow give cards visual hierarchy and breathing room
- Responsive padding prevents cramping on mobile while keeping desktop elegant

**Alternatives considered**:
- Using CSS media queries directly — rejected because Tailwind classes are more maintainable
- Fixed font size (no responsiveness) — rejected because desktop becomes too large
- Using viewport-relative units (vw) — rejected because less predictable and harder to test

### Decision: Data Insufficient Message

**Choice**: Replace generic error state with specific message: "需要至少 14 天的郵件數據才能計算平靜指數".

**Rationale**:
- Educates new users about the requirement without leaving them confused
- Reduces support questions about missing calm index
- Aligns with spec requirement for clear communication

**Alternatives considered**:
- Showing a progress bar (e.g., "3 of 14 days") — could add in future iteration
- Hiding the section entirely — rejected because it's confusing (user doesn't know what's missing)

### Decision: Curve Graph Drill-Down UX

**Choice**: On click of a graph point/day, display a detail card above or below the graph showing that day's analysis. Clicking away or a close button returns to overview.

**Rationale**:
- Keeps graph visible for context (no full-page navigation)
- Users can compare multiple days by clicking between them
- Smooth UX without loading delays

**Alternatives considered**:
- Modal popup (interrupts flow) — rejected
- Separate page (loses context) — rejected
- Sidebar panel (adds complexity) — rejected for initial implementation

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Increasing button size may reduce other UI elements' prominence | Tested visually before shipping; ensure other important elements (like back button) remain visible |
| Mobile text size `text-base` may be too large on very small screens (<320px width) | Test on small devices; adjust to `text-sm` on `sm:` breakpoint if needed |
| Adding drill-down interaction adds complexity to review page component | Implement as a separate detail card component; use state management to keep it simple |
| Data message change doesn't address users who expect immediate results | Combine with onboarding messaging about Gmail integration requirement |

## Migration Plan

1. **Phase 1**: Deploy button and typography changes (low risk, no backend changes)
   - Update `app/(app)/review/page.tsx` — button section (L382-391) and analysis card section (L314-376)
   - Deploy and monitor for layout issues

2. **Phase 2**: Deploy calm index message update
   - Update `components/dashboard/calm-index-card.tsx` error message (L204-206)
   - Deploy to all users
   - Monitor support requests for reduction

3. **Phase 3**: Deploy drill-down interaction (optional for future)
   - Add drill-down state and detail card to `app/(app)/review/page.tsx`
   - Add click handlers to curve graph
   - A/B test with users before full rollout

## Open Questions

- Should drill-down show the same analysis as the original "stacked cards" view, or a new summary?
- How should the detail card transition (fade in, slide up, expand)?
- Should the curve graph be scrollable if there's not enough space?
