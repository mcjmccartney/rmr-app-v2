import { supabase } from '@/lib/supabase';
import { DogClubGuide } from '@/types';

// Convert database row to DogClubGuide type
function dbRowToDogClubGuide(row: Record<string, any>): DogClubGuide {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

export const dogClubGuidesService = {
  // Get all dog club guides
  async getAll(): Promise<DogClubGuide[]> {
    const { data, error } = await supabase
      .from('dog_club_guides')
      .select('*')
      .order('title');

    if (error) {
      console.error('Error fetching dog club guides:', error);
      throw error;
    }

    return data?.map(dbRowToDogClubGuide) || [];
  },

  // Create new dog club guide
  async create(guide: Omit<DogClubGuide, 'id' | 'createdAt' | 'updatedAt'>): Promise<DogClubGuide> {
    const { data, error } = await supabase
      .from('dog_club_guides')
      .insert({
        title: guide.title,
        url: guide.url
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dog club guide:', error);
      throw error;
    }

    return dbRowToDogClubGuide(data);
  },

  // Update existing dog club guide
  async update(id: string, updates: Partial<DogClubGuide>): Promise<DogClubGuide> {
    const { data, error } = await supabase
      .from('dog_club_guides')
      .update({
        title: updates.title,
        url: updates.url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dog club guide:', error);
      throw error;
    }

    return dbRowToDogClubGuide(data);
  },

  // Delete dog club guide
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('dog_club_guides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting dog club guide:', error);
      throw error;
    }
  },
};

