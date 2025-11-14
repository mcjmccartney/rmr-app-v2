'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import SessionModal from '@/components/modals/SessionModal';
import EditSessionModal from '@/components/modals/EditSessionModal';
import EditClientModal from '@/components/modals/EditClientModal';
import ClientModal from '@/components/modals/ClientModal';
import AddModal from '@/components/AddModal';
import { Session, Client } from '@/types';

import { formatDateTime, formatFullMonthYear, formatClientWithAllDogs, getClientDogsPart } from '@/utils/dateFormatting';
import { Calendar, UserPlus, ChevronDown, ChevronRight, Target, Edit3 } from 'lucide-react';

export default function SessionsPage() {
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('session');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Helper function to get the correct dog name (prioritizes client's current name over session's stored name)
  const getSessionDogName = (session: Session, client: Client | undefined): string => {
    if (!session.dogName) {
      return client?.dogName || '';
    }
    if (!client) {
      return session.dogName;
    }
    // Check if session dog matches client's primary dog (case-insensitive)
    if (client.dogName && session.dogName.toLowerCase() === client.dogName.toLowerCase()) {
      return client.dogName; // Use client's current name (may have been edited)
    }
    // Check if session dog matches any of the other dogs
    if (client.otherDogs && Array.isArray(client.otherDogs)) {
      const matchingOtherDog = client.otherDogs.find(
        dog => dog.toLowerCase() === session.dogName!.toLowerCase()
      );
      if (matchingOtherDog) {
        return matchingOtherDog; // Use the current name from otherDogs array
      }
    }
    // Fallback to session's dog name
    return session.dogName;
  };

  // Check for returnSessionId parameter to restore selected session when returning from session-plan
  useEffect(() => {
    const returnSessionId = searchParams.get('returnSessionId');
    if (returnSessionId && state.sessions.length > 0) {
      const sessionToRestore = state.sessions.find(s => s.id === returnSessionId);
      if (sessionToRestore) {
        setSelectedSession(sessionToRestore);
        // Clean up the URL by removing the returnSessionId parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('returnSessionId');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [searchParams, state.sessions]);

  const filteredSessions = state.sessions.filter(session => {
    const searchTerm = searchQuery.toLowerCase();
    const client = state.clients.find(c => c.id === session.clientId);
    return (
      client?.firstName.toLowerCase().includes(searchTerm) ||
      client?.lastName.toLowerCase().includes(searchTerm) ||
      client?.dogName?.toLowerCase().includes(searchTerm) ||
      session.sessionType.toLowerCase().includes(searchTerm)
    );
  });

  // Group sessions by month
  const sessionsByMonth = filteredSessions.reduce((acc, session) => {
    const monthKey = formatFullMonthYear(session.bookingDate);
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  // Sort months in descending order (newest first)
  const sortedMonths = Object.keys(sessionsByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setShowEditSessionModal(true);
  };

  const handleEditClient = (session: Session) => {
    // Find the client based on the session's client ID
    const client = state.clients.find(c => c.id === session.clientId);
    if (client) {
      setSelectedClient(client);
      setShowClientModal(true);
    }
  };

  const handleEditClientFromModal = (client: Client) => {
    // Close the view modal and open the edit modal
    setShowClientModal(false);
    setEditingClient(client);
    setShowEditClientModal(true);
  };

  const handleCreateSessionPlan = (session: Session) => {
    router.push(`/session-plan?sessionId=${session.id}&from=sessions&returnSessionId=${session.id}`);
  };

  const handleCloseEditSessionModal = () => {
    setShowEditSessionModal(false);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const handleCloseEditClientModal = () => {
    setShowEditClientModal(false);
    setEditingClient(null);
  };

  const handleAddSession = () => {
    setAddModalType('session');
    setShowAddModal(true);
  };

  const handleAddClient = () => {
    setAddModalType('client');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleActionPoints = () => {
    router.push('/action-points');
  };



  const toggleMonth = (monthKey: string) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(monthKey)) {
      newExpandedMonths.delete(monthKey);
    } else {
      newExpandedMonths.add(monthKey);
    }
    setExpandedMonths(newExpandedMonths);
  };

  const calculateMonthlyRevenue = (sessions: Session[]) => {
    return sessions.reduce((total, session) => total + session.quote, 0);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title="Sessions"
          buttons={[
            {
              icon: Target,
              onClick: handleActionPoints,
              title: 'Manage Action Points',
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
        {/* Monthly Accordions */}
        <div className="space-y-3 mt-4">
          {sortedMonths.map((monthKey) => {
            const monthSessions = sessionsByMonth[monthKey];
            const monthlyRevenue = calculateMonthlyRevenue(monthSessions);
            const isExpanded = expandedMonths.has(monthKey);

            return (
              <div key={monthKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {monthKey} - £{monthlyRevenue}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {monthSessions.length} Sessions
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </button>

                {/* Sessions List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {monthSessions.map((session) => {
                      const client = state.clients.find(c => c.id === session.clientId);

                      // For Group and RMR Live sessions, show session type instead of "Unknown Client"
                      const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';

                      // Check if this session has a session plan
                      const hasSessionPlan = state.sessionPlans.some(plan => plan.sessionId === session.id);

                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSessionClick(session)}
                          className="p-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50 transition-colors cursor-pointer relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {client ? (
                                    <>
                                      {client.firstName} {client.lastName}
                                      {(() => {
                                        const dogName = getSessionDogName(session, client);
                                        return dogName ? (
                                          <span className="text-sm font-normal text-gray-500">
                                            {' '}w/ {dogName}
                                          </span>
                                        ) : null;
                                      })()}
                                    </>
                                  ) : isGroupOrRMRLive ? session.sessionType : 'Unknown Client'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {formatDateTime(session.bookingDate, session.bookingTime)} · {session.sessionType}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Session plan tick icon */}
                              {hasSessionPlan && (
                                <span className="text-green-600 text-lg font-bold mr-2">
                                  ✓
                                </span>
                              )}

                              {session.sessionPaid ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-600 font-medium">Paid</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span className="text-xs text-amber-600 font-medium">Pending</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">£{session.quote.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SessionModal
        session={selectedSession}
        isOpen={!!selectedSession && !showEditSessionModal && !showClientModal && !showEditClientModal}
        onClose={handleCloseModal}
        onEditSession={handleEditSession}
        onEditClient={handleEditClient}
        onCreateSessionPlan={handleCreateSessionPlan}
      />

      <EditSessionModal
        session={selectedSession}
        isOpen={showEditSessionModal}
        onClose={handleCloseEditSessionModal}
      />

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClientFromModal}
      />

      <EditClientModal
        client={editingClient}
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
      />

      <AddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        type={addModalType}
      />
    </div>
  );
}
