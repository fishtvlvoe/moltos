# Chat Message UI - Emoji Replacement Delta

## MODIFIED Requirements

### Requirement: Streaming message cursor indicator

The system SHALL display a blinking cursor indicator during AI message streaming using a custom SVG instead of emoji.

#### Scenario: Streaming cursor renders during message generation

- **WHEN** AI is generating a response and streaming text
- **THEN** system displays custom `BlockCursor` SVG component at message end (previously `▌` emoji)

#### Scenario: Streaming cursor animates smoothly

- **WHEN** message is streaming
- **THEN** custom `BlockCursor` component animates with smooth blinking effect matching previous emoji appearance

#### Scenario: Cursor disappears when streaming completes

- **WHEN** AI completes message generation
- **THEN** custom `BlockCursor` component is removed and message displays normally

## Implementation Notes

- Create custom `BlockCursor` SVG React component in `components/icons/custom-icons.tsx`
- Component must support configurable size and color
- Animation timing SHALL match previous emoji appearance for visual continuity
- Ensure cursor is keyboard accessible with appropriate `aria-label`
