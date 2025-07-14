// Application startup initialization
import { cronScheduler } from './cronScheduler';

let isInitialized = false;

export function initializeApp() {
  if (isInitialized) {
    console.log('[STARTUP] App already initialized');
    return;
  }

  console.log('[STARTUP] Initializing application...');

  // Start the built-in cron scheduler
  if (typeof window === 'undefined') {
    // Only run on server side
    cronScheduler.start();
    console.log('[STARTUP] Cron scheduler started');
  }

  isInitialized = true;
  console.log('[STARTUP] Application initialization complete');
}

export function shutdownApp() {
  if (!isInitialized) {
    return;
  }

  console.log('[STARTUP] Shutting down application...');
  
  // Stop the cron scheduler
  cronScheduler.stop();
  
  isInitialized = false;
  console.log('[STARTUP] Application shutdown complete');
}

// Auto-initialize when this module is imported on server side
if (typeof window === 'undefined') {
  initializeApp();
}
