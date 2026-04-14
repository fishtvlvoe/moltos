# Review Page UI - Emoji Replacement Delta

## MODIFIED Requirements

### Requirement: Collapsible insights section

The system SHALL display a collapsible insights section with visual toggle indicators using SVG icons instead of emoji characters.

#### Scenario: Insights expanded state shows chevron down

- **WHEN** user views the expanded insights section
- **THEN** system displays `ChevronDown` SVG icon from Lucide to indicate expanded state (previously `▼`)

#### Scenario: Insights collapsed state shows chevron up

- **WHEN** user views the collapsed insights section
- **THEN** system displays `ChevronUp` SVG icon from Lucide to indicate collapsed state (previously `▲`)

#### Scenario: Icon click toggles insights visibility

- **WHEN** user clicks on the chevron icon
- **THEN** insights section toggles visibility with smooth animation

### Requirement: Error state indicators

The system SHALL indicate error or invalid states using SVG icons instead of emoji.

#### Scenario: Error state shows X icon

- **WHEN** system encounters an error condition requiring visual indication
- **THEN** system displays `X` icon from Lucide (previously `✕`) to mark error state

## Implementation Notes

- Replace emoji characters `▼▲✕` with React imports from Lucide
- Maintain all existing behavior and styling
- No breaking changes to component API or user interaction
