import { NextResponse } from 'next/server';
import { sessionService } from '@/services/sessionService';
import { clientService } from '@/services/clientService';

export async function POST() {
  try {
    console.log('🕙 Running scheduled webhook check at 10:00am');
    
    // Get all sessions
    const sessions = await sessionService.getAll();
    const clients = await clientService.getAll();
    
    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find sessions that are exactly 4 days away for booking terms email reminders
    const sessionsToTrigger = sessions.filter(session => {
      // Skip sessions without clients or Group/RMR Live sessions
      if (!session.clientId || session.sessionType === 'Group' || session.sessionType === 'RMR Live') {
        return false;
      }

      // Calculate days until session
      const sessionDate = new Date(session.bookingDate);
      const timeDiff = sessionDate.getTime() - now.getTime();
      const daysUntilSession = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // We want sessions that are exactly 4 days away for booking terms reminders
      return daysUntilSession === 4;
    });

    console.log(`Found ${sessionsToTrigger.length} sessions that are exactly 4 days away and need booking terms reminders`);
    
    if (sessionsToTrigger.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions found that need booking terms reminders today',
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
          console.log(`Skipping session ${session.id} - no client or email found`);
          continue;
        }
        
        // Prepare webhook data (same format as the regular session webhook)
        const webhookData = {
          sessionId: session.id,
          clientId: session.clientId,
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email,
          dogName: session.dogName || client.dogName || 'Unknown Dog',
          sessionType: session.sessionType,
          bookingDate: session.bookingDate,
          bookingTime: session.bookingTime,
          notes: session.notes || '',
          quote: session.quote,
          createdAt: new Date().toISOString(),
          sendSessionEmail: true // Force email sending for scheduled webhooks
        };
        
        console.log(`Triggering scheduled booking terms webhook for session ${session.id}:`, webhookData);

        // Trigger the booking terms webhook for sessions that are 4 days away
        const response = await fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
          console.log(`✅ Successfully triggered scheduled booking terms webhook for session ${session.id}`);
          results.push({
            sessionId: session.id,
            clientName: `${client.firstName} ${client.lastName}`,
            status: 'success'
          });
        } else {
          console.error(`❌ Failed to trigger scheduled booking terms webhook for session ${session.id}:`, response.status, response.statusText);
          results.push({
            sessionId: session.id,
            clientName: `${client.firstName} ${client.lastName}`,
            status: 'failed',
            error: `${response.status} ${response.statusText}`
          });
        }
        
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        results.push({
          sessionId: session.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.length - successCount;
    
    console.log(`🎯 Scheduled webhook processing complete: ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} sessions`,
      sessionsProcessed: results.length,
      successCount,
      failureCount,
      results
    });
    
  } catch (error) {
    console.error('Error in scheduled webhook processing:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for testing/manual triggering
export async function GET() {
  console.log('Manual trigger of scheduled webhooks');
  return POST();
}
