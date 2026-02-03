import { supabase } from '@/lib/supabase'
import { Client } from '@/types'
import { behaviourQuestionnaireService } from './behaviourQuestionnaireService'

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
    // behaviourQuestionnaireId removed - clients can now have multiple questionnaires
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
    // behaviour_questionnaire_id removed - clients can now have multiple questionnaires
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
    // Get the original client data to detect dog name changes
    const originalClient = await this.getById(id);

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

    const updatedClient = dbRowToClient(data);

    // If the primary dog name was changed, update all related sessions
    if (originalClient && updates.dogName !== undefined && originalClient.dogName && updates.dogName !== originalClient.dogName) {
      console.log(`[CLIENT UPDATE] Primary dog name changed from "${originalClient.dogName}" to "${updates.dogName}" for client ${id}`);

      try {
        // Update all sessions with the old dog name to use the new dog name
        const { data: updatedSessions, error: sessionUpdateError } = await supabase
          .from('sessions')
          .update({
            dog_name: updates.dogName,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', id)
          .ilike('dog_name', originalClient.dogName) // Case-insensitive match
          .select();

        if (sessionUpdateError) {
          console.error('[CLIENT UPDATE] Error updating session dog names:', sessionUpdateError);
        } else {
          console.log(`[CLIENT UPDATE] ✅ Updated ${updatedSessions?.length || 0} session(s) with new dog name "${updates.dogName}"`);
        }
      } catch (sessionError) {
        console.error('[CLIENT UPDATE] Failed to update session dog names:', sessionError);
        // Don't fail the client update if session updates fail
      }
    }

    // If other_dogs array was changed, update sessions for those dogs too
    if (originalClient && updates.otherDogs !== undefined && originalClient.otherDogs) {
      // Find dogs that had their spelling changed
      for (let i = 0; i < Math.min(originalClient.otherDogs.length, updates.otherDogs.length); i++) {
        const oldDogName = originalClient.otherDogs[i];
        const newDogName = updates.otherDogs[i];

        // Check if this is a spelling change (case-insensitive match but different spelling)
        if (oldDogName.toLowerCase() === newDogName.toLowerCase() && oldDogName !== newDogName) {
          console.log(`[CLIENT UPDATE] Other dog name changed from "${oldDogName}" to "${newDogName}" for client ${id}`);

          try {
            const { data: updatedSessions, error: sessionUpdateError } = await supabase
              .from('sessions')
              .update({
                dog_name: newDogName,
                updated_at: new Date().toISOString()
              })
              .eq('client_id', id)
              .ilike('dog_name', oldDogName) // Case-insensitive match
              .select();

            if (sessionUpdateError) {
              console.error('[CLIENT UPDATE] Error updating session dog names for other dog:', sessionUpdateError);
            } else {
              console.log(`[CLIENT UPDATE] ✅ Updated ${updatedSessions?.length || 0} session(s) with new dog name "${newDogName}"`);
            }
          } catch (sessionError) {
            console.error('[CLIENT UPDATE] Failed to update session dog names for other dog:', sessionError);
          }
        }
      }
    }

    return updatedClient;
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

  // Search clients by name, dog name, email, or email aliases
  async search(query: string): Promise<Client[]> {
    // First, search for clients matching the query directly
    const { data: directMatches, error: directError } = await supabase
      .from('clients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,dog_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('Error searching clients:', directError)
      throw directError
    }

    // Then, search for clients via email aliases
    const { data: aliasMatches, error: aliasError } = await supabase
      .from('client_email_aliases')
      .select('client_id')
      .ilike('email', `%${query}%`)

    if (aliasError) {
      console.error('Error searching email aliases:', aliasError)
      throw aliasError
    }

    // Get unique client IDs from alias matches
    const aliasClientIds = [...new Set(aliasMatches?.map(a => a.client_id) || [])];

    // Fetch full client records for alias matches
    let aliasClients: Client[] = [];
    if (aliasClientIds.length > 0) {
      const { data: aliasClientData, error: aliasClientError } = await supabase
        .from('clients')
        .select('*')
        .in('id', aliasClientIds)

      if (aliasClientError) {
        console.error('Error fetching clients from aliases:', aliasClientError)
      } else {
        aliasClients = aliasClientData?.map(dbRowToClient) || [];
      }
    }

    // Combine and deduplicate results
    const allClients = [...(directMatches?.map(dbRowToClient) || []), ...aliasClients];
    const uniqueClients = Array.from(
      new Map(allClients.map(client => [client.id, client])).values()
    );

    return uniqueClients;
  },

  // Populate blank address from questionnaire (for ongoing cases)
  async populateAddressFromQuestionnaire(clientId: string): Promise<Client | null> {
    try {
      // Get client
      const client = await this.getById(clientId);
      if (!client) {
        console.log('Client not found:', clientId);
        return null;
      }

      // Check if address already exists
      if (client.address && client.address.trim() !== '') {
        console.log('Client already has address:', clientId);
        return client; // Address already exists
      }

      // Get questionnaires for this client (ordered by submitted_at ASC - first questionnaire first)
      const questionnaires = await behaviourQuestionnaireService.getByClientId(clientId);
      if (questionnaires.length === 0) {
        console.log('No questionnaires found for client:', clientId);
        return client;
      }

      // Use the first questionnaire (oldest submitted_at)
      const firstQuestionnaire = questionnaires[questionnaires.length - 1]; // getByClientId returns DESC order, so last item is oldest

      // Build full address from questionnaire
      const fullAddress = `${firstQuestionnaire.address1}${firstQuestionnaire.address2 ? ', ' + firstQuestionnaire.address2 : ''}, ${firstQuestionnaire.city}, ${firstQuestionnaire.stateProvince} ${firstQuestionnaire.zipPostalCode}, ${firstQuestionnaire.country}`;

      console.log('Populating address for client:', {
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        questionnaireId: firstQuestionnaire.id,
        address: fullAddress
      });

      // Update client with address
      const updatedClient = await this.update(clientId, { address: fullAddress });
      return updatedClient;

    } catch (error) {
      console.error('Error populating address from questionnaire:', error);
      throw error;
    }
  },

  // Bulk populate addresses for all clients with blank addresses
  async bulkPopulateAddressesFromQuestionnaires(): Promise<{ updated: number; skipped: number; errors: number }> {
    try {
      console.log('Starting bulk address population...');

      const allClients = await this.getAll();
      const clientsWithBlankAddresses = allClients.filter(client =>
        !client.address || client.address.trim() === ''
      );

      console.log(`Found ${clientsWithBlankAddresses.length} clients with blank addresses`);

      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const client of clientsWithBlankAddresses) {
        try {
          const result = await this.populateAddressFromQuestionnaire(client.id);
          if (result && result.address && result.address !== client.address) {
            updated++;
            console.log(`✅ Updated address for ${client.firstName} ${client.lastName}`);
          } else {
            skipped++;
            console.log(`⏭️ Skipped ${client.firstName} ${client.lastName} (no questionnaire or address unchanged)`);
          }

          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          errors++;
          console.error(`❌ Error updating ${client.firstName} ${client.lastName}:`, error);
        }
      }

      console.log('Bulk address population completed:', { updated, skipped, errors });
      return { updated, skipped, errors };

    } catch (error) {
      console.error('Error in bulk address population:', error);
      throw error;
    }
  }
}
