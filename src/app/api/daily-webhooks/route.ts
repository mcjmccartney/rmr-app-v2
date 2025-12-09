import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

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
      const results: any[] = [];

      const targetSessions = sessions.filter(session => {
        if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
          return false;
        }
        
        const sessionDate = new Date(session.booking_date);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
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

          const webhookData = {
            sessionId: session.id,
            clientId: session.client_id,
            clientFirstName: client.first_name,
            clientLastName: client.last_name,
            clientEmail: client.email,
            sessionType: session.session_type,
            bookingDate: session.booking_date,
            bookingTime: session.booking_time,
            dogName: session.dog_name || client.dog_name,
            quote: session.quote,
            travelExpense: session.travel_expense || null,
            membershipStatus: client.membership,
            ...(targetDays === 4 && { sendSessionEmail: true, createCalendarEvent: false })
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

    // 4-day webhooks are now disabled - webhook only triggers on new session creation
    console.log('[DAILY-WEBHOOKS] 4-day webhooks disabled - webhook only triggers on new session creation');
    const fourDayResult: any[] = [];

    // 12-day webhooks are now disabled
    console.log('[DAILY-WEBHOOKS] 12-day webhooks disabled');
    const twelveDayResult: any[] = [];

    const totalProcessed = fourDayResult.length + twelveDayResult.length;
    const totalSuccess = fourDayResult.filter(r => r.status === 'success').length;
    const totalFailure = fourDayResult.filter(r => r.status === 'failed' || r.status === 'error').length;

    console.log(`[DAILY-WEBHOOKS] Completed: ${totalProcessed} sessions processed, ${totalSuccess} successful, ${totalFailure} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily webhooks completed: ${totalProcessed} sessions processed`,
      summary: {
        fourDaySessionsProcessed: fourDayResult.length,
        twelveDaySessionsProcessed: 0, // Disabled
        totalProcessed,
        successCount: totalSuccess,
        failureCount: totalFailure
      },
      results: {
        fourDayWebhooks: fourDayResult,
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

    // Find sessions 4 days away
    const fourDaySessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      const sessionDate = new Date(session.booking_date);
      const daysUntilSession = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilSession === 4;
    }).map(session => {
      const client = clients.find(c => c.id === session.client_id);
      return {
        sessionId: session.id,
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
        sessionDate: session.booking_date,
        sessionType: session.session_type
      };
    });

    // 12-day sessions are disabled
    const twelveDaySessions: any[] = [];

    return NextResponse.json({
      success: true,
      message: 'Daily webhook preview',
      currentTime: now.toISOString(),
      sessionsToProcess: {
        fourDaySessions: fourDaySessions,
        twelveDaySessions: [], // Disabled
        totalSessions: fourDaySessions.length
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
