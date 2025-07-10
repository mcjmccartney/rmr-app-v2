import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple logging endpoint to track cron job executions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, message, timestamp } = body;

    console.log(`[CRON-LOG] ${source}: ${message} at ${timestamp}`);

    // Optionally store in database for persistent logging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // You could create a cron_logs table to store these logs
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      logged: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON-LOG] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Logging failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cron logging endpoint - POST only',
    timestamp: new Date().toISOString()
  });
}
