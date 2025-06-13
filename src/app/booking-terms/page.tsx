'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingTermsService } from '@/services/bookingTermsService';

export default function BookingTermsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      alert('Please confirm that you have read and agree to the Booking Terms & Service Agreement');
      return;
    }

    if (!formData.email || !formData.name) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit booking terms and update client profile
      await bookingTermsService.submitAndUpdateClient({
        email: formData.email,
        name: formData.name
      });

      // Success - navigate back silently
      router.push('/');

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
        <div className="w-full max-w-2xl rounded-lg shadow-lg" style={{ backgroundColor: '#ebeadf' }}>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4f6749' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': '#973b00'
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4f6749' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      '--tw-ring-color': '#973b00'
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 focus:ring-2"
                  style={{
                    accentColor: '#973b00',
                    '--tw-ring-color': '#973b00'
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
                  disabled={isSubmitting}
                  className="w-full text-white font-medium py-3 px-6 rounded transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#4f6749' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
