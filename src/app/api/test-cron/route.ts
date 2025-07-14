import { NextResponse } from 'next/server';

// Simple test endpoint to verify API routing works
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST() {
  try {
    // Test the webhook logic manually
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Simple test - just get session count
    const { data: sessionsData, error } = await supabase
      .from('sessions')
      .select('id, booking_date, session_type')
      .limit(5);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      sessionCount: sessionsData?.length || 0,
      sampleSessions: sessionsData,
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
