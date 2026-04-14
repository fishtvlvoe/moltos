# Dashboard Today Progress - Emoji Replacement Delta

## MODIFIED Requirements

### Requirement: Email progress indicator icon

The system SHALL display email progress metrics with a visual envelope icon using SVG instead of emoji.

#### Scenario: Email icon renders correctly

- **WHEN** today progress card displays email count
- **THEN** system shows `Mail` SVG icon from Lucide (previously `📧`)

### Requirement: Reminder time indicator icon

The system SHALL display reminder scheduling status with a visual clock icon using SVG instead of emoji.

#### Scenario: Reminder icon renders correctly

- **WHEN** today progress card displays reminder status
- **THEN** system shows `Clock` or `AlarmClock` SVG icon from Lucide (previously `⏰`)

### Requirement: Night mode indicator icon

The system SHALL display nighttime progress with a visual moon icon using SVG instead of emoji.

#### Scenario: Night icon renders correctly

- **WHEN** today progress card displays nighttime metrics
- **THEN** system shows `Moon` SVG icon from Lucide (previously `🌙`)

## Implementation Notes

- Replace emoji characters in `icon` prop with Lucide icon imports
- Maintain all existing progress tracking logic and thresholds
- Ensure visual hierarchy remains consistent with overall dashboard layout
