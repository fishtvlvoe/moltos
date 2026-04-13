# Fix UI Mobile and Gmail Issues - Implementation Tasks

## 1. Button Updates (decision: unified button and typography updates)

- [ ] 1.1 Update `components/review/analyze-button.tsx`: change text to "平靜分析" — implements decision: unified button and typography updates
- [ ] 1.2 Increase button padding `p-2` → `p-3` and font size `text-sm` → `text-base`
- [ ] 1.3 Test button on desktop and mobile

## 2. Card Responsiveness

- [ ] 2.1 Update `components/dashboard/analysis-card.tsx`: responsive font `text-sm md:text-base`
- [ ] 2.2 Apply responsive padding `p-2 md:p-4`
- [ ] 2.3 Add border, rounded corners, shadow styling
- [ ] 2.4 Test mobile (<768px) and desktop (≥768px)

## 3. Calm Index Message (decision: error message replacement)

- [ ] 3.1 Update `components/dashboard/calm-index-card.tsx` error state — implements decision: error message replacement
- [ ] 3.2 Replace "資料暫時無法載入" with "需要至少 14 天的郵件數據才能計算平靜指數"
- [ ] 3.3 Test new account display
- [ ] 3.4 Test existing account with data

## 4. Gmail Disconnect (decision: gmail disconnect implementation path)

- [ ] 4.1 Create `app/api/gmail/disconnect/route.ts` — implements decision: gmail disconnect implementation path
- [ ] 4.2 Clear `gmail_access_token` and `gmail_refresh_token`
- [ ] 4.3 Error handling and HTTP response codes
- [ ] 4.4 Update `gmail-actions.tsx`: replace `signOut()` with `handleDisconnect()`
- [ ] 4.5 Add confirmation dialog
- [ ] 4.6 Add success/error messaging
- [ ] 4.7 Test full disconnect flow

## 5. Gmail Account Switching

- [ ] 5.1 Implement `handleSwitch()` in gmail-actions.tsx
- [ ] 5.2 Google OAuth with `prompt: 'select_account'`
- [ ] 5.3 Update user tokens
- [ ] 5.4 Refresh settings page with new email
- [ ] 5.5 Error handling for OAuth cancellation
- [ ] 5.6 Test full switch flow

## 6. Gmail Status Component

- [ ] 6.1 Create `components/settings/gmail-status.tsx`
- [ ] 6.2 Connected / Not Connected / Connecting states
- [ ] 6.3 Integrate into settings page
- [ ] 6.4 Test all states and transitions

## 7. Testing

- [ ] 7.1 Run `npm test`
- [ ] 7.2 Run `npm run lint`
- [ ] 7.3 Manual test all 4 fixes on mobile and desktop
- [ ] 7.4 Manual test Gmail disconnect and switch

## 8. Deployment

- [ ] 8.1 Create single PR for all 4 fixes
- [ ] 8.2 Code review
- [ ] 8.3 Deploy to staging → QA → production
