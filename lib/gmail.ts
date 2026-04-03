/**
 * T021: Gmail API 封裝
 *
 * 只讀取信件 metadata（不讀 body），從中萃取四個維度的指標：
 * - dailyCounts: 每天的信件總數
 * - replyLatencies: 有 In-Reply-To 的信件回覆延遲（估算值）
 * - nightActivity: 深夜時段（23:00-05:00）的活動分鐘數
 * - unreadCounts: 每天的未讀信件數
 */

import { google } from 'googleapis';
import type { GmailMetrics } from './types';
import type { DataPoint } from '@moltos/calm-index';

// 深夜時段定義（23:00 - 05:00）
const NIGHT_START_HOUR = 23;
const NIGHT_END_HOUR = 5;

// 預設抓取天數
const FETCH_DAYS = 14;

// 每次批次取得信件 metadata 的最大數量
const MAX_RESULTS = 500;

/**
 * 判斷某個小時是否屬於深夜時段
 * @param hour - 24 小時制小時數
 * @returns 是否為深夜
 */
function isNightHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

/**
 * 將時間戳正規化為當天凌晨 00:00 的時間戳（用於日期分組）
 * @param timestamp - Unix 毫秒時間戳
 * @returns 當天起始的時間戳
 */
function toDayStart(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 從 Gmail API 取得最近 FETCH_DAYS 天的信件元資料，
 * 並轉換為四維度的 DataPoint 陣列。
 *
 * @param accessToken - Google OAuth2 access token
 * @returns GmailMetrics 四維度指標
 */
export async function fetchGmailMetrics(accessToken: string): Promise<GmailMetrics> {
  // ── 1. 建立 OAuth2 client 並注入 access token ──
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  // ── 2. 計算 14 天前的日期，作為查詢起始點 ──
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FETCH_DAYS);
  // Gmail query 格式：after:YYYY/MM/DD
  const afterDate = `${cutoffDate.getFullYear()}/${String(cutoffDate.getMonth() + 1).padStart(2, '0')}/${String(cutoffDate.getDate()).padStart(2, '0')}`;

  // ── 3. 取得信件 ID 清單 ──
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${afterDate}`,
    maxResults: MAX_RESULTS,
  });

  const messageIds = listResponse.data.messages ?? [];

  // 空信件清單直接回傳空指標
  if (messageIds.length === 0) {
    return {
      dailyCounts: [],
      replyLatencies: [],
      nightActivity: [],
      unreadCounts: [],
      coverageDays: 0,
      lastUpdated: Date.now(),
    };
  }

  // ── 4. 批次取得每封信的 metadata header ──
  // 只需要 Date、From、To、In-Reply-To（不讀 body 以保護隱私）
  const messageDetails = await Promise.all(
    messageIds.map((msg) =>
      gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Date', 'From', 'To', 'In-Reply-To'],
      })
    )
  );

  // ── 5. 從 headers 萃取四維度資料 ──

  // 日期計數 Map：key = 當天起始時間戳，value = 計數
  const dailyCountMap = new Map<number, number>();
  // 未讀計數 Map：key = 當天起始時間戳，value = 未讀數
  const unreadCountMap = new Map<number, number>();
  // 深夜活動 Map：key = 當天起始時間戳，value = 深夜分鐘數（每封信估算 1 分鐘）
  const nightActivityMap = new Map<number, number>();
  // 回覆延遲列表（毫秒）：有 In-Reply-To 的信件用 internalDate 作為代理
  const replyLatencyPoints: DataPoint[] = [];

  for (const detail of messageDetails) {
    const msg = detail.data;
    if (!msg || !msg.internalDate) continue;

    const timestamp = Number(msg.internalDate);
    const dayKey = toDayStart(timestamp);
    const hour = new Date(timestamp).getHours();

    // dailyCounts：累計每天信件數
    dailyCountMap.set(dayKey, (dailyCountMap.get(dayKey) ?? 0) + 1);

    // unreadCounts：若有 UNREAD label 則計入
    const labelIds = msg.labelIds ?? [];
    if (labelIds.includes('UNREAD')) {
      unreadCountMap.set(dayKey, (unreadCountMap.get(dayKey) ?? 0) + 1);
    }

    // nightActivity：深夜時段每封信估算 1 分鐘活動時間
    if (isNightHour(hour)) {
      nightActivityMap.set(dayKey, (nightActivityMap.get(dayKey) ?? 0) + 1);
    }

    // replyLatencies：有 In-Reply-To 的信件代表是回覆
    // 由於 metadata 只取得時間，無法計算真實回覆時差
    // 用 internalDate 的小時數作為「白天 vs 深夜」回覆速度的代理：
    // 深夜回覆 = 可能焦慮回應（高延遲代理值），白天回覆 = 正常
    // 實際延遲無法從 metadata 取得，這裡用固定估算值（1 小時 = 3600000ms）
    const headers = msg.payload?.headers ?? [];
    const hasReplyTo = headers.some((h) => h.name === 'In-Reply-To' && h.value);
    if (hasReplyTo) {
      // 用 1 小時作為回覆延遲的預設估算值
      // 實際應用中可透過配對 threadId 計算真實延遲
      replyLatencyPoints.push({
        timestamp: dayKey,
        value: 3600000, // 估算：1 小時（毫秒）
      });
    }
  }

  // ── 6. 將 Map 轉換為有序的 DataPoint 陣列 ──

  const sortByTimestamp = (a: DataPoint, b: DataPoint) => a.timestamp - b.timestamp;

  const dailyCounts: DataPoint[] = Array.from(dailyCountMap.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort(sortByTimestamp);

  const unreadCounts: DataPoint[] = Array.from(unreadCountMap.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort(sortByTimestamp);

  const nightActivity: DataPoint[] = Array.from(nightActivityMap.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort(sortByTimestamp);

  const replyLatencies: DataPoint[] = replyLatencyPoints.sort(sortByTimestamp);

  // ── 7. 計算覆蓋天數 ──
  const coverageDays = dailyCounts.length;

  return {
    dailyCounts,
    replyLatencies,
    nightActivity,
    unreadCounts,
    coverageDays,
    lastUpdated: Date.now(),
  };
}
