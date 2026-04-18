## ADDED Requirements

### Requirement: Intervention recommendations are personalized from recent signals

The system SHALL recommend micro-interventions based on recent check-in signals and risk tier. The recommendation set MUST be limited to non-clinical short-form interventions.

#### Scenario: Low-risk user receives gentle intervention

- **WHEN** a user has low-risk trend signals
- **THEN** the system recommends one lightweight intervention such as breathing or gratitude journaling

#### Scenario: Rising-risk user receives focused intervention

- **WHEN** a user has rising-risk trend signals
- **THEN** the system recommends a focused intervention such as CBT reframing or grounding

### Requirement: Intervention player supports immersive completion flow

The system SHALL provide an immersive player for intervention sessions with start, pause, resume, and complete events.

#### Scenario: User completes a guided breathing session

- **WHEN** the user starts and finishes a breathing intervention
- **THEN** the system records completion and associates it with the user’s daily support history

