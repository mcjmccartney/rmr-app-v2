import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function processWebhooks(sessions: any[], clients: any[], targetDays: number, webhookUrl: string) {
  const now = new Date();
  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

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
        dogName: session.dog_name,
        quote: session.quote,
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
          reason: 'Missing or invalid essential data'
        });
        continue;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        results.push({
          sessionId: session.id,
          clientName: `${client.first_name} ${client.last_name}`,
          status: 'success'
        });
        successCount++;
      } else {
        results.push({
          sessionId: session.id,
          clientName: `${client.first_name} ${client.last_name}`,
          status: 'failed',
          error: `${response.status} ${response.statusText}`
        });
        failureCount++;
      }

    } catch (error) {
      results.push({
        sessionId: session.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failureCount++;
    }
  }

  return { results, successCount, failureCount };
}

export async function POST() {
  const executionTime = new Date().toISOString();

  try {
    console.log(`[COMBINED WEBHOOKS] Cron job triggered at ${executionTime}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Process 4-day webhooks
    console.log('[COMBINED WEBHOOKS] Processing 4-day webhooks...');
    const fourDayResult = await processWebhooks(
      sessions,
      clients,
      4,
      'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
    );

    // Process 12-day webhooks
    console.log('[COMBINED WEBHOOKS] Processing 12-day webhooks...');
    const twelveDayResult = await processWebhooks(
      sessions,
      clients,
      12,
      'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
    );

    const totalProcessed = fourDayResult.results.length + twelveDayResult.results.length;
    const totalSuccess = fourDayResult.successCount + twelveDayResult.successCount;
    const totalFailure = fourDayResult.failureCount + twelveDayResult.failureCount;

    console.log(`[COMBINED WEBHOOKS] Completed: ${totalProcessed} total, ${totalSuccess} success, ${totalFailure} failed`);

    return NextResponse.json({
      success: true,
      message: `Combined webhooks processed: ${totalProcessed} sessions`,
      executionTime,
      fourDaySessionsProcessed: fourDayResult.results.length,
      twelveDaySessionsProcessed: twelveDayResult.results.length,
      totalProcessed,
      successCount: totalSuccess,
      failureCount: totalFailure,
      results: {
        fourDayWebhooks: fourDayResult.results,
        twelveDayWebhooks: twelveDayResult.results
      }
    });

  } catch (error) {
    console.error('[COMBINED WEBHOOKS] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    }, { status: 500 });
  }
}

// GET endpoint for debug info
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: false });

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*');

    const sessions = sessionsData || [];
    const clients = clientsData || [];
    const now = new Date();

    const upcomingSessions = sessions
      .filter(session => {
        if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
          return false;
        }

        const sessionDate = new Date(session.booking_date);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        return daysUntilSession >= 1 && daysUntilSession <= 15;
      })
      .map(session => {
        const client = clients.find((c: any) => c.id === session.client_id);
        const sessionDate = new Date(session.booking_date);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        return {
          sessionId: session.id,
          clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown Client',
          sessionType: session.session_type,
          bookingDate: session.booking_date,
          bookingTime: session.booking_time,
          daysUntilSession,
          isExactly4Days: daysUntilSession === 4,
          isExactly12Days: daysUntilSession === 12
        };
      })
      .sort((a, b) => a.daysUntilSession - b.daysUntilSession);

    return NextResponse.json({
      debug: true,
      currentDate: now.toISOString().split('T')[0],
      totalSessions: sessions.length,
      upcomingSessions1to15Days: upcomingSessions,
      sessionsExactly4DaysAway: upcomingSessions.filter(s => s.isExactly4Days),
      sessionsExactly12DaysAway: upcomingSessions.filter(s => s.isExactly12Days)
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
