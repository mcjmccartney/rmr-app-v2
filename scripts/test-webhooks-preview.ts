/**
 * Test script to preview what the daily webhooks would process
 * Uses the GET endpoint which doesn't require authentication
 */

async function testWebhooksPreview() {
  console.log('🧪 Testing daily webhooks preview (GET endpoint)...\n');

  try {
    console.log('📡 Calling https://raising-my-rescue.vercel.app/api/daily-webhooks...\n');
    
    const response = await fetch('https://raising-my-rescue.vercel.app/api/daily-webhooks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Preview successful!');
      console.log(`   - Current time: ${result.currentTime}`);
      console.log(`   - Sessions to process: ${result.sessionsToProcess.totalSessions}`);
      console.log(`   - 7-day sessions: ${result.sessionsToProcess.sevenDaySessions.length}`);
    } else {
      console.log('\n❌ Preview failed!');
      console.log('   Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testWebhooksPreview();

