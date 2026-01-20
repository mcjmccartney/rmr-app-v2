import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEmailAliasService } from '@/services/clientEmailAliasService';
import { sanitizeEmail, sanitizeString, addSecurityHeaders } from '@/lib/security';
import { verifyWebhookApiKey } from '@/lib/webhookAuth';

/**
 * Squarespace Historical Order Import
 * 
 * Fetches all past orders from Squarespace and creates:
 * - Client records for customers who don't have profiles yet
 * - Membership records for all past payments
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
      allOrders = allOrders.concat(data.orders || []);
      
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

    // Get existing clients and memberships
    const { data: existingClients } = await supabase
      .from('clients')
      .select('email, id');

    const { data: existingMemberships } = await supabase
      .from('memberships')
      .select('email, date');

    const existingClientEmails = new Set(
      existingClients?.filter(c => c.email).map(c => c.email.toLowerCase()) || []
    );
    const existingMembershipKeys = new Set(
      existingMemberships?.filter(m => m.email && m.date).map(m => `${m.email.toLowerCase()}:${m.date}`) || []
    );

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
    const errors: any[] = [];

    for (const order of allOrders) {
      try {
        const email = sanitizeEmail(order.customerEmail || '');
        const firstName = sanitizeString(order.billingAddress?.firstName || '');
        const lastName = sanitizeString(order.billingAddress?.lastName || '');
        const postcode = sanitizeString(order.billingAddress?.postalCode || '');
        const amount = parseFloat(order.grandTotal?.value || '0');
        const date = new Date(order.createdOn);

        // Skip invalid orders
        if (!email || !firstName || !lastName || isNaN(amount) || amount <= 0) {
          console.warn('[SQUARESPACE-IMPORT] Skipping invalid order:', order.orderNumber);
          continue;
        }

        // Check if client exists
        const emailLower = email.toLowerCase();
        if (!existingClientEmails.has(emailLower)) {
          stats.clientsToCreate++;
          clientsToCreate.push({
            first_name: firstName,
            last_name: lastName,
            email: email,
            address: postcode || '',
            active: true,
            membership: true
          });
          existingClientEmails.add(emailLower); // Prevent duplicates in this batch
        } else {
          stats.clientsAlreadyExist++;
        }

        // Check if membership exists
        const membershipKey = `${emailLower}:${date.toISOString().split('T')[0]}`;
        if (!existingMembershipKeys.has(membershipKey)) {
          stats.membershipsToCreate++;
          membershipsToCreate.push({
            email: email,
            date: date.toISOString().split('T')[0],
            amount: amount
          });
          existingMembershipKeys.add(membershipKey); // Prevent duplicates in this batch
        } else {
          stats.membershipsAlreadyExist++;
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
          clientsToCreate: clientsToCreate.slice(0, 5),
          membershipsToCreate: membershipsToCreate.slice(0, 5)
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
          .select();

        if (error) {
          console.error('[SQUARESPACE-IMPORT] Error creating clients batch:', error);
        } else {
          clientsCreated += data?.length || 0;
        }
      }
      console.log(`[SQUARESPACE-IMPORT] Created ${clientsCreated} clients`);
    }

    // Create memberships in batches
    let membershipsCreated = 0;
    if (membershipsToCreate.length > 0) {
      console.log(`[SQUARESPACE-IMPORT] Creating ${membershipsToCreate.length} memberships...`);

      const batchSize = 100;
      for (let i = 0; i < membershipsToCreate.length; i += batchSize) {
        const batch = membershipsToCreate.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('memberships')
          .insert(batch)
          .select();

        if (error) {
          console.error('[SQUARESPACE-IMPORT] Error creating memberships batch:', error);
        } else {
          membershipsCreated += data?.length || 0;
        }
      }
      console.log(`[SQUARESPACE-IMPORT] Created ${membershipsCreated} memberships`);
    }

    // Return results
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Historical import completed',
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

