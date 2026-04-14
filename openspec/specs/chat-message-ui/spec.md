# Chat Message UI Specification

## Purpose

Defines the UI design and streaming message behavior for chat messages, including cursor indicators during message generation.

## Requirements

### Requirement: Streaming message cursor indicator

The system SHALL display a blinking cursor indicator during AI message streaming using a custom SVG instead of emoji.

#### Scenario: Streaming cursor renders during message generation

- **WHEN** AI is generating a response and streaming text
- **THEN** system displays custom `BlockCursor` SVG component at message end (previously `▌` emoji)

#### Scenario: Streaming cursor animates smoothly

- **WHEN** message is streaming
- **THEN** custom `BlockCursor` component animates with smooth blinking effect matching previous emoji appearance

#### Scenario: Cursor disappears when streaming completes

- **WHEN** AI completes message generation
- **THEN** custom `BlockCursor` component is removed and message displays normally

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