# Calm Index Specification - Delta (UI Display Updates)

## ADDED Requirements

### Requirement: Data Insufficient Message

The system SHALL display a clear message when calm index data is unavailable due to insufficient history.

#### Scenario: Error state on new account

- **WHEN** user requests calm index data but has fewer than 14 days of email history
- **THEN** the system SHALL:
  - Return HTTP 422 Unprocessable Entity with the message
  - Frontend SHALL display: "需要至少 14 天的郵件數據才能計算平靜指數"
  - NOT display generic "資料暫時無法載入"
  - Include optional guidance on enabling Gmail integration

#### Scenario: Loading state

- **WHEN** system is fetching calm index data
- **THEN** frontend SHALL:
  - Display a skeleton loader or loading state
  - Not jump to error message prematurely
  - Timeout after 10 seconds and display the insufficient data message
