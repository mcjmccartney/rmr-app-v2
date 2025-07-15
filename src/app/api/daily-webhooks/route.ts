import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Daily webhook endpoint - triggered by Supabase cron job at 8:00 AM UTC
export async function POST() {
  try {
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
                             (targetDays === 12 || (webhookData.quote !== null && webhookData.quote !== undefined));

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

    // Process 4-day webhooks
    console.log('[DAILY-WEBHOOKS] Processing 4-day webhooks...');
    const fourDayResult = await processWebhooks(
      sessions, 
      clients, 
      4, 
      'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
    );

    // Process 12-day webhooks
    console.log('[DAILY-WEBHOOKS] Processing 12-day webhooks...');
    const twelveDayResult = await processWebhooks(
      sessions, 
      clients, 
      12, 
      'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
    );

    const totalProcessed = fourDayResult.length + twelveDayResult.length;
    const totalSuccess = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'success').length;
    const totalFailure = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'failed' || r.status === 'error').length;

    console.log(`[DAILY-WEBHOOKS] Completed: ${totalProcessed} sessions processed, ${totalSuccess} successful, ${totalFailure} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily webhooks completed: ${totalProcessed} sessions processed`,
      summary: {
        fourDaySessionsProcessed: fourDayResult.length,
        twelveDaySessionsProcessed: twelveDayResult.length,
        totalProcessed,
        successCount: totalSuccess,
        failureCount: totalFailure
      },
      results: {
        fourDayWebhooks: fourDayResult,
        twelveDayWebhooks: twelveDayResult
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

    // Find sessions 12 days away
    const twelveDaySessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      const sessionDate = new Date(session.booking_date);
      const daysUntilSession = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilSession === 12;
    }).map(session => {
      const client = clients.find(c => c.id === session.client_id);
      return {
        sessionId: session.id,
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
        sessionDate: session.booking_date,
        sessionType: session.session_type
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Daily webhook preview',
      currentTime: now.toISOString(),
      sessionsToProcess: {
        fourDaySessions: fourDaySessions,
        twelveDaySessions: twelveDaySessions,
        totalSessions: fourDaySessions.length + twelveDaySessions.length
      },
      instructions: 'Call POST /api/daily-webhooks to process these sessions',
      webhooks: {
        fourDay: 'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7',
        twelveDay: 'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
