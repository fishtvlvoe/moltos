## ADDED Requirements

### Requirement: Therapist directory is available for escalation handoff

The system SHALL provide a therapist directory that users can browse from Support surfaces and escalation prompts.

#### Scenario: User opens directory from escalation prompt

- **WHEN** a user taps the therapist handoff action in an escalation prompt
- **THEN** the system opens the therapist directory with relevant filters preselected

### Requirement: Booking handoff captures referral attribution

The system SHALL track referral attribution for therapist handoff actions to support partner reporting and affiliate settlement.

#### Scenario: User selects therapist booking action

- **WHEN** a user proceeds from therapist profile to booking handoff
- **THEN** the system records referral metadata including user, therapist identifier, timestamp, and handoff channel

