'use client';

import { Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';

interface ClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClient: (client: Client) => void;
  onViewBehaviouralBrief?: (behaviouralBriefId: string) => void;
  onViewBehaviourQuestionnaire?: (behaviourQuestionnaireId: string) => void;
}

export default function ClientModal({ client, isOpen, onClose, onEditClient, onViewBehaviouralBrief, onViewBehaviourQuestionnaire }: ClientModalProps) {
  const { dispatch, state } = useApp();

  if (!client) return null;

  // Get the fresh client data from state to ensure we have the latest updates
  const currentClient = state.clients.find(c => c.id === client.id) || client;

  // Find the behavioural brief for this client
  const behaviouralBrief = currentClient.behaviouralBriefId
    ? state.behaviouralBriefs.find(b => b.id === currentClient.behaviouralBriefId)
    : null;

  // Find the behaviour questionnaire for this client
  const behaviourQuestionnaire = currentClient.behaviourQuestionnaireId
    ? state.behaviourQuestionnaires.find(q => q.id === currentClient.behaviourQuestionnaireId)
    : null;

  const handleDelete = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_CLIENT', payload: currentClient.id });
      onClose();
    }
  };

  const handleToggleActive = () => {
    dispatch({
      type: 'UPDATE_CLIENT',
      payload: { ...currentClient, active: !currentClient.active }
    });
  };

  const handleToggleMembership = () => {
    dispatch({
      type: 'UPDATE_CLIENT',
      payload: { ...currentClient, membership: !currentClient.membership }
    });
  };

  const handleEditClick = () => {
    onEditClient(currentClient);
  };

  const getAvatarText = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentClient.firstName} ${currentClient.lastName}`}
    >
      <div className="space-y-6">
        {/* Client Details */}
        <div className="space-y-4">
          {currentClient.email && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{currentClient.email}</span>
            </div>
          )}

          {currentClient.phone && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium text-gray-900">{currentClient.phone}</span>
            </div>
          )}

          {currentClient.dogName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dog Name</span>
              <span className="font-medium text-gray-900">{currentClient.dogName}</span>
            </div>
          )}

          {currentClient.otherDogs && currentClient.otherDogs.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Other Dogs</span>
              <span className="font-medium text-gray-900">{currentClient.otherDogs.join(', ')}</span>
            </div>
          )}

          {currentClient.address && (
            <div className="space-y-1">
              <span className="text-gray-600">Address</span>
              <div className="font-medium text-gray-900 text-right">{currentClient.address}</div>
            </div>
          )}

          {/* Toggle Switches */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Active</span>
            <button
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                currentClient.active ? 'bg-gray-300' : 'bg-gray-300'
              }`}
              style={currentClient.active ? { backgroundColor: '#4f6749' } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  currentClient.active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Membership</span>
            <button
              onClick={handleToggleMembership}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                currentClient.membership ? 'bg-gray-300' : 'bg-gray-300'
              }`}
              style={currentClient.membership ? { backgroundColor: '#4f6749' } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  currentClient.membership ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Behavioural Brief Button */}
        {behaviouralBrief && onViewBehaviouralBrief && (
          <button
            onClick={() => onViewBehaviouralBrief(behaviouralBrief.id)}
            className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#4f6749' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
          >
            View Behavioural Brief
          </button>
        )}

        {/* Behaviour Questionnaire Button */}
        {behaviourQuestionnaire && onViewBehaviourQuestionnaire && (
          <button
            onClick={() => onViewBehaviourQuestionnaire(behaviourQuestionnaire.id)}
            className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#4f6749' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
          >
            View Behaviour Questionnaire
          </button>
        )}

        {/* Edit Button */}
        <button
          onClick={handleEditClick}
          className="w-full bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Edit Client
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Delete Client
        </button>
      </div>
    </SlideUpModal>
  );
}
