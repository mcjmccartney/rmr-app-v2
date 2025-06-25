import { supabase } from '@/lib/supabase'
import { Membership } from '@/types'
import { ClientEmailAliasService } from './clientEmailAliasService'

// Convert database row to Membership type
function dbRowToMembership(row: Record<string, any>): Membership {
  return {
    id: row.id,
    email: row.email,
    date: row.date,
    amount: parseFloat(row.amount) || 0,
  }
}

// Convert Membership to database row format
function membershipToDbRow(membership: Partial<Membership>): Record<string, any> {
  const dbRow: Record<string, any> = {}

  if (membership.email !== undefined) dbRow.email = membership.email
  if (membership.date !== undefined) dbRow.date = membership.date
  if (membership.amount !== undefined) dbRow.amount = membership.amount

  return dbRow
}

export const membershipService = {
  // Get all memberships
  async getAll(): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching memberships:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by client ID (not used since we don't have client_id in your table)
  async getByClientId(clientId: string): Promise<Membership[]> {
    // Since your table doesn't have client_id, return empty array
    return []
  },

  // Get memberships by email (for pairing with clients)
  async getByEmail(email: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('email', email)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching memberships by email:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by client ID including email aliases
  async getByClientIdWithAliases(clientId: string): Promise<Membership[]> {
    try {
      // Get all email aliases for this client
      const aliases = await ClientEmailAliasService.getAliasesByClientId(clientId)

      if (aliases.length === 0) {
        return []
      }

      // Get all emails (primary and aliases)
      const emails = aliases.map(alias => alias.email)

      // Fetch memberships for all emails
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .in('email', emails)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching memberships by client ID with aliases:', error)
        throw error
      }

      return data?.map(dbRowToMembership) || []
    } catch (error) {
      console.error('Error in getByClientIdWithAliases:', error)
      return []
    }
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
