import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Get all memberships (ordered to ensure all records are fetched)
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*')
      .order('date', { ascending: false });

    if (membershipsError) {
      throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
    }

    // Get all client email aliases
    const { data: aliases, error: aliasesError } = await supabase
      .from('client_email_aliases')
      .select('*');

    if (aliasesError) {
      throw new Error(`Failed to fetch email aliases: ${aliasesError.message}`);
    }

    let updated = 0;
    const total = clients?.length || 0;

    // Process each client
    for (const client of clients || []) {
      try {
        // Get memberships for this client (including email aliases)
        const clientEmails: string[] = [];

        if (client.email) {
          clientEmails.push(client.email.toLowerCase().trim());
        }

        // Add alias emails
        const clientAliases = aliases?.filter(alias => alias.client_id === client.id) || [];
        clientAliases.forEach(alias => {
          const aliasEmail = alias.email?.toLowerCase().trim();
          if (aliasEmail && !clientEmails.includes(aliasEmail)) {
            clientEmails.push(aliasEmail);
          }
        });

        // Get all memberships for client emails (case-insensitive)
        const clientMemberships = memberships?.filter(membership => {
          const membershipEmail = membership.email?.toLowerCase().trim();
          return clientEmails.includes(membershipEmail);
        }) || [];

        if (clientMemberships.length === 0) {
          // No memberships found - set to false if currently true
          if (client.membership) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({ membership: false })
              .eq('id', client.id);

            if (!updateError) {
              updated++;
              console.log(`Set membership to false for ${client.first_name} ${client.last_name} (no payments found)`);
            }
          }
          continue;
        }

        // Sort by date to get the most recent membership
        const sortedMemberships = clientMemberships.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const mostRecentMembership = sortedMemberships[0];
        const lastPaymentDate = new Date(mostRecentMembership.date);

        // Calculate expiration date: 1 calendar month from payment date
        // Example: Payment on Jan 6 expires at 8:00 AM on Feb 7 (flagged as expired on Feb 7 morning check)
        const expirationDate = new Date(lastPaymentDate);
        expirationDate.setMonth(expirationDate.getMonth() + 1); // Next month (same day)
        expirationDate.setHours(8, 0, 0, 0); // 8:00 AM (when cron runs)

        const now = new Date();
        const isExpired = now >= expirationDate;
        const shouldBeActive = !isExpired;

        // Update client membership status if it has changed
        if (client.membership !== shouldBeActive) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({ membership: shouldBeActive })
            .eq('id', client.id);

          if (!updateError) {
            updated++;
            console.log(`Updated membership for ${client.first_name} ${client.last_name}: ${client.membership} → ${shouldBeActive}`);
          }
        }

      } catch (clientError) {
        console.error(`Error processing client ${client.id}:`, clientError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Membership expiration check completed successfully',
      updated,
      total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during membership expiration check:', error);
    return NextResponse.json({
      success: false,
      error: 'Membership expiration check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
