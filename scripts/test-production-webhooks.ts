/**
 * Test script to verify the production daily webhooks endpoint
 * This tests the actual endpoint that the Supabase cron job calls
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testProductionWebhooks() {
  console.log('🧪 Testing production daily webhooks endpoint...\n');

  const webhookApiKey = process.env.WEBHOOK_API_KEY;
  
  if (!webhookApiKey) {
    console.error('❌ WEBHOOK_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    console.log('📡 Calling https://raising-my-rescue.vercel.app/api/daily-webhooks...\n');
    
    const response = await fetch('https://raising-my-rescue.vercel.app/api/daily-webhooks', {
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
      console.log(`   - Session webhooks sent: ${result.summary.successCount}`);
      console.log(`   - Memberships updated: ${result.summary.membershipUpdated || 0}`);
      console.log(`   - Timestamp: ${result.timestamp}`);
    } else {
      console.log('\n❌ Daily webhooks test failed!');
      console.log('   Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testProductionWebhooks();

