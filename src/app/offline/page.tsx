'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-8">
            It looks like you've lost your internet connection. Some features may not be available until you're back online.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              disabled={!isOnline}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                isOnline
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isOnline ? 'Retry' : 'Waiting for connection...'}</span>
            </button>

            <div className="text-sm text-gray-500">
              <p>You can still:</p>
              <ul className="mt-2 space-y-1">
                <li>• View previously loaded data</li>
                <li>• Navigate between cached pages</li>
                <li>• Use basic app features</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className={`inline-flex items-center space-x-2 text-sm ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-600' : 'bg-red-600'
              }`}></div>
              <span>{isOnline ? 'Back online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
