# insights-collapse-ui Specification

## Purpose

TBD - created by archiving change 'review-button-position-and-insights-collapse'. Update Purpose after archive.

## Requirements

### Requirement: Insights card collapse state

The system SHALL display the conversation insights section in a collapsible card format, with a toggle button that controls visibility of the insights list.

#### Scenario: Collapsed insights section (default)

- **WHEN** user views the review page
- **THEN** system displays the insights section in collapsed state with heading "▼ 對話洞察 ({count} 筆)" where {count} is the number of insights
- **AND** the individual insight cards are NOT visible

#### Scenario: User expands insights

- **WHEN** user clicks on the collapsed insights heading
- **THEN** system expands the section to show heading "▲ 對話洞察"
- **AND** all insight cards become visible below the heading
- **AND** the section heading remains clickable to collapse

#### Scenario: User collapses expanded insights

- **WHEN** user clicks on the expanded insights heading
- **THEN** system collapses the section
- **AND** individual insight cards become hidden
- **AND** heading returns to "▼ 對話洞察 ({count} 筆)"


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
### Requirement: Insights collapse state persistence

The system SHALL manage the collapse state locally for the current session (no persistence across page reloads).

#### Scenario: Collapse state resets on page reload

- **WHEN** user reloads the review page
- **THEN** insights section returns to collapsed state (default)

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