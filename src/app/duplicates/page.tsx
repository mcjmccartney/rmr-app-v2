'use client';

import { useApp } from '@/context/AppContext';
import { PotentialDuplicate } from '@/types';
import { ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DuplicatesPage() {
  const router = useRouter();

  // Add error boundary for useApp hook
  let state, dismissDuplicate;
  try {
    const appContext = useApp();
    state = appContext.state;
    dismissDuplicate = appContext.dismissDuplicate;
    console.log('App context loaded successfully', { duplicatesCount: state.potentialDuplicates.length });
  } catch (error) {
    console.error('Error loading app context:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Page</h1>
          <p className="text-gray-600">Unable to load duplicate detection data</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleDismiss = (duplicateId: string) => {
    if (window.confirm('Are you sure you want to dismiss this potential duplicate? This action cannot be undone.')) {
      dismissDuplicate(duplicateId);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebeadf' }}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Potential Duplicate Clients
          </h1>
          <p className="text-gray-600">
            {state.potentialDuplicates.length} potential duplicates found
          </p>
        </div>

        <div className="px-6 pb-6 max-w-4xl mx-auto">
          {state.potentialDuplicates.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900 mb-2">No Duplicate Clients Found</h2>
              <p className="text-gray-600">
                Your client database appears to be clean with no potential duplicates detected.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {state.potentialDuplicates.map((duplicate) => (
                <div key={duplicate.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {duplicate.dogName}
                    </h3>
                    <button
                      onClick={() => handleDismiss(duplicate.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Primary Client</h4>
                      <p>{duplicate.primaryClient.firstName} {duplicate.primaryClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.primaryClient.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Potential Duplicate</h4>
                      <p>{duplicate.duplicateClient.firstName} {duplicate.duplicateClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.duplicateClient.email}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Match reasons: {duplicate.matchReasons.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}