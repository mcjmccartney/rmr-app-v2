import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/services/sessionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    
    console.log('Payment confirmation redirect received:', {
      sessionId,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    if (!sessionId) {
      console.error('No session ID provided in redirect');
      return NextResponse.redirect(new URL('/payment-error?reason=missing-id', request.url));
    }

    // Validate session ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      console.error('Invalid session ID format:', sessionId);
      return NextResponse.redirect(new URL('/payment-error?reason=invalid-id', request.url));
    }

    // Check if session exists
    const session = await sessionService.getById(sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return NextResponse.redirect(new URL('/payment-error?reason=session-not-found', request.url));
    }

    // Check if already paid
    if (session.sessionPaid) {
      console.log('Session already paid, redirecting to confirmation:', sessionId);
      return NextResponse.redirect(new URL(`/payment-confirmed/${sessionId}`, request.url));
    }

    // Mark session as paid
    try {
      await sessionService.markAsPaid(sessionId);
      console.log('Session marked as paid successfully:', sessionId);
      
      // Redirect to confirmation page
      return NextResponse.redirect(new URL(`/payment-confirmed/${sessionId}`, request.url));
      
    } catch (paymentError) {
      console.error('Error marking session as paid:', paymentError);
      
      // Try fallback method with direct database update
      try {
        const { supabase } = await import('@/lib/supabase');
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ session_paid: true })
          .eq('id', sessionId);
          
        if (updateError) {
          throw updateError;
        }
        
        console.log('Session marked as paid via fallback method:', sessionId);
        return NextResponse.redirect(new URL(`/payment-confirmed/${sessionId}`, request.url));
        
      } catch (fallbackError) {
        console.error('Fallback payment marking failed:', fallbackError);
        return NextResponse.redirect(new URL(`/payment-error?reason=update-failed&id=${sessionId}`, request.url));
      }
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.redirect(new URL('/payment-error?reason=server-error', request.url));
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { message: 'Method not allowed - use GET' },
    { status: 405 }
  );
}
