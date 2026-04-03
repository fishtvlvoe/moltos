/**
 * API Route — GET /api/chat/insight/history
 *
 * 取得使用者的對話洞察歷史（最近 30 天）。
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) return NextResponse.json([]);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data } = await supabaseAdmin
      .from('conversation_insights')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
