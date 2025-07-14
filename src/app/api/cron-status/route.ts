import { NextResponse } from 'next/server';
import { webhookScheduler } from '@/lib/cronScheduler';

// GET endpoint to check webhook scheduler status
export async function GET() {
  try {
    // Check and potentially run daily webhooks
    const checkResult = await webhookScheduler.checkAndRunDaily();
    const status = webhookScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Built-in webhook scheduler status',
      checkResult,
      status,
      webhooks: {
        fourDay: 'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7',
        twelveDay: 'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST endpoint to manually trigger the daily webhooks job
export async function POST() {
  try {
    console.log('[WEBHOOK-API] Manual trigger requested');

    const results = await webhookScheduler.triggerNow();

    return NextResponse.json({
      success: true,
      message: `Manual webhook trigger completed: ${results.totalProcessed} sessions processed`,
      ...results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[WEBHOOK-API] Manual trigger failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
