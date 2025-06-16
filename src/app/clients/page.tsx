'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import AddModal from '@/components/AddModal';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import RMRLogo from '@/components/RMRLogo';
import { Client, BehaviouralBrief, BehaviourQuestionnaire, Membership } from '@/types';
import { Calendar, UserPlus, Users, UserCheck, ClipboardList, FileQuestion, Star, Edit3 } from 'lucide-react';

export default function ClientsPage() {
  const { state, updateMembershipStatuses } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showBehaviouralBriefModal, setShowBehaviouralBriefModal] = useState(false);
  const [selectedBehaviouralBrief, setSelectedBehaviouralBrief] = useState<BehaviouralBrief | null>(null);
  const [showBehaviourQuestionnaireModal, setShowBehaviourQuestionnaireModal] = useState(false);
  const [selectedBehaviourQuestionnaire, setSelectedBehaviourQuestionnaire] = useState<BehaviourQuestionnaire | null>(null);
  const [showMembersOnly, setShowMembersOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Membership tracking state - stores reset dates for each client
  const [membershipResets, setMembershipResets] = useState<{ [clientId: string]: string }>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('membershipResets');
    return saved ? JSON.parse(saved) : {};
  });

  // Save membership resets to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('membershipResets', JSON.stringify(membershipResets));
  }, [membershipResets]);

  // Calculate membership count since reset for a client
  const getMembershipCountSinceReset = (client: Client): number => {
    if (!client.email) return 0;

    const resetDate = membershipResets[client.id];
    const clientMemberships = state.memberships.filter(m =>
      m.email.toLowerCase() === client.email?.toLowerCase()
    );

    if (!resetDate) {
      // No reset date, count all memberships
      return clientMemberships.length;
    }

    // Count memberships after reset date
    return clientMemberships.filter(m => m.date > resetDate).length;
  };

  // Handle "Added to Session" button click
  const handleAddedToSession = (client: Client) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    setMembershipResets(prev => ({
      ...prev,
      [client.id]: today
    }));
  };

  const filteredClients = state.clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = (
      client.firstName?.toLowerCase().includes(searchTerm) ||
      client.lastName?.toLowerCase().includes(searchTerm) ||
      client.dogName?.toLowerCase().includes(searchTerm) ||
      client.otherDogs?.some(dog => dog.toLowerCase().includes(searchTerm))
    );

    // Apply filters - if both are off, show all; if both are on, show clients that match both
    let matchesFilter = true;

    if (showMembersOnly && showActiveOnly) {
      matchesFilter = client.membership && client.active;
    } else if (showMembersOnly) {
      matchesFilter = client.membership;
    } else if (showActiveOnly) {
      matchesFilter = client.active;
    }

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Special sorting when Members filter is active
    if (showMembersOnly) {
      const aCount = getMembershipCountSinceReset(a);
      const bCount = getMembershipCountSinceReset(b);

      // Sort by membership count descending (highest first)
      if (aCount !== bCount) {
        return bCount - aCount;
      }

      // If same count, sort alphabetically
      const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return aName.localeCompare(bName);
    }

    // Default sorting when Members filter is not active
    if (a.membership !== b.membership) {
      return b.membership ? 1 : -1; // Members first
    }

    if (a.active !== b.active) {
      return b.active ? 1 : -1; // Active first within each membership group
    }

    // Alphabetical by first name, then last name
    const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    return aName.localeCompare(bName);
  });

  // Calculate counts
  const totalCount = state.clients.length;
  const membersCount = state.clients.filter(client => client.membership).length;
  const activeCount = state.clients.filter(client => client.active).length;



  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleAddClient = () => {
    setAddModalType('client');
    setShowAddModal(true);
  };

  const handleAddSession = () => {
    setAddModalType('session');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(false); // Close the client modal first
    setShowEditClientModal(true); // Then open the edit modal
  };

  const handleCloseEditClientModal = () => {
    setShowEditClientModal(false);
    setSelectedClient(null);
  };

  const handleViewBehaviouralBrief = (behaviouralBriefId: string) => {
    const brief = state.behaviouralBriefs.find(b => b.id === behaviouralBriefId);
    if (brief) {
      setSelectedBehaviouralBrief(brief);
      setShowClientModal(false);
      setShowBehaviouralBriefModal(true);
    }
  };

  const handleCloseBehaviouralBriefModal = () => {
    setShowBehaviouralBriefModal(false);
    setSelectedBehaviouralBrief(null);
  };

  const handleViewBehaviourQuestionnaire = (behaviourQuestionnaireId: string) => {
    const questionnaire = state.behaviourQuestionnaires.find(q => q.id === behaviourQuestionnaireId);
    if (questionnaire) {
      setSelectedBehaviourQuestionnaire(questionnaire);
      setShowClientModal(false);
      setShowBehaviourQuestionnaireModal(true);
    }
  };

  const handleCloseBehaviourQuestionnaireModal = () => {
    setShowBehaviourQuestionnaireModal(false);
    setSelectedBehaviourQuestionnaire(null);
  };

  const handleViewClientFromModal = (client: Client) => {
    // Close any open modals first
    setShowBehaviouralBriefModal(false);
    setShowBehaviourQuestionnaireModal(false);
    setSelectedBehaviouralBrief(null);
    setSelectedBehaviourQuestionnaire(null);

    // Open client modal
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const getDisplayTitle = () => {
    if (showMembersOnly && showActiveOnly) {
      return `${filteredClients.length} Active Members`;
    } else if (showMembersOnly) {
      return `${filteredClients.length} Members`;
    } else if (showActiveOnly) {
      return `${filteredClients.length} Active`;
    } else {
      return `${filteredClients.length} Total`;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title={getDisplayTitle()}
          buttons={[
            {
              icon: Star,
              onClick: () => setShowMembersOnly(!showMembersOnly),
              title: `Members (${membersCount})`,
              isActive: showMembersOnly,
              iconOnly: true
            },
            {
              icon: UserCheck,
              onClick: () => setShowActiveOnly(!showActiveOnly),
              title: `Active (${activeCount})`,
              isActive: showActiveOnly,
              iconOnly: true
            },
            {
              icon: Edit3,
              onClick: handleAddSession,
              title: 'Add Session',
              iconOnly: true
            },
            {
              icon: UserPlus,
              onClick: handleAddClient,
              title: 'Add Client',
              iconOnly: true
            }
          ]}
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search"
        />
      </div>

      <div className="px-4 pb-4 bg-gray-50 flex-1">
        {/* Clients List */}
        <div className="mt-4">
          {showMembersOnly ? (
            // Grouped view for Members filter
            (() => {
              // Group clients by membership count
              const groupedClients = filteredClients.reduce((groups, client) => {
                const count = getMembershipCountSinceReset(client);
                if (!groups[count]) {
                  groups[count] = [];
                }
                groups[count].push(client);
                return groups;
              }, {} as { [count: number]: Client[] });

              // Sort group keys (counts) in descending order
              const sortedCounts = Object.keys(groupedClients)
                .map(Number)
                .sort((a, b) => b - a);

              return sortedCounts.map(count => (
                <div key={count} className="mb-6">
                  {/* Group Header */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {count} Month{count !== 1 ? 's' : ''} Since Group Coaching
                  </h3>

                  {/* Clients in this group */}
                  <div className="space-y-2">
                    {groupedClients[count].map((client) => {
                      const showAddedToSessionButton = count >= 6;

                      return (
                        <div
                          key={client.id}
                          className={`rounded-lg p-3 shadow-sm transition-colors ${
                            client.active ? 'bg-white' : 'bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              onClick={() => handleClientClick(client)}
                              className="flex items-center space-x-3 cursor-pointer flex-1"
                            >
                              {client.membership && (
                                <RMRLogo size={32} />
                              )}
                              <div className={client.membership ? '' : 'ml-0'}>
                                <h3 className={`font-medium ${client.active ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {client.firstName} {client.lastName}
                                </h3>
                                {client.dogName && (
                                  <p className={`text-sm ${client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {client.dogName}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Form indicators */}
                              {client.behaviouralBriefId && (
                                <div className="bg-green-100 p-2 rounded-full" title="Has Behavioural Brief">
                                  <ClipboardList size={16} className="text-green-600" />
                                </div>
                              )}
                              {client.behaviourQuestionnaireId && (
                                <div className="bg-blue-100 p-2 rounded-full" title="Has Behaviour Questionnaire">
                                  <FileQuestion size={16} className="text-blue-600" />
                                </div>
                              )}

                              {/* Group Coaching Button - inline */}
                              {showAddedToSessionButton && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddedToSession(client);
                                  }}
                                  className="py-1.5 px-3 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                                >
                                  Added
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          ) : (
            // Standard view for non-Members filter
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className={`rounded-lg p-3 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer ${
                    client.active ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {client.membership && (
                      <RMRLogo size={32} />
                    )}
                    <div className={client.membership ? '' : 'ml-0'}>
                      <h3 className={`font-medium ${client.active ? 'text-gray-900' : 'text-gray-600'}`}>
                        {client.firstName} {client.lastName}
                        {client.dogName && (
                          <span className={`text-sm font-normal ${client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                            {' '}w/ {client.dogName}
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {client.behaviouralBriefId && (
                      <div className="bg-green-100 p-2 rounded-full" title="Has Behavioural Brief">
                        <ClipboardList size={16} className="text-green-600" />
                      </div>
                    )}
                    {client.behaviourQuestionnaireId && (
                      <div className="bg-blue-100 p-2 rounded-full" title="Has Behaviour Questionnaire">
                        <FileQuestion size={16} className="text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found</p>
          </div>
        )}
      </div>

      <AddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        type={addModalType}
      />

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClient}
        onViewBehaviouralBrief={handleViewBehaviouralBrief}
        onViewBehaviourQuestionnaire={handleViewBehaviourQuestionnaire}
      />

      <EditClientModal
        client={selectedClient}
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
      />

      <BehaviouralBriefModal
        behaviouralBrief={selectedBehaviouralBrief}
        isOpen={showBehaviouralBriefModal}
        onClose={handleCloseBehaviouralBriefModal}
        onViewClient={handleViewClientFromModal}
      />

      <BehaviourQuestionnaireModal
        behaviourQuestionnaire={selectedBehaviourQuestionnaire}
        isOpen={showBehaviourQuestionnaireModal}
        onClose={handleCloseBehaviourQuestionnaireModal}
        onViewClient={handleViewClientFromModal}
      />
    </div>
  );
}
