import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const executionTime = new Date().toISOString();

  try {
    // Log that the cron job is running
    console.log(`[12-DAY WEBHOOK] Cron job triggered at ${executionTime}`);

    // Log to our tracking endpoint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: '12-day-webhook',
          message: 'Cron job execution started',
          timestamp: executionTime
        })
      });
    } catch (logError) {
      console.warn('[12-DAY WEBHOOK] Failed to log execution:', logError);
    }

    // Create Supabase client with service role key to ensure full database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Log environment check
    console.log(`[12-DAY WEBHOOK] Environment check - Supabase URL exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`[12-DAY WEBHOOK] Environment check - Service role key exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    // Get all sessions directly with service role access
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Get all clients directly with service role access
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Convert database rows to proper format
    const sessions = sessionsData?.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      dogName: row.dog_name,
      sessionType: row.session_type,
      bookingDate: row.booking_date,
      bookingTime: row.booking_time?.substring(0, 5) || '00:00',
      notes: row.notes,
      quote: parseFloat(row.quote || '0'),
      email: row.email,
      sessionPaid: row.session_paid || false,
      paymentConfirmedAt: row.payment_confirmed_at,
      sessionPlanSent: row.session_plan_sent || false,
      questionnaireBypass: row.questionnaire_bypass || false,
      eventId: row.event_id,
      googleMeetLink: row.google_meet_link,
    })) || [];

    const clients = clientsData?.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      dogName: row.dog_name,
      membership: row.membership,
      // Add other client fields as needed
    })) || [];
    
    // Get current date and time
    const now = new Date();
    
    // Find sessions that are exactly 12 days away to trigger the 12-day webhook
    const sessionsToTrigger = sessions.filter(session => {
      // Skip sessions without clients or Group/RMR Live sessions
      if (!session.clientId || session.sessionType === 'Group' || session.sessionType === 'RMR Live') {
        return false;
      }

      // Calculate days until session
      const sessionDate = new Date(session.bookingDate);
      const timeDiff = sessionDate.getTime() - now.getTime();
      const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // We want sessions that are exactly 12 days away
      return daysUntilSession === 12;
    });

    console.log(`[12-DAY WEBHOOK] Found ${sessionsToTrigger.length} sessions exactly 12 days away`);

    if (sessionsToTrigger.length === 0) {
      console.log(`[12-DAY WEBHOOK] No sessions to process today`);
      return NextResponse.json({
        success: true,
        message: 'No sessions found that need 12-day webhooks triggered today',
        sessionsProcessed: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Process each session
    const results = [];
    
    for (const session of sessionsToTrigger) {
      try {
        // Find the client for this session
        const client = clients.find(c => c.id === session.clientId);
        
        if (!client || !client.email) {
          continue;
        }
        
        // Prepare webhook data for 12-day webhook
        const webhookData = {
          sessionId: session.id,
          clientId: session.clientId,
          clientName: `${client.firstName} ${client.lastName}`,
          clientFirstName: client.firstName,
          clientEmail: client.email,
          dogName: session.dogName || client.dogName || 'Unknown Dog',
          sessionType: session.sessionType,
          bookingDate: session.bookingDate,
          bookingTime: session.bookingTime,
          notes: session.notes || '',
          quote: session.quote,
          isMember: client.membership,
          createdAt: new Date().toISOString(),
          daysUntilSession: 12 // Indicate this is the 12-day webhook
        };

        // Comprehensive validation to prevent blank/empty webhook data
        const isValidString = (value: any): boolean => {
          return value && typeof value === 'string' && value.trim().length > 0;
        };

        const isValidEmail = (email: any): boolean => {
          return isValidString(email) && email.includes('@') && email.includes('.') && email.length >= 5;
        };

        // Validate all essential fields with strict checks
        const hasValidData =
          isValidString(webhookData.sessionId) &&
          isValidString(webhookData.clientId) &&
          isValidString(webhookData.clientName) &&
          isValidEmail(webhookData.clientEmail) &&
          isValidString(webhookData.sessionType);

        // Block webhook if any essential data is missing or invalid
        if (!hasValidData) {
          results.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'Missing or invalid essential data',
            webhookData: webhookData
          });
          continue;
        }

        // Trigger the 12-day webhook
        console.log(`[12-DAY WEBHOOK] Triggering webhook for session ${session.id} - ${client.firstName} ${client.lastName}`);

        const response = await fetch('https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        console.log(`[12-DAY WEBHOOK] Webhook response status: ${response.status}`);

        // Check if webhook succeeded
        if (response.ok) {
          results.push({
            sessionId: session.id,
            clientName: `${client.firstName} ${client.lastName}`,
            status: 'success'
          });
        } else {
          results.push({
            sessionId: session.id,
            clientName: `${client.firstName} ${client.lastName}`,
            status: 'failed',
            error: `12-day webhook: ${response.status} ${response.statusText}`
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
    const failureCount = results.length - successCount;

    console.log(`[12-DAY WEBHOOK] Completed processing: ${successCount} success, ${failureCount} failures`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} sessions for 12-day webhook`,
      sessionsProcessed: results.length,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`[12-DAY WEBHOOK] Error occurred:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing and debugging
export async function GET() {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: true });

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

    // Show sessions that are 10-14 days away for debugging
    const upcomingSessions = sessions
      .filter(session => {
        if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
          return false;
        }
        
        const sessionDate = new Date(session.booking_date);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return daysUntilSession >= 10 && daysUntilSession <= 14;
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
          isExactly12Days: daysUntilSession === 12
        };
      });

    return NextResponse.json({
      success: true,
      currentDate: now.toISOString().split('T')[0],
      totalSessions: sessions.length,
      upcomingSessions10to14Days: upcomingSessions,
      sessionsExactly12DaysAway: upcomingSessions.filter(s => s.isExactly12Days)
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
