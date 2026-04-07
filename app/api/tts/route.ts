/**
 * API Route — POST /api/tts
 *
 * 使用 Google Cloud TTS 將文字轉為自然語音。
 * 聲線：zh-TW-Neural2-C（台灣女聲，Neural2 等級）
 * 回傳 audio/mpeg 二進位資料。
 */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Cloud TTS API key 未設定' }, { status: 500 });
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

  const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: cleanText },
        voice: {
          languageCode: 'zh-TW',
          name: 'zh-TW-Neural2-C',   // 台灣女聲，Neural2 等級
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.05,         // 略快，自然對話節奏
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[POST /api/tts] Google Cloud TTS 錯誤：', err);
      return NextResponse.json({ error: 'TTS 服務錯誤' }, { status: 502 });
    }

    const data = await res.json() as { audioContent: string };
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

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
