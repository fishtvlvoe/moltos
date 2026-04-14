/**
 * Icon Mapping — Emoji to SVG Icon Converter
 * 
 * 提供統一的 emoji → Lucide/Custom SVG 對應表，
 * 方便全系統的 icon 替換和維護。
 */

/**
 * emoji 到 icon name 的映射表
 * - 使用 Lucide icon names（直接對應 lucide-react 套件）
 * - 自訂 icon name 用於 Lucide 無對應的情況（BlockCursor、RecordingDot）
 */
export const EMOJI_TO_ICON = {
  // 展開/收合
  '▼': 'ChevronDown',
  '▲': 'ChevronUp',
  
  // 健康指標
  '🚶': 'Footprints',
  '😴': 'Moon',
  '💧': 'Droplet',
  
  // 時間和郵件
  '📧': 'Mail',
  '⏰': 'Clock',
  '🌙': 'Moon',
  
  // 社交互動
  '♡': 'Heart',
  '❤️': 'Heart',
  '💬': 'MessageCircle',
  '📤': 'Share',
  '🔖': 'Bookmark',
  '📌': 'Bookmark',
  
  // 自訂 icon（Lucide 無對應）
  '▌': 'BlockCursor',    // 遊標指示器
  '●': 'RecordingDot',   // 錄音指示器
} as const;

export type EmojiChar = keyof typeof EMOJI_TO_ICON;
export type IconName = typeof EMOJI_TO_ICON[EmojiChar];

/**
 * 根據 emoji 取得對應的 icon name
 * @param emoji - 需要查詢的 emoji 字元
 * @returns icon name，未找到則回傳 undefined
 */
export function getIconName(emoji: string): IconName | undefined {
  return EMOJI_TO_ICON[emoji as EmojiChar];
}

/**
 * 檢查是否為已對應的 emoji
 * @param emoji - 需要檢查的 emoji 字元
 * @returns 是否存在於映射表中
 */
export function isKnownEmoji(emoji: string): emoji is EmojiChar {
  return emoji in EMOJI_TO_ICON;
}
