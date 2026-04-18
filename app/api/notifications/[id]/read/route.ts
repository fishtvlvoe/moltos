/**
 * POST /api/notifications/[id]/read — 將通知標為已讀
 *
 * - 驗證擁有者（他人通知 → 404）
 * - 冪等：已讀狀態再呼叫一次仍回 200
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id: notificationId } = await context.params;

  // 查 user_id
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle();
  if (userErr || !userRow) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }
  const userId = (userRow.id as string) ?? '';

  // 驗證通知歸屬
  const { data: notif } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id')
    .eq('id', notificationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!notif) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // 冪等 update：即使 read_at 已存在，再寫一次 NOW() 無害
  const { error: updateError } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (updateError) {
    return NextResponse.json(
      { error: `update_failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
