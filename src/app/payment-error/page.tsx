'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get('reason');
  const sessionId = searchParams.get('id');

  const getErrorMessage = () => {
    switch (reason) {
      case 'missing-id':
        return {
          title: 'Payment Link Error',
          message: 'The payment confirmation link is missing required information. Please contact us to confirm your payment manually.',
          technical: 'Session ID not provided in URL'
        };
      case 'invalid-id':
        return {
          title: 'Invalid Payment Link',
          message: 'The payment confirmation link appears to be corrupted. Please contact us to confirm your payment manually.',
          technical: 'Invalid session ID format'
        };
      case 'session-not-found':
        return {
          title: 'Session Not Found',
          message: 'We could not find the session associated with this payment. Your payment may have been processed, but please contact us to verify.',
          technical: `Session ID ${sessionId} not found in database`
        };
      case 'update-failed':
        return {
          title: 'Payment Update Failed',
          message: 'Your payment was received, but we encountered an issue updating our records. Please contact us to confirm your payment status.',
          technical: 'Database update failed'
        };
      case 'server-error':
        return {
          title: 'Server Error',
          message: 'We encountered a technical issue while processing your payment confirmation. Please contact us to verify your payment status.',
          technical: 'Internal server error'
        };
      default:
        return {
          title: 'Payment Confirmation Issue',
          message: 'There was an issue confirming your payment. Please contact us to verify your payment status.',
          technical: 'Unknown error'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex-1 px-4 py-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-lg p-8" style={{ backgroundColor: '#ebeadf' }}>
            <div className="mb-6">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {errorInfo.title}
              </h1>
              <p className="text-gray-700 mb-4">
                {errorInfo.message}
              </p>
              
              {sessionId && (
                <div className="bg-white rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Reference Information:</h3>
                  <p className="text-sm text-gray-600 font-mono">
                    Session ID: {sessionId}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What to do next:</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Your payment may have been processed successfully</li>
                  <li>• Please contact us to confirm your payment status</li>
                  <li>• Include the reference information above when contacting us</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full text-white font-medium py-3 px-6 rounded transition-colors"
                  style={{ backgroundColor: '#4f6749' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                >
                  Return to Home
                </button>
                
                <button
                  onClick={() => window.location.href = 'mailto:info@raisingmyrescue.co.uk?subject=Payment Confirmation Issue&body=I need help confirming my payment. Session ID: ' + (sessionId || 'Not provided')}
                  className="w-full bg-white text-gray-700 font-medium py-3 px-6 rounded border border-gray-300 transition-colors hover:bg-gray-50"
                >
                  Contact Support
                </button>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Technical: {errorInfo.technical}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4f6749' }}>
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}
