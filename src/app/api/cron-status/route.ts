import { NextResponse } from 'next/server';
import { cronScheduler } from '@/lib/cronScheduler';

// GET endpoint to check cron status
export async function GET() {
  try {
    const status = cronScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Built-in cron scheduler status',
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST endpoint to manually trigger the daily webhooks job
export async function POST() {
  try {
    console.log('[CRON-API] Manual trigger requested');
    
    // Import the webhook logic from the scheduler
    const { createClient } = await import('@supabase/supabase-js');
    
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

    // Process webhooks using the same logic as the scheduler
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
    console.log('[CRON-API] Processing 4-day webhooks...');
    const fourDayResult = await processWebhooks(
      sessions, 
      clients, 
      4, 
      'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
    );

    // Process 12-day webhooks
    console.log('[CRON-API] Processing 12-day webhooks...');
    const twelveDayResult = await processWebhooks(
      sessions, 
      clients, 
      12, 
      'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
    );

    const totalProcessed = fourDayResult.length + twelveDayResult.length;
    const totalSuccess = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'success').length;
    const totalFailure = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'failed' || r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Manual webhook trigger completed: ${totalProcessed} sessions processed`,
      fourDaySessionsProcessed: fourDayResult.length,
      twelveDaySessionsProcessed: twelveDayResult.length,
      totalProcessed,
      successCount: totalSuccess,
      failureCount: totalFailure,
      results: {
        fourDayWebhooks: fourDayResult,
        twelveDayWebhooks: twelveDayResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON-API] Manual trigger failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
