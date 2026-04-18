## ADDED Requirements

### Requirement: Confidential baseline assessment is required at onboarding

The system SHALL require a confidential baseline assessment before a user can enter the regular Today flow. The assessment MUST capture mood baseline, stress baseline, and current life-pressure context using structured questions.

#### Scenario: First-time user completes baseline

- **WHEN** a newly registered user finishes sign-up
- **THEN** the system presents the baseline assessment before showing the main dashboard

#### Scenario: Assessment completion unlocks daily loop

- **WHEN** the user submits all required baseline fields
- **THEN** the system stores a baseline snapshot and marks the user as check-in eligible

### Requirement: Daily check-in supports voice note and guided journal

The system SHALL provide one daily check-in entry with two input modes: a 60-second voice note and a guided journal prompt. The system MUST record mode, completion timestamp, and derived emotional signal summary.

#### Scenario: Voice check-in completion

- **WHEN** a user records and submits a voice note within the allowed duration
- **THEN** the system stores the voice entry and creates a sentiment-and-tone signal record

#### Scenario: Journal check-in completion

- **WHEN** a user completes a guided journal prompt and submits it
- **THEN** the system stores the journal entry and creates a language-stress signal record

### Requirement: Daily check-in enforces one canonical summary per day

The system SHALL create one canonical daily check-in summary per local calendar day per user to support deterministic trend calculations.

#### Scenario: User submits multiple check-ins in one day

- **WHEN** a user submits more than one check-in on the same day
- **THEN** the system marks the latest submission as canonical and retains prior submissions as history

