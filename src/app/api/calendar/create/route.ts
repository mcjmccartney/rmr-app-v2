import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService, formatSessionForCalendar } from '@/lib/googleCalendar';
import { sessionService } from '@/services/sessionService';
import { clientService } from '@/services/clientService';

// POST endpoint to create Google Calendar event for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating Google Calendar event for session:', body);

    const { sessionId } = body;

    // Validate required fields
    if (!sessionId) {
      console.error('Missing sessionId');
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Get session and client data
    const session = await sessionService.getById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const client = await clientService.getById(session.clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Format session data for Google Calendar
    const calendarEvent = formatSessionForCalendar(session, client);

    // Create the calendar event
    const eventId = await googleCalendarService.createEvent(calendarEvent);

    if (!eventId) {
      throw new Error('Failed to create calendar event - no event ID returned');
    }

    // Update the session with the event ID
    await sessionService.update(sessionId, { eventId });

    console.log('Successfully created calendar event and updated session:', { sessionId, eventId });

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      eventId,
      sessionId
    });

  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
