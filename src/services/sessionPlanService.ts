import { supabase } from '@/lib/supabase';
import { SessionPlan, ActionPoint } from '@/types';

// Convert database row to SessionPlan type
function dbRowToSessionPlan(row: Record<string, any>): SessionPlan {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionNumber: row.session_number,
    mainGoal1: row.main_goal_1,
    mainGoal2: row.main_goal_2,
    mainGoal3: row.main_goal_3,
    mainGoal4: row.main_goal_4,
    explanationOfBehaviour: row.explanation_of_behaviour,
    actionPoints: row.action_points || [],
    documentEditUrl: row.document_edit_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Convert SessionPlan to database row format
function sessionPlanToDbRow(sessionPlan: Partial<SessionPlan>) {
  return {
    id: sessionPlan.id,
    session_id: sessionPlan.sessionId,
    session_number: sessionPlan.sessionNumber,
    main_goal_1: sessionPlan.mainGoal1,
    main_goal_2: sessionPlan.mainGoal2,
    main_goal_3: sessionPlan.mainGoal3,
    main_goal_4: sessionPlan.mainGoal4,
    explanation_of_behaviour: sessionPlan.explanationOfBehaviour,
    action_points: sessionPlan.actionPoints,
    document_edit_url: sessionPlan.documentEditUrl,
  };
}

// Convert database row to ActionPoint type
function dbRowToActionPoint(row: Record<string, any>): ActionPoint {
  return {
    id: row.id,
    header: row.header,
    details: row.details,
  };
}

export const sessionPlanService = {
  // Get all action points (predefined)
  async getAllActionPoints(): Promise<ActionPoint[]> {
    const { data, error } = await supabase
      .from('action_points')
      .select('*')
      .order('header');

    if (error) {
      console.error('Error fetching action points:', error);
      throw error;
    }

    return data?.map(dbRowToActionPoint) || [];
  },

  // Get session plan by session ID
  async getBySessionId(sessionId: string): Promise<SessionPlan | null> {
    const { data, error } = await supabase
      .from('session_plans')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching session plan:', error);
      throw error;
    }

    return data ? dbRowToSessionPlan(data) : null;
  },

  // Get session plan by ID
  async getById(id: string): Promise<SessionPlan | null> {
    const { data, error } = await supabase
      .from('session_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching session plan:', error);
      throw error;
    }

    return data ? dbRowToSessionPlan(data) : null;
  },

  // Calculate session number for a session
  async calculateSessionNumber(sessionId: string): Promise<number> {
    try {
      // First, get the session to find the client
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('client_id, booking_date, booking_time')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching session:', sessionError);
        return 1;
      }

      // Get all sessions for this client ordered by date/time (most recent first)
      const { data: clientSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, booking_date, booking_time')
        .eq('client_id', session.client_id)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (sessionsError || !clientSessions) {
        console.error('Error fetching client sessions:', sessionsError);
        return 1;
      }

      // Find the position of this session in the reverse chronological order
      // Sessions are displayed newest first, but numbered chronologically
      // So oldest session = Session 1, newest = Session N
      const sessionIndex = clientSessions.findIndex(s => s.id === sessionId);
      return sessionIndex >= 0 ? clientSessions.length - sessionIndex : 1;

    } catch (error) {
      console.error('Error calculating session number:', error);
      return 1;
    }
  },

  // Create new session plan
  async create(sessionPlan: Omit<SessionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionPlan> {
    // Calculate session number if not provided
    const sessionNumber = sessionPlan.sessionNumber || await this.calculateSessionNumber(sessionPlan.sessionId);
    
    const dbRow = sessionPlanToDbRow({
      ...sessionPlan,
      sessionNumber,
    });

    const { data, error } = await supabase
      .from('session_plans')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating session plan:', error);
      throw error;
    }

    return dbRowToSessionPlan(data);
  },

  // Update existing session plan
  async update(id: string, updates: Partial<SessionPlan>): Promise<SessionPlan> {
    const dbRow = sessionPlanToDbRow(updates);

    const { data, error } = await supabase
      .from('session_plans')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session plan:', error);
      throw error;
    }

    return dbRowToSessionPlan(data);
  },

  // Delete session plan
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('session_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session plan:', error);
      throw error;
    }
  },

  // Get session plans for a client (with session info)
  async getByClientId(clientId: string): Promise<(SessionPlan & { sessionDate: string; sessionTime: string })[]> {
    const { data, error } = await supabase
      .from('session_plans')
      .select(`
        *,
        sessions (
          booking_date,
          booking_time
        )
      `)
      .eq('sessions.client_id', clientId)
      .order('session_number', { ascending: true });

    if (error) {
      console.error('Error fetching session plans for client:', error);
      throw error;
    }

    return data?.map(row => ({
      ...dbRowToSessionPlan(row),
      sessionDate: row.sessions.booking_date,
      sessionTime: row.sessions.booking_time,
    })) || [];
  },

  // Get all session plans
  async getAll(): Promise<SessionPlan[]> {
    const { data, error } = await supabase
      .from('session_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session plans:', error);
      throw error;
    }

    return data?.map(dbRowToSessionPlan) || [];
  }
};
