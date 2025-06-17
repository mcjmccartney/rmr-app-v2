import { NextResponse } from 'next/server';

export async function GET() {
  // Test data that simulates what IFTTT would send from Monzo
  const testIFTTTData = {
    amount: "50.00",
    description: "RMR-Training-5b870203-c2ad-45a0-a362-3176d930b425",
    from: "Test Customer",
    created: new Date().toISOString()
  };

  try {
    console.log('Testing IFTTT webhook with data:', testIFTTTData);

    // Get the base URL for the webhook call
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3001';

    // Call our IFTTT webhook endpoint with test data
    const response = await fetch(`${baseUrl}/api/payment/ifttt-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IFTTT-Test'
      },
      body: JSON.stringify(testIFTTTData)
    });

    const result = await response.json();

    return NextResponse.json({
      message: 'IFTTT webhook test completed',
      status: response.status,
      statusText: response.statusText,
      testData: testIFTTTData,
      webhookResponse: result,
      extractedSessionId: testIFTTTData.description.match(/RMR-[^-]+-(.+)/)?.[1] || 'Could not extract',
      instructions: {
        '1. IFTTT Setup': 'Create applet: Monzo money received → Webhooks',
        '2. Webhook URL': `${baseUrl}/api/payment/ifttt-webhook`,
        '3. Method': 'POST',
        '4. Content Type': 'application/json',
        '5. Body': JSON.stringify({
          amount: '{{MonzoAmount}}',
          description: '{{MonzoDescription}}',
          from: '{{MonzoFrom}}',
          created: '{{MonzoCreated}}'
        }, null, 2)
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      testData: testIFTTTData
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to run the test'
  }, { status: 405 });
}
