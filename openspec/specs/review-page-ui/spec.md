# Review Page UI Specification

## Purpose

Defines the UI design, button specifications, curve graph interaction, and card layout for the MOLTOS review page.

## Requirements

### Requirement: Calm Index Display

The system SHALL display calm index information on the review page using a curve graph showing trends over the last 14 days or 1 month.

#### Scenario: Curve graph with sufficient data

- **WHEN** user views review page with ≥14 days of email data
- **THEN** system displays a curve graph with dates on X-axis and calm index score on Y-axis

#### Scenario: Empty state for new accounts

- **WHEN** user has insufficient email history
- **THEN** review page displays clear messaging about the 14-day data requirement

---
### Requirement: Data Insufficient Message

The system SHALL communicate clearly when calm index data is unavailable due to insufficient email history.

#### Scenario: New account message

- **WHEN** user has fewer than 14 days of email history
- **THEN** system displays informative message explaining the data requirement

---
### Requirement: Analyze Button Position

The system SHALL display a "平靜分析" button that allows users to trigger analysis of recent conversations. The button SHALL be positioned immediately below the calm index curve graph, as part of the Calm Index Trend card.

#### Scenario: Button position on review page

- **WHEN** user views the review page
- **THEN** system displays the "平靜分析" button below the curve graph
- **AND** the button is within the Calm Index Trend card
- **AND** the button appears above the Conversation Insights section

#### Scenario: User clicks analyze button

- **WHEN** user clicks the "平靜分析" button
- **THEN** system triggers analysis of recent conversations
- **AND** button shows loading state while analyzing
- **AND** insights section reflects new analysis results after completion

#### Scenario: Analyze button on mobile

- **WHEN** user views review page on mobile device (<768px width)
- **THEN** button is clearly visible without excessive scrolling
- **AND** button size and text are readable (text-base or larger)

#### Scenario: Multiple insights displayed

- **WHEN** user has analyzed conversations multiple times (insights list grows)
- **THEN** button remains accessible at consistent position (below curve graph)
- **AND** user does NOT need to scroll extensively to reach the button


<!-- @trace
source: review-button-position-and-insights-collapse
updated: 2026-04-13
code:
  - app/(app)/review/page.tsx
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/voicebox-integration-analysis.md
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
-->

---
### Requirement: Review page section layout

The system SHALL organize the review page in the following order: Calm Index Trend (with curve graph and analyze button) followed by Conversation Insights section (collapsible).

#### Scenario: Page layout order

- **WHEN** user views the review page
- **THEN** system displays sections in this order from top to bottom:
  1. Calm Index Trend card (with curve graph and "平靜分析" button)
  2. Conversation Insights card (collapsible, default collapsed)

#### Scenario: Section transitions

- **WHEN** user scrolls between sections
- **THEN** section boundaries are clearly visible with consistent spacing
- **AND** card styling maintains visual distinction between sections

<!-- @trace
source: review-button-position-and-insights-collapse
updated: 2026-04-13
code:
  - app/(app)/review/page.tsx
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/voicebox-integration-analysis.md
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
-->

---
### Requirement: Analyze Button Sizing and Labeling

The system SHALL display a prominent "Analyze Recent Conversations" action button on the review page with clear visual hierarchy and correct labeling.

#### Scenario: Button text and size on desktop

- **WHEN** user views the review page on desktop (≥768px width)
- **THEN** the analyze button displays with:
  - Button text: "平靜分析" (Calm Analysis, not "分析最近對話")
  - Padding: `p-3` (increased from `p-2`)
  - Font size: `text-base` (increased from `text-sm`)
  - The button SHALL be visually prominent and easy to locate

#### Scenario: Button appearance on mobile

- **WHEN** user views the review page on mobile (<768px width)
- **THEN** the analyze button SHALL:
  - Display with the same text "平靜分析"
  - Maintain increased padding and font size for thumb-friendly interaction (≥44px height)
  - Be the primary action on the page


<!-- @trace
source: review-page-redesign
updated: 2026-04-14
code:
  - .spectra.yaml
  - docs/dev/voicebox-integration-analysis.md
  - app/(app)/chat/page.tsx
  - app/(app)/review/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - components/chat/chat-input.tsx
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - lib/speech.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - components/dashboard/calm-index-card.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - next-env.d.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Analysis Card Responsive Layout

The system SHALL optimize analysis card display for mobile devices to ensure readability without requiring manual zoom.

#### Scenario: Card text sizing on mobile

- **WHEN** user views analysis cards on mobile devices (<768px width)
- **THEN** the card content SHALL display with:
  - Default font size: `text-base` (minimum readable on mobile, changed from `text-sm`)
  - Proper line spacing for legibility
  - No horizontal scrolling required

#### Scenario: Card layout with visual distinction

- **WHEN** user views analysis cards (on any device)
- **THEN** each card SHALL display with:
  - Border: `border border-gray-200` for visual separation
  - Shadow: `shadow-sm` for depth
  - Rounded corners: `rounded-lg` for modern appearance
  - Adequate padding for breathing room
  - Title kept simple, body text enlarged

#### Scenario: Responsive padding on mobile

- **WHEN** user views cards on mobile (<768px width)
- **THEN** padding SHALL adjust from:
  - Desktop: `p-4`
  - Mobile: `p-2`
  - Ensure content is not cramped while maintaining screen real estate


<!-- @trace
source: review-page-redesign
updated: 2026-04-14
code:
  - .spectra.yaml
  - docs/dev/voicebox-integration-analysis.md
  - app/(app)/chat/page.tsx
  - app/(app)/review/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - components/chat/chat-input.tsx
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - lib/speech.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - components/dashboard/calm-index-card.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - next-env.d.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Calm Index Status Communication

The system SHALL clearly communicate when calm index data is unavailable and why.

#### Scenario: New account without sufficient data

- **WHEN** a new user logs in for the first time (0 days of email history)
- **THEN** the calm index card SHALL display:
  - A clear message stating: "需要至少 14 天的郵件數據才能計算平靜指數" (Calm Index requires at least 14 days of email data)
  - NOT a vague error message like "資料暫時無法載入" (Data temporarily unavailable)
  - The message SHALL be informative, not alarming

#### Scenario: Partial data accumulation

- **WHEN** user has been using the system for 5-13 days
- **THEN** the calm index card SHALL:
  - Display the same message about needing 14 days
  - Show optional progress (e.g., "5 of 14 days collected")
  - Encourage continued use of Gmail integration


<!-- @trace
source: review-page-redesign
updated: 2026-04-14
code:
  - .spectra.yaml
  - docs/dev/voicebox-integration-analysis.md
  - app/(app)/chat/page.tsx
  - app/(app)/review/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - components/chat/chat-input.tsx
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - lib/speech.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - components/dashboard/calm-index-card.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - next-env.d.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Curve Graph Drill-Down Interaction

The system SHALL allow users to view detailed daily analysis by clicking on the curve graph.

#### Scenario: Click to view daily analysis

- **WHEN** user clicks on a specific point or day on the curve graph
- **THEN** the system SHALL:
  - Display the detailed analysis card for that day (or closest day with data)
  - Smoothly transition or expand the card above/below the graph
  - Maintain the graph visible for context

#### Scenario: Return to overview

- **WHEN** user closes or dismisses the daily detail view
- **THEN** the system SHALL:
  - Return focus to the curve graph
  - Preserve the graph zoom/pan state if applicable

<!-- @trace
source: review-page-redesign
updated: 2026-04-14
code:
  - .spectra.yaml
  - docs/dev/voicebox-integration-analysis.md
  - app/(app)/chat/page.tsx
  - app/(app)/review/page.tsx
  - docs/修改bug/截圖 2026-04-13 下午3.28.18.png
  - components/chat/chat-input.tsx
  - docs/修改bug/截圖 2026-04-13 凌晨4.49.01.png
  - docs/新功能增加/截圖 2026-04-13 下午6.15.48.png
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - docs/新功能增加/截圖 2026-04-13 下午4.11.06.png
  - lib/speech.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.15.54.png
  - components/dashboard/calm-index-card.tsx
  - docs/修改bug/截圖 2026-04-13 下午6.26.19.png
  - docs/修改bug/C99A818A-2DDE-435D-8284-3A2826113A77.png
  - next-env.d.ts
  - docs/新功能增加/截圖 2026-04-13 下午6.16.03.png
  - docs/修改bug/D24514BC-492D-444F-82CA-C87F8E3E5837.png
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Collapsible insights section

The system SHALL display a collapsible insights section with visual toggle indicators using SVG icons.

#### Scenario: Insights expanded state shows chevron down

- **WHEN** user views the expanded insights section
- **THEN** system displays `ChevronDown` SVG icon from Lucide to indicate expanded state

#### Scenario: Insights collapsed state shows chevron up

- **WHEN** user views the collapsed insights section
- **THEN** system displays `ChevronUp` SVG icon from Lucide to indicate collapsed state

#### Scenario: Icon click toggles insights visibility

- **WHEN** user clicks on the chevron icon
- **THEN** insights section toggles visibility with smooth animation

---
### Requirement: Error state indicators

The system SHALL indicate error or invalid states using SVG icons.

#### Scenario: Error state shows X icon

- **WHEN** system encounters an error condition requiring visual indication
- **THEN** system displays `X` icon from Lucide to mark error state