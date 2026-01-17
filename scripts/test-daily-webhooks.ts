/**
 * Test script to verify the daily webhooks endpoint (including membership updates)
 * This simulates what the Supabase cron job does
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testDailyWebhooks() {
  console.log('🧪 Testing daily webhooks endpoint...\n');

  const webhookApiKey = process.env.WEBHOOK_API_KEY;
  
  if (!webhookApiKey) {
    console.error('❌ WEBHOOK_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    const response = await fetch('http://localhost:3000/api/daily-webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': webhookApiKey
      },
      body: JSON.stringify({})
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Daily webhooks test successful!');
      console.log(`   - Sessions processed: ${result.summary.totalProcessed}`);
      console.log(`   - Memberships updated: ${result.summary.membershipUpdated}`);
    } else {
      console.log('\n❌ Daily webhooks test failed!');
      console.log('   Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDailyWebhooks();

