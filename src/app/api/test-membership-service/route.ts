import { NextRequest, NextResponse } from 'next/server';
import { membershipService } from '@/services/membershipService';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing membershipService.getAll()');

    const memberships = await membershipService.getAll();
    
    return NextResponse.json({
      message: 'Membership service test completed successfully',
      membershipCount: memberships.length,
      memberships: memberships.slice(0, 3), // Show first 3 for debugging
      success: true
    });

  } catch (error) {
    console.error('Error testing membership service:', error);
    return NextResponse.json({
      error: 'Membership service test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
