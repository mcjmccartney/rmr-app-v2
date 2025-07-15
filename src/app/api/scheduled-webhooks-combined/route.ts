import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function processWebhooks(sessions: any[], clients: any[], targetDays: number, webhookUrl: string) {
  const now = new Date();
  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  const targetSessions = sessions.filter(session => {
    // Skip sessions without client_id
    if (!session.client_id) {
      console.log(`[SESSION-FILTER] Skipping session ${session.id} - no client_id`);
      return false;
    }

    // Skip Group and RMR Live sessions
    if (session.session_type === 'Group' || session.session_type === 'RMR Live') {
      console.log(`[SESSION-FILTER] Skipping session ${session.id} - session type: ${session.session_type}`);
      return false;
    }

    // Check if session is exactly targetDays away
    const sessionDate = new Date(session.booking_date);
    const timeDiff = sessionDate.getTime() - now.getTime();
    const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const isTargetDay = daysUntilSession === targetDays;
    if (isTargetDay) {
      console.log(`[SESSION-FILTER] Including session ${session.id} - ${daysUntilSession} days away (target: ${targetDays})`);
    }

    return isTargetDay;
  });

  console.log(`[WEBHOOK-PROCESSING] Found ${targetSessions.length} sessions exactly ${targetDays} days away`);

  for (const session of targetSessions) {
    try {
      const client = clients.find((c: any) => c.id === session.client_id);

      if (!client) {
        console.log(`[CLIENT-VALIDATION] BLOCKED - No client found for session ${session.id} with client_id: ${session.client_id}`);
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'Client not found'
        });
        continue;
      }

      if (!client.email || client.email.trim() === '') {
        console.log(`[CLIENT-VALIDATION] BLOCKED - No email for client ${client.id} (${client.first_name} ${client.last_name})`);
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'Client has no email'
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
        dogName: session.dog_name,
        quote: session.quote,
        membershipStatus: client.membership,
        ...(targetDays === 4 && { sendSessionEmail: true, createCalendarEvent: false })
      };

      // Enhanced validation - check for both null/undefined AND empty strings
      const isValidString = (value: any) => value !== null && value !== undefined && value !== '' && String(value).trim() !== '';

      const hasValidData = isValidString(webhookData.clientFirstName) &&
                         isValidString(webhookData.clientLastName) &&
                         isValidString(webhookData.clientEmail) &&
                         isValidString(webhookData.sessionType) &&
                         isValidString(webhookData.bookingDate) &&
                         isValidString(webhookData.bookingTime) &&
                         (targetDays === 12 || (webhookData.quote !== null && webhookData.quote !== undefined));

      if (!hasValidData) {
        console.log(`[WEBHOOK-VALIDATION] BLOCKED - Invalid data for session ${session.id}:`, {
          clientFirstName: webhookData.clientFirstName,
          clientLastName: webhookData.clientLastName,
          clientEmail: webhookData.clientEmail,
          sessionType: webhookData.sessionType,
          bookingDate: webhookData.bookingDate,
          bookingTime: webhookData.bookingTime,
          quote: webhookData.quote,
          targetDays
        });
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'Missing or invalid essential data',
          invalidFields: {
            clientFirstName: !isValidString(webhookData.clientFirstName),
            clientLastName: !isValidString(webhookData.clientLastName),
            clientEmail: !isValidString(webhookData.clientEmail),
            sessionType: !isValidString(webhookData.sessionType),
            bookingDate: !isValidString(webhookData.bookingDate),
            bookingTime: !isValidString(webhookData.bookingTime),
            quote: targetDays === 4 && (webhookData.quote === null || webhookData.quote === undefined)
          }
        });
        continue;
      }

      console.log(`[WEBHOOK-VALIDATION] VALID - Sending webhook for session ${session.id} (${client.first_name} ${client.last_name})`);

      // Additional safety check - ensure no empty object is being sent
      const webhookDataString = JSON.stringify(webhookData);
      if (webhookDataString === '{}' || webhookDataString.length < 50) {
        console.log(`[WEBHOOK-VALIDATION] BLOCKED - Webhook data too small/empty for session ${session.id}:`, webhookDataString);
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'Webhook data too small or empty'
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

    // 4-day webhooks are now disabled - webhook only triggers on new session creation
    console.log('[COMBINED WEBHOOKS] 4-day webhooks disabled - webhook only triggers on new session creation');
    const fourDayResult = {
      results: [],
      successCount: 0,
      failureCount: 0
    };

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
