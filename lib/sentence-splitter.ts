/**
 * lib/sentence-splitter.ts
 *
 * 中文句子切割工具 — 用於逐句串流 TTS。
 * 偵測 Gemini 串流 buffer 中已完整的句子，讓 TTS 不需等全部文字。
 */

/** 句子結束標點符號 */
const SENTENCE_END = /[。！？.!?]/;

/**
 * 從累積的文字 buffer 中，切出所有「已完整的句子」。
 *
 * @param buffer - Gemini 串流到目前為止累積的文字
 * @returns complete — 可以立刻送 TTS 的完整句子（可能包含多句）
 *          remainder — 尚未結束的殘餘文字（留到下次繼續累積）
 */
export function extractCompleteSentences(buffer: string): {
  complete: string;
  remainder: string;
} {
  if (!buffer) return { complete: '', remainder: '' };

  // 找最後一個句子結束標點的位置
  let lastEndIdx = -1;
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (SENTENCE_END.test(buffer[i])) {
      lastEndIdx = i;
      break;
    }
  }

  if (lastEndIdx === -1) {
    // 沒有找到任何句尾標點 → 全部都是未完成句
    return { complete: '', remainder: buffer };
  }

  return {
    complete: buffer.slice(0, lastEndIdx + 1),
    remainder: buffer.slice(lastEndIdx + 1),
  };
}
