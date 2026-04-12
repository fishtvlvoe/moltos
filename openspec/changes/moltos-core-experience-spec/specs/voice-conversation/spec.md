## ADDED Requirements

### Requirement: Signed URL generation before call

The system SHALL generate a signed WebSocket URL via `/api/elevenlabs-signed-url` before establishing a voice call. The URL SHALL be generated server-side using `ELEVENLABS_API_KEY` and SHALL NOT expose the API key to the client.

#### Scenario: Successful signed URL generation

- **WHEN** an authenticated user requests a signed URL via GET `/api/elevenlabs-signed-url`
- **THEN** the server returns a JSON object with `{ url: string }` where the URL is a valid ElevenLabs WebSocket endpoint

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request is made to `/api/elevenlabs-signed-url` without a valid session
- **THEN** the server returns HTTP 401 and does NOT generate a signed URL

#### Scenario: Missing API key

- **WHEN** `ELEVENLABS_API_KEY` is not set in the environment
- **THEN** the server returns HTTP 500 with an error message and does NOT attempt to call ElevenLabs

---

### Requirement: Call session lifecycle management

The system SHALL manage the full lifecycle of a voice call: connecting, active call, and disconnection. The UI SHALL reflect each state distinctly.

#### Scenario: Call connects successfully

- **WHEN** the user clicks the call button and a signed URL is obtained
- **THEN** the ElevenLabs SDK establishes a WebSocket connection and the UI transitions to "active call" state

#### Scenario: Call ends by user

- **WHEN** the user clicks the end call button during an active call
- **THEN** the WebSocket connection is closed and the UI returns to "idle" state

#### Scenario: Call drops unexpectedly

- **WHEN** the WebSocket connection drops mid-call
- **THEN** after 3 failed reconnection attempts the UI returns to idle state with an error message

---

### Requirement: Post-call transcript stored via webhook

After a call ends, ElevenLabs SHALL call POST `/api/elevenlabs-webhook`. The system SHALL store the conversation transcript to the database.

#### Scenario: Successful transcript storage

- **WHEN** ElevenLabs posts a webhook payload with `conversation_id` and `transcript` array
- **THEN** each message is stored with `role`, `content`, `conversation_id`, and `created_at`; response is HTTP 200 with `{ saved: N }`

#### Scenario: Empty transcript is skipped gracefully

- **WHEN** the webhook payload has an empty `transcript` array
- **THEN** the server returns HTTP 200 with `{ saved: 0 }` and writes no records

#### Scenario: Partial DB failure does not block full response

- **WHEN** one message in the transcript fails to save
- **THEN** the system continues saving remaining messages and returns HTTP 200 with the count of successfully saved messages

#### Scenario: Invalid webhook payload is rejected

- **WHEN** the payload is missing `conversation_id` or `transcript`
- **THEN** the server returns HTTP 400 with a descriptive error message

---

### Requirement: Emotion tags stripped before TTS playback

Any text sent to TTS SHALL have emotion tags (e.g., `[laughs]`, `[sighs]`) stripped before playback.

#### Scenario: Emotion tags removed from AI response

- **WHEN** an AI response contains `[laughs]` or similar tags
- **THEN** the TTS receives the text with all tags and surrounding whitespace removed

#### Scenario: Text without emotion tags is unmodified

- **WHEN** an AI response contains no emotion tags
- **THEN** the text is passed to TTS unchanged
