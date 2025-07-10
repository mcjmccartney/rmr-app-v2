import { NextResponse } from 'next/server';

// Test endpoint to manually trigger the 12-day webhook cron job
export async function POST() {
  try {
    console.log('[TEST-CRON] Manually triggering 12-day webhook...');
    
    // Call the actual 12-day webhook endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scheduled-webhooks-12day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log('[TEST-CRON] 12-day webhook result:', result);

    return NextResponse.json({
      success: true,
      message: 'Manually triggered 12-day webhook',
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
    message: 'Test endpoint for 12-day webhook cron job - use POST to trigger',
    timestamp: new Date().toISOString()
  });
}
