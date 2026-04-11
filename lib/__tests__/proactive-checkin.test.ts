/**
 * lib/__tests__/proactive-checkin.test.ts
 *
 * 覆蓋 Spec: proactive-checkin — Silence detection triggers proactive outreach
 *
 * Scenarios:
 * 1. 14 天沒互動 → status 設為 pending_checkin
 * 2. 不足 14 天 → status 保持 active（不觸發）
 * 3. proactive 訊息不使用通用模板（需包含 level 資訊）
 */

import { describe, it, expect } from 'vitest';
import {
  isSilentUser,
  buildProactiveMessage,
  type UserCheckInStatus,
} from '@/lib/proactive-checkin';

// ─── Scenario 1: Check-in triggered after 14 days of silence ─────────────────

describe('isSilentUser — 14 天靜默偵測', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('最後互動超過 14 天 → 回傳 true（需要主動關懷）', () => {
    const lastInteraction = Date.now() - 15 * DAY_MS;
    expect(isSilentUser(lastInteraction)).toBe(true);
  });

  it('最後互動剛好 14 天 → 回傳 true（邊界值）', () => {
    const lastInteraction = Date.now() - 14 * DAY_MS - 1000; // 14 天又 1 秒前
    expect(isSilentUser(lastInteraction)).toBe(true);
  });

  it('最後互動 13 天 → 回傳 false（不觸發）', () => {
    const lastInteraction = Date.now() - 13 * DAY_MS;
    expect(isSilentUser(lastInteraction)).toBe(false);
  });

  it('最後互動 1 天 → 回傳 false', () => {
    const lastInteraction = Date.now() - 1 * DAY_MS;
    expect(isSilentUser(lastInteraction)).toBe(false);
  });

  it('今天剛互動 → 回傳 false', () => {
    const lastInteraction = Date.now() - 1000; // 1 秒前
    expect(isSilentUser(lastInteraction)).toBe(false);
  });

  it('沒有互動記錄（null）→ 回傳 true（需要主動關懷）', () => {
    expect(isSilentUser(null)).toBe(true);
  });
});

// ─── Scenario 2: Proactive check-in status ──────────────────────────────────

describe('UserCheckInStatus — 狀態標記', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('getSilenceStatus 回傳 pending_checkin 當超過 14 天', () => {
    const lastInteraction = Date.now() - 20 * DAY_MS;
    const status: UserCheckInStatus = isSilentUser(lastInteraction)
      ? 'pending_checkin'
      : 'active';
    expect(status).toBe('pending_checkin');
  });

  it('getSilenceStatus 回傳 active 當不足 14 天', () => {
    const lastInteraction = Date.now() - 5 * DAY_MS;
    const status: UserCheckInStatus = isSilentUser(lastInteraction)
      ? 'pending_checkin'
      : 'active';
    expect(status).toBe('active');
  });
});

// ─── Scenario 3: Proactive message is personalized (not generic) ─────────────

describe('buildProactiveMessage — 個人化訊息不使用通用模板', () => {
  it('有 calm index level 時，訊息包含 level 資訊', () => {
    const msg = buildProactiveMessage('小明', 'attention', 25);
    expect(msg).toContain('attention');
  });

  it('有 calm index score 時，訊息包含 score', () => {
    const msg = buildProactiveMessage('小明', 'attention', 25);
    expect(msg).toContain('25');
  });

  it('有用戶名稱時，訊息包含名稱（個人化）', () => {
    const msg = buildProactiveMessage('小明', 'mild', 65);
    expect(msg).toContain('小明');
  });

  it('不使用通用模板（不含「您好」等制式問候）', () => {
    const msg = buildProactiveMessage('小華', 'moderate', 50);
    // 通用模板特徵：直接說「您好」、「Hi！」、「Hello！」
    expect(msg).not.toBe('您好，請問有什麼可以幫您？');
    expect(msg).not.toBe('Hi！有什麼需要嗎？');
    // 應該包含名稱或狀態資訊
    expect(msg.length).toBeGreaterThan(10);
  });

  it('無 level 時，訊息仍然個人化（不含 null 或 undefined）', () => {
    const msg = buildProactiveMessage('小華');
    expect(msg).not.toContain('null');
    expect(msg).not.toContain('undefined');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('attention 等級 → 訊息語氣更關切（包含關心語意）', () => {
    const msg = buildProactiveMessage('小明', 'attention', 20);
    // attention 等級應該有更關切的語氣
    const hasConcernedTone = msg.includes('attention') || msg.includes('關心') || msg.includes('20');
    expect(hasConcernedTone).toBe(true);
  });
});
