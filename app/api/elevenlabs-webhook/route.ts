/**
 * API Route — POST /api/elevenlabs-webhook
 *
 * ElevenLabs Post-conversation Webhook。
 * 通話結束後，ElevenLabs 將完整對話紀錄 POST 至此，逐條存入 Supabase。
 *
 * 流程：
 * 1. 解析 request body（agent_id、conversation_id、transcript、metadata）
 * 2. 驗證 transcript 是否有內容
 * 3. 從 call_sessions 查詢 user_id（優先）；找不到則 fallback
 * 4. 逐條將 transcript 存入 Supabase conversations 表
 * 5. 回傳存入筆數
 *
 * Fix 3: 改從 call_sessions 查詢 user_id，確保正確的用戶對應
 *
 * 注意：本 route 不做 auth 驗證，ElevenLabs webhook 安全由 agent 設定的 secret 負責。
 *
 * 參考：https://elevenlabs.io/docs/conversational-ai/customization/post-conversation-webhook
 */

import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — opencc-js 無 @types，功能正常
import { Converter } from 'opencc-js';
import { saveMessage, getCallSession, deleteCallSession } from '@/lib/db';
import type {
  ElevenLabsPostCallWebhookPayload,
  ElevenLabsPostCallTranscriptionData,
} from '@/types/elevenlabs';

// 簡體 → 繁體（台灣）轉換器，在 module 載入時初始化一次
const s2tw = Converter({ from: 'cn', to: 'twp' });

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

  // Fix 3: 優先從 call_sessions 表查詢 user_id（前端通話建立時寫入）
  // fallback 1: dynamic_variables.user_id（ElevenLabs 回傳，不保證存在）
  // fallback 2: voice:${conversation_id}（最後手段）
  let userId: string;
  try {
    const sessionResult = conversation_id ? await getCallSession(conversation_id) : null;
    if (sessionResult && sessionResult.user_id) {
      userId = sessionResult.user_id;
      // 查到後非同步刪除，失敗不阻斷主流程
      try {
        await deleteCallSession(conversation_id ?? '');
      } catch (delErr) {
        console.warn('[Webhook] deleteCallSession 失敗（非阻斷）:', delErr);
      }
    } else {
      const rawUserId = dynamicVars?.user_id;
      userId = (rawUserId && rawUserId.trim()) ? rawUserId : `voice:${conversation_id ?? 'unknown'}`;
    }
  } catch (err) {
    // getCallSession 失敗，fallback 到舊邏輯
    console.warn('[Webhook] getCallSession 失敗，使用 fallback:', err);
    const rawUserId = dynamicVars?.user_id;
    userId = (rawUserId && rawUserId.trim()) ? rawUserId : `voice:${conversation_id ?? 'unknown'}`;
  }

  console.log(
    `[Webhook] 收到通話紀錄: conversation_id=${conversation_id}, user_id=${userId}, messages=${transcript?.length ?? 0}`
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
    const raw = (entry.message ?? entry.content ?? '').trim();
    // STT 可能輸出簡體中文，統一轉為繁體台灣用字
    const content = s2tw(raw);

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

  // 修復 3: 異步清理過期 call_sessions（不阻斷主流程）
  // 延遲 100ms 後執行，避免影響 webhook 回應速度
  setTimeout(() => {
    (async () => {
      try {
        const now = new Date().toISOString();
        const { error: delErr } = await supabaseAdmin
          .from('call_sessions')
          .delete()
          .lt('expires_at', now);

        if (delErr) {
          console.warn('[Webhook] 清理過期 call_sessions 失敗（非阻斷）:', delErr);
        } else {
          console.log('[Webhook] 已非同步清理過期 call_sessions');
        }
      } catch (err) {
        console.warn('[Webhook] 清理過期 call_sessions 異常（非阻斷）:', err);
      }
    })();
  }, 100);

  return NextResponse.json({ status: 'ok', saved: savedCount });
}
