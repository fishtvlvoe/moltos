import { NextResponse } from 'next/server';

// GET /api/elevenlabs-signed-url
// 用後端 API Key 向 ElevenLabs 取得 signed URL，避免 agentId 直連被 LiveKit 404 拒絕
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json({ error: '缺少環境變數' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[ElevenLabs] signed URL 取得失敗:', error);
      return NextResponse.json({ error: 'signed URL 取得失敗' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('[ElevenLabs] signed URL 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
