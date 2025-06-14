import { NextResponse } from 'next/server';

export async function GET() {
  // Test data that matches the session webhook format
  const testSessionData = {
    sessionId: "test-session-" + Date.now(),
    clientId: "test-client-123",
    clientName: "John Doe",
    clientEmail: "john.doe@example.com",
    dogName: "Buddy",
    sessionType: "In-Person",
    bookingDate: "2025-01-20",
    bookingTime: "14:30", // HH:mm format (no seconds)
    quote: 75.00,
    notes: "Test session for webhook integration",
    createdAt: new Date().toISOString()
  };

  try {
    console.log('Testing session webhook with data:', testSessionData);

    // Call the Make.com webhook
    const response = await fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSessionData)
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    return NextResponse.json({
      message: 'Test session webhook call completed',
      status: response.status,
      statusText: response.statusText,
      testData: testSessionData,
      makeResponse: result
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      testData: testSessionData
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to run the test'
  }, { status: 405 });
}
