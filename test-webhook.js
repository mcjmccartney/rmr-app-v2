// Test script to simulate Make.com webhook
const testGet = async () => {
  console.log('Testing GET request for actual session...');
  try {
    const response = await fetch('https://raising-my-rescue.vercel.app/api/session-plan/document-url?sessionId=5305343b-4b88-46e2-b579-41f88c489997');
    console.log('GET Response status:', response.status);
    const data = await response.text();
    console.log('GET Response:', data);
  } catch (error) {
    console.error('GET Error:', error);
  }
};

const restoreCorrectUrl = async () => {
  console.log('Restoring correct document URL...');
  const correctData = {
    sessionId: "5305343b-4b88-46e2-b579-41f88c489997",
    documentUrl: "https://docs.google.com/document/d/1lEGiB_BmzgN8c7XwrRk52WjDKhZ4agfyCyOytuY_3bw/edit?usp=drivesdk"
  };

  try {
    const response = await fetch('https://raising-my-rescue.vercel.app/api/session-plan/document-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(correctData)
    });

    console.log('Restore Response status:', response.status);
    const responseData = await response.text();
    console.log('Restore Response:', responseData);
  } catch (error) {
    console.error('Error restoring URL:', error);
  }
};

const testWebhook = async () => {
  const testData = {
    sessionId: "5305343b-4b88-46e2-b579-41f88c489997", // Use the session ID from your Make.com screenshot
    documentUrl: "https://docs.google.com/document/d/1f4-Xn65JL37NX-INNRJGD1ILEXILLG4PM_XFUuHEE_E/edit?usp=drivesdk"
  };

  console.log('Testing webhook with data:', testData);

  try {
    // Try both with and without trailing slash
    const urls = [
      'https://raising-my-rescue.vercel.app/api/session-plan/document-url',
      'https://raising-my-rescue.vercel.app/api/session-plan/document-url/'
    ];

    for (const url of urls) {
      console.log(`\nTesting URL: ${url}`);
      const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.text();
      console.log('Response body:', responseData);

      if (response.ok) {
        console.log('✅ Webhook test successful!');
        break; // Exit loop on success
      } else {
        console.log('❌ Webhook test failed');
      }
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

// Run the tests
const runTests = async () => {
  await testGet();
  console.log('\n' + '='.repeat(50) + '\n');
  await restoreCorrectUrl();
  console.log('\n' + '='.repeat(50) + '\n');
  await testGet(); // Check again after restore
};

runTests();
