/**
 * 臨時管理 API — POST /api/admin/convert-to-tw
 * 將 conversations 表中所有簡體內容轉為繁體（台灣）
 * 使用後可刪除此檔案
 */

import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Converter } from 'opencc-js';
import { supabaseAdmin } from '@/lib/supabase';

const s2tw = Converter({ from: 'cn', to: 'twp' });

export async function POST() {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, content');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const converted = s2tw(row.content as string);
    if (converted === row.content) { skipped++; continue; }

    const { error: err } = await supabaseAdmin
      .from('conversations')
      .update({ content: converted })
      .eq('id', row.id);

    if (err) console.warn('[convert-to-tw] 更新失敗', row.id, err.message);
    else updated++;
  }

  return NextResponse.json({ total: data?.length, updated, skipped });
}
