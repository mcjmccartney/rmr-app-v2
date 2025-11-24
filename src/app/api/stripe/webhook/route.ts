import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication
    if (!verifyWebhookApiKey(request)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the JSON body from Make.com
    const body = await request.json();

    // Sanitize and validate inputs
    const email = sanitizeEmail(body.email || '');
    const dateStr = sanitizeString(body.date || '');
    const amountStr = sanitizeString(body.amount || '');
    const postcode = sanitizeString(body.postcode || '');

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

    // Find client by email (including aliases) first
    let clientData = null;
    let clientError = null;
    let foundClientId = null;

    try {
      // First, try to find client by email alias
      foundClientId = await clientEmailAliasService.findClientByEmail(email);

      if (foundClientId) {
        // First, get current client to check address status
        const { data: currentClient } = await supabase
          .from('clients')
          .select('address')
          .eq('id', foundClientId)
          .single();

        // Prepare update object
        const updateData: { membership: boolean; active: boolean; address?: string } = {
          membership: true,
          active: true
        };

        // Add postcode to address if address is blank and postcode is provided
        if ((!currentClient?.address || currentClient.address.trim() === '') && postcode) {
          updateData.address = postcode;
        }

        // Update client using the found client ID
        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update(updateData)
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
        // First, get current client to check address status
        const { data: currentClient } = await supabase
          .from('clients')
          .select('address')
          .eq('email', email)
          .single();

        // Prepare update object
        const updateData: { membership: boolean; active: boolean; address?: string } = {
          membership: true,
          active: true
        };

        // Add postcode to address if address is blank and postcode is provided
        if ((!currentClient?.address || currentClient.address.trim() === '') && postcode) {
          updateData.address = postcode;
        }

        // Fallback: try direct email match (for clients not yet in alias system)
        const { data: directMatch, error: directError } = await supabase
          .from('clients')
          .update(updateData)
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
                address: postcode || '', // Use address field instead of non-existent postcode field
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

    // Now create the membership record matching the actual database structure
    const membershipData = {
      email: email, // Already sanitized and normalized
      date: date.toISOString().split('T')[0], // Store just the date part (YYYY-MM-DD)
      amount: Number(amount) // Ensure amount is a number for the numeric column
    };



    // Insert into Supabase memberships table
    const { data, error } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select();

    if (error) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to save membership to database' },
        { status: 500 }
      ));
    }

    if (clientError) {
      // Don't fail the webhook if client update fails - membership is still recorded
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
