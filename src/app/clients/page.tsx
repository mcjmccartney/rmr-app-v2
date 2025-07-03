'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import AddModal from '@/components/AddModal';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import RMRLogo from '@/components/RMRLogo';
import { Client, Session, BehaviouralBrief, BehaviourQuestionnaire, Membership } from '@/types';
import { Calendar, UserPlus, Users, UserCheck, ClipboardList, FileQuestion, Star, Edit3, Download } from 'lucide-react';
import { groupCoachingResetService } from '@/services/groupCoachingResetService';

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  // Membership tracking state - stores reset dates for each client (now from database)
  const [membershipResets, setMembershipResets] = useState<{ [clientId: string]: string }>({});
  const [resetsLoaded, setResetsLoaded] = useState(false);

  // Load membership resets from database on component mount
  useEffect(() => {
    const loadResets = async () => {
      try {
        // First, try to migrate any existing localStorage data
        const localStorageData = localStorage.getItem('membershipResets');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          console.log('📦 Found localStorage data, migrating to database:', parsedData);

          try {
            await groupCoachingResetService.migrateFromLocalStorage(parsedData);
            // Clear localStorage after successful migration
            localStorage.removeItem('membershipResets');
            console.log('✅ Migration complete, localStorage cleared');
          } catch (migrationError) {
            console.warn('⚠️ Migration failed, keeping localStorage data:', migrationError);
          }
        }

        // Load all resets from database
        const allResets = await groupCoachingResetService.getAllResets();
        const resetMap: { [clientId: string]: string } = {};

        // Create a map of clientId -> most recent reset date
        allResets.forEach(reset => {
          if (!resetMap[reset.clientId] || reset.resetDate > resetMap[reset.clientId]) {
            resetMap[reset.clientId] = reset.resetDate;
          }
        });

        setMembershipResets(resetMap);
        setResetsLoaded(true);
        console.log('💾 Loaded group coaching resets from database:', resetMap);
      } catch (error) {
        console.error('❌ Error loading group coaching resets:', error);
        // Fallback to localStorage if database fails
        const localStorageData = localStorage.getItem('membershipResets');
        if (localStorageData) {
          setMembershipResets(JSON.parse(localStorageData));
          console.log('📦 Fallback: Using localStorage data');
        }
        setResetsLoaded(true);
      }
    };

    loadResets();
  }, []);

  // Handle openClient query parameter for navigation back from session plan
  useEffect(() => {
    const openClientId = searchParams.get('openClient');
    if (openClientId) {
      const client = state.clients.find(c => c.id === openClientId);
      if (client) {
        setSelectedClient(client);
        setShowClientModal(true);
        // Clear the query parameter
        router.replace('/clients');
      }
    }
  }, [searchParams, state.clients, router]);

  // Calculate membership count since reset for a client (including email aliases)
  const getMembershipCountSinceReset = (client: Client): number => {
    if (!client.email && !state.clientEmailAliases[client.id]) return 0;

    const resetDate = membershipResets[client.id];

    // Get all emails for this client (primary + aliases)
    const clientEmails: string[] = [];
    if (client.email) {
      clientEmails.push(client.email.toLowerCase());
    }

    // Add email aliases
    const aliases = state.clientEmailAliases[client.id] || [];
    aliases.forEach(alias => {
      if (alias.email && !clientEmails.includes(alias.email.toLowerCase())) {
        clientEmails.push(alias.email.toLowerCase());
      }
    });

    if (clientEmails.length === 0) return 0;

    // Find memberships for any of the client's emails
    const clientMemberships = state.memberships.filter(m =>
      clientEmails.includes(m.email.toLowerCase())
    );

    if (!resetDate) {
      // No reset date, count all memberships
      return clientMemberships.length;
    }

    // Count memberships after reset date
    return clientMemberships.filter(m => m.date > resetDate).length;
  };

  // Handle "Added to Session" button click
  const handleAddedToSession = async (client: Client) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Save to database
      await groupCoachingResetService.addReset(client.id, today);

      // Update local state
      setMembershipResets(prev => ({
        ...prev,
        [client.id]: today
      }));

      console.log(`✅ Reset group coaching count for ${client.firstName} ${client.lastName}`);
    } catch (error) {
      console.error('❌ Error resetting group coaching count:', error);
      alert('Failed to reset group coaching count. Please try again.');
    }
  };

  // Handle checkbox selection
  const handleClientSelection = (clientId: string, checked: boolean) => {
    const newSelectedClients = new Set(selectedClients);
    if (checked) {
      newSelectedClients.add(clientId);
    } else {
      newSelectedClients.delete(clientId);
    }
    setSelectedClients(newSelectedClients);
  };

  // Handle bulk "Added to Session" for selected clients
  const handleBulkAddedToSession = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Process all selected clients
      for (const clientId of selectedClients) {
        await groupCoachingResetService.addReset(clientId, today);
      }

      // Update local state for all selected clients
      const updates: { [key: string]: string } = {};
      selectedClients.forEach(clientId => {
        updates[clientId] = today;
      });

      setMembershipResets(prev => ({
        ...prev,
        ...updates
      }));

      console.log(`✅ Reset group coaching count for ${selectedClients.size} clients`);

      // Clear selections and close modal
      setSelectedClients(new Set());
      setShowExportModal(false);
    } catch (error) {
      console.error('❌ Error resetting group coaching counts:', error);
      alert('Failed to reset group coaching counts. Please try again.');
    }
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

  const handleViewSession = (session: Session) => {
    // Navigate to session plan page with the session ID and indicate we came from clients page
    router.push(`/session-plan?sessionId=${session.id}&from=clients&clientId=${session.clientId}`);
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
            ...(selectedClients.size > 0 ? [{
              icon: Download,
              onClick: () => setShowExportModal(true),
              title: `Export (${selectedClients.size})`,
              isActive: false,
              iconOnly: true
            }] : []),
            {
              icon: Star,
              onClick: () => {
                const newShowMembersOnly = !showMembersOnly;
                setShowMembersOnly(newShowMembersOnly);
                // Clear selections when turning off Members filter
                if (!newShowMembersOnly) {
                  setSelectedClients(new Set());
                }
              },
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
                              {/* Checkbox for Members filter */}
                              {showMembersOnly && (
                                <input
                                  type="checkbox"
                                  checked={selectedClients.has(client.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleClientSelection(client.id, e.target.checked);
                                  }}
                                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                                />
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

                  {/* Checkbox for Members filter */}
                  {showMembersOnly && (
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleClientSelection(client.id, e.target.checked);
                      }}
                      className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                    />
                  )}

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
        onViewSession={handleViewSession}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Client Emails</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(selectedClients).map(clientId => {
                    const client = state.clients.find(c => c.id === clientId);
                    if (!client) return null;

                    return (
                      <tr key={clientId} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600">
                          {client.email || 'No email'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddedToSession}
                className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Added
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  );
}
