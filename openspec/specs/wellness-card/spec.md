# Wellness Card Specification

## Purpose

Defines the wellness metrics display including activity, sleep, and hydration indicators on the dashboard wellness card.

## Requirements

### Requirement: Activity indicator icon

The system SHALL display activity wellness metrics with a visual activity icon using SVG instead of emoji.

#### Scenario: Activity icon renders correctly

- **WHEN** wellness card displays activity metrics
- **THEN** system shows `Footprints` SVG icon from Lucide (previously `🚶`)


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
### Requirement: Sleep indicator icon

The system SHALL display sleep wellness metrics with a visual sleep icon using SVG instead of emoji.

#### Scenario: Sleep icon renders correctly

- **WHEN** wellness card displays sleep metrics
- **THEN** system shows `Moon` SVG icon from Lucide (previously `😴`)


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
### Requirement: Hydration indicator icon

The system SHALL display hydration wellness metrics with a visual water icon using SVG instead of emoji.

#### Scenario: Hydration icon renders correctly

- **WHEN** wellness card displays hydration metrics
- **THEN** system shows `Droplet` SVG icon from Lucide (previously `💧`)

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