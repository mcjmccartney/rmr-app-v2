import { supabase } from '@/lib/supabase';

export interface GroupCoachingReset {
  id: string;
  clientId: string;
  resetDate: string; // YYYY-MM-DD format
  createdAt?: string;
  updatedAt?: string;
}

// Convert database row to GroupCoachingReset type
function dbRowToGroupCoachingReset(row: Record<string, any>): GroupCoachingReset {
  return {
    id: row.id,
    clientId: row.client_id,
    resetDate: row.reset_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert GroupCoachingReset to database row format
function groupCoachingResetToDbRow(reset: Partial<GroupCoachingReset>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (reset.clientId !== undefined) dbRow.client_id = reset.clientId;
  if (reset.resetDate !== undefined) dbRow.reset_date = reset.resetDate;

  return dbRow;
}

export const groupCoachingResetService = {
  // Get the most recent reset date for a client
  async getLatestResetDate(clientId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('group_coaching_resets')
        .select('reset_date')
        .eq('client_id', clientId)
        .order('reset_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No reset found
        }
        console.error('Error fetching latest reset date:', error);
        return null;
      }

      return data?.reset_date || null;
    } catch (error) {
      console.error('Failed to get latest reset date:', error);
      return null;
    }
  },

  // Get all reset dates for a client
  async getAllResetDates(clientId: string): Promise<GroupCoachingReset[]> {
    try {
      const { data, error } = await supabase
        .from('group_coaching_resets')
        .select('*')
        .eq('client_id', clientId)
        .order('reset_date', { ascending: false });

      if (error) {
        console.error('Error fetching reset dates:', error);
        return [];
      }

      return data?.map(dbRowToGroupCoachingReset) || [];
    } catch (error) {
      console.error('Failed to get reset dates:', error);
      return [];
    }
  },

  // Add a new reset for a client
  async addReset(clientId: string, resetDate?: string): Promise<GroupCoachingReset> {
    try {
      const dateToUse = resetDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const { data, error } = await supabase
        .from('group_coaching_resets')
        .insert([{
          client_id: clientId,
          reset_date: dateToUse
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return dbRowToGroupCoachingReset(data);
    } catch (error) {
      throw error;
    }
  },

  // Get all resets (for debugging/admin purposes)
  async getAllResets(): Promise<GroupCoachingReset[]> {
    try {
      const { data, error } = await supabase
        .from('group_coaching_resets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all resets:', error);
        return [];
      }

      return data?.map(dbRowToGroupCoachingReset) || [];
    } catch (error) {
      console.error('Failed to get all resets:', error);
      return [];
    }
  },

  // Clear all resets for a client (for testing/debugging)
  async clearClientResets(clientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_coaching_resets')
        .delete()
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Clear all resets (for testing/debugging)
  async clearAllResets(): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_coaching_resets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Migrate localStorage data to database (one-time migration helper)
  async migrateFromLocalStorage(localStorageData: { [clientId: string]: string }): Promise<void> {
    try {
      const migrations = Object.entries(localStorageData).map(([clientId, resetDate]) => ({
        client_id: clientId,
        reset_date: resetDate
      }));

      if (migrations.length === 0) {
        return;
      }

      const { error } = await supabase
        .from('group_coaching_resets')
        .insert(migrations);

      if (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }
};
