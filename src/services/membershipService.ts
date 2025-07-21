import { supabase } from '@/lib/supabase'
import { Membership } from '@/types'
import { ClientEmailAliasService } from './clientEmailAliasService'

// Convert database row to Membership type
function dbRowToMembership(row: Record<string, any>): Membership {
  return {
    id: row.id,
    email: row.email,
    date: row.date, // Use date column directly (YYYY-MM-DD format)
    amount: parseFloat(row.amount) || 0,
  }
}

// Convert Membership to database row format
function membershipToDbRow(membership: Partial<Membership>): Record<string, any> {
  const dbRow: Record<string, any> = {}

  if (membership.email !== undefined) dbRow.email = membership.email
  if (membership.date !== undefined) dbRow.date = membership.date // Use date column directly
  if (membership.amount !== undefined) dbRow.amount = membership.amount

  return dbRow
}

export const membershipService = {
  // Get all memberships
  async getAll(): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('date', { ascending: false }) // Order by date column

    if (error) {
      console.error('Error fetching memberships:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by client ID (not used since we don't have client_id in your table)
  async getByClientId(clientId: string): Promise<Membership[]> {
    // Since your table doesn't have client_id, return empty array
    // This function is kept for compatibility but doesn't query the database
    return []
  },

  // Get memberships by email (for pairing with clients)
  async getByEmail(email: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('email', email)
      .order('date', { ascending: false }) // Order by date column

    if (error) {
      console.error('Error fetching memberships by email:', error)
      throw error
    }

    return data?.map(dbRowToMembership) || []
  },

  // Get memberships by client ID including email aliases
  async getByClientIdWithAliases(clientId: string): Promise<Membership[]> {
    try {
      // Get the client's primary email first
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('Error fetching client for membership lookup:', clientError)
        return []
      }

      // Start with client's primary email
      const emails: string[] = []
      if (client?.email) {
        emails.push(client.email)
      }

      // Get all email aliases for this client
      const aliases = await ClientEmailAliasService.getAliasesByClientId(clientId)

      // Add alias emails (avoid duplicates)
      aliases.forEach(alias => {
        if (alias.email && !emails.includes(alias.email)) {
          emails.push(alias.email)
        }
      })

      if (emails.length === 0) {
        return []
      }

      // Fetch memberships for all emails
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .in('email', emails)
        .order('date', { ascending: false }) // Order by date column

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
  // Note: This function is kept for compatibility but doesn't update the database
  // since the memberships table doesn't have a client_id column.
  // Memberships are paired with clients by email matching instead.
  async updateClientId(email: string, clientId: string): Promise<void> {
    // No-op: memberships are paired by email, not by storing client_id
    console.log(`Membership pairing: ${email} paired with client ${clientId} (email-based matching)`);
  }
}
