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
import { demoData } from '@/lib/demo-data';

export async function GET(req: Request) {
  // ── Demo 模式：?demo=true 直接回傳靜態資料（不需要登入）────────────────
  const { searchParams } = new URL(req.url);
  if (searchParams.get('demo') === 'true') {
    return NextResponse.json(demoData.gmailMetrics);
  }

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
    // Gmail API 呼叫失敗（例如 token 過期、網路錯誤）→ 降級回傳 demo data
    console.error('[GET /api/gmail/metrics] 取得 Gmail 資料失敗，降級為 demo data：', error);
    return NextResponse.json(
      { ...demoData.gmailMetrics, isStale: true },
      { headers: { 'X-Demo-Data': 'true' } }
    );
  }
}
