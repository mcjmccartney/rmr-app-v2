import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug sessions API called');

    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('clientName');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      console.log('Getting session by ID:', sessionId);

      // Get specific session by ID with client data
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          client_id,
          session_type,
          booking_date,
          booking_time,
          event_id,
          notes,
          quote,
          clients (
            id,
            first_name,
            last_name,
            email,
            dog_name
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Session query error:', sessionError);
        return NextResponse.json({ error: 'Session not found', details: sessionError }, { status: 404 });
      }

      return NextResponse.json({
        session: {
          id: sessionData.id,
          clientId: sessionData.client_id,
          sessionType: sessionData.session_type,
          bookingDate: sessionData.booking_date,
          bookingTime: sessionData.booking_time,
          eventId: sessionData.event_id,
          hasEventId: !!sessionData.event_id,
          notes: sessionData.notes,
          quote: sessionData.quote
        },
        client: sessionData.clients && sessionData.clients.length > 0 ? {
          id: sessionData.clients[0].id,
          firstName: sessionData.clients[0].first_name,
          lastName: sessionData.clients[0].last_name,
          email: sessionData.clients[0].email,
          dogName: sessionData.clients[0].dog_name
        } : null
      });
    }

    console.log('Getting all sessions with client data');

    // Build query with optional client name filter
    let query = supabase
      .from('sessions')
      .select(`
        id,
        client_id,
        session_type,
        booking_date,
        booking_time,
        event_id,
        notes,
        quote,
        clients (
          id,
          first_name,
          last_name,
          email,
          dog_name
        )
      `)
      .order('booking_date', { ascending: false });

    if (clientName) {
      console.log('Filtering by client name:', clientName);
      // Filter by client first name or last name (case insensitive)
      query = query.or(`clients.first_name.ilike.%${clientName}%,clients.last_name.ilike.%${clientName}%`);
    }

    const { data: sessionsData, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
      return NextResponse.json({
        error: 'Failed to fetch sessions',
        details: sessionsError
      }, { status: 500 });
    }

    console.log(`Found ${sessionsData?.length || 0} sessions`);

    // Format the response
    const sessionData = (sessionsData || []).map(session => ({
      session: {
        id: session.id,
        clientId: session.client_id,
        sessionType: session.session_type,
        bookingDate: session.booking_date,
        bookingTime: session.booking_time,
        eventId: session.event_id,
        hasEventId: !!session.event_id,
        notes: session.notes,
        quote: session.quote
      },
      client: session.clients ? {
        id: session.clients.id,
        firstName: session.clients.first_name,
        lastName: session.clients.last_name,
        email: session.clients.email,
        dogName: session.clients.dog_name,
        fullName: `${session.clients.first_name} ${session.clients.last_name}`.trim()
      } : null
    }));

    const sessionsWithEventId = sessionData.filter(s => s.session.hasEventId).length;
    const sessionsWithoutEventId = sessionData.filter(s => !s.session.hasEventId).length;

    return NextResponse.json({
      message: `Found ${sessionData.length} sessions${clientName ? ` for client name containing "${clientName}"` : ''}`,
      totalSessions: sessionData.length,
      sessionsWithEventId,
      sessionsWithoutEventId,
      sessions: sessionData
    });

  } catch (error) {
    console.error('Error debugging sessions:', error);
    return NextResponse.json({
      error: 'Failed to debug sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
