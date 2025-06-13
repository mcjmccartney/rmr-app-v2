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
      console.error('Error creating booking terms:', error);
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

  // Update client profile to indicate booking terms signed
  async updateClientBookingTermsStatus(email: string): Promise<void> {
    try {
      // First, check if client exists with this email
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (clientError) {
        if (clientError.code === 'PGRST116') {
          console.log('No client found with email:', email);
          return; // Client doesn't exist yet, that's okay
        }
        throw clientError;
      }

      // Update client to indicate booking terms signed
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          booking_terms_signed: true,
          booking_terms_signed_date: new Date().toISOString()
        })
        .eq('id', client.id);

      if (updateError) {
        console.error('Error updating client booking terms status:', updateError);
        throw updateError;
      }

      console.log('Successfully updated client booking terms status for:', email);
    } catch (error) {
      console.error('Error in updateClientBookingTermsStatus:', error);
      // Don't throw error - booking terms submission should succeed even if client update fails
    }
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
