## ADDED Requirements

### Requirement: Risk tier engine evaluates multi-day trend thresholds

The system SHALL evaluate a user risk tier from multi-day trend thresholds including mood decline, stress-language increase, sleep disruption, and check-in irregularity.

#### Scenario: Risk threshold remains stable

- **WHEN** trend metrics stay within safe ranges for the configured evaluation window
- **THEN** the system keeps the user in the current low-risk tier

#### Scenario: Risk threshold is crossed

- **WHEN** configured trend thresholds are exceeded within the evaluation window
- **THEN** the system upgrades the user to a higher risk tier and stores the triggering factors

### Requirement: Escalation prompts include non-medical boundary messaging

The system SHALL present escalation prompts with clear non-medical disclaimers and optional therapist handoff actions.

#### Scenario: Medium-risk escalation prompt

- **WHEN** a user enters medium risk tier
- **THEN** the system shows a supportive prompt with disclaimer text and intervention-first recommendations

#### Scenario: High-risk escalation prompt

- **WHEN** a user enters high risk tier
- **THEN** the system shows a stronger recommendation with therapist-directory handoff action and non-medical disclaimer

