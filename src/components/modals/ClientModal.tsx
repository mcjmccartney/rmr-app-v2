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
  const { state, updateClient, deleteClient, getMembershipsByClientId, getMembershipsByEmail, getMembershipsByClientIdWithAliases } = useApp();
  const [activeTab, setActiveTab] = useState<'sessions' | 'memberships'>('sessions');
  const [clientSessions, setClientSessions] = useState<Session[]>([]);
  const [clientMemberships, setClientMemberships] = useState<Membership[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isTabExpanded, setIsTabExpanded] = useState(false);
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);
  const [isSendingBookingTermsUpdate, setIsSendingBookingTermsUpdate] = useState(false);

  // Get the fresh client data from state to ensure we have the latest updates
  const currentClient = client ? (state.clients.find(c => c.id === client.id) || client) : null;

  // Helper function to get all emails for a client (including aliases)
  const getClientEmails = (client: any) => {
    const emails: string[] = [];
    if (client?.email) {
      emails.push(client.email.toLowerCase());
    }
    // Add email aliases if available
    const aliases = state.clientEmailAliases?.[client?.id];
    if (aliases && Array.isArray(aliases)) {
      aliases.forEach((alias: any) => {
        const aliasEmail = alias?.email?.toLowerCase();
        if (aliasEmail && !emails.includes(aliasEmail)) {
          emails.push(aliasEmail);
        }
      });
    }
    return emails;
  };

  // Find the behavioural brief for this client - look for briefs with matching client_id
  const behaviouralBrief = currentClient
    ? state.behaviouralBriefs.find(b => b.client_id === currentClient.id) ||
      (currentClient.behaviouralBriefId ? state.behaviouralBriefs.find(b => b.id === currentClient.behaviouralBriefId) : null)
    : null;

  // Find all behaviour questionnaires for this client - look for questionnaires with matching client_id
  const behaviourQuestionnaires = currentClient
    ? state.behaviourQuestionnaires.filter(q => q.client_id === currentClient.id)
    : [];

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

        // Load memberships for this client including email aliases
        let memberships: Membership[] = [];
        console.log('Loading memberships for client ID:', currentClient.id);
        memberships = await getMembershipsByClientIdWithAliases(currentClient.id);
        console.log('Found memberships (including aliases):', memberships.length);

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
    if (!currentClient || isUpdatingActive) return;
    setIsUpdatingActive(true);
    try {
      await updateClient(currentClient.id, { active: !currentClient.active });
    } catch (error) {
      console.error('Failed to update client active status:', error);
      alert('Failed to update client status. Please try again.');
    } finally {
      setIsUpdatingActive(false);
    }
  };

  const handleToggleMembership = async () => {
    if (!currentClient || isUpdatingMembership) return;
    setIsUpdatingMembership(true);
    try {
      await updateClient(currentClient.id, { membership: !currentClient.membership });
    } catch (error) {
      console.error('Failed to update client membership status:', error);
      alert('Failed to update membership status. Please try again.');
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  const handleEditClick = () => {
    if (!currentClient) return;
    onEditClient(currentClient);
  };

  const handleSendBookingTermsUpdate = async () => {
    if (!currentClient?.firstName?.trim() || !currentClient?.email?.trim()) {
      alert('Client must have both first name and email address to send booking terms update.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentClient.email.trim())) {
      alert('Client must have a valid email address to send booking terms update.');
      return;
    }

    if (!confirm(`Send booking terms update email to ${currentClient.firstName.trim()} (${currentClient.email.trim()})?`)) {
      return;
    }

    setIsSendingBookingTermsUpdate(true);
    try {
      const response = await fetch('/api/send-booking-terms-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: currentClient.firstName.trim(),
          email: currentClient.email.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send booking terms update email');
      }

      alert(`Booking terms update email sent successfully to ${currentClient.firstName}!`);
    } catch (error) {
      console.error('Error sending booking terms update email:', error);
      alert('Failed to send booking terms update email. Please try again.');
    } finally {
      setIsSendingBookingTermsUpdate(false);
    }
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
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Email</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 break-all">{currentClient.email}</div>
                {(() => {
                  // Get email aliases for this client
                  const aliases = state.clientEmailAliases?.[currentClient.id];
                  const aliasEmails = aliases?.filter(alias =>
                    alias.email.toLowerCase() !== currentClient.email?.toLowerCase() && !alias.isPrimary
                  ) || [];

                  if (aliasEmails.length > 0) {
                    return (
                      <div className="mt-1 space-y-1">
                        {aliasEmails.map((alias, index) => (
                          <div key={alias.id} className="text-sm text-gray-500 break-all">
                            {alias.email}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {currentClient.partnerName && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Partner Name</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">
                {currentClient.partnerName}
              </span>
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
              disabled={isUpdatingActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isUpdatingActive ? 'opacity-50 cursor-not-allowed' : ''
              } ${currentClient.active ? 'bg-gray-300' : 'bg-gray-300'}`}
              style={currentClient.active ? { backgroundColor: '#4f6749' } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  currentClient.active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isUpdatingActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Membership</span>
            <button
              onClick={handleToggleMembership}
              disabled={isUpdatingMembership}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isUpdatingMembership ? 'opacity-50 cursor-not-allowed' : ''
              } ${currentClient.membership ? 'bg-gray-300' : 'bg-gray-300'}`}
              style={currentClient.membership ? { backgroundColor: '#4f6749' } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  currentClient.membership ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isUpdatingMembership && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>



          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Booking Terms</span>
            <div className="flex items-center gap-2">
              {(() => {
                const clientEmails = getClientEmails(currentClient);
                const hasSignedBookingTerms = clientEmails.length > 0 &&
                  state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || ''));

                if (hasSignedBookingTerms) {
                  const bookingTerm = state.bookingTerms.find(bt => clientEmails.includes(bt.email?.toLowerCase() || ''));
                  return (
                    <>
                      <span className="text-green-600 text-sm font-medium">✓ Signed</span>
                      {bookingTerm?.submitted && (
                        <span className="text-gray-500 text-xs">
                          {new Date(bookingTerm.submitted).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </>
                  );
                } else {
                  return <span className="text-gray-500 text-sm">Not signed</span>;
                }
              })()}
            </div>
          </div>
        </div>

        {/* Send Booking Terms Update Button */}
        {currentClient?.firstName?.trim() && currentClient?.email?.trim() && (
          <div className="pt-4">
            <button
              onClick={handleSendBookingTermsUpdate}
              disabled={isSendingBookingTermsUpdate}
              className="w-full bg-amber-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingBookingTermsUpdate ? 'Sending...' : 'Send Booking Terms Update'}
            </button>
          </div>
        )}

        {/* Behavioural Brief and Behaviour Questionnaire Buttons */}
        {(behaviouralBrief || behaviourQuestionnaires.length > 0) && (
          <div className="space-y-3">
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

            {behaviourQuestionnaires.length > 0 && onViewBehaviourQuestionnaire && (
              <div className="space-y-2">
                {behaviourQuestionnaires.length === 1 ? (
                  <button
                    onClick={() => onViewBehaviourQuestionnaire(behaviourQuestionnaires[0].id)}
                    className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#4f6749' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                  >
                    View Behaviour Questionnaire
                  </button>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Behaviour Questionnaires ({behaviourQuestionnaires.length})
                    </div>
                    {behaviourQuestionnaires.map((questionnaire) => (
                      <button
                        key={questionnaire.id}
                        onClick={() => onViewBehaviourQuestionnaire(questionnaire.id)}
                        className="w-full text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                        style={{ backgroundColor: '#4f6749' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                      >
                        View Questionnaire - {questionnaire.dogName}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
                            <div
                              key={session.id}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
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

        {/* Totals Section */}
        <div className="space-y-0 divide-y divide-gray-100 border-t border-gray-200 pt-4">
          {(() => {
            const sessionsTotal = Array.isArray(clientSessions) ?
              clientSessions.reduce((sum, session) => sum + (session?.quote || 0), 0) : 0;
            const membershipsTotal = Array.isArray(clientMemberships) ?
              clientMemberships.reduce((sum, membership) => sum + (membership?.amount || 0), 0) : 0;
            const grandTotal = sessionsTotal + membershipsTotal;

            return (
              <>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">Sessions Total</span>
                  <span className="font-semibold text-gray-900">£{sessionsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">Memberships Total</span>
                  <span className="font-semibold text-gray-900">£{membershipsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-700 font-semibold">Grand Total</span>
                  <span className="font-bold text-gray-900 text-lg">£{grandTotal.toFixed(2)}</span>
                </div>
              </>
            );
          })()}
        </div>

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
