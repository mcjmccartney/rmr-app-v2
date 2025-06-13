import { supabase } from '@/lib/supabase';
import { BehaviourQuestionnaire } from '@/types';

// Convert database row to BehaviourQuestionnaire type
function dbRowToBehaviourQuestionnaire(row: Record<string, any>): BehaviourQuestionnaire {
  return {
    id: row.id,
    clientId: row.client_id,
    ownerFirstName: row.owner_first_name,
    ownerLastName: row.owner_last_name,
    email: row.email,
    contactNumber: row.contact_number,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    stateProvince: row.state_province,
    zipPostalCode: row.zip_postal_code,
    country: row.country,
    howDidYouHear: row.how_did_you_hear,
    dogName: row.dog_name,
    age: row.age,
    sex: row.sex,
    breed: row.breed,
    neuteredSpayed: row.neutered_spayed,
    mainHelp: row.main_help,
    firstNoticed: row.first_noticed,
    whenWhereHow: row.when_where_how,
    recentChange: row.recent_change,
    canAnticipate: row.can_anticipate,
    whyThinking: row.why_thinking,
    whatDoneSoFar: row.what_done_so_far,
    idealGoal: row.ideal_goal,
    anythingElse: row.anything_else,
    medicalHistory: row.medical_history,
    vetAdvice: row.vet_advice,
    whereGotDog: row.where_got_dog,
    rescueBackground: row.rescue_background,
    submittedAt: new Date(row.submitted_at)
  };
}

// Convert BehaviourQuestionnaire to database row
function behaviourQuestionnaireToDbRow(questionnaire: Partial<BehaviourQuestionnaire>): Record<string, any> {
  const row: Record<string, any> = {};
  
  if (questionnaire.id !== undefined) row.id = questionnaire.id;
  if (questionnaire.clientId !== undefined) row.client_id = questionnaire.clientId;
  if (questionnaire.ownerFirstName !== undefined) row.owner_first_name = questionnaire.ownerFirstName;
  if (questionnaire.ownerLastName !== undefined) row.owner_last_name = questionnaire.ownerLastName;
  if (questionnaire.email !== undefined) row.email = questionnaire.email;
  if (questionnaire.contactNumber !== undefined) row.contact_number = questionnaire.contactNumber;
  if (questionnaire.address1 !== undefined) row.address1 = questionnaire.address1;
  if (questionnaire.address2 !== undefined) row.address2 = questionnaire.address2;
  if (questionnaire.city !== undefined) row.city = questionnaire.city;
  if (questionnaire.stateProvince !== undefined) row.state_province = questionnaire.stateProvince;
  if (questionnaire.zipPostalCode !== undefined) row.zip_postal_code = questionnaire.zipPostalCode;
  if (questionnaire.country !== undefined) row.country = questionnaire.country;
  if (questionnaire.howDidYouHear !== undefined) row.how_did_you_hear = questionnaire.howDidYouHear;
  if (questionnaire.dogName !== undefined) row.dog_name = questionnaire.dogName;
  if (questionnaire.age !== undefined) row.age = questionnaire.age;
  if (questionnaire.sex !== undefined) row.sex = questionnaire.sex;
  if (questionnaire.breed !== undefined) row.breed = questionnaire.breed;
  if (questionnaire.neuteredSpayed !== undefined) row.neutered_spayed = questionnaire.neuteredSpayed;
  if (questionnaire.mainHelp !== undefined) row.main_help = questionnaire.mainHelp;
  if (questionnaire.firstNoticed !== undefined) row.first_noticed = questionnaire.firstNoticed;
  if (questionnaire.whenWhereHow !== undefined) row.when_where_how = questionnaire.whenWhereHow;
  if (questionnaire.recentChange !== undefined) row.recent_change = questionnaire.recentChange;
  if (questionnaire.canAnticipate !== undefined) row.can_anticipate = questionnaire.canAnticipate;
  if (questionnaire.whyThinking !== undefined) row.why_thinking = questionnaire.whyThinking;
  if (questionnaire.whatDoneSoFar !== undefined) row.what_done_so_far = questionnaire.whatDoneSoFar;
  if (questionnaire.idealGoal !== undefined) row.ideal_goal = questionnaire.idealGoal;
  if (questionnaire.anythingElse !== undefined) row.anything_else = questionnaire.anythingElse;
  if (questionnaire.medicalHistory !== undefined) row.medical_history = questionnaire.medicalHistory;
  if (questionnaire.vetAdvice !== undefined) row.vet_advice = questionnaire.vetAdvice;
  if (questionnaire.whereGotDog !== undefined) row.where_got_dog = questionnaire.whereGotDog;
  if (questionnaire.rescueBackground !== undefined) row.rescue_background = questionnaire.rescueBackground;
  if (questionnaire.submittedAt !== undefined) row.submitted_at = questionnaire.submittedAt.toISOString();

  return row;
}

export const behaviourQuestionnaireService = {
  // Get all behaviour questionnaires
  async getAll(): Promise<BehaviourQuestionnaire[]> {
    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching behaviour questionnaires:', error);
      throw error;
    }

    return data?.map(dbRowToBehaviourQuestionnaire) || [];
  },

  // Get behaviour questionnaire by ID
  async getById(id: string): Promise<BehaviourQuestionnaire | null> {
    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching behaviour questionnaire:', error);
      throw error;
    }

    return data ? dbRowToBehaviourQuestionnaire(data) : null;
  },

  // Get behaviour questionnaires by email
  async getByEmail(email: string): Promise<BehaviourQuestionnaire[]> {
    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching behaviour questionnaires by email:', error);
      throw error;
    }

    return data?.map(dbRowToBehaviourQuestionnaire) || [];
  },

  // Get behaviour questionnaire by email and dog name
  async getByEmailAndDogName(email: string, dogName: string): Promise<BehaviourQuestionnaire | null> {
    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('dog_name', dogName.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching behaviour questionnaire by email and dog name:', error);
      throw error;
    }

    return data ? dbRowToBehaviourQuestionnaire(data) : null;
  },

  // Create new behaviour questionnaire
  async create(questionnaire: Omit<BehaviourQuestionnaire, 'submittedAt'>): Promise<BehaviourQuestionnaire> {
    const dbRow = behaviourQuestionnaireToDbRow({
      ...questionnaire,
      submittedAt: new Date()
    });

    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating behaviour questionnaire:', error);
      throw error;
    }

    return dbRowToBehaviourQuestionnaire(data);
  },

  // Update existing behaviour questionnaire
  async update(id: string, updates: Partial<BehaviourQuestionnaire>): Promise<BehaviourQuestionnaire> {
    const dbRow = behaviourQuestionnaireToDbRow(updates);

    const { data, error } = await supabase
      .from('behaviour_questionnaires')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating behaviour questionnaire:', error);
      throw error;
    }

    return dbRowToBehaviourQuestionnaire(data);
  },

  // Delete behaviour questionnaire
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('behaviour_questionnaires')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting behaviour questionnaire:', error);
      throw error;
    }
  }
};
