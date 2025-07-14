'use client';

import { useEffect } from 'react';

// Component that triggers webhook check when the app is accessed
export default function WebhookScheduler() {
  useEffect(() => {
    // Check and potentially run webhooks when the app loads
    const checkWebhooks = async () => {
      try {
        // Only check on client side and during business hours to avoid unnecessary calls
        const now = new Date();
        const hour = now.getUTCHours();
        
        // Only check between 8 AM and 6 PM UTC to avoid unnecessary calls
        if (hour >= 8 && hour <= 18) {
          console.log('[WEBHOOK-SCHEDULER] Checking for daily webhooks...');
          
          const response = await fetch('/api/cron-status', {
            method: 'GET',
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.checkResult?.ran) {
              console.log('[WEBHOOK-SCHEDULER] Daily webhooks executed:', data.checkResult);
            } else {
              console.log('[WEBHOOK-SCHEDULER] Daily webhooks status:', data.checkResult?.message);
            }
          }
        }
      } catch (error) {
        // Silently fail - don't disrupt the app if webhook check fails
        console.error('[WEBHOOK-SCHEDULER] Check failed:', error);
      }
    };

    // Run check after a short delay to not block app startup
    const timeoutId = setTimeout(checkWebhooks, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  // This component renders nothing - it's just for the side effect
  return null;
}
