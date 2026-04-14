import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { personalization, analytics, recommendations } = body;

    // Validate boolean values
    if (
      typeof personalization !== 'boolean' ||
      typeof analytics !== 'boolean' ||
      typeof recommendations !== 'boolean'
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid settings values' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const privacySettings = {
      personalization,
      analytics,
      recommendations,
    };

    // Update privacy_settings in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ privacy_settings: privacySettings })
      .eq('email', session.user.email);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, settings: privacySettings }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
