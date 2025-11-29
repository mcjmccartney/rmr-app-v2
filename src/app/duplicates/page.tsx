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
  const [isScanning, setIsScanning] = useState(false);

  // Add error boundary for useApp hook
  let state, dismissDuplicate, loadClients, clearDismissedDuplicates, detectDuplicates;
  try {
    const appContext = useApp();
    state = appContext.state;
    dismissDuplicate = appContext.dismissDuplicate;
    loadClients = appContext.loadClients;
    clearDismissedDuplicates = appContext.clearDismissedDuplicates;
    detectDuplicates = appContext.detectDuplicates;
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

  const handleScanForDuplicates = async () => {
    setIsScanning(true);
    try {
      await detectDuplicates();
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      alert('Failed to scan for duplicates. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

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

          <button
            onClick={handleScanForDuplicates}
            disabled={isScanning}
            className="px-6 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#973b00',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => !isScanning && (e.currentTarget.style.backgroundColor = '#7a2f00')}
            onMouseLeave={(e) => !isScanning && (e.currentTarget.style.backgroundColor = '#973b00')}
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </span>
            ) : (
              '🔍 Scan for Duplicates'
            )}
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
              <p className="text-gray-600 mb-6">
                {isScanning
                  ? 'Scanning your client database for potential duplicates...'
                  : 'Click the button above to scan your client database for potential duplicates.'
                }
              </p>
              {isScanning && (
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
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