import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST endpoint to update session with Event ID from Make.com
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    console.log('Received Event ID update from Make.com:', body);

    const { sessionId, eventId, googleMeetLink } = body;

    // Validate required fields
    if (!sessionId || !eventId) {
      console.error('Missing sessionId or eventId');
      return NextResponse.json(
        { error: 'Missing sessionId or eventId' },
        { status: 400 }
      );
    }

    // Update the session with the Event ID (and optionally Google Meet link)
    const updateData: any = {
      event_id: eventId // Use snake_case for database field
    };
    if (googleMeetLink) {
      updateData.google_meet_link = googleMeetLink; // Use snake_case for database field
    }

    const { data: updatedSession, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        {
          error: 'Failed to update session',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('Successfully updated session with Event ID:', {
      sessionId,
      eventId,
      googleMeetLink: googleMeetLink || 'not provided'
    });

    // Return the updated session data so the frontend can update its state if needed
    return NextResponse.json({
      success: true,
      message: 'Event ID updated successfully',
      sessionId,
      eventId,
      googleMeetLink: googleMeetLink || null,
      updatedSession // Include the full updated session
    });

  } catch (error) {
    console.error('Error updating session with Event ID:', error);
    return NextResponse.json(
      {
        error: 'Failed to update Event ID',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    );
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, event_id')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session', details: error.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      eventId: session.event_id,
      hasEventId: !!session.event_id
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
