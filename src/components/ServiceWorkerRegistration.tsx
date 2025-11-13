'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Register service worker in both development and production for PWA testing
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);

          // Check for updates immediately (with a small delay to ensure registration is ready)
          setTimeout(() => {
            registration.update().catch((err) => {
              console.log('SW update check failed (this is normal on first load):', err);
            });
          }, 1000);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('Service worker update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('New service worker state:', newWorker.state);

                // If there's a controller (existing SW), wait for 'installed' state
                if (navigator.serviceWorker.controller) {
                  if (newWorker.state === 'installed') {
                    console.log('New service worker installed, reloading page...');
                    window.location.reload();
                  }
                } else {
                  // No controller means first install, wait for 'activated'
                  if (newWorker.state === 'activated') {
                    console.log('Service worker activated for first time');
                  }
                }
              });
            }
          });

          // Listen for the controlling service worker changing and reload the page
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              console.log('Service worker activated, reloading page...');
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return null;
}
