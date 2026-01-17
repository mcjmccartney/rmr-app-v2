import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';
import { paymentService } from '@/services/paymentService';
import { Session, Client } from '@/types';

// Daily webhook endpoint - triggered by Supabase cron job at 8:00 AM UTC
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication (for cron jobs)
    if (!verifyWebhookApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[DAILY-WEBHOOKS] Starting daily webhook processing...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all sessions and clients
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const sessions = sessionsData || [];
    const clients = clientsData || [];

    // Process webhooks function
    const processWebhooks = async (sessions: any[], clients: any[], targetDays: number, webhookUrl: string) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to midnight for accurate calendar day comparison
      const results: any[] = [];

      const targetSessions = sessions.filter(session => {
        if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
          return false;
        }

        const sessionDate = new Date(session.booking_date);
        sessionDate.setHours(0, 0, 0, 0); // Reset to midnight for accurate calendar day comparison
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        console.log(`[DAILY-WEBHOOKS] Session ${session.id} on ${session.booking_date}: ${daysUntilSession} days away (target: ${targetDays})`);

        return daysUntilSession === targetDays;
      });

      for (const session of targetSessions) {
        try {
          const client = clients.find((c: any) => c.id === session.client_id);

          if (!client || !client.email) {
            results.push({
              sessionId: session.id,
              status: 'skipped',
              reason: 'No client or email found'
            });
            continue;
          }

          // Convert database format to app format for payment service
          const sessionForPayment: Session = {
            id: session.id,
            clientId: session.client_id,
            dogName: session.dog_name || client.dog_name,
            sessionType: session.session_type,
            bookingDate: session.booking_date,
            bookingTime: session.booking_time,
            quote: session.quote,
            notes: session.notes || '',
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

          const webhookData = {
            sessionId: session.id,
            clientId: session.client_id,
            clientName: `${client.first_name} ${client.last_name}`.trim(),
            clientFirstName: client.first_name,
            clientLastName: client.last_name,
            clientEmail: client.email,
            address: client.address || '',
            dogName: session.dog_name || client.dog_name || '',
            sessionType: session.session_type,
            bookingDate: session.booking_date,
            bookingTime: session.booking_time?.substring(0, 5) || session.booking_time, // Ensure HH:mm format
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
            ...(targetDays === 7 && { sendSessionEmail: true, createCalendarEvent: false })
          };

          // Validate essential data
          const hasValidData = webhookData.clientFirstName &&
                             webhookData.clientLastName &&
                             webhookData.clientEmail &&
                             webhookData.sessionType &&
                             webhookData.bookingDate &&
                             webhookData.bookingTime &&
                             (webhookData.quote !== null && webhookData.quote !== undefined);

          if (!hasValidData) {
            results.push({
              sessionId: session.id,
              status: 'skipped',
              reason: 'Missing or invalid essential data',
              data: webhookData
            });
            continue;
          }

          // For Online sessions with 7-day emails, delete the existing calendar event
          // Make.com will create a new one with Google Meet link
          if (targetDays === 7 && session.session_type === 'Online' && session.event_id) {
            console.log(`[DAILY-WEBHOOKS] Deleting calendar event for Online session ${session.id} (Make will create new one with Meet link)`);

            try {
              const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://rmrcms.vercel.app'}/api/calendar/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: session.event_id })
              });

              if (deleteResponse.ok) {
                console.log(`[DAILY-WEBHOOKS] Calendar event deleted successfully for session ${session.id}`);

                // Clear the eventId from the session in the database
                await supabase
                  .from('sessions')
                  .update({ event_id: null })
                  .eq('id', session.id);

                console.log(`[DAILY-WEBHOOKS] Cleared eventId from session ${session.id}`);
              } else {
                console.error(`[DAILY-WEBHOOKS] Failed to delete calendar event for session ${session.id}:`, deleteResponse.status);
              }
            } catch (deleteError) {
              console.error(`[DAILY-WEBHOOKS] Error deleting calendar event for session ${session.id}:`, deleteError);
              // Continue with webhook even if delete fails
            }
          }

          console.log(`[DAILY-WEBHOOKS] Sending ${targetDays}-day webhook for ${client.first_name} ${client.last_name}`);

          const response = await fetch(webhookUrl, {
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

      return results;
    };

    // Process 7-day webhooks (sessions exactly 7 days away)
    console.log('[DAILY-WEBHOOKS] Processing 7-day webhooks...');
    const sevenDayResult = await processWebhooks(
      sessions,
      clients,
      7, // targetDays = 7
      'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
    );

    // 12-day webhooks are disabled
    console.log('[DAILY-WEBHOOKS] 12-day webhooks disabled');
    const twelveDayResult: any[] = [];

    const totalProcessed = sevenDayResult.length + twelveDayResult.length;
    const totalSuccess = sevenDayResult.filter(r => r.status === 'success').length;
    const totalFailure = sevenDayResult.filter(r => r.status === 'failed' || r.status === 'error').length;

    console.log(`[DAILY-WEBHOOKS] Completed: ${totalProcessed} sessions processed, ${totalSuccess} successful, ${totalFailure} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily webhooks completed: ${totalProcessed} sessions processed`,
      summary: {
        sevenDaySessionsProcessed: sevenDayResult.length,
        twelveDaySessionsProcessed: 0, // Disabled
        totalProcessed,
        successCount: totalSuccess,
        failureCount: totalFailure
      },
      results: {
        sevenDayWebhooks: sevenDayResult,
        twelveDayWebhooks: [] // Disabled
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DAILY-WEBHOOKS] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint to show current sessions that would be processed
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, booking_date, session_type, client_id')
      .order('booking_date', { ascending: false });

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email');

    const sessions = sessionsData || [];
    const clients = clientsData || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to midnight for accurate calendar day comparison

    // Find sessions 7 days away
    const sevenDaySessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      const sessionDate = new Date(session.booking_date);
      sessionDate.setHours(0, 0, 0, 0); // Reset to midnight for accurate calendar day comparison
      const daysUntilSession = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilSession === 7;
    }).map(session => {
      const client = clients.find(c => c.id === session.client_id);
      const sessionDate = new Date(session.booking_date);
      sessionDate.setHours(0, 0, 0, 0);
      const daysUntilSession = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        sessionId: session.id,
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
        sessionDate: session.booking_date,
        sessionType: session.session_type,
        daysUntilSession: daysUntilSession
      };
    });

    // 12-day sessions are disabled
    const twelveDaySessions: any[] = [];

    return NextResponse.json({
      success: true,
      message: 'Daily webhook preview',
      currentTime: now.toISOString(),
      sessionsToProcess: {
        sevenDaySessions: sevenDaySessions,
        twelveDaySessions: [], // Disabled
        totalSessions: sevenDaySessions.length
      },
      instructions: 'Call POST /api/daily-webhooks to process these sessions',
      webhooks: {
        fourDay: 'DISABLED - webhook only triggers on new session creation',
        twelveDay: 'DISABLED - 12-day webhook removed'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
