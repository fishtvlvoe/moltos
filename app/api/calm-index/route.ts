/**
 * T024: API Route — GET /api/calm-index
 *
 * 流程：session → fetchGmailMetrics → computeCalmIndex → CalmIndexSnapshot JSON
 *
 * 權限：需登入（session 含 accessToken）
 * 失敗情境：
 *   - 未登入或無 accessToken → 401
 *   - 資料不足無法計算（result 為 null）→ 422
 *   - 其他錯誤 → 500
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGmailMetrics } from '@/lib/gmail';
import { computeCalmIndex } from '@/lib/calm-index-bridge';
import { NextResponse } from 'next/server';

export async function GET() {
  // 取得目前 session（含 accessToken）
  const session = await getServerSession(authOptions);

  // 未登入或 session 不含 accessToken → 401 未授權
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    // 1. 從 Gmail API 取得四維度指標
    const metrics = await fetchGmailMetrics((session as any).accessToken);

    // 2. 計算平靜指數快照
    const snapshot = computeCalmIndex(metrics);

    // 3. 資料不足時 result 為 null → 422 Unprocessable Entity
    if (!snapshot.result) {
      return NextResponse.json(
        { error: '資料不足，無法計算平靜指數' },
        { status: 422 }
      );
    }

    // 4. 成功回傳快照
    return NextResponse.json(snapshot);
  } catch (error) {
    // 未預期的錯誤（Gmail API 失敗、演算法例外）→ 500
    console.error('[GET /api/calm-index] 無法計算平靜指數：', error);
    return NextResponse.json({ error: '無法計算平靜指數' }, { status: 500 });
  }
}
