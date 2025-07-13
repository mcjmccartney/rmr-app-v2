import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const executionTime = new Date().toISOString();
  
  try {
    console.log(`[COMBINED WEBHOOKS] Cron job triggered at ${executionTime}`);

    // Log to our tracking endpoint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'combined-webhooks',
          message: 'Combined cron job execution started',
          timestamp: executionTime
        })
      });
    } catch (logError) {
      console.warn('[COMBINED WEBHOOKS] Failed to log execution:', logError);
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Get all clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const sessions = sessionsData || [];
    const clients = clientsData || [];
    const now = new Date();

    // Process both 4-day and 12-day webhooks
    const results = {
      fourDayWebhooks: [],
      twelveDayWebhooks: [],
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0
    };

    // **JOB 1: 4-DAY WEBHOOKS (Original scheduled-webhooks logic)**
    console.log('[COMBINED WEBHOOKS] Processing 4-day webhooks...');
    
    const fourDaySessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      
      const sessionDate = new Date(session.booking_date);
      const timeDiff = sessionDate.getTime() - now.getTime();
      const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysUntilSession === 4;
    });

    for (const session of fourDaySessions) {
      try {
        const client = clients.find(c => c.id === session.client_id);
        
        if (!client || !client.email) {
          continue;
        }

        // Prepare webhook data (same as original logic)
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
          sendSessionEmail: true,
          createCalendarEvent: false
        };

        // Validate essential data
        const hasValidData = webhookData.clientFirstName && 
                           webhookData.clientLastName && 
                           webhookData.clientEmail && 
                           webhookData.sessionType && 
                           webhookData.bookingDate && 
                           webhookData.bookingTime &&
                           webhookData.quote !== null && 
                           webhookData.quote !== undefined;

        if (!hasValidData) {
          results.fourDayWebhooks.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'Missing or invalid essential data'
          });
          continue;
        }

        // Trigger 4-day webhook
        const response = await fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          results.fourDayWebhooks.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            status: 'success'
          });
          results.successCount++;
        } else {
          results.fourDayWebhooks.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            status: 'failed',
            error: `${response.status} ${response.statusText}`
          });
          results.failureCount++;
        }
        
      } catch (error) {
        results.fourDayWebhooks.push({
          sessionId: session.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.failureCount++;
      }
    }

    // **JOB 2: 12-DAY WEBHOOKS (Original scheduled-webhooks-12day logic)**
    console.log('[COMBINED WEBHOOKS] Processing 12-day webhooks...');
    
    const twelveDaySessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      
      const sessionDate = new Date(session.booking_date);
      const timeDiff = sessionDate.getTime() - now.getTime();
      const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysUntilSession === 12;
    });

    for (const session of twelveDaySessions) {
      try {
        const client = clients.find(c => c.id === session.client_id);
        
        if (!client || !client.email) {
          continue;
        }

        // Prepare webhook data (same as original 12-day logic)
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
          quote: session.quote
        };

        // Validate essential data
        const hasValidData = webhookData.clientFirstName && 
                           webhookData.clientLastName && 
                           webhookData.clientEmail && 
                           webhookData.sessionType && 
                           webhookData.bookingDate && 
                           webhookData.bookingTime;

        if (!hasValidData) {
          results.twelveDayWebhooks.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'Missing or invalid essential data'
          });
          continue;
        }

        // Trigger 12-day webhook
        const response = await fetch('https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          results.twelveDayWebhooks.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            status: 'success'
          });
          results.successCount++;
        } else {
          results.twelveDayWebhooks.push({
            sessionId: session.id,
            clientName: `${client.first_name} ${client.last_name}`,
            status: 'failed',
            error: `${response.status} ${response.statusText}`
          });
          results.failureCount++;
        }
        
      } catch (error) {
        results.twelveDayWebhooks.push({
          sessionId: session.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.failureCount++;
      }
    }

    results.totalProcessed = results.fourDayWebhooks.length + results.twelveDayWebhooks.length;

    console.log(`[COMBINED WEBHOOKS] Completed: ${results.totalProcessed} total, ${results.successCount} success, ${results.failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Combined webhooks processed: ${results.totalProcessed} sessions`,
      executionTime,
      fourDaySessionsProcessed: results.fourDayWebhooks.length,
      twelveDaySessionsProcessed: results.twelveDayWebhooks.length,
      totalProcessed: results.totalProcessed,
      successCount: results.successCount,
      failureCount: results.failureCount,
      results
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

    // Debug info for both 4-day and 12-day sessions
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
        const client = clients.find(c => c.id === session.client_id);
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
