import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

/**
 * Squarespace Historical Order Import
 *
 * Fetches orders from Squarespace and creates client and membership records.
 * Can be used for historical imports or automated polling for new orders.
 *
 * Process:
 * 1. Fetch Squarespace orders (all or filtered by date)
 * 2. For each order email, check if client exists (via clients.email or client_email_aliases)
 * 3. If no client exists, create one with real name and email from Squarespace
 * 4. Check if membership record exists for this order
 * 5. If no membership exists, create one
 * 6. Update client membership status
 *
 * Usage: POST /api/squarespace/import-historical
 * Headers: x-api-key: YOUR_WEBHOOK_API_KEY
 *
 * Optional query params:
 * - dryRun=true : Preview what would be imported without making changes
 * - limit=50 : Limit number of orders to process (default: all)
 * - modifiedAfter=2026-01-20T00:00:00Z : Only fetch orders modified after this date (ISO 8601 format)
 */

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyWebhookApiKey(request)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const limit = parseInt(searchParams.get('limit') || '0') || undefined;
    const modifiedAfter = searchParams.get('modifiedAfter') || undefined;

    console.log('[SQUARESPACE-IMPORT] Starting historical import...', { dryRun, limit, modifiedAfter });

    // Check for required environment variables
    const squarespaceApiKey = process.env.SQUARESPACE_API_KEY;
    if (!squarespaceApiKey) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'SQUARESPACE_API_KEY not configured' },
        { status: 500 }
      ));
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch orders from Squarespace
    console.log('[SQUARESPACE-IMPORT] Fetching orders from Squarespace...');
    
    let allOrders: any[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      // Build URL with optional date filter
      let url: string;
      if (cursor) {
        url = `https://api.squarespace.com/1.0/commerce/orders?cursor=${cursor}`;
      } else if (modifiedAfter) {
        // Squarespace requires both modifiedAfter and modifiedBefore
        const modifiedBefore = new Date().toISOString();
        url = `https://api.squarespace.com/1.0/commerce/orders?modifiedAfter=${modifiedAfter}&modifiedBefore=${modifiedBefore}`;
      } else {
        url = 'https://api.squarespace.com/1.0/commerce/orders';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${squarespaceApiKey}`,
          'User-Agent': 'RMR-CMS/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SQUARESPACE-IMPORT] API error:', response.status, errorText);
        return addSecurityHeaders(NextResponse.json(
          { error: `Squarespace API error: ${response.status}` },
          { status: 500 }
        ));
      }

      const data = await response.json();
      allOrders = allOrders.concat(data.result || []);
      
      cursor = data.pagination?.nextPageCursor || null;
      hasMore = !!cursor;

      console.log(`[SQUARESPACE-IMPORT] Fetched ${allOrders.length} orders so far...`);

      // Apply limit if specified
      if (limit && allOrders.length >= limit) {
        allOrders = allOrders.slice(0, limit);
        hasMore = false;
      }
    }

    console.log(`[SQUARESPACE-IMPORT] Total orders fetched: ${allOrders.length}`);

    // Get existing clients (we'll check aliases separately for each email)
    const { data: existingClients } = await supabase
      .from('clients')
      .select('email, id');

    console.log(`[SQUARESPACE-IMPORT] Found ${existingClients?.length || 0} existing clients`);

    // Get existing memberships to check for duplicates
    const { data: existingMemberships } = await supabase
      .from('memberships')
      .select('email, date, id');

    console.log(`[SQUARESPACE-IMPORT] Found ${existingMemberships?.length || 0} existing memberships`);

    // Process orders
    const stats = {
      totalOrders: allOrders.length,
      clientsToCreate: 0,
      clientsAlreadyExist: 0,
      membershipsToCreate: 0,
      membershipsAlreadyExist: 0,
      errors: 0
    };

    const clientsToCreate: any[] = [];
    const membershipsToCreate: any[] = [];
    const emailsToCreate = new Set<string>(); // Track emails we're creating to avoid duplicates
    const membershipKeys = new Set<string>(); // Track membership email+date combos to avoid duplicates
    const errors: any[] = [];

    for (const order of allOrders) {
      try {
        const email = sanitizeEmail(order.customerEmail || '');
        const firstName = sanitizeString(order.billingAddress?.firstName || '');
        const lastName = sanitizeString(order.billingAddress?.lastName || '');
        const postcode = sanitizeString(order.billingAddress?.postalCode || '');
        const amount = parseFloat(order.grandTotal?.value || '0');
        const orderDate = new Date(order.createdOn || new Date());

        // Skip invalid orders
        if (!email || !firstName || !lastName) {
          console.warn('[SQUARESPACE-IMPORT] Skipping invalid order:', order.orderNumber);
          continue;
        }

        // Skip orders with invalid amounts
        if (isNaN(amount) || amount <= 0) {
          console.warn('[SQUARESPACE-IMPORT] Skipping order with invalid amount:', order.orderNumber);
          continue;
        }

        const emailLower = email.toLowerCase();
        const orderDateStr = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if client exists (check both clients table and email aliases)
        let existingClientId = await clientEmailAliasService.findClientByEmail(emailLower);

        // If not found in aliases, check clients.email directly
        if (!existingClientId) {
          const clientByEmail = existingClients?.find(c => c.email?.toLowerCase() === emailLower);
          existingClientId = clientByEmail?.id || null;
        }

        if (!existingClientId && !emailsToCreate.has(emailLower)) {
          // Client doesn't exist - add to creation list
          stats.clientsToCreate++;
          clientsToCreate.push({
            first_name: firstName,
            last_name: lastName,
            dog_name: '', // Placeholder - will be updated when client adds their dog
            email: email,
            address: postcode || '',
            active: true,
            membership: true
          });
          emailsToCreate.add(emailLower); // Prevent duplicates in this batch
        } else {
          stats.clientsAlreadyExist++;
        }

        // Check if membership record exists for this email + date combination
        const membershipKey = `${emailLower}|${orderDateStr}`;
        const existingMembership = existingMemberships?.find(
          m => m.email?.toLowerCase() === emailLower && m.date === orderDateStr
        );

        console.log(`[SQUARESPACE-IMPORT] Checking membership for ${email} on ${orderDateStr}:`, {
          membershipKey,
          existingMembership: existingMembership ? `Found ID ${existingMembership.id}` : 'Not found',
          inCurrentBatch: membershipKeys.has(membershipKey)
        });

        if (!existingMembership && !membershipKeys.has(membershipKey)) {
          // Membership doesn't exist - add to creation list
          stats.membershipsToCreate++;
          membershipsToCreate.push({
            email: email,
            date: orderDateStr,
            amount: amount
          });
          membershipKeys.add(membershipKey); // Prevent duplicates in this batch
          console.log(`[SQUARESPACE-IMPORT] Will create membership for ${email} on ${orderDateStr}`);
        } else {
          stats.membershipsAlreadyExist++;
          console.log(`[SQUARESPACE-IMPORT] Skipping duplicate membership for ${email} on ${orderDateStr}`);
        }

      } catch (error) {
        stats.errors++;
        errors.push({
          orderNumber: order.orderNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error('[SQUARESPACE-IMPORT] Error processing order:', order.orderNumber, error);
      }
    }

    // If dry run, just return stats
    if (dryRun) {
      console.log('[SQUARESPACE-IMPORT] Dry run complete - no changes made');
      return addSecurityHeaders(NextResponse.json({
        success: true,
        dryRun: true,
        stats,
        preview: {
          clientsToCreate: clientsToCreate.slice(0, 10),
          membershipsToCreate: membershipsToCreate.slice(0, 10)
        },
        errors: errors.slice(0, 10)
      }));
    }

    // Create clients in batches
    let clientsCreated = 0;

    if (clientsToCreate.length > 0) {
      console.log(`[SQUARESPACE-IMPORT] Creating ${clientsToCreate.length} clients...`);

      // Batch insert (Supabase handles up to 1000 rows per insert)
      const batchSize = 100;
      for (let i = 0; i < clientsToCreate.length; i += batchSize) {
        const batch = clientsToCreate.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('clients')
          .insert(batch)
          .select('id, email');

        if (error) {
          console.error('[SQUARESPACE-IMPORT] Error creating clients batch:', error);
          console.error('[SQUARESPACE-IMPORT] Error details:', JSON.stringify(error, null, 2));
          console.error('[SQUARESPACE-IMPORT] Failed batch sample:', JSON.stringify(batch.slice(0, 2), null, 2));
          stats.errors++;
          errors.push({
            type: 'client_creation',
            error: error.message,
            details: error.details || error.hint || 'No additional details'
          });
        } else {
          clientsCreated += data?.length || 0;
          console.log(`[SQUARESPACE-IMPORT] Successfully created ${data?.length || 0} clients in this batch`);
        }
      }
      console.log(`[SQUARESPACE-IMPORT] Created ${clientsCreated} clients`);
    }

    // Create memberships in batches
    let membershipsCreated = 0;

    if (membershipsToCreate.length > 0) {
      console.log(`[SQUARESPACE-IMPORT] Creating ${membershipsToCreate.length} memberships...`);

      // Batch insert (Supabase handles up to 1000 rows per insert)
      const batchSize = 100;
      for (let i = 0; i < membershipsToCreate.length; i += batchSize) {
        const batch = membershipsToCreate.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('memberships')
          .insert(batch)
          .select('id, email, date');

        if (error) {
          console.error('[SQUARESPACE-IMPORT] Error creating memberships batch:', error);
          console.error('[SQUARESPACE-IMPORT] Error details:', JSON.stringify(error, null, 2));
          console.error('[SQUARESPACE-IMPORT] Failed batch sample:', JSON.stringify(batch.slice(0, 2), null, 2));
          stats.errors++;
          errors.push({
            type: 'membership_creation',
            error: error.message,
            details: error.details || error.hint || 'No additional details'
          });
        } else {
          membershipsCreated += data?.length || 0;
          console.log(`[SQUARESPACE-IMPORT] Successfully created ${data?.length || 0} memberships in this batch`);
        }
      }
      console.log(`[SQUARESPACE-IMPORT] Created ${membershipsCreated} memberships`);
    }

    // Update client membership statuses based on new memberships
    if (membershipsCreated > 0) {
      console.log('[SQUARESPACE-IMPORT] Updating client membership statuses...');

      // Get unique emails from created memberships
      const uniqueEmails = [...new Set(membershipsToCreate.map(m => m.email.toLowerCase()))];

      for (const email of uniqueEmails) {
        try {
          // Update client to membership: true
          const { error: updateError } = await supabase
            .from('clients')
            .update({ membership: true })
            .eq('email', email);

          if (updateError) {
            console.error(`[SQUARESPACE-IMPORT] Error updating membership status for ${email}:`, updateError);
          }
        } catch (updateErr) {
          console.error(`[SQUARESPACE-IMPORT] Error updating client ${email}:`, updateErr);
        }
      }

      console.log(`[SQUARESPACE-IMPORT] Updated membership status for ${uniqueEmails.length} clients`);
    }

    // Return results
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Import completed - clients and memberships created',
      stats: {
        ...stats,
        clientsActuallyCreated: clientsCreated,
        membershipsActuallyCreated: membershipsCreated
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    }));

  } catch (error) {
    console.error('[SQUARESPACE-IMPORT] Import failed:', error);
    return addSecurityHeaders(NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

// GET endpoint for status/help
export async function GET() {
  return addSecurityHeaders(NextResponse.json({
    message: 'Squarespace Order Import Endpoint',
    usage: {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_WEBHOOK_API_KEY'
      },
      queryParams: {
        dryRun: 'true/false - Preview without making changes (default: false)',
        limit: 'number - Limit orders to process (default: all)',
        modifiedAfter: 'ISO 8601 date - Only fetch orders modified after this date (e.g., 2026-01-20T00:00:00Z)'
      }
    },
    examples: {
      dryRun: '/api/squarespace/import-historical?dryRun=true',
      limited: '/api/squarespace/import-historical?limit=50',
      recent: '/api/squarespace/import-historical?modifiedAfter=2026-01-20T00:00:00Z',
      full: '/api/squarespace/import-historical'
    },
    description: 'Fetches orders from Squarespace and creates client and membership records. Use modifiedAfter for automated polling of recent orders.'
  }));
}

