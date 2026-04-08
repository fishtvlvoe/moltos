/**
 * ElevenLabs Conversational AI 型別定義
 */

/** ElevenLabs Custom LLM Webhook 請求格式 */
export interface ElevenLabsWebhookRequest {
  /** 對話 ID（ElevenLabs 產生） */
  conversation_id: string;
  /** 對話歷史 */
  history: ElevenLabsMessage[];
  /** 最新的用戶輸入（文字） */
  query: string;
}

/** ElevenLabs 對話訊息 */
export interface ElevenLabsMessage {
  /** 角色：user 或 assistant */
  role: 'user' | 'assistant';
  /** 訊息內容 */
  content: string;
}

/** ElevenLabs Webhook 回應格式（非串流） */
export interface ElevenLabsWebhookResponse {
  /** AI 回覆內容 */
  reply: string;
}

/** useConversation hook 狀態 */
export type ConversationStatus = 'connected' | 'disconnected' | 'connecting';

/** 通話頁面狀態 */
export type CallState = 'idle' | 'connecting' | 'listening' | 'speaking';
