import { NextRequest, NextResponse } from 'next/server';
import { membershipExpirationService } from '@/services/membershipExpirationService';

export async function POST(request: NextRequest) {
  try {
    console.log('🕛 Starting daily membership expiration check...');
    
    // Run the membership status update for all clients
    const result = await membershipExpirationService.updateAllClientMembershipStatuses();
    
    console.log(`✅ Daily membership expiration check complete: ${result.updated} clients updated out of ${result.total} total`);
    
    return NextResponse.json({
      success: true,
      message: 'Membership expiration check completed successfully',
      updated: result.updated,
      total: result.total,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error during membership expiration check:', error);
    return NextResponse.json({
      success: false,
      error: 'Membership expiration check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
