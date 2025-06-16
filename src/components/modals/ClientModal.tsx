'use client';

import { useState, useEffect } from 'react';
import { Client, Session, Membership } from '@/types';
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
  const { state, updateClient, deleteClient, getMembershipsByClientId, getMembershipsByEmail } = useApp();
  const [activeTab, setActiveTab] = useState<'sessions' | 'memberships'>('sessions');
  const [clientSessions, setClientSessions] = useState<Session[]>([]);
  const [clientMemberships, setClientMemberships] = useState<Membership[]>([]);
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
        setClientMemberships([]);
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        // Load sessions for this client
        console.log('Loading sessions for client:', currentClient.id);
        const sessions = await sessionService.getByClientId(currentClient.id);
        console.log('Found sessions:', sessions.length);
        setClientSessions(sessions || []);

        // Load memberships for this client by email
        let memberships: Membership[] = [];
        if (currentClient.email) {
          console.log('Loading memberships for email:', currentClient.email);
          memberships = await getMembershipsByEmail(currentClient.email);
          console.log('Found memberships:', memberships.length);
        }

        setClientMemberships(memberships || []);
      } catch (error) {
        console.error('Error loading client data:', error);
        setClientSessions([]);
        setClientMemberships([]);
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

  const handleDelete = async () => {
    if (!currentClient) return;
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await deleteClient(currentClient.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  const handleToggleActive = async () => {
    if (!currentClient) return;
    try {
      await updateClient(currentClient.id, { active: !currentClient.active });
    } catch (error) {
      console.error('Failed to update client active status:', error);
      alert('Failed to update client status. Please try again.');
    }
  };

  const handleToggleMembership = async () => {
    if (!currentClient) return;
    try {
      await updateClient(currentClient.id, { membership: !currentClient.membership });
    } catch (error) {
      console.error('Failed to update client membership status:', error);
      alert('Failed to update membership status. Please try again.');
    }
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

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Booking Terms</span>
            <div className="flex items-center gap-2">
              {currentClient.email && state.bookingTerms.some(bt => bt.email?.toLowerCase() === currentClient.email?.toLowerCase()) ? (
                <>
                  <span className="text-green-600 text-sm font-medium">✓ Signed</span>
                  {(() => {
                    const bookingTerm = state.bookingTerms.find(bt => bt.email?.toLowerCase() === currentClient.email?.toLowerCase());
                    return bookingTerm?.submitted && (
                      <span className="text-gray-500 text-xs">
                        {new Date(bookingTerm.submitted).toLocaleDateString('en-GB')}
                      </span>
                    );
                  })()}
                </>
              ) : (
                <span className="text-gray-500 text-sm">Not signed</span>
              )}
            </div>
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
                setActiveTab('memberships');
                setIsTabExpanded(!isTabExpanded || activeTab !== 'memberships');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'memberships' && isTabExpanded
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Memberships ({Array.isArray(clientMemberships) ? clientMemberships.length : 0})
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
                          // Sessions are sorted by date descending (most recent first),
                          // but session numbers should be chronological (oldest = Session 1)
                          // So we reverse the numbering: total sessions - current index
                          const sessionNumber = clientSessions.length - index;
                          return (
                            <div key={session.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    Session {sessionNumber}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {session.bookingDate ? new Date(session.bookingDate).toLocaleDateString('en-GB') : 'No date'} at {session.bookingTime ? session.bookingTime.substring(0, 5) : 'No time'}
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

                  {/* Memberships Tab */}
                  {activeTab === 'memberships' && (
                    <div className="space-y-2">
                      {Array.isArray(clientMemberships) && clientMemberships.length > 0 ? (
                        clientMemberships.map((membership) => {
                          if (!membership || !membership.id) return null;
                          return (
                            <div key={membership.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {new Date(membership.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(membership.date).toLocaleDateString('en-GB')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900 text-sm">
                                    £{(membership.amount || 0).toFixed(2)}
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
