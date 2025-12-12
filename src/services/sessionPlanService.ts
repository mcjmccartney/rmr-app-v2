import { supabase } from '@/lib/supabase';
import { SessionPlan, ActionPoint, EditableActionPoint } from '@/types';

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
    editedActionPoints: row.edited_action_points || {},
    dogClubGuides: row.dog_club_guides || [],
    documentEditUrl: row.document_edit_url,
    noFirstPage: row.no_first_page !== undefined ? row.no_first_page : true, // Default to true (removed state)
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
    edited_action_points: sessionPlan.editedActionPoints || {},
    dog_club_guides: sessionPlan.dogClubGuides || [],
    document_edit_url: sessionPlan.documentEditUrl,
    no_first_page: sessionPlan.noFirstPage !== undefined ? sessionPlan.noFirstPage : true, // Default to true (removed state)
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

  // Create new action point
  async createActionPoint(actionPoint: Omit<ActionPoint, 'id'>): Promise<ActionPoint> {
    const { data, error } = await supabase
      .from('action_points')
      .insert({
        header: actionPoint.header,
        details: actionPoint.details
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action point:', error);
      throw error;
    }

    return dbRowToActionPoint(data);
  },

  // Update existing action point
  async updateActionPoint(id: string, updates: Partial<ActionPoint>): Promise<ActionPoint> {
    const { data, error } = await supabase
      .from('action_points')
      .update({
        header: updates.header,
        details: updates.details
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating action point:', error);
      throw error;
    }

    return dbRowToActionPoint(data);
  },

  // Delete action point
  async deleteActionPoint(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_points')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting action point:', error);
      throw error;
    }
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

  // Calculate session number for a session (only counting Online and In-Person sessions)
  async calculateSessionNumber(sessionId: string): Promise<number> {
    try {
      // First, get the session to find the client and session type
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('client_id, booking_date, booking_time, session_type')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching session:', sessionError);
        return 1;
      }

      // Get all Online and In-Person sessions for this client that are chronologically before or equal to this session
      const { data: clientSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, booking_date, booking_time, session_type')
        .eq('client_id', session.client_id)
        .in('session_type', ['Online', 'In-Person'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (sessionsError || !clientSessions) {
        console.error('Error fetching client sessions:', sessionsError);
        return 1;
      }

      // Filter sessions that are chronologically before or equal to the current session
      const sessionsBeforeOrEqual = clientSessions.filter(s => {
        const sDate = new Date(`${s.booking_date}T${s.booking_time}`);
        const currentDate = new Date(`${session.booking_date}T${session.booking_time}`);
        return sDate <= currentDate;
      });

      // The session number is the count of sessions before or equal to this one
      const sessionNumber = sessionsBeforeOrEqual.length;

      return Math.max(sessionNumber, 1); // Ensure minimum of 1

    } catch (error) {
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
