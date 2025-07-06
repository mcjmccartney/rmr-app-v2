import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from Make.com
    const body = await request.json();

    // Sanitize and validate inputs
    const email = sanitizeEmail(body.email || '');
    const dateStr = sanitizeString(body.date || '');
    const amountStr = sanitizeString(body.amount || '');

    // Validate required fields
    if (!email || !dateStr || !amountStr) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      ));
    }

    // Additional email validation
    if (!email.includes('@') || email.length > 254) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    // Validate amount is a positive number
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > 10000) { // Max £10,000 sanity check
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      ));
    }

    // Validate date format
    const date = new Date(dateStr);
    if (isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2030) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      ));
    }

    // Convert date to month format expected by database (e.g., "January 2024")
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    // Find client by email (including aliases) first
    let clientData = null;
    let clientError = null;
    let foundClientId = null;

    try {
      // First, try to find client by email alias
      foundClientId = await clientEmailAliasService.findClientByEmail(email);

      if (foundClientId) {
        // Update client using the found client ID
        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update({
            membership: true,
            active: true
          })
          .eq('id', foundClientId)
          .select();

        clientData = updatedClient;
        clientError = updateError;

        if (updatedClient && updatedClient.length > 0) {
          console.log('Successfully updated client via email alias:', {
            clientId: foundClientId,
            paymentEmail: email,
            clientEmail: updatedClient[0].email
          });
        }
      } else {
        // Fallback: try direct email match (for clients not yet in alias system)
        const { data: directMatch, error: directError } = await supabase
          .from('clients')
          .update({
            membership: true,
            active: true
          })
          .eq('email', email)
          .select();

        clientData = directMatch;
        clientError = directError;

        if (directMatch && directMatch.length > 0) {
          foundClientId = directMatch[0].id;
          console.log('Successfully updated client via direct email match:', email);

          // Set up email alias for future payments
          try {
            await clientEmailAliasService.setupAliasesAfterMerge(
              directMatch[0].id,
              directMatch[0].email,
              email
            );
            console.log('Email alias set up for future payments');
          } catch (aliasError) {
            console.error('Failed to set up email alias:', aliasError);
          }
        } else {
          console.log('No client found with email:', email);

          // Create a basic client profile for the new member
          try {
            // Extract first name, last name from email if possible, or use defaults
            const emailParts = email.split('@')[0];
            const nameParts = emailParts.split(/[._-]/);

            const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'New';
            const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Member';

            const { data: newClient, error: createError } = await supabase
              .from('clients')
              .insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
                postcode: body.postcode || '', // Use postcode from webhook if provided
                active: true,
                membership: true
              })
              .select();

            if (createError) {
              console.error('Error creating new client:', createError);
              clientError = createError;
            } else {
              clientData = newClient;
              foundClientId = newClient[0]?.id;
              console.log('Successfully created new client for member:', {
                email: email,
                firstName,
                lastName,
                clientId: newClient[0]?.id
              });
            }
          } catch (createClientError) {
            console.error('Error creating new client profile:', createClientError);
            clientError = createClientError;
          }
        }
      }
    } catch (error) {
      console.error('Error finding/updating client:', error);
      clientError = error;
    }

    // Now create the membership record (without client_id for now - database schema doesn't have it yet)
    const membershipData = {
      email: email, // Already sanitized and normalized
      month: monthYear, // Convert date to month format expected by database
      amount: amount,
      status: 'Paid', // Set status to Paid since this is a successful payment webhook
      payment_date: date.toISOString().split('T')[0] // Store just the date part (YYYY-MM-DD)
    };

    console.log('Inserting membership data:', membershipData);

    // First, let's check what columns actually exist in the memberships table
    const { data: tableInfo, error: tableError } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);

    console.log('Memberships table structure check:', { tableInfo, tableError });

    // Insert into Supabase memberships table
    const { data, error } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      console.error('Membership data that failed:', membershipData);
      return addSecurityHeaders(NextResponse.json(
        {
          error: 'Failed to save membership to database',
          details: error.message // Temporarily include error details for debugging
        },
        { status: 500 }
      ));
    }

    console.log('Successfully created membership:', data);

    if (clientError) {
      console.error('Error updating client membership and active status:', clientError);
      // Don't fail the webhook if client update fails - membership is still recorded
      console.log('Membership saved but client status not updated');
    }

    // Return success response
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Membership created successfully',
      membership: data[0],
      clientUpdated: clientData && clientData.length > 0
    }, { status: 201 }));

  } catch (error) {
    console.error('Webhook error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      ));
    }

    // Handle other errors - don't expose internal error details
    return addSecurityHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

// Handle other HTTP methods
export async function GET() {
  return addSecurityHeaders(NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  ));
}

export async function PUT() {
  return addSecurityHeaders(NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  ));
}

export async function DELETE() {
  return addSecurityHeaders(NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  ));
}
