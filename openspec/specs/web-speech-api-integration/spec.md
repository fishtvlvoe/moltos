# web-speech-api-integration Specification

## Purpose

TBD - created by archiving change 'fix-chat-input-speech-conflict'. Update Purpose after archive.

## Requirements

### Requirement: Component-level speech recognition instance management

The system SHALL manage speech recognition instances at the component level (using React useRef) rather than globally, allowing multiple components to independently control microphone access without interference.

#### Scenario: Chat input starts listening

- **WHEN** user clicks the microphone button in the chat input
- **THEN** system creates a speech recognition instance stored in the component's useRef
- **AND** this instance is isolated from other components' instances

#### Scenario: Microphone resources are fully released

- **WHEN** user stops listening (clicks stop button or timeout occurs)
- **THEN** system calls stop() on the speech recognition instance
- **AND** if the instance does not complete within 2 seconds, system calls abort() to forcefully release microphone resources
- **AND** the useRef is cleared to null

#### Scenario: Multiple components can use speech simultaneously

- **WHEN** two different chat input components are mounted on the page
- **THEN** each component maintains its own speech recognition instance
- **AND** one component's microphone usage does NOT prevent the other from initializing

#### Scenario: Old instances do not block new instances

- **WHEN** user starts listening, stops, and immediately starts again
- **THEN** the old instance is fully cleaned up before the new instance initializes
- **AND** the new instance successfully acquires microphone access


<!-- @trace
source: fix-chat-input-speech-conflict
updated: 2026-04-14
code:
  - app/(app)/chat/page.tsx
  - lib/speech.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - next-env.d.ts
  - app/(app)/review/page.tsx
  - components/chat/chat-input.tsx
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Callback isolation

The system SHALL isolate interim speech recognition callbacks at the component level, preventing global callback pollution when multiple components register callbacks simultaneously.

#### Scenario: Interim text is delivered to the correct component

- **WHEN** user speaks into the microphone while chat input is listening
- **THEN** interim recognized text is passed only to the component-level callback
- **AND** other components do NOT receive this interim text

#### Scenario: Callback cleanup on unmount

- **WHEN** a chat input component unmounts while listening
- **THEN** system clears the component's callback reference
- **AND** speech recognition is stopped without affecting other components


<!-- @trace
source: fix-chat-input-speech-conflict
updated: 2026-04-14
code:
  - app/(app)/chat/page.tsx
  - lib/speech.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - next-env.d.ts
  - app/(app)/review/page.tsx
  - components/chat/chat-input.tsx
tests:
  - lib/__tests__/speech.test.ts
-->

---
### Requirement: Timeout-based instance cleanup

The system SHALL enforce a 2-second timeout on instance cleanup to handle browser variations in speech recognition lifecycle.

#### Scenario: Instance stops normally

- **WHEN** user clicks stop button
- **THEN** system calls stop() and waits for the onend event
- **AND** if onend fires within 2 seconds, instance is immediately cleared

#### Scenario: Instance cleanup on timeout

- **WHEN** user clicks stop button but onend does not fire within 2 seconds
- **THEN** system calls abort() on the instance
- **AND** microphone resources are forcefully released
- **AND** the useRef is cleared to null

<!-- @trace
source: fix-chat-input-speech-conflict
updated: 2026-04-14
code:
  - app/(app)/chat/page.tsx
  - lib/speech.ts
  - docs/dev/ab-test-plan-elevenlabs-voicebox.md
  - next-env.d.ts
  - app/(app)/review/page.tsx
  - components/chat/chat-input.tsx
tests:
  - lib/__tests__/speech.test.ts
-->