/**
 * T031: API Route — POST /api/chat
 *
 * 流程：
 * 1. 驗證 session（未登入 → 401）
 * 2. 解析 request body（message + history）
 * 3. 嘗試取得平靜指數（失敗則繼續，calmSnapshot = null）
 * 4. 呼叫 Gemini chatStream，以串流方式回傳 AI 回應
 *
 * 回應格式：text/plain 串流（streaming response）
 * 前端透過 fetch + ReadableStream 讀取即時文字
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatStream } from '@/lib/gemini';
import { fetchGmailMetrics } from '@/lib/gmail';
import { computeCalmIndex } from '@/lib/calm-index-bridge';
import { NextResponse } from 'next/server';
import type { ChatMessage, CalmIndexSnapshot } from '@/lib/types';

export async function POST(req: Request) {
  // ── 1. 驗證 session ──────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  // ── 2. 解析 request body ──────────────────────────────────────────────────
  let message: string;
  let history: ChatMessage[];

  try {
    const body = await req.json();
    message = body.message;
    history = body.history ?? [];

    // 基本驗證：message 必須為非空字串
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'message 為必填欄位' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 });
  }

  // ── 3. 嘗試取得平靜指數（非必要，失敗就 null）────────────────────────────
  let calmSnapshot: CalmIndexSnapshot | null = null;

  try {
    const accessToken = (session as any).accessToken;
    if (accessToken) {
      const metrics = await fetchGmailMetrics(accessToken);
      const snapshot = computeCalmIndex(metrics);
      // result 為 null 表示資料不足，跳過（不影響對話）
      if (snapshot.result) {
        calmSnapshot = snapshot;
      }
    }
  } catch {
    // 平靜指數取得失敗不阻斷對話流程，僅記錄警告
    console.warn('[POST /api/chat] 取得平靜指數失敗，以無脈絡模式繼續對話');
  }

  // ── 4. 呼叫 Gemini 串流回應 ────────────────────────────────────────────────
  try {
    const stream = await chatStream(message, history, calmSnapshot);

    // 以 text/plain 串流回傳（前端用 fetch + reader 讀取）
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // 禁止快取，確保每次都是新的串流
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[POST /api/chat] Gemini 串流呼叫失敗：', error);
    return NextResponse.json({ error: 'AI 服務暫時無法使用' }, { status: 500 });
  }
}
