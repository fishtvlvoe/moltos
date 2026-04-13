## Context

This change consolidates four small bug fixes and UI improvements:
1. Button too small and misleading label on review page
2. Mobile card text too small to read
3. New accounts confused by vague calm index message
4. Gmail disconnect button is broken (logs user out instead)

Each fix is straightforward and self-contained, but together they improve the core user experience significantly. This design document synthesizes the approach across all four.

## Goals / Non-Goals

**Goals:**

- Fix button prominence and labeling
- Improve mobile readability without changes to desktop
- Educate new users about calm index data requirements
- Implement working Gmail disconnect and account switching

**Non-Goals:**

- Changing calculation logic or data structures
- Adding new features beyond the fixes listed
- Modifying other unrelated pages or components

## Decisions

### Decision: Unified Button and Typography Updates

**Choice**: Apply responsive Tailwind classes across affected components:
- Button: `p-2 → p-3`, `text-sm → text-base`
- Card text: `text-sm md:text-base`
- Card spacing: `p-2 md:p-4`

**Rationale**: Consistent use of Tailwind responsiveness keeps codebase maintainable.

### Decision: Error Message Replacement

**Choice**: Replace vague "資料暫時無法載入" with "需要至少 14 天的郵件數據才能計算平靜指數".

**Rationale**: Educates users instead of leaving them confused.

### Decision: Gmail Disconnect Implementation Path

**Choice**: 
1. Create `/api/gmail/disconnect` route
2. Update `gmail-actions.tsx` to call new endpoint (not `signOut()`)
3. Create `gmail-status.tsx` component
4. Add confirmation dialogs

**Rationale**: Implements the full account management flow defined in `gmail-integration-complete` change.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Button size change breaks desktop layout | Test at multiple breakpoints; adjust if overflow occurs |
| Mobile font size looks weird at tablet breakpoints | Use `md:` breakpoint (768px) for desktop, adjust if needed |
| Gmail disconnect API fails silently | Implement error boundary in React; show user-facing error |
| User closes browser during OAuth — state is lost | OAuth callback URL handles resumption automatically |

## Open Questions

- Should we add analytics tracking for disconnect/switch actions?
- Should drill-down curve graph interaction be included in this change or deferred?
