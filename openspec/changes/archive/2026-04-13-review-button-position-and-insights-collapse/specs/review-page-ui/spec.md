# Review Page UI Specification - Delta

## ADDED Requirements

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
