import { supabase } from '@/lib/supabase'
import { Session } from '@/types'

// Convert database row to Session type
function dbRowToSession(row: Record<string, any>): Session {
  // Handle both old format (timestamp) and new format (separate date/time)
  let bookingDate: string;
  let bookingTime: string;

  if (row.booking_time) {
    // New format: separate date and time columns
    bookingDate = row.booking_date; // YYYY-MM-DD
    bookingTime = row.booking_time.substring(0, 5); // Always remove seconds: HH:mm:ss -> HH:mm
  } else {
    // Old format: single timestamp column
    const timestamp = new Date(row.booking_date);
    bookingDate = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    bookingTime = timestamp.toTimeString().substring(0, 5); // HH:mm
  }

  return {
    id: row.id,
    clientId: row.client_id,
    dogName: row.dog_name,
    sessionType: row.session_type,
    bookingDate,
    bookingTime,
    notes: row.notes,
    quote: parseFloat(row.quote),
    email: row.email,
    sessionPaid: row.session_paid || false,
    paymentConfirmedAt: row.payment_confirmed_at,
    sessionPlanSent: row.session_plan_sent || false,
    questionnaireBypass: row.questionnaire_bypass || false,
    eventId: row.event_id,
    googleMeetLink: row.google_meet_link,
  }
}

// Convert Session type to database insert/update format
function sessionToDbRow(session: Partial<Session>) {
  const dbRow: Record<string, any> = {
    id: session.id,
    client_id: session.clientId,
    dog_name: session.dogName,
    session_type: session.sessionType,
    notes: session.notes,
    quote: session.quote,
    email: session.email,
    session_paid: session.sessionPaid,
    payment_confirmed_at: session.paymentConfirmedAt,
    session_plan_sent: session.sessionPlanSent,
    questionnaire_bypass: session.questionnaireBypass,
    event_id: session.eventId,
    google_meet_link: session.googleMeetLink,
  };

  // Handle both old and new database formats
  if (session.bookingDate && session.bookingTime) {
    // New format: separate date and time
    dbRow.booking_date = session.bookingDate; // YYYY-MM-DD
    dbRow.booking_time = session.bookingTime.substring(0, 5); // Ensure HH:mm format (remove seconds)
  } else if (session.bookingDate) {
    // Fallback: if only date is provided, assume it's a timestamp
    dbRow.booking_date = session.bookingDate;
  }

  return dbRow;
}

export const sessionService = {
  // Get all sessions
  async getAll(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })

    if (error) {
      throw error
    }

    return data?.map(dbRowToSession) || []
  },

  // Get session by ID
  async getById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data ? dbRowToSession(data) : null
  },

  // Get sessions by client ID
  async getByClientId(clientId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })

    if (error) {
      console.error('Error fetching sessions for client:', error)
      throw error
    }

    return data?.map(dbRowToSession) || []
  },

  // Get sessions for a specific date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const startDateStr = startDate.toISOString().split('T')[0] // YYYY-MM-DD
    const endDateStr = endDate.toISOString().split('T')[0] // YYYY-MM-DD

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('booking_date', startDateStr)
      .lte('booking_date', endDateStr)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (error) {
      console.error('Error fetching sessions by date range:', error)
      throw error
    }

    return data?.map(dbRowToSession) || []
  },

  // Create new session
  async create(session: Omit<Session, 'id'>): Promise<Session> {
    const dbRow = sessionToDbRow(session)
    
    const { data, error } = await supabase
      .from('sessions')
      .insert(dbRow)
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      throw error
    }

    return dbRowToSession(data)
  },

  // Update existing session
  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const dbRow = sessionToDbRow(updates)
    
    const { data, error } = await supabase
      .from('sessions')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      throw error
    }

    return dbRowToSession(data)
  },

  // Delete session
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting session:', error)
      throw error
    }
  },

  // Get sessions for current month (for finance calculations)
  async getCurrentMonthSessions(): Promise<Session[]> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return this.getByDateRange(startOfMonth, endOfMonth)
  },

  // Get sessions with client information (for display purposes)
  async getWithClientInfo(): Promise<(Session & { clientName: string; dogName: string })[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          dog_name
        )
      `)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })

    if (error) {
      console.error('Error fetching sessions with client info:', error)
      throw error
    }

    return data?.map(row => ({
      ...dbRowToSession(row),
      clientName: `${row.clients.first_name} ${row.clients.last_name}`,
      dogName: row.clients.dog_name,
    })) || []
  },

  // Mark session as paid
  async markAsPaid(sessionId: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        session_paid: true,
        payment_confirmed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error marking session as paid:', error)
      throw error
    }

    return dbRowToSession(data)
  }
}
