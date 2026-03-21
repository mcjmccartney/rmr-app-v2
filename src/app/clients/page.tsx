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
import { Calendar, UserPlus, Users, UserCheck, ClipboardList, FileQuestion, Star, Edit3, Download, FileSpreadsheet, Send, GitMerge } from 'lucide-react';
import { groupCoachingResetService } from '@/services/groupCoachingResetService';
import { formatClientWithAllDogs, getClientDogsPart } from '@/utils/dateFormatting';
import * as XLSX from 'xlsx';

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateMembershipStatuses, updateClient } = useApp();
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
  // Persistent undo state — loaded from DB on mount, survives page refresh
  const [latestResetIds, setLatestResetIds] = useState<{ [clientId: string]: string }>({});
  const [previousResetDates, setPreviousResetDates] = useState<{ [clientId: string]: string | undefined }>({});

  // Load membership resets from database on component mount
  useEffect(() => {
    const loadResets = async () => {
      try {
        // First, try to migrate any existing localStorage data
        const localStorageData = localStorage.getItem('membershipResets');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);

          try {
            await groupCoachingResetService.migrateFromLocalStorage(parsedData);
            // Clear localStorage after successful migration
            localStorage.removeItem('membershipResets');
          } catch (migrationError) {
          }
        }

        // Load all resets from database
        const allResets = await groupCoachingResetService.getAllResets();

        // Group by clientId
        const resetsByClient: { [clientId: string]: typeof allResets } = {};
        allResets.forEach(reset => {
          if (!resetsByClient[reset.clientId]) resetsByClient[reset.clientId] = [];
          resetsByClient[reset.clientId].push(reset);
        });

        // For each client, sort by resetDate desc and extract the top two
        const resetMap: { [clientId: string]: string } = {};
        const latestIdMap: { [clientId: string]: string } = {};
        const previousDateMap: { [clientId: string]: string | undefined } = {};

        Object.entries(resetsByClient).forEach(([clientId, resets]) => {
          const sorted = [...resets].sort((a, b) => b.resetDate.localeCompare(a.resetDate));
          resetMap[clientId] = sorted[0].resetDate;        // most recent date (for counter)
          latestIdMap[clientId] = sorted[0].id;             // ID of most recent reset (for undo)
          previousDateMap[clientId] = sorted[1]?.resetDate; // second-most-recent (restore target)
        });

        setMembershipResets(resetMap);
        setLatestResetIds(latestIdMap);
        setPreviousResetDates(previousDateMap);
        setResetsLoaded(true);
      } catch (error) {
        console.error('❌ Error loading group coaching resets:', error);
        // Fallback to localStorage if database fails
        const localStorageData = localStorage.getItem('membershipResets');
        if (localStorageData) {
          setMembershipResets(JSON.parse(localStorageData));
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

  // Auto-reset when Group sessions have passed
  useEffect(() => {
    const autoResetForPastGroupSessions = async () => {
      // Only run after resets are loaded and we have sessions and participants
      if (!resetsLoaded || state.sessions.length === 0 || state.sessionParticipants.length === 0) {
        return;
      }

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all past Group sessions
        const pastGroupSessions = state.sessions.filter(session => {
          if (session.sessionType !== 'Group') return false;
          const sessionDate = new Date(session.bookingDate);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate < today;
        });

        if (pastGroupSessions.length === 0) return;

        // For each member, check if they participated in any past Group sessions
        const updates: { [clientId: string]: string } = {};

        for (const client of state.clients) {
          if (!client.membership) continue; // Only check members

          // Find all past Group sessions this client participated in
          const clientPastGroupSessions = pastGroupSessions.filter(session => {
            return state.sessionParticipants.some(
              participant => participant.sessionId === session.id && participant.clientId === client.id
            );
          });

          if (clientPastGroupSessions.length === 0) continue;

          // Find the most recent past Group session they participated in
          const mostRecentSession = clientPastGroupSessions.sort((a, b) =>
            b.bookingDate.localeCompare(a.bookingDate)
          )[0];

          const currentResetDate = membershipResets[client.id];

          // If they don't have a reset date, or their reset date is before the most recent Group session,
          // add a new reset with the session date
          if (!currentResetDate || currentResetDate < mostRecentSession.bookingDate) {

            // Add reset to database
            await groupCoachingResetService.addReset(client.id, mostRecentSession.bookingDate);

            // Track for local state update
            updates[client.id] = mostRecentSession.bookingDate;
          }
        }

        // Update local state if any resets were added
        if (Object.keys(updates).length > 0) {
          setMembershipResets(prev => ({
            ...prev,
            ...updates
          }));
        }
      } catch (error) {
        console.error('❌ Error auto-resetting for past Group sessions:', error);
      }
    };

    autoResetForPastGroupSessions();
  }, [resetsLoaded, state.sessions, state.sessionParticipants, state.clients, membershipResets]);

  // Calculate months since last Group Coaching reset for a client
  const getMembershipCountSinceReset = (client: Client): number => {
    const resetDate = membershipResets[client.id];

    if (!resetDate) {
      // No reset date - return 0 (they haven't been added to a Group session yet)
      return 0;
    }

    // Calculate months between reset date and today
    const reset = new Date(resetDate);
    const today = new Date();

    // Calculate the difference in months
    const yearsDiff = today.getFullYear() - reset.getFullYear();
    const monthsDiff = today.getMonth() - reset.getMonth();

    const totalMonths = yearsDiff * 12 + monthsDiff;

    // Return 0 if negative (shouldn't happen, but safety check)
    return Math.max(0, totalMonths);
  };

  // Handle "Added to Session" button click
  const handleAddedToSession = async (client: Client) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const previousDate = membershipResets[client.id]; // capture before overwriting

      // Save to database — returns the full reset including its id
      const newReset = await groupCoachingResetService.addReset(client.id, today);

      // Update local state
      setMembershipResets(prev => ({ ...prev, [client.id]: today }));
      setLatestResetIds(prev => ({ ...prev, [client.id]: newReset.id }));
      setPreviousResetDates(prev => ({ ...prev, [client.id]: previousDate }));

    } catch (error) {
      alert('Failed to reset group coaching count. Please try again.');
    }
  };

  // Handle "Undo" — reverts the most recent "Added" click for a client
  const handleUndoAddedToSession = async (client: Client) => {
    const resetId = latestResetIds[client.id];
    if (!resetId) return;
    try {
      await groupCoachingResetService.deleteReset(resetId);

      const previous = previousResetDates[client.id];
      setMembershipResets(prev => {
        const next = { ...prev };
        if (previous !== undefined) {
          next[client.id] = previous;
        } else {
          delete next[client.id];
        }
        return next;
      });

      setLatestResetIds(prev => { const n = { ...prev }; delete n[client.id]; return n; });
      setPreviousResetDates(prev => { const n = { ...prev }; delete n[client.id]; return n; });
    } catch (error) {
      alert('Failed to undo. Please try again.');
    }
  };

  // Handle archiving a member
  const handleArchiveMember = async (client: Client) => {
    await updateClient(client.id, { active: false });
  };

  // Handle unarchiving a member
  const handleUnarchiveMember = async (client: Client) => {
    await updateClient(client.id, { active: true });
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

    if (selectedClients.size === 0) {
      return;
    }

    try {
      setSendingToN8n(true);

      // Get the selected clients' emails as an array
      const memberEmails = Array.from(selectedClients)
        .map(clientId => {
          const client = state.clients.find(c => c.id === clientId);
          return client?.email || null;
        })
        .filter(email => email !== null && email !== ''); // Remove null/empty emails

      // Get upcoming Group sessions from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to midnight for accurate comparison

      const upcomingGroupSessions = state.sessions
        .filter(session => {
          // Only include Group sessions
          if (session.sessionType !== 'Group') return false;

          // Only include sessions from today onwards
          const sessionDate = new Date(session.bookingDate);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        })
        .sort((a, b) => {
          // Sort by date, then by time
          const dateCompare = a.bookingDate.localeCompare(b.bookingDate);
          if (dateCompare !== 0) return dateCompare;
          return a.bookingTime.localeCompare(b.bookingTime);
        });

      // Format sessions as unordered list
      // Format: "- Wednesday 4th Feb at 7pm"
      const formatSessionDateTime = (dateString: string, timeString: string): string => {
        const date = new Date(dateString);

        // Get day name (e.g., "Wednesday")
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });

        // Get day with ordinal suffix (e.g., "4th")
        const day = date.getDate();
        const ordinalSuffix = (day: number): string => {
          if (day > 3 && day < 21) return 'th';
          switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
          }
        };
        const dayWithOrdinal = `${day}${ordinalSuffix(day)}`;

        // Get month abbreviation (e.g., "Feb")
        const month = date.toLocaleDateString('en-GB', { month: 'short' });

        // Convert 24-hour time to 12-hour with am/pm (e.g., "19:00" -> "7pm")
        const [hours, minutes] = timeString.split(':').map(Number);
        const isPM = hours >= 12;
        const hour12 = hours % 12 || 12;
        const minuteStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
        const ampm = isPM ? 'pm' : 'am';
        const time12 = `${hour12}${minuteStr}${ampm}`;

        return `• ${dayName} ${dayWithOrdinal} ${month} at ${time12}`;
      };

      const upcomingSessionsList = upcomingGroupSessions
        .map(session => formatSessionDateTime(session.bookingDate, session.bookingTime))
        .join('<br/>');


      const webhookUrl = 'https://n8n.srv836498.hstgr.cloud/webhook/fbd5123f-deec-414a-bf46-f6190f833c76';

      // Send to n8n webhook (production endpoint)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberEmails: memberEmails,
          upcomingSessions: upcomingSessionsList
        })
      });


      if (response.ok) {
        const responseData = await response.text();
      } else {
        const errorText = await response.text();
        console.error(`[N8N_WEBHOOK] ❌ Failed to send webhook:`, response.status, response.statusText);
        console.error('[N8N_WEBHOOK] Error response:', errorText);
      }

    } catch (error) {
      console.error('[N8N_WEBHOOK] Error sending to n8n:', error);
    } finally {
      setSendingToN8n(false);
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
              icon: GitMerge,
              onClick: () => router.push('/duplicates'),
              title: 'Merge Clients',
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
              const activeClients = filteredClients.filter(c => c.active !== false);
              const archivedClients = filteredClients.filter(c => c.active === false);

              // Group active clients by membership count
              const groupedClients = activeClients.reduce((groups, client) => {
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

              const renderClientCard = (client: Client, count: number, isArchived = false) => {
                const showAddedToSessionButton = !isArchived && count >= 6;

                return (
                  <div
                    key={client.id}
                    className={`rounded-lg p-3 shadow-sm transition-colors ${
                      isArchived ? 'bg-gray-100 opacity-60' : client.active ? 'bg-white' : 'bg-gray-100'
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
                          <h3 className={`font-medium ${isArchived ? 'text-gray-500' : client.active ? 'text-gray-900' : 'text-gray-600'}`}>
                            {client.firstName} {client.lastName}
                          </h3>
                          {client.dogName && (
                            <p className={`text-sm ${isArchived ? 'text-gray-400' : client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                              {client.dogName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Checkbox for Members filter — only on non-archived */}
                        {showMembersOnly && !isArchived && (
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
                        {/* Undo (unarchive) — shown in archived section */}
                        {isArchived && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchiveMember(client);
                            }}
                            className="py-1.5 px-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium text-sm"
                          >
                            Undo
                          </button>
                        )}
                        {/* Undo Added — shown for 0-month clients with a reset on record */}
                        {!isArchived && count === 0 && latestResetIds[client.id] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoAddedToSession(client);
                            }}
                            className="py-1.5 px-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium text-sm"
                          >
                            Undo
                          </button>
                        )}
                        {/* Archive — shown on all non-archived cards */}
                        {!isArchived && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveMember(client);
                            }}
                            className="py-1.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium text-sm"
                          >
                            Archive
                          </button>
                        )}
                        {/* Added — only for 6+ month non-archived clients */}
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
              };

              return (
                <>
                  {sortedCounts.map(count => (
                    <div key={count} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {count} Month{count !== 1 ? 's' : ''} Since Group Coaching
                      </h3>
                      <div className="space-y-2">
                        {groupedClients[count].map(client => renderClientCard(client, getMembershipCountSinceReset(client)))}
                      </div>
                    </div>
                  ))}

                  {archivedClients.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-400 mb-3">Archived</h3>
                      <div className="space-y-2">
                        {archivedClients.map(client => renderClientCard(client, getMembershipCountSinceReset(client), true))}
                      </div>
                    </div>
                  )}
                </>
              );
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
