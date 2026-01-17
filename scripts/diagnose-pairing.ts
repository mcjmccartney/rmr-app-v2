/**
 * Diagnostic script to understand why memberships aren't pairing with clients
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnosePairing() {
  console.log('🔍 Diagnosing membership pairing...\n');

  try {
    // Get recent memberships
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*')
      .gte('date', oneMonthAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (membershipsError) throw membershipsError;

    console.log(`📊 Recent memberships: ${memberships?.length || 0}\n`);

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) throw clientsError;

    console.log(`📊 Total clients: ${clients?.length || 0}\n`);

    // Get all email aliases
    const { data: aliases, error: aliasesError } = await supabase
      .from('client_email_aliases')
      .select('*');

    if (aliasesError) {
      console.warn('⚠️  Could not fetch email aliases');
    }

    console.log(`📊 Email aliases: ${aliases?.length || 0}\n`);

    // Build a map of all client emails (including aliases)
    const clientEmailMap = new Map<string, { id: string; name: string; source: string }>();

    clients?.forEach(client => {
      if (client.email) {
        const email = client.email.toLowerCase().trim();
        clientEmailMap.set(email, {
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          source: 'primary'
        });
      }
    });

    aliases?.forEach(alias => {
      if (alias.email) {
        const email = alias.email.toLowerCase().trim();
        const client = clients?.find(c => c.id === alias.client_id);
        if (client && !clientEmailMap.has(email)) {
          clientEmailMap.set(email, {
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            source: 'alias'
          });
        }
      }
    });

    console.log(`📧 Total unique client emails: ${clientEmailMap.size}\n`);

    // Check which memberships match clients
    let matched = 0;
    let unmatched = 0;
    const unmatchedEmails: string[] = [];

    memberships?.forEach(membership => {
      const email = membership.email.toLowerCase().trim();
      if (clientEmailMap.has(email)) {
        matched++;
      } else {
        unmatched++;
        if (unmatchedEmails.length < 10) {
          unmatchedEmails.push(membership.email);
        }
      }
    });

    console.log('='.repeat(60));
    console.log('📊 Pairing Results:');
    console.log('='.repeat(60));
    console.log(`✅ Matched: ${matched} memberships`);
    console.log(`❌ Unmatched: ${unmatched} memberships`);
    console.log('='.repeat(60) + '\n');

    if (unmatchedEmails.length > 0) {
      console.log('❌ Sample of unmatched membership emails:');
      unmatchedEmails.forEach(email => console.log(`   - ${email}`));
      console.log();
    }

    // Show which clients SHOULD be members
    const shouldBeMembers: string[] = [];
    memberships?.forEach(membership => {
      const email = membership.email.toLowerCase().trim();
      const client = clientEmailMap.get(email);
      if (client && !shouldBeMembers.includes(client.name)) {
        shouldBeMembers.push(client.name);
      }
    });

    console.log(`👥 Clients who should be members: ${shouldBeMembers.length}`);
    if (shouldBeMembers.length > 0) {
      console.log('\nSample:');
      shouldBeMembers.slice(0, 10).forEach(name => console.log(`   ✅ ${name}`));
      if (shouldBeMembers.length > 10) {
        console.log(`   ... and ${shouldBeMembers.length - 10} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosePairing();

