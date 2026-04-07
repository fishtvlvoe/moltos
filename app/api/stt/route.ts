/**
 * API Route — POST /api/stt
 *
 * 用 Groq Whisper 將錄音轉成文字（比 Web Speech API 快 10 倍，iOS 穩定）。
 * 接收 multipart/form-data，欄位 audio = 錄音 Blob（webm 或 mp4）。
 * 回傳 { text: string }。
 */

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY 未設定' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 });
  }

  const audio = formData.get('audio') as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ text: '' }); // 空錄音直接回空字串
  }

  try {
    const groq = new Groq({ apiKey });
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3-turbo', // 最快的 Whisper 模型（~100ms）
      language: 'zh',
      response_format: 'json',
      // prompt 幫助 Whisper 正確辨識台灣用語和同音字（如「失業」不要辨識成「事業」）
      prompt: '以下是用戶與AI助理「小默」的對話，使用台灣繁體中文，話題包括：工作、失業、情緒、壓力、家庭、人際關係、心理健康。',
    });

    return NextResponse.json({ text: transcription.text ?? '' });
  } catch (error) {
    console.error('[POST /api/stt] Groq 錯誤：', error);
    return NextResponse.json({ error: 'STT 服務錯誤' }, { status: 500 });
  }
}
