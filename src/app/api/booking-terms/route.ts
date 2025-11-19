import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (bypasses RLS)
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BookingTerms {
  id: string;
  email: string;
  submitted: string;
  created_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check if booking terms already exist for this email
    const { data: existingBookingTerms, error: checkError } = await supabaseServiceRole
      .from('booking_terms')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Check if this is an update request (overwrite existing)
    const isUpdate = request.headers.get('x-booking-terms-update') === 'true';

    if (existingBookingTerms && !checkError && !isUpdate) {
      return NextResponse.json(
        { error: 'Booking terms have already been signed for this email address.' },
        { status: 400 }
      );
    }

    // Get the active version
    const { data: activeVersion } = await supabaseServiceRole
      .from('booking_terms_versions')
      .select('id')
      .eq('is_active', true)
      .single();

    let bookingTerms;
    let createError;

    if (existingBookingTerms && isUpdate) {
      // Update existing booking terms
      const { data: updatedBookingTerms, error: updateError } = await supabaseServiceRole
        .from('booking_terms')
        .update({
          submitted: new Date().toISOString(),
          version_id: activeVersion?.id || null
        })
        .eq('email', email.toLowerCase().trim())
        .select()
        .single();

      bookingTerms = updatedBookingTerms;
      createError = updateError;
    } else {
      // Create new booking terms entry
      const { data: newBookingTerms, error: insertError } = await supabaseServiceRole
        .from('booking_terms')
        .insert([{
          email: email.toLowerCase().trim(),
          submitted: new Date().toISOString(),
          version_id: activeVersion?.id || null
        }])
        .select()
        .single();

      bookingTerms = newBookingTerms;
      createError = insertError;
    }

    if (createError) throw createError;

    // Try to update client profile if exists (check main clients table)
    const { data: clientData, error: clientError } = await supabaseServiceRole
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (clientData && !clientError) {
      // Update client with booking terms signed status
      await supabaseServiceRole
        .from('clients')
        .update({
          booking_terms_signed: true,
          booking_terms_signed_date: new Date().toISOString()
        })
        .eq('id', clientData.id);
    } else {
      // Check email aliases table
      const { data: aliasData, error: aliasError } = await supabaseServiceRole
        .from('client_email_aliases')
        .select('client_id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (aliasData && !aliasError) {
        // Update client via alias
        await supabaseServiceRole
          .from('clients')
          .update({
            booking_terms_signed: true,
            booking_terms_signed_date: new Date().toISOString()
          })
          .eq('id', aliasData.client_id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      bookingTerms: bookingTerms 
    });

  } catch (error) {
    console.error('Error submitting booking terms:', error);
    
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Booking terms have already been signed for this email address.';
      } else if (error.message.includes('violates not-null constraint')) {
        errorMessage = 'Email address is required.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check if booking terms exist for an email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Check if booking terms exist for this email
    const { data: bookingTerms, error } = await supabaseServiceRole
      .from('booking_terms')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ 
      exists: !!bookingTerms,
      bookingTerms: bookingTerms || null
    });

  } catch (error) {
    console.error('Error checking booking terms:', error);
    return NextResponse.json(
      { error: 'Error checking booking terms status' },
      { status: 500 }
    );
  }
}
