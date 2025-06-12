import { supabase } from '@/lib/supabase'
import { Membership } from '@/types'

// Convert database row to Membership type
function dbRowToMembership(row: Record<string, any>): Membership {
  return {
    id: row.id,
    clientId: row.client_id,
    email: row.email,
    month: row.month,
    amount: row.amount,
    status: row.status,
    paymentDate: row.payment_date,
    createdAt: new Date(row.created_at),
  }
}

// Convert Membership to database row format
function membershipToDbRow(membership: Partial<Membership>): Record<string, any> {
  const dbRow: Record<string, any> = {}
  
  if (membership.clientId !== undefined) dbRow.client_id = membership.clientId
  if (membership.email !== undefined) dbRow.email = membership.email
  if (membership.month !== undefined) dbRow.month = membership.month
  if (membership.amount !== undefined) dbRow.amount = membership.amount
  if (membership.status !== undefined) dbRow.status = membership.status
  if (membership.paymentDate !== undefined) dbRow.payment_date = membership.paymentDate
  
  return dbRow
}

export const membershipService = {
  // Get all memberships
  async getAll(): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memberships:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by client ID
  async getByClientId(clientId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memberships by client ID:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by email (for pairing with clients)
  async getByEmail(email: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memberships by email:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get membership by ID
  async getById(id: string): Promise<Membership | null> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching membership:', error)
      throw error
    }

    return data ? dbRowToMembership(data) : null
  },

  // Create new membership
  async create(membership: Omit<Membership, 'id' | 'createdAt'>): Promise<Membership> {
    const dbRow = membershipToDbRow(membership)
    
    const { data, error } = await supabase
      .from('memberships')
      .insert(dbRow)
      .select()
      .single()

    if (error) {
      console.error('Error creating membership:', error)
      throw error
    }

    return dbRowToMembership(data)
  },

  // Update existing membership
  async update(id: string, updates: Partial<Membership>): Promise<Membership> {
    const dbRow = membershipToDbRow(updates)
    
    const { data, error } = await supabase
      .from('memberships')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating membership:', error)
      throw error
    }

    return dbRowToMembership(data)
  },

  // Delete membership
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting membership:', error)
      throw error
    }
  },

  // Update client ID for memberships (for pairing with existing clients)
  async updateClientId(email: string, clientId: string): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .update({ client_id: clientId })
      .eq('email', email)

    if (error) {
      console.error('Error updating membership client ID:', error)
      throw error
    }
  }
}
