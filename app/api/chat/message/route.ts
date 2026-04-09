// POST /api/chat/message — 存單筆訊息進 DB
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveMessage } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, content } = body as { role: 'user' | 'assistant'; content: string };

    if (!role || !content) {
      return NextResponse.json({ ok: false, error: 'missing role or content' }, { status: 400 });
    }

    await saveMessage(userId, role, content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // 存 DB 是非關鍵路徑，失敗只記錄，不 throw
    console.warn('[api/chat/message] 存訊息失敗:', err);
    return NextResponse.json({ ok: false });
  }
}
