'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Session, Client, Membership, BookingTerms, ActionPoint, SessionParticipant } from '@/types';
import { clientService } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import { membershipService } from '@/services/membershipService';
import { behaviouralBriefService } from '@/services/behaviouralBriefService';
import { behaviourQuestionnaireService } from '@/services/behaviourQuestionnaireService';
import { bookingTermsService } from '@/services/bookingTermsService';
import { sessionPlanService } from '@/services/sessionPlanService';
import { DuplicateDetectionService } from '@/services/duplicateDetectionService';
import { dismissedDuplicatesService } from '@/services/dismissedDuplicatesService';
import { membershipExpirationService } from '@/services/membershipExpirationService';
import { ClientEmailAliasService, ClientEmailAlias } from '@/services/clientEmailAliasService';
import { sessionParticipantService } from '@/services/sessionParticipantService';
import { membershipPairingService } from '@/services/membershipPairingService';

const initialState: AppState = {
  sessions: [],
  clients: [],
  finances: [],
  behaviouralBriefs: [],
  behaviourQuestionnaires: [],
  sessionPlans: [],
  actionPoints: [],
  memberships: [],
  bookingTerms: [],
  clientEmailAliases: {},
  potentialDuplicates: [],
  sessionParticipants: [],
  selectedSession: null,
  selectedClient: null,
  selectedBehaviouralBrief: null,
  selectedBehaviourQuestionnaire: null,
  selectedSessionPlan: null,
  isModalOpen: false,
  modalType: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ),
      };
    
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        selectedSession: state.selectedSession?.id === action.payload ? null : state.selectedSession,
      };
    
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? action.payload : client
        ),
      };
    
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
        selectedClient: state.selectedClient?.id === action.payload ? null : state.selectedClient,
      };

    case 'SET_BEHAVIOURAL_BRIEFS':
      return { ...state, behaviouralBriefs: action.payload };

    case 'ADD_BEHAVIOURAL_BRIEF':
      return { ...state, behaviouralBriefs: [...state.behaviouralBriefs, action.payload] };

    case 'UPDATE_BEHAVIOURAL_BRIEF':
      return {
        ...state,
        behaviouralBriefs: state.behaviouralBriefs.map(brief =>
          brief.id === action.payload.id ? action.payload : brief
        ),
      };

    case 'DELETE_BEHAVIOURAL_BRIEF':
      return {
        ...state,
        behaviouralBriefs: state.behaviouralBriefs.filter(brief => brief.id !== action.payload),
        selectedBehaviouralBrief: state.selectedBehaviouralBrief?.id === action.payload ? null : state.selectedBehaviouralBrief,
      };

    case 'SET_BEHAVIOUR_QUESTIONNAIRES':
      return { ...state, behaviourQuestionnaires: action.payload };

    case 'ADD_BEHAVIOUR_QUESTIONNAIRE':
      return { ...state, behaviourQuestionnaires: [...state.behaviourQuestionnaires, action.payload] };

    case 'UPDATE_BEHAVIOUR_QUESTIONNAIRE':
      return {
        ...state,
        behaviourQuestionnaires: state.behaviourQuestionnaires.map(questionnaire =>
          questionnaire.id === action.payload.id ? action.payload : questionnaire
        ),
      };

    case 'DELETE_BEHAVIOUR_QUESTIONNAIRE':
      return {
        ...state,
        behaviourQuestionnaires: state.behaviourQuestionnaires.filter(questionnaire => questionnaire.id !== action.payload),
        selectedBehaviourQuestionnaire: state.selectedBehaviourQuestionnaire?.id === action.payload ? null : state.selectedBehaviourQuestionnaire,
      };

    case 'SET_MEMBERSHIPS':
      return { ...state, memberships: action.payload };

    case 'ADD_MEMBERSHIP':
      return { ...state, memberships: [...state.memberships, action.payload] };

    case 'UPDATE_MEMBERSHIP':
      return {
        ...state,
        memberships: state.memberships.map(membership =>
          membership.id === action.payload.id ? action.payload : membership
        ),
      };

    case 'DELETE_MEMBERSHIP':
      return {
        ...state,
        memberships: state.memberships.filter(membership => membership.id !== action.payload),
      };

    case 'SET_BOOKING_TERMS':
      return { ...state, bookingTerms: action.payload };

    case 'ADD_BOOKING_TERMS':
      return { ...state, bookingTerms: [...state.bookingTerms, action.payload] };

    case 'SET_CLIENT_EMAIL_ALIASES':
      return { ...state, clientEmailAliases: action.payload };

    case 'SET_ACTION_POINTS':
      return { ...state, actionPoints: action.payload };

    case 'ADD_ACTION_POINT':
      return { ...state, actionPoints: [...state.actionPoints, action.payload] };

    case 'UPDATE_ACTION_POINT':
      return {
        ...state,
        actionPoints: state.actionPoints.map(actionPoint =>
          actionPoint.id === action.payload.id ? action.payload : actionPoint
        ),
      };

    case 'DELETE_ACTION_POINT':
      return {
        ...state,
        actionPoints: state.actionPoints.filter(actionPoint => actionPoint.id !== action.payload),
      };

    case 'SET_POTENTIAL_DUPLICATES':
      return { ...state, potentialDuplicates: action.payload };

    case 'REMOVE_POTENTIAL_DUPLICATE':
      return {
        ...state,
        potentialDuplicates: state.potentialDuplicates.filter(dup => dup.id !== action.payload),
      };

    case 'SET_SELECTED_SESSION':
      return { ...state, selectedSession: action.payload };

    case 'SET_SELECTED_CLIENT':
      return { ...state, selectedClient: action.payload };

    case 'SET_SELECTED_BEHAVIOURAL_BRIEF':
      return { ...state, selectedBehaviouralBrief: action.payload };

    case 'SET_SELECTED_BEHAVIOUR_QUESTIONNAIRE':
      return { ...state, selectedBehaviourQuestionnaire: action.payload };

    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.payload };

    case 'SET_MODAL_TYPE':
      return { ...state, modalType: action.payload };

    case 'SET_SESSION_PARTICIPANTS':
      return { ...state, sessionParticipants: action.payload };

    case 'ADD_SESSION_PARTICIPANT':
      return { ...state, sessionParticipants: [...state.sessionParticipants, action.payload] };

    case 'UPDATE_SESSION_PARTICIPANT':
      return {
        ...state,
        sessionParticipants: state.sessionParticipants.map(participant =>
          participant.id === action.payload.id ? action.payload : participant
        ),
      };

    case 'DELETE_SESSION_PARTICIPANT':
      return {
        ...state,
        sessionParticipants: state.sessionParticipants.filter(participant => participant.id !== action.payload),
      };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Supabase service functions
  loadClients: () => Promise<void>;
  loadSessions: () => Promise<void>;
  loadMemberships: () => Promise<void>;
  loadBehaviourQuestionnaires: () => Promise<void>;
  loadBookingTerms: () => Promise<void>;
  loadClientEmailAliases: () => Promise<void>;
  loadActionPoints: () => Promise<void>;
  loadSessionParticipants: () => Promise<void>;
  loadSessionPlans: () => Promise<void>;
  createActionPoint: (actionPoint: Omit<ActionPoint, 'id'>) => Promise<ActionPoint>;
  updateActionPoint: (id: string, updates: Partial<ActionPoint>) => Promise<ActionPoint>;
  deleteActionPoint: (id: string) => Promise<void>;
  detectDuplicates: () => Promise<void>;
  dismissDuplicate: (duplicateId: string) => Promise<void>;
  clearDismissedDuplicates: () => Promise<void>;
  updateMembershipStatuses: () => Promise<void>;
  createClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  createSession: (session: Omit<Session, 'id'>) => Promise<Session>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  triggerSessionWebhook: (session: Session) => Promise<void>;
  createCalendarEvent: (session: Session) => Promise<void>;
  updateCalendarEvent: (session: Session) => Promise<void>;
  deleteCalendarEvent: (session: Session) => Promise<void>;
  findClientByEmail: (email: string) => Promise<Client | null>;
  getMembershipsByClientId: (clientId: string) => Promise<Membership[]>;
  getMembershipsByEmail: (email: string) => Promise<Membership[]>;
  getMembershipsByClientIdWithAliases: (clientId: string) => Promise<Membership[]>;
  createMembership: (membership: Omit<Membership, 'id'>) => Promise<Membership>;
  updateMembership: (id: string, updates: Partial<Membership>) => Promise<Membership>;
  deleteMembership: (id: string) => Promise<void>;
  createSessionParticipant: (participant: Omit<SessionParticipant, 'id'>) => Promise<SessionParticipant>;
  updateSessionParticipant: (id: string, updates: Partial<SessionParticipant>) => Promise<SessionParticipant>;
  deleteSessionParticipant: (id: string) => Promise<void>;
  getSessionParticipants: (sessionId: string) => Promise<SessionParticipant[]>;
  pairMembershipsWithClients: () => Promise<any>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      const clients = await clientService.getAll();
      dispatch({ type: 'SET_CLIENTS', payload: clients });

      // Detect duplicates after loading clients
      setTimeout(async () => {
        try {
          const allDuplicates = DuplicateDetectionService.detectDuplicates(clients);

          // Filter out dismissed duplicates using database
          let dismissedIds: string[] = [];
          try {
            dismissedIds = await dismissedDuplicatesService.getAllDismissedIds();
          } catch (dbError) {
            // Fallback to localStorage if database fails
            try {
              const stored = localStorage.getItem('dismissedDuplicates');
              dismissedIds = stored ? JSON.parse(stored) : [];
            } catch (storageError) {
              dismissedIds = [];
            }
          }

          const activeDuplicates = allDuplicates.filter(dup => !dismissedIds.includes(dup.id));

          dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: activeDuplicates });
        } catch (error) {
          dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: [] });
        }
      }, 100);
    } catch (error) {
      // Failed to load clients
    }
  };

  // Load sessions from Supabase
  const loadSessions = async () => {
    try {
      const sessions = await sessionService.getAll();
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch (error) {
      // Failed to load sessions
    }
  };

  // Load memberships from Supabase
  const loadMemberships = async () => {
    try {
      console.log('Loading memberships...');
      const memberships = await membershipService.getAll();
      console.log('Loaded memberships:', memberships.length);
      dispatch({ type: 'SET_MEMBERSHIPS', payload: memberships });
    } catch (error) {
      console.error('Failed to load memberships:', error);
    }
  };

  // Load behavioural briefs from Supabase
  const loadBehaviouralBriefs = async () => {
    try {
      console.log('Loading behavioural briefs...');
      const briefs = await behaviouralBriefService.getAll();
      console.log('Loaded behavioural briefs:', briefs.length);
      dispatch({ type: 'SET_BEHAVIOURAL_BRIEFS', payload: briefs });
    } catch (error) {
      console.error('Failed to load behavioural briefs:', error);
    }
  };

  // Load behaviour questionnaires from Supabase
  const loadBehaviourQuestionnaires = async () => {
    try {
      console.log('Loading behaviour questionnaires...');
      const questionnaires = await behaviourQuestionnaireService.getAll();
      console.log('Loaded behaviour questionnaires:', questionnaires.length);
      dispatch({ type: 'SET_BEHAVIOUR_QUESTIONNAIRES', payload: questionnaires });
    } catch (error) {
      console.error('Failed to load behaviour questionnaires:', error);
    }
  };

  // Load booking terms from Supabase
  const loadBookingTerms = async () => {
    try {
      console.log('Loading booking terms...');
      const bookingTerms = await bookingTermsService.getAll();
      console.log('Loaded booking terms:', bookingTerms.length);
      dispatch({ type: 'SET_BOOKING_TERMS', payload: bookingTerms });
    } catch (error) {
      console.error('Failed to load booking terms:', error);
    }
  };

  // Load client email aliases from Supabase
  const loadClientEmailAliases = async () => {
    try {
      const aliases = await ClientEmailAliasService.getAllClientsWithAliases();
      dispatch({ type: 'SET_CLIENT_EMAIL_ALIASES', payload: aliases });
    } catch (error) {
      console.error('Failed to load client email aliases:', error);
    }
  };

  // Load action points from Supabase
  const loadActionPoints = async () => {
    try {
      console.log('Loading action points...');
      const actionPoints = await sessionPlanService.getAllActionPoints();
      console.log('Loaded action points:', actionPoints.length);
      dispatch({ type: 'SET_ACTION_POINTS', payload: actionPoints });
    } catch (error) {
      console.error('Failed to load action points:', error);
    }
  };

  // Load session participants from Supabase
  const loadSessionParticipants = async () => {
    try {
      console.log('Loading session participants...');
      const participants = await sessionParticipantService.getAll();
      console.log('Loaded session participants:', participants.length);
      dispatch({ type: 'SET_SESSION_PARTICIPANTS', payload: participants });
    } catch (error) {
      console.error('Failed to load session participants:', error);
    }
  };

  // Load session plans from Supabase
  const loadSessionPlans = async () => {
    try {
      console.log('Loading session plans...');
      const sessionPlans = await sessionPlanService.getAll();
      console.log('Loaded session plans:', sessionPlans.length);
      dispatch({ type: 'SET_SESSION_PLANS', payload: sessionPlans });
    } catch (error) {
      console.error('Failed to load session plans:', error);
    }
  };

  // Create action point in Supabase
  const createActionPoint = async (actionPointData: Omit<ActionPoint, 'id'>): Promise<ActionPoint> => {
    try {
      const actionPoint = await sessionPlanService.createActionPoint(actionPointData);
      dispatch({ type: 'ADD_ACTION_POINT', payload: actionPoint });
      return actionPoint;
    } catch (error) {
      console.error('Failed to create action point:', error);
      throw error;
    }
  };

  // Update action point in Supabase
  const updateActionPoint = async (id: string, updates: Partial<ActionPoint>): Promise<ActionPoint> => {
    try {
      const actionPoint = await sessionPlanService.updateActionPoint(id, updates);
      dispatch({ type: 'UPDATE_ACTION_POINT', payload: actionPoint });
      return actionPoint;
    } catch (error) {
      console.error('Failed to update action point:', error);
      throw error;
    }
  };

  // Delete action point from Supabase
  const deleteActionPoint = async (id: string): Promise<void> => {
    try {
      await sessionPlanService.deleteActionPoint(id);
      dispatch({ type: 'DELETE_ACTION_POINT', payload: id });
    } catch (error) {
      console.error('Failed to delete action point:', error);
      throw error;
    }
  };

  // Detect potential duplicate clients
  const detectDuplicates = async () => {
    try {
      const allDuplicates = DuplicateDetectionService.detectDuplicates(state.clients);

      // Filter out dismissed duplicates using database
      let dismissedIds: string[] = [];
      try {
        dismissedIds = await dismissedDuplicatesService.getAllDismissedIds();
      } catch (dbError) {
        // Fallback to localStorage if database fails
        try {
          const stored = localStorage.getItem('dismissedDuplicates');
          dismissedIds = stored ? JSON.parse(stored) : [];
        } catch (storageError) {
          dismissedIds = [];
        }
      }

      const activeDuplicates = allDuplicates.filter(dup => !dismissedIds.includes(dup.id));
      dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: activeDuplicates });
    } catch (error) {
      console.error('Failed to detect duplicates:', error);
      dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: [] });
    }
  };

  // Dismiss a potential duplicate
  const dismissDuplicate = async (duplicateId: string) => {
    console.log('🚫 Dismissing duplicate with ID:', duplicateId);

    // Remove from state immediately for better UX
    dispatch({ type: 'REMOVE_POTENTIAL_DUPLICATE', payload: duplicateId });

    // Persist dismissal to database
    try {
      await dismissedDuplicatesService.dismiss(duplicateId);

      // Also save to localStorage as backup
      try {
        const currentDismissed = JSON.parse(localStorage.getItem('dismissedDuplicates') || '[]');
        if (!currentDismissed.includes(duplicateId)) {
          currentDismissed.push(duplicateId);
          localStorage.setItem('dismissedDuplicates', JSON.stringify(currentDismissed));
        }
      } catch (localStorageError) {
        // Could not save to localStorage backup
      }

    } catch (dbError) {
      // Fallback to localStorage if database fails
      try {
        const currentDismissed = JSON.parse(localStorage.getItem('dismissedDuplicates') || '[]');
        if (!currentDismissed.includes(duplicateId)) {
          currentDismissed.push(duplicateId);
          localStorage.setItem('dismissedDuplicates', JSON.stringify(currentDismissed));
        }
      } catch (localStorageError) {
        // Both database and localStorage failed
        // Re-add to state since we couldn't persist the dismissal
        // Note: We'd need to re-run duplicate detection to restore the state
        // For now, we'll leave it dismissed in the UI but it will reappear on refresh
      }
    }
  };

  // Clear all dismissed duplicates (for testing/debugging)
  const clearDismissedDuplicates = async () => {
    try {
      // Clear from database
      await dismissedDuplicatesService.clearAll();

      // Also clear localStorage backup
      localStorage.removeItem('dismissedDuplicates');

      // Re-run duplicate detection to show all duplicates again
      await detectDuplicates();
    } catch (error) {
      // Fallback to localStorage only
      try {
        localStorage.removeItem('dismissedDuplicates');
        await detectDuplicates();
      } catch (fallbackError) {
        // Fallback also failed
      }
    }
  };

  // Update membership statuses for all clients
  const updateMembershipStatuses = async () => {
    try {
      console.log('🔄 Starting membership status update...');
      const result = await membershipExpirationService.updateAllClientMembershipStatuses();
      console.log(`✅ Membership status update complete: ${result.updated} clients updated`);

      // Reload clients to reflect the updated membership statuses
      await loadClients();
    } catch (error) {
      console.error('❌ Error updating membership statuses:', error);
    }
  };

  // Create client in Supabase
  const createClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    try {
      const client = await clientService.create(clientData);
      dispatch({ type: 'ADD_CLIENT', payload: client });
      return client;
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    }
  };

  // Update client in Supabase
  const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
    try {
      const client = await clientService.update(id, updates);
      dispatch({ type: 'UPDATE_CLIENT', payload: client });
      return client;
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  };

  // Delete client from Supabase
  const deleteClient = async (id: string): Promise<void> => {
    try {
      await clientService.delete(id);
      dispatch({ type: 'DELETE_CLIENT', payload: id });
    } catch (error) {
      console.error('Failed to delete client:', error);
      throw error;
    }
  };

  // Validation helper functions for webhooks
  const isValidString = (value: any): boolean => {
    return value && typeof value === 'string' && value.trim().length > 0;
  };

  const isValidEmail = (email: any): boolean => {
    if (!isValidString(email)) return false;
    const emailStr = email.trim();
    // More robust email validation
    return emailStr.length >= 5 &&
           emailStr.includes('@') &&
           emailStr.includes('.') &&
           emailStr.indexOf('@') > 0 &&
           emailStr.indexOf('@') < emailStr.lastIndexOf('.') &&
           emailStr.lastIndexOf('.') < emailStr.length - 1;
  };

  const isValidDate = (date: any): boolean => {
    return isValidString(date) && /^\d{4}-\d{2}-\d{2}$/.test(date);
  };

  const isValidTime = (time: any): boolean => {
    return isValidString(time) && /^\d{2}:\d{2}$/.test(time);
  };

  const isValidWebhookData = (data: any): boolean => {
    // Check if all required fields are present and valid
    return isValidString(data.sessionId) &&
           isValidEmail(data.clientEmail) &&
           data.clientEmail.trim().length > 0 &&
           isValidString(data.sessionType) &&
           isValidDate(data.bookingDate) &&
           isValidTime(data.bookingTime) &&
           isValidString(data.clientFirstName) &&
           isValidString(data.clientLastName) &&
           data.quote !== null &&
           data.quote !== undefined &&
           typeof data.quote === 'number';
  };

  // Trigger Make.com webhooks for new session
  const triggerSessionWebhook = async (session: Session) => {
    try {
      // Find the client for this session (if any)
      const client = session.clientId ? state.clients.find(c => c.id === session.clientId) : null;

      // For Group and RMR Live sessions without clients, create minimal webhook data
      if (!session.clientId && (session.sessionType === 'Group' || session.sessionType === 'RMR Live')) {
        console.log('Group/RMR Live session without client, triggering webhook with minimal data');

        const minimalWebhookData = {
          sessionId: session.id,
          sessionType: session.sessionType,
          bookingDate: session.bookingDate,
          bookingTime: session.bookingTime.substring(0, 5),
          quote: session.quote,
          notes: session.notes || '',
          createdAt: new Date().toISOString(),
          isGroupOrRMRLive: true
        };

        // Trigger the webhook for Group/RMR Live sessions
        await fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(minimalWebhookData)
        });

        return;
      }

      if (!client || !client.email) {
        console.log('No client or email found for session, skipping webhook');
        return;
      }

      // Calculate days until session for webhook logic
      const sessionDate = new Date(session.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      sessionDate.setHours(0, 0, 0, 0); // Reset time to start of day

      const daysUntilSession = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Session is ${daysUntilSession} days away`);

      // Check if client has already signed booking terms by looking in booking_terms table
      const hasSignedBookingTerms = state.bookingTerms.some(bt =>
        bt.email?.toLowerCase() === client.email?.toLowerCase()
      );

      // Check if client has filled questionnaire for the specific dog in this session
      const sessionDogName = session.dogName || client.dogName;
      const hasFilledQuestionnaire = sessionDogName ?
        state.behaviourQuestionnaires.some(q =>
          (q.client_id === client.id || q.clientId === client.id) &&
          q.dogName === sessionDogName
        ) : false;

      // Prepare session data for Make.com
      const webhookData = {
        sessionId: session.id,
        clientId: session.clientId,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientFirstName: client.firstName,
        clientLastName: client.lastName,
        clientEmail: client.email,
        address: client.address || '',
        dogName: sessionDogName || '',
        sessionType: session.sessionType,
        bookingDate: session.bookingDate, // YYYY-MM-DD format
        bookingTime: session.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)
        quote: session.quote,
        notes: session.notes || '',
        membershipStatus: client.membership,
        createdAt: new Date().toISOString(),
        // Form completion status
        hasSignedBookingTerms,
        hasFilledQuestionnaire,
        // Form URLs with email prefilled
        bookingTermsUrl: `${window.location.origin}/booking-terms?email=${encodeURIComponent(client.email)}`,
        questionnaireUrl: `${window.location.origin}/behaviour-questionnaire?email=${encodeURIComponent(client.email)}`,
        // Callback URL for Event ID
        eventIdCallbackUrl: `${window.location.origin}/api/session/event-id`
      };

      // Comprehensive validation to prevent blank/empty webhook data

      // Validate all essential fields with strict checks
      const hasValidData =
        isValidString(webhookData.sessionId) &&
        isValidString(webhookData.clientId) &&
        isValidString(webhookData.clientName) &&
        isValidString(webhookData.clientFirstName) &&
        isValidString(webhookData.clientLastName) &&
        isValidEmail(webhookData.clientEmail) &&
        isValidString(webhookData.sessionType) &&
        isValidDate(webhookData.bookingDate) &&
        isValidTime(webhookData.bookingTime) &&
        typeof webhookData.quote === 'number' &&
        webhookData.quote >= 0;

      // Block webhook if any essential data is missing or invalid
      if (!hasValidData) {
        return;
      }

      // Prepare webhook promises - trigger booking terms webhook for ALL sessions immediately
      const webhookPromises: Promise<Response>[] = [];
      const webhookNames: string[] = [];

      // Always trigger booking terms webhook for all newly created sessions
      // Comprehensive validation to prevent blank/empty webhook data
      if (isValidWebhookData(webhookData)) {
        console.log(`[BOOKING_TERMS_WEBHOOK] Adding to queue for new session ${webhookData.sessionId} - ${webhookData.clientFirstName} ${webhookData.clientLastName}`);
        webhookPromises.push(
          fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
          })
        );
        webhookNames.push('booking terms email webhook');
      } else {
        console.log(`[BOOKING_TERMS_WEBHOOK] BLOCKED - Invalid data for session ${session.id}. Webhook data:`, webhookData);
      }

      // Always trigger session webhook for all new sessions
      const webhookDataWithFlags = {
        ...webhookData,
        sendSessionEmail: daysUntilSession <= 4, // Only send email if ≤4 days away
        createCalendarEvent: false // Don't create calendar events for new sessions
      };

      webhookPromises.push(
        fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookDataWithFlags)
        })
      );
      webhookNames.push('session webhook (new session created)');

      const responses = await Promise.allSettled(webhookPromises);



    } catch (error) {
      // Don't throw error - webhook failure shouldn't prevent session creation
    }
  };

  // Create session in Supabase
  const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    try {
      // Create the session in the database
      const session = await sessionService.create(sessionData);
      dispatch({ type: 'ADD_SESSION', payload: session });

      // Trigger the booking terms email webhook (which should also create calendar event)
      await triggerSessionWebhook(session);

      // Calendar events are no longer created automatically for new sessions
      // They will only be created when the user updates Date, Time, or Session Type

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  // Trigger booking terms webhook for session updates
  const triggerBookingTermsWebhookForUpdate = async (session: Session) => {
    try {
      // Find the client for this session (if any)
      const client = session.clientId ? state.clients.find(c => c.id === session.clientId) : null;

      // For Group and RMR Live sessions without clients, skip webhook
      if (!session.clientId && (session.sessionType === 'Group' || session.sessionType === 'RMR Live')) {
        return;
      }

      if (!client || !client.email) {
        return;
      }

      // Check if client has already signed booking terms by looking in booking_terms table
      const hasSignedBookingTerms = state.bookingTerms.some(bt =>
        bt.email?.toLowerCase() === client.email?.toLowerCase()
      );

      // Check if client has filled questionnaire for the specific dog in this session
      const sessionDogName = session.dogName || client.dogName;
      const hasFilledQuestionnaire = sessionDogName ?
        state.behaviourQuestionnaires.some(bq =>
          (bq.client_id === client.id || bq.clientId === client.id) &&
          bq.dogName === sessionDogName
        ) : false;

      // Prepare session data for booking terms webhook
      const webhookData = {
        sessionId: session.id,
        clientId: session.clientId,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientFirstName: client.firstName,
        clientLastName: client.lastName,
        clientEmail: client.email,
        address: client.address || '',
        dogName: sessionDogName || '',
        sessionType: session.sessionType,
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime.substring(0, 5),
        quote: session.quote,
        notes: session.notes || '',
        createdAt: new Date().toISOString(),
        hasSignedBookingTerms,
        hasFilledQuestionnaire,
        isMember: client.membership,
        // Form URLs with email prefilled
        bookingTermsUrl: `https://raising-my-rescue.vercel.app/booking-terms?email=${encodeURIComponent(client.email)}`,
        questionnaireUrl: `https://rmrcms.vercel.app/questionnaire?email=${encodeURIComponent(client.email)}`
      };

      // Comprehensive validation to prevent blank/empty webhook data
      if (isValidWebhookData(webhookData)) {
        const webhookTimestamp = new Date().toISOString();
        console.log(`[BOOKING_TERMS_WEBHOOK] Triggering for session ${webhookData.sessionId} - ${webhookData.clientFirstName} ${webhookData.clientLastName} at ${webhookTimestamp}`);
        await fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...webhookData,
            webhookTimestamp
          })
        });
        console.log(`[BOOKING_TERMS_WEBHOOK] Completed for session ${webhookData.sessionId} at ${new Date().toISOString()}`);
      } else {
        console.log(`[BOOKING_TERMS_WEBHOOK] BLOCKED - Invalid data for session ${session.id}. Webhook data:`, webhookData);
      }
    } catch (error) {
      // Don't throw error - webhook failure shouldn't prevent session update
    }
  };

  // Internal update session function that bypasses webhook triggers (for system updates like eventId)
  const updateSessionInternal = async (id: string, updates: Partial<Session>): Promise<Session> => {
    try {
      console.log(`[UPDATE_SESSION_INTERNAL] Starting internal update for session ID: ${id}`);
      console.log(`[UPDATE_SESSION_INTERNAL] Updates:`, updates);

      // Update only this specific session in the database
      const session = await sessionService.update(id, updates);
      console.log(`[UPDATE_SESSION_INTERNAL] Database updated for session ${id}`);

      // Update only this specific session in the state
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      console.log(`[UPDATE_SESSION_INTERNAL] State updated for session ${id} - NO WEBHOOKS TRIGGERED`);

      return session;
    } catch (error) {
      console.error(`[UPDATE_SESSION_INTERNAL] Failed to update session ${id}:`, error);
      throw error;
    }
  };

  // Update session in Supabase
  const updateSession = async (id: string, updates: Partial<Session>): Promise<Session> => {
    try {
      console.log(`[UPDATE_SESSION] Starting update for session ID: ${id} ONLY`);
      console.log(`[UPDATE_SESSION] Updates:`, updates);

      // Get the original session data to detect changes
      const originalSession = state.sessions.find(s => s.id === id);
      if (!originalSession) {
        throw new Error(`Session ${id} not found in state`);
      }

      // Update only this specific session in the database
      const session = await sessionService.update(id, updates);
      console.log(`[UPDATE_SESSION] Database updated for session ${id}`);

      // Update only this specific session in the state
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      console.log(`[UPDATE_SESSION] State updated for session ${id} ONLY`);

      // Check if Date, Time, or Session Type changed
      const dateChanged = updates.bookingDate !== undefined && originalSession.bookingDate !== updates.bookingDate;
      const timeChanged = updates.bookingTime !== undefined && originalSession.bookingTime !== updates.bookingTime;
      const sessionTypeChanged = updates.sessionType !== undefined && originalSession.sessionType !== updates.sessionType;
      const calendarRelevantChange = dateChanged || timeChanged || sessionTypeChanged;

      console.log(`[UPDATE_SESSION] Calendar relevant changes:`, {
        dateChanged,
        timeChanged,
        sessionTypeChanged,
        calendarRelevantChange,
        originalDate: originalSession.bookingDate,
        newDate: updates.bookingDate,
        originalTime: originalSession.bookingTime,
        newTime: updates.bookingTime,
        originalType: originalSession.sessionType,
        newType: updates.sessionType,
        sessionEventId: session.eventId
      });

      // Handle calendar updates for Date, Time, or Session Type changes
      if (calendarRelevantChange) {
        console.log(`[UPDATE_SESSION] Calendar relevant change detected, handling calendar update`);

        try {
          if (session.eventId) {
            // Update existing calendar event
            console.log(`[UPDATE_SESSION] Updating existing calendar event: ${session.eventId}`);
            await updateCalendarEvent(session);
            console.log(`[UPDATE_SESSION] Calendar event updated successfully`);
          } else {
            // Create new calendar event if none exists
            console.log(`[UPDATE_SESSION] No eventId found, creating new calendar event`);
            await createCalendarEvent(session);
            console.log(`[UPDATE_SESSION] Calendar event created successfully`);
          }
        } catch (calendarError) {
          console.error(`[UPDATE_SESSION] Calendar update failed:`, calendarError);
          // Don't throw the error - calendar failure shouldn't prevent session update
        }
      } else {
        console.log(`[UPDATE_SESSION] No calendar relevant changes detected, skipping calendar update`);
      }

      // Only trigger booking terms webhook for Session Type, Date, or Time changes
      // This prevents webhooks for internal updates like payment status, notes, session plan sent status, eventId, etc.
      const bookingTermsRelevantFields = [
        'sessionType',
        'bookingDate',
        'bookingTime'
      ];
      const hasBookingTermsRelevantChange = Object.keys(updates).some(key => bookingTermsRelevantFields.includes(key));

      console.log(`[UPDATE_SESSION] Booking terms webhook check for session ${id}:`, {
        updatedFields: Object.keys(updates),
        bookingTermsRelevantFields,
        hasBookingTermsRelevantChange,
        willTriggerWebhook: hasBookingTermsRelevantChange
      });

      if (hasBookingTermsRelevantChange) {
        console.log(`[UPDATE_SESSION] ✅ TRIGGERING booking terms webhook for session ${id}`);
        console.log(`[UPDATE_SESSION] Relevant changed fields:`, Object.keys(updates).filter(key => bookingTermsRelevantFields.includes(key)));
        console.log(`[UPDATE_SESSION] Webhook timestamp:`, new Date().toISOString());
        await triggerBookingTermsWebhookForUpdate(session);
        console.log(`[UPDATE_SESSION] Booking terms webhook completed for session ${id} at`, new Date().toISOString());
      } else {
        console.log(`[UPDATE_SESSION] ❌ SKIPPING booking terms webhook for session ${id} - no relevant changes`);
        console.log(`[UPDATE_SESSION] Updated fields (not relevant):`, Object.keys(updates));
      }

      console.log(`[UPDATE_SESSION] Update complete for session ${id} - NO OTHER SESSIONS AFFECTED`);
      return session;
    } catch (error) {
      console.error(`[UPDATE_SESSION] Failed to update session ${id}:`, error);
      throw error;
    }
  };

  // Create calendar event directly (fallback for when Make.com webhook fails)
  const createCalendarEvent = async (session: Session) => {
    try {
      const client = session.clientId ? state.clients.find(c => c.id === session.clientId) : null;

      // Skip calendar creation for Group/RMR Live sessions without clients
      if (!session.clientId && (session.sessionType === 'Group' || session.sessionType === 'RMR Live')) {
        console.log('Group/RMR Live session without client, skipping calendar creation');
        return;
      }

      if (!client) {
        console.log('No client found for session, skipping calendar creation');
        return;
      }

      console.log('Creating Google Calendar event for session:', {
        sessionId: session.id,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime
      });

      // Create Google Calendar event with retry logic
      const createCalendarWithRetry = async (retryCount = 0) => {
        const maxRetries = 2;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          console.log(`[CALENDAR_CREATE] Attempt ${retryCount + 1}/${maxRetries + 1} to create calendar event`);

          const calendarResponse = await fetch('/api/calendar/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientName: `${client.firstName} ${client.lastName}`.trim(),
              clientEmail: client.email || '',
              clientAddress: client.address || '',
              dogName: session.dogName || client.dogName || '',
              sessionType: session.sessionType,
              bookingDate: session.bookingDate,
              bookingTime: session.bookingTime,
              notes: session.notes,
              quote: session.quote
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (calendarResponse.ok) {
            const result = await calendarResponse.json();
            console.log('[CALENDAR_CREATE] Successfully created calendar event:', result.eventId);

            // Update the session with the new eventId using internal update (no webhooks)
            if (result.eventId) {
              await updateSessionInternal(session.id, { eventId: result.eventId });
              console.log('[CALENDAR_CREATE] Updated session with eventId (internal):', result.eventId);
            }
            return true;
          } else {
            console.error('[CALENDAR_CREATE] Failed to create calendar event via API:', calendarResponse.status);
            const errorText = await calendarResponse.text();
            console.error('[CALENDAR_CREATE] Error response:', errorText);
            return false;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('[CALENDAR_CREATE] Calendar creation request timed out');
          } else {
            console.error('[CALENDAR_CREATE] Calendar creation request failed:', fetchError);
          }

          // Retry on network errors if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`[CALENDAR_CREATE] Retrying in 2 seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            return createCalendarWithRetry(retryCount + 1);
          }

          return false;
        }
      };

      await createCalendarWithRetry();

    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      // Don't throw error - calendar failure shouldn't prevent session creation
    }
  };

  // Update Google Calendar event when session date/time changes
  const updateCalendarEvent = async (session: Session) => {
    try {
      // Find the client for this session (if any)
      const client = session.clientId ? state.clients.find(c => c.id === session.clientId) : null;

      if (!session.eventId) {
        console.log('No eventId found for session, skipping calendar update. Session:', {
          id: session.id,
          eventId: session.eventId,
          clientId: session.clientId,
          sessionType: session.sessionType
        });
        return;
      }

      console.log('Updating Google Calendar event for session:', {
        sessionId: session.id,
        eventId: session.eventId,
        clientName: client ? `${client.firstName} ${client.lastName}`.trim() : session.sessionType,
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime
      });

      // Update Google Calendar event via API route with retry logic
      const updateCalendarWithRetry = async (retryCount = 0) => {
        const maxRetries = 2;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          console.log(`[CALENDAR_UPDATE] Attempt ${retryCount + 1}/${maxRetries + 1} to update calendar event ${session.eventId}`);

          const calendarResponse = await fetch('/api/calendar/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId: session.eventId,
              clientName: client ? `${client.firstName} ${client.lastName}`.trim() : session.sessionType,
              clientEmail: client?.email || '',
              clientAddress: client?.address || '',
              dogName: session.dogName || client?.dogName || '',
              sessionType: session.sessionType,
              bookingDate: session.bookingDate,
              bookingTime: session.bookingTime,
              notes: session.notes,
              quote: session.quote
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (calendarResponse.ok) {
            console.log('[CALENDAR_UPDATE] Successfully updated calendar event');
            return true;
          } else {
            console.error('[CALENDAR_UPDATE] Failed to update calendar event via API:', calendarResponse.status);
            const errorText = await calendarResponse.text();
            console.error('[CALENDAR_UPDATE] Error response:', errorText);
            return false;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('[CALENDAR_UPDATE] Calendar update request timed out');
          } else {
            console.error('[CALENDAR_UPDATE] Calendar update request failed:', fetchError);
          }

          // Retry on network errors if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`[CALENDAR_UPDATE] Retrying in 2 seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            return updateCalendarWithRetry(retryCount + 1);
          }

          return false;
        }
      };

      await updateCalendarWithRetry();

    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      // Don't throw error - calendar failure shouldn't prevent session update
    }
  };

  // Delete Google Calendar event when session is deleted
  const deleteCalendarEvent = async (session: Session) => {
    try {
      if (!session.eventId) {
        console.log('No eventId found for session, skipping calendar deletion');
        return;
      }

      console.log('Deleting Google Calendar event for session:', session.id);

      // Delete Google Calendar event with retry logic
      const deleteCalendarWithRetry = async (retryCount = 0) => {
        const maxRetries = 2;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          console.log(`[CALENDAR_DELETE] Attempt ${retryCount + 1}/${maxRetries + 1} to delete calendar event ${session.eventId}`);

          const calendarResponse = await fetch('/api/calendar/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId: session.eventId
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (calendarResponse.ok) {
            console.log('[CALENDAR_DELETE] Successfully deleted calendar event');
            return true;
          } else {
            console.error('[CALENDAR_DELETE] Failed to delete calendar event via API:', calendarResponse.status);
            const errorText = await calendarResponse.text();
            console.error('[CALENDAR_DELETE] Error response:', errorText);
            return false;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('[CALENDAR_DELETE] Calendar delete request timed out');
          } else {
            console.error('[CALENDAR_DELETE] Calendar delete request failed:', fetchError);
          }

          // Retry on network errors if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`[CALENDAR_DELETE] Retrying in 2 seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            return deleteCalendarWithRetry(retryCount + 1);
          }

          return false;
        }
      };

      const success = await deleteCalendarWithRetry();
      if (!success) {
        throw new Error('Failed to delete calendar event after retries');
      }

    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      // Throw error so deleteSession can handle it and ask user for confirmation
      throw error;
    }
  };

  // Delete session from Supabase
  const deleteSession = async (id: string): Promise<void> => {
    try {
      console.log('deleteSession called with ID:', id);

      // Get the session first from database to ensure we have latest data including Event ID
      const sessionFromDb = await sessionService.getById(id);
      console.log('Found session in database for deletion:', sessionFromDb ? 'Yes' : 'No', sessionFromDb?.id);
      console.log('Session Event ID:', sessionFromDb?.eventId || 'None');

      if (sessionFromDb) {
        console.log('Deleting calendar event for session:', sessionFromDb.id);
        // Delete calendar event and wait for it to complete before deleting from database
        try {
          await deleteCalendarEvent(sessionFromDb);
          console.log('Calendar event deletion completed successfully');
        } catch (calendarError) {
          console.error('Calendar event deletion failed:', calendarError);
          // Ask user if they want to proceed despite calendar failure
          const proceed = window.confirm(
            'The calendar event deletion failed. The session will still be deleted from the app, but the calendar event may remain. Do you want to proceed with deleting the session?'
          );
          if (!proceed) {
            console.log('User cancelled deletion due to calendar failure');
            return; // Don't delete if user cancels
          }
        }
      } else {
        console.log('No session found in database for ID:', id);
      }

      console.log('Deleting session from database...');
      await sessionService.delete(id);
      dispatch({ type: 'DELETE_SESSION', payload: id });
      console.log('Session deleted successfully');
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  };

  // Find client by email (for questionnaire pairing)
  const findClientByEmail = async (email: string): Promise<Client | null> => {
    try {
      return await clientService.findByEmail(email);
    } catch (error) {
      console.error('Failed to find client by email:', error);
      throw error;
    }
  };

  // Get memberships by client ID
  const getMembershipsByClientId = async (clientId: string): Promise<Membership[]> => {
    try {
      return await membershipService.getByClientId(clientId);
    } catch (error) {
      console.error('Failed to get memberships by client ID:', error);
      throw error;
    }
  };

  // Get memberships by email (for pairing with clients)
  const getMembershipsByEmail = async (email: string): Promise<Membership[]> => {
    try {
      return await membershipService.getByEmail(email);
    } catch (error) {
      console.error('Failed to get memberships by email:', error);
      throw error;
    }
  };

  // Get memberships by client ID including email aliases
  const getMembershipsByClientIdWithAliases = async (clientId: string): Promise<Membership[]> => {
    try {
      return await membershipService.getByClientIdWithAliases(clientId);
    } catch (error) {
      console.error('Failed to get memberships by client ID with aliases:', error);
      throw error;
    }
  };

  // Session Participants Management
  const createSessionParticipant = async (participantData: Omit<SessionParticipant, 'id'>): Promise<SessionParticipant> => {
    try {
      const participant = await sessionParticipantService.create(participantData);
      dispatch({ type: 'ADD_SESSION_PARTICIPANT', payload: participant });
      return participant;
    } catch (error) {
      console.error('Failed to create session participant:', error);
      throw error;
    }
  };

  const updateSessionParticipant = async (id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant> => {
    try {
      const participant = await sessionParticipantService.update(id, updates);
      dispatch({ type: 'UPDATE_SESSION_PARTICIPANT', payload: participant });
      return participant;
    } catch (error) {
      console.error('Failed to update session participant:', error);
      throw error;
    }
  };

  const deleteSessionParticipant = async (id: string): Promise<void> => {
    try {
      await sessionParticipantService.delete(id);
      dispatch({ type: 'DELETE_SESSION_PARTICIPANT', payload: id });
    } catch (error) {
      console.error('Failed to delete session participant:', error);
      throw error;
    }
  };

  const getSessionParticipants = async (sessionId: string): Promise<SessionParticipant[]> => {
    try {
      return await sessionParticipantService.getBySessionId(sessionId);
    } catch (error) {
      console.error('Failed to get session participants:', error);
      throw error;
    }
  };

  // Create membership in Supabase
  const createMembership = async (membershipData: Omit<Membership, 'id'>): Promise<Membership> => {
    try {
      const membership = await membershipService.create(membershipData);
      dispatch({ type: 'ADD_MEMBERSHIP', payload: membership });
      return membership;
    } catch (error) {
      console.error('Failed to create membership:', error);
      throw error;
    }
  };

  // Update membership in Supabase
  const updateMembership = async (id: string, updates: Partial<Membership>): Promise<Membership> => {
    try {
      const membership = await membershipService.update(id, updates);
      dispatch({ type: 'UPDATE_MEMBERSHIP', payload: membership });
      return membership;
    } catch (error) {
      console.error('Failed to update membership:', error);
      throw error;
    }
  };

  // Delete membership in Supabase
  const deleteMembership = async (id: string): Promise<void> => {
    try {
      await membershipService.delete(id);
      dispatch({ type: 'DELETE_MEMBERSHIP', payload: id });
    } catch (error) {
      console.error('Failed to delete membership:', error);
      throw error;
    }
  };

  // Membership Pairing
  const pairMembershipsWithClients = async () => {
    try {
      console.log('🔄 Auto-pairing memberships with clients...');
      const result = await membershipPairingService.pairMembershipsWithClients();

      if (result.success) {
        console.log(`✅ Successfully paired ${result.pairingCount} memberships`);
        // Reload clients to reflect updated membership statuses
        await loadClients();
        await loadMemberships();
      } else {
        console.error('❌ Membership pairing failed:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('Failed to pair memberships with clients:', error);
      throw error;
    }
  };

  // Load initial data on mount
  useEffect(() => {
    console.log('AppContext: Loading initial data...');
    const initializeApp = async () => {
      await loadClients();
      await loadSessions();
      await loadMemberships();
      await loadBehaviouralBriefs();
      await loadBehaviourQuestionnaires();
      await loadBookingTerms();
      await loadClientEmailAliases();
      await loadActionPoints();
      await loadSessionParticipants();
      await loadSessionPlans();

      // Membership status updates now handled by daily cron job via /api/membership-expiration
      console.log('✅ Initial data loading complete');
    };

    initializeApp();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      loadClients,
      loadSessions,
      loadMemberships,
      loadBehaviourQuestionnaires,
      loadBookingTerms,
      loadClientEmailAliases,
      loadActionPoints,
      loadSessionParticipants,
      loadSessionPlans,
      createActionPoint,
      updateActionPoint,
      deleteActionPoint,
      detectDuplicates,
      dismissDuplicate,
      clearDismissedDuplicates,
      updateMembershipStatuses,
      createClient,
      updateClient,
      deleteClient,
      createSession,
      updateSession,
      deleteSession,
      triggerSessionWebhook,
      createCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      findClientByEmail,
      getMembershipsByClientId,
      getMembershipsByEmail,
      getMembershipsByClientIdWithAliases,
      createMembership,
      updateMembership,
      deleteMembership,
      createSessionParticipant,
      updateSessionParticipant,
      deleteSessionParticipant,
      getSessionParticipants,
      pairMembershipsWithClients,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
