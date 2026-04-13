# Review Page UI Specification

## ADDED Requirements

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

## ADDED Requirements (continued)

### Requirement: Calm Index Display

The system SHALL display calm index information on the review page using a curve graph (instead of the previous daily stacked cards).

#### Scenario: Curve graph rendering

- **WHEN** user views the review page with sufficient data (≥14 days)
- **THEN** the system SHALL display:
  - A curve graph showing calm index trend over the last 14 days or 1 month
  - X-axis: dates
  - Y-axis: calm index score (0-100 or relevant scale)
  - Smooth curve interpolation between data points
  - Legend and tooltips for clarity

#### Scenario: Empty state for new accounts

- **WHEN** user has no calm index data (insufficient email history)
- **THEN** the review page SHALL display:
  - Calm index section with the message: "需要至少 14 天的郵件數據才能計算平靜指數"
  - NO empty graph placeholders or skeleton loaders
  - A call-to-action encouraging Gmail integration
