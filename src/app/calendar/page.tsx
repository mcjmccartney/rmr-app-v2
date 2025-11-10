'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SessionModal from '@/components/modals/SessionModal';
import EditSessionModal from '@/components/modals/EditSessionModal';
import GroupSessionModal from '@/components/modals/GroupSessionModal';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import AddModal from '@/components/AddModal';
import { useSessionColors, getSessionColor } from '@/hooks/useSessionColors';
import { Session, Client, BehaviouralBrief, BehaviourQuestionnaire, SessionPlan } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { formatTime, formatDayDate, formatMonthYear, combineDateAndTime } from '@/utils/dateFormatting';
import { ChevronLeft, ChevronRight, Calendar, UserPlus, X, Users, CalendarDays, Edit3, FileText, Search, Bell, Circle } from 'lucide-react';

// Helper function to check if a session plan has meaningful content
const sessionPlanHasContent = (sessionPlan: SessionPlan): boolean => {
  // Check if any main goals have content
  const hasMainGoals = !!(
    sessionPlan.mainGoal1?.trim() ||
    sessionPlan.mainGoal2?.trim() ||
    sessionPlan.mainGoal3?.trim() ||
    sessionPlan.mainGoal4?.trim()
  );

  // Check if explanation has content
  const hasExplanation = !!(sessionPlan.explanationOfBehaviour?.trim());

  // Check if action points are selected
  const hasActionPoints = sessionPlan.actionPoints && sessionPlan.actionPoints.length > 0;

  return hasMainGoals || hasExplanation || hasActionPoints;
};

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

// Helper function to check if a questionnaire exists for a specific client and dog
const hasQuestionnaireForDog = (client: any, session: any, behaviourQuestionnaires: any[]): boolean => {
  if (!client) return false;

  // Use the same fallback logic as the rest of the app
  const dogName = session.dogName || client.dogName;
  if (!dogName) return false;

  // Comprehensive questionnaire matching - try multiple methods
  // Method 1: Match by client_id and dog name (case-insensitive)
  let hasQuestionnaire = behaviourQuestionnaires.some(q =>
    (q.client_id === client.id || q.clientId === client.id) &&
    q.dogName?.toLowerCase() === dogName.toLowerCase()
  );

  if (hasQuestionnaire) return true;

  // Method 2: Match by email and dog name (case-insensitive)
  if (client.email) {
    hasQuestionnaire = behaviourQuestionnaires.some(q =>
      q.email?.toLowerCase() === client.email?.toLowerCase() &&
      q.dogName?.toLowerCase() === dogName.toLowerCase()
    );
  }

  if (hasQuestionnaire) return true;

  // Method 3: Match by client_id and dog name (exact case)
  hasQuestionnaire = behaviourQuestionnaires.some(q =>
    (q.client_id === client.id || q.clientId === client.id) &&
    q.dogName === dogName
  );

  if (hasQuestionnaire) return true;

  // Method 4: Match by email and dog name (exact case)
  if (client.email) {
    hasQuestionnaire = behaviourQuestionnaires.some(q =>
      q.email === client.email &&
      q.dogName === dogName
    );
  }

  if (hasQuestionnaire) return true;

  // Method 5: Match by partial dog name (case-insensitive)
  hasQuestionnaire = behaviourQuestionnaires.some(q =>
    (q.client_id === client.id || q.clientId === client.id) &&
    (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
     dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
  );

  if (hasQuestionnaire) return true;

  // Method 6: Match by email and partial dog name (case-insensitive)
  if (client.email) {
    hasQuestionnaire = behaviourQuestionnaires.some(q =>
      q.email?.toLowerCase() === client.email?.toLowerCase() &&
      (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
       dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
    );
  }

  return hasQuestionnaire;
};

export default function CalendarPage() {
  const { state, updateClient, pairMembershipsWithClients } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('session');
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showGroupSessionModal, setShowGroupSessionModal] = useState(false);
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
  const [hideWeekends, setHideWeekends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if essential data for calendar colors is loaded
  const isEssentialDataLoaded = state.sessions.length > 0 ||
    (state.clients.length >= 0 && state.behaviourQuestionnaires.length >= 0 &&
     state.bookingTerms.length >= 0 && state.sessionPlans.length >= 0);

  // Memoized session colors for performance
  const sessionColorMap = useSessionColors({
    sessions: state.sessions,
    clients: state.clients,
    behaviourQuestionnaires: state.behaviourQuestionnaires,
    bookingTerms: state.bookingTerms,
    sessionPlans: state.sessionPlans,
    clientEmailAliases: state.clientEmailAliases || {}
  });

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

  // Disabled automatic membership pairing - now using manual override system
  // useEffect(() => {
  //   const runMembershipPairing = async () => {
  //     try {
  //       console.log('🔄 Running automatic membership pairing...');
  //       await pairMembershipsWithClients();
  //     } catch (error) {
  //       console.error('❌ Error during automatic membership pairing:', error);
  //     }
  //   };

  //   // Run pairing after a short delay to ensure all data is loaded
  //   const timer = setTimeout(runMembershipPairing, 2000);
  //   return () => clearTimeout(timer);
  // }, [pairMembershipsWithClients]);

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
        const isCorrectDay = isSameDay(sessionDateTime, day);

        // If no search query, return all sessions for this day
        if (!searchQuery.trim()) {
          return isCorrectDay;
        }

        // If there's a search query, also check if session matches search
        if (isCorrectDay) {
          const client = state.clients.find(c => c.id === session.clientId);
          const searchLower = searchQuery.toLowerCase().trim();

          // Search in client name
          const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
          if (clientName.includes(searchLower)) return true;

          // Search in dog name
          const dogName = (session.dogName || client?.dogName || '').toLowerCase();
          if (dogName.includes(searchLower)) return true;

          // Search in session type
          if (session.sessionType.toLowerCase().includes(searchLower)) return true;

          // Search in notes
          if (session.notes && session.notes.toLowerCase().includes(searchLower)) return true;

          return false;
        }

        return false;
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

    // Open GroupSessionModal for Group and RMR Live sessions
    if (session.sessionType === 'Group' || session.sessionType === 'RMR Live') {
      setShowGroupSessionModal(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
    setShowGroupSessionModal(false);
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
    // Close group session modal if it's open
    setShowGroupSessionModal(false);
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
    router.push(`/session-plan?sessionId=${session.id}&from=calendar&returnSessionId=${session.id}`);
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
        const isFuture = sessionDateTime >= new Date();

        // If no search query, return all future sessions
        if (!searchQuery.trim()) {
          return isFuture;
        }

        // If there's a search query, also check if session matches search
        if (isFuture) {
          const client = state.clients.find(c => c.id === session.clientId);
          const searchLower = searchQuery.toLowerCase().trim();

          // Search in client name
          const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
          if (clientName.includes(searchLower)) return true;

          // Search in dog name
          const dogName = (session.dogName || client?.dogName || '').toLowerCase();
          if (dogName.includes(searchLower)) return true;

          // Search in session type
          if (session.sessionType.toLowerCase().includes(searchLower)) return true;

          // Search in notes
          if (session.notes && session.notes.toLowerCase().includes(searchLower)) return true;

          return false;
        }

        return false;
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

  // Show loading screen while essential data is loading
  if (!isEssentialDataLoaded) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
          <p className="mt-2 text-sm text-gray-500">Preparing session data...</p>
        </div>
      </div>
    );
  }

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

        {/* Right: Search Bar (Desktop Only) and Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Search Bar - Desktop Only (hidden on mobile and tablet) */}
          <div className="hidden xl:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search sessions, clients, dogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-2 rounded-lg border-0 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {/* Weekend toggle button */}
          <button
            onClick={() => setHideWeekends(!hideWeekends)}
            className={`p-2 rounded transition-colors text-white hover:bg-brand-primary-dark ${
              hideWeekends ? 'bg-brand-primary-dark' : ''
            }`}
            title={hideWeekends ? 'Show weekends (7-day view)' : 'Hide weekends (5-day view)'}
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
                  className={`flex flex-col p-1 min-h-0 border-r border-b border-gray-100 last:border-r-0 cursor-default ${
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

                      // Check if this session has a session plan with content
                      const sessionPlan = state.sessionPlans.find(plan => plan.sessionId === session.id);
                      const hasSessionPlanWithContent = sessionPlan && sessionPlanHasContent(sessionPlan);

                      // Check if this session has notes
                      const hasNotes = session.notes && session.notes.trim().length > 0;

                      // Debug logging for Christine Goldfinch session
                      if (client && client.firstName === 'Christine' && client.lastName === 'Goldfinch') {
                        console.log('Christine session debug:', {
                          sessionId: session.id,
                          sessionPlan,
                          hasContent: hasSessionPlanWithContent,
                          totalSessionPlans: state.sessionPlans.length
                        });
                      }

                      // Debug logging for Becky Cuthbertson session
                      if (client && client.firstName === 'Becky' && client.lastName === 'Cuthbertson') {
                        console.log('🔍 Becky Cuthbertson session debug:', {
                          sessionId: session.id,
                          sessionDogName: session.dogName,
                          clientDogName: client.dogName,
                          clientOtherDogs: client.otherDogs,
                          sessionPlan,
                          hasContent: hasSessionPlanWithContent,
                          sessionType: session.sessionType,
                          bookingDate: session.bookingDate,
                          bookingTime: session.bookingTime
                        });
                      }

                      // For Group and RMR Live sessions, show session type instead of "Unknown Client"
                      const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
                      const fullDisplayText = client
                        ? `${timeOnly} | ${client.firstName} ${client.lastName}${session.dogName ? ` w/ ${session.dogName}` : client.dogName ? ` w/ ${client.dogName}` : ''}`
                        : isGroupOrRMRLive
                        ? `${timeOnly} | ${session.sessionType}`
                        : `${timeOnly} | Unknown Client`;

                      // Get memoized session color data for performance
                      const sessionColorData = getSessionColor(session.id, sessionColorMap);
                      const buttonStyle = { backgroundColor: sessionColorData.backgroundColor };
                      const buttonClasses = sessionColorData.className;

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
                          } relative`}
                          style={buttonStyle}
                        >
                          {/* Show only time on mobile, full text on desktop */}
                          <span className="block sm:hidden">{timeOnly}</span>
                          <span className="hidden sm:block">{fullDisplayText}</span>

                          {/* Icons container */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            {/* Circle icon for sessions with special marking - Desktop only */}
                            {session.specialMarking && (
                              <span className="hidden sm:inline text-white">
                                <Circle size={16} />
                              </span>
                            )}

                            {/* White form icon for sessions with session plan content - Desktop only */}
                            {hasSessionPlanWithContent && (
                              <span className="hidden sm:inline text-white">
                                <FileText size={16} />
                              </span>
                            )}

                            {/* Bell icon for sessions with notes - Mobile: smaller, Desktop: normal */}
                            {hasNotes && (
                              <span className="text-white">
                                <Bell size={12} className="sm:hidden" />
                                <Bell size={16} className="hidden sm:inline" />
                              </span>
                            )}
                          </div>
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
        className="text-white px-4 py-1.5 flex-shrink-0 w-full text-left disabled:cursor-default cursor-pointer"
        style={{
          backgroundColor: firstSession ? getSessionColor(firstSession.id, sessionColorMap).backgroundColor : '#973b00'
        }}
      >
        {firstSession ? (
          <>
            <div className="text-lg font-medium">
              {formatTime(firstSession.bookingTime)} | {
                firstSessionClient
                  ? `${firstSessionClient.firstName} ${firstSessionClient.lastName}${firstSession.dogName ? ` w/ ${firstSession.dogName}` : firstSessionClient.dogName ? ` w/ ${firstSessionClient.dogName}` : ''}`
                  : firstSession.sessionType // For Group and RMR Live sessions without a specific client
              }
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
        isOpen={!!selectedSession && !showEditSessionModal && !showClientModal && !showEditClientModal && !showMobileDayModal && !showGroupSessionModal && selectedSession?.sessionType !== 'Group' && selectedSession?.sessionType !== 'RMR Live'}
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

      <GroupSessionModal
        session={selectedSession}
        isOpen={showGroupSessionModal}
        onClose={handleCloseModal}
        onEditSession={handleEditSession}
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

                // Check if this session has a session plan with content
                const sessionPlan = state.sessionPlans.find(plan => plan.sessionId === session.id);
                const hasSessionPlanWithContent = sessionPlan && sessionPlanHasContent(sessionPlan);

                // Check if this session has notes
                const hasNotes = session.notes && session.notes.trim().length > 0;

                // Get memoized session color data for mobile
                const sessionColorData = getSessionColor(session.id, sessionColorMap);
                const buttonClass = sessionColorData.mobileClassName;
                const buttonStyle = { backgroundColor: sessionColorData.backgroundColor };

                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      handleCloseMobileDayModal();
                      handleSessionClick(session);
                    }}
                    className={`${buttonClass} relative`}
                    style={buttonStyle}
                  >
                    <div className="font-medium">
                      {formatTime(session.bookingTime)} | {displayName}
                    </div>
                    <div className="text-amber-100 text-sm mt-1">
                      {session.sessionType}
                    </div>

                    {/* Icons container */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {/* Circle icon for sessions with special marking */}
                      {session.specialMarking && (
                        <span className="text-white">
                          <Circle size={18} />
                        </span>
                      )}

                      {/* Bell icon for sessions with notes */}
                      {hasNotes && (
                        <span className="text-white">
                          <Bell size={18} />
                        </span>
                      )}
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

                  // Check if this session has a session plan with content
                  const sessionPlan = state.sessionPlans.find(plan => plan.sessionId === session.id);
                  const hasSessionPlanWithContent = sessionPlan && sessionPlanHasContent(sessionPlan);

                  // Check if this session has notes
                  const hasNotes = session.notes && session.notes.trim().length > 0;

                  // Get memoized session color data for mobile
                  const sessionColorData = getSessionColor(session.id, sessionColorMap);
                  const buttonClass = sessionColorData.mobileClassName;
                  const buttonStyle = { backgroundColor: sessionColorData.backgroundColor };

                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        handleCloseMobileDayModal();
                        handleSessionClick(session);
                      }}
                      className={`${buttonClass} relative`}
                      style={buttonStyle}
                    >
                      <div className="font-medium">
                        {formatTime(session.bookingTime)} | {displayName}
                      </div>
                      <div className="text-amber-100 text-sm mt-1">
                        {session.sessionType}
                      </div>

                      {/* Icons container */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {/* Circle icon for sessions with special marking */}
                        {session.specialMarking && (
                          <span className="text-white">
                            <Circle size={18} />
                          </span>
                        )}

                        {/* Bell icon for sessions with notes */}
                        {hasNotes && (
                          <span className="text-white">
                            <Bell size={18} />
                          </span>
                        )}
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
