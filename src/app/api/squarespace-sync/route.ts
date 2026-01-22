import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

/**
 * Squarespace Order Sync Cron Job
 * 
 * Automatically polls Squarespace API for new orders and creates membership records.
 * Designed to be triggered by a cron job (e.g., hourly or daily).
 * 
 * This endpoint calls the import-historical endpoint with a date filter to only
 * fetch orders from the last 48 hours, ensuring we catch any new membership payments.
 * 
 * Usage: POST /api/squarespace-sync
 * Headers: x-api-key: YOUR_WEBHOOK_API_KEY
 * 
 * Trigger: Supabase cron job or external scheduler
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

    // Calculate date for filtering (last 48 hours to ensure we don't miss anything)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const modifiedAfter = twoDaysAgo.toISOString();

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
    description: 'Automatically polls Squarespace API for new orders from the last 48 hours',
    usage: {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_WEBHOOK_API_KEY'
      }
    },
    schedule: 'Recommended: Run daily at 9:00 AM UTC (1 hour after membership expiration check)',
    endpoint: '/api/squarespace-sync'
  });
}

