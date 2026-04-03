/**
 * T018: Gmail 元資料轉換邏輯測試
 *
 * 測試 fetchGmailMetrics 將 Gmail API 回應轉換為四維度 DataPoint[]。
 * 注意：gmail.ts 尚不存在，此測試會先跑 FAIL（TDD 紅燈）。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GmailMetrics } from '@/lib/types';

// ── Mock googleapis ──
// 在模組載入前攔截 googleapis，避免真實 API 呼叫
vi.mock('googleapis', () => {
  const mockMessagesList = vi.fn();
  const mockMessagesGet = vi.fn();

  return {
    google: {
      auth: {
        OAuth2: vi.fn().mockImplementation(() => ({
          setCredentials: vi.fn(),
        })),
      },
      gmail: vi.fn().mockReturnValue({
        users: {
          messages: {
            list: mockMessagesList,
            get: mockMessagesGet,
          },
        },
      }),
    },
    _mockMessagesList: mockMessagesList,
    _mockMessagesGet: mockMessagesGet,
  };
});

// 取得 mock 函式的輔助函式
async function getMocks() {
  const googleapis = await import('googleapis');
  const mod = googleapis as any;
  return {
    mockMessagesList: mod._mockMessagesList as ReturnType<typeof vi.fn>,
    mockMessagesGet: mod._mockMessagesGet as ReturnType<typeof vi.fn>,
  };
}

/**
 * 建立指定天前的 Unix 毫秒時間戳
 * @param daysAgo - 幾天前
 * @param hour - 幾點（24 小時制）
 */
function daysAgoTimestamp(daysAgo: number, hour = 10): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/**
 * 將 Unix 毫秒轉換為 RFC 2822 日期字串（Gmail 使用格式）
 */
function toRfc2822(timestamp: number): string {
  return new Date(timestamp).toUTCString();
}

describe('fetchGmailMetrics', () => {
  let fetchGmailMetrics: (accessToken: string) => Promise<GmailMetrics>;

  beforeEach(async () => {
    vi.resetModules();
    // 動態 import 確保每次取得最新的模組狀態
    const module = await import('@/lib/gmail');
    fetchGmailMetrics = module.fetchGmailMetrics;
  });

  it('應正確將 Gmail messages 轉換為四維度 DataPoint[]', async () => {
    const { mockMessagesList, mockMessagesGet } = await getMocks();

    // 模擬 messages.list 回傳 3 封信件 ID
    const msgIds = ['msg1', 'msg2', 'msg3'];
    mockMessagesList.mockResolvedValue({
      data: {
        messages: msgIds.map((id) => ({ id })),
        nextPageToken: undefined,
      },
    });

    // 模擬 3 封信的 metadata：
    // msg1 = 2 天前白天發的一般信
    // msg2 = 1 天前白天發的回覆（有 In-Reply-To）
    // msg3 = 1 天前深夜 (00:30) 發的未讀信
    const day2 = daysAgoTimestamp(2, 10);
    const day1Morning = daysAgoTimestamp(1, 9);
    const day1Night = daysAgoTimestamp(1, 0); // 凌晨 00:30

    mockMessagesGet
      .mockResolvedValueOnce({
        data: {
          id: 'msg1',
          internalDate: String(day2),
          labelIds: [],
          payload: {
            headers: [
              { name: 'Date', value: toRfc2822(day2) },
              { name: 'From', value: 'sender@example.com' },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'msg2',
          internalDate: String(day1Morning),
          labelIds: [],
          payload: {
            headers: [
              { name: 'Date', value: toRfc2822(day1Morning) },
              { name: 'From', value: 'user@example.com' },
              { name: 'In-Reply-To', value: '<original@example.com>' },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'msg3',
          internalDate: String(day1Night),
          labelIds: ['UNREAD'],
          payload: {
            headers: [
              { name: 'Date', value: toRfc2822(day1Night) },
              { name: 'From', value: 'sender2@example.com' },
            ],
          },
        },
      });

    const result = await fetchGmailMetrics('fake-access-token');

    // 四個維度陣列都應存在
    expect(result.dailyCounts).toBeDefined();
    expect(result.replyLatencies).toBeDefined();
    expect(result.nightActivity).toBeDefined();
    expect(result.unreadCounts).toBeDefined();

    // dailyCounts：應有 2 天的資料（2 天前 1 封、1 天前 2 封）
    expect(result.dailyCounts.length).toBeGreaterThanOrEqual(2);

    // 2 天前的計數應為 1
    const day2Entry = result.dailyCounts.find((dp) => {
      const d = new Date(dp.timestamp);
      const target = new Date(day2);
      return (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        d.getDate() === target.getDate()
      );
    });
    expect(day2Entry?.value).toBe(1);

    // 1 天前的計數應為 2
    const day1Entry = result.dailyCounts.find((dp) => {
      const d = new Date(dp.timestamp);
      const target = new Date(day1Morning);
      return (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        d.getDate() === target.getDate()
      );
    });
    expect(day1Entry?.value).toBe(2);

    // 有 In-Reply-To 的信件應產生回覆延遲資料點
    expect(result.replyLatencies.length).toBeGreaterThan(0);

    // 深夜信件（凌晨 00:30 屬 00:00-05:00 範圍）應有夜間活動
    const nightEntry = result.nightActivity.find((dp) => {
      const d = new Date(dp.timestamp);
      const target = new Date(day1Night);
      return (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        d.getDate() === target.getDate()
      );
    });
    expect(nightEntry?.value).toBeGreaterThan(0);

    // 未讀信件（UNREAD label）應計入 unreadCounts
    const unreadEntry = result.unreadCounts.find((dp) => {
      const d = new Date(dp.timestamp);
      const target = new Date(day1Night);
      return (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        d.getDate() === target.getDate()
      );
    });
    expect(unreadEntry?.value).toBeGreaterThanOrEqual(1);

    // coverageDays 應大於 0
    expect(result.coverageDays).toBeGreaterThan(0);

    // lastUpdated 應為合理時間戳
    expect(result.lastUpdated).toBeGreaterThan(0);
  });

  it('空信件清單 → coverageDays 應為 0', async () => {
    const { mockMessagesList } = await getMocks();

    mockMessagesList.mockResolvedValue({
      data: {
        messages: [],
        nextPageToken: undefined,
      },
    });

    const result = await fetchGmailMetrics('fake-access-token');

    expect(result.coverageDays).toBe(0);
    expect(result.dailyCounts).toHaveLength(0);
    expect(result.replyLatencies).toHaveLength(0);
    expect(result.nightActivity).toHaveLength(0);
    expect(result.unreadCounts).toHaveLength(0);
  });

  it('同一天的信件應計入同一個 DataPoint（日期分組正確）', async () => {
    const { mockMessagesList, mockMessagesGet } = await getMocks();

    // 5 封同一天的信
    const sameDay = daysAgoTimestamp(3, 10);
    mockMessagesList.mockResolvedValue({
      data: {
        messages: [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
          { id: 'd' },
          { id: 'e' },
        ],
      },
    });

    // 模擬 5 封信的不同時間（同天不同小時）
    const offsets = [0, 1, 2, 3, 4]; // 時間差異（小時）
    for (const offset of offsets) {
      mockMessagesGet.mockResolvedValueOnce({
        data: {
          id: `msg-${offset}`,
          internalDate: String(sameDay + offset * 3600 * 1000),
          labelIds: [],
          payload: {
            headers: [
              {
                name: 'Date',
                value: toRfc2822(sameDay + offset * 3600 * 1000),
              },
            ],
          },
        },
      });
    }

    const result = await fetchGmailMetrics('fake-access-token');

    // 同一天應只有一個 DataPoint，value 應為 5
    const sameDayDate = new Date(sameDay);
    const dayEntry = result.dailyCounts.find((dp) => {
      const d = new Date(dp.timestamp);
      return (
        d.getFullYear() === sameDayDate.getFullYear() &&
        d.getMonth() === sameDayDate.getMonth() &&
        d.getDate() === sameDayDate.getDate()
      );
    });

    expect(dayEntry).toBeDefined();
    expect(dayEntry?.value).toBe(5);
  });
});
