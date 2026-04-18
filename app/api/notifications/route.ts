/**
 * GET /api/notifications — 使用者通知列表 / 未讀數
 *
 * Query params:
 *  - unread=true      只回未讀
 *  - count_only=true  只回 { count: number }
 *
 * 預設回傳最近 50 筆，倒序。
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getUserId(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return null;
  return (data.id as string) ?? null;
}

export async function GET(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(session.user.email);
  if (!userId) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const unread = url.searchParams.get('unread') === 'true';
  const countOnly = url.searchParams.get('count_only') === 'true';

  if (countOnly) {
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count, error } = unread
      ? await query.is('read_at', null)
      : await query;

    if (error) {
      return NextResponse.json(
        { error: `query_failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  }

  // 列表查詢
  const baseQuery = supabaseAdmin
    .from('notifications')
    .select('id, type, title, body, sent_via, read_at, created_at')
    .eq('user_id', userId);

  const { data, error } = unread
    ? await baseQuery.is('read_at', null).order('created_at', { ascending: false })
    : await baseQuery.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: `query_failed: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ notifications: data ?? [] }, { status: 200 });
}
