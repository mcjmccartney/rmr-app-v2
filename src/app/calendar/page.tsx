'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SessionModal from '@/components/modals/SessionModal';
import EditSessionModal from '@/components/modals/EditSessionModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import AddModal from '@/components/AddModal';
import { Session, Client, BehaviouralBrief, BehaviourQuestionnaire } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { formatTime, formatDayDate, formatMonthYear, combineDateAndTime } from '@/utils/dateFormatting';
import { ChevronLeft, ChevronRight, Calendar, UserPlus } from 'lucide-react';

export default function CalendarPage() {
  const { state } = useApp();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('session');
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showBehaviouralBriefModal, setShowBehaviouralBriefModal] = useState(false);
  const [selectedBehaviouralBrief, setSelectedBehaviouralBrief] = useState<BehaviouralBrief | null>(null);
  const [showBehaviourQuestionnaireModal, setShowBehaviourQuestionnaireModal] = useState(false);
  const [selectedBehaviourQuestionnaire, setSelectedBehaviourQuestionnaire] = useState<BehaviourQuestionnaire | null>(null);


  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get the calendar grid - start from Monday of the week containing the first day
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 1 = Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDay = (day: Date) => {
    const daySessions = state.sessions.filter(session => {
      // Skip sessions with missing date/time data
      if (!session.bookingDate || !session.bookingTime) {
        console.warn('Session missing date/time data:', session);
        return false;
      }

      try {
        const sessionDateTime = combineDateAndTime(session.bookingDate, session.bookingTime);
        return isSameDay(sessionDateTime, day);
      } catch (error) {
        console.warn('Error processing session date:', session, error);
        return false;
      }
    });

    return daySessions;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
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

  const handleUpNextClick = () => {
    if (firstSession) {
      setSelectedSession(firstSession);
    }
  };

  const handleCreateSessionPlan = (session: Session) => {
    router.push(`/session-plan?sessionId=${session.id}`);
  };

  const handleViewBehaviouralBrief = (behaviouralBriefId: string) => {
    const brief = state.behaviouralBriefs.find(b => b.id === behaviouralBriefId);
    if (brief) {
      setSelectedBehaviouralBrief(brief);
      setSelectedSession(null); // Close session modal
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
      setSelectedSession(null); // Close session modal
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

    // Set the client for editing
    setEditingClient(client);
    setShowEditClientModal(true);
  };

  // Keyboard navigation for months
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePreviousMonth();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDate]);

  // Focus the calendar container to enable keyboard navigation
  useEffect(() => {
    const calendarContainer = document.getElementById('calendar-container');
    if (calendarContainer) {
      calendarContainer.focus();
    }
  }, []);

  // Get the first session for the bottom preview (upcoming sessions)
  const upcomingSessions = state.sessions
    .filter(session => {
      // Skip sessions with missing date/time data
      if (!session.bookingDate || !session.bookingTime) {
        return false;
      }

      try {
        const sessionDateTime = combineDateAndTime(session.bookingDate, session.bookingTime);
        return sessionDateTime >= new Date();
      } catch (error) {
        console.warn('Error processing upcoming session:', session, error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const aDateTime = combineDateAndTime(a.bookingDate, a.bookingTime);
        const bDateTime = combineDateAndTime(b.bookingDate, b.bookingTime);
        return aDateTime.getTime() - bDateTime.getTime();
      } catch (error) {
        console.warn('Error sorting sessions:', { a, b, error });
        return 0;
      }
    });

  const firstSession = upcomingSessions[0];
  const firstSessionClient = firstSession ? state.clients.find(c => c.id === firstSession.clientId) : null;

  return (
    <div
      id="calendar-container"
      className="h-screen bg-white flex flex-col overflow-hidden outline-none"
      tabIndex={0}
    >
      {/* Top Header with Month Navigation and Action Buttons */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#973b00' }}>
        {/* Left: Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[120px] text-center">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddSession}
            className="p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
            title="Add Session"
          >
            <Calendar size={20} />
          </button>
          <button
            onClick={handleAddClient}
            className="p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
            title="Add Client"
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Section - Flex-1 to take remaining space */}
      <div className="bg-white flex flex-col flex-1 overflow-hidden">

        {/* Calendar Grid - Fills remaining space */}
        <div className="flex-1 px-4 py-3 flex flex-col min-h-0 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 mb-3 flex-shrink-0">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-3">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 auto-rows-fr">
            {daysInMonth.map(day => {
              const sessions = getSessionsForDay(day);
              const dayNumber = format(day, 'd');
              const isCurrentMonth = isSameDay(day, currentDate) ||
                (day >= monthStart && day <= monthEnd);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className={`flex flex-col p-1 min-h-0 border-r border-b border-gray-100 last:border-r-0 ${
                  isToday ? 'ring-2 ring-brand-primary ring-inset' : ''
                }`}>
                  <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                    isToday
                      ? 'text-brand-primary font-bold'
                      : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}>{dayNumber}</div>
                  <div className="space-y-1 flex-1 min-h-0 overflow-hidden">
                    {sessions.slice(0, 2).map(session => {
                      const client = state.clients.find(c => c.id === session.clientId);
                      const timeOnly = formatTime(session.bookingTime);

                      // For Group and RMR Live sessions, show session type instead of "Unknown Client"
                      const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
                      const fullDisplayText = client
                        ? `${timeOnly} | ${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
                        : isGroupOrRMRLive
                        ? `${timeOnly} | ${session.sessionType}`
                        : `${timeOnly} | Unknown Client`;

                      // Check if client has both booking terms signed and questionnaire filled for this dog
                      const hasSignedBookingTerms = client?.booking_terms_signed || false;
                      const hasFilledQuestionnaire = client && client.dogName && client.email ?
                        state.behaviourQuestionnaires.some(q =>
                          q.email?.toLowerCase() === client.email?.toLowerCase() &&
                          q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
                        ) : false;

                      // Debug logging for Matthew Mccartney
                      if (client?.firstName === 'Matthew' && client?.lastName === 'Mccartney') {
                        console.log('🔍 Debug for Matthew Mccartney:', {
                          clientId: client.id,
                          email: client.email,
                          dogName: client.dogName,
                          booking_terms_signed: client.booking_terms_signed,
                          hasSignedBookingTerms,
                          questionnairesCount: state.behaviourQuestionnaires.length,
                          questionnaires: state.behaviourQuestionnaires.map(q => ({
                            email: q.email,
                            dogName: q.dogName
                          })),
                          hasFilledQuestionnaire,
                          behaviourQuestionnaireId: client.behaviourQuestionnaireId
                        });
                      }

                      // Use amber color if both conditions are met, otherwise use default amber-800
                      const isFullyCompleted = hasSignedBookingTerms && hasFilledQuestionnaire;
                      const buttonStyle = isFullyCompleted ? {
                        backgroundColor: '#e17100'
                      } : {};
                      const buttonClasses = isFullyCompleted
                        ? "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80"
                        : "w-full bg-amber-800 text-white text-xs px-2 py-1 rounded text-left hover:bg-amber-700 transition-colors flex-shrink-0";

                      return (
                        <button
                          key={session.id}
                          onClick={() => handleSessionClick(session)}
                          className={buttonClasses}
                          style={buttonStyle}
                        >
                          {/* Show only time on mobile, full text on desktop */}
                          <span className="block sm:hidden">{timeOnly}</span>
                          <span className="hidden sm:block">{fullDisplayText}</span>
                        </button>
                      );
                    })}
                    {sessions.length > 2 && (
                      <div className="text-xs text-amber-800 font-medium flex-shrink-0">
                        +{sessions.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Up Next Section - Fixed at bottom */}
      <button
        onClick={handleUpNextClick}
        disabled={!firstSession}
        className="text-white px-4 py-4 flex-shrink-0 w-full text-left disabled:cursor-default"
        style={{
          backgroundColor: (() => {
            if (!firstSession || !firstSessionClient) return '#973b00';

            // Check if first session client has both booking terms signed and questionnaire filled
            const hasSignedBookingTerms = firstSessionClient.booking_terms_signed || false;
            const hasFilledQuestionnaire = firstSessionClient.dogName && firstSessionClient.email ?
              state.behaviourQuestionnaires.some(q =>
                q.email?.toLowerCase() === firstSessionClient.email?.toLowerCase() &&
                q.dogName?.toLowerCase() === firstSessionClient.dogName?.toLowerCase()
              ) : false;

            return (hasSignedBookingTerms && hasFilledQuestionnaire) ? '#e17100' : '#973b00';
          })(),
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)'
        }}
      >
        {firstSession && firstSessionClient ? (
          <>
            <div className="text-lg font-medium">
              {formatTime(firstSession.bookingTime)} | {firstSessionClient.firstName} {firstSessionClient.lastName} w/ {firstSessionClient.dogName}
            </div>
            <div className="text-white/80 text-sm">
              {firstSession.sessionType} • {formatDayDate(firstSession.bookingDate)}
            </div>
          </>
        ) : (
          <div className="text-lg font-medium">No upcoming sessions</div>
        )}
      </button>

      <SessionModal
        session={selectedSession}
        isOpen={!!selectedSession && !showEditSessionModal && !showEditClientModal}
        onClose={handleCloseModal}
        onEditSession={handleEditSession}
        onEditClient={handleEditClient}
        onCreateSessionPlan={handleCreateSessionPlan}
        onViewBehaviouralBrief={handleViewBehaviouralBrief}
        onViewBehaviourQuestionnaire={handleViewBehaviourQuestionnaire}
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

      <AddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        type={addModalType}
      />
    </div>
  );
}
