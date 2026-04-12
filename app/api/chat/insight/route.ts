/**
 * API Route — POST /api/chat/insight
 *
 * 正向分析對話內容：平靜狀態、內在需求、成長路徑。
 * 使用 Gemini 進行語意分析，結果存進 Supabase。
 *
 * 分析框架：MOLTOS 平靜指數（正向分析，不是負向壓力評估）
 * - 衡量「你有多平靜」而非「你有多焦慮」
 * - 識別「內在需求」而非「壓力來源」
 * - 提供「回歸平靜的路徑」而非「壓力管理建議」
 */

import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/types';

const ANALYSIS_PROMPT = `你是 MOLTOS 的對話分析引擎。MOLTOS 採用「正向分析」框架——我們衡量的是「平靜程度」，不是「焦慮程度」。

分析以下使用者與 AI 夥伴「小莫」的對話，用繁體中文回覆。

請以 JSON 格式回傳（不要 markdown code block，直接回傳 JSON）：

{
  "summary": "一句話描述這段對話的主題",
  "calmState": "目前的平靜狀態描述（例如：正在尋找方向、內心有些浮動但積極思考中、逐漸釐清想法）",
  "calmScore": 65,
  "innerNeeds": ["需求1", "需求2"],
  "growthPaths": ["路徑1", "路徑2", "路徑3"],
  "emotionalTone": "這段對話的情緒基調（用正向語言描述，例如：積極探索中、渴望改變、正在整理思緒）",
  "needsProfessional": false
}

分析原則：
- calmScore 0-100：100 = 非常平靜，0 = 極度不安。大多數人在 40-70 之間
- innerNeeds：不叫「壓力來源」，而是「這個人內心真正需要什麼」（例如：需要被肯定、需要明確方向、需要喘息空間）
- growthPaths：不叫「建議」，而是「回歸平靜的可能路徑」（具體、可行、不說教）
- 語氣要中立溫暖，像朋友觀察後的真誠回饋，不是醫生的診斷報告
- needsProfessional：只在提到自傷或極度絕望時設為 true`;

export async function POST(req: Request) {
  let messages: ChatMessage[];

  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '對話紀錄為空' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: '無效的請求' }, { status: 400 });
  }

  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) {
    return NextResponse.json({ error: '沒有使用者訊息' }, { status: 400 });
  }

  const conversationText = messages
    .map(m => `${m.role === 'user' ? '使用者' : '小莫'}：${m.content}`)
    .join('\n');

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `${ANALYSIS_PROMPT}\n\n---\n對話紀錄：\n${conversationText}`,
        },
      ],
      temperature: 0.7,
    });

    const text = message.choices[0]?.message?.content ?? '';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const insight = JSON.parse(jsonStr);

    // 嘗試存進 DB（需要登入）
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single();

        if (user) {
          await supabaseAdmin.from('conversation_insights').insert({
            user_id: user.id,
            summary: insight.summary,
            calm_state: insight.calmState,
            calm_score: insight.calmScore,
            inner_needs: insight.innerNeeds ?? [],
            growth_paths: insight.growthPaths ?? [],
            emotional_tone: insight.emotionalTone,
            needs_professional: insight.needsProfessional ?? false,
            message_count: messages.length,
          });
        }
      }
    } catch (dbErr) {
      console.warn('[POST /api/chat/insight] DB 存儲失敗（不影響回傳）：', dbErr);
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error('[POST /api/chat/insight] 分析失敗：', error);
    return NextResponse.json({ error: '分析服務暫時無法使用' }, { status: 500 });
  }
}
