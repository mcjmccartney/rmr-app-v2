import { supabase } from '@/lib/supabase'
import { Client } from '@/types'

// Convert database row to Client type
function dbRowToClient(row: Record<string, any>): Client {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    partnerName: row.partner_name || undefined,
    dogName: row.dog_name || undefined, // Handle null values
    otherDogs: row.other_dogs,
    phone: row.phone,
    email: row.email,
    address: row.address,
    active: row.active,
    membership: row.membership,
    avatar: row.avatar,
    behaviouralBriefId: row.behavioural_brief_id,
    behaviourQuestionnaireId: row.behaviour_questionnaire_id,
    booking_terms_signed: row.booking_terms_signed,
    booking_terms_signed_date: row.booking_terms_signed_date,
  }
}

// Convert Client type to database insert/update format
function clientToDbRow(client: Partial<Client>) {
  return {
    id: client.id,
    first_name: client.firstName,
    last_name: client.lastName,
    partner_name: client.partnerName || null,
    dog_name: client.dogName,
    other_dogs: client.otherDogs,
    phone: client.phone,
    email: client.email,
    address: client.address,
    active: client.active,
    membership: client.membership,
    avatar: client.avatar,
    behavioural_brief_id: client.behaviouralBriefId,
    behaviour_questionnaire_id: client.behaviourQuestionnaireId,
    booking_terms_signed: client.booking_terms_signed,
    booking_terms_signed_date: client.booking_terms_signed_date,
  }
}

export const clientService = {
  // Get all clients
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data?.map(dbRowToClient) || []
  },

  // Get client by ID
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data ? dbRowToClient(data) : null
  },

  // Create new client
  async create(client: Omit<Client, 'id'>): Promise<Client> {
    const dbRow = clientToDbRow(client)
    
    const { data, error } = await supabase
      .from('clients')
      .insert(dbRow)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw error
    }

    return dbRowToClient(data)
  },

  // Update existing client
  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const dbRow = clientToDbRow(updates)

    const { data, error } = await supabase
      .from('clients')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw error
    }

    return dbRowToClient(data)
  },

  // Delete client
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  },

  // Find client by email (for questionnaire pairing)
  async findByEmail(email: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error finding client by email:', error)
      throw error
    }

    return data ? dbRowToClient(data) : null
  },

  // Search clients by name or dog name
  async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,dog_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching clients:', error)
      throw error
    }

    return data?.map(dbRowToClient) || []
  }
}
