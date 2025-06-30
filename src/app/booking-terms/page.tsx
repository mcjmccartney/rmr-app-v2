'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { bookingTermsService } from '@/services/bookingTermsService';
import { useApp } from '@/context/AppContext';
import ThankYouPopup from '@/components/ui/ThankYouPopup';

function BookingTermsContent() {
  const searchParams = useSearchParams();
  const { state } = useApp();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Get email from URL parameters and check if already completed
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      setEmail(decodedEmail);

      // Check if this email already has booking terms signed
      const existingBookingTerms = state.bookingTerms.find(bt =>
        bt.email?.toLowerCase() === decodedEmail.toLowerCase()
      );

      if (existingBookingTerms) {
        // Redirect to completion page
        window.location.href = '/booking-terms-completed';
        return;
      }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Submit booking terms and update client profile
      await bookingTermsService.submitAndUpdateClient({
        email: email
      });

      // Success - show thank you popup
      setShowThankYou(true);

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl rounded-lg shadow-lg" style={{ backgroundColor: '#ebeadf' }}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#4f6749' }}>
              Booking Terms & Service Agreement
            </h1>

            <div className="space-y-6 text-gray-800 mb-8 max-h-96 overflow-y-auto">
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#4f6749' }}>1-1 Sessions</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Please tell me if there is anything I should know before our session. If there is something that you yourself would want to know, then assume I would feel the same. If your dog has any medical conditions, allergies, intolerances or special requirements, please tell me before our session.
                  </p>
                  <p className="font-medium">
                    If you, your dog, a person or animal in your household is unwell within 3 days before our session, you must inform me. If you have already paid for your session and a household member becomes unwell, I will carry the payment forward to your next booking.
                  </p>
                  <p>
                    Please be open with me. If something does not feel comfortable please tell me straight away. If you do not feel physically capable of a suggestion I make, or if it does not feel safe for any reason, it is up to you to tell me.
                  </p>
                  <p>
                    Equally, I reserve the right to leave if I feel uncomfortable with a situation or behaviour of any person involved in the session.
                  </p>
                  <p>
                    As the owner of the dog, it is your responsibility to make sure your dog does not pose a threat to any other animals or people.
                  </p>
                  <p>
                    All advice I give you must feel comfortable and safe for you, your dog, your family, your home and other people and animals. If it doesn&apos;t, please tell me and we can discuss a different approach. The decision to follow advice or not lies with you.
                  </p>
                  <p>
                    Remember, I only see a snapshot of your dog and can only base a professional opinion on that snapshot and/or the information you provide.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#4f6749' }}>Payments, Refunds & Cancellations</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Payment is due on the day of your session and can be paid by payment link.
                  </p>
                  <p>
                    Online Sessions are <strong>£50 for Dog Club Members,</strong> and <strong>£70 for non-members.</strong> In-person Sessions are <strong>£75 for Dog Club Members,</strong> and <strong>£95 for non-members.</strong> A travel fee may occasionally apply but would discussed before the session. Dog training/person coaching is priced per request.
                  </p>
                  <p>
                    I do not offer refunds but exceptions may be made at my discretion.
                  </p>
                  <p>
                    I understand life happens and cancellations may be necessary, but please be considerate:<br />
                    1-2 week&apos;s notice gives me chance to fill your session slot.
                  </p>
                  <p>
                    After one reschedule with <strong>less than 7 days&apos; notice</strong>, I&apos;ll need to take payment upfront for future bookings as my small business relies on sessions going ahead.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#4f6749' }}>Privacy</h2>
                <p className="text-sm leading-relaxed">
                  Your personal details are stored in a password-protected cloud system. The identifying details you share about your dog are considered confidential unless I feel there is a welfare issue.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#4f6749' }}>Disclaimer</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Any work with animals inherently carries a risk of injury. By booking with me, you assume full responsibility for any risks, injuries or damages that may occur as a result of the session(s), and for having appropriate pet insurance for your dog.
                  </p>
                  <p>
                    You, and any other voluntary attendees, are present for the session at your own risk.
                  </p>
                  <p>
                    You understand and accept that your dog (and their behaviour) remains entirely your responsibility at all times, whether or not the presence of a behaviourist or trainer.
                  </p>
                </div>
              </div>
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

      {/* Thank You Popup */}
      <ThankYouPopup
        isOpen={showThankYou}
        onClose={() => setShowThankYou(false)}
        title="Thank You!"
        message="Your booking terms have been successfully submitted. We appreciate you taking the time to review and agree to our terms and conditions."
        redirectUrl="/booking-terms-completed"
        redirectDelay={3000}
      />
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
