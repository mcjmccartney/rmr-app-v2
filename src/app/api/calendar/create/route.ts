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
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDqh3/IL3xUNYps\nZb0SR90oKgOD8jfhF8ugG1bnSmKylHZVETibK2tQWyudWNipiPKIDzOmV1oHl78P\nD9RcHtZ2QZe5l4V5tj5mlVYeQnfyN3S4vrJpI+UgyhNCSTFZwpLYp0AVArULrz5v\nq79j8lEncKABIxXkZCr60LSctaEdzmOPVz9JCXSx2GlXUKmawYh7KWXmCGIPJlHg\no3NWRJm25yYmV19C9PTKOwjp2Q/Aywn60OiG8WQ3DP/hWo0WZ7K6ukZ7+JGXM9kD\n3GlT38k6qISO1KGwX5ebaCH483F2MwDtOqW6UntWVT6QhDOKp/XT1nyl58BD4iui\naWCxF3RvAgMBAAECggEAE/EOi/KBs1VUHlBuSbIjm2krIFqFptWTolsAwizghIe8\nIhKTShpghxYheMEXtx6mZKxKO4Ac7x1XiQvTBjw3BxofsQ+xsT4uQyG6j1segNF3\nUsggOnFrZ6TXC2FW2WeCffqGp+KxiztM50jmvrRZcy2P5Vja4S8lOmtpmBOXjgWX\nXJ9d0mejHrN388mWEzVfpqSvHH+2hs5+tkLlLjQGyl6F1JmKNQ2ehhWfR8dpBBdW\nJk1JqCm6Rcf4EIUOf/3aQrKgSXczg1rq8VtqACwAPHsj6lVnQd4+iJqdX7EWTFVH\nPZQ/w/nRjx7/tIeX4pEh/IFj1KUO6hXSK5D9o0j3DQKBgQD/C9gv7u/H12ukkAT1\nhKeeWVXQTPYkAtTt7AKXiPC7OAMiI9EwLFeVtrTk+9YXDotHB4k19uQbBxGRic4j\n/7Me57hOzYuz0Mba8zY9kzgG7DjWTEUfjpqEcMr0vBzLLsGxst6RqyqQpGsrlVX/\n+kAYRfoXiR+CX41P2xP0LCsu+wKBgQDraAOHuZaVqTgdUNxlvst6ixr2l3LOjRYg\njMyed8FMV7xKnSQK0IS4mo68wNgM0WFPPo4xtB65GLm4mrT/Wxf60bQfgcuSheIl\n/0R2m48MLbWypgF7IvbVEA3Moo0ZqSc6YLhPT7KVr51cziVLAlAWz9YV9NeypDwK\nC5fMMwfGHQKBgBxwqa7OqhZSw0IafTMTk81okNUlf90MI8pUIwXa011NJaxM6irB\nBxM+yHUwT/NKP+WvxXErEsygwSjFgSMqhELR/A9thEKM6V/I9ydunzTGaqAa6SpX\nsItMOJWJ1Hwjvp2eIIuF1r1CWGEHygs9UKBkTTsKo2TaWtuoxlTYCAi5AoGAEMOA\ndNrfgVrilxvaBhjXLqvXSLYyQ8lCSSEdtS88Aa7BxuJ33ZlJykefYIuvFwKWFmmT\nALEd+vpqx12lBAY9p+vlEtVQZOfJ2gDapEOhpTFgHg+6TUWJJFUXVnpA6BHmrD6V\nAXjgc85ku2Ymu7e3clhsm3WrIpqVd/WpYq5DoHUCgYEAucpD29pqlD03E4CcFIj/\nt90hr1uj1iD/3kcqJU7cXRGkMz3bGzvwb4/aKO5yzKCX+OGLmzBk7T/rm2dZJNnW\n9JHeR6mNNbEfWcN/1Pnw7H/EG1XtDcWGcuCxiaLaMYp80goHhtshUqBEEkqrzyOl\nBvAywnrMXSNeFQ/q+L3nQgI=\n-----END PRIVATE KEY-----\n",
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

// Helper function to calculate session end time (assuming 1 hour sessions)
const calculateEndTime = (date: string, time: string): string => {
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
  return endDateTime.toISOString().slice(0, 19); // Remove milliseconds and Z
};

// Helper function to format session title
const formatSessionTitle = (clientName: string, dogName: string, sessionType: string): string => {
  return `${clientName}${dogName ? ` w/ ${dogName}` : ''} - ${sessionType}`;
};

// Helper function to format session description
const formatSessionDescription = (sessionType: string, dogName: string, notes: string, quote: number, clientEmail: string): string => {
  let description = `Session Type: ${sessionType}\n`;
  
  if (dogName) {
    description += `Dog: ${dogName}\n`;
  }
  
  if (notes) {
    description += `Notes: ${notes}\n`;
  }
  
  description += `Quote: £${quote}\n`;
  description += `Client Email: ${clientEmail}`;
  
  return description;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating Google Calendar event:', body);

    const {
      sessionId,
      clientName,
      clientEmail,
      dogName,
      sessionType,
      bookingDate,
      bookingTime,
      notes,
      quote
    } = body;

    // Validate required fields
    if (!sessionId || !clientName || !sessionType || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();
    const startDateTime = `${bookingDate}T${bookingTime}:00`;
    const endDateTime = calculateEndTime(bookingDate, bookingTime);

    const event = {
      summary: formatSessionTitle(clientName, dogName, sessionType),
      description: formatSessionDescription(sessionType, dogName, notes, quote, clientEmail),
      start: {
        dateTime: startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: TIMEZONE,
      },
      attendees: clientEmail ? [{ email: clientEmail }] : [],
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    const eventId = response.data.id;
    if (!eventId) {
      throw new Error('No event ID returned from Google Calendar');
    }

    console.log('Successfully created calendar event:', eventId);
    
    return NextResponse.json({
      success: true,
      eventId: eventId,
      message: 'Calendar event created successfully'
    });

  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
