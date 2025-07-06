import { NextResponse } from 'next/server';
import { sessionService } from '@/services/sessionService';
import { clientService } from '@/services/clientService';

export async function POST() {
  try {
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

        // Prepare both webhook promises for sessions that are exactly 4 days away
        const webhookPromises: Promise<Response>[] = [];
        const webhookNames: string[] = [];

        // Double-check validation before booking terms webhook (extra safety) - removed date/time validations
        if (isValidString(webhookData.sessionId) &&
            isValidEmail(webhookData.clientEmail) &&
            isValidString(webhookData.sessionType)) {
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
            // Success - no logging needed
          } else {
            allSucceeded = false;
            const error = result.status === 'fulfilled' ?
              `${result.value.status} ${result.value.statusText}` :
              result.reason;
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

// GET endpoint for testing/manual triggering
export async function GET() {
  return POST();
}
