/**
 * API Route — POST /api/generate-image
 *
 * 目前狀態：尚未實作（stub）
 *
 * TODO: 未來串接 fal.ai FLUX Schnell 模型產生圖片
 *   - 套件：@fal-ai/serverless-client 或 @fal-ai/client
 *   - 模型：fal-ai/flux/schnell（快速、低成本的圖片生成）
 *   - 流程：接收 prompt → 呼叫 fal.ai API → 回傳圖片 URL
 *   - 參考：https://fal.ai/models/fal-ai/flux/schnell
 */

import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: 串接 fal.ai FLUX Schnell 產生圖片
  return NextResponse.json({ status: 'not_implemented', url: null }, { status: 200 });
}
