import { supabase } from '@/lib/supabase';
import { BehaviouralBrief } from '@/types';

// Convert database row to BehaviouralBrief type
function dbRowToBehaviouralBrief(row: Record<string, any>): BehaviouralBrief {
  return {
    id: row.id,
    clientId: row.client_id,
    ownerFirstName: row.owner_first_name,
    ownerLastName: row.owner_last_name,
    email: row.email,
    contactNumber: row.contact_number,
    postcode: row.postcode,
    dogName: row.dog_name,
    sex: row.sex,
    breed: row.breed,
    lifeWithDog: row.life_with_dog,
    bestOutcome: row.best_outcome,
    sessionType: row.session_type,
    submittedAt: new Date(row.submitted_at)
  };
}

// Convert BehaviouralBrief to database row
function behaviouralBriefToDbRow(brief: Partial<BehaviouralBrief>): Record<string, any> {
  const row: Record<string, any> = {};
  
  if (brief.id !== undefined) row.id = brief.id;
  if (brief.clientId !== undefined) row.client_id = brief.clientId;
  if (brief.ownerFirstName !== undefined) row.owner_first_name = brief.ownerFirstName;
  if (brief.ownerLastName !== undefined) row.owner_last_name = brief.ownerLastName;
  if (brief.email !== undefined) row.email = brief.email;
  if (brief.contactNumber !== undefined) row.contact_number = brief.contactNumber;
  if (brief.postcode !== undefined) row.postcode = brief.postcode;
  if (brief.dogName !== undefined) row.dog_name = brief.dogName;
  if (brief.sex !== undefined) row.sex = brief.sex;
  if (brief.breed !== undefined) row.breed = brief.breed;
  if (brief.lifeWithDog !== undefined) row.life_with_dog = brief.lifeWithDog;
  if (brief.bestOutcome !== undefined) row.best_outcome = brief.bestOutcome;
  if (brief.sessionType !== undefined) row.session_type = brief.sessionType;
  if (brief.submittedAt !== undefined) row.submitted_at = brief.submittedAt.toISOString();

  return row;
}

export const behaviouralBriefService = {
  // Get all behavioural briefs
  async getAll(): Promise<BehaviouralBrief[]> {
    const { data, error } = await supabase
      .from('behavioural_briefs')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching behavioural briefs:', error);
      throw error;
    }

    return data?.map(dbRowToBehaviouralBrief) || [];
  },

  // Get behavioural brief by ID
  async getById(id: string): Promise<BehaviouralBrief | null> {
    const { data, error } = await supabase
      .from('behavioural_briefs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching behavioural brief:', error);
      throw error;
    }

    return data ? dbRowToBehaviouralBrief(data) : null;
  },

  // Get behavioural briefs by email
  async getByEmail(email: string): Promise<BehaviouralBrief[]> {
    const { data, error } = await supabase
      .from('behavioural_briefs')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching behavioural briefs by email:', error);
      throw error;
    }

    return data?.map(dbRowToBehaviouralBrief) || [];
  },

  // Create new behavioural brief
  async create(brief: Omit<BehaviouralBrief, 'submittedAt'>): Promise<BehaviouralBrief> {
    const dbRow = behaviouralBriefToDbRow({
      ...brief,
      submittedAt: new Date()
    });

    const { data, error } = await supabase
      .from('behavioural_briefs')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating behavioural brief:', error);
      throw error;
    }

    return dbRowToBehaviouralBrief(data);
  },

  // Update existing behavioural brief
  async update(id: string, updates: Partial<BehaviouralBrief>): Promise<BehaviouralBrief> {
    const dbRow = behaviouralBriefToDbRow(updates);

    const { data, error } = await supabase
      .from('behavioural_briefs')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating behavioural brief:', error);
      throw error;
    }

    return dbRowToBehaviouralBrief(data);
  },

  // Delete behavioural brief
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('behavioural_briefs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting behavioural brief:', error);
      throw error;
    }
  }
};
