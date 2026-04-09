/**
 * API Route — GET /api/chat/history
 *
 * 取得當前用戶的歷史對話訊息。
 * 回傳 ChatMessage[] JSON。
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upsertUser, getMessages } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    // 優先用 Google ID（session.user.id）撈訊息，與 webhook 存入的 user_id 一致
    // 若無 Google ID 則 fallback 到 users 表的 UUID
    const googleId = (session.user as { id?: string }).id;
    const userId = googleId
      ? googleId
      : await upsertUser(session.user.email, session.user.name ?? undefined);
    const messages = await getMessages(userId, 50);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('[GET /api/chat/history] 取得歷史訊息失敗：', error);
    return NextResponse.json([], { status: 200 });
  }
}
