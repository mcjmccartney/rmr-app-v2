'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { clientMergeService, MergePreview } from '@/services/clientMergeService';
import SlideUpModal from './SlideUpModal';

interface MergeClientModalProps {
  primaryClient: Client | null;
  duplicateClient: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedClient: Client) => void;
}

export default function MergeClientModal({
  primaryClient,
  duplicateClient,
  isOpen,
  onClose,
  onMergeComplete
}: MergeClientModalProps) {
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [userChoices, setUserChoices] = useState<{ [field: string]: any }>({});

  // Load merge preview when modal opens
  useEffect(() => {
    const loadPreview = async () => {
      if (!isOpen || !primaryClient || !duplicateClient) {
        setMergePreview(null);
        return;
      }

      setIsLoading(true);
      try {
        const preview = await clientMergeService.generateMergePreview(primaryClient, duplicateClient);
        setMergePreview(preview);
        
        // Initialize user choices with suggested values
        const initialChoices: { [field: string]: any } = {};
        preview.conflicts.forEach(conflict => {
          initialChoices[conflict.field] = conflict.suggestedValue;
        });
        setUserChoices(initialChoices);
      } catch (error) {
        console.error('Error loading merge preview:', error);
        alert('Failed to load merge preview. Please try again.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, primaryClient, duplicateClient, onClose]);

  const handleMerge = async () => {
    if (!primaryClient || !duplicateClient) return;

    setIsMerging(true);
    try {
      const result = await clientMergeService.mergeClients(
        primaryClient,
        duplicateClient,
        userChoices
      );

      if (result.success) {
        alert(`Merge completed successfully!\n\n` +
          `• Transferred ${result.transferredSessions} sessions\n` +
          `• Transferred ${result.transferredForms} forms\n` +
          `• Transferred ${result.transferredMemberships} memberships`);
        
        onMergeComplete(result.mergedClient);
        onClose();
      } else {
        alert(`Merge failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during merge:', error);
      alert('Merge failed. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleConflictChoice = (field: string, value: any) => {
    setUserChoices(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!primaryClient || !duplicateClient) return null;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Clients"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading merge preview...</div>
          </div>
        ) : mergePreview ? (
          <>
            {/* Merge Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Merge Summary</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• {mergePreview.mergedData.sessionsToTransfer.length} sessions will be transferred</div>
                <div>• {
                  mergePreview.mergedData.formsToTransfer.behaviouralBriefs.length +
                  mergePreview.mergedData.formsToTransfer.behaviourQuestionnaires.length +
                  mergePreview.mergedData.formsToTransfer.bookingTerms.length
                } forms will be transferred</div>
                <div>• {mergePreview.mergedData.membershipsToTransfer.length} membership records will be transferred</div>
                <div>• Duplicate client will be permanently deleted</div>
              </div>
            </div>

            {/* Conflicts Resolution */}
            {mergePreview.conflicts.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Resolve Conflicts</h3>
                <div className="text-sm text-gray-600 mb-4">
                  Choose which information to keep when there are differences:
                </div>
                
                {mergePreview.conflicts.map((conflict, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-3 capitalize">
                      {conflict.field.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Primary client option */}
                      <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`conflict-${conflict.field}`}
                          value="primary"
                          checked={userChoices[conflict.field] === conflict.primaryValue}
                          onChange={() => handleConflictChoice(conflict.field, conflict.primaryValue)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            Primary Client ({primaryClient.firstName} {primaryClient.lastName})
                          </div>
                          <div className="text-sm text-gray-600">
                            {Array.isArray(conflict.primaryValue) 
                              ? conflict.primaryValue.join(', ') 
                              : conflict.primaryValue}
                          </div>
                        </div>
                      </label>

                      {/* Duplicate client option */}
                      <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`conflict-${conflict.field}`}
                          value="duplicate"
                          checked={userChoices[conflict.field] === conflict.duplicateValue}
                          onChange={() => handleConflictChoice(conflict.field, conflict.duplicateValue)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            Duplicate Client ({duplicateClient.firstName} {duplicateClient.lastName})
                          </div>
                          <div className="text-sm text-gray-600">
                            {Array.isArray(conflict.duplicateValue) 
                              ? conflict.duplicateValue.join(', ') 
                              : conflict.duplicateValue}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-amber-600 font-bold">⚠️</div>
                <div>
                  <div className="font-medium text-amber-900">Warning</div>
                  <div className="text-sm text-amber-800">
                    This action cannot be undone. The duplicate client will be permanently deleted 
                    and all their data will be transferred to the primary client.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => !isMerging && (e.currentTarget.style.backgroundColor = '#7a2f00')}
                onMouseLeave={(e) => !isMerging && (e.currentTarget.style.backgroundColor = '#973b00')}
              >
                {isMerging ? 'Merging...' : 'Merge Clients'}
              </button>
              <button
                onClick={onClose}
                disabled={isMerging}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">Failed to load merge preview</div>
          </div>
        )}
      </div>
    </SlideUpModal>
  );
}
