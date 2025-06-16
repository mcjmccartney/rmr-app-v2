import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from Make.com
    const body = await request.json();
    
    console.log('Received webhook data:', body);

    // Validate required fields
    if (!body.email || !body.date || !body.amount) {
      console.error('Missing required fields:', { email: body.email, date: body.date, amount: body.amount });
      return NextResponse.json(
        { error: 'Missing required fields: email, date, and amount are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.error('Invalid email format:', body.email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', body.amount);
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate date format
    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', body.date);
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Prepare membership data for Supabase
    const membershipData = {
      email: body.email.toLowerCase().trim(), // Normalize email
      date: date.toISOString(), // Ensure proper ISO format
      amount: amount
    };

    console.log('Inserting membership data:', membershipData);

    // Insert into Supabase memberships table
    const { data, error } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save membership to database',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('Successfully created membership:', data);

    // Find client by email (including aliases) and update membership status
    let clientData = null;
    let clientError = null;

    try {
      // First, try to find client by email alias
      const clientId = await clientEmailAliasService.findClientByEmail(membershipData.email);

      if (clientId) {
        // Update client using the found client ID
        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update({
            membership: true,
            active: true
          })
          .eq('id', clientId)
          .select();

        clientData = updatedClient;
        clientError = updateError;

        if (updatedClient && updatedClient.length > 0) {
          console.log('Successfully updated client via email alias:', {
            clientId,
            paymentEmail: membershipData.email,
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
          .eq('email', membershipData.email)
          .select();

        clientData = directMatch;
        clientError = directError;

        if (directMatch && directMatch.length > 0) {
          console.log('Successfully updated client via direct email match:', membershipData.email);

          // Set up email alias for future payments
          try {
            await clientEmailAliasService.setupAliasesAfterMerge(
              directMatch[0].id,
              directMatch[0].email,
              membershipData.email
            );
            console.log('Email alias set up for future payments');
          } catch (aliasError) {
            console.error('Failed to set up email alias:', aliasError);
          }
        } else {
          console.log('No client found with email:', membershipData.email);
        }
      }
    } catch (error) {
      console.error('Error finding/updating client:', error);
      clientError = error;
    }

    if (clientError) {
      console.error('Error updating client membership and active status:', clientError);
      // Don't fail the webhook if client update fails - membership is still recorded
      console.log('Membership saved but client status not updated');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Membership created successfully',
      membership: data[0],
      clientUpdated: clientData && clientData.length > 0
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Stripe webhook endpoint - POST only' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
