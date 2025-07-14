// Simple built-in webhook scheduler for the application
import { createClient } from '@supabase/supabase-js';

class SimpleWebhookScheduler {
  private static instance: SimpleWebhookScheduler;
  private lastRunDate: string | null = null;
  private isRunning = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): SimpleWebhookScheduler {
    if (!SimpleWebhookScheduler.instance) {
      SimpleWebhookScheduler.instance = new SimpleWebhookScheduler();
    }
    return SimpleWebhookScheduler.instance;
  }

  // Check if we should run today's webhooks
  async checkAndRunDaily(): Promise<{ ran: boolean; message: string; results?: any }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // If we already ran today, skip
    if (this.lastRunDate === today) {
      return { ran: false, message: 'Already ran today' };
    }

    // If currently running, skip
    if (this.isRunning) {
      return { ran: false, message: 'Already running' };
    }

    // Check if it's past 8:00 AM UTC today
    const now = new Date();
    const todayAt8AM = new Date();
    todayAt8AM.setUTCHours(8, 0, 0, 0);

    if (now < todayAt8AM) {
      return { ran: false, message: 'Too early - waiting for 8:00 AM UTC' };
    }

    // Run the daily webhooks
    console.log('[WEBHOOK-SCHEDULER] Running daily webhooks...');
    this.isRunning = true;

    try {
      const results = await this.runDailyWebhooks();
      this.lastRunDate = today;
      console.log('[WEBHOOK-SCHEDULER] Daily webhooks completed successfully');
      return { ran: true, message: 'Daily webhooks completed', results };
    } catch (error) {
      console.error('[WEBHOOK-SCHEDULER] Daily webhooks failed:', error);
      return { ran: false, message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    } finally {
      this.isRunning = false;
    }
  }

  private async runDailyWebhooks() {
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

    // Process 4-day webhooks
    console.log('[WEBHOOK-SCHEDULER] Processing 4-day webhooks...');
    const fourDayResult = await this.processWebhooks(
      sessions,
      clients,
      4,
      'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
    );

    // Process 12-day webhooks
    console.log('[WEBHOOK-SCHEDULER] Processing 12-day webhooks...');
    const twelveDayResult = await this.processWebhooks(
      sessions,
      clients,
      12,
      'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
    );

    const totalProcessed = fourDayResult.length + twelveDayResult.length;
    const totalSuccess = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'success').length;
    const totalFailure = [...fourDayResult, ...twelveDayResult].filter(r => r.status === 'failed' || r.status === 'error').length;

    return {
      fourDaySessionsProcessed: fourDayResult.length,
      twelveDaySessionsProcessed: twelveDayResult.length,
      totalProcessed,
      successCount: totalSuccess,
      failureCount: totalFailure,
      results: {
        fourDayWebhooks: fourDayResult,
        twelveDayWebhooks: twelveDayResult
      }
    };
  }

  private async processWebhooks(sessions: any[], clients: any[], targetDays: number, webhookUrl: string) {
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
          dogName: session.dog_name || client.dog_name,
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
          console.log(`[CRON] Webhook sent for ${client.first_name} ${client.last_name} (${targetDays} days)`);
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
  }

  // Manual trigger for testing
  async triggerNow(): Promise<any> {
    console.log('[WEBHOOK-SCHEDULER] Manual trigger requested');
    this.isRunning = true;

    try {
      const results = await this.runDailyWebhooks();
      console.log('[WEBHOOK-SCHEDULER] Manual trigger completed successfully');
      return results;
    } catch (error) {
      console.error('[WEBHOOK-SCHEDULER] Manual trigger failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const todayAt8AM = new Date();
    todayAt8AM.setUTCHours(8, 0, 0, 0);

    return {
      isRunning: this.isRunning,
      lastRunDate: this.lastRunDate,
      hasRunToday: this.lastRunDate === today,
      currentTime: now.toISOString(),
      nextScheduledTime: todayAt8AM.toISOString(),
      canRunNow: now >= todayAt8AM,
      status: this.lastRunDate === today ? 'completed' : (now >= todayAt8AM ? 'ready' : 'waiting')
    };
  }
}

// Export singleton instance
export const webhookScheduler = SimpleWebhookScheduler.getInstance();
