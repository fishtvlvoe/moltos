/**
 * API Route — POST /api/call-sessions
 *
 * 語音通話開始後，前端將 ElevenLabs conversation_id 存入此 endpoint，
 * 建立 conversation_id → user_id 的對應記錄，供 webhook 查詢正確的 user_id。
 *
 * 流程：
 * 1. 驗證 session（需登入）
 * 2. 從 body 取得 conversationId
 * 3. 用 Google ID 作為 userId 寫入 call_sessions 表
 * 4. 回傳 { ok: true }
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveCallSession } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. 驗證 session ───────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  // ── 2. 解析 body ──────────────────────────────────────────────────────────
  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '無效的 request body' }, { status: 400 });
  }

  const { conversationId } = body;
  if (!conversationId || conversationId.trim() === '') {
    return NextResponse.json({ error: 'conversationId 為必填' }, { status: 400 });
  }

  // ── 3. 取得 Google ID 並寫入 call_sessions ────────────────────────────────
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: '無法取得 Google ID' }, { status: 400 });
  }

  // 修復 2: 防止他人 claim 同一個 conversation_id
  // 先查是否已被 claim，若被不同 user claim 則回 409 Conflict
  try {
    const { data: existing, error: queryError } = await supabaseAdmin
      .from('call_sessions')
      .select('user_id')
      .eq('conversation_id', conversationId.trim())
      .maybeSingle();

    if (queryError) {
      console.error('[POST /api/call-sessions] 查詢失敗：', queryError);
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }

    if (existing && existing.user_id !== userId) {
      console.warn(`[POST /api/call-sessions] 重複 claim 嘗試: ${conversationId} 已被 ${existing.user_id} claim`);
      return NextResponse.json(
        { error: 'Conversation already claimed by another user' },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error('[POST /api/call-sessions] 重複防護檢查失敗：', error);
    return NextResponse.json({ error: '防護檢查失敗' }, { status: 500 });
  }

  try {
    await saveCallSession(conversationId.trim(), userId);
  } catch (error) {
    console.error('[POST /api/call-sessions] 寫入失敗：', error);
    return NextResponse.json({ error: '寫入失敗' }, { status: 500 });
  }

  // ── 4. 回傳成功 ───────────────────────────────────────────────────────────
  return NextResponse.json({ ok: true });
}
