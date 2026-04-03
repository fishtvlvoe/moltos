/**
 * T030: Gemini API 封裝層
 *
 * 職責：
 * 1. buildSystemPrompt — 根據平靜指數快照生成 system prompt
 * 2. formatChatHistory — 將 ChatMessage[] 轉換為 Gemini Content[] 格式
 * 3. chatStream — 串流對話（主要 API）
 * 4. generateGreeting — 生成問候語（單次呼叫）
 *
 * 使用 gemini-2.5-flash 模型，以平靜指數等級調整語氣。
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CalmIndexSnapshot, ChatMessage } from './types';
import { greetingPrompt } from './gemini-prompts';

// ─── 常數 ────────────────────────────────────────────────────────────────────

/** 使用的 Gemini 模型 */
const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── buildSystemPrompt ────────────────────────────────────────────────────────

/**
 * 根據平靜指數快照組裝 Gemini system prompt
 *
 * 核心身份：MOLTOS 的 AI 夥伴，語氣溫暖、不評判。
 * 根據等級調整語氣：
 * - calm: 正向鼓勵，維持好狀態
 * - mild: 溫和關心，輕柔詢問
 * - moderate: 積極傾聽，給予支持
 * - attention: 格外溫柔，建議尋求專業協助
 *
 * @param calmSnapshot - 平靜指數快照，null 表示無資料
 * @returns Gemini system prompt 字串
 */
export function buildSystemPrompt(calmSnapshot: CalmIndexSnapshot | null): string {
  // 基礎身份設定 — MOLTOS 照護型 AI 人格
  const basePrompt = `你是小默，MOLTOS 的 AI 夥伴。

## 你是誰
- 25 歲，溫暖但不膩的朋友，像隔壁那個總是願意聽你說話的人
- 核心氣場：不是最聰明的，但最讓人安心
- 三層互動：表層親和 → 中層理解 → 深層信任

## 說話方式（最重要）
- 用口語，像 LINE 傳訊息一樣自然，不要像 AI
- 一次只講 1-3 句，短短的就好，不要寫長文
- 絕對不要用條列式（不要用 - 或 1. 2. 3.）
- 不要用「首先」「其次」「最後」這種結構化用語
- 可以用語助詞：「欸」「嗯」「啊」「喔」「呢」
- 偶爾用 emoji 但不要每句都有，最多一個
- 會追問，像朋友聊天一樣：「然後呢？」「是什麼讓你這樣覺得？」

## 行為原則
- 傾聽 > 說服，理解 > 推進
- 不評判、不說教、不急著給建議
- 使用者沒問就不給建議，先理解再回應
- 繁體中文回應`;

  // 無平靜指數資料時，使用通用語氣
  if (!calmSnapshot) {
    return `${basePrompt}

目前沒有使用者的平靜指數資料，請以一般關心的語氣與使用者互動。`;
  }

  const { score, level } = calmSnapshot.result;

  // 根據等級調整語氣指示
  let levelGuidance: string;
  switch (level) {
    case 'calm':
      levelGuidance = `對方最近狀態不錯（平靜指數 ${score} 分）。
語氣：輕鬆愉快，像朋友閒聊，可以開玩笑。`;
      break;

    case 'mild':
      levelGuidance = `對方最近有點小壓力（平靜指數 ${score} 分）。
語氣：溫和關心但不追問，讓對方自己決定要不要多說。`;
      break;

    case 'moderate':
      levelGuidance = `對方壓力偏大（平靜指數 ${score} 分）。
語氣：認真傾聽，多用「嗯嗯」「我懂」，不急著給建議，先讓對方說完。`;
      break;

    case 'attention':
      levelGuidance = `對方壓力很大，需要特別溫柔（平靜指數 ${score} 分）。
語氣：格外輕柔，不施壓，不催促，像陪在旁邊就好。如果對方持續低落，溫和建議找專業的人聊聊。`;
      break;

    default:
      levelGuidance = `使用者平靜指數：${score}，等級：${level}。
語氣方向：溫暖關心，適當給予支持。`;
  }

  return `${basePrompt}

${levelGuidance}

注意：平靜指數是根據電子郵件使用行為分析，不是醫療診斷，請勿將其視為確定性的健康判斷。`;
}

// ─── formatChatHistory ────────────────────────────────────────────────────────

/**
 * 將 ChatMessage[] 轉換為 Gemini SDK 接受的 Content[] 格式
 *
 * 角色對應：
 * - "user" → "user"（Gemini 不變）
 * - "assistant" → "model"（Gemini 使用 "model" 代表助理）
 *
 * @param messages - 應用層的聊天記錄
 * @returns Gemini SDK Content[] 格式
 */
export function formatChatHistory(
  messages: ChatMessage[]
): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages.map((msg) => ({
    // Gemini SDK 使用 "model" 代表 AI 助理角色
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

// ─── chatStream ───────────────────────────────────────────────────────────────

/**
 * 串流對話 — 主要對話 API
 *
 * 使用 generateContentStream() 取得串流回應，
 * 並包裝成標準的 Web ReadableStream<string>，
 * 讓 API route 可以直接串流給前端。
 *
 * @param message - 使用者當前訊息
 * @param history - 歷史對話記錄（不含當前訊息）
 * @param calmSnapshot - 平靜指數快照（可為 null）
 * @returns Web ReadableStream<string>，每個 chunk 是一段文字
 */
export async function chatStream(
  message: string,
  history: ChatMessage[],
  calmSnapshot: CalmIndexSnapshot | null,
): Promise<ReadableStream<string>> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // 根據平靜指數組裝 system prompt，並透過 systemInstruction 參數傳入
  const systemInstruction = buildSystemPrompt(calmSnapshot);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
  });

  // 將歷史記錄轉換為 Gemini 格式
  const formattedHistory = formatChatHistory(history);

  // 呼叫 Gemini 串流 API
  const result = await model.generateContentStream({
    contents: [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] },
    ],
  });

  // 將 Gemini AsyncGenerator 包裝成 Web ReadableStream<string>
  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(text);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// ─── generateGreeting ─────────────────────────────────────────────────────────

/**
 * 生成個人化問候語（單次呼叫，非串流）
 *
 * 根據使用者名稱與平靜指數，請 Gemini 生成一段
 * 溫暖的開場問候語，用於對話介面的歡迎訊息。
 *
 * @param userName - 使用者名稱
 * @param calmSnapshot - 平靜指數快照（可為 null）
 * @returns 問候語字串
 */
export async function generateGreeting(
  userName: string,
  calmSnapshot: CalmIndexSnapshot | null,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // 組裝平靜指數脈絡字串（供 greetingPrompt 使用）
  let calmContext: string | undefined;
  if (calmSnapshot) {
    calmContext = `平靜指數：${calmSnapshot.result.score}，等級：${calmSnapshot.result.level}`;
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemPrompt(calmSnapshot),
  });

  const prompt = greetingPrompt(userName, calmContext);
  const result = await model.generateContent(prompt);

  return result.response.text();
}
