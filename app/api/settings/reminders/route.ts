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
    const { enabled, time, frequency, types } = body;

    // Validate time format (HH:MM)
    if (!enabled) {
      // If disabled, skip validation
    } else {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid time format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid frequency' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate types
    if (!Array.isArray(types) || types.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one type must be selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validTypes = ['calm_index', 'chat_summary'];
    if (!types.every((t: string) => validTypes.includes(t))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reminder types' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const schedule = {
      enabled,
      time,
      frequency,
      types,
    };

    // Update reminder_schedule in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ reminder_schedule: schedule })
      .eq('email', session.user.email);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update schedule' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, schedule }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating reminder schedule:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
