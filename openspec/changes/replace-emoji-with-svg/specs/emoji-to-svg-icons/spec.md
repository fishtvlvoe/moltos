# Emoji-to-SVG Icons Specification

## Purpose

Define a unified emoji-to-SVG icon mapping system that enables consistent visual representation across the entire application, replacing all emoji characters with Lucide icons or custom SVGs.

## ADDED Requirements

### Requirement: Icon mapping table

The system SHALL maintain a centralized mapping of emoji to SVG icon identifiers, enabling consistent substitution across all components.

#### Scenario: Mapping table contains Lucide icons

- **WHEN** a developer imports icon mapping
- **THEN** system provides emoji-to-Lucide mappings for `▼▲🚶😴💧📧⏰🌙♡❤️💬📤🔖📌` etc.

#### Scenario: Mapping table contains custom SVG icons

- **WHEN** an emoji has no Lucide equivalent (e.g., `▌` block cursor, `●` recording dot)
- **THEN** system provides custom SVG component reference for replacement

### Requirement: Custom SVG components for unmappable emoji

The system SHALL provide React SVG components for emoji that have no Lucide equivalent, enabling drop-in replacement in React elements.

#### Scenario: Block cursor SVG component available

- **WHEN** a component needs to display `▌` (block cursor for message streaming)
- **THEN** system provides `BlockCursor` SVG component with configurable size and color

#### Scenario: Recording indicator SVG component available

- **WHEN** a component needs to display `●` (recording indicator)
- **THEN** system provides `RecordingDot` SVG component with animation support

### Requirement: Icon import consistency

The system SHALL ensure all components import icons from a single source (Lucide + custom SVG registry), preventing scattered emoji usage.

#### Scenario: Component uses mapped icon

- **WHEN** a component previously rendered `🚶` via string
- **THEN** component imports `Footprints` from Lucide and renders it as React element

#### Scenario: Icon fallback behavior

- **WHEN** a mapped icon identifier is not found
- **THEN** system logs a warning and gracefully falls back to text placeholder

## Non-Functional Requirements

- **Performance**: Lucide icons are already lazy-loaded; no additional overhead
- **Accessibility**: All SVG icons SHALL have proper `aria-label` attributes
- **Browser Compatibility**: SVG rendering must work in all supported browsers (same as current Lucide support)
