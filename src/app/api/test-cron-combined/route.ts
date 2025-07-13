import { NextResponse } from 'next/server';

// Test endpoint to manually trigger the combined webhook cron job
export async function POST() {
  try {
    console.log('[TEST-CRON] Manually triggering combined webhook...');
    
    // Call the actual combined webhook endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scheduled-webhooks-combined`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log('[TEST-CRON] Combined webhook result:', result);

    return NextResponse.json({
      success: true,
      message: 'Manually triggered combined webhook (4-day + 12-day)',
      webhookResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TEST-CRON] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint for combined webhook cron job - use POST to trigger',
    description: 'This will trigger both 4-day and 12-day webhooks in a single job',
    timestamp: new Date().toISOString()
  });
}
