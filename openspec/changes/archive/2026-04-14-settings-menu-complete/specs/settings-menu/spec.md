# Settings Menu Specification (Delta)

## Purpose

Specifies the modified settings menu interface with SVG icons replacing emoji and new navigable menu items.

## Requirements

## ADDED Requirements

### Requirement: Settings menu displays navigation items with SVG icons

The system SHALL display a settings menu with five navigation items, each with an SVG icon (Lucide React) and label for easy navigation to different settings pages.

#### Scenario: Settings menu displays correct icons

- **WHEN** user views the settings page
- **THEN** system displays five menu items with SVG icons:
  - Bell icon → "通知設定" (Notifications)
  - Clock icon → "提醒排程" (Reminders)
  - Newspaper/Database icon → "資訊來源" (Sources)
  - Lock/Shield icon → "隱私與資料" (Privacy)
  - Mail/MessageSquare icon → "Gmail 整合" (Gmail Integration)

#### Scenario: Icon styling consistency

- **WHEN** user views the menu items
- **THEN** all icons are properly sized (24px), colored consistently (#666 or theme color), and centered in their layout

#### Scenario: Mobile responsiveness

- **WHEN** user views settings menu on mobile device
- **THEN** icons remain properly sized and readable at mobile viewport width

### Requirement: Menu items are navigable to their respective pages

The system SHALL make menu items clickable, navigating to their respective settings pages.

**Original behavior**: Menu items were static placeholders without navigation (via `opacity-60`, `cursor-default`).

**Updated behavior**: Menu items are interactive and navigate to functional pages.

#### Scenario: Click notification settings

- **WHEN** user clicks "通知設定" menu item
- **THEN** system navigates to `/settings/notifications`

#### Scenario: Click reminder schedule

- **WHEN** user clicks "提醒排程" menu item
- **THEN** system navigates to `/settings/reminders`

#### Scenario: Click information sources

- **WHEN** user clicks "資訊來源" menu item
- **THEN** system navigates to `/settings/sources`

#### Scenario: Click privacy and data

- **WHEN** user clicks "隱私與資料" menu item
- **THEN** system navigates to `/settings/privacy`

#### Scenario: Click Gmail integration (no behavior change)

- **WHEN** user clicks "Gmail 整合" menu item
- **THEN** system navigates to `/settings/gmail` (existing behavior unchanged)

### Requirement: Menu items maintain visual consistency with Gmail settings

The menu design SHALL follow the same visual hierarchy, spacing, and interaction patterns as the existing Gmail settings page.

#### Scenario: Divider lines between items

- **WHEN** user views menu items
- **THEN** divider lines appear between items (except after the last item)

#### Scenario: Hover state feedback

- **WHEN** user hovers over a menu item (desktop)
- **THEN** system displays subtle visual feedback (e.g., background color change, shadow)

#### Scenario: Touch target size

- **WHEN** user views menu items on mobile
- **THEN** each menu item has a minimum touch target of 44×44px
