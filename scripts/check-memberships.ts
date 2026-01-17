/**
 * Script to check membership payments in the database
 * Shows recent payments and helps debug membership pairing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMemberships() {
  console.log('🔍 Checking membership payments...\n');

  try {
    // Get all memberships
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch memberships: ${error.message}`);
    }

    console.log(`📊 Total membership records: ${memberships?.length || 0}\n`);

    if (!memberships || memberships.length === 0) {
      console.log('⚠️  No membership payments found in database!');
      return;
    }

    // Calculate date ranges
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 One month ago: ${oneMonthAgo.toISOString().split('T')[0]}\n`);

    // Filter recent memberships
    const recentMemberships = memberships.filter(m => {
      const paymentDate = new Date(m.date);
      return paymentDate >= oneMonthAgo;
    });

    console.log(`✅ Recent payments (within last month): ${recentMemberships.length}`);
    console.log(`❌ Old payments (older than 1 month): ${memberships.length - recentMemberships.length}\n`);

    // Show recent payments
    if (recentMemberships.length > 0) {
      console.log('📋 Recent Membership Payments:');
      console.log('='.repeat(80));
      recentMemberships.slice(0, 20).forEach(m => {
        console.log(`${m.date} | ${m.email.padEnd(35)} | £${m.amount}`);
      });
      if (recentMemberships.length > 20) {
        console.log(`... and ${recentMemberships.length - 20} more`);
      }
      console.log('='.repeat(80) + '\n');
    }

    // Show oldest and newest payments
    const sortedByDate = [...memberships].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('📅 Payment Date Range:');
    console.log(`   Oldest: ${sortedByDate[0].date}`);
    console.log(`   Newest: ${sortedByDate[sortedByDate.length - 1].date}\n`);

    // Group by month
    const byMonth: { [key: string]: number } = {};
    memberships.forEach(m => {
      const monthKey = m.date.substring(0, 7); // YYYY-MM
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    console.log('📊 Payments by Month:');
    Object.keys(byMonth).sort().reverse().slice(0, 6).forEach(month => {
      const isRecent = new Date(month + '-01') >= oneMonthAgo;
      const marker = isRecent ? '✅' : '❌';
      console.log(`   ${marker} ${month}: ${byMonth[month]} payments`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkMemberships();

