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

          // Check for updates immediately (with a small delay to ensure registration is ready)
          setTimeout(() => {
            registration.update().catch((err) => {
            });
          }, 1000);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {

                // If there's a controller (existing SW), wait for 'installed' state
                if (navigator.serviceWorker.controller) {
                  if (newWorker.state === 'installed') {
                    window.location.reload();
                  }
                } else {
                  // No controller means first install, wait for 'activated'
                  if (newWorker.state === 'activated') {
                  }
                }
              });
            }
          });

          // Listen for the controlling service worker changing and reload the page
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((registrationError) => {
        });
    }
  }, []);

  return null;
}
