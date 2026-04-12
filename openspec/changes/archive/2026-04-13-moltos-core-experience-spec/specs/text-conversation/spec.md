## ADDED Requirements

### Requirement: Chat agent connection and message dispatch

The system SHALL use the ElevenLabs Conversational AI SDK (`useConversation`) for text chat. Messages SHALL be sent via `sendUserMessage()` and responses received via the `onMessage` callback.

#### Scenario: Message sent while connected

- **WHEN** a user submits a message and the agent connection is active
- **THEN** the message is dispatched via `sendUserMessage()` and displayed immediately

#### Scenario: Message queued when not yet connected

- **WHEN** a user submits a message before the agent WebSocket is fully connected
- **THEN** the message is stored in a pending queue and sent automatically once connected

#### Scenario: Agent response received and displayed

- **WHEN** the `onMessage` callback fires with `source: "ai"` and non-empty content
- **THEN** the message is appended to the chat history

---

### Requirement: Chat messages stored to database

The system SHALL persist each chat message (user and AI turns) to the database, keyed by the user's Google ID.

#### Scenario: User message stored

- **WHEN** a user sends a message
- **THEN** a record is written with `role: "user"`, `content`, `user_id`, and `created_at`

#### Scenario: AI message stored

- **WHEN** the agent responds
- **THEN** a record is written with `role: "assistant"`, `content`, `user_id`, and `created_at`

#### Scenario: Empty AI message is not stored

- **WHEN** the `onMessage` callback fires with empty or whitespace-only content
- **THEN** no database record is written

---

### Requirement: Chat history retrieved per user

The system SHALL provide GET `/api/chat/history` to retrieve the authenticated user's conversation history.

#### Scenario: History returned for authenticated user

- **WHEN** an authenticated user requests GET `/api/chat/history`
- **THEN** the server returns messages ordered by `created_at` ascending

#### Scenario: Empty history returns empty array

- **WHEN** an authenticated user has no stored messages
- **THEN** the server returns HTTP 200 with `{ messages: [] }`

#### Scenario: Unauthenticated request rejected

- **WHEN** GET `/api/chat/history` is called without a valid session
- **THEN** the server returns HTTP 401

---

### Requirement: STT output converted from Simplified to Traditional Chinese

STT output SHALL be converted from Simplified Chinese to Traditional Chinese before display and storage.

#### Scenario: Simplified Chinese converted

- **WHEN** STT produces Simplified Chinese (e.g., `开心`)
- **THEN** the stored and displayed text uses Traditional Chinese (e.g., `開心`)

#### Scenario: Non-Chinese text is unmodified

- **WHEN** STT produces English or already-Traditional-Chinese text
- **THEN** the text is unchanged
