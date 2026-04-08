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

/** ElevenLabs Post-call transcript 單筆訊息 */
export interface ElevenLabsTranscriptEntry {
  role: 'user' | 'agent';
  message?: string;
  content?: string;
  timestamp?: number;
}

/** ElevenLabs 對話啟動時的客戶端資料 */
export interface ElevenLabsConversationInitiationClientData {
  dynamic_variables?: Record<string, string>;
}

/** ElevenLabs Post-call transcription data（新格式 data 內層） */
export interface ElevenLabsPostCallTranscriptionData {
  agent_id?: string;
  conversation_id?: string;
  transcript?: ElevenLabsTranscriptEntry[];
  metadata?: Record<string, unknown>;
  conversation_initiation_client_data?: ElevenLabsConversationInitiationClientData;
}

/** ElevenLabs Post-call webhook payload（相容新舊格式） */
export type ElevenLabsPostCallWebhookPayload =
  | ({
      type: 'post_call_transcription';
      data: ElevenLabsPostCallTranscriptionData;
    } & Record<string, unknown>)
  | ElevenLabsPostCallTranscriptionData;

/** useConversation hook 狀態 */
export type ConversationStatus = 'connected' | 'disconnected' | 'connecting';

/** 通話頁面狀態 */
export type CallState = 'idle' | 'connecting' | 'listening' | 'speaking';
