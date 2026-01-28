#!/usr/bin/env ts-node

/**
 * Find and Merge Duplicate Clients Created from Alias Emails
 * 
 * This script identifies clients whose email exists in the client_email_aliases table
 * (meaning they were created from an alias email) and merges them with the primary client.
 * 
 * Usage:
 *   npm run ts-node scripts/find-and-merge-alias-duplicates.ts [--dry-run] [--auto-merge]
 * 
 * Options:
 *   --dry-run: Show what would be merged without making changes
 *   --auto-merge: Automatically merge without prompting (use with caution!)
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DuplicateMatch {
  duplicateClientId: string;
  duplicateClientName: string;
  duplicateClientEmail: string;
  duplicateClientDogName: string | null;
  duplicateClientCreatedAt: string;
  primaryClientId: string;
  primaryClientName: string;
  primaryClientEmail: string;
  primaryClientDogName: string | null;
  aliasEmail: string;
}

async function findDuplicatesFromAliases(): Promise<DuplicateMatch[]> {
  console.log('🔍 Searching for duplicate clients created from alias emails...\n');

  // Find clients whose email exists in client_email_aliases table
  // but the client record is NOT the same as the linked client
  const { data, error } = await supabase.rpc('find_alias_duplicates');

  if (error) {
    // If the RPC doesn't exist, use a manual query
    const { data: manualData, error: manualError } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        dog_name,
        created_at
      `);

    if (manualError) {
      console.error('❌ Error fetching clients:', manualError);
      return [];
    }

    // Get all email aliases
    const { data: aliases, error: aliasError } = await supabase
      .from('client_email_aliases')
      .select('*');

    if (aliasError) {
      console.error('❌ Error fetching aliases:', aliasError);
      return [];
    }

    // Find duplicates manually
    const duplicates: DuplicateMatch[] = [];
    
    for (const client of manualData || []) {
      if (!client.email) continue;

      // Check if this client's email exists as an alias for a DIFFERENT client
      const matchingAlias = aliases?.find(
        alias => alias.email.toLowerCase() === client.email.toLowerCase() && alias.client_id !== client.id
      );

      if (matchingAlias) {
        // Get the primary client
        const { data: primaryClient } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, dog_name')
          .eq('id', matchingAlias.client_id)
          .single();

        if (primaryClient) {
          duplicates.push({
            duplicateClientId: client.id,
            duplicateClientName: `${client.first_name} ${client.last_name}`,
            duplicateClientEmail: client.email,
            duplicateClientDogName: client.dog_name,
            duplicateClientCreatedAt: client.created_at,
            primaryClientId: primaryClient.id,
            primaryClientName: `${primaryClient.first_name} ${primaryClient.last_name}`,
            primaryClientEmail: primaryClient.email,
            primaryClientDogName: primaryClient.dog_name,
            aliasEmail: matchingAlias.email
          });
        }
      }
    }

    return duplicates;
  }

  return data || [];
}

async function mergeDuplicateClient(duplicate: DuplicateMatch): Promise<boolean> {
  console.log(`\n🔄 Merging duplicate client...`);
  console.log(`   Duplicate: ${duplicate.duplicateClientName} (${duplicate.duplicateClientEmail})`);
  console.log(`   Primary: ${duplicate.primaryClientName} (${duplicate.primaryClientEmail})`);

  try {
    // Transfer sessions
    const { error: sessionsError } = await supabase
      .from('sessions')
      .update({ client_id: duplicate.primaryClientId })
      .eq('client_id', duplicate.duplicateClientId);

    if (sessionsError) {
      console.error('   ❌ Error transferring sessions:', sessionsError.message);
      return false;
    }

    // Transfer memberships (update client_id if it exists, otherwise just the email is fine)
    const { error: membershipsError } = await supabase
      .from('memberships')
      .update({ client_id: duplicate.primaryClientId })
      .eq('email', duplicate.duplicateClientEmail);

    if (membershipsError && membershipsError.code !== '42703') {
      // Ignore if client_id column doesn't exist
      console.error('   ⚠️  Warning transferring memberships:', membershipsError.message);
    }

    // Delete the duplicate client (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', duplicate.duplicateClientId);

    if (deleteError) {
      console.error('   ❌ Error deleting duplicate client:', deleteError.message);
      return false;
    }

    console.log('   ✅ Successfully merged and deleted duplicate client');
    return true;
  } catch (error) {
    console.error('   ❌ Unexpected error during merge:', error);
    return false;
  }
}

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const autoMerge = args.includes('--auto-merge');

  console.log('🔍 Finding Duplicate Clients Created from Alias Emails\n');
  console.log('═'.repeat(60));

  if (isDryRun) {
    console.log('🔵 DRY RUN MODE - No changes will be made\n');
  }

  const duplicates = await findDuplicatesFromAliases();

  if (duplicates.length === 0) {
    console.log('\n✅ No duplicate clients found! Your database is clean.\n');
    return;
  }

  console.log(`\n📊 Found ${duplicates.length} duplicate client(s):\n`);

  duplicates.forEach((dup, index) => {
    console.log(`${index + 1}. Duplicate Client:`);
    console.log(`   Name: ${dup.duplicateClientName}`);
    console.log(`   Email: ${dup.duplicateClientEmail}`);
    console.log(`   Dog: ${dup.duplicateClientDogName || 'N/A'}`);
    console.log(`   Created: ${new Date(dup.duplicateClientCreatedAt).toLocaleDateString()}`);
    console.log(`   → Should be merged into:`);
    console.log(`   Primary: ${dup.primaryClientName} (${dup.primaryClientEmail})`);
    console.log(`   Dog: ${dup.primaryClientDogName || 'N/A'}`);
    console.log(`   Alias Email: ${dup.aliasEmail}`);
    console.log('');
  });

  if (isDryRun) {
    console.log('🔵 DRY RUN COMPLETE - No changes were made\n');
    return;
  }

  // Prompt for confirmation unless auto-merge is enabled
  if (!autoMerge) {
    const proceed = await promptUser(
      `\n⚠️  Do you want to merge these ${duplicates.length} duplicate client(s)? (y/n): `
    );

    if (!proceed) {
      console.log('\n❌ Merge cancelled by user\n');
      return;
    }
  }

  console.log('\n🔄 Starting merge process...\n');

  let successCount = 0;
  let failCount = 0;

  for (const duplicate of duplicates) {
    const success = await mergeDuplicateClient(duplicate);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\n✅ Merge complete!`);
  console.log(`   Successfully merged: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log('');
}

main().catch(console.error);

