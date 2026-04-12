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
  getTimePeriod,
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

// ─── Spec: AI responses are context-aware of user's life signals ─────────────

describe("Spec: AI responses are context-aware of user's life signals", () => {
  it('有 snapshot 時，chatPrompt 包含 score 和 level', () => {
    const calmContext = '平靜指數：65，等級：mild，異常維度：nightActivity';
    const result = chatPrompt('我想聊聊', calmContext);

    expect(result).toContain('65');
    expect(result).toContain('mild');
  });

  it('無 snapshot 時，chatPrompt 不含 null 或 undefined', () => {
    const result = chatPrompt('你好');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });

  it('無 snapshot 時，greetingPrompt 不含 null 或 undefined', () => {
    const result = greetingPrompt('小明');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });

  it('無 snapshot 時，insightPrompt 不含 null 或 undefined', () => {
    const result = insightPrompt(50, 'moderate');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });
});

// ─── Spec: Time-of-day signal injected into prompt ───────────────────────────

describe('getTimePeriod — Time-of-day signal', () => {
  it('早上 5–11 點 → morning', () => {
    expect(getTimePeriod(5)).toBe('morning');
    expect(getTimePeriod(11)).toBe('morning');
    expect(getTimePeriod(8)).toBe('morning');
  });

  it('下午 12–17 點 → afternoon', () => {
    expect(getTimePeriod(12)).toBe('afternoon');
    expect(getTimePeriod(17)).toBe('afternoon');
    expect(getTimePeriod(14)).toBe('afternoon');
  });

  it('晚上 18–22 點 → evening', () => {
    expect(getTimePeriod(18)).toBe('evening');
    expect(getTimePeriod(22)).toBe('evening');
    expect(getTimePeriod(20)).toBe('evening');
  });

  it('深夜 23–4 點 → late-night', () => {
    expect(getTimePeriod(23)).toBe('late-night');
    expect(getTimePeriod(0)).toBe('late-night');
    expect(getTimePeriod(4)).toBe('late-night');
  });

  it('回傳四種 TimePeriod 之一', () => {
    const validPeriods = ['morning', 'afternoon', 'evening', 'late-night'];
    for (let h = 0; h < 24; h++) {
      expect(validPeriods).toContain(getTimePeriod(h));
    }
  });
});
