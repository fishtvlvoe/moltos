/**
 * T036: YouTube API 封裝邏輯測試
 *
 * 測試 fetchLatestVideos 將 YouTube API 回應轉換為 VideoSummary[]。
 *
 * 涵蓋情境：
 * 1. 正常流程：subscriptions → channels → videos → VideoSummary[]（不含 summary）
 * 2. limit 參數控制回傳數量
 * 3. 空訂閱 → 回傳空陣列
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VideoSummary } from '@/lib/types';

// ── Mock googleapis ──
// 在模組載入前攔截 googleapis，避免真實 API 呼叫
vi.mock('googleapis', () => {
  // 訂閱頻道列表 mock
  const mockSubscriptionsList = vi.fn();
  // 頻道詳細資訊 mock（取得 uploads playlist ID）
  const mockChannelsList = vi.fn();
  // Playlist 項目 mock（取得最新影片 ID）
  const mockPlaylistItemsList = vi.fn();
  // 影片詳細資訊 mock
  const mockVideosList = vi.fn();

  return {
    google: {
      auth: {
        OAuth2: vi.fn().mockImplementation(() => ({
          setCredentials: vi.fn(),
        })),
      },
      youtube: vi.fn().mockReturnValue({
        subscriptions: {
          list: mockSubscriptionsList,
        },
        channels: {
          list: mockChannelsList,
        },
        playlistItems: {
          list: mockPlaylistItemsList,
        },
        videos: {
          list: mockVideosList,
        },
      }),
    },
    _mockSubscriptionsList: mockSubscriptionsList,
    _mockChannelsList: mockChannelsList,
    _mockPlaylistItemsList: mockPlaylistItemsList,
    _mockVideosList: mockVideosList,
  };
});

// ── 輔助函式：取得 googleapis mock ──
async function getYouTubeMocks() {
  const googleapis = await import('googleapis');
  const mod = googleapis as any;
  return {
    mockSubscriptionsList: mod._mockSubscriptionsList as ReturnType<typeof vi.fn>,
    mockChannelsList: mod._mockChannelsList as ReturnType<typeof vi.fn>,
    mockPlaylistItemsList: mod._mockPlaylistItemsList as ReturnType<typeof vi.fn>,
    mockVideosList: mod._mockVideosList as ReturnType<typeof vi.fn>,
  };
}

// ── 測試用假資料工廠 ──

/**
 * 建立模擬的訂閱頻道列表 API 回應
 * @param channelIds - 頻道 ID 陣列
 */
function makeMockSubscriptionsResponse(channelIds: string[]) {
  return {
    data: {
      items: channelIds.map((id, idx) => ({
        snippet: {
          resourceId: { channelId: id },
          title: `頻道 ${idx + 1}`,
        },
      })),
    },
  };
}

/**
 * 建立模擬的頻道詳細資訊 API 回應（包含 uploads playlist ID）
 * @param channelId - 頻道 ID
 * @param uploadsPlaylistId - 上傳播放清單 ID
 */
function makeMockChannelsResponse(channelId: string, uploadsPlaylistId: string) {
  return {
    data: {
      items: [
        {
          id: channelId,
          snippet: { title: `頻道名稱 ${channelId}` },
          contentDetails: {
            relatedPlaylists: {
              uploads: uploadsPlaylistId,
            },
          },
        },
      ],
    },
  };
}

/**
 * 建立模擬的 playlist 項目 API 回應（最新影片 ID）
 * @param videoId - 影片 ID
 * @param publishedAt - 發布時間（ISO 8601）
 */
function makeMockPlaylistItemsResponse(videoId: string, publishedAt: string) {
  return {
    data: {
      items: [
        {
          snippet: {
            resourceId: { videoId },
            publishedAt,
          },
        },
      ],
    },
  };
}

/**
 * 建立模擬的影片詳細資訊 API 回應
 * @param videoId - 影片 ID
 * @param title - 影片標題
 * @param channelName - 頻道名稱
 * @param description - 影片描述
 * @param publishedAt - 發布時間
 */
function makeMockVideosResponse(
  videoId: string,
  title: string,
  channelName: string,
  description: string,
  publishedAt: string,
) {
  return {
    data: {
      items: [
        {
          id: videoId,
          snippet: {
            title,
            channelTitle: channelName,
            description,
            publishedAt,
            thumbnails: {
              medium: {
                url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              },
            },
          },
        },
      ],
    },
  };
}

// ── 測試套件 ──

describe('fetchLatestVideos', () => {
  let fetchLatestVideos: (accessToken: string, limit?: number) => Promise<VideoSummary[]>;

  beforeEach(async () => {
    vi.resetModules();
    // 重置所有 mock 呼叫紀錄（包含預設值）
    vi.clearAllMocks();
    vi.resetAllMocks();

    // 動態 import 確保每次取得最新的模組狀態
    const module = await import('@/lib/youtube');
    fetchLatestVideos = module.fetchLatestVideos;
  });

  it('應正確將訂閱頻道的最新影片轉換為 VideoSummary[]（不含 summary）', async () => {
    const {
      mockSubscriptionsList,
      mockChannelsList,
      mockPlaylistItemsList,
      mockVideosList,
    } = await getYouTubeMocks();

    // 模擬一個訂閱頻道
    mockSubscriptionsList.mockResolvedValue(
      makeMockSubscriptionsResponse(['channel-abc']),
    );

    // 模擬頻道有一個 uploads playlist
    mockChannelsList.mockResolvedValue(
      makeMockChannelsResponse('channel-abc', 'UUabc'),
    );

    // 模擬 playlist 有一部最新影片
    mockPlaylistItemsList.mockResolvedValue(
      makeMockPlaylistItemsResponse('video-123', '2024-01-15T10:00:00Z'),
    );

    // 模擬影片詳細資訊
    mockVideosList.mockResolvedValue(
      makeMockVideosResponse(
        'video-123',
        '測試影片標題',
        '測試頻道',
        '這是一段關於健康的影片描述',
        '2024-01-15T10:00:00Z',
      ),
    );

    const result = await fetchLatestVideos('fake-access-token');

    // 應回傳陣列
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // 檢查第一個影片的基本欄位
    const video = result[0];
    expect(video.videoId).toBe('video-123');
    expect(video.title).toBe('測試影片標題');
    expect(video.channelName).toBe('測試頻道');
    expect(video.publishedAt).toBe('2024-01-15T10:00:00Z');
    expect(video.url).toBe('https://www.youtube.com/watch?v=video-123');

    // thumbnailUrl 應為 medium 尺寸
    expect(video.thumbnailUrl).toContain('mqdefault.jpg');
    expect(video.thumbnailUrl).toContain('video-123');

    // summary 欄位不應存在
    expect(video.summary).toBeUndefined();
  });

  it('limit 參數應控制回傳影片數量上限', async () => {
    const {
      mockSubscriptionsList,
      mockChannelsList,
      mockPlaylistItemsList,
      mockVideosList,
    } = await getYouTubeMocks();

    // 模擬 3 個訂閱頻道，每個都有一部影片
    const channelIds = ['ch1', 'ch2', 'ch3'];
    mockSubscriptionsList.mockResolvedValue(
      makeMockSubscriptionsResponse(channelIds),
    );

    // 每個頻道都回傳對應的 uploads playlist
    mockChannelsList
      .mockResolvedValueOnce(makeMockChannelsResponse('ch1', 'UU1'))
      .mockResolvedValueOnce(makeMockChannelsResponse('ch2', 'UU2'))
      .mockResolvedValueOnce(makeMockChannelsResponse('ch3', 'UU3'));

    // 每個 playlist 都有一部影片
    mockPlaylistItemsList
      .mockResolvedValueOnce(makeMockPlaylistItemsResponse('vid1', '2024-01-01T00:00:00Z'))
      .mockResolvedValueOnce(makeMockPlaylistItemsResponse('vid2', '2024-01-02T00:00:00Z'))
      .mockResolvedValueOnce(makeMockPlaylistItemsResponse('vid3', '2024-01-03T00:00:00Z'));

    // 每部影片的詳細資訊
    mockVideosList
      .mockResolvedValueOnce(
        makeMockVideosResponse('vid1', '影片一', '頻道一', '描述一', '2024-01-01T00:00:00Z'),
      )
      .mockResolvedValueOnce(
        makeMockVideosResponse('vid2', '影片二', '頻道二', '描述二', '2024-01-02T00:00:00Z'),
      )
      .mockResolvedValueOnce(
        makeMockVideosResponse('vid3', '影片三', '頻道三', '描述三', '2024-01-03T00:00:00Z'),
      );

    // 設定 limit = 2，應只回傳 2 部影片
    const result = await fetchLatestVideos('fake-access-token', 2);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('空訂閱 → 應回傳空陣列', async () => {
    const { mockSubscriptionsList } = await getYouTubeMocks();

    // 訂閱清單為空
    mockSubscriptionsList.mockResolvedValue({
      data: { items: [] },
    });

    const result = await fetchLatestVideos('fake-access-token');

    expect(result).toEqual([]);
  });

  it('空訂閱（items 為 undefined）→ 應回傳空陣列', async () => {
    const { mockSubscriptionsList } = await getYouTubeMocks();

    // YouTube API 可能回傳 undefined items
    mockSubscriptionsList.mockResolvedValue({
      data: {},
    });

    const result = await fetchLatestVideos('fake-access-token');

    expect(result).toEqual([]);
  });


  it('影片 url 格式應為 https://www.youtube.com/watch?v={videoId}', async () => {
    const {
      mockSubscriptionsList,
      mockChannelsList,
      mockPlaylistItemsList,
      mockVideosList,
    } = await getYouTubeMocks();

    const testVideoId = 'dQw4w9WgXcQ';

    mockSubscriptionsList.mockResolvedValue(
      makeMockSubscriptionsResponse(['ch-url-test']),
    );
    mockChannelsList.mockResolvedValue(
      makeMockChannelsResponse('ch-url-test', 'UUurltest'),
    );
    mockPlaylistItemsList.mockResolvedValue(
      makeMockPlaylistItemsResponse(testVideoId, '2024-04-01T00:00:00Z'),
    );
    mockVideosList.mockResolvedValue(
      makeMockVideosResponse(
        testVideoId,
        'Rick Astley',
        'Rick',
        'Never Gonna Give You Up',
        '2024-04-01T00:00:00Z',
      ),
    );

    const result = await fetchLatestVideos('fake-access-token');

    expect(result[0].url).toBe(`https://www.youtube.com/watch?v=${testVideoId}`);
  });
});
