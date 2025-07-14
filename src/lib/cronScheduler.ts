// Built-in cron job scheduler for the application
import { createClient } from '@supabase/supabase-js';

interface CronJob {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
}

class CronScheduler {
  private jobs: CronJob[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.setupJobs();
  }

  private setupJobs() {
    // Daily webhook job at 8:00 AM UTC
    this.addJob({
      name: 'daily-webhooks',
      schedule: '0 8 * * *', // 8:00 AM UTC daily
      handler: this.runDailyWebhooks.bind(this)
    });
  }

  private addJob(job: CronJob) {
    job.nextRun = this.calculateNextRun(job.schedule);
    this.jobs.push(job);
    console.log(`[CRON] Scheduled job "${job.name}" for ${job.nextRun?.toISOString()}`);
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser for "0 8 * * *" format (minute hour day month dayOfWeek)
    const [minute, hour] = cronExpression.split(' ').map(Number);
    
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(hour, minute, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    return nextRun;
  }

  private async runDailyWebhooks() {
    console.log('[CRON] Starting daily webhooks job...');
    
    try {
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
      console.log('[CRON] Processing 4-day webhooks...');
      const fourDayResult = await this.processWebhooks(
        sessions, 
        clients, 
        4, 
        'https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7'
      );

      // Process 12-day webhooks
      console.log('[CRON] Processing 12-day webhooks...');
      const twelveDayResult = await this.processWebhooks(
        sessions, 
        clients, 
        12, 
        'https://hook.eu1.make.com/ylqa8ukjtj6ok1qxxv5ttsqxsp3gwe1y'
      );

      const totalProcessed = fourDayResult.length + twelveDayResult.length;
      console.log(`[CRON] Daily webhooks completed: ${totalProcessed} sessions processed`);

    } catch (error) {
      console.error('[CRON] Daily webhooks failed:', error);
    }
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

  start() {
    if (this.isRunning) {
      console.log('[CRON] Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('[CRON] Starting cron scheduler...');

    // Check every minute for jobs that need to run
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, 60000); // Check every minute

    console.log('[CRON] Cron scheduler started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[CRON] Cron scheduler stopped');
  }

  private checkAndRunJobs() {
    const now = new Date();
    
    for (const job of this.jobs) {
      if (job.nextRun && now >= job.nextRun) {
        console.log(`[CRON] Running job: ${job.name}`);
        
        // Run the job
        job.handler().catch(error => {
          console.error(`[CRON] Job "${job.name}" failed:`, error);
        });

        // Update last run and calculate next run
        job.lastRun = now;
        job.nextRun = this.calculateNextRun(job.schedule);
        
        console.log(`[CRON] Job "${job.name}" completed. Next run: ${job.nextRun.toISOString()}`);
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: this.jobs.map(job => ({
        name: job.name,
        schedule: job.schedule,
        lastRun: job.lastRun?.toISOString(),
        nextRun: job.nextRun?.toISOString()
      }))
    };
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();
