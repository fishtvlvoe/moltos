# emoji-to-svg-icons Specification

## Purpose

TBD - created by archiving change 'replace-emoji-with-svg'. Update Purpose after archive.

## Requirements

### Requirement: Icon mapping table

The system SHALL maintain a centralized mapping of emoji to SVG icon identifiers, enabling consistent substitution across all components.

#### Scenario: Mapping table contains Lucide icons

- **WHEN** a developer imports icon mapping
- **THEN** system provides emoji-to-Lucide mappings for `▼▲🚶😴💧📧⏰🌙♡❤️💬📤🔖📌` etc.

#### Scenario: Mapping table contains custom SVG icons

- **WHEN** an emoji has no Lucide equivalent (e.g., `▌` block cursor, `●` recording dot)
- **THEN** system provides custom SVG component reference for replacement


<!-- @trace
source: replace-emoji-with-svg
updated: 2026-04-14
code:
  - components/icons/index.ts
  - components/dashboard/today-progress.tsx
  - next-env.d.ts
  - components/chat/message-bubble.tsx
  - fishtvlove-carousel-v2.html.bak
  - fishtvlove-carousel-classic.html
  - docs/api/settings.md
  - app/globals.css
  - components/dashboard/wellness-card.tsx
  - components/icons/custom-icons.tsx
  - fishtvlove-carousel-classic.html.bak
  - lib/icon-mapping.ts
  - fishtvlove-carousel.html.bak
  - app/(app)/review/page.tsx
  - fishtvlove-carousel.html
  - fishtvlove-carousel-v2.html
tests:
  - __tests__/e2e/settings-flow.test.ts
  - components/icons/custom-icons.test.tsx
  - tests/components/wellness-card-icons.test.tsx
  - tests/components/review-page-icons.test.tsx
  - tests/components/message-bubble.test.tsx
  - lib/icon-mapping.test.ts
  - tests/components/today-progress-icons.test.tsx
-->

---
### Requirement: Custom SVG components for unmappable emoji

The system SHALL provide React SVG components for emoji that have no Lucide equivalent, enabling drop-in replacement in React elements.

#### Scenario: Block cursor SVG component available

- **WHEN** a component needs to display `▌` (block cursor for message streaming)
- **THEN** system provides `BlockCursor` SVG component with configurable size and color

#### Scenario: Recording indicator SVG component available

- **WHEN** a component needs to display `●` (recording indicator)
- **THEN** system provides `RecordingDot` SVG component with animation support


<!-- @trace
source: replace-emoji-with-svg
updated: 2026-04-14
code:
  - components/icons/index.ts
  - components/dashboard/today-progress.tsx
  - next-env.d.ts
  - components/chat/message-bubble.tsx
  - fishtvlove-carousel-v2.html.bak
  - fishtvlove-carousel-classic.html
  - docs/api/settings.md
  - app/globals.css
  - components/dashboard/wellness-card.tsx
  - components/icons/custom-icons.tsx
  - fishtvlove-carousel-classic.html.bak
  - lib/icon-mapping.ts
  - fishtvlove-carousel.html.bak
  - app/(app)/review/page.tsx
  - fishtvlove-carousel.html
  - fishtvlove-carousel-v2.html
tests:
  - __tests__/e2e/settings-flow.test.ts
  - components/icons/custom-icons.test.tsx
  - tests/components/wellness-card-icons.test.tsx
  - tests/components/review-page-icons.test.tsx
  - tests/components/message-bubble.test.tsx
  - lib/icon-mapping.test.ts
  - tests/components/today-progress-icons.test.tsx
-->

---
### Requirement: Icon import consistency

The system SHALL ensure all components import icons from a single source (Lucide + custom SVG registry), preventing scattered emoji usage.

#### Scenario: Component uses mapped icon

- **WHEN** a component previously rendered `🚶` via string
- **THEN** component imports `Footprints` from Lucide and renders it as React element

#### Scenario: Icon fallback behavior

- **WHEN** a mapped icon identifier is not found
- **THEN** system logs a warning and gracefully falls back to text placeholder

<!-- @trace
source: replace-emoji-with-svg
updated: 2026-04-14
code:
  - components/icons/index.ts
  - components/dashboard/today-progress.tsx
  - next-env.d.ts
  - components/chat/message-bubble.tsx
  - fishtvlove-carousel-v2.html.bak
  - fishtvlove-carousel-classic.html
  - docs/api/settings.md
  - app/globals.css
  - components/dashboard/wellness-card.tsx
  - components/icons/custom-icons.tsx
  - fishtvlove-carousel-classic.html.bak
  - lib/icon-mapping.ts
  - fishtvlove-carousel.html.bak
  - app/(app)/review/page.tsx
  - fishtvlove-carousel.html
  - fishtvlove-carousel-v2.html
tests:
  - __tests__/e2e/settings-flow.test.ts
  - components/icons/custom-icons.test.tsx
  - tests/components/wellness-card-icons.test.tsx
  - tests/components/review-page-icons.test.tsx
  - tests/components/message-bubble.test.tsx
  - lib/icon-mapping.test.ts
  - tests/components/today-progress-icons.test.tsx
-->