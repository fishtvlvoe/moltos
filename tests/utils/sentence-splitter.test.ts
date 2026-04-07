/**
 * tests/utils/sentence-splitter.test.ts
 *
 * TDD — 中文句子切割工具測試
 * 用於逐句串流 TTS：Gemini 串流進來時即時偵測完整句子
 */

import { describe, it, expect } from 'vitest';
import { extractCompleteSentences } from '@/lib/sentence-splitter';

describe('extractCompleteSentences', () => {
  it('單句，以句號結尾 → 回傳完整句 + 空 remainder', () => {
    const result = extractCompleteSentences('你好，我是小默。');
    expect(result.complete).toBe('你好，我是小默。');
    expect(result.remainder).toBe('');
  });

  it('多句 → 回傳全部完整句 + 最後未完成句', () => {
    const result = extractCompleteSentences('你好。我是小默。有什麼可以');
    expect(result.complete).toBe('你好。我是小默。');
    expect(result.remainder).toBe('有什麼可以');
  });

  it('以驚嘆號結尾 → 正確切割', () => {
    const result = extractCompleteSentences('太棒了！繼續加油！下一步');
    expect(result.complete).toBe('太棒了！繼續加油！');
    expect(result.remainder).toBe('下一步');
  });

  it('以問號結尾 → 正確切割', () => {
    const result = extractCompleteSentences('你還好嗎？我很好。');
    expect(result.complete).toBe('你還好嗎？我很好。');
    expect(result.remainder).toBe('');
  });

  it('沒有任何句號 → complete 為空，remainder 為全部', () => {
    const result = extractCompleteSentences('這是一段還沒結束的');
    expect(result.complete).toBe('');
    expect(result.remainder).toBe('這是一段還沒結束的');
  });

  it('空字串 → complete 和 remainder 都為空', () => {
    const result = extractCompleteSentences('');
    expect(result.complete).toBe('');
    expect(result.remainder).toBe('');
  });

  it('只有標點 → complete 為標點，remainder 為空', () => {
    const result = extractCompleteSentences('。');
    expect(result.complete).toBe('。');
    expect(result.remainder).toBe('');
  });

  it('英文句號也算完整句', () => {
    const result = extractCompleteSentences('Hello. World.');
    expect(result.complete).toBe('Hello. World.');
    expect(result.remainder).toBe('');
  });
});
