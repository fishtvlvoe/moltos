/**
 * lib/__tests__/speech.test.ts
 *
 * 覆蓋 Spec: text-conversation — STT output converted from Simplified to Traditional Chinese
 *
 * Scenarios:
 * 1. Simplified Chinese converted — `开心` → `開心`
 * 2. Non-Chinese text is unmodified — 英文、數字保持不變
 * 3. Already-Traditional Chinese is unmodified
 */

import { describe, it, expect } from 'vitest';
import { toTraditionalChinese } from '@/lib/speech';

describe('toTraditionalChinese — STT output converted from Simplified to Traditional Chinese', () => {
  // ── Scenario 1: Simplified Chinese converted ────────────────────────────────

  it('开心 → 開心', () => {
    expect(toTraditionalChinese('开心')).toBe('開心');
  });

  it('开始 → 開始', () => {
    expect(toTraditionalChinese('开始')).toBe('開始');
  });

  it('没有 → 沒有', () => {
    expect(toTraditionalChinese('没有')).toBe('沒有');
  });

  it('为什么 → 為什麼', () => {
    expect(toTraditionalChinese('为什么')).toBe('為什麼');
  });

  it('句子中夾雜簡體字 → 只轉換簡體部分', () => {
    expect(toTraditionalChinese('我们来说说这个问题')).toBe('我們來說說這個問題');
  });

  it('完整簡體句子 → 轉換所有對應字', () => {
    expect(toTraditionalChinese('我来开始说话')).toBe('我來開始說話');
  });

  // ── Scenario 2: Non-Chinese text is unmodified ──────────────────────────────

  it('純英文不受影響', () => {
    expect(toTraditionalChinese('Hello, how are you today?')).toBe('Hello, how are you today?');
  });

  it('純數字不受影響', () => {
    expect(toTraditionalChinese('12345')).toBe('12345');
  });

  it('英文夾中文 → 只轉換中文部分', () => {
    expect(toTraditionalChinese('I am 开心 today')).toBe('I am 開心 today');
  });

  it('空字串回傳空字串', () => {
    expect(toTraditionalChinese('')).toBe('');
  });

  // ── Scenario 3: Already-Traditional Chinese is unmodified ───────────────────

  it('繁體中文不受影響 — 開心保持 開心', () => {
    expect(toTraditionalChinese('開心')).toBe('開心');
  });

  it('繁體完整句子不受影響', () => {
    const traditional = '我今天很開心，讓我們來說說這個問題。';
    expect(toTraditionalChinese(traditional)).toBe(traditional);
  });

  it('混合繁簡文字 → 只轉換簡體部分', () => {
    // 已有繁體 開心，遇到簡體 没有 才轉
    expect(toTraditionalChinese('開心没有变化')).toContain('沒有');
    expect(toTraditionalChinese('開心没有变化')).toContain('開心');
  });
});
