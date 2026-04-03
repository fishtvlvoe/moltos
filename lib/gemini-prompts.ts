/**
 * T030: Gemini Prompt Template Functions
 *
 * 四個純函式，負責組裝各種情境的 prompt 字串。
 * 這些函式是無副作用的純函式，方便測試。
 *
 * 匯出清單：
 * - chatPrompt: 對話時的使用者 prompt 增強（可附加平靜指數脈絡）
 * - summaryPrompt: YouTube 影片摘要請求
 * - greetingPrompt: AI 主動問候語生成
 * - insightPrompt: 根據平靜指數分數與等級生成洞察建議
 */

/**
 * 對話 prompt 增強
 *
 * 將使用者的訊息包裹，並可選擇性附加平靜指數脈絡，
 * 讓 Gemini 在回應時有更多情境參考。
 *
 * @param userMessage - 使用者輸入的原始訊息
 * @param calmContext - 可選的平靜指數脈絡字串（例如「平靜指數：72，等級：mild」）
 * @returns 組裝後的完整 prompt 字串
 */
export function chatPrompt(userMessage: string, calmContext?: string): string {
  if (calmContext) {
    return `[使用者當前狀態參考 — ${calmContext}]\n\n使用者說：${userMessage}`;
  }
  return `使用者說：${userMessage}`;
}

/**
 * YouTube 影片摘要 prompt
 *
 * 請 AI 根據影片標題與描述生成照護相關的重點摘要。
 * Phase 6 的影片功能會使用此 prompt。
 *
 * @param title - 影片標題
 * @param description - 影片描述（可為空字串）
 * @returns 組裝後的摘要請求 prompt
 */
export function summaryPrompt(title: string, description: string): string {
  return `請根據以下 YouTube 影片的標題與描述，以繁體中文生成一段簡短的重點摘要（3-5 句話），聚焦在對身心健康或照護有幫助的資訊。

影片標題：${title}
影片描述：${description || '（無描述）'}

請直接輸出摘要內容，不需要加上「摘要：」等前綴。`;
}

/**
 * AI 主動問候語 prompt
 *
 * 根據使用者名稱與可選的平靜指數脈絡，
 * 生成一段溫暖且個人化的問候語。
 *
 * @param userName - 使用者名稱
 * @param calmContext - 可選的平靜指數脈絡字串
 * @returns 組裝後的問候語請求 prompt
 */
export function greetingPrompt(userName: string, calmContext?: string): string {
  const calmPart = calmContext
    ? `\n\n根據最新資料，${calmContext}，請在問候中適度融入這個狀態的關心。`
    : '';

  return `請以溫暖、友善的口吻，用繁體中文向 ${userName} 打招呼，問候他今天的狀態，並邀請他分享心情。問候語不超過 2-3 句話，語氣自然不刻意。${calmPart}`;
}

/**
 * 平靜指數洞察建議 prompt
 *
 * 根據平靜指數的分數與等級，請 AI 生成具體的照護建議。
 *
 * @param score - 平靜指數分數（0-100）
 * @param level - 平靜等級（calm | mild | moderate | attention）
 * @returns 組裝後的洞察建議請求 prompt
 */
export function insightPrompt(score: number, level: string): string {
  return `使用者目前的平靜指數為 ${score} 分，等級為 ${level}。

請根據這個狀態，用繁體中文給出 2-3 條具體、溫暖的照護建議。建議應該實際可行，不要過於籠統。語氣應該溫柔且不評判。

注意：這是基於電子郵件使用行為的分析，並非醫療診斷，請在適當情況下說明這一點。`;
}
