/**
 * API Route — POST /api/tts
 *
 * 使用 OpenAI TTS 將文字轉為自然語音。
 * 聲線：nova（溫暖、自然）
 * 回傳 audio/mp3 二進位資料。
 */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key 未設定' }, { status: 500 });
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text 為必填' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: '無效的請求' }, { status: 400 });
  }

  // 移除 emoji
  const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  if (!cleanText) {
    return NextResponse.json({ error: '文字為空' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',    // 溫暖自然的女聲
        input: cleanText,
        speed: 1.05,       // 略快，自然對話節奏
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[POST /api/tts] OpenAI TTS 錯誤：', err);
      return NextResponse.json({ error: 'TTS 服務錯誤' }, { status: 502 });
    }

    // OpenAI 直接回傳音訊串流
    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[POST /api/tts] 呼叫失敗：', error);
    return NextResponse.json({ error: 'TTS 服務無法連線' }, { status: 500 });
  }
}
