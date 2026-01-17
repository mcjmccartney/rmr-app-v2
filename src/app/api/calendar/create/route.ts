import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Calendar configuration
const CALENDAR_ID = '44aa8a37ae681eb74a7ac49e18763cfc6fc8e1a6cce7d083a8df7381ccee3572@group.calendar.google.com';
const TIMEZONE = 'Europe/London';

// Service Account credentials
const SERVICE_ACCOUNT_CREDENTIALS = {
  type: "service_account",
  project_id: "raising-my-rescue-session",
  private_key_id: "a76e798907546e4569e14c0c32c966b5816aaa67",
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
  client_email: "raising-my-rescue@raising-my-rescue-session.iam.gserviceaccount.com",
  client_id: "110484167377984707130",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/raising-my-rescue%40raising-my-rescue-session.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Google Calendar API
const getCalendarClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return google.calendar({ version: 'v3', auth });
};

// Helper function to calculate session end time based on session type
const calculateEndTime = (date: string, time: string, sessionType: string): string => {
  const startDateTime = new Date(`${date}T${time}:00`);
  let durationMinutes = 90; // Default 1.5 hours (90 minutes)

  // Set duration based on session type
  switch (sessionType) {
    case 'Training - 1hr':
      durationMinutes = 60; // 1 hour
      break;
    case 'Training - 30mins':
      durationMinutes = 30; // 30 minutes
      break;
    case 'Training - The Mount':
      durationMinutes = 60; // 1 hour (same as Training - 1hr)
      break;
    default:
      durationMinutes = 90; // 1.5 hours for all other session types
      break;
  }

  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
  return endDateTime.toISOString().slice(0, 19); // Remove milliseconds and Z
};

// Helper function to format session title
const formatSessionTitle = (clientName: string, dogName: string): string => {
  return `${clientName}${dogName ? ` w/ ${dogName}` : ''}`;
};

// Helper function to format session description
const formatSessionDescription = (sessionType: string): string => {
  return sessionType;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientAddress,
      dogName,
      sessionType,
      bookingDate,
      bookingTime,
      notes,
      quote
    } = body;

    // Validate required fields
    if (!clientName || !sessionType || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();

    const startDateTime = `${bookingDate}T${bookingTime}:00`;
    const endDateTime = calculateEndTime(bookingDate, bookingTime, sessionType);

    // Generate unique request ID for Google Meet conference
    const requestId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const event: any = {
      summary: formatSessionTitle(clientName, dogName),
      description: formatSessionDescription(sessionType),
      location: clientAddress || '',
      start: {
        dateTime: startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: TIMEZONE,
      },
      // Removed attendees field - service accounts can't invite attendees without Domain-Wide Delegation
    };

    // Add Google Meet conference data for Online sessions
    if (sessionType === 'Online') {
      event.conferenceData = {
        createRequest: {
          requestId: requestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: sessionType === 'Online' ? 1 : 0
    });

    const eventId = response.data.id;
    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      eventId: eventId,
      meetLink: meetLink || null
    });

  } catch (error) {
    console.error('Calendar create error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create calendar event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
