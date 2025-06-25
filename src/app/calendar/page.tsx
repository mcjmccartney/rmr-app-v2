'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SessionModal from '@/components/modals/SessionModal';
import EditSessionModal from '@/components/modals/EditSessionModal';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import AddModal from '@/components/AddModal';
import { Session, Client, BehaviouralBrief, BehaviourQuestionnaire } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { formatTime, formatDayDate, formatMonthYear, combineDateAndTime } from '@/utils/dateFormatting';
import { ChevronLeft, ChevronRight, Calendar, UserPlus, X, Users, CalendarDays, Edit3 } from 'lucide-react';

// Helper function to get all emails for a client (including aliases)
const getClientEmails = (client: any, clientEmailAliases: { [clientId: string]: any[] } = {}) => {
  const emails: string[] = [];
  if (client?.email) {
    emails.push(client.email.toLowerCase());
  }
  // Add email aliases if available
  const aliases = clientEmailAliases?.[client?.id];
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

export default function CalendarPage() {
  const { state, updateClient } = useApp();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('session');
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showBehaviouralBriefModal, setShowBehaviouralBriefModal] = useState(false);
  const [selectedBehaviouralBrief, setSelectedBehaviouralBrief] = useState<BehaviouralBrief | null>(null);
  const [showBehaviourQuestionnaireModal, setShowBehaviourQuestionnaireModal] = useState(false);
  const [selectedBehaviourQuestionnaire, setSelectedBehaviourQuestionnaire] = useState<BehaviourQuestionnaire | null>(null);
  const [showMobileDayModal, setShowMobileDayModal] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [hideWeekends, setHideWeekends] = useState(false);


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

    // Sort sessions by time (earliest first)
    return daySessions.sort((a, b) => {
      const timeA = a.bookingTime || '00:00';
      const timeB = b.bookingTime || '00:00';
      return timeA.localeCompare(timeB);
    });
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

  const handleViewDuplicates = () => {
    console.log('handleViewDuplicates clicked');
    console.log('Navigating to /duplicates');
    router.push('/duplicates');
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

    // Set the client for viewing
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleDayClick = (day: Date, sessions: Session[]) => {
    if (sessions.length >= 3) {
      // 3 or more sessions, show modal (mobile slide-in or desktop central)
      setSelectedDayDate(day);
      setSelectedDaySessions(sessions);
      setShowMobileDayModal(true);
    } else if (sessions.length === 1) {
      // Single session, open directly
      handleSessionClick(sessions[0]);
    } else if (sessions.length === 2) {
      // Two sessions, open the first one (existing behavior)
      handleSessionClick(sessions[0]);
    }
  };

  const handleCloseMobileDayModal = () => {
    setShowMobileDayModal(false);
    setSelectedDaySessions([]);
    setSelectedDayDate(null);
    // Clear any selected session to prevent sidepane from showing
    setSelectedSession(null);
  };

  // Keyboard navigation for months (desktop only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only enable keyboard navigation on desktop (screen width >= 768px)
      const isDesktop = window.innerWidth >= 768;

      if (!isDesktop) return;

      // Only handle arrow keys when no input/textarea is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      if (isInputFocused) return;

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

  // Focus the calendar container to enable keyboard navigation (desktop only)
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop) {
      const calendarContainer = document.getElementById('calendar-container');
      if (calendarContainer) {
        calendarContainer.focus();
      }
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
          {/* Weekend toggle button */}
          <button
            onClick={() => setHideWeekends(!hideWeekends)}
            className={`p-2 rounded transition-colors text-white hover:bg-brand-primary-dark ${
              hideWeekends ? 'bg-brand-primary-dark' : ''
            }`}
            title={hideWeekends ? 'Show weekends' : 'Hide weekends'}
          >
            <CalendarDays size={20} />
          </button>

          {/* Duplicate notification button */}
          {state.potentialDuplicates.length > 0 && (
            <button
              onClick={handleViewDuplicates}
              className="relative p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
              title={`${state.potentialDuplicates.length} potential duplicate clients found`}
            >
              <Users size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {state.potentialDuplicates.length}
              </span>
            </button>
          )}
          <button
            onClick={handleAddSession}
            className="p-2 rounded transition-colors text-white hover:bg-brand-primary-dark"
            title="Add Session"
          >
            <Edit3 size={20} />
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
          <div className={`grid gap-1 mb-3 flex-shrink-0 ${hideWeekends ? 'grid-cols-5' : 'grid-cols-7'}`}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              .filter((_, index) => !hideWeekends || index < 5)
              .map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-3">
                  {day}
                </div>
              ))}
          </div>

          <div className={`grid gap-1 flex-1 min-h-0 auto-rows-fr ${hideWeekends ? 'grid-cols-5' : 'grid-cols-7'}`}>
            {daysInMonth
              .filter(day => {
                if (!hideWeekends) return true;
                const dayOfWeek = (day.getDay() + 6) % 7; // Convert to Monday=0 format
                return dayOfWeek < 5; // Only show Monday-Friday (0-4)
              })
              .map(day => {
                const sessions = getSessionsForDay(day);
                const dayNumber = format(day, 'd');
                const isCurrentMonth = isSameDay(day, currentDate) ||
                  (day >= monthStart && day <= monthEnd);
                const isToday = isSameDay(day, new Date());

                return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col p-1 min-h-0 border-r border-b border-gray-100 last:border-r-0 cursor-pointer ${
                    isToday ? 'ring-2 ring-brand-primary ring-inset' : ''
                  }`}
                  onClick={() => handleDayClick(day, sessions)}
                >
                  <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                    isToday
                      ? 'text-brand-primary font-bold'
                      : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}>{dayNumber}</div>
                  <div className={`space-y-1 flex-1 min-h-0 ${
                    // Desktop: scrollable with custom scrollbar, Mobile: overflow hidden
                    'md:overflow-y-auto calendar-day-scroll overflow-hidden'
                  }`}>
                    {/* Show all sessions - CSS will handle mobile vs desktop display */}
                    {sessions.map((session, sessionIndex) => {
                      const client = state.clients.find(c => c.id === session.clientId);
                      const timeOnly = formatTime(session.bookingTime);

                      // For Group and RMR Live sessions, show session type instead of "Unknown Client"
                      const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
                      const fullDisplayText = client
                        ? `${timeOnly} | ${client.firstName} ${client.lastName}${session.dogName ? ` w/ ${session.dogName}` : client.dogName ? ` w/ ${client.dogName}` : ''}`
                        : isGroupOrRMRLive
                        ? `${timeOnly} | ${session.sessionType}`
                        : `${timeOnly} | Unknown Client`;

                      // Check if client has both booking terms signed and questionnaire filled for this dog
                      // Include email aliases in the check
                      const clientEmails = getClientEmails(client, state.clientEmailAliases || {});



                      const hasSignedBookingTerms = clientEmails.length > 0 ?
                        state.bookingTerms.some(bt =>
                          clientEmails.includes(bt.email?.toLowerCase() || '')
                        ) : false;
                      const hasFilledQuestionnaire = client && client.dogName && clientEmails.length > 0 ?
                        state.behaviourQuestionnaires.some(q =>
                          clientEmails.includes(q.email?.toLowerCase() || '') &&
                          q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
                        ) : false;




                      // Priority: No Client (charcoal grey) > Session Plan Sent (charcoal grey) > Paid + Terms + Questionnaire (green) > Terms + Questionnaire (amber) > Default (amber-800)
                      const isFullyCompleted = hasSignedBookingTerms && (hasFilledQuestionnaire || session.questionnaireBypass);
                      const isPaid = session.sessionPaid;
                      const isCompletelyFinished = isPaid && isFullyCompleted; // All three conditions
                      const isSessionPlanSent = session.sessionPlanSent;

                      let buttonStyle = {};
                      let buttonClasses = "";

                      if (!client || isSessionPlanSent) {
                        // No client or session plan sent = dark charcoal grey background (highest priority)
                        buttonStyle = { backgroundColor: '#36454F' };
                        buttonClasses = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80";
                      } else if (isCompletelyFinished) {
                        // Paid + Terms + Questionnaire = green background
                        buttonStyle = { backgroundColor: '#4f6749' };
                        buttonClasses = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80";
                      } else if (isFullyCompleted) {
                        // Terms + Questionnaire (but not paid) = amber background
                        buttonStyle = { backgroundColor: '#e17100' };
                        buttonClasses = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80";
                      } else {
                        // Default amber-800 background
                        buttonStyle = {};
                        buttonClasses = "w-full bg-amber-800 text-white text-xs px-2 py-1 rounded text-left hover:bg-amber-700 transition-colors flex-shrink-0";
                      }

                      return (
                        <button
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to day container
                            handleSessionClick(session);
                          }}
                          className={`${buttonClasses} ${
                            // Hide sessions beyond first 2 on mobile
                            sessionIndex >= 2 ? 'hidden md:block' : ''
                          }`}
                          style={buttonStyle}
                        >
                          {/* Show only time on mobile, full text on desktop */}
                          <span className="block sm:hidden">{timeOnly}</span>
                          <span className="hidden sm:block">{fullDisplayText}</span>
                        </button>
                      );
                    })}
                    {/* Only show "+X more" on mobile */}
                    {sessions.length > 2 && (
                      <div className="text-xs text-amber-800 font-medium flex-shrink-0 md:hidden">
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
        className="text-white px-4 py-1.5 flex-shrink-0 w-full text-left disabled:cursor-default"
        style={{
          backgroundColor: (() => {
            if (!firstSession || !firstSessionClient) return '#973b00';

            // Check if first session client has both booking terms signed and questionnaire filled
            const clientEmails = getClientEmails(firstSessionClient, state.clientEmailAliases || {});
            const hasSignedBookingTerms = clientEmails.length > 0 ?
              state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || '')) : false;
            const hasFilledQuestionnaire = firstSessionClient.dogName && clientEmails.length > 0 ?
              state.behaviourQuestionnaires.some(q =>
                clientEmails.includes(q.email?.toLowerCase() || '') &&
                q.dogName?.toLowerCase() === firstSessionClient.dogName?.toLowerCase()
              ) : false;

            return (hasSignedBookingTerms && (hasFilledQuestionnaire || firstSession.questionnaireBypass)) ? '#e17100' : '#973b00';
          })()
        }}
      >
        {firstSession && firstSessionClient ? (
          <>
            <div className="text-lg font-medium">
              {formatTime(firstSession.bookingTime)} | {firstSessionClient.firstName} {firstSessionClient.lastName}{firstSession.dogName ? ` w/ ${firstSession.dogName}` : firstSessionClient.dogName ? ` w/ ${firstSessionClient.dogName}` : ''}
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
        isOpen={!!selectedSession && !showEditSessionModal && !showClientModal && !showEditClientModal && !showMobileDayModal}
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

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClientFromModal}
        onViewBehaviouralBrief={handleViewBehaviouralBrief}
        onViewBehaviourQuestionnaire={handleViewBehaviourQuestionnaire}
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

      {/* Day Sessions Modal - Mobile & Desktop */}
      {showMobileDayModal && selectedDayDate && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" onClick={handleCloseMobileDayModal}></div>

          {/* Mobile: slide up from bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden transform transition-transform duration-300 ease-out md:hidden">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDayDate(selectedDayDate.toISOString().split('T')[0])}
              </h3>
              <button
                onClick={handleCloseMobileDayModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-6 space-y-3 overflow-y-auto max-h-[calc(80vh-120px)]">
              {selectedDaySessions.map(session => {
                const client = state.clients.find(c => c.id === session.clientId);
                const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
                const displayName = client
                  ? `${client.firstName} ${client.lastName}${session.dogName ? ` w/ ${session.dogName}` : client.dogName ? ` w/ ${client.dogName}` : ''}`
                  : isGroupOrRMRLive
                  ? session.sessionType
                  : 'Unknown Client';

                // Determine button style - priority: session plan sent (black) > paid + terms + questionnaire (green) > default
                const clientEmails = getClientEmails(client, state.clientEmailAliases || {});
                const hasSignedBookingTerms = clientEmails.length > 0 ?
                  state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || '')) : false;
                const hasFilledQuestionnaire = client && client.dogName && clientEmails.length > 0 ?
                  state.behaviourQuestionnaires.some(q =>
                    clientEmails.includes(q.email?.toLowerCase() || '') &&
                    q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
                  ) : false;
                const isPaid = session.sessionPaid;
                const isCompletelyFinished = isPaid && hasSignedBookingTerms && (hasFilledQuestionnaire || session.questionnaireBypass);
                const isSessionPlanSent = session.sessionPlanSent;

                let buttonClass = "";
                let buttonStyle = {};

                if (!client || isSessionPlanSent) {
                  buttonClass = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80";
                  buttonStyle = { backgroundColor: '#36454F' };
                } else if (isCompletelyFinished) {
                  buttonClass = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80";
                  buttonStyle = { backgroundColor: '#4f6749' };
                } else {
                  buttonClass = "w-full bg-amber-800 text-white p-4 rounded-lg text-left hover:bg-amber-700 transition-colors";
                  buttonStyle = {};
                }

                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      handleCloseMobileDayModal();
                      handleSessionClick(session);
                    }}
                    className={buttonClass}
                    style={buttonStyle}
                  >
                    <div className="font-medium">
                      {formatTime(session.bookingTime)} | {displayName}
                    </div>
                    <div className="text-amber-100 text-sm mt-1">
                      {session.sessionType}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: central modal */}
          <div className="hidden md:flex fixed inset-0 items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {formatDayDate(selectedDayDate.toISOString().split('T')[0])}
                </h3>
                <button
                  onClick={handleCloseMobileDayModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-120px)]">
                {selectedDaySessions.map(session => {
                  const client = state.clients.find(c => c.id === session.clientId);
                  const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
                  const displayName = client
                    ? `${client.firstName} ${client.lastName}${session.dogName ? ` w/ ${session.dogName}` : client.dogName ? ` w/ ${client.dogName}` : ''}`
                    : isGroupOrRMRLive
                    ? session.sessionType
                    : 'Unknown Client';

                  // Determine button style - priority: session plan sent (black) > paid + terms + questionnaire (green) > default
                  const clientEmails = getClientEmails(client, state.clientEmailAliases || {});
                  const hasSignedBookingTerms = clientEmails.length > 0 ?
                    state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || '')) : false;
                  const hasFilledQuestionnaire = client && client.dogName && clientEmails.length > 0 ?
                    state.behaviourQuestionnaires.some(q =>
                      clientEmails.includes(q.email?.toLowerCase() || '') &&
                      q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
                    ) : false;
                  const isPaid = session.sessionPaid;
                  const isCompletelyFinished = isPaid && hasSignedBookingTerms && (hasFilledQuestionnaire || session.questionnaireBypass);
                  const isSessionPlanSent = session.sessionPlanSent;

                  let buttonClass = "";
                  let buttonStyle = {};

                  if (!client || isSessionPlanSent) {
                    buttonClass = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80";
                    buttonStyle = { backgroundColor: '#36454F' };
                  } else if (isCompletelyFinished) {
                    buttonClass = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80";
                    buttonStyle = { backgroundColor: '#4f6749' };
                  } else {
                    buttonClass = "w-full bg-amber-800 text-white p-4 rounded-lg text-left hover:bg-amber-700 transition-colors";
                    buttonStyle = {};
                  }

                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        handleCloseMobileDayModal();
                        handleSessionClick(session);
                      }}
                      className={buttonClass}
                      style={buttonStyle}
                    >
                      <div className="font-medium">
                        {formatTime(session.bookingTime)} | {displayName}
                      </div>
                      <div className="text-amber-100 text-sm mt-1">
                        {session.sessionType}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
