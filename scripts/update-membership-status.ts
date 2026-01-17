/**
 * Script to update all client membership statuses based on the 1-month window
 * Run this after changing the membership window from 2 months to 1 month
 * 
 * Usage: npx tsx scripts/update-membership-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateMembershipStatuses() {
  console.log('🔄 Starting membership status update...\n');

  try {
    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Get all memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*');

    if (membershipsError) {
      throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
    }

    // Get all client email aliases
    const { data: aliases, error: aliasesError } = await supabase
      .from('client_email_aliases')
      .select('*');

    if (aliasesError) {
      console.warn('⚠️  Could not fetch email aliases:', aliasesError.message);
    }

    let updated = 0;
    let unchanged = 0;
    const total = clients?.length || 0;

    console.log(`📊 Processing ${total} clients...\n`);

    // Process each client
    for (const client of clients || []) {
      try {
        // Get memberships for this client (including email aliases)
        const clientEmails = [client.email].filter(Boolean);

        // Add alias emails
        const clientAliases = aliases?.filter(alias => alias.client_id === client.id) || [];
        clientAliases.forEach(alias => {
          if (alias.email && !clientEmails.includes(alias.email)) {
            clientEmails.push(alias.email);
          }
        });

        // Get all memberships for client emails (case-insensitive)
        const clientMemberships = memberships?.filter(membership =>
          clientEmails.some(email => email?.toLowerCase() === membership.email?.toLowerCase())
        ) || [];

        if (clientMemberships.length === 0) {
          // No memberships found - set to false if currently true
          if (client.membership) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({ membership: false })
              .eq('id', client.id);

            if (!updateError) {
              updated++;
              console.log(`❌ ${client.first_name} ${client.last_name}: Member → Non-Member (no payments found)`);
            }
          } else {
            unchanged++;
          }
          continue;
        }

        // Check if client has any recent memberships (within last 1 month)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const recentMemberships = clientMemberships.filter(membership => {
          const membershipDate = new Date(membership.date);
          return membershipDate >= oneMonthAgo;
        });

        const shouldBeMember = recentMemberships.length > 0;
        const currentMembershipStatus = client.membership;

        // Update client membership status if it has changed
        if (shouldBeMember !== currentMembershipStatus) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({ membership: shouldBeMember })
            .eq('id', client.id);

          if (!updateError) {
            updated++;
            const latestPayment = clientMemberships.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];
            
            if (shouldBeMember) {
              console.log(`✅ ${client.first_name} ${client.last_name}: Non-Member → Member (last payment: ${latestPayment.date})`);
            } else {
              console.log(`❌ ${client.first_name} ${client.last_name}: Member → Non-Member (last payment: ${latestPayment.date})`);
            }
          }
        } else {
          unchanged++;
        }

      } catch (clientError) {
        console.error(`❌ Error processing client ${client.id}:`, clientError);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Membership status update completed!');
    console.log('='.repeat(60));
    console.log(`📊 Total clients: ${total}`);
    console.log(`✏️  Updated: ${updated}`);
    console.log(`➖ Unchanged: ${unchanged}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during membership status update:', error);
    process.exit(1);
  }
}

// Run the script
updateMembershipStatuses();

