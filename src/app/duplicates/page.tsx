'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PotentialDuplicate, Client } from '@/types';
import { useRouter } from 'next/navigation';
import MergeClientModal from '@/components/modals/MergeClientModal';

export default function DuplicatesPage() {
  const router = useRouter();
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergingDuplicate, setMergingDuplicate] = useState<PotentialDuplicate | null>(null);

  // Add error boundary for useApp hook
  let state, dismissDuplicate, loadClients, clearDismissedDuplicates;
  try {
    const appContext = useApp();
    state = appContext.state;
    dismissDuplicate = appContext.dismissDuplicate;
    loadClients = appContext.loadClients;
    clearDismissedDuplicates = appContext.clearDismissedDuplicates;
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

  const handleDismiss = async (duplicateId: string) => {
    if (window.confirm('Are you sure you want to dismiss this potential duplicate? This action cannot be undone.')) {
      try {
        await dismissDuplicate(duplicateId);
      } catch (error) {
        console.error('Error dismissing duplicate:', error);
        alert('Failed to dismiss duplicate. Please try again.');
      }
    }
  };

  const handleMerge = (duplicate: PotentialDuplicate) => {
    setMergingDuplicate(duplicate);
    setShowMergeModal(true);
  };

  const handleMergeComplete = async (_mergedClient: Client) => {
    // Refresh the clients list and duplicates
    await loadClients();
    setShowMergeModal(false);
    setMergingDuplicate(null);
  };

  const handleCloseMergeModal = () => {
    setShowMergeModal(false);
    setMergingDuplicate(null);
  };

  return (
    <div className="min-h-screen bg-white">
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

          {/* Debug button for testing localStorage */}
          <div className="mt-4">
            <button
              onClick={() => {
                console.log('🔍 Current localStorage content:', localStorage.getItem('dismissedDuplicates'));
                console.log('🔍 Parsed dismissed IDs:', JSON.parse(localStorage.getItem('dismissedDuplicates') || '[]'));
              }}
              className="mr-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Debug localStorage
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear all dismissed duplicates? This will make them all visible again.')) {
                  try {
                    await clearDismissedDuplicates();
                  } catch (error) {
                    console.error('Error clearing dismissed duplicates:', error);
                    alert('Failed to clear dismissed duplicates. Please try again.');
                  }
                }
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear All Dismissed
            </button>
          </div>
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
                <div
                  key={duplicate.id}
                  className="bg-white p-6"
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {duplicate.dogName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      duplicate.confidence === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {duplicate.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Primary Client</h4>
                      <p className="font-medium">{duplicate.primaryClient.firstName} {duplicate.primaryClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.primaryClient.email}</p>
                      {duplicate.primaryClient.phone && (
                        <p className="text-sm text-gray-600">{duplicate.primaryClient.phone}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Potential Duplicate</h4>
                      <p className="font-medium">{duplicate.duplicateClient.firstName} {duplicate.duplicateClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.duplicateClient.email}</p>
                      {duplicate.duplicateClient.phone && (
                        <p className="text-sm text-gray-600">{duplicate.duplicateClient.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Match reasons: {duplicate.matchReasons.join(', ')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => handleMerge(duplicate)}
                      className="px-6 py-3 text-white font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: '#973b00',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
                    >
                      Merge Clients
                    </button>
                    <button
                      onClick={() => handleDismiss(duplicate.id)}
                      className="px-6 py-3 text-white font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: '#973b00',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merge Modal */}
      <MergeClientModal
        primaryClient={mergingDuplicate?.primaryClient || null}
        duplicateClient={mergingDuplicate?.duplicateClient || null}
        isOpen={showMergeModal}
        onClose={handleCloseMergeModal}
        onMergeComplete={handleMergeComplete}
      />
    </div>
  );
}