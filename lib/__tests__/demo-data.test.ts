/**
 * T046: demo-data.ts 結構與完整性測試
 *
 * 確保 demoData 符合 DemoData 型別，且所有欄位有足夠的資料量，
 * 以便在斷網時能正常展示 demo 模式。
 */

import { describe, it, expect } from 'vitest';
import { demoData } from '@/lib/demo-data';

describe('demoData 基本結構', () => {
  it('demoData 有所有必要欄位', () => {
    // 確認頂層欄位都存在
    expect(demoData).toBeDefined();
    expect(demoData.user).toBeDefined();
    expect(demoData.gmailMetrics).toBeDefined();
    expect(demoData.calmIndex).toBeDefined();
    expect(demoData.videos).toBeDefined();
    expect(demoData.chatHistory).toBeDefined();
  });

  it('user 欄位有 name 和 email', () => {
    expect(typeof demoData.user.name).toBe('string');
    expect(demoData.user.name.length).toBeGreaterThan(0);
    expect(typeof demoData.user.email).toBe('string');
    expect(demoData.user.email).toContain('@');
  });
});

describe('gmailMetrics 資料量驗證', () => {
  it('dailyCounts 至少有 14 個 DataPoint', () => {
    expect(demoData.gmailMetrics.dailyCounts.length).toBeGreaterThanOrEqual(14);
  });

  it('replyLatencies 至少有 14 個 DataPoint', () => {
    expect(demoData.gmailMetrics.replyLatencies.length).toBeGreaterThanOrEqual(14);
  });

  it('nightActivity 至少有 14 個 DataPoint', () => {
    expect(demoData.gmailMetrics.nightActivity.length).toBeGreaterThanOrEqual(14);
  });

  it('unreadCounts 至少有 14 個 DataPoint', () => {
    expect(demoData.gmailMetrics.unreadCounts.length).toBeGreaterThanOrEqual(14);
  });

  it('每個 DataPoint 都有 timestamp 和 value', () => {
    // 抽查 dailyCounts 的每個資料點
    demoData.gmailMetrics.dailyCounts.forEach((pt, i) => {
      expect(typeof pt.timestamp, `dailyCounts[${i}].timestamp`).toBe('number');
      expect(typeof pt.value, `dailyCounts[${i}].value`).toBe('number');
      expect(pt.timestamp).toBeGreaterThan(0);
    });
  });

  it('coverageDays 是正整數', () => {
    expect(demoData.gmailMetrics.coverageDays).toBeGreaterThan(0);
    expect(Number.isInteger(demoData.gmailMetrics.coverageDays)).toBe(true);
  });

  it('lastUpdated 是合理的時間戳記', () => {
    // 應在過去一年內
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    expect(demoData.gmailMetrics.lastUpdated).toBeGreaterThan(oneYearAgo);
  });
});

describe('calmIndex 資料驗證', () => {
  it('score 在 0–100 之間', () => {
    expect(demoData.calmIndex.result.score).toBeGreaterThanOrEqual(0);
    expect(demoData.calmIndex.result.score).toBeLessThanOrEqual(100);
  });

  it('level 為合法值之一', () => {
    const validLevels = ['calm', 'mild', 'moderate', 'attention'];
    expect(validLevels).toContain(demoData.calmIndex.result.level);
  });

  it('dimensions 有 4 個（不含 voiceEmotion）', () => {
    // MVP 只需要四個主要維度
    const dims = demoData.calmIndex.result.dimensions;
    expect(dims.length).toBe(4);

    // 確認 voiceEmotion 不在其中
    const hasVoiceEmotion = dims.some((d) => d.dimension === 'voiceEmotion');
    expect(hasVoiceEmotion).toBe(false);
  });

  it('每個 dimension 都有合法的 score（0–100）', () => {
    demoData.calmIndex.result.dimensions.forEach((dim) => {
      expect(dim.score, `${dim.dimension}.score`).toBeGreaterThanOrEqual(0);
      expect(dim.score, `${dim.dimension}.score`).toBeLessThanOrEqual(100);
    });
  });

  it('四個必要維度都存在', () => {
    const requiredDimensions = [
      'messageVolume',
      'replyLatency',
      'nightActivity',
      'unreadPileup',
    ];
    const dimNames = demoData.calmIndex.result.dimensions.map((d) => d.dimension);
    requiredDimensions.forEach((name) => {
      expect(dimNames, `缺少維度：${name}`).toContain(name);
    });
  });

  it('calculatedAt 是合理的時間戳記', () => {
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    expect(demoData.calmIndex.result.calculatedAt).toBeGreaterThan(oneYearAgo);
  });
});

describe('videos 資料驗證', () => {
  it('至少有 3 部影片', () => {
    expect(demoData.videos.length).toBeGreaterThanOrEqual(3);
  });

  it('每部影片都有必要欄位', () => {
    demoData.videos.forEach((video, i) => {
      expect(typeof video.videoId, `videos[${i}].videoId`).toBe('string');
      expect(video.videoId.length, `videos[${i}].videoId 不能空白`).toBeGreaterThan(0);
      expect(typeof video.title, `videos[${i}].title`).toBe('string');
      expect(video.title.length, `videos[${i}].title 不能空白`).toBeGreaterThan(0);
      expect(typeof video.channelName, `videos[${i}].channelName`).toBe('string');
      expect(typeof video.url, `videos[${i}].url`).toBe('string');
      expect(video.url, `videos[${i}].url 需含 youtube`).toContain('youtube');
    });
  });
});

describe('chatHistory 資料驗證', () => {
  it('至少有 2 條訊息', () => {
    expect(demoData.chatHistory.length).toBeGreaterThanOrEqual(2);
  });

  it('每條訊息都有必要欄位', () => {
    demoData.chatHistory.forEach((msg, i) => {
      expect(typeof msg.id, `chatHistory[${i}].id`).toBe('string');
      expect(['user', 'assistant'], `chatHistory[${i}].role`).toContain(msg.role);
      expect(typeof msg.content, `chatHistory[${i}].content`).toBe('string');
      expect(msg.content.length, `chatHistory[${i}].content 不能空白`).toBeGreaterThan(0);
      expect(typeof msg.timestamp, `chatHistory[${i}].timestamp`).toBe('number');
    });
  });

  it('對話包含 user 和 assistant 訊息', () => {
    const roles = demoData.chatHistory.map((m) => m.role);
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');
  });
});
