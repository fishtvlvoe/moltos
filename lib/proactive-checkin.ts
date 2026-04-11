/**
 * lib/proactive-checkin.ts
 *
 * 主動關懷模組：偵測靜默用戶並產生個人化訊息
 *
 * 依據 Spec: proactive-checkin
 * - 14 天無互動 → 標記 pending_checkin
 * - 主動訊息必須個人化（含 level/score），不使用通用模板
 */

/** 用戶關懷狀態 */
export type UserCheckInStatus = 'active' | 'pending_checkin';

const SILENCE_THRESHOLD_DAYS = 14;
const SILENCE_THRESHOLD_MS = SILENCE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

/**
 * 偵測用戶是否已靜默超過 14 天
 *
 * @param lastInteractionAt - 最後互動時間戳（ms），null 表示從未互動
 * @returns true = 需要主動關懷（設 pending_checkin）
 */
export function isSilentUser(lastInteractionAt: number | null): boolean {
  if (lastInteractionAt === null) return true;
  return Date.now() - lastInteractionAt >= SILENCE_THRESHOLD_MS;
}

/**
 * 產生個人化的主動關懷訊息
 *
 * 訊息必須參考用戶名稱與 calm index 狀態，
 * 禁止使用通用問候模板。
 *
 * @param userName - 用戶名稱
 * @param level - calm index 等級（可選）
 * @param score - calm index 分數（可選）
 * @returns 個人化的關懷訊息字串
 */
export function buildProactiveMessage(
  userName: string,
  level?: string,
  score?: number
): string {
  if (level && score !== undefined) {
    return `${userName}，好久不見！注意到你最近的平靜指數是 ${score} 分（${level} 等級），想來關心一下你最近的狀況，有什麼想聊的嗎？`;
  }

  return `${userName}，好一陣子沒有聯絡了，最近過得怎麼樣？有什麼想和我分享的嗎？`;
}
