'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Session, Client, Membership, BookingTerms, ActionPoint } from '@/types';
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
  potentialDuplicates: [],
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
  loadActionPoints: () => Promise<void>;
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
  triggerSessionUpdateWebhook: (session: Session) => Promise<void>;
  triggerSessionDeletionWebhook: (session: Session) => Promise<void>;
  findClientByEmail: (email: string) => Promise<Client | null>;
  getMembershipsByClientId: (clientId: string) => Promise<Membership[]>;
  getMembershipsByEmail: (email: string) => Promise<Membership[]>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      console.log('Loading clients...');
      const clients = await clientService.getAll();
      console.log('Loaded clients:', clients.length);
      dispatch({ type: 'SET_CLIENTS', payload: clients });

      // Detect duplicates after loading clients
      setTimeout(async () => {
        try {
          const allDuplicates = DuplicateDetectionService.detectDuplicates(clients);

          // Filter out dismissed duplicates using database
          let dismissedIds: string[] = [];
          try {
            dismissedIds = await dismissedDuplicatesService.getAllDismissedIds();
            console.log('💾 Retrieved dismissed duplicates from database:', dismissedIds);
          } catch (dbError) {
            console.error('❌ Error reading dismissed duplicates from database:', dbError);
            console.log('⚠️ Falling back to localStorage for dismissed duplicates');

            // Fallback to localStorage if database fails
            try {
              const stored = localStorage.getItem('dismissedDuplicates');
              dismissedIds = stored ? JSON.parse(stored) : [];
              console.log('📦 Fallback: Retrieved dismissed duplicates from localStorage:', dismissedIds);
            } catch (storageError) {
              console.error('❌ Error reading dismissed duplicates from localStorage:', storageError);
              dismissedIds = [];
            }
          }

          const activeDuplicates = allDuplicates.filter(dup => !dismissedIds.includes(dup.id));

          console.log('🔍 Duplicate detection results:', {
            total: allDuplicates.length,
            dismissed: dismissedIds.length,
            active: activeDuplicates.length,
            dismissedIds,
            allDuplicateIds: allDuplicates.map(d => d.id),
            database_used: true,
            browser_info: navigator.userAgent
          });
          dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: activeDuplicates });
        } catch (error) {
          console.error('Error detecting duplicates:', error);
          dispatch({ type: 'SET_POTENTIAL_DUPLICATES', payload: [] });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  // Load sessions from Supabase
  const loadSessions = async () => {
    try {
      console.log('Loading sessions...');
      const sessions = await sessionService.getAll();
      console.log('Loaded sessions:', sessions.length);
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
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
      console.log('Detecting potential duplicate clients...');
      const allDuplicates = DuplicateDetectionService.detectDuplicates(state.clients);

      // Filter out dismissed duplicates using database
      let dismissedIds: string[] = [];
      try {
        dismissedIds = await dismissedDuplicatesService.getAllDismissedIds();
        console.log('💾 Manual detection: Retrieved dismissed duplicates from database:', dismissedIds);
      } catch (dbError) {
        console.error('❌ Manual detection: Error reading dismissed duplicates from database:', dbError);
        console.log('⚠️ Manual detection: Falling back to localStorage');

        // Fallback to localStorage if database fails
        try {
          const stored = localStorage.getItem('dismissedDuplicates');
          dismissedIds = stored ? JSON.parse(stored) : [];
          console.log('📦 Manual detection: Fallback localStorage dismissed duplicates:', dismissedIds);
        } catch (storageError) {
          console.error('❌ Manual detection: Error reading localStorage:', storageError);
          dismissedIds = [];
        }
      }

      const activeDuplicates = allDuplicates.filter(dup => !dismissedIds.includes(dup.id));

      console.log('🔍 Manual duplicate detection results:', {
        total: allDuplicates.length,
        dismissed: dismissedIds.length,
        active: activeDuplicates.length,
        dismissedIds,
        allDuplicateIds: allDuplicates.map(d => d.id)
      });
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
      console.log('✅ Successfully dismissed duplicate in database:', duplicateId);

      // Also save to localStorage as backup
      try {
        const currentDismissed = JSON.parse(localStorage.getItem('dismissedDuplicates') || '[]');
        if (!currentDismissed.includes(duplicateId)) {
          currentDismissed.push(duplicateId);
          localStorage.setItem('dismissedDuplicates', JSON.stringify(currentDismissed));
          console.log('📦 Backup: Also saved to localStorage:', currentDismissed);
        }
      } catch (localStorageError) {
        console.warn('⚠️ Could not save to localStorage backup:', localStorageError);
      }

    } catch (dbError) {
      console.error('❌ Error dismissing duplicate in database:', dbError);
      console.log('⚠️ Falling back to localStorage only');

      // Fallback to localStorage if database fails
      try {
        const currentDismissed = JSON.parse(localStorage.getItem('dismissedDuplicates') || '[]');
        if (!currentDismissed.includes(duplicateId)) {
          currentDismissed.push(duplicateId);
          localStorage.setItem('dismissedDuplicates', JSON.stringify(currentDismissed));
          console.log('📦 Fallback: Saved dismissed duplicate to localStorage:', currentDismissed);
        }
      } catch (localStorageError) {
        console.error('❌ Both database and localStorage failed:', localStorageError);
        // Re-add to state since we couldn't persist the dismissal
        console.log('🔄 Re-adding duplicate to state since dismissal failed');
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
      console.log('🗑️ Cleared all dismissed duplicates from database');

      // Also clear localStorage backup
      localStorage.removeItem('dismissedDuplicates');
      console.log('🗑️ Cleared all dismissed duplicates from localStorage backup');

      // Re-run duplicate detection to show all duplicates again
      await detectDuplicates();
    } catch (error) {
      console.error('❌ Error clearing dismissed duplicates:', error);

      // Fallback to localStorage only
      try {
        localStorage.removeItem('dismissedDuplicates');
        console.log('🗑️ Fallback: Cleared dismissed duplicates from localStorage');
        await detectDuplicates();
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
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

  // Trigger Make.com webhooks for new session
  const triggerSessionWebhook = async (session: Session) => {
    try {
      // Find the client for this session
      const client = state.clients.find(c => c.id === session.clientId);

      if (!client || !client.email) {
        console.log('No client or email found for session, skipping webhook');
        return;
      }

      // Check if client has already signed booking terms by looking in booking_terms table
      const hasSignedBookingTerms = state.bookingTerms.some(bt =>
        bt.email?.toLowerCase() === client.email?.toLowerCase()
      );

      // Check if client has filled questionnaire for this dog
      // Look for questionnaire with matching client email and dog name
      const hasFilledQuestionnaire = state.behaviourQuestionnaires.some(q =>
        q.email?.toLowerCase() === client.email?.toLowerCase() &&
        q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
      );

      // Prepare session data for Make.com
      const webhookData = {
        sessionId: session.id,
        clientId: session.clientId,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientFirstName: client.firstName,
        clientEmail: client.email,
        dogName: client.dogName || '',
        sessionType: session.sessionType,
        bookingDate: session.bookingDate, // YYYY-MM-DD format
        bookingTime: session.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)
        quote: session.quote,
        notes: session.notes || '',
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

      console.log('Triggering Make.com webhooks for new session:', webhookData);

      // Send to both webhooks in parallel
      const webhookPromises = [
        // Original session webhook
        fetch('https://hook.eu1.make.com/lipggo8kcd8kwq2vp6j6mr3gnxbx12h7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        }),
        // New booking terms email webhook
        fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        })
      ];

      const responses = await Promise.allSettled(webhookPromises);

      // Log results
      responses.forEach((result, index) => {
        const webhookName = index === 0 ? 'session webhook' : 'booking terms email webhook';
        if (result.status === 'fulfilled' && result.value.ok) {
          console.log(`Successfully triggered ${webhookName}`);
        } else {
          console.error(`Failed to trigger ${webhookName}:`,
            result.status === 'fulfilled' ?
              `${result.value.status} ${result.value.statusText}` :
              result.reason
          );
        }
      });

    } catch (error) {
      console.error('Error triggering Make.com webhooks:', error);
      // Don't throw error - webhook failure shouldn't prevent session creation
    }
  };

  // Create session in Supabase
  const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    try {
      const session = await sessionService.create(sessionData);
      dispatch({ type: 'ADD_SESSION', payload: session });

      // Trigger Make.com webhook for calendar creation and other integrations
      await triggerSessionWebhook(session);

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  // Update session in Supabase
  const updateSession = async (id: string, updates: Partial<Session>): Promise<Session> => {
    try {
      const session = await sessionService.update(id, updates);
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      return session;
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  };

  // Trigger Make.com webhook for session update when date/time changes
  const triggerSessionUpdateWebhook = async (session: Session) => {
    try {
      // Find the client for this session
      const client = state.clients.find(c => c.id === session.clientId);

      if (!client || !client.email) {
        console.log('No client or email found for session update, skipping webhook');
        return;
      }

      // Check if client has already signed booking terms
      const hasSignedBookingTerms = state.bookingTerms.some(bt =>
        bt.email?.toLowerCase() === client.email?.toLowerCase()
      );

      // Check if client has filled behaviour questionnaire
      const hasFilledQuestionnaire = client && client.dogName && client.email ?
        state.behaviourQuestionnaires.some(q =>
          q.email?.toLowerCase() === client.email?.toLowerCase() &&
          q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
        ) : false;

      // Prepare session data for Make.com webhook (match new session format)
      const webhookData = {
        sessionId: session.id,
        clientId: session.clientId,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientFirstName: client.firstName,
        clientEmail: client.email,
        dogName: session.dogName || client.dogName,
        sessionType: session.sessionType,
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime,
        notes: session.notes,
        quote: session.quote,
        createdAt: new Date().toISOString(),
        // Include booking terms and questionnaire status
        hasSignedBookingTerms,
        hasFilledQuestionnaire,
        // URLs for forms (same as new session)
        bookingTermsUrl: `${window.location.origin}/booking-terms?email=${encodeURIComponent(client.email)}`,
        questionnaireUrl: `${window.location.origin}/behaviour-questionnaire?email=${encodeURIComponent(client.email)}`,
        // Callback URL for Event ID
        eventIdCallbackUrl: `${window.location.origin}/api/session/event-id`
      };

      console.log('Triggering Make.com webhook for session update:', webhookData);

      // Call the specified webhook
      const response = await fetch('https://hook.eu1.make.com/yaoalfe77uqtw4xv9fbh5atf4okq14wm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        console.log('Successfully triggered session update webhook');
        const responseText = await response.text();
        console.log('Webhook response:', responseText);
      } else {
        console.error('Failed to trigger session update webhook:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }

    } catch (error) {
      console.error('Error triggering Make.com session update webhook:', error);
      // Don't throw error - webhook failure shouldn't prevent session update
    }
  };

  // Trigger Make.com webhook for session deletion
  const triggerSessionDeletionWebhook = async (session: Session) => {
    try {
      // Find the client for this session
      const client = state.clients.find(c => c.id === session.clientId);

      if (!client) {
        console.log('No client found for session, skipping deletion webhook');
        return;
      }

      // Prepare session data for Make.com deletion webhook
      const webhookData = {
        sessionId: session.id,
        eventId: session.eventId || null, // Include even if null for debugging
        clientId: session.clientId,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientEmail: client.email,
        dogName: session.dogName || client.dogName,
        sessionType: session.sessionType,
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime,
        notes: session.notes,
        quote: session.quote
      };

      console.log('Triggering Make.com deletion webhook for session:', webhookData);

      // Call the Make.com deletion webhook
      const response = await fetch('https://hook.eu1.make.com/5o6hoq9apeqrbaoqgo65nrmdic64bvds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        console.log('Successfully triggered session deletion webhook');
        const responseText = await response.text();
        console.log('Webhook response:', responseText);
      } else {
        console.error('Failed to trigger session deletion webhook:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }

    } catch (error) {
      console.error('Error triggering session deletion webhook:', error);
      // Don't throw error - webhook failure shouldn't prevent session deletion
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
        console.log('Triggering deletion webhook for session:', sessionFromDb.id);
        // Trigger deletion webhook before deleting from database
        await triggerSessionDeletionWebhook(sessionFromDb);
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
      await loadActionPoints();

      // Update membership statuses after loading all data
      console.log('🔄 Checking membership statuses...');
      await updateMembershipStatuses();
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
      loadActionPoints,
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
      triggerSessionUpdateWebhook,
      triggerSessionDeletionWebhook,
      findClientByEmail,
      getMembershipsByClientId,
      getMembershipsByEmail,
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
