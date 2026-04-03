/**
 * 斷網備案 Demo Data — Phase 8
 *
 * 情境設定：
 *   用戶：小明，一名上班族
 *   時段：20 天的通訊行為資料
 *   狀況：近期工作稍忙，但整體平靜（score 78，calm 等級）
 *
 * 基準日期：2026-04-03 00:00:00 +08:00
 * 採用固定基準時間以確保測試結果穩定（不受 Date.now() 影響）
 */

import type { DemoData } from './types';

// ─── 固定基準時間（2026-04-03 00:00:00 +08:00）────────────────────────────────
const BASE_TIME = new Date('2026-04-03T00:00:00+08:00').getTime();

// 一天的毫秒數
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 計算從基準日往前 N 天的時間戳記
 * days=0 表示當天，days=19 表示 20 天前（最早）
 */
function daysAgo(days: number): number {
  return BASE_TIME - days * DAY_MS;
}

// ─── Gmail 每日信件量（20 天，工作日多、週末少）────────────────────────────────
// 2026-04-03（基準日）是星期五，往前推算：
// days 0 = 04-03 (Fri), 1 = 04-02 (Thu), 2 = 04-01 (Wed),
// 3 = 03-31 (Tue), 4 = 03-30 (Mon), 5 = 03-29 (Sun), 6 = 03-28 (Sat), ...
const DAILY_COUNTS_RAW = [
  35, 38, 42, 30, 28, 8, 12,   // days 0-6：週五到週六（04-03 到 03-28）
  36, 40, 45, 33, 27, 7, 10,   // days 7-13：
  32, 37, 41, 29, 9, 11,       // days 14-19：
];

const dailyCounts = DAILY_COUNTS_RAW.map((value, i) => ({
  timestamp: daysAgo(i),
  value,
}));

// ─── 回覆延遲（毫秒，平均 2-4 小時）─────────────────────────────────────────
// 工作日約 2-3 小時，週末偶爾更長
const REPLY_LATENCY_HOURS = [
  2.5, 2.8, 3.2, 2.1, 2.9, 5.5, 6.2,  // days 0-6
  2.3, 2.7, 3.5, 2.4, 3.0, 5.8, 6.0,  // days 7-13
  2.6, 3.1, 2.9, 2.2, 5.2, 5.9,       // days 14-19
];

const replyLatencies = REPLY_LATENCY_HOURS.map((hours, i) => ({
  timestamp: daysAgo(i),
  value: Math.round(hours * 60 * 60 * 1000), // 轉換為毫秒
}));

// ─── 深夜活動（分鐘，大多 0-10 分鐘，偶爾較高）───────────────────────────────
const NIGHT_ACTIVITY_MINUTES = [
  5, 3, 8, 0, 12, 0, 2,    // days 0-6
  7, 4, 25, 6, 0, 3, 1,    // days 7-13（day 9 有個明顯高峰）
  5, 28, 4, 0, 1, 3,       // days 14-19（day 15 工作衝刺）
];

const nightActivity = NIGHT_ACTIVITY_MINUTES.map((value, i) => ({
  timestamp: daysAgo(i),
  value,
}));

// ─── 未讀信件數（10-30 封之間）───────────────────────────────────────────────
const UNREAD_COUNTS_RAW = [
  18, 22, 28, 15, 20, 12, 10,  // days 0-6
  19, 25, 30, 17, 21, 11, 13,  // days 7-13
  16, 24, 26, 14, 10, 11,      // days 14-19
];

const unreadCounts = UNREAD_COUNTS_RAW.map((value, i) => ({
  timestamp: daysAgo(i),
  value,
}));

// ─── 完整的 DemoData 物件 ─────────────────────────────────────────────────────
export const demoData: DemoData = {
  // 用戶資訊（小明）
  user: {
    name: '小明',
    email: 'xiaoming.demo@gmail.com',
    image: undefined,
  },

  // Gmail 指標（20 天）
  gmailMetrics: {
    dailyCounts,
    replyLatencies,
    nightActivity,
    unreadCounts,
    coverageDays: 20,
    lastUpdated: BASE_TIME,
  },

  // 平靜指數快照（score 78，calm 等級）
  calmIndex: {
    result: {
      score: 78,
      level: 'calm',
      // 四個維度（不含 voiceEmotion，MVP 不使用）
      dimensions: [
        {
          dimension: 'messageVolume',
          score: 82,      // 訊息量稍高，但在基線內
          zScore: 0.45,
          isAnomalous: false,
          weight: 0.3,
        },
        {
          dimension: 'replyLatency',
          score: 76,      // 回覆稍慢，但屬正常範圍
          zScore: 0.62,
          isAnomalous: false,
          weight: 0.3,
        },
        {
          dimension: 'nightActivity',
          score: 74,      // 深夜偶有活躍，輕微注意
          zScore: 0.78,
          isAnomalous: false,
          weight: 0.2,
        },
        {
          dimension: 'unreadPileup',
          score: 80,      // 未讀堆積在可接受範圍
          zScore: 0.35,
          isAnomalous: false,
          weight: 0.2,
        },
      ],
      calculatedAt: BASE_TIME,
      alerts: [], // 無警報，整體平靜
    },
    coverageDays: 20,
    isStale: false,
    createdAt: BASE_TIME,
  },

  // 5 部台灣 YouTuber 影片（知名頻道）
  videos: [
    {
      videoId: 'zhiqi_demo_001',
      title: '為什麼台灣人這麼喜歡吃便當？台灣便當文化大解析',
      channelName: '志祺七七 X 圖文不符',
      thumbnailUrl: 'https://i.ytimg.com/vi/zhiqi_demo_001/hqdefault.jpg',
      publishedAt: '2026-04-02T10:00:00Z',
      summary:
        '探討台灣便當文化的起源與演變，從日治時代的鐵路便當到現代各式便當店，分析台灣人為何對便當有特殊情感。',
      url: 'https://www.youtube.com/watch?v=zhiqi_demo_001',
    },
    {
      videoId: 'adu_demo_002',
      title: '10 個讓你英文聽力暴增的秘訣（真的有用那種）',
      channelName: '阿滴英文 Ray Du English',
      thumbnailUrl: 'https://i.ytimg.com/vi/adu_demo_002/hqdefault.jpg',
      publishedAt: '2026-04-01T14:30:00Z',
      summary:
        '阿滴分享親身測試過的十個英文聽力訓練方法，包含影子跟讀法、精聽精讀技巧，以及如何用 Netflix 練習日常口語。',
      url: 'https://www.youtube.com/watch?v=adu_demo_002',
    },
    {
      videoId: 'pengu_demo_003',
      title: '新手也能上手！5 步驟做出完美義大利麵',
      channelName: '彭鈺婷 Pengyu',
      thumbnailUrl: 'https://i.ytimg.com/vi/pengu_demo_003/hqdefault.jpg',
      publishedAt: '2026-03-31T09:00:00Z',
      summary:
        '從選麵、煮麵到醬汁製作，完整示範零失敗的義大利麵做法，附上常見新手錯誤與解決方法。',
      url: 'https://www.youtube.com/watch?v=pengu_demo_003',
    },
    {
      videoId: 'fengxiao_demo_004',
      title: '台灣最美的 10 條單車路線，你騎過幾條？',
      channelName: '風小艾單車遊',
      thumbnailUrl: 'https://i.ytimg.com/vi/fengxiao_demo_004/hqdefault.jpg',
      publishedAt: '2026-03-30T16:00:00Z',
      summary:
        '介紹台灣北中南東各地最具特色的單車路線，包含難度說明、最佳騎乘季節與沿途景點推薦。',
      url: 'https://www.youtube.com/watch?v=fengxiao_demo_004',
    },
    {
      videoId: 'setn_demo_005',
      title: '【財經短評】2026 年台股半導體版塊展望',
      channelName: 'SETN 三立財經台',
      thumbnailUrl: 'https://i.ytimg.com/vi/setn_demo_005/hqdefault.jpg',
      publishedAt: '2026-03-29T08:30:00Z',
      summary:
        '分析 2026 年台灣半導體產業的成長動能，聚焦 AI 伺服器需求帶動的供應鏈商機，以及主要廠商的法說會重點。',
      url: 'https://www.youtube.com/watch?v=setn_demo_005',
    },
  ],

  // 對話歷史（2 輪對話，共 4 條訊息）
  chatHistory: [
    {
      id: 'demo-msg-001',
      role: 'user',
      content: '你好！我是小明，最近工作有點忙，想了解一下我的溝通狀況。',
      timestamp: daysAgo(0) - 30 * 60 * 1000, // 30 分鐘前
    },
    {
      id: 'demo-msg-002',
      role: 'assistant',
      content:
        '你好，小明！根據過去 20 天的 Gmail 資料分析，你的平靜指數是 78 分，整體表現不錯，屬於「平靜」等級。\n\n每天平均處理 30+ 封郵件，回覆時間約 2-3 小時，這在工作忙碌期是相當合理的節奏。偶爾的深夜活躍也只是暫時性的，不用太擔心。有什麼具體想聊的嗎？',
      timestamp: daysAgo(0) - 28 * 60 * 1000, // 28 分鐘前
    },
    {
      id: 'demo-msg-003',
      role: 'user',
      content: '我感覺這週壓力特別大，是不是能從資料看出來？',
      timestamp: daysAgo(0) - 15 * 60 * 1000, // 15 分鐘前
    },
    {
      id: 'demo-msg-004',
      role: 'assistant',
      content:
        '有注意到這週的確有些訊號：週三深夜活躍時間達到 25 分鐘，比平常明顯偏高；加上這週信件量也衝到每天 40 封以上。\n\n不過整體來說還在可接受範圍，不到需要擔心的程度。建議今晚可以提早離開螢幕，讓自己的節奏緩一緩。你有特別在擔心哪個專案嗎？',
      timestamp: daysAgo(0) - 12 * 60 * 1000, // 12 分鐘前
    },
  ],
};
