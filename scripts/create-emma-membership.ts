#!/usr/bin/env ts-node

/**
 * Create membership record for Emma Wolstencroft
 * Run with: npx ts-node scripts/create-emma-membership.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMembership() {
  console.log('🔍 Creating membership for Emma Wolstencroft...\n');

  const email = 'emma@thinkando.co.uk';
  const amount = 8.00;
  const date = '2026-01-21';

  // Check if membership already exists
  const { data: existing, error: checkError } = await supabase
    .from('memberships')
    .select('*')
    .eq('email', email)
    .eq('date', date)
    .single();

  if (existing && !checkError) {
    console.log('✅ Membership already exists:');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }

  // Create membership
  const { data: membership, error: createError } = await supabase
    .from('memberships')
    .insert({
      email: email,
      date: date,
      amount: amount
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating membership:', createError);
    process.exit(1);
  }

  console.log('✅ Membership created successfully:');
  console.log(JSON.stringify(membership, null, 2));
  console.log('');

  // Update client membership status
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, membership')
    .eq('email', email)
    .single();

  if (client && !clientError) {
    console.log(`📝 Found client: ${client.first_name} ${client.last_name}`);
    
    if (!client.membership) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ membership: true, active: true })
        .eq('id', client.id);

      if (updateError) {
        console.error('❌ Error updating client:', updateError);
      } else {
        console.log('✅ Client membership status updated to true');
      }
    } else {
      console.log('✅ Client already has membership status set to true');
    }
  } else {
    console.log('⚠️  No client found with this email');
  }

  console.log('\n✅ Done!');
}

createMembership().catch(console.error);

