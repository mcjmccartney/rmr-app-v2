import { NextResponse } from 'next/server';

export async function GET() {
  // Test data that matches your Make.com format
  const testData = {
    email: "test@example.com",
    date: new Date().toISOString(),
    amount: 25.00
  };

  try {
    // Call our webhook endpoint with test data
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    return NextResponse.json({
      message: 'Test webhook call completed',
      status: response.status,
      testData,
      result
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to run the test'
  }, { status: 405 });
}
