/**
 * API Route — POST /api/tts
 *
 * 使用 ElevenLabs TTS 將文字轉為自然語音（eleven_multilingual_v2，支援中文）。
 * 聲線：由 ELEVENLABS_VOICE_ID 環境變數控制（預設 Sarah）。
 * 回傳 audio/mpeg 二進位資料。
 */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key 未設定' }, { status: 500 });
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

  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5',   // turbo：延遲 ~500ms vs multilingual ~3-5s
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[POST /api/tts] ElevenLabs 錯誤：', err);
      return NextResponse.json({ error: 'TTS 服務錯誤' }, { status: 502 });
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());

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
