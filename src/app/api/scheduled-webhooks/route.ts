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

    console.log(`Found ${sessionsToTrigger.length} sessions that are exactly 4 days away and need both webhooks triggered`);
    
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

        // Validate essential data before triggering webhooks
        const hasEssentialData = webhookData.sessionId &&
                                webhookData.clientEmail &&
                                webhookData.sessionType &&
                                webhookData.bookingDate &&
                                webhookData.bookingTime;

        // Additional validation to prevent empty/invalid payloads
        const hasValidData = webhookData.sessionId?.trim() &&
                            webhookData.clientEmail?.trim() &&
                            webhookData.sessionType?.trim() &&
                            webhookData.bookingDate?.trim() &&
                            webhookData.bookingTime?.trim() &&
                            webhookData.clientEmail.includes('@'); // Basic email validation

        if (!hasEssentialData || !hasValidData) {
          console.log(`❌ Skipping scheduled webhooks for session ${session.id} - missing or invalid essential data:`, {
            hasSessionId: !!webhookData.sessionId,
            hasClientEmail: !!webhookData.clientEmail,
            hasSessionType: !!webhookData.sessionType,
            hasBookingDate: !!webhookData.bookingDate,
            hasBookingTime: !!webhookData.bookingTime,
            validSessionId: !!webhookData.sessionId?.trim(),
            validClientEmail: !!webhookData.clientEmail?.trim() && webhookData.clientEmail.includes('@'),
            validSessionType: !!webhookData.sessionType?.trim(),
            validBookingDate: !!webhookData.bookingDate?.trim(),
            validBookingTime: !!webhookData.bookingTime?.trim(),
            quote: webhookData.quote
          });

          results.push({
            sessionId: session.id,
            status: 'skipped',
            reason: 'Missing or invalid essential data',
            webhookData: webhookData
          });
          continue;
        }

        console.log(`✅ Triggering both scheduled webhooks for session ${session.id}:`, webhookData);

        // Prepare both webhook promises for sessions that are exactly 4 days away
        const webhookPromises: Promise<Response>[] = [];
        const webhookNames: string[] = [];

        // Only trigger booking terms webhook if we have valid data
        if (webhookData.sessionId && webhookData.clientEmail && webhookData.sessionType &&
            webhookData.bookingDate && webhookData.bookingTime) {
          webhookPromises.push(
            fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookData)
            })
          );
          webhookNames.push('booking terms webhook');
        } else {
          console.log('❌ Skipping booking terms webhook - invalid data');
        }

        // Trigger session webhook with email flag enabled
        const webhookDataWithEmailFlag = {
          ...webhookData,
          sendSessionEmail: true // Always true for scheduled webhooks (4 days away)
        };

        webhookPromises.push(
          fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookDataWithEmailFlag)
          })
        );
        webhookNames.push('session webhook');

        const responses = await Promise.allSettled(webhookPromises);

        // Check if both webhooks succeeded
        let allSucceeded = true;
        const errors: string[] = [];

        responses.forEach((result, index) => {
          const webhookName = webhookNames[index];
          if (result.status === 'fulfilled' && result.value.ok) {
            console.log(`✅ Successfully triggered scheduled ${webhookName} for session ${session.id}`);
          } else {
            allSucceeded = false;
            const error = result.status === 'fulfilled' ?
              `${result.value.status} ${result.value.statusText}` :
              result.reason;
            console.error(`❌ Failed to trigger scheduled ${webhookName} for session ${session.id}:`, error);
            errors.push(`${webhookName}: ${error}`);
          }
        });

        if (allSucceeded) {
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
            error: errors.join('; ')
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
