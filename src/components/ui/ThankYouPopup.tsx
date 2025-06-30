'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ThankYouPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  redirectUrl?: string;
  redirectDelay?: number; // in milliseconds, default 3000
}

export default function ThankYouPopup({
  isOpen,
  onClose,
  title,
  message,
  redirectUrl,
  redirectDelay = 3000
}: ThankYouPopupProps) {
  useEffect(() => {
    if (isOpen && redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, redirectUrl, redirectDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
            {redirectUrl && (
              <button
                onClick={() => window.location.href = redirectUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                Continue
              </button>
            )}
          </div>

          {/* Auto-redirect notice */}
          {redirectUrl && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                You will be automatically redirected in {redirectDelay / 1000} seconds...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
