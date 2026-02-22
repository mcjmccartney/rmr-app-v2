'use client';

export default function BookingTermsCompletedPage() {
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
                Booking Terms
              </h1>
              <p className="text-gray-700">
                Thank you! You have successfully agreed to the booking terms. You may now close this window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
