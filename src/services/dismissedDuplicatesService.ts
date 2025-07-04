import { supabase } from '@/lib/supabase';

export interface DismissedDuplicate {
  id: string;
  duplicateId: string;
  dismissedAt: string;
  createdAt?: string;
}

// Convert database row to DismissedDuplicate type
function dbRowToDismissedDuplicate(row: Record<string, any>): DismissedDuplicate {
  return {
    id: row.id,
    duplicateId: row.duplicate_id,
    dismissedAt: row.dismissed_at,
    createdAt: row.created_at,
  };
}

// Convert DismissedDuplicate to database row format
function dismissedDuplicateToDbRow(dismissedDuplicate: Partial<DismissedDuplicate>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (dismissedDuplicate.duplicateId !== undefined) dbRow.duplicate_id = dismissedDuplicate.duplicateId;
  if (dismissedDuplicate.dismissedAt !== undefined) dbRow.dismissed_at = dismissedDuplicate.dismissedAt;

  return dbRow;
}

export const dismissedDuplicatesService = {
  // Get all dismissed duplicate IDs
  async getAllDismissedIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('dismissed_duplicates')
        .select('duplicate_id')
        .order('dismissed_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(row => row.duplicate_id) || [];
    } catch (error) {
      return []; // Return empty array on error to not break duplicate detection
    }
  },

  // Check if a duplicate is dismissed
  async isDismissed(duplicateId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('dismissed_duplicates')
        .select('id')
        .eq('duplicate_id', duplicateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found = not dismissed
        }
        console.error('Error checking if duplicate is dismissed:', error);
        return false; // Return false on error to show duplicate
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check if duplicate is dismissed:', error);
      return false;
    }
  },

  // Dismiss a duplicate
  async dismiss(duplicateId: string): Promise<DismissedDuplicate> {
    try {
      console.log('💾 Dismissing duplicate in database:', duplicateId);

      const { data, error } = await supabase
        .from('dismissed_duplicates')
        .insert([{
          duplicate_id: duplicateId,
          dismissed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (duplicate already dismissed)
        if (error.code === '23505') {
          console.log('⚠️ Duplicate already dismissed:', duplicateId);
          // Return existing record
          const { data: existing } = await supabase
            .from('dismissed_duplicates')
            .select('*')
            .eq('duplicate_id', duplicateId)
            .single();
          
          return existing ? dbRowToDismissedDuplicate(existing) : {
            id: '',
            duplicateId,
            dismissedAt: new Date().toISOString()
          };
        }
        
        console.error('Error dismissing duplicate:', error);
        throw error;
      }

      console.log('✅ Successfully dismissed duplicate in database:', duplicateId);
      return dbRowToDismissedDuplicate(data);
    } catch (error) {
      console.error('Failed to dismiss duplicate:', error);
      throw error;
    }
  },

  // Un-dismiss a duplicate (for testing/debugging)
  async undismiss(duplicateId: string): Promise<void> {
    try {
      console.log('🔄 Un-dismissing duplicate:', duplicateId);

      const { error } = await supabase
        .from('dismissed_duplicates')
        .delete()
        .eq('duplicate_id', duplicateId);

      if (error) {
        console.error('Error un-dismissing duplicate:', error);
        throw error;
      }

      console.log('✅ Successfully un-dismissed duplicate:', duplicateId);
    } catch (error) {
      console.error('Failed to un-dismiss duplicate:', error);
      throw error;
    }
  },

  // Clear all dismissed duplicates (for testing/debugging)
  async clearAll(): Promise<void> {
    try {
      const { error } = await supabase
        .from('dismissed_duplicates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Get all dismissed duplicates with full details (for debugging)
  async getAll(): Promise<DismissedDuplicate[]> {
    try {
      const { data, error } = await supabase
        .from('dismissed_duplicates')
        .select('*')
        .order('dismissed_at', { ascending: false });

      if (error) {
        console.error('Error fetching all dismissed duplicates:', error);
        throw error;
      }

      return data?.map(dbRowToDismissedDuplicate) || [];
    } catch (error) {
      console.error('Failed to get all dismissed duplicates:', error);
      return [];
    }
  }
};
