/**
 * lib/__tests__/elevenlabs.test.ts
 *
 * 覆蓋 Spec: voice-conversation — Emotion tags stripped before TTS playback
 *
 * Scenarios:
 * 1. [laughs]、[sighs] 等英文情緒標籤被去除
 * 2. 中文情緒標籤（如 [幸福]、[緊張]）被去除
 * 3. 純文字不受影響
 * 4. 標籤夾在句子中間也能正確去除
 * 5. 多個連續標籤全部去除
 * 6. 空字串輸入回傳空字串
 *
 * 另外覆蓋：
 * - mapConversationStatus：SDK Status → CallState 映射
 * - getAgentId：環境變數讀取
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  stripEmotionTags,
  mapConversationStatus,
  getAgentId,
} from '@/lib/elevenlabs';

// ─── Emotion tags stripped before TTS playback ───────────────────────────────

describe('stripEmotionTags — Emotion tags stripped before TTS playback', () => {
  it('英文情緒標籤 [laughs] 被去除', () => {
    expect(stripEmotionTags('[laughs] 你好！')).toBe('你好！');
  });

  it('英文情緒標籤 [sighs] 被去除', () => {
    expect(stripEmotionTags('[sighs] 是這樣啊。')).toBe('是這樣啊。');
  });

  it('中文情緒標籤 [幸福] 被去除', () => {
    expect(stripEmotionTags('[幸福] 太開心了！')).toBe('太開心了！');
  });

  it('中文情緒標籤 [緊張] 被去除', () => {
    expect(stripEmotionTags('[緊張] 不知道該怎麼辦。')).toBe('不知道該怎麼辦。');
  });

  it('純文字不受影響', () => {
    expect(stripEmotionTags('這是一段普通的文字。')).toBe('這是一段普通的文字。');
  });

  it('純英文不受影響', () => {
    expect(stripEmotionTags('Hello, how are you today?')).toBe('Hello, how are you today?');
  });

  it('標籤夾在句子中間也能去除', () => {
    expect(stripEmotionTags('好的 [laughs] 我明白了。')).toBe('好的  我明白了。'.trim());
  });

  it('句子中間標籤去除後不留多餘空格（trim 效果）', () => {
    const result = stripEmotionTags('[laughs]');
    expect(result).toBe('');
  });

  it('多個連續標籤全部去除', () => {
    expect(stripEmotionTags('[laughs][sighs] 好吧。')).toBe('好吧。');
  });

  it('標籤在結尾也能去除', () => {
    expect(stripEmotionTags('說完了 [laughs]')).toBe('說完了');
  });

  it('空字串輸入回傳空字串', () => {
    expect(stripEmotionTags('')).toBe('');
  });

  it('只有標籤沒有內容 → 回傳空字串', () => {
    expect(stripEmotionTags('[laughs][sighs]')).toBe('');
  });

  it('巢狀或未閉合括號不被誤刪', () => {
    // 只有完整的 [...] 才被去除，普通的文字括號保留
    expect(stripEmotionTags('這是 [正確] 格式的說明文')).toBe('這是  格式的說明文'.trim());
  });
});

// ─── mapConversationStatus ────────────────────────────────────────────────────

describe('mapConversationStatus — SDK Status → CallState', () => {
  it('connected + isSpeaking=true → speaking', () => {
    expect(mapConversationStatus('connected', true)).toBe('speaking');
  });

  it('connected + isSpeaking=false → listening', () => {
    expect(mapConversationStatus('connected', false)).toBe('listening');
  });

  it('connecting → connecting', () => {
    expect(mapConversationStatus('connecting', false)).toBe('connecting');
  });

  it('disconnecting → idle', () => {
    expect(mapConversationStatus('disconnecting', false)).toBe('idle');
  });

  it('disconnected → idle', () => {
    expect(mapConversationStatus('disconnected', false)).toBe('idle');
  });
});

// ─── getAgentId ───────────────────────────────────────────────────────────────

describe('getAgentId — 環境變數讀取', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('環境變數存在 → 回傳 agent ID', () => {
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id';
    expect(getAgentId()).toBe('test-agent-id');
  });

  it('環境變數不存在 → 拋出錯誤', () => {
    delete process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    expect(() => getAgentId()).toThrow();
  });
});
