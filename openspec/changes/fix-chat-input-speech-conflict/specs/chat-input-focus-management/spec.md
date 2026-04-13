## Purpose

Defines focus management for the chat input textarea to prevent external SDKs (such as ElevenLabs) from hijacking focus during normal text input mode.

## ADDED Requirements

### Requirement: Focus restoration after speech recognition

The system SHALL restore focus to the textarea after speech recognition ends, ensuring users can immediately continue typing without manually clicking the input field.

#### Scenario: Focus returns to textarea after listening stops

- **WHEN** user finishes speaking and stops listening
- **THEN** system automatically restores focus to the textarea
- **AND** user can immediately begin typing without clicking

#### Scenario: Focus is not restored during listening

- **WHEN** user is actively listening (microphone is open)
- **THEN** system does NOT attempt to restore textarea focus
- **AND** focus remains on the microphone listening state

#### Scenario: Focus is not restored if user manually focused elsewhere

- **WHEN** user stops listening but has manually clicked on another element
- **THEN** system checks if another element already has focus
- **AND** system does NOT override the user's explicit focus choice

### Requirement: Concurrent SDK focus management

The system SHALL prevent background SDKs from hijacking the textarea focus during normal text input.

#### Scenario: Textarea maintains focus during ElevenLabs connection

- **WHEN** ElevenLabs WebSocket is connected and active
- **AND** user clicks on the textarea to type
- **THEN** textarea successfully receives focus
- **AND** focus is not stolen by the ElevenLabs SDK

#### Scenario: Text input is possible while WebSocket is connected

- **WHEN** ElevenLabs WebSocket is connected
- **AND** user clicks the textarea and begins typing
- **THEN** all keydown and change events are successfully captured
- **AND** text is correctly appended to the input value

### Requirement: No focus thrashing

The system SHALL avoid repeatedly setting focus, which could cause visual jitter or interrupt the user experience.

#### Scenario: Focus is set only once after listening stops

- **WHEN** user stops listening and the listening state transitions from true to false
- **THEN** system sets focus exactly once
- **AND** subsequent state changes do NOT trigger additional focus operations

#### Scenario: Focus is not set on every render

- **WHEN** the component re-renders for reasons unrelated to listening state change
- **THEN** the focus management effect does NOT run
- **AND** user experience is smooth without focus thrashing
