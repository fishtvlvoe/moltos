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
    const { channel, enabled } = body;

    // Validate channel
    if (!['email', 'in_app', 'push'].includes(channel)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid channel' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate enabled is boolean
    if (typeof enabled !== 'boolean') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid enabled value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current preferences
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('email', session.user.email)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch preferences' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Merge with existing preferences
    const currentPrefs = userData?.notification_preferences || {
      email: true,
      in_app: true,
      push: false,
    };

    const updatedPrefs = {
      ...currentPrefs,
      [channel]: enabled,
    };

    // Update preferences
    const { error: updateError } = await supabase
      .from('users')
      .update({ notification_preferences: updatedPrefs })
      .eq('email', session.user.email);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update preferences' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, preferences: updatedPrefs }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
