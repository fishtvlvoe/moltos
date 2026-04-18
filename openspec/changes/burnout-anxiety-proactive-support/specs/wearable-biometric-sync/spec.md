## ADDED Requirements

### Requirement: Wearable connection and consent are explicit

The system SHALL require explicit user consent before collecting wearable data. The system MUST show which metrics are collected, how frequently they are synced, and how the user can disconnect the source.

#### Scenario: User grants wearable consent

- **WHEN** a user connects a wearable provider for the first time
- **THEN** the system records consent scope, consent timestamp, and provider identity

#### Scenario: User revokes wearable connection

- **WHEN** a user disconnects the wearable source
- **THEN** the system stops ingesting new wearable data immediately

### Requirement: Sleep and HRV signals are normalized for trend analysis

The system SHALL normalize wearable sleep and HRV values into daily comparable ranges for the risk engine.

#### Scenario: Provider payload arrives with sleep and HRV

- **WHEN** wearable sync data is received for a user day
- **THEN** the system transforms raw values into normalized daily metrics and stores them for trend computation

