import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';
import { paymentService } from '@/services/paymentService';
import { Session, Client } from '@/types';

// Manual webhook trigger for specific sessions or dates
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication
    if (!verifyWebhookApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionIds, date } = body;

    if (!sessionIds && !date) {
      return NextResponse.json(
        { error: 'Either sessionIds (array) or date (YYYY-MM-DD) is required' },
        { status: 400 }
      );
    }

    console.log('[MANUAL-WEBHOOK] Starting manual webhook trigger...');
    console.log('[MANUAL-WEBHOOK] Session IDs:', sessionIds);
    console.log('[MANUAL-WEBHOOK] Date:', date);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query based on input
    let query = supabase
      .from('sessions')
      .select('*');

    if (sessionIds && Array.isArray(sessionIds)) {
      query = query.in('id', sessionIds);
    } else if (date) {
      query = query.eq('booking_date', date);
    }

    const { data: sessionsData, error: sessionsError } = await query;

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    const sessions = sessionsData || [];

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions found matching criteria',
        sessionsProcessed: 0
      });
    }

    // Get all clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const clients = clientsData || [];
    const results = [];

    // Process each session
    for (const session of sessions) {
      try {
        // Skip Group and RMR Live sessions
        if (session.session_type === 'Group' || session.session_type === 'RMR Live') {
          console.log(`[MANUAL-WEBHOOK] Skipping ${session.session_type} session ${session.id}`);
          results.push({
            sessionId: session.id,
            status: 'skipped',
            reason: `${session.session_type} sessions are not supported`
          });
          continue;
        }

        // Skip sessions without client
        if (!session.client_id) {
          console.log(`[MANUAL-WEBHOOK] Skipping session ${session.id} - no client`);
          results.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'No client assigned'
          });
          continue;
        }

        const client = clients.find(c => c.id === session.client_id);
        if (!client) {
          console.log(`[MANUAL-WEBHOOK] Client not found for session ${session.id}`);
          results.push({
            sessionId: session.id,
            status: 'error',
            error: 'Client not found'
          });
          continue;
        }

        // Convert database row to Session type for payment link generation
        const sessionForPayment: Session = {
          id: session.id,
          clientId: session.client_id,
          sessionType: session.session_type,
          bookingDate: session.booking_date,
          bookingTime: session.booking_time,
          dogName: session.dog_name || client.dog_name || '',
          notes: session.notes || '',
          quote: session.quote,
          eventId: session.event_id || null,
          googleMeetLink: session.google_meet_link || null,
          travelExpense: session.travel_expense || null,
          sessionNumber: session.session_number || 1,
          sessionPaid: session.session_paid || false,
          createdAt: session.created_at
        } as Session;

        const clientForPayment: Client = {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          phone: client.phone || '',
          address: client.address || '',
          dogName: client.dog_name || '',
          membership: client.membership || false,
          active: client.active !== false
        } as Client;

        // Generate payment link
        const paymentLink = paymentService.generatePaymentLink(sessionForPayment, clientForPayment);

        // Prepare webhook data (matching the 7-day webhook structure)
        const webhookData = {
          sessionId: session.id,
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`.trim(),
          clientFirstName: client.first_name,
          clientLastName: client.last_name,
          clientEmail: client.email,
          address: client.address || '',
          dogName: session.dog_name || client.dog_name || '',
          sessionType: session.session_type,
          bookingDate: session.booking_date,
          bookingTime: session.booking_time?.substring(0, 5) || session.booking_time,
          quote: session.quote,
          notes: session.notes || '',
          travelExpense: session.travel_expense || null,
          membershipStatus: client.membership,
          createdAt: new Date().toISOString(),
          // Form URLs with email prefilled
          bookingTermsUrl: `https://rmrcms.vercel.app/booking-terms?email=${encodeURIComponent(client.email)}`,
          questionnaireUrl: `https://rmrcms.vercel.app/behaviour-questionnaire?email=${encodeURIComponent(client.email)}`,
          // Payment link - dynamically generated based on session type, membership, session number, and travel zone
          paymentLink: paymentLink,
          // Google Meet link for Online sessions
          googleMeetLink: session.google_meet_link || null,
          // Webhook control flags
          sendSessionEmail: true,
          createCalendarEvent: false,
          isManualTrigger: true
        };

        console.log(`[MANUAL-WEBHOOK] Sending webhook for ${client.first_name} ${client.last_name} - ${session.booking_date} ${session.booking_time}`);

        const response = await fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          results.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            sessionDate: session.booking_date,
            sessionTime: session.booking_time,
            status: 'success'
          });
        } else {
          results.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            status: 'failed',
            error: `${response.status} ${response.statusText}`
          });
        }
      } catch (error) {
        results.push({
          sessionId: session.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed' || r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Manual webhooks completed: ${successCount} sent, ${failureCount} failed`,
      summary: {
        totalProcessed: results.length,
        successCount,
        failureCount
      },
      results
    });

  } catch (error) {
    console.error('[MANUAL-WEBHOOK] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

