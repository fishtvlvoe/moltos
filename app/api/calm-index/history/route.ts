/**
 * API Route — GET /api/calm-index/history
 *
 * 取得當前用戶的平靜指數歷史趨勢。
 * 回傳 Array<{score, level, createdAt}> JSON。
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upsertUser, getCalmIndexHistory } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    const userId = await upsertUser(session.user.email, session.user.name ?? undefined);
    const history = await getCalmIndexHistory(userId, days);
    return NextResponse.json(history);
  } catch (error) {
    console.error('[GET /api/calm-index/history] 取得歷史失敗：', error);
    return NextResponse.json([], { status: 200 });
  }
}
