import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

/**
 * Squarespace Historical Order Import
 *
 * Fetches all past orders from Squarespace and creates client records
 * for customers who don't exist yet. Memberships already exist in the
 * database (created by n8n) and are linked to clients by email matching.
 *
 * Process:
 * 1. Fetch all Squarespace orders
 * 2. For each order email, check if client exists (via email or alias)
 * 3. If no client exists, create one with real name from Squarespace
 * 4. Add email to client_email_aliases table
 * 5. Existing memberships automatically link via email matching
 *
 * Usage: POST /api/squarespace/import-historical
 * Headers: x-api-key: YOUR_WEBHOOK_API_KEY
 *
 * Optional query params:
 * - dryRun=true : Preview what would be imported without making changes
 * - limit=50 : Limit number of orders to process (default: all)
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

    console.log('[SQUARESPACE-IMPORT] Starting historical import...', { dryRun, limit });

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
      const url: string = cursor
        ? `https://api.squarespace.com/1.0/commerce/orders?cursor=${cursor}`
        : 'https://api.squarespace.com/1.0/commerce/orders';

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

    // Process orders
    const stats = {
      totalOrders: allOrders.length,
      clientsToCreate: 0,
      clientsAlreadyExist: 0,
      emailAliasesCreated: 0,
      errors: 0
    };

    const clientsToCreate: any[] = [];
    const emailsToCreate = new Set<string>(); // Track emails we're creating to avoid duplicates
    const errors: any[] = [];

    for (const order of allOrders) {
      try {
        const email = sanitizeEmail(order.customerEmail || '');
        const firstName = sanitizeString(order.billingAddress?.firstName || '');
        const lastName = sanitizeString(order.billingAddress?.lastName || '');
        const postcode = sanitizeString(order.billingAddress?.postalCode || '');

        // Skip invalid orders
        if (!email || !firstName || !lastName) {
          console.warn('[SQUARESPACE-IMPORT] Skipping invalid order:', order.orderNumber);
          continue;
        }

        const emailLower = email.toLowerCase();

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
            email: email,
            address: postcode || '',
            active: true,
            membership: true
          });
          emailsToCreate.add(emailLower); // Prevent duplicates in this batch
        } else {
          stats.clientsAlreadyExist++;
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
          clientsToCreate: clientsToCreate.slice(0, 10)
        },
        errors: errors.slice(0, 10)
      }));
    }

    // Create clients and email aliases in batches
    let clientsCreated = 0;
    let aliasesCreated = 0;

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
        } else {
          clientsCreated += data?.length || 0;

          // Create email aliases for each new client
          if (data) {
            for (const client of data) {
              if (client.email) {
                try {
                  // Add email as primary alias
                  await clientEmailAliasService.addAlias(client.id, client.email, true);
                  aliasesCreated++;
                } catch (aliasError) {
                  console.error('[SQUARESPACE-IMPORT] Error creating email alias:', aliasError);
                }
              }
            }
          }
        }
      }
      console.log(`[SQUARESPACE-IMPORT] Created ${clientsCreated} clients`);
      console.log(`[SQUARESPACE-IMPORT] Created ${aliasesCreated} email aliases`);
    }

    // Update final stats
    stats.emailAliasesCreated = aliasesCreated;

    // Return results
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Historical import completed - clients created and linked to existing memberships by email',
      stats: {
        ...stats,
        clientsActuallyCreated: clientsCreated,
        emailAliasesActuallyCreated: aliasesCreated
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
    message: 'Squarespace Historical Import Endpoint',
    usage: {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_WEBHOOK_API_KEY'
      },
      queryParams: {
        dryRun: 'true/false - Preview without making changes (default: false)',
        limit: 'number - Limit orders to process (default: all)'
      }
    },
    examples: {
      dryRun: '/api/squarespace/import-historical?dryRun=true',
      limited: '/api/squarespace/import-historical?limit=50',
      full: '/api/squarespace/import-historical'
    }
  }));
}

