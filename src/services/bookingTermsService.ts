import { supabase } from '@/lib/supabase';

export interface BookingTerms {
  id: string;
  email: string;
  submitted: string;
  created_at?: string;
}

export const bookingTermsService = {
  // Create new booking terms entry
  async create(data: { email: string }): Promise<BookingTerms> {
    const { data: result, error } = await supabase
      .from('booking_terms')
      .insert([{
        email: data.email.toLowerCase().trim(),
        submitted: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  },

  // Get booking terms by email
  async getByEmail(email: string): Promise<BookingTerms | null> {
    const { data, error } = await supabase
      .from('booking_terms')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching booking terms:', error);
      throw error;
    }

    return data;
  },

  // Get all booking terms
  async getAll(): Promise<BookingTerms[]> {
    const { data, error } = await supabase
      .from('booking_terms')
      .select('*')
      .order('submitted', { ascending: false });

    if (error) {
      console.error('Error fetching all booking terms:', error);
      throw error;
    }

    return data || [];
  },

  // Update client profile to indicate booking terms signed (deprecated - now using booking_terms table)
  async updateClientBookingTermsStatus(email: string): Promise<void> {
    console.log('updateClientBookingTermsStatus called but deprecated - booking terms are now tracked in separate table');
    // This method is kept for backward compatibility but does nothing
    // The booking terms are now tracked in the booking_terms table
  },

  // Update existing booking terms
  async update(id: string, updates: Partial<BookingTerms>): Promise<BookingTerms> {
    const { data, error } = await supabase
      .from('booking_terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking terms:', error);
      throw error;
    }

    return data;
  },

  // Submit booking terms and update client profile
  async submitAndUpdateClient(data: { email: string }): Promise<BookingTerms> {
    // Create booking terms entry
    const bookingTerms = await this.create(data);

    // Update client profile if exists
    await this.updateClientBookingTermsStatus(data.email);

    return bookingTerms;
  }
};
