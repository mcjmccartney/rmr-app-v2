import { supabase } from '@/lib/supabase';

// Audit log types
export type AuditActionType = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'EXPORT'
  | 'SEND_EMAIL'
  | 'PAYMENT'
  | 'CALENDAR_SYNC';

export type AuditEntityType = 
  | 'SESSION' 
  | 'CLIENT' 
  | 'SESSION_PLAN'
  | 'ACTION_POINT'
  | 'BOOKING_TERMS'
  | 'MEMBERSHIP'
  | 'FINANCE'
  | 'USER';

export interface AuditLogEntry {
  id?: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id?: string;
  user_email?: string;
  user_id?: string;
  timestamp?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AuditLogFilter {
  action_type?: AuditActionType;
  entity_type?: AuditEntityType;
  entity_id?: string;
  user_email?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

class AuditService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          action_type: entry.action_type,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          user_email: entry.user_email,
          user_id: entry.user_id,
          old_values: entry.old_values,
          new_values: entry.new_values,
          description: entry.description,
          metadata: entry.metadata,
        }]);

      if (error) {
        console.error('Error logging audit event:', error);
        // Don't throw - audit logging should not break the main operation
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Log a session creation
   */
  async logSessionCreate(session: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'CREATE',
      entity_type: 'SESSION',
      entity_id: session.id,
      user_email: userEmail,
      new_values: session,
      description: `Created ${session.sessionType} session for ${session.bookingDate} at ${session.bookingTime}`,
    });
  }

  /**
   * Log a session update
   */
  async logSessionUpdate(oldSession: any, newSession: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'UPDATE',
      entity_type: 'SESSION',
      entity_id: newSession.id,
      user_email: userEmail,
      old_values: oldSession,
      new_values: newSession,
      description: `Updated ${newSession.sessionType} session`,
    });
  }

  /**
   * Log a session deletion
   */
  async logSessionDelete(session: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'DELETE',
      entity_type: 'SESSION',
      entity_id: session.id,
      user_email: userEmail,
      old_values: session,
      description: `Deleted ${session.sessionType} session for ${session.bookingDate} at ${session.bookingTime}`,
    });
  }

  /**
   * Log a client creation
   */
  async logClientCreate(client: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'CREATE',
      entity_type: 'CLIENT',
      entity_id: client.id,
      user_email: userEmail,
      new_values: client,
      description: `Created client: ${client.firstName} ${client.lastName}`,
    });
  }

  /**
   * Log a client update
   */
  async logClientUpdate(oldClient: any, newClient: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'UPDATE',
      entity_type: 'CLIENT',
      entity_id: newClient.id,
      user_email: userEmail,
      old_values: oldClient,
      new_values: newClient,
      description: `Updated client: ${newClient.firstName} ${newClient.lastName}`,
    });
  }

  /**
   * Log a client deletion
   */
  async logClientDelete(client: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'DELETE',
      entity_type: 'CLIENT',
      entity_id: client.id,
      user_email: userEmail,
      old_values: client,
      description: `Deleted client: ${client.firstName} ${client.lastName}`,
    });
  }

  /**
   * Get audit logs with optional filters
   */
  async getLogs(filter?: AuditLogFilter): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filter?.action_type) {
        query = query.eq('action_type', filter.action_type);
      }
      if (filter?.entity_type) {
        query = query.eq('entity_type', filter.entity_type);
      }
      if (filter?.entity_id) {
        query = query.eq('entity_id', filter.entity_id);
      }
      if (filter?.user_email) {
        query = query.eq('user_email', filter.user_email);
      }
      if (filter?.start_date) {
        query = query.gte('timestamp', filter.start_date);
      }
      if (filter?.end_date) {
        query = query.lte('timestamp', filter.end_date);
      }

      // Apply limit (default to 100)
      const limit = filter?.limit || 100;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityHistory(entityType: AuditEntityType, entityId: string): Promise<AuditLogEntry[]> {
    return this.getLogs({
      entity_type: entityType,
      entity_id: entityId,
    });
  }

  /**
   * Get recent audit logs (last 100)
   */
  async getRecentLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    return this.getLogs({ limit });
  }

  /**
   * Log a session plan creation/update
   */
  async logSessionPlanUpdate(sessionId: string, sessionPlan: any, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'UPDATE',
      entity_type: 'SESSION_PLAN',
      entity_id: sessionId,
      user_email: userEmail,
      new_values: sessionPlan,
      description: `Updated session plan for session ${sessionId}`,
    });
  }

  /**
   * Log booking terms submission
   */
  async logBookingTermsSubmission(email: string, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'CREATE',
      entity_type: 'BOOKING_TERMS',
      user_email: userEmail,
      description: `Booking terms signed by ${email}`,
      metadata: { client_email: email },
    });
  }

  /**
   * Log membership payment
   */
  async logMembershipPayment(email: string, amount: number, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'PAYMENT',
      entity_type: 'MEMBERSHIP',
      user_email: userEmail,
      description: `Membership payment of £${amount} from ${email}`,
      metadata: { client_email: email, amount },
    });
  }

  /**
   * Log calendar sync
   */
  async logCalendarSync(sessionId: string, eventId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'CALENDAR_SYNC',
      entity_type: 'SESSION',
      entity_id: sessionId,
      user_email: userEmail,
      description: `Calendar event ${action.toLowerCase()}d for session ${sessionId}`,
      metadata: { event_id: eventId, calendar_action: action },
    });
  }

  /**
   * Log email sent
   */
  async logEmailSent(recipient: string, subject: string, emailType: string, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'SEND_EMAIL',
      entity_type: 'SESSION',
      user_email: userEmail,
      description: `Email sent to ${recipient}: ${subject}`,
      metadata: { recipient, subject, email_type: emailType },
    });
  }

  /**
   * Log data export
   */
  async logDataExport(exportType: string, userEmail?: string): Promise<void> {
    await this.log({
      action_type: 'EXPORT',
      entity_type: 'SESSION',
      user_email: userEmail,
      description: `Data exported: ${exportType}`,
      metadata: { export_type: exportType },
    });
  }
}

// Export singleton instance
export const auditService = new AuditService();

