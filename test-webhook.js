// Test script to simulate Make.com webhook
const testWebhook = async () => {
  const testData = {
    sessionId: "5305343b-4b88-46e2-b579-41f88c489997", // Use the session ID from your Make.com screenshot
    documentUrl: "https://docs.google.com/document/d/1f4-Xn65JL37NX-INNRJGD1ILEXILLG4PM_XFUuHEE_E/edit?usp=drivesdk"
  };

  console.log('Testing webhook with data:', testData);

  try {
    const response = await fetch('https://raising-my-rescue.vercel.app/api/session-plan/document-url', {
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
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

// Run the test
testWebhook();
