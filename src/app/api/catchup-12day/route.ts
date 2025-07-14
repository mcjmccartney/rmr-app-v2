import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Special one-time catch-up endpoint for 12-day webhooks from past dates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetDate } = body; // Date to check from (e.g., "2025-07-11")
    
    if (!targetDate) {
      return NextResponse.json({
        success: false,
        error: 'targetDate is required (format: YYYY-MM-DD)'
      }, { status: 400 });
    }

    console.log(`[CATCHUP-12DAY] Processing 12-day webhooks from ${targetDate}`);
    
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

    // Calculate sessions that were exactly 12 days away from the target date
    const targetDateObj = new Date(targetDate);
    const results: any[] = [];

    const targetSessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      
      const sessionDate = new Date(session.booking_date);
      const timeDiff = sessionDate.getTime() - targetDateObj.getTime();
      const daysFromTargetDate = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysFromTargetDate === 12;
    });

    console.log(`[CATCHUP-12DAY] Found ${targetSessions.length} sessions that were 12 days away from ${targetDate}`);

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
          quote: session.quote
        };

        // Enhanced validation
        const isValidString = (value: any) => value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
        
        const hasValidData = isValidString(webhookData.clientFirstName) &&
                           isValidString(webhookData.clientLastName) &&
                           isValidString(webhookData.clientEmail) &&
                           isValidString(webhookData.sessionType) &&
                           isValidString(webhookData.bookingDate) &&
                           isValidString(webhookData.bookingTime);

        if (!hasValidData) {
          console.log(`[CATCHUP-12DAY] BLOCKED - Invalid data for session ${session.id}`);
          results.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'Missing or invalid essential data'
          });
          continue;
        }

        console.log(`[CATCHUP-12DAY] Sending 12-day webhook for ${client.first_name} ${client.last_name} (session on ${session.booking_date})`);
        
        const response = await fetch('https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y', {
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
      message: `Catch-up 12-day webhooks from ${targetDate}: ${results.length} sessions processed`,
      targetDate,
      totalProcessed: results.length,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CATCHUP-12DAY] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint to show what sessions would be processed for a given date
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetDate = url.searchParams.get('date') || '2025-07-11';
    
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
    const targetDateObj = new Date(targetDate);

    const targetSessions = sessions.filter(session => {
      if (!session.client_id || session.session_type === 'Group' || session.session_type === 'RMR Live') {
        return false;
      }
      const sessionDate = new Date(session.booking_date);
      const daysFromTargetDate = Math.ceil((sessionDate.getTime() - targetDateObj.getTime()) / (1000 * 60 * 60 * 24));
      return daysFromTargetDate === 12;
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
      message: `Sessions that were 12 days away from ${targetDate}`,
      targetDate,
      sessionsFound: targetSessions.length,
      sessions: targetSessions,
      instructions: `Call POST /api/catchup-12day with {"targetDate": "${targetDate}"} to process these sessions`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
