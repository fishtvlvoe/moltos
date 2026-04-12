/**
 * API Route — DELETE /api/user/data
 *
 * Deletes a user's data across:
 * - conversations (user_id)
 * - conversation_insights (conversation_id IN user's conversations)
 * - calm_index_history (user_id)
 *
 * Also attempts to delete the corresponding ElevenLabs conversation artifacts per conversation_id.
 * ElevenLabs failures are tolerated (logged) and do not fail the request.
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

type ConversationRow = { id: string };

function deleteElevenLabsConversation(conversationId: string): void {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return;

  // Fire-and-forget: do not block the main deletion flow.
  void fetch(`https://api.elevenlabs.io/v1/convai/conversation/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'xi-api-key': apiKey,
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn(
          `[DELETE /api/user/data] ElevenLabs delete failed conversation_id=${conversationId} status=${res.status} body=${text}`
        );
      }
    })
    .catch((err) => {
      console.warn(
        `[DELETE /api/user/data] ElevenLabs delete error conversation_id=${conversationId}`,
        err
      );
    });
}

export async function DELETE(): Promise<Response> {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Query conversation IDs for this user
  const { data: conversations, error: conversationsError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (conversationsError) {
    console.error('[DELETE /api/user/data] Failed to query conversations:', conversationsError);
    return NextResponse.json({ error: 'Failed to query conversations' }, { status: 500 });
  }

  const conversationIds = (conversations as ConversationRow[] | null | undefined)
    ?.map((row) => row.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? [];

  // 2) Delete conversation_insights for those conversations
  if (conversationIds.length > 0) {
    const { error: insightsError } = await supabaseAdmin
      .from('conversation_insights')
      .delete()
      .in('conversation_id', conversationIds);

    if (insightsError) {
      console.error('[DELETE /api/user/data] Failed to delete conversation_insights:', insightsError);
      return NextResponse.json({ error: 'Failed to delete conversation insights' }, { status: 500 });
    }
  }

  // 3) Delete conversations
  const { error: deleteConversationsError } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('user_id', userId);

  if (deleteConversationsError) {
    console.error('[DELETE /api/user/data] Failed to delete conversations:', deleteConversationsError);
    return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
  }

  // 4) Delete calm_index_history
  const { error: calmHistoryError } = await supabaseAdmin
    .from('calm_index_history')
    .delete()
    .eq('user_id', userId);

  if (calmHistoryError) {
    console.error('[DELETE /api/user/data] Failed to delete calm_index_history:', calmHistoryError);
    return NextResponse.json({ error: 'Failed to delete calm index history' }, { status: 500 });
  }

  // 5) Non-blocking cleanup on ElevenLabs (best-effort)
  for (const id of conversationIds) {
    deleteElevenLabsConversation(id);
  }

  return NextResponse.json({ success: true, deletedCount: conversationIds.length });
}
