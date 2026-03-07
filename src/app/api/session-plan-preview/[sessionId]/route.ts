import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Fetch session plan
    const { data: planData, error: planError } = await supabaseAdmin
      .from('session_plans')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (planError) {
      console.error('Session plan error:', planError);
      return NextResponse.json(
        { error: 'Session plan not found' },
        { status: 404 }
      );
    }

    // Fetch session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch client
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', sessionData.client_id)
      .single();

    if (clientError) {
      console.error('Client error:', clientError);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch action points library
    const { data: actionPointsData, error: actionPointsError } = await supabaseAdmin
      .from('action_points')
      .select('*');

    if (actionPointsError) {
      console.error('Action points error:', actionPointsError);
    }

    // Calculate session number server-side (avoids RLS issues in unauthenticated Puppeteer context)
    let calculatedSessionNumber = planData.session_number || 1;
    try {
      let query = supabaseAdmin
        .from('sessions')
        .select('id, booking_date, booking_time')
        .eq('client_id', sessionData.client_id)
        .in('session_type', ['Online', 'In-Person'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (sessionData.dog_name) {
        query = query.eq('dog_name', sessionData.dog_name);
      }

      const { data: clientSessions } = await query;

      if (clientSessions) {
        const currentDate = new Date(`${sessionData.booking_date}T${sessionData.booking_time}`);
        const sessionsBeforeOrEqual = clientSessions.filter(s => {
          const sDate = new Date(`${s.booking_date}T${s.booking_time}`);
          return sDate <= currentDate;
        });
        calculatedSessionNumber = Math.max(sessionsBeforeOrEqual.length, 1);
      }
    } catch {
      // Keep stored session number as fallback
    }

    // Return all data
    return NextResponse.json({
      sessionPlan: planData,
      session: sessionData,
      client: clientData,
      actionPoints: actionPointsData || [],
      calculatedSessionNumber
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

