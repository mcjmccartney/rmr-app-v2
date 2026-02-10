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
import { Calendar, UserPlus, Users, UserCheck, ClipboardList, FileQuestion, Star, Edit3, Download, FileSpreadsheet, Send } from 'lucide-react';
import { groupCoachingResetService } from '@/services/groupCoachingResetService';
import { formatClientWithAllDogs, getClientDogsPart } from '@/utils/dateFormatting';
import * as XLSX from 'xlsx';

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
  const [sendingToN8n, setSendingToN8n] = useState(false);

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

    } catch (error) {
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

  // Handle sending selected members to n8n webhook
  const handleSendToN8n = async () => {
    console.log('[N8N_WEBHOOK] Button clicked!');
    console.log('[N8N_WEBHOOK] Selected clients count:', selectedClients.size);

    if (selectedClients.size === 0) {
      console.warn('[N8N_WEBHOOK] No members selected to send to n8n');
      return;
    }

    try {
      setSendingToN8n(true);
      console.log('[N8N_WEBHOOK] Starting webhook send...');

      // Get the selected clients' emails as an array
      const memberEmails = Array.from(selectedClients)
        .map(clientId => {
          const client = state.clients.find(c => c.id === clientId);
          return client?.email || null;
        })
        .filter(email => email !== null && email !== ''); // Remove null/empty emails

      // Get the selected clients' first names as an array
      const memberFirstNames = Array.from(selectedClients)
        .map(clientId => {
          const client = state.clients.find(c => c.id === clientId);
          return client?.firstName || null;
        })
        .filter(name => name !== null && name !== ''); // Remove null/empty names

      console.log(`[N8N_WEBHOOK] Sending ${memberEmails.length} members to n8n webhook`);
      console.log('[N8N_WEBHOOK] Member emails (array):', memberEmails);
      console.log('[N8N_WEBHOOK] Member first names (array):', memberFirstNames);

      const webhookUrl = 'https://n8n.srv836498.hstgr.cloud/webhook-test/fbd5123f-deec-414a-bf46-f6190f833c76';
      console.log('[N8N_WEBHOOK] Webhook URL:', webhookUrl);

      // Send to n8n webhook (test endpoint)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberEmails: memberEmails,
          memberFirstNames: memberFirstNames
        })
      });

      console.log('[N8N_WEBHOOK] Response status:', response.status);
      console.log('[N8N_WEBHOOK] Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.text();
        console.log(`[N8N_WEBHOOK] ✅ Successfully sent ${memberEmails.length} members to n8n`);
        console.log('[N8N_WEBHOOK] Response data:', responseData);
      } else {
        const errorText = await response.text();
        console.error(`[N8N_WEBHOOK] ❌ Failed to send webhook:`, response.status, response.statusText);
        console.error('[N8N_WEBHOOK] Error response:', errorText);
      }

    } catch (error) {
      console.error('[N8N_WEBHOOK] Error sending to n8n:', error);
    } finally {
      setSendingToN8n(false);
      console.log('[N8N_WEBHOOK] Finished webhook send');
    }
  };

  const filteredClients = state.clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();

    // Check if any email aliases match the search term
    const clientAliases = state.clientEmailAliases[client.id] || [];
    const matchesEmailAlias = clientAliases.some(alias =>
      alias.email.toLowerCase().includes(searchTerm)
    );

    const matchesSearch = (
      client.firstName?.toLowerCase().includes(searchTerm) ||
      client.lastName?.toLowerCase().includes(searchTerm) ||
      client.dogName?.toLowerCase().includes(searchTerm) ||
      client.otherDogs?.some(dog => dog.toLowerCase().includes(searchTerm)) ||
      client.email?.toLowerCase().includes(searchTerm) ||
      matchesEmailAlias
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

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredClients.map(client => ({
      'First Name': client.firstName || '',
      'Last Name': client.lastName || '',
      'Partner Name': client.partnerName || '',
      'Dog Name': client.dogName || '',
      'Other Dogs': client.otherDogs?.join(', ') || '',
      'Email': client.email || '',
      'Phone': client.phone || '',
      'Address': client.address || '',
      'Member': client.membership ? 'Yes' : 'No',
      'Active': client.active ? 'Yes' : 'No',
      'Booking Terms Signed': client.booking_terms_signed ? 'Yes' : 'No',
      'Booking Terms Date': client.booking_terms_signed_date || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 15 }, // Partner Name
      { wch: 15 }, // Dog Name
      { wch: 20 }, // Other Dogs
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 40 }, // Address
      { wch: 8 },  // Member
      { wch: 8 },  // Active
      { wch: 20 }, // Booking Terms Signed
      { wch: 18 }, // Booking Terms Date
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `RMR_Clients_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
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
              icon: FileSpreadsheet,
              onClick: handleExportToExcel,
              title: 'Export to Excel',
              isActive: false,
              iconOnly: true
            },
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
                        <span className={`text-sm font-normal ${client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                          {getClientDogsPart(client)}
                        </span>
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

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSendToN8n}
                disabled={selectedClients.size === 0 || sendingToN8n}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (selectedClients.size === 0 || sendingToN8n) ? '#9bb59b' : '#4f6749'
                }}
                onMouseEnter={(e) => {
                  if (selectedClients.size > 0 && !sendingToN8n) {
                    e.currentTarget.style.backgroundColor = '#3d5038';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedClients.size > 0 && !sendingToN8n) {
                    e.currentTarget.style.backgroundColor = '#4f6749';
                  }
                }}
              >
                <Send size={16} />
                {sendingToN8n ? 'Sending...' : 'Send Draft Email'}
              </button>

              <div className="flex space-x-3">
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
