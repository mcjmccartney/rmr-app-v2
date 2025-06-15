import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/services/sessionService';

// POST endpoint to update session with Event ID from Make.com
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received Event ID update from Make.com:', body);

    const { sessionId, eventId } = body;

    // Validate required fields
    if (!sessionId || !eventId) {
      console.error('Missing sessionId or eventId');
      return NextResponse.json(
        { error: 'Missing sessionId or eventId' },
        { status: 400 }
      );
    }

    // Update the session with the Event ID
    const updatedSession = await sessionService.update(sessionId, {
      eventId: eventId
    });

    console.log('Successfully updated session with Event ID:', updatedSession);

    return NextResponse.json({
      success: true,
      message: 'Event ID updated successfully',
      session: updatedSession
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
    const session = await sessionService.getById(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      eventId: session.eventId,
      hasEventId: !!session.eventId
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
