'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Session, Client, Membership } from '@/types';
import { clientService } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import { membershipService } from '@/services/membershipService';
import { behaviourQuestionnaireService } from '@/services/behaviourQuestionnaireService';

const initialState: AppState = {
  sessions: [],
  clients: [],
  finances: [],
  behaviouralBriefs: [],
  behaviourQuestionnaires: [],
  sessionPlans: [],
  actionPoints: [],
  memberships: [],
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
  createClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  createSession: (session: Omit<Session, 'id'>) => Promise<Session>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
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

      // Check if client has already signed booking terms
      const hasSignedBookingTerms = client.booking_terms_signed || false;

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
        clientEmail: client.email,
        dogName: client.dogName || '',
        sessionType: session.sessionType,
        bookingDate: session.bookingDate, // YYYY-MM-DD format
        bookingTime: session.bookingTime, // HH:mm format
        quote: session.quote,
        notes: session.notes || '',
        createdAt: new Date().toISOString(),
        // Form completion status
        hasSignedBookingTerms,
        hasFilledQuestionnaire,
        // Form URLs with email prefilled
        bookingTermsUrl: `${window.location.origin}/booking-terms?email=${encodeURIComponent(client.email)}`,
        questionnaireUrl: `${window.location.origin}/behaviour-questionnaire?email=${encodeURIComponent(client.email)}`
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

      // Trigger Make.com webhook after successful creation
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

  // Delete session from Supabase
  const deleteSession = async (id: string): Promise<void> => {
    try {
      await sessionService.delete(id);
      dispatch({ type: 'DELETE_SESSION', payload: id });
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
    loadClients();
    loadSessions();
    loadMemberships();
    loadBehaviourQuestionnaires();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      loadClients,
      loadSessions,
      loadMemberships,
      loadBehaviourQuestionnaires,
      createClient,
      updateClient,
      deleteClient,
      createSession,
      updateSession,
      deleteSession,
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
