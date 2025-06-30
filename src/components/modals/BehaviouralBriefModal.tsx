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
          <div className="text-white text-lg font-bold p-3 mb-3 rounded-lg" style={{ backgroundColor: '#973b00' }}>
            In general, how is life with your dog, and what would you like help with?
          </div>
          <p className="text-xs text-gray-600 mb-2">New puppy, new dog, new rescue, general training, behaviour concern, etc.</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{behaviouralBrief.lifeWithDog}</p>
          </div>
        </div>

        {/* Best Outcome */}
        <div>
          <div className="text-white text-lg font-bold p-3 mb-3 rounded-lg" style={{ backgroundColor: '#973b00' }}>
            What would be the best outcome for you and your dog?
          </div>
          <p className="text-xs text-gray-600 mb-2">E.g. a better relationship, a happier dog, an easier home life, more relaxed walks, etc.</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{behaviouralBrief.bestOutcome}</p>
          </div>
        </div>

        {/* Session Type */}
        {behaviouralBrief.sessionType && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 rounded-lg" style={{ backgroundColor: '#973b00' }}>
              Which type of session would you ideally like?
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">{behaviouralBrief.sessionType}</p>
            </div>
          </div>
        )}

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
