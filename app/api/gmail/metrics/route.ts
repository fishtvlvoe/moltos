/**
 * T023: API Route — GET /api/gmail/metrics
 *
 * 從 session 取得 accessToken，呼叫 fetchGmailMetrics，
 * 回傳四維度 GmailMetrics JSON。
 *
 * 權限：需登入（session 含 accessToken）
 * 失敗情境：
 *   - 未登入或無 accessToken → 401
 *   - Gmail API 呼叫失敗 → 500
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGmailMetrics } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function GET() {
  // 取得目前 session（含 accessToken）
  const session = await getServerSession(authOptions);

  // 未登入或 session 不含 accessToken → 401 未授權
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    // 用 accessToken 呼叫 Gmail API 取得四維度指標
    const metrics = await fetchGmailMetrics((session as any).accessToken);
    return NextResponse.json(metrics);
  } catch (error) {
    // Gmail API 呼叫失敗（例如 token 過期、網路錯誤）→ 500
    console.error('[GET /api/gmail/metrics] 取得 Gmail 資料失敗：', error);
    return NextResponse.json({ error: '無法取得 Gmail 資料' }, { status: 500 });
  }
}
