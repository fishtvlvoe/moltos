/**
 * T037: YouTube API 封裝
 *
 * 取得使用者 YouTube 訂閱頻道的最新影片 + AI 摘要
 *
 * 流程：
 * 1. youtube.subscriptions.list → 取得訂閱的 channelId 列表（最多 10 個）
 * 2. 對每個 channel，取得其 uploads playlist → 最新 1 部影片
 * 3. youtube.videos.list → 取得影片詳細資訊（title, description, thumbnail）
 * 4. 對每部影片用 Gemini 生成 1-2 句中文摘要
 * 5. 組裝成 VideoSummary[] 回傳
 */

import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { summaryPrompt } from './gemini-prompts';
import type { VideoSummary } from './types';

// 使用的 Gemini 模型
const GEMINI_MODEL = 'gemini-2.5-flash';

// 每次訂閱頻道最多取幾個（避免超出 API 配額）
const MAX_SUBSCRIPTIONS = 10;

// 每個頻道最多取幾部最新影片
const VIDEOS_PER_CHANNEL = 1;

/**
 * 取得使用者 YouTube 訂閱頻道的最新影片 + AI 摘要
 *
 * @param accessToken - Google OAuth2 access token（需含 youtube.readonly scope）
 * @param limit - 最多回傳幾部影片，預設 5
 * @returns VideoSummary[] 含 AI 摘要的影片清單
 */
export async function fetchLatestVideos(
  accessToken: string,
  limit: number = 5,
): Promise<VideoSummary[]> {
  // ── 1. 建立 OAuth2 client 並注入 access token（與 gmail.ts 相同模式）──
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({ version: 'v3', auth });

  // ── 2. 取得訂閱頻道列表 ──
  const subscriptionsResponse = await youtube.subscriptions.list({
    part: ['snippet'],
    mine: true,
    maxResults: MAX_SUBSCRIPTIONS,
  });

  const subscriptionItems = subscriptionsResponse.data.items ?? [];

  // 空訂閱 → 直接回傳空陣列
  if (subscriptionItems.length === 0) {
    return [];
  }

  // 從訂閱項目取出 channelId 列表
  const channelIds: string[] = subscriptionItems
    .map((item) => item.snippet?.resourceId?.channelId)
    .filter((id): id is string => !!id);

  if (channelIds.length === 0) {
    return [];
  }

  // ── 3. 對每個頻道取得 uploads playlist ID，再取最新影片 ──
  const videoIds: { videoId: string; channelId: string }[] = [];

  for (const channelId of channelIds) {
    // 超過 limit 數量時提早中止（節省 API 呼叫）
    if (videoIds.length >= limit) break;

    // 取得頻道的 uploads playlist ID
    const channelsResponse = await youtube.channels.list({
      part: ['contentDetails', 'snippet'],
      id: [channelId],
    });

    const channelItem = channelsResponse.data.items?.[0];
    const uploadsPlaylistId = channelItem?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) continue;

    // 從 uploads playlist 取得最新影片 ID
    const playlistItemsResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: VIDEOS_PER_CHANNEL,
    });

    const playlistItems = playlistItemsResponse.data.items ?? [];

    for (const playlistItem of playlistItems) {
      const videoId = playlistItem.snippet?.resourceId?.videoId;
      if (videoId) {
        videoIds.push({ videoId, channelId });
      }
    }
  }

  // 依 limit 裁切
  const limitedVideoIds = videoIds.slice(0, limit);

  if (limitedVideoIds.length === 0) {
    return [];
  }

  // ── 4. 批次取得影片詳細資訊 ──
  const videoSummaries: VideoSummary[] = [];

  // 初始化 Gemini 客戶端（用於生成摘要）
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  for (const { videoId } of limitedVideoIds) {
    // 取得單部影片的詳細資訊
    const videosResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });

    const videoItem = videosResponse.data.items?.[0];
    if (!videoItem || !videoItem.snippet) continue;

    const snippet = videoItem.snippet;
    const title = snippet.title ?? '';
    const channelName = snippet.channelTitle ?? '';
    const description = snippet.description ?? '';
    const publishedAt = snippet.publishedAt ?? '';
    // 使用 medium 尺寸縮圖（寬度 320px）
    const thumbnailUrl = snippet.thumbnails?.medium?.url ?? '';
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // ── 5. 呼叫 Gemini 生成 AI 摘要（失敗時降級，summary 留 undefined）──
    let summary: string | undefined;
    try {
      const prompt = summaryPrompt(title, description);
      const geminiResult = await geminiModel.generateContent(prompt);
      summary = geminiResult.response.text();
    } catch {
      // Gemini 呼叫失敗時，降級策略：保留影片資訊但不含摘要
      summary = undefined;
    }

    videoSummaries.push({
      videoId,
      title,
      channelName,
      thumbnailUrl,
      publishedAt,
      summary,
      url,
    });
  }

  return videoSummaries;
}
