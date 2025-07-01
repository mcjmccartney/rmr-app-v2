import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Test data simulating Louise Case's session
  const testCalendarUpdateData = {
    eventId: "test-event-id-louise-case", // This would be the real eventId from the session
    clientName: "Louise Case",
    clientEmail: "louise.case@example.com",
    clientAddress: "123 Test Street, Test City, Test County",
    dogName: "Test Dog",
    sessionType: "In-Person",
    bookingDate: "2025-07-12",
    bookingTime: "14:00",
    notes: "Test session update for Louise Case",
    quote: 75.00
  };

  try {
    console.log('Testing calendar update API with data:', testCalendarUpdateData);

    // Call the calendar update API directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCalendarUpdateData)
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    console.log('Calendar update API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      response: result
    });

    return NextResponse.json({
      message: 'Test calendar update API call completed',
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      testData: testCalendarUpdateData,
      calendarApiResponse: result
    });

  } catch (error) {
    console.error('Error testing calendar update API:', error);
    return NextResponse.json({
      error: 'Failed to test calendar update API',
      message: error instanceof Error ? error.message : 'Unknown error',
      testData: testCalendarUpdateData
    }, { status: 500 });
  }
}

// GET endpoint to test with query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'test-event-id-louise-case';
  const clientName = searchParams.get('clientName') || 'Louise Case';
  const bookingDate = searchParams.get('bookingDate') || '2025-07-12';
  const bookingTime = searchParams.get('bookingTime') || '14:00';

  const testData = {
    eventId,
    clientName,
    clientEmail: "louise.case@example.com",
    clientAddress: "123 Test Street, Test City, Test County",
    dogName: "Test Dog",
    sessionType: "In-Person",
    bookingDate,
    bookingTime,
    notes: "Test session update via GET",
    quote: 75.00
  };

  try {
    console.log('Testing calendar update API via GET with data:', testData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    return NextResponse.json({
      message: 'Test calendar update API call completed (via GET)',
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      testData,
      calendarApiResponse: result
    });

  } catch (error) {
    console.error('Error testing calendar update API via GET:', error);
    return NextResponse.json({
      error: 'Failed to test calendar update API',
      message: error instanceof Error ? error.message : 'Unknown error',
      testData
    }, { status: 500 });
  }
}
