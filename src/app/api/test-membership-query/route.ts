import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Test endpoint to debug membership query
 */
export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query memberships
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('email, date, id')
      .limit(100000);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // Test the deduplication logic
    const testEmail = 'v.a.ward@outlook.com';
    const testDate = '2026-01-22';
    const emailLower = testEmail.toLowerCase();
    
    const existingMembership = memberships?.find(
      m => m.email?.toLowerCase() === emailLower && m.date === testDate
    );

    return NextResponse.json({
      success: true,
      totalMemberships: memberships?.length || 0,
      sampleMemberships: memberships?.slice(0, 5),
      testQuery: {
        email: testEmail,
        date: testDate,
        found: !!existingMembership,
        matchedRecord: existingMembership || null
      },
      recentMemberships: memberships?.filter(m => 
        m.date >= '2026-01-20'
      )
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

