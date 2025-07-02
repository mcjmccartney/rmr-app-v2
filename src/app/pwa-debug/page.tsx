'use client';

import { useState, useEffect } from 'react';

export default function PWADebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkPWAStatus = () => {
      const info = {
        userAgent: navigator.userAgent,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isAppleStandalone: (window.navigator as any).standalone === true,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        manifestUrl: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
        isSecure: location.protocol === 'https:',
        isLocalhost: location.hostname === 'localhost',
        currentUrl: location.href,
        hasBeforeInstallPrompt: false,
        serviceWorkerState: 'unknown'
      };

      // Check service worker status
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            info.serviceWorkerState = registration.active ? 'active' : 'installing';
          } else {
            info.serviceWorkerState = 'not registered';
          }
          setDebugInfo({...info});
        });
      }

      setDebugInfo(info);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setDebugInfo((prev: any) => ({...prev, hasBeforeInstallPrompt: true}));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkPWAStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('No install prompt available. Try using browser menu "Add to Home Screen"');
      return;
    }

    const result = await deferredPrompt.prompt();
    console.log('Install prompt result:', result);
    setDeferredPrompt(null);
  };

  const testManifest = async () => {
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      console.log('Manifest loaded:', manifest);
      alert('Manifest loaded successfully - check console for details');
    } catch (error) {
      console.error('Failed to load manifest:', error);
      alert('Failed to load manifest - check console for details');
    }
  };

  const testServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        alert('Service worker registered successfully');

        // Wait a moment then check status again
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Service worker registration failed:', error);
        alert('Service worker registration failed - check console');
      }
    } else {
      alert('Service workers not supported');
    }
  };

  const forceInstallPrompt = () => {
    // Clear the dismissed flag and show manual instructions
    localStorage.removeItem('pwa-install-dismissed');
    alert('Install prompt flag cleared. For Android Chrome:\n\n1. Tap the 3-dot menu (⋮) in the top right\n2. Look for "Install app" or "Add to Home screen"\n3. If not available, try:\n   - Refresh the page\n   - Visit the site a few more times\n   - Wait for Chrome to recognize it as installable\n\nChrome requires user engagement before showing install prompts.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PWA Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">PWA Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className={`${value === true ? 'text-green-600' : value === false ? 'text-red-600' : 'text-gray-600'}`}>
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Install PWA
            </button>
            <button
              onClick={testManifest}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Manifest Loading
            </button>
            <button
              onClick={testServiceWorker}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Service Worker Registration
            </button>
            <button
              onClick={forceInstallPrompt}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Force Install Prompt
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>1.</strong> Check that all PWA requirements show "Yes"</p>
            <p><strong>2.</strong> If "hasBeforeInstallPrompt" is false, Chrome hasn't recognized this as installable yet</p>
            <p><strong>3.</strong> Try the "Try Install PWA" button</p>
            <p><strong>4.</strong> For Android Chrome manual install:</p>
            <ul className="ml-4 space-y-1">
              <li>• Tap the 3-dot menu (⋮) in top right corner</li>
              <li>• Look for "Install app" or "Add to Home screen"</li>
              <li>• If not available, try refreshing and visiting the site more</li>
            </ul>
            <p><strong>5.</strong> Chrome requires user engagement before showing install prompts</p>
            <p><strong>6.</strong> Check console for detailed error messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
