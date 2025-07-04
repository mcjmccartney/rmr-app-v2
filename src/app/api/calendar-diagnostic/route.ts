import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Calendar configuration (same as other endpoints)
const CALENDAR_ID = '44aa8a37ae681eb74a7ac49e18763cfc6fc8e1a6cce7d083a8df7381ccee3572@group.calendar.google.com';
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

export async function GET() {
  console.log('🔍 COMPREHENSIVE CALENDAR API DIAGNOSTIC');
  
  const diagnostics = {
    environmentCheck: {},
    authenticationTest: {},
    calendarApiTest: {},
    createEventTest: {}
  };

  try {
    // 1. Environment Variable Check
    console.log('1️⃣ Checking environment variables...');
    diagnostics.environmentCheck = {
      hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      privateKeyStartsWith: process.env.GOOGLE_PRIVATE_KEY ? '-----BEGIN PRIVATE KEY-----' : 'NOT_SET',
      privateKeyContainsBegin: process.env.GOOGLE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----') || false,
      hasNextPublicBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL ? 'SET' : 'NOT_SET'
    };

    // 2. Authentication Test
    console.log('2️⃣ Testing Google Calendar authentication...');
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      // Test basic calendar access
      const calendarInfo = await calendar.calendars.get({
        calendarId: CALENDAR_ID
      });
      
      diagnostics.authenticationTest = {
        success: true,
        calendarFound: !!calendarInfo.data,
        calendarSummary: calendarInfo.data.summary,
        calendarTimeZone: calendarInfo.data.timeZone,
        calendarDescription: calendarInfo.data.description
      };
      
    } catch (authError) {
      diagnostics.authenticationTest = {
        success: false,
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        errorType: authError instanceof Error ? authError.constructor.name : 'Unknown',
        stack: authError instanceof Error ? authError.stack : 'No stack trace'
      };
    }

    // 3. Calendar API Test (List recent events)
    console.log('3️⃣ Testing calendar API access...');
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      const events = await calendar.events.list({
        calendarId: CALENDAR_ID,
        maxResults: 5,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date().toISOString()
      });
      
      diagnostics.calendarApiTest = {
        success: true,
        eventsFound: events.data.items?.length || 0,
        sampleEvents: events.data.items?.slice(0, 2).map(event => ({
          id: event.id,
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date
        })) || []
      };
      
    } catch (apiError) {
      diagnostics.calendarApiTest = {
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        errorType: apiError instanceof Error ? apiError.constructor.name : 'Unknown',
        stack: apiError instanceof Error ? apiError.stack : 'No stack trace'
      };
    }

    // 4. Test Event Creation (with immediate deletion)
    console.log('4️⃣ Testing event creation...');
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      // Create a test event
      const testEvent = {
        summary: 'DIAGNOSTIC TEST - DELETE ME',
        description: 'This is a test event created by the calendar diagnostic tool',
        start: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          timeZone: 'Europe/London',
        },
        end: {
          dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          timeZone: 'Europe/London',
        },
      };
      
      const createResponse = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: testEvent,
      });
      
      const eventId = createResponse.data.id;
      
      // Immediately delete the test event
      if (eventId) {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: eventId,
        });
      }
      
      diagnostics.createEventTest = {
        success: true,
        eventCreated: !!eventId,
        eventId: eventId,
        eventDeleted: true,
        message: 'Successfully created and deleted test event'
      };
      
    } catch (createError) {
      diagnostics.createEventTest = {
        success: false,
        error: createError instanceof Error ? createError.message : 'Unknown create error',
        errorType: createError instanceof Error ? createError.constructor.name : 'Unknown',
        stack: createError instanceof Error ? createError.stack : 'No stack trace'
      };
    }



    return NextResponse.json({
      message: 'Calendar API Comprehensive Diagnostic Complete',
      timestamp: new Date().toISOString(),
      diagnostics,
      recommendations: generateRecommendations(diagnostics),
      summary: generateSummary(diagnostics)
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to run calendar diagnostic',
      message: error instanceof Error ? error.message : 'Unknown error',
      partialDiagnostics: diagnostics
    }, { status: 500 });
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations = [];
  
  if (!diagnostics.environmentCheck.hasGooglePrivateKey) {
    recommendations.push('❌ CRITICAL: GOOGLE_PRIVATE_KEY environment variable is missing. Add it to your Vercel environment variables.');
  } else if (diagnostics.environmentCheck.privateKeyLength < 100) {
    recommendations.push('⚠️ WARNING: GOOGLE_PRIVATE_KEY seems too short. Verify the complete private key is set.');
  } else if (!diagnostics.environmentCheck.privateKeyContainsBegin) {
    recommendations.push('⚠️ WARNING: GOOGLE_PRIVATE_KEY does not contain "-----BEGIN PRIVATE KEY-----". Check the format.');
  }
  
  if (!diagnostics.authenticationTest.success) {
    recommendations.push('❌ CRITICAL: Google Calendar authentication failed. Check service account credentials and private key format.');
  }
  
  if (!diagnostics.calendarApiTest.success) {
    recommendations.push('❌ CRITICAL: Calendar API access failed. Check calendar permissions and service account access to the specific calendar.');
  }
  
  if (!diagnostics.createEventTest.success) {
    recommendations.push('❌ CRITICAL: Event creation failed. This explains why calendar operations are not working.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All tests passed! Calendar API should be working correctly.');
  }
  
  return recommendations;
}

function generateSummary(diagnostics: any): string {
  const issues = [];
  
  if (!diagnostics.environmentCheck.hasGooglePrivateKey) issues.push('Missing GOOGLE_PRIVATE_KEY');
  if (!diagnostics.authenticationTest.success) issues.push('Authentication failed');
  if (!diagnostics.calendarApiTest.success) issues.push('Calendar access failed');
  if (!diagnostics.createEventTest.success) issues.push('Event creation failed');
  
  if (issues.length === 0) {
    return '✅ All calendar operations working correctly';
  } else {
    return `❌ Issues found: ${issues.join(', ')}`;
  }
}

// Also support POST for testing
export async function POST() {
  return GET();
}
