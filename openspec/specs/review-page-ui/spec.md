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