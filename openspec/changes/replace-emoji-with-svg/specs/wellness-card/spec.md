# Wellness Card - Emoji Replacement Delta

## MODIFIED Requirements

### Requirement: Activity indicator icon

The system SHALL display activity wellness metrics with a visual activity icon using SVG instead of emoji.

#### Scenario: Activity icon renders correctly

- **WHEN** wellness card displays activity metrics
- **THEN** system shows `Footprints` SVG icon from Lucide (previously `🚶`)

### Requirement: Sleep indicator icon

The system SHALL display sleep wellness metrics with a visual sleep icon using SVG instead of emoji.

#### Scenario: Sleep icon renders correctly

- **WHEN** wellness card displays sleep metrics
- **THEN** system shows `Moon` SVG icon from Lucide (previously `😴`)

### Requirement: Hydration indicator icon

The system SHALL display hydration wellness metrics with a visual water icon using SVG instead of emoji.

#### Scenario: Hydration icon renders correctly

- **WHEN** wellness card displays hydration metrics
- **THEN** system shows `Droplet` SVG icon from Lucide (previously `💧`)

## Implementation Notes

- Replace emoji characters in `icon` prop with Lucide icon imports
- Maintain all existing wellness calculation logic and display format
- Ensure icons scale appropriately with layout
