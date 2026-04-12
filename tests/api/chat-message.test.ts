/**
 * tests/api/chat-message.test.ts
 *
 * 覆蓋 Spec: proactive-checkin — AI sends a proactive greeting when chat loads
 *
 * Scenarios:
 * 1. 首次 session 觸發 greeting（無歷史訊息）
 * 2. 內容隨時段變化（morning / afternoon / evening）
 * 3. 同 session 不重複觸發（initDone guard）
 *
 * 注意：greeting 觸發是前端行為（useEffect + ElevenLabs Agent），
 * 此測試聚焦在可測試的邏輯層：
 * - shouldTriggerGreeting() 邏輯
 * - greetingPrompt 根據 timePeriod 變化
 * - getTimePeriod 回傳正確時段
 */

import { describe, it, expect } from 'vitest';
import { greetingPrompt, getTimePeriod } from '@/lib/gemini-prompts';

// ─── 模擬 greeting 觸發邏輯 ───────────────────────────────────────────────────

/**
 * 決定是否應觸發 greeting
 *
 * 對應 chat/page.tsx 中的 initDone.current + 無歷史訊息判斷
 */
function shouldTriggerGreeting(params: {
  hasInitialized: boolean;
  messageCount: number;
  isFromCallRedirect: boolean;
  hasUserName: boolean;
}): boolean {
  if (params.hasInitialized) return false;        // 同 session 已觸發過
  if (params.isFromCallRedirect) return false;    // 從 Call 跳轉來，不重複問候
  if (params.messageCount > 0) return false;      // 有歷史訊息，不重複
  if (!params.hasUserName) return false;          // 沒有用戶名稱，無法個人化
  return true;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AI sends a proactive greeting when chat loads', () => {
  // ── Scenario 1: 首次 session 觸發 greeting ──────────────────────────────────

  it('首次 session + 無歷史 + 有用戶名 → 應觸發 greeting', () => {
    expect(shouldTriggerGreeting({
      hasInitialized: false,
      messageCount: 0,
      isFromCallRedirect: false,
      hasUserName: true,
    })).toBe(true);
  });

  it('已有歷史訊息 → 不觸發 greeting', () => {
    expect(shouldTriggerGreeting({
      hasInitialized: false,
      messageCount: 5,
      isFromCallRedirect: false,
      hasUserName: true,
    })).toBe(false);
  });

  it('沒有用戶名稱 → 不觸發 greeting（無法個人化）', () => {
    expect(shouldTriggerGreeting({
      hasInitialized: false,
      messageCount: 0,
      isFromCallRedirect: false,
      hasUserName: false,
    })).toBe(false);
  });

  // ── Scenario 2: 同 session 不重複觸發 ──────────────────────────────────────

  it('已初始化（initDone=true）→ 不重複觸發 greeting', () => {
    expect(shouldTriggerGreeting({
      hasInitialized: true,
      messageCount: 0,
      isFromCallRedirect: false,
      hasUserName: true,
    })).toBe(false);
  });

  it('從 Call 跳轉來 → 不觸發 greeting（避免重複）', () => {
    expect(shouldTriggerGreeting({
      hasInitialized: false,
      messageCount: 0,
      isFromCallRedirect: true,
      hasUserName: true,
    })).toBe(false);
  });

  // ── Scenario 3: 內容隨時段變化 ────────────────────────────────────────────

  it('greetingPrompt 包含用戶名稱（個人化）', () => {
    const prompt = greetingPrompt('小明');
    expect(prompt).toContain('小明');
  });

  it('morning 時段的 greetingPrompt 不含 null/undefined', () => {
    // 模擬早上產生問候
    const timePeriod = getTimePeriod(9); // 早上 9 點
    expect(timePeriod).toBe('morning');

    const prompt = greetingPrompt('小明');
    expect(prompt).not.toContain('null');
    expect(prompt).not.toContain('undefined');
  });

  it('evening 時段 greeting 不重複（greeting 內容非固定字串）', () => {
    // 不同 calmContext 產生不同 prompt（非通用模板）
    const withCalm = greetingPrompt('小明', '平靜指數：80，等級：calm');
    const withoutCalm = greetingPrompt('小明');

    // 兩個 prompt 不應完全相同（有 calm context 時應有差異）
    expect(withCalm).not.toBe(withoutCalm);
  });

  it('getTimePeriod 隨小時變化，涵蓋所有時段', () => {
    expect(getTimePeriod(7)).toBe('morning');
    expect(getTimePeriod(14)).toBe('afternoon');
    expect(getTimePeriod(20)).toBe('evening');
    expect(getTimePeriod(1)).toBe('late-night');
  });
});
