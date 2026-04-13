# Gmail Integration Complete - Implementation Tasks

## 1. Disconnect Gmail Integration and Gmail Disconnect API (decision: disconnect api implementation)

- [ ] 1.1 Create `app/api/gmail/disconnect/route.ts` POST handler — implements decision: disconnect api implementation and Gmail Disconnect API requirement
- [ ] 1.2 Implement database query to clear `gmail_access_token` and `gmail_refresh_token`
- [ ] 1.3 Add error handling: return 401/400/500 per Disconnect Gmail Integration spec
- [ ] 1.4 Return `{ success: true, message: "Gmail account disconnected" }`
- [ ] 1.5 Add logging for disconnect operations
- [ ] 1.6 Create unit test for disconnect endpoint
- [ ] 1.7 Test endpoint locally: verify tokens cleared, account preserved, calm_index_history preserved

## 2. Token Management (decision: token clear on switch)

- [ ] 2.1 Verify `users` table has `gmail_access_token` and `gmail_refresh_token` columns — implements Token Management requirement
- [ ] 2.2 If columns missing, create migration (nullable = true)
- [ ] 2.3 Implement token clear logic per decision: token clear on switch
- [ ] 2.4 Verify `calm_index_history` is independent of token state
- [ ] 2.5 Test disconnect doesn't orphan calm_index_history records

## 3. Frontend Disconnect Logic (decision: confirmation dialogs)

- [ ] 3.1 Update `components/settings/gmail-actions.tsx`: remove `signOut()` call — implements decision: confirmation dialogs
- [ ] 3.2 Implement `handleDisconnect()` calling `/api/gmail/disconnect`
- [ ] 3.3 Add confirmation dialog: "確定要移除 Gmail 關聯嗎？你的平靜指數歷史將被保留。"
- [ ] 3.4 Add success message: "Gmail 已移除"
- [ ] 3.5 Add error handling for API failure
- [ ] 3.6 Refresh settings page to "未連接" state
- [ ] 3.7 Test full disconnect flow

## 4. Switch Gmail Account and OAuth Authorization Flow (decision: oauth account switching)

- [ ] 4.1 Implement `handleSwitch()` — per Switch Gmail Account and OAuth Authorization Flow requirements
- [ ] 4.2 Add confirmation dialog per decision: oauth account switching
- [ ] 4.3 Initiate Google OAuth with `signIn('google', { prompt: 'select_account' })`
- [ ] 4.4 Refresh settings page to show new email after OAuth success
- [ ] 4.5 Add error handling for OAuth cancellation/failure
- [ ] 4.6 Test full switch flow: button → OAuth → new account → redirect → email updated

## 5. Gmail Connection Status Display (decision: settings page status component)

- [ ] 5.1 Create `components/settings/gmail-status.tsx` — implements Gmail Connection Status Display and decision: settings page status component
- [ ] 5.2 Fetch Gmail connection status (email, last sync, state)
- [ ] 5.3 Render "Connected" state: green badge, email, last sync, Switch/Remove buttons
- [ ] 5.4 Render "Not connected" state: gray badge, "Connect Gmail" button
- [ ] 5.5 Render "Connecting..." state: spinner, disabled buttons
- [ ] 5.6 Test all three states and transitions

## 6. Gmail Account Lifecycle and Gmail Integration

- [ ] 6.1 Verify Gmail Account Lifecycle is correctly handled: initial connection, switching, disconnection
- [ ] 6.2 Update settings page to use new `gmail-status.tsx` component
- [ ] 6.3 Wire up all button click handlers
- [ ] 6.4 Test full settings page with all connection states

## 7. Testing and Validation

- [ ] 7.1 Write integration test: disconnect flow
- [ ] 7.2 Write integration test: switch account flow
- [ ] 7.3 Write unit test: gmail-status component (3 states)
- [ ] 7.4 Run `npm test` — all tests pass
- [ ] 7.5 Run `npm run lint`
- [ ] 7.6 Manual test: disconnect → tokens cleared → account preserved
- [ ] 7.7 Manual test: switch Gmail → new tokens stored → new email shows

## 8. Deployment

- [ ] 8.1 Create PR
- [ ] 8.2 Request code review (auth flow + error handling)
- [ ] 8.3 Deploy to staging
- [ ] 8.4 QA verification
- [ ] 8.5 Deploy to production
- [ ] 8.6 Monitor error logs 24h
