import { supabase } from '@/lib/supabase'
import { SessionParticipant } from '@/types'

// Convert database row to SessionParticipant type
function dbRowToSessionParticipant(row: Record<string, any>): SessionParticipant {
  return {
    id: row.id,
    sessionId: row.session_id,
    clientId: row.client_id,
    individualQuote: parseFloat(row.individual_quote) || 0,
    paid: row.paid || false,
    paidAt: row.paid_at,
  }
}

// Convert SessionParticipant to database row format
function sessionParticipantToDbRow(participant: Partial<SessionParticipant>): Record<string, any> {
  const dbRow: Record<string, any> = {}

  if (participant.sessionId !== undefined) dbRow.session_id = participant.sessionId
  if (participant.clientId !== undefined) dbRow.client_id = participant.clientId
  if (participant.individualQuote !== undefined) dbRow.individual_quote = participant.individualQuote
  if (participant.paid !== undefined) dbRow.paid = participant.paid
  if (participant.paidAt !== undefined) dbRow.paid_at = participant.paidAt

  return dbRow
}

export const sessionParticipantService = {
  // Get all participants for a session
  async getBySessionId(sessionId: string): Promise<SessionParticipant[]> {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching session participants:', error)
      throw error
    }

    return data?.map(dbRowToSessionParticipant) || []
  },

  // Get all session participants
  async getAll(): Promise<SessionParticipant[]> {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all session participants:', error)
      throw error
    }

    return data?.map(dbRowToSessionParticipant) || []
  },

  // Create new session participant
  async create(participant: Omit<SessionParticipant, 'id'>): Promise<SessionParticipant> {
    const dbRow = sessionParticipantToDbRow(participant)
    
    const { data, error } = await supabase
      .from('session_participants')
      .insert(dbRow)
      .select()
      .single()

    if (error) {
      console.error('Error creating session participant:', error)
      throw error
    }

    return dbRowToSessionParticipant(data)
  },

  // Update existing session participant
  async update(id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant> {
    const dbRow = sessionParticipantToDbRow(updates)
    
    const { data, error } = await supabase
      .from('session_participants')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session participant:', error)
      throw error
    }

    return dbRowToSessionParticipant(data)
  },

  // Delete session participant
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting session participant:', error)
      throw error
    }
  },

  // Delete all participants for a session
  async deleteBySessionId(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error deleting session participants:', error)
      throw error
    }
  },

  // Mark participant as paid
  async markAsPaid(id: string): Promise<SessionParticipant> {
    return this.update(id, {
      paid: true,
      paidAt: new Date().toISOString()
    })
  },

  // Mark participant as unpaid
  async markAsUnpaid(id: string): Promise<SessionParticipant> {
    return this.update(id, {
      paid: false,
      paidAt: undefined
    })
  }
}
