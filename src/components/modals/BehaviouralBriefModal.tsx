'use client';

import { BehaviouralBrief } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { format } from 'date-fns';

interface BehaviouralBriefModalProps {
  behaviouralBrief: BehaviouralBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onViewClient?: (client: any) => void;
}

export default function BehaviouralBriefModal({ behaviouralBrief, isOpen, onClose, onViewClient }: BehaviouralBriefModalProps) {
  const { dispatch, state } = useApp();

  if (!behaviouralBrief) return null;

  // Find the client for this behavioural brief
  const client = state.clients.find(c => c.behaviouralBriefId === behaviouralBrief.id);

  const handleDelete = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this behavioural brief? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_BEHAVIOURAL_BRIEF', payload: behaviouralBrief.id });
      
      // Also update the client to remove the behavioural brief reference
      if (client) {
        dispatch({ 
          type: 'UPDATE_CLIENT', 
          payload: { ...client, behaviouralBriefId: undefined } 
        });
      }
      
      onClose();
    }
  };

  const displayName = `${behaviouralBrief.ownerFirstName} ${behaviouralBrief.ownerLastName}${behaviouralBrief.dogName ? ` w/ ${behaviouralBrief.dogName}` : ''}`;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
    >
      <div className="space-y-6">
        {/* Submission Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Submitted</span>
            <span className="font-medium text-gray-900">
              {format(behaviouralBrief.submittedAt, 'PPP')} at {format(behaviouralBrief.submittedAt, 'p')}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Owner Name</span>
              <span className="font-medium text-gray-900">
                {behaviouralBrief.ownerFirstName} {behaviouralBrief.ownerLastName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Contact Number</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.contactNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Postcode</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.postcode}</span>
            </div>
          </div>
        </div>

        {/* Dog Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Dog Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dog Name</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.dogName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sex</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.sex}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Breed</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.breed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Preferred Session Type</span>
              <span className="font-medium text-gray-900">{behaviouralBrief.sessionType}</span>
            </div>
          </div>
        </div>

        {/* Life with Dog */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Life with Dog
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{behaviouralBrief.lifeWithDog}</p>
          </div>
        </div>

        {/* Best Outcome */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Desired Outcome
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{behaviouralBrief.bestOutcome}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          {client && (
            <button
              onClick={() => {
                if (onViewClient) {
                  onViewClient(client);
                } else {
                  dispatch({ type: 'SET_SELECTED_CLIENT', payload: client });
                }
                onClose();
              }}
              className="w-full bg-amber-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              View Client Profile
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Delete Behavioural Brief
          </button>
        </div>
      </div>
    </SlideUpModal>
  );
}
