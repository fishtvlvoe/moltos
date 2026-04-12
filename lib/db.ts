/**
 * 資料庫操作層
 *
 * 封裝所有 Supabase 資料庫存取，提供型別安全的操作函式。
 * 錯誤直接 throw，由呼叫方決定如何處理。
 */

import { supabaseAdmin } from './supabase';
import type { ChatMessage, CalmIndexSnapshot } from './types';

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * 以 email 作為唯一鍵進行 upsert，回傳 user id（UUID）。
 * 若用戶已存在，會更新 name / image / google_id 與 updated_at。
 */
export async function upsertUser(
  email: string,
  name?: string,
  image?: string,
  googleId?: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email,
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(googleId !== undefined && { google_id: googleId }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single();

  if (error) throw new Error(`upsertUser 失敗：${error.message}`);
  return data.id as string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * 儲存一筆對話訊息到 conversations 表。
 */
export async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('conversations').insert({
    user_id: userId,
    role,
    content,
  });

  if (error) throw new Error(`saveMessage 失敗：${error.message}`);
}

/**
 * 取得用戶的歷史對話訊息，預設最新 50 筆，轉換為 ChatMessage 格式。
 */
export async function getMessages(
  userId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  // 先取最新 N 筆（降冪），再反轉為時間正序（符合聊天顯示順序）
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getMessages 失敗：${error.message}`);

  return (data ?? []).reverse().map((row) => ({
    id: row.id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    // 將 ISO 字串轉為 Unix timestamp（毫秒）
    timestamp: new Date(row.created_at as string).getTime(),
  }));
}

// ─── Calm Index ───────────────────────────────────────────────────────────────

/**
 * 儲存一筆平靜指數快照到 calm_index_history 表。
 */
export async function saveCalmIndex(
  userId: string,
  snapshot: CalmIndexSnapshot,
): Promise<void> {
  const { error } = await supabaseAdmin.from('calm_index_history').insert({
    user_id: userId,
    score: snapshot.result.score,
    level: snapshot.result.level,
    dimensions: snapshot.result.dimensions ?? null,
    coverage_days: snapshot.coverageDays,
    is_stale: snapshot.isStale,
    calculated_at: new Date(snapshot.createdAt).toISOString(),
  });

  if (error) throw new Error(`saveCalmIndex 失敗：${error.message}`);
}

/**
 * 取得用戶在指定天數內的平靜指數歷史趨勢（預設 30 天）。
 * 回傳陣列依 created_at 升冪排列。
 */
export async function getCalmIndexHistory(
  userId: string,
  days = 30,
): Promise<Array<{ score: number; level: string; createdAt: string }>> {
  // 計算起始時間（N 天前）
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('calm_index_history')
    .select('score, level, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getCalmIndexHistory 失敗：${error.message}`);

  return (data ?? []).map((row) => ({
    score: row.score as number,
    level: row.level as string,
    createdAt: row.created_at as string,
  }));
}

// ─── Call Sessions ────────────────────────────────────────────────────────────

/**
 * 儲存語音通話 session 對應（conversation_id → user_id）。
 * 用於 ElevenLabs webhook 收到後查詢正確的 user_id。
 * TTL 1 天，避免殘留舊資料。
 */
export async function saveCallSession(
  conversationId: string,
  userId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 1 天後
  const { error } = await supabaseAdmin
    .from('call_sessions')
    .upsert({ conversation_id: conversationId, user_id: userId, expires_at: expiresAt });

  if (error) throw new Error(`saveCallSession 失敗：${error.message}`);
}

/**
 * 查詢語音通話 session 對應的 user_id。
 * 回傳包含 user_id 的物件；找不到回傳 null（讓 webhook 使用 fallback 邏輯）。
 *
 * Fix 2: 改為回傳物件型別 { user_id: string } | null，符合測試期望
 */
export async function getCallSession(
  conversationId: string,
): Promise<{ user_id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('call_sessions')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error) throw new Error(`getCallSession 失敗：${error.message}`);
  
  // 回傳完整物件 { user_id: string } | null
  return data ? { user_id: data.user_id as string } : null;
}

/**
 * 刪除已使用的語音通話 session 對應記錄。
 * Webhook 查詢 user_id 後呼叫，避免殘留過期資料。
 * 失敗不拋錯（只記錄 warning），不影響主流程。
 */
export async function deleteCallSession(conversationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('call_sessions')
    .delete()
    .eq('conversation_id', conversationId);

  if (error) console.warn(`deleteCallSession 失敗（非阻斷）：${error.message}`);
}
