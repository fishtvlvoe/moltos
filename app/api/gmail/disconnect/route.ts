import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/gmail/disconnect — clears Gmail tokens; keeps account + calm_index_history.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_email: null,
        gmail_last_sync: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('[gmail-disconnect] DB update failed:', error);

      return NextResponse.json(
        { error: 'Failed to disconnect Gmail' },
        { status: 500 },
      );
    }

    console.log(`[gmail-disconnect] User ${email} disconnected Gmail`);

    return NextResponse.json({
      success: true,
      message: 'Gmail account disconnected',
    });
  } catch (err) {
    console.error('[gmail-disconnect] Unexpected error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
