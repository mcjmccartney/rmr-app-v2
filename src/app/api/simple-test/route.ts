import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    url: request.url
  });
}
