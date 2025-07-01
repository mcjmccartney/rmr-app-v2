import { supabase } from '@/lib/supabase';

export interface ClientEmailAlias {
  id: string;
  clientId: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

export class ClientEmailAliasService {
  /**
   * Add an email alias for a client
   */
  static async addAlias(clientId: string, email: string, isPrimary: boolean = false): Promise<ClientEmailAlias> {
    const { data, error } = await supabase
      .from('client_email_aliases')
      .insert([{
        client_id: clientId,
        email: email.toLowerCase().trim(),
        is_primary: isPrimary
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding email alias:', error);
      throw error;
    }

    return {
      id: data.id,
      clientId: data.client_id,
      email: data.email,
      isPrimary: data.is_primary,
      createdAt: data.created_at
    };
  }

  /**
   * Get all email aliases for a client
   */
  static async getAliasesByClientId(clientId: string): Promise<ClientEmailAlias[]> {
    const { data, error } = await supabase
      .from('client_email_aliases')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching email aliases:', error);
      throw error;
    }

    return data?.map(row => ({
      id: row.id,
      clientId: row.client_id,
      email: row.email,
      isPrimary: row.is_primary,
      createdAt: row.created_at
    })) || [];
  }

  /**
   * Find client ID by any of their email aliases
   */
  static async findClientByEmail(email: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('client_email_aliases')
      .select('client_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error finding client by email:', error);
      throw error;
    }

    return data?.client_id || null;
  }

  /**
   * Set up email aliases for a client after merge
   */
  static async setupAliasesAfterMerge(
    primaryClientId: string,
    primaryEmail: string,
    duplicateEmail: string
  ): Promise<void> {
    try {
      // Remove any existing aliases for this client to avoid duplicates
      await supabase
        .from('client_email_aliases')
        .delete()
        .eq('client_id', primaryClientId);

      // Add primary email
      if (primaryEmail) {
        await this.addAlias(primaryClientId, primaryEmail, true);
      }

      // Add duplicate email as alias (if different)
      if (duplicateEmail && duplicateEmail.toLowerCase() !== primaryEmail?.toLowerCase()) {
        await this.addAlias(primaryClientId, duplicateEmail, false);
      }

      console.log('Email aliases set up successfully for client:', primaryClientId);
    } catch (error) {
      console.error('Error setting up email aliases:', error);
      throw error;
    }
  }

  /**
   * Update primary email for a client
   */
  static async updatePrimaryEmail(clientId: string, newPrimaryEmail: string): Promise<void> {
    try {
      // First, set all existing aliases to non-primary
      await supabase
        .from('client_email_aliases')
        .update({ is_primary: false })
        .eq('client_id', clientId);

      // Check if the new primary email already exists as an alias
      const { data: existingAlias } = await supabase
        .from('client_email_aliases')
        .select('id')
        .eq('client_id', clientId)
        .eq('email', newPrimaryEmail.toLowerCase().trim())
        .single();

      if (existingAlias) {
        // Update existing alias to be primary
        await supabase
          .from('client_email_aliases')
          .update({ is_primary: true })
          .eq('id', existingAlias.id);
      } else {
        // Add new primary alias
        await this.addAlias(clientId, newPrimaryEmail, true);
      }

      console.log('Primary email updated successfully for client:', clientId);
    } catch (error) {
      console.error('Error updating primary email:', error);
      throw error;
    }
  }

  /**
   * Remove an email alias
   */
  static async removeAlias(aliasId: string): Promise<void> {
    const { error } = await supabase
      .from('client_email_aliases')
      .delete()
      .eq('id', aliasId);

    if (error) {
      console.error('Error removing email alias:', error);
      throw error;
    }
  }

  /**
   * Get all clients with their email aliases
   */
  static async getAllClientsWithAliases(): Promise<{ [clientId: string]: ClientEmailAlias[] }> {
    const { data, error } = await supabase
      .from('client_email_aliases')
      .select('*')
      .order('client_id')
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching all client aliases:', error);
      throw error;
    }

    const aliasesByClient: { [clientId: string]: ClientEmailAlias[] } = {};
    
    data?.forEach(row => {
      const alias: ClientEmailAlias = {
        id: row.id,
        clientId: row.client_id,
        email: row.email,
        isPrimary: row.is_primary,
        createdAt: row.created_at
      };

      if (!aliasesByClient[alias.clientId]) {
        aliasesByClient[alias.clientId] = [];
      }
      aliasesByClient[alias.clientId].push(alias);
    });

    return aliasesByClient;
  }
}

export const clientEmailAliasService = ClientEmailAliasService;
