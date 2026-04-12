## ADDED Requirements

### Requirement: AI sends a proactive greeting when chat loads

The system SHALL automatically send a context-aware greeting from the AI when the chat page loads for the first time in a session.

#### Scenario: Greeting sent on first session load

- **WHEN** an authenticated user opens the chat page with no in-session messages
- **THEN** the AI sends a greeting within 2 seconds; content varies by time of day (morning / afternoon / evening)

#### Scenario: Greeting reflects calm index state

- **WHEN** the user's latest calm index level is `attention` (score 0–39)
- **THEN** the greeting uses a softer, more concerned tone and asks how the user is feeling

#### Scenario: No duplicate greeting on page revisit

- **WHEN** the user navigates away and returns within the same session
- **THEN** no additional greeting is sent

---

### Requirement: Silence detection triggers proactive outreach

The system SHALL detect when a user has not interacted for more than 14 days and flag them for proactive outreach.

#### Scenario: Check-in triggered after 14 days of silence

- **WHEN** a user's last interaction is more than 14 days ago
- **THEN** the user is marked with status `pending_checkin`

#### Scenario: Proactive message content is personalized

- **WHEN** a proactive check-in message is generated
- **THEN** it references the user's last known calm index level and does NOT use a generic template

---

### Requirement: AI responses are context-aware of user's life signals

The system SHALL incorporate calm index and time-of-day signals into Gemini prompt construction.

#### Scenario: Calm index context included in prompt

- **WHEN** a Gemini prompt is constructed and a snapshot is available
- **THEN** the prompt includes the user's current calm index score, level, and elevated dimensions

#### Scenario: No calm index available — graceful degradation

- **WHEN** no snapshot exists
- **THEN** the prompt does NOT contain `null`, `undefined`, or placeholder text

#### Scenario: Time-of-day signal injected into prompt

- **WHEN** any AI response is generated
- **THEN** the prompt includes the current time period (morning / afternoon / evening / late night)
