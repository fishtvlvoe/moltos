import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertUser } from '@/lib/db';

/**
 * POST /api/gmail/switch-account — persist session OAuth tokens into users gmail_* columns.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as { accessToken?: string }).accessToken;
    const refreshToken = (session as { refreshToken?: string }).refreshToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 },
      );
    }

    if (refreshToken == null) {
      console.warn(
        'Google OAuth refresh token not provided, token refresh may fail',
      );
    }

    await upsertUser(
      session.user.email,
      session.user.name ?? undefined,
      session.user.image ?? undefined,
    );

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        gmail_access_token: accessToken,
        gmail_refresh_token: refreshToken ?? null,
        gmail_email: session.user.email,
        gmail_last_sync: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', session.user.email);

    if (error) {
      console.error('[gmail-switch-account] DB update failed:', error);

      return NextResponse.json(
        { error: 'Failed to switch Gmail account' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      email: session.user.email,
    });
  } catch (err) {
    console.error('[gmail-switch-account] Unexpected error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
