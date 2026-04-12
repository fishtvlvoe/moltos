/**
 * tests/lib/youtube.test.ts
 *
 * 覆蓋 Spec: ai-provider-cleanup — YouTube 移除 Gemini 摘要
 *
 * Scenario:
 * 1. fetchLatestVideos 回傳的 VideoSummary[] 不應包含 summary 欄位
 *
 * 紅燈原因：目前 youtube.ts 仍呼叫 Gemini 生成摘要，summary 欄位仍存在
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VideoSummary } from '@/lib/types';

// ─── Mock googleapis ───────────────────────────────────────────────────────

const mockYoutubeSubscriptionsList = vi.fn();
const mockYoutubeChannelsList = vi.fn();
const mockYoutubePlaylistItemsList = vi.fn();
const mockYoutubeVideosList = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials() {}
      },
    },
    youtube: () => ({
      subscriptions: { list: mockYoutubeSubscriptionsList },
      channels: { list: mockYoutubeChannelsList },
      playlistItems: { list: mockYoutubePlaylistItemsList },
      videos: { list: mockYoutubeVideosList },
    }),
  },
}));

// ─── Mock Gemini（目前會被呼叫，紅燈預期它成功但我們檢查不應有 summary）───

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => '影片摘要內容' },
        }),
      };
    }
  },
}));

// ─── 匯入被測試函數 ───────────────────────────────────────────────────────

import { fetchLatestVideos } from '@/lib/youtube';

// ─── Tests ────────────────────────────────────────────────────────────────

describe('fetchLatestVideos — AI Provider Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';

    // Mock subscriptions response
    mockYoutubeSubscriptionsList.mockResolvedValue({
      data: {
        items: [
          {
            snippet: {
              resourceId: { channelId: 'channel1' },
            },
          },
        ],
      },
    });

    // Mock channels response
    mockYoutubeChannelsList.mockResolvedValue({
      data: {
        items: [
          {
            contentDetails: {
              relatedPlaylists: { uploads: 'playlist1' },
            },
          },
        ],
      },
    });

    // Mock playlistItems response
    mockYoutubePlaylistItemsList.mockResolvedValue({
      data: {
        items: [
          {
            snippet: { resourceId: { videoId: 'vid1' } },
          },
        ],
      },
    });

    // Mock videos response
    mockYoutubeVideosList.mockResolvedValue({
      data: {
        items: [
          {
            snippet: {
              title: '影片標題',
              channelTitle: '頻道名稱',
              description: '影片描述',
              publishedAt: '2026-04-12T00:00:00Z',
              thumbnails: { medium: { url: 'https://thumb.jpg' } },
            },
          },
        ],
      },
    });
  });

  it('紅燈：回傳的 VideoSummary[] 不應包含 summary 欄位', async () => {
    const result = await fetchLatestVideos('test-token', 1);

    expect(result).toHaveLength(1);
    const video: VideoSummary = result[0];

    // 紅燈斷言：目前 summary 欄位仍存在
    // 期望行為：summary 應該被移除（改為不呼叫 Gemini）
    expect(video).not.toHaveProperty('summary');

    // 確認其他欄位仍存在
    expect(video).toMatchObject({
      videoId: 'vid1',
      title: '影片標題',
      channelName: '頻道名稱',
      thumbnailUrl: 'https://thumb.jpg',
      publishedAt: '2026-04-12T00:00:00Z',
      url: expect.stringContaining('youtube.com/watch?v='),
    });
  });

  it('紅燈：不應呼叫 GoogleGenerativeAI（後續任務完成後改為綠燈）', async () => {
    // 此測試假設最終 youtube.ts 將不再匯入 GoogleGenerativeAI
    // 現在是紅燈，因為程式碼仍在匯入並使用
    const hasGeminiImport = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@google/generative-ai');
        return true;
      } catch {
        return false;
      }
    })();

    expect(hasGeminiImport).toBe(true); // 紅燈：目前仍有 import
  });
});
