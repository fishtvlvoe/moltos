/**
 * T038: API Route — GET /api/youtube/feed
 *
 * 從 session 取得 accessToken，呼叫 fetchLatestVideos，
 * 回傳 VideoSummary[] JSON（含 AI 摘要）。
 *
 * 權限：需登入（session 含 accessToken，且需含 youtube.readonly scope）
 * 失敗情境：
 *   - 未登入或無 accessToken → 401
 *   - YouTube API 呼叫失敗 → 500
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchLatestVideos } from '@/lib/youtube';
import { NextResponse } from 'next/server';

export async function GET() {
  // 取得目前 session（含 accessToken）
  const session = await getServerSession(authOptions);

  // 未登入或 session 不含 accessToken → 401 未授權
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    // 用 accessToken 呼叫 YouTube API 取得訂閱頻道最新影片 + AI 摘要
    const videos = await fetchLatestVideos((session as any).accessToken);
    return NextResponse.json(videos);
  } catch (error) {
    // YouTube API 呼叫失敗（例如 token 過期、未授權 scope、網路錯誤）→ 500
    console.error('[GET /api/youtube/feed] 取得 YouTube 資料失敗：', error);
    return NextResponse.json({ error: '無法取得 YouTube 資料' }, { status: 500 });
  }
}
