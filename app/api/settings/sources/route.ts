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
    const sourcePriorities = body;

    // Validate sync_interval values
    for (const [source, config] of Object.entries(sourcePriorities)) {
      const sourceConfig = config as any;
      if (!['hourly', 'daily', 'on-demand'].includes(sourceConfig.sync_interval)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid sync_interval' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update source_priorities in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ source_priorities: sourcePriorities })
      .eq('email', session.user.email);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update sources' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sources: sourcePriorities }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating source priorities:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
