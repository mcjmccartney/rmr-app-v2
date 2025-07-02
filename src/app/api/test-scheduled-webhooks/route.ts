import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing scheduled webhooks endpoint');
    
    // Call the scheduled webhooks endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/scheduled-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      message: 'Test of scheduled webhooks completed',
      status: response.status,
      result
    });
    
  } catch (error) {
    console.error('Error testing scheduled webhooks:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
