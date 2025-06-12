'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import SessionModal from '@/components/modals/SessionModal';
import EditSessionModal from '@/components/modals/EditSessionModal';
import EditClientModal from '@/components/modals/EditClientModal';
import ActionPointsModal from '@/components/modals/ActionPointsModal';
import AddModal from '@/components/AddModal';
import { Session, Client } from '@/types';

import { formatDateTime, formatFullMonthYear } from '@/utils/dateFormatting';
import { Calendar, UserPlus, ChevronDown, ChevronRight, Target } from 'lucide-react';

export default function SessionsPage() {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('session');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showActionPointsModal, setShowActionPointsModal] = useState(false);

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
      setEditingClient(client);
      setShowEditClientModal(true);
    }
  };

  const handleCloseEditSessionModal = () => {
    setShowEditSessionModal(false);
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
    setShowActionPointsModal(true);
  };

  const handleCloseActionPointsModal = () => {
    setShowActionPointsModal(false);
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
              title: 'Manage Action Points'
            },
            {
              icon: Calendar,
              onClick: handleAddSession,
              title: 'Add Session'
            },
            {
              icon: UserPlus,
              onClick: handleAddClient,
              title: 'Add Client'
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    {monthKey} - £{monthlyRevenue} | {monthSessions.length} Sessions
                  </h2>
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
                      const displayName = client
                        ? `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
                        : isGroupOrRMRLive
                        ? session.sessionType
                        : 'Unknown Client';

                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSessionClick(session)}
                          className="p-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{displayName}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDateTime(session.bookingDate, session.bookingTime)} · {session.sessionType}
                            </p>
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
        isOpen={!!selectedSession && !showEditSessionModal && !showEditClientModal}
        onClose={handleCloseModal}
        onEditSession={handleEditSession}
        onEditClient={handleEditClient}
      />

      <EditSessionModal
        session={selectedSession}
        isOpen={showEditSessionModal}
        onClose={handleCloseEditSessionModal}
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

      <ActionPointsModal
        isOpen={showActionPointsModal}
        onClose={handleCloseActionPointsModal}
      />
    </div>
  );
}
