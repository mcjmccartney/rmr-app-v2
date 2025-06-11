'use client';

import { BehaviouralBrief, Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { format } from 'date-fns';

interface BehaviouralBriefModalProps {
  behaviouralBrief: BehaviouralBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onViewClient?: (client: Client) => void;
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
        {/* Basic Information */}
        <div className="space-y-0 divide-y divide-gray-100">
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Owner(s) Name</span>
            <span className="font-semibold text-gray-900 text-right">
              {behaviouralBrief.ownerFirstName} {behaviouralBrief.ownerLastName}
            </span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Dog(s) Name</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.dogName}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Email</span>
            <span className="font-semibold text-gray-900 text-right break-all">{behaviouralBrief.email}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Contact Number</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.contactNumber}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Postcode</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.postcode}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Sex</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.sex}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Breed</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.breed}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Session Type</span>
            <span className="font-semibold text-gray-900 text-right">{behaviouralBrief.sessionType}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Submitted</span>
            <span className="font-semibold text-gray-900 text-right">
              {format(behaviouralBrief.submittedAt, 'dd/MM/yyyy, HH:mm')}
            </span>
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
