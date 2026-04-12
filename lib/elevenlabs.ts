/**
 * ElevenLabs Conversational AI 整合工具
 * 給 call/page.tsx 使用的 helper 函式
 *
 * 依賴：@11labs/react（SDK wrapper）
 */

import type { Status } from '@11labs/react';
import type { CallState } from '@/types/elevenlabs';

// ─── getAgentId ──────────────────────────────────────────────────────────────

/**
 * 從環境變數取得 ElevenLabs Agent ID
 *
 * 優先讀 NEXT_PUBLIC_ELEVENLABS_AGENT_ID（客戶端可用）。
 * 不存在時拋出錯誤，強制在環境變數設定好才能啟動通話。
 */
export function getAgentId(): string {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error(
      '未設定 NEXT_PUBLIC_ELEVENLABS_AGENT_ID 環境變數，請在 .env.local 加入此值。'
    );
  }

  return agentId;
}

// ─── ELEVENLABS_CONFIG ───────────────────────────────────────────────────────

/**
 * ElevenLabs SDK 的預設設定常數
 *
 * 包含預設回調（onConnect / onDisconnect）以及音量事件處理 helper。
 * call/page.tsx 可直接展開使用，也可以覆寫單一回調。
 */
export const ELEVENLABS_CONFIG = {
  /**
   * 連線建立時的預設回調
   * @param conversationId ElevenLabs 產生的對話 ID
   */
  onConnect: ({ conversationId }: { conversationId: string }) => {
    console.info('[ElevenLabs] 連線建立，conversation_id:', conversationId);
  },

  /**
   * 連線中斷時的預設回調
   */
  onDisconnect: () => {
    console.info('[ElevenLabs] 連線已中斷');
  },

  /**
   * 取得當前麥克風輸入音量（0–1）的 helper
   * 需在 useConversation hook 回傳的 getInputVolume 基礎上使用。
   *
   * @param getInputVolume SDK 提供的 getInputVolume 函式
   * @returns 正規化後的音量值（0–1）
   */
  getInputVolumeLevel: (getInputVolume: () => number): number => {
    return Math.min(1, Math.max(0, getInputVolume()));
  },

  /**
   * 取得當前 AI 輸出音量（0–1）的 helper
   * 可用於驅動說話動畫或音量指示器。
   *
   * @param getOutputVolume SDK 提供的 getOutputVolume 函式
   * @returns 正規化後的音量值（0–1）
   */
  getOutputVolumeLevel: (getOutputVolume: () => number): number => {
    return Math.min(1, Math.max(0, getOutputVolume()));
  },
} as const;

// ─── stripEmotionTags ────────────────────────────────────────────────────────

/**
 * 去除 AI 回應中的情緒標籤（如 [laughs]、[sighs]、[幸福]），
 * 避免這些標籤被 TTS 念出來。
 *
 * 規則：移除所有 [...] 形式的方括號標籤，保留其餘文字。
 *
 * @param text 原始 AI 回應文字
 * @returns 去除情緒標籤後的乾淨文字
 */
export function stripEmotionTags(text: string): string {
  return text.replace(/\[[^\]]*\]/g, '').trim();
}

// ─── mapConversationStatus ────────────────────────────────────────────────────

/**
 * 將 ElevenLabs SDK 的 Status 映射到應用層的 CallState
 *
 * SDK Status 說明：
 * - 'connecting'    → 正在建立連線
 * - 'connected'     → 連線中（搭配 isSpeaking 區分說話或聆聽）
 * - 'disconnecting' → 正在中斷連線（視為通話結束）
 * - 'disconnected'  → 已中斷
 *
 * @param status     SDK 回傳的連線狀態
 * @param isSpeaking SDK 回傳的 AI 說話狀態
 * @returns 對應的 CallState
 */
export function mapConversationStatus(
  status: Status,
  isSpeaking: boolean
): CallState {
  switch (status) {
    case 'connected':
      // 連線中根據 isSpeaking 細分 AI 正在說話或正在聆聽
      return isSpeaking ? 'speaking' : 'listening';

    case 'connecting':
      return 'connecting';

    case 'disconnecting':
    case 'disconnected':
      // 斷線中與已斷線都歸為 idle（通話已結束）
      return 'idle';

    default:
      // 型別安全兜底，實際不應進入此分支
      return 'idle';
  }
}
