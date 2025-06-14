'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionService } from '@/services/sessionService';
import { Session } from '@/types';

export default function PaymentConfirmedPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const sessionId = params.sessionId as string;
        
        if (!sessionId) {
          setError('Invalid session ID');
          setIsProcessing(false);
          return;
        }

        // Get the session first to check if it exists
        const existingSession = await sessionService.getById(sessionId);
        
        if (!existingSession) {
          setError('Session not found');
          setIsProcessing(false);
          return;
        }

        // Check if already paid
        if (existingSession.sessionPaid) {
          setSession(existingSession);
          setIsProcessing(false);
          return;
        }

        // Mark session as paid
        const updatedSession = await sessionService.markAsPaid(sessionId);
        setSession(updatedSession);
        setIsProcessing(false);

      } catch (err) {
        console.error('Error confirming payment:', err);
        setError('An error occurred while confirming your payment. Please contact us if this persists.');
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [params.sessionId]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
        <div className="flex-1 px-4 py-6 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="rounded-lg p-8" style={{ backgroundColor: '#ebeadf' }}>
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-4 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Payment Confirmation
                </h1>
                <p className="text-gray-700">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
        <div className="flex-1 px-4 py-6 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="rounded-lg p-8" style={{ backgroundColor: '#ebeadf' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Confirmation Error
                </h1>
                <p className="text-gray-700 mb-4">
                  {error}
                </p>
              </div>
              
              <button
                onClick={() => router.push('/')}
                className="w-full text-white font-medium py-3 px-6 rounded transition-colors"
                style={{ backgroundColor: '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex-1 px-4 py-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-lg p-8" style={{ backgroundColor: '#ebeadf' }}>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Confirmed!
              </h1>
              <p className="text-gray-700 mb-4">
                Thank you! Your payment for the {session?.sessionType} session has been confirmed.
              </p>
              
              {session && (
                <div className="bg-white rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Session Details:</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {session.sessionType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {new Date(session.bookingDate).toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {session.bookingTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Amount:</strong> £{session.quote.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You should receive a confirmation email shortly. If you have any questions about your session, 
                please don't hesitate to contact us.
              </p>
              
              <button
                onClick={() => router.push('/')}
                className="w-full text-white font-medium py-3 px-6 rounded transition-colors"
                style={{ backgroundColor: '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
