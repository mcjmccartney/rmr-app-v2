import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/googleCalendar';

// POST endpoint to delete Google Calendar event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Deleting Google Calendar event:', body);

    const { eventId, sessionId } = body;

    // Validate required fields
    if (!eventId) {
      console.error('Missing eventId');
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      );
    }

    // Delete the calendar event
    const success = await googleCalendarService.deleteEvent(eventId);

    console.log('Successfully deleted calendar event:', { eventId, sessionId, success });

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
      eventId,
      sessionId
    });

  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete calendar event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint (alternative method)
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const sessionId = searchParams.get('sessionId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Missing eventId parameter' },
      { status: 400 }
    );
  }

  try {
    console.log('Deleting Google Calendar event via DELETE:', { eventId, sessionId });

    const success = await googleCalendarService.deleteEvent(eventId);

    console.log('Successfully deleted calendar event:', { eventId, sessionId, success });

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
      eventId,
      sessionId
    });

  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete calendar event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
