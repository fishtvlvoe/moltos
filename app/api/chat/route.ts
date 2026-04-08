/**
 * T031: API Route — POST /api/chat
 *
 * 流程：
 * 1. 驗證 session（未登入 → 401）
 * 2. 解析 request body（message + history）
 * 3. 嘗試取得平靜指數（失敗則繼續，calmSnapshot = null）
 * 4. 存使用者訊息到 Supabase（DB 非關鍵路徑，失敗不阻斷）
 * 5. 呼叫 Gemini chatStream，包一層 TransformStream 收集完整回應
 * 6. 串流結束後把 AI 回應存進 Supabase
 *
 * 回應格式：text/plain 串流（streaming response）
 * 前端透過 fetch + ReadableStream 讀取即時文字
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatStream } from '@/lib/gemini';
import { fetchGmailMetrics } from '@/lib/gmail';
import { computeCalmIndex } from '@/lib/calm-index-bridge';
import { upsertUser, saveMessage } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ChatMessage, CalmIndexSnapshot } from '@/lib/types';

export async function POST(req: Request) {
  // ── 1. 驗證 session ──────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  // 開發環境允許未登入使用（方便測試）
  if (!session && process.env.NODE_ENV === 'production') {
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

  // ── 3. upsertUser 取得 userId（DB 非關鍵路徑，失敗不阻斷）────────────────
  let userId: string | null = null;

  try {
    if (session?.user) {
      // 優先用 Google ID（與 webhook 存入的 user_id 一致），確保文字對話與語音對話共用同一 userId
      const googleId = (session.user as { id?: string }).id;
      if (googleId) {
        userId = googleId;
      } else {
        const { email, name, image } = session.user as { email: string; name?: string; image?: string };
        userId = await upsertUser(email, name ?? undefined, image ?? undefined);
      }
    }
  } catch (err) {
    console.warn('[POST /api/chat] upsertUser 失敗，對話繼續（不存 DB）：', err);
  }

  // ── 4. 嘗試取得平靜指數（非必要，失敗就 null）────────────────────────────
  let calmSnapshot: CalmIndexSnapshot | null = null;

  try {
    const accessToken = session ? (session as any).accessToken : null;
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

  // ── 5. 存使用者訊息（非關鍵路徑，失敗不阻斷）───────────────────────────────
  if (userId) {
    saveMessage(userId, 'user', message).catch((err) => {
      console.warn('[POST /api/chat] 存使用者訊息失敗：', err);
    });
  }

  // ── 6. 呼叫 Gemini 串流回應，收集完整文字後存 AI 訊息 ─────────────────────
  try {
    const geminiStream = await chatStream(message, history, calmSnapshot);

    // 包一層 TransformStream：透傳每個 chunk 給前端，同時收集完整回應文字
    const chunks: string[] = [];

    const { readable, writable } = new TransformStream<string, string>({
      transform(chunk, controller) {
        // 累積文字，同時原樣送給前端
        chunks.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // 串流結束：把完整 AI 回應存進 DB（非關鍵路徑，失敗只警告）
        const fullText = chunks.join('');
        if (userId && fullText) {
          saveMessage(userId, 'assistant', fullText).catch((err) => {
            console.warn('[POST /api/chat] 存 AI 訊息失敗：', err);
          });
        }
      },
    });

    // 把 Gemini ReadableStream pipe 進 TransformStream
    geminiStream.pipeTo(writable).catch((err) => {
      console.warn('[POST /api/chat] stream pipe 發生錯誤：', err);
    });

    // 以 text/plain 串流回傳（前端用 fetch + reader 讀取）
    return new Response(readable, {
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
