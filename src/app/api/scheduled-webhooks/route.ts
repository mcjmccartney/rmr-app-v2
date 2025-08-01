import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Create Supabase client with service role key to ensure full database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find sessions that are exactly 4 days away to trigger both webhooks
    // These are sessions that were >4 days away when created (so no webhooks were triggered)
    // and now need both booking terms and session webhooks triggered
    const sessionsToTrigger = sessions.filter(session => {
      // Skip sessions without clients or Group/RMR Live sessions
      if (!session.clientId || session.sessionType === 'Group' || session.sessionType === 'RMR Live') {
        return false;
      }

      // Calculate days until session
      const sessionDate = new Date(session.bookingDate);
      const timeDiff = sessionDate.getTime() - now.getTime();
      const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // We want sessions that are exactly 4 days away to trigger both webhooks
      return daysUntilSession === 4;
    });

    if (sessionsToTrigger.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions found that need webhooks triggered today',
        sessionsProcessed: 0
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
        
        // Prepare webhook data (same format as the regular session webhook)
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
          sendSessionEmail: true // Force email sending for scheduled webhooks
        };

        // Comprehensive validation to prevent blank/empty webhook data
        const isValidString = (value: any): boolean => {
          return value && typeof value === 'string' && value.trim().length > 0;
        };

        const isValidEmail = (email: any): boolean => {
          return isValidString(email) && email.includes('@') && email.includes('.') && email.length >= 5;
        };

        // Validate all essential fields with strict checks (removed booking date, time, and quote validations)
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

        // Scheduled webhooks are now disabled - webhook only triggers on new session creation
        console.log(`[SCHEDULED-WEBHOOKS] Webhook disabled for session ${session.id} - webhook only triggers on new session creation`);

        results.push({
          sessionId: session.id,
          clientName: `${client.firstName} ${client.lastName}`,
          status: 'disabled',
          message: 'Webhook only triggers on new session creation'
        });
        
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

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} sessions`,
      sessionsProcessed: results.length,
      successCount,
      failureCount,
      results
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



// GET endpoint for debug info only
export async function GET() {
  try {
    // Create Supabase client with service role key to ensure full database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      // Add other client fields as needed
    })) || [];

    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Calculate days until each session for debugging
    const sessionDebugInfo = sessions
      .filter(session => session.clientId && session.sessionType !== 'Group' && session.sessionType !== 'RMR Live')
      .map(session => {
        const sessionDate = new Date(session.bookingDate);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        const client = clients.find(c => c.id === session.clientId);

        return {
          sessionId: session.id,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
          sessionType: session.sessionType,
          bookingDate: session.bookingDate,
          bookingTime: session.bookingTime,
          daysUntilSession,
          isExactly4Days: daysUntilSession === 4
        };
      })
      .sort((a, b) => a.daysUntilSession - b.daysUntilSession);

    // Also run the actual webhook logic
    const webhookResult = await POST();
    const webhookData = await webhookResult.json();

    return NextResponse.json({
      debug: true,
      currentDate,
      totalSessions: sessions.length,
      eligibleSessions: sessionDebugInfo.length,
      sessionsExactly4DaysAway: sessionDebugInfo.filter(s => s.isExactly4Days).length,
      upcomingSessions: sessionDebugInfo.filter(s => s.daysUntilSession > 0 && s.daysUntilSession <= 10), // Show sessions 1-10 days away
      webhookResult: webhookData
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
