## ADDED Requirements

### Requirement: Four Gmail dimensions extracted for calm index calculation

The system SHALL extract exactly four dimensions from Gmail metadata: daily message volume, reply latency, late-night activity (23:00–05:00), and unread accumulation. The system SHALL NOT read email body content.

#### Scenario: All four dimensions extracted from sufficient data

- **WHEN** Gmail metadata for at least 14 days is available
- **THEN** the system computes a numeric score for each of the four dimensions

#### Scenario: Insufficient data

- **WHEN** Gmail metadata covers fewer than 14 days
- **THEN** the system calculates from available data and sets `dataInsufficient: true`

#### Scenario: Email body content is never read

- **WHEN** the system fetches Gmail data
- **THEN** only `id`, `threadId`, `labelIds`, `internalDate`, and `sizeEstimate` are requested — no `body` or `payload`

---

### Requirement: Calm index score computed as 0–100 integer

The system SHALL compute a composite calm index score as an integer in the range 0–100.

#### Scenario: Score within valid range

- **WHEN** the calm index algorithm runs on any valid input
- **THEN** the returned `score` is an integer between 0 and 100 inclusive

#### Scenario: Score level label assigned

- **WHEN** a score is computed
- **THEN** a `level` is assigned: `calm` (80–100), `mild` (60–79), `moderate` (40–59), `attention` (0–39)

---

### Requirement: Calm index snapshot stored to database

The system SHALL store each calculation result as a snapshot record.

#### Scenario: Snapshot written after calculation

- **WHEN** a calm index calculation completes
- **THEN** a record is written with `user_id`, `score`, `level`, `dimensions`, `data_insufficient`, and `calculated_at`

#### Scenario: Latest snapshot served to dashboard

- **WHEN** the dashboard requests the calm index
- **THEN** the most recent snapshot is returned; if none exists, `{ score: null, level: null }` is returned

---

### Requirement: Dashboard displays calm index visualization

The system SHALL display the score, level label, and four dimension scores. Dimensions exceeding baseline thresholds SHALL be visually highlighted.

#### Scenario: Score and level displayed

- **WHEN** a snapshot is available
- **THEN** the UI shows composite score, level label, and four dimension bars

#### Scenario: Anomalous dimension highlighted

- **WHEN** a dimension score is below its baseline threshold
- **THEN** that dimension is rendered with a warning color or icon

#### Scenario: No data state handled gracefully

- **WHEN** no snapshot exists
- **THEN** the dashboard shows "Connect Gmail to see your Calm Index" without empty charts
