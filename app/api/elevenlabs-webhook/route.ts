/**
 * API Route — POST /api/elevenlabs-webhook
 *
 * ElevenLabs Post-conversation Webhook。
 * 通話結束後，ElevenLabs 將完整對話紀錄 POST 至此，逐條存入 Supabase。
 *
 * 流程：
 * 1. 解析 request body（agent_id、conversation_id、transcript、metadata）
 * 2. 驗證 transcript 是否有內容
 * 3. 逐條將 transcript 存入 Supabase conversations 表
 * 4. 回傳存入筆數
 *
 * userId 規則：'voice:' + conversation_id（跟舊 Custom LLM 路線一致）
 *
 * 注意：本 route 不做 auth 驗證，ElevenLabs webhook 安全由 agent 設定的 secret 負責。
 *
 * 參考：https://elevenlabs.io/docs/conversational-ai/customization/post-conversation-webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveMessage } from '@/lib/db';
import type {
  ElevenLabsPostCallWebhookPayload,
  ElevenLabsPostCallTranscriptionData,
} from '@/types/elevenlabs';

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. 解析 request body ──────────────────────────────────────────────────
  let body: ElevenLabsPostCallWebhookPayload;

  try {
    body = await req.json();
  } catch {
    // JSON 解析失敗
    return NextResponse.json(
      { error: '無效的 request body：JSON 解析失敗' },
      { status: 400 }
    );
  }

  // Debug：印完整 payload 結構幫助診斷格式問題
  console.log('[Webhook] 完整 payload keys:', Object.keys(body as unknown as object));
  console.log('[Webhook] payload type field:', (body as any).type);
  console.log('[Webhook] payload.data keys:', Object.keys((body as any).data ?? {}));

  // 兼容新格式 { type, data: {...} } 和舊格式（直接平鋪）
  const raw = body as unknown as Record<string, unknown>;
  const data = (raw.data ?? raw) as ElevenLabsPostCallTranscriptionData;

  const conversation_id = data.conversation_id;
  const transcript = data.transcript;
  const dynamicVars = data.conversation_initiation_client_data?.dynamic_variables;
  const userId = dynamicVars?.user_id ?? `voice:${conversation_id ?? 'unknown'}`;

  console.log(
    `[Webhook] 收到通話紀錄: conversation_id=${conversation_id}, messages=${transcript?.length ?? 0}`
  );

  // ── 2. 驗證 transcript ────────────────────────────────────────────────────
  // 沒有 transcript 或為空陣列時，直接回傳 ok（正常情境：通話無內容）
  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return NextResponse.json({ status: 'ok', saved: 0 });
  }

  // ── 3. 逐條存入 Supabase ──────────────────────────────────────────────────
  let savedCount = 0;
  for (const entry of transcript) {
    // ElevenLabs agent 角色對應到 assistant
    const role: 'user' | 'assistant' = entry.role === 'agent' ? 'assistant' : 'user';
    const content = (entry.message ?? entry.content ?? '').trim();

    if (!content) continue; // 跳過空訊息

    try {
      await saveMessage(userId, role, content);
      savedCount++;
    } catch (err) {
      // 單筆失敗不中斷，記錄後繼續
      console.warn(`[Webhook] 存入第 ${savedCount + 1} 筆失敗：`, err);
    }
  }

  console.log(`[Webhook] 已存 ${savedCount} 條對話紀錄`);
  return NextResponse.json({ status: 'ok', saved: savedCount });
}
