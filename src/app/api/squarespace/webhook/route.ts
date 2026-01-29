import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { updateFutureSessionPricesForMember } from '@/utils/membershipPricing';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';
import crypto from 'crypto';

/**
 * Squarespace Order Webhook Handler
 * 
 * Receives order.create webhooks from Squarespace when membership payments are made.
 * Creates or updates Client records and creates Membership records.
 * 
 * Webhook URL: https://rmrcms.vercel.app/api/squarespace/webhook
 */

export async function POST(request: NextRequest) {
  try {
    // Verify Squarespace signature
    const signature = request.headers.get('squarespace-signature');
    const rawBody = await request.text();
    
    if (!verifySquarespaceSignature(rawBody, signature)) {
      console.error('[SQUARESPACE] Invalid signature');
      return addSecurityHeaders(NextResponse.json(
        { error: 'Unauthorized - Invalid signature' },
        { status: 401 }
      ));
    }

    // Parse the webhook payload
    const body = JSON.parse(rawBody);
    
    console.log('[SQUARESPACE] Webhook received:', {
      topic: body.topic,
      websiteId: body.websiteId,
      notificationId: body.id
    });

    // Only process order.create events
    if (body.topic !== 'order.create') {
      console.log('[SQUARESPACE] Ignoring non-order.create event:', body.topic);
      return addSecurityHeaders(NextResponse.json({
        success: true,
        message: 'Event ignored - not an order.create event'
      }));
    }

    // Extract order data
    const order = body.data;
    
    if (!order) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Missing order data' },
        { status: 400 }
      ));
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract and sanitize customer data
    const email = sanitizeEmail(order.customerEmail || '');
    const firstName = sanitizeString(order.billingAddress?.firstName || '');
    const lastName = sanitizeString(order.billingAddress?.lastName || '');
    const postcode = sanitizeString(order.billingAddress?.postalCode || '');
    const amountStr = order.grandTotal?.value || '0';
    const dateStr = order.createdOn || new Date().toISOString();

    // Validate required fields
    if (!email || !firstName || !lastName) {
      console.error('[SQUARESPACE] Missing required fields:', { email, firstName, lastName });
      return addSecurityHeaders(NextResponse.json(
        { error: 'Missing required customer data' },
        { status: 400 }
      ));
    }

    // Validate email
    if (!email.includes('@') || email.length > 254) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    // Parse and validate amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > 10000) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      ));
    }

    // Parse and validate date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      ));
    }

    console.log('[SQUARESPACE] Processing order:', {
      orderNumber: order.orderNumber,
      email,
      firstName,
      lastName,
      amount,
      date: date.toISOString()
    });

    // Find or create client
    let foundClientId = null;
    let clientWasCreated = false;

    try {
      // Step 1: Try to find existing client by email alias
      console.log('[SQUARESPACE] Step 1: Checking email aliases for:', email);
      foundClientId = await clientEmailAliasService.findClientByEmail(email);

      if (foundClientId) {
        console.log('[SQUARESPACE] ✅ Found existing client via email alias:', {
          email,
          clientId: foundClientId
        });
      }

      // Step 2: If not found via alias, try direct email match
      if (!foundClientId) {
        console.log('[SQUARESPACE] Step 2: Checking direct email match for:', email);
        const { data: directMatch, error: directError } = await supabase
          .from('clients')
          .select('id, address, first_name, last_name')
          .eq('email', email)
          .single();

        if (directMatch && !directError) {
          foundClientId = directMatch.id;
          console.log('[SQUARESPACE] ✅ Found existing client via direct email match:', {
            email,
            clientId: foundClientId,
            clientName: `${directMatch.first_name} ${directMatch.last_name}`
          });

          // Set up email alias for future payments to prevent duplicates
          try {
            await clientEmailAliasService.setupAliasesAfterMerge(
              directMatch.id,
              email,
              email
            );
            console.log('[SQUARESPACE] ✅ Email alias set up for future payments');
          } catch (aliasError) {
            console.error('[SQUARESPACE] ⚠️  Failed to set up email alias:', aliasError);
            // Continue anyway - client was found
          }
        } else {
          console.log('[SQUARESPACE] ℹ️  No existing client found for email:', email);
        }
      }

      // Step 3: If client exists, update their membership status
      if (foundClientId) {
        const { data: currentClient } = await supabase
          .from('clients')
          .select('address')
          .eq('id', foundClientId)
          .single();

        const updateData: { membership: boolean; active: boolean; address?: string } = {
          membership: true,
          active: true
        };

        // Add postcode to address if address is blank and postcode is provided
        if ((!currentClient?.address || currentClient.address.trim() === '') && postcode) {
          updateData.address = postcode;
        }

        const { error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', foundClientId);

        if (updateError) {
          console.error('[SQUARESPACE] Error updating client:', updateError);
        } else {
          console.log('[SQUARESPACE] Updated existing client membership status:', {
            clientId: foundClientId,
            email: email
          });
        }
      } else {
        // Step 4: No existing client - create new one
        console.log('[SQUARESPACE] ⚠️  No existing client found. Creating new client for:', {
          email,
          firstName,
          lastName
        });
        console.log('[SQUARESPACE] ⚠️  If this is a duplicate, please check email aliases!');

        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email,
            address: postcode || '',
            active: true,
            membership: true
          })
          .select();

        if (createError) {
          console.error('[SQUARESPACE] ❌ Error creating new client:', createError);
          // Don't throw - we'll still create the membership record
        } else if (newClient && newClient.length > 0) {
          foundClientId = newClient[0].id;
          clientWasCreated = true;
          console.log('[SQUARESPACE] ✅ Successfully created new client:', {
            email: email,
            firstName: firstName,
            lastName: lastName,
            clientId: newClient[0].id
          });

          // Set up email alias for the new client
          try {
            await clientEmailAliasService.setupAliasesAfterMerge(
              newClient[0].id,
              email,
              email
            );
            console.log('[SQUARESPACE] ✅ Email alias set up for new client');
          } catch (aliasError) {
            console.error('[SQUARESPACE] ⚠️  Failed to set up email alias for new client:', aliasError);
          }
        }
      }
    } catch (error) {
      console.error('[SQUARESPACE] Error finding/creating client:', error);
      // Don't throw - we'll still create the membership record
    }

    // Create membership record
    const membershipData = {
      email: email,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      amount: Number(amount)
    };

    const { data: membershipResult, error: membershipError } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select();

    if (membershipError) {
      console.error('[SQUARESPACE] Failed to create membership:', membershipError);
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to save membership to database' },
        { status: 500 }
      ));
    }

    console.log('[SQUARESPACE] Membership created successfully:', {
      email,
      amount,
      date: membershipData.date
    });

    // Update future session prices if client exists
    if (foundClientId) {
      try {
        console.log('[SQUARESPACE] Updating future session prices for member...');
        const { updatedCount } = await updateFutureSessionPricesForMember(
          foundClientId,
          membershipData.date
        );
        console.log(`[SQUARESPACE] ✅ Updated ${updatedCount} future session price(s)`);
      } catch (pricingError) {
        console.error('[SQUARESPACE] ⚠️  Failed to update future session prices:', pricingError);
        // Don't fail the webhook - membership was created successfully
      }
    }

    // Return success response
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Order processed successfully',
      data: {
        clientId: foundClientId,
        clientCreated: clientWasCreated,
        membershipCreated: true,
        orderNumber: order.orderNumber
      }
    }));

  } catch (error) {
    console.error('[SQUARESPACE] Webhook processing failed:', error);
    return addSecurityHeaders(NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

/**
 * Verify Squarespace webhook signature using HMAC-SHA256
 */
function verifySquarespaceSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    console.error('[SQUARESPACE] No signature provided');
    return false;
  }

  const secret = process.env.SQUARESPACE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[SQUARESPACE] SQUARESPACE_WEBHOOK_SECRET not configured');
    // In development, allow requests without signature verification
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SQUARESPACE] Allowing request in development mode');
      return true;
    }
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('base64');

    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );

    if (!isValid) {
      console.error('[SQUARESPACE] Signature mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('[SQUARESPACE] Error verifying signature:', error);
    return false;
  }
}

// Handle other HTTP methods
export async function GET() {
  return addSecurityHeaders(NextResponse.json(
    {
      message: 'Squarespace webhook endpoint',
      status: 'active',
      methods: ['POST']
    },
    { status: 200 }
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

