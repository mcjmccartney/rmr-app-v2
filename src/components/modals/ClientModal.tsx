'use client';

import { useState, useEffect } from 'react';
import { Client, Session } from '@/types';
import { useApp } from '@/context/AppContext';
import { sessionService } from '@/services/sessionService';
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
  const [activeTab, setActiveTab] = useState<'sessions' | 'membership'>('sessions');
  const [clientSessions, setClientSessions] = useState<Session[]>([]);
  const [membershipMonths, setMembershipMonths] = useState<Array<{ month: string; amount: number; status: string }>>([]); // Placeholder for membership data
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isTabExpanded, setIsTabExpanded] = useState(false);

  // Get the fresh client data from state to ensure we have the latest updates
  const currentClient = client ? (state.clients.find(c => c.id === client.id) || client) : null;

  // Find the behavioural brief for this client - with complete null safety
  const behaviouralBrief = (currentClient && currentClient.behaviouralBriefId)
    ? state.behaviouralBriefs.find(b => b.id === currentClient.behaviouralBriefId)
    : null;

  // Find the behaviour questionnaire for this client - with complete null safety
  const behaviourQuestionnaire = (currentClient && currentClient.behaviourQuestionnaireId)
    ? state.behaviourQuestionnaires.find(q => q.id === currentClient.behaviourQuestionnaireId)
    : null;

  // Load client sessions and membership data when modal opens
  useEffect(() => {
    const loadClientData = async () => {
      if (!isOpen || !currentClient?.id) {
        setClientSessions([]);
        setMembershipMonths([]);
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        // Load sessions for this client
        const sessions = await sessionService.getByClientId(currentClient.id);
        setClientSessions(sessions || []);

        // TODO: Load membership months when membership payments table is implemented
        // For now, create placeholder data based on membership status
        if (currentClient.membership) {
          // Placeholder: assume 3 months paid for members
          setMembershipMonths([
            { month: 'January 2024', amount: 50, status: 'Paid' },
            { month: 'February 2024', amount: 50, status: 'Paid' },
            { month: 'March 2024', amount: 50, status: 'Pending' },
          ]);
        } else {
          setMembershipMonths([]);
        }
      } catch (error) {
        console.error('Error loading client data:', error);
        setClientSessions([]);
        setMembershipMonths([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadClientData();
  }, [isOpen, currentClient?.id, currentClient?.membership]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsTabExpanded(false);
      setActiveTab('sessions');
    }
  }, [isOpen]);

  const handleDelete = () => {
    if (!currentClient) return;
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_CLIENT', payload: currentClient.id });
      onClose();
    }
  };

  const handleToggleActive = () => {
    if (!currentClient) return;
    dispatch({
      type: 'UPDATE_CLIENT',
      payload: { ...currentClient, active: !currentClient.active }
    });
  };

  const handleToggleMembership = () => {
    if (!currentClient) return;
    dispatch({
      type: 'UPDATE_CLIENT',
      payload: { ...currentClient, membership: !currentClient.membership }
    });
  };

  const handleEditClick = () => {
    if (!currentClient) return;
    onEditClient(currentClient);
  };

  // Early return after all hooks - ensure we have valid client data
  if (!client || !currentClient || !isOpen) return null;



  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentClient?.firstName || ''} ${currentClient?.lastName || ''}`.trim() || 'Client Details'}
    >
      <div className="space-y-6">
        {/* Client Details */}
        <div className="space-y-0 divide-y divide-gray-100">
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Owner(s) Name</span>
            <span className="font-semibold text-gray-900 text-right">{currentClient.firstName} {currentClient.lastName}</span>
          </div>

          {currentClient.dogName && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Dog(s) Name</span>
              <span className="font-semibold text-gray-900 text-right">{currentClient.dogName}</span>
            </div>
          )}

          {currentClient.phone && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Phone</span>
              <span className="font-semibold text-gray-900 text-right">{currentClient.phone}</span>
            </div>
          )}

          {currentClient.email && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="font-semibold text-gray-900 text-right break-all">{currentClient.email}</span>
            </div>
          )}

          {currentClient.otherDogs && currentClient.otherDogs.length > 0 && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Other Dogs</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">{currentClient.otherDogs.join(', ')}</span>
            </div>
          )}

          {currentClient.address && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Address</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">{currentClient.address}</span>
            </div>
          )}

          {/* Toggle Switches */}
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Active</span>
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

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Membership</span>
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

        {/* Collapsible Tab View for Sessions and Membership */}
        <div className="space-y-4">
          {/* Tab Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('sessions');
                setIsTabExpanded(!isTabExpanded || activeTab !== 'sessions');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sessions' && isTabExpanded
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sessions ({Array.isArray(clientSessions) ? clientSessions.length : 0})
            </button>
            <button
              onClick={() => {
                setActiveTab('membership');
                setIsTabExpanded(!isTabExpanded || activeTab !== 'membership');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'membership' && isTabExpanded
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Membership ({Array.isArray(membershipMonths) ? membershipMonths.length : 0})
            </button>
          </div>

          {/* Collapsible Tab Content */}
          {isTabExpanded && (
            <div className="min-h-[200px] max-h-[300px] overflow-y-auto transition-all duration-300 ease-in-out">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 text-sm">Loading...</div>
                </div>
              ) : (
                <>
                  {/* Sessions Tab */}
                  {activeTab === 'sessions' && (
                    <div className="space-y-2">
                      {Array.isArray(clientSessions) && clientSessions.length > 0 ? (
                        clientSessions.map((session, index) => {
                          if (!session || !session.id) return null;
                          return (
                            <div key={session.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    Session {index + 1}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {session.bookingDate ? new Date(session.bookingDate).toLocaleDateString('en-GB') : 'No date'} at {session.bookingTime || 'No time'}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {session.sessionType || 'Unknown type'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900 text-sm">
                                    £{(session.quote || 0).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }).filter(Boolean)
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-sm">No sessions found</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Membership Tab */}
                  {activeTab === 'membership' && (
                    <div className="space-y-2">
                      {Array.isArray(membershipMonths) && membershipMonths.length > 0 ? (
                        membershipMonths.map((month, index) => {
                          if (!month) return null;
                          return (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {month.month || 'Unknown month'}
                                  </div>
                                  <div className={`text-xs ${
                                    month.status === 'Paid' ? 'text-green-600' :
                                    month.status === 'Pending' ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {month.status || 'Unknown status'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900 text-sm">
                                    £{(month.amount || 0).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }).filter(Boolean)
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-sm">
                            {currentClient?.membership ? 'No membership payments found' : 'Not a member'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
