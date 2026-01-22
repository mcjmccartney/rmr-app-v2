import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

/**
 * Squarespace Order Sync Cron Job
 *
 * Automatically polls Squarespace API for new orders and creates membership records.
 * Designed to run once daily at 8:00 AM UTC.
 *
 * This endpoint fetches orders from the last 24 hours only, preventing duplicates
 * by ensuring each order is only processed once (no overlap between runs).
 *
 * Usage: POST /api/squarespace-sync
 * Headers: x-api-key: YOUR_WEBHOOK_API_KEY
 *
 * Schedule: Daily at 8:00 AM UTC (via daily-webhooks cron)
 */

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication (for cron jobs)
    if (!verifyWebhookApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SQUARESPACE-SYNC] Starting automated Squarespace order sync...');

    // Calculate date for filtering (last 24 hours)
    // This runs daily at 8:00 AM UTC, so we fetch orders from yesterday's 8:00 AM to now
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const modifiedAfter = oneDayAgo.toISOString();

    console.log(`[SQUARESPACE-SYNC] Fetching orders modified after: ${modifiedAfter}`);

    // Get the webhook API key from environment
    const webhookApiKey = process.env.WEBHOOK_API_KEY;
    if (!webhookApiKey) {
      console.error('[SQUARESPACE-SYNC] WEBHOOK_API_KEY not configured');
      return NextResponse.json(
        { error: 'WEBHOOK_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Call the import-historical endpoint with date filter
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rmrcms.vercel.app';
    const importUrl = `${baseUrl}/api/squarespace/import-historical?modifiedAfter=${encodeURIComponent(modifiedAfter)}`;

    console.log(`[SQUARESPACE-SYNC] Calling import endpoint: ${importUrl}`);

    const response = await fetch(importUrl, {
      method: 'POST',
      headers: {
        'x-api-key': webhookApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SQUARESPACE-SYNC] Import failed:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Import failed',
          status: response.status,
          details: errorText
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    console.log('[SQUARESPACE-SYNC] Import completed:', {
      totalOrders: result.stats?.totalOrders || 0,
      clientsCreated: result.stats?.clientsActuallyCreated || 0,
      membershipsCreated: result.stats?.membershipsActuallyCreated || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Squarespace order sync completed',
      timestamp: new Date().toISOString(),
      dateFilter: modifiedAfter,
      result: {
        totalOrders: result.stats?.totalOrders || 0,
        clientsCreated: result.stats?.clientsActuallyCreated || 0,
        membershipsCreated: result.stats?.membershipsActuallyCreated || 0,
        clientsAlreadyExist: result.stats?.clientsAlreadyExist || 0,
        membershipsAlreadyExist: result.stats?.membershipsAlreadyExist || 0,
        errors: result.stats?.errors || 0
      }
    });

  } catch (error) {
    console.error('[SQUARESPACE-SYNC] Sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for status/help
export async function GET() {
  return NextResponse.json({
    message: 'Squarespace Order Sync Cron Job',
    description: 'Automatically polls Squarespace API for new orders from the last 24 hours',
    usage: {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_WEBHOOK_API_KEY'
      }
    },
    schedule: 'Runs daily at 8:00 AM UTC (integrated into daily-webhooks cron)',
    dateRange: 'Fetches orders from last 24 hours to prevent duplicates',
    endpoint: '/api/squarespace-sync'
  });
}

