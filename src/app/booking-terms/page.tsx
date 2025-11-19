'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

function BookingTermsContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [loadingVersion, setLoadingVersion] = useState(true);

  // Load the active booking terms version
  useEffect(() => {
    const loadActiveVersion = async () => {
      try {
        const response = await fetch('/api/booking-terms-versions/active');
        if (response.ok) {
          const result = await response.json();
          setActiveVersion(result.version);
        }
      } catch (error) {
        console.error('Error loading active version:', error);
      } finally {
        setLoadingVersion(false);
      }
    };

    loadActiveVersion();
  }, []);

  // Get email from URL parameters and check if already completed
  useEffect(() => {
    const checkExistingBookingTerms = async () => {
      const emailParam = searchParams.get('email');
      const isUpdate = searchParams.get('update') === 'true';

      if (emailParam) {
        const decodedEmail = decodeURIComponent(emailParam);
        setEmail(decodedEmail);

        // If this is an update request, skip the completion check and show the form
        if (isUpdate) {
          console.log('Booking terms update request - showing form for re-signing');
          return;
        }

        try {
          // Only check for existing booking terms if this is NOT an update request
          const response = await fetch(`/api/booking-terms?email=${encodeURIComponent(decodedEmail)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.exists) {
              // Redirect to completion page only for non-update requests
              window.location.href = '/booking-terms-completed';
              return;
            }
          }
        } catch (error) {
          console.error('Error checking existing booking terms:', error);
          // Continue with form display even if check fails
        }
      }
    };

    checkExistingBookingTerms();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      alert('Please confirm that you have read and agree to the Booking Terms & Service Agreement');
      return;
    }

    if (!email) {
      alert('Email address is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if this is an update request
      const isUpdate = searchParams.get('update') === 'true';

      // Submit booking terms using API endpoint
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add update header if this is an update request
      if (isUpdate) {
        headers['x-booking-terms-update'] = 'true';
      }

      const response = await fetch('/api/booking-terms', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit booking terms');
      }

      // Redirect directly to completion page
      window.location.href = '/booking-terms-completed';

    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingVersion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4f6749' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl rounded-lg shadow-lg" style={{ backgroundColor: '#ebeadf' }}>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#4f6749' }}>
              {activeVersion?.title || 'Service Agreement'}
            </h2>

            <div className="space-y-6 text-gray-800 mb-8 max-h-96 overflow-y-auto">
              {activeVersion ? (
                <SafeHtmlRenderer html={activeVersion.html_content} />
              ) : (
                <div className="text-center text-gray-600">
                  <p>No booking terms available. Please contact support.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden email field for form submission */}
              <input type="hidden" value={email} />

              <div className="flex items-start space-x-3 pt-4">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-amber-600"
                  style={{
                    accentColor: '#973b00'
                  }}
                  required
                />
                <label htmlFor="agree" className="text-sm" style={{ color: '#4f6749' }}>
                  I have read and agree to the Booking Terms & Service Agreement
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full text-white font-medium py-3 px-6 rounded transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#4f6749' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Agreement'}
                </button>
              </div>

              {!email && (
                <div className="text-center text-red-600 text-sm">
                  This form requires an email parameter. Please use the link provided in your email.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>


    </div>
  );
}

export default function BookingTermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <BookingTermsContent />
    </Suspense>
  );
}
