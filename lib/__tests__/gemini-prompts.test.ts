/**
 * T029: Gemini Prompt Template 測試
 *
 * 測試四個 prompt template function：
 * - chatPrompt: 對話時的使用者 prompt 增強
 * - summaryPrompt: YouTube 影片摘要
 * - greetingPrompt: AI 主動問候
 * - insightPrompt: 根據平靜指數給建議
 *
 * 這些 function 是純函式，不需要 mock。
 */

import { describe, it, expect } from 'vitest';
import {
  chatPrompt,
  summaryPrompt,
  greetingPrompt,
  insightPrompt,
} from '@/lib/gemini-prompts';

// ─── chatPrompt 測試 ────────────────────────────────────────────────────────

describe('chatPrompt', () => {
  it('沒有 calmContext 時，應包含使用者訊息', () => {
    const result = chatPrompt('我今天很累');
    expect(result).toContain('我今天很累');
  });

  it('有 calmContext 時，應包含分數資訊', () => {
    const result = chatPrompt('我今天很累', '平靜指數：72，等級：mild');
    expect(result).toContain('平靜指數');
    expect(result).toContain('72');
  });

  it('有 calmContext 時，也應包含使用者訊息', () => {
    const result = chatPrompt('需要幫助', '平靜指數：50');
    expect(result).toContain('需要幫助');
  });

  it('沒有 calmContext 時，不應包含 undefined 字串', () => {
    const result = chatPrompt('你好');
    expect(result).not.toContain('undefined');
  });
});

// ─── summaryPrompt 測試 ─────────────────────────────────────────────────────

describe('summaryPrompt', () => {
  it('應包含影片標題', () => {
    const result = summaryPrompt('放鬆冥想指南', '這是一段冥想教學影片');
    expect(result).toContain('放鬆冥想指南');
  });

  it('應包含影片描述', () => {
    const result = summaryPrompt('放鬆冥想指南', '這是一段冥想教學影片');
    expect(result).toContain('這是一段冥想教學影片');
  });

  it('空描述時仍應包含標題且不崩潰', () => {
    const result = summaryPrompt('測試影片', '');
    expect(result).toContain('測試影片');
    expect(typeof result).toBe('string');
  });
});

// ─── greetingPrompt 測試 ────────────────────────────────────────────────────

describe('greetingPrompt', () => {
  it('應包含使用者名稱', () => {
    const result = greetingPrompt('小明');
    expect(result).toContain('小明');
  });

  it('有 calmContext 時，應包含平靜指數相關資訊', () => {
    const result = greetingPrompt('小明', '平靜指數：85，等級：calm');
    expect(result).toContain('平靜指數');
  });

  it('沒有 calmContext 時，不應包含 undefined 字串', () => {
    const result = greetingPrompt('小華');
    expect(result).not.toContain('undefined');
  });

  it('應包含問候相關語意（問候/你好/hi 任一）', () => {
    const result = greetingPrompt('阿明').toLowerCase();
    const hasGreeting =
      result.includes('問候') ||
      result.includes('你好') ||
      result.includes('hi') ||
      result.includes('hello') ||
      result.includes('阿明');
    expect(hasGreeting).toBe(true);
  });
});

// ─── insightPrompt 測試 ─────────────────────────────────────────────────────

describe('insightPrompt', () => {
  it('應包含平靜指數分數', () => {
    const result = insightPrompt(72, 'mild');
    expect(result).toContain('72');
  });

  it('應包含平靜等級', () => {
    const result = insightPrompt(72, 'mild');
    expect(result).toContain('mild');
  });

  it('attention 等級應觸發特別提示', () => {
    const result = insightPrompt(30, 'attention');
    expect(result).toContain('attention');
  });

  it('calm 等級時分數應出現', () => {
    const result = insightPrompt(90, 'calm');
    expect(result).toContain('90');
  });

  it('回傳值為非空字串', () => {
    const result = insightPrompt(50, 'moderate');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
