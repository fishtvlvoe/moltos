## Context

Gmail is the primary data source for MOLTOS' calm index analysis, but users currently have no way to manage their account beyond initial setup. If they want to switch to a different Gmail account, their only option is to log out completely (losing local data and account history). The "Remove Gmail Association" button in settings doesn't work—clicking it logs the user out instead of just disconnecting Gmail.

We need a complete account management flow that allows:
- Disconnecting Gmail without losing the MOLTOS account
- Switching to a different Gmail account
- Clear status displays so users know what's connected

## Goals / Non-Goals

**Goals:**

- Implement a working `/api/gmail/disconnect` endpoint
- Allow users to switch Gmail accounts without recreating their MOLTOS account
- Preserve calm index history through account switches and disconnections
- Display clear connection status (Connected/Not Connected/Connecting)
- Support confirmation dialogs to prevent accidental disconnections

**Non-Goals:**

- Supporting multiple Gmail accounts simultaneously (one account per MOLTOS user)
- Local recovery of deleted Gmail data (once disconnected, it's gone for metrics)
- Revoking Google OAuth tokens (nice-to-have, not critical)
- Google Workspace special permissions (single Gmail accounts are primary)

## Decisions

### Decision: Disconnect API Implementation

**Choice**: Create `POST /api/gmail/disconnect` endpoint that clears tokens but preserves user account and calm index history.

**Rationale**:
- Disconnection should be reversible (user can reconnect later)
- Calm index history should survive the disconnection (historical data is valuable)
- User's MOLTOS account is independent of Gmail integration

**Alternatives considered**:
- Soft delete (flag inactive) — rejected because it complicates the schema
- Also clear calm index history — rejected because users lose valuable data
- HTTP DELETE instead of POST — rejected because this is a state mutation with side effects, POST is more appropriate

### Decision: OAuth Account Switching

**Choice**: On "Switch Gmail Account", initiate standard Google OAuth with `prompt=select_account` and update existing user record with new tokens.

**Rationale**:
- Using `prompt=select_account` allows users to pick a different Google account they own
- Updating existing user (don't create new user) preserves account history and settings
- Mirrors familiar OAuth UX from other apps (Gmail, Slack, etc.)

**Alternatives considered**:
- Force new Gmail to be the primary and archive old one — rejected because it overcomplicates data model
- Require re-authentication — rejected because OAuth is frictionless and standard

### Decision: Token Clear on Switch

**Choice**: When user switches Gmail, immediately clear old tokens and replace with new ones. Reset "last sync" timestamp. Optional: clear daily metrics (since they're from different Gmail account).

**Rationale**:
- Prevents accidental use of old tokens for Gmail API calls
- Fresh sync with new Gmail account starts clean
- User understands the account has been updated

**Alternatives considered**:
- Keep old tokens as backup — rejected because it adds complexity and security risk
- Keep daily metrics from old account — neutral; can add policy later if needed

### Decision: Settings Page Status Component

**Choice**: Create `gmail-status.tsx` component that displays:
- Connected: Status badge (green), email address, last sync time, two action buttons
- Not connected: Status badge (gray), single "Connect Gmail" button
- Connecting: Status badge with spinner, buttons disabled

**Rationale**:
- Clear visual hierarchy matches design system
- Consistent UX across web/mobile
- Handles transient loading state (prevents user confusion)

**Alternatives considered**:
- Inline status without component — rejected because it reduces reusability
- Dialog modal for actions — rejected because settings page should stay in-place

### Decision: Confirmation Dialogs

**Choice**: Show confirmation before disconnect/switch, using modal with clear messaging in traditional Chinese.

**Rationale**:
- Prevents accidental account changes
- Reassures users that calm index history is preserved
- Matches existing design patterns in the app

**Alternatives considered**:
- No confirmation (direct action) — rejected because it's too risky
- Undo option instead of confirmation — rejected because reverts are complex with OAuth state

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| User accidentally clicks disconnect and loses Gmail integration | Confirmation dialog with clear messaging about what data is preserved |
| New Gmail account has no historical calm index data (metrics reset) | Message clarifies that historical data is preserved, but daily metrics restart |
| OAuth token refresh fails mid-disconnect | Implement transactional checks; if API fails, no token is deleted |
| User gets stuck in "Connecting..." state if OAuth times out | Add 30-second timeout; show error message and retry button |
| Multiple concurrent disconnect/switch requests could cause race conditions | Use database transaction or request deduplication on user ID |

## Migration Plan

1. **Phase 1**: Implement backend API `/api/gmail/disconnect`
   - Create route handler
   - Add database query to clear tokens
   - Add error handling and logging

2. **Phase 2**: Implement frontend UI changes
   - Fix `gmail-actions.tsx` to call `/api/gmail/disconnect` instead of `signOut()`
   - Create `gmail-status.tsx` component
   - Add confirmation dialogs

3. **Phase 3**: Deploy and monitor
   - Gradual rollout (canary release)
   - Monitor error logs for API failures
   - Watch for user feedback/support tickets
   - Collect metrics on switch/disconnect usage

## Open Questions

- Should we revoke Google OAuth tokens when disconnecting (for security)?
- Should daily metrics be preserved or reset when switching Gmail accounts?
- Should we track which Gmail account was previously connected (for analytics or UX)?
- Do we need a "reconnect to same Gmail" shortcut, or is full OAuth flow acceptable?
