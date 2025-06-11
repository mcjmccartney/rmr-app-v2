'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Session, Client } from '@/types';
import { clientService } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';

const initialState: AppState = {
  sessions: [],
  clients: [],
  finances: [],
  behaviouralBriefs: [],
  behaviourQuestionnaires: [],
  sessionPlans: [],
  actionPoints: [],
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
  createClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  createSession: (session: Omit<Session, 'id'>) => Promise<Session>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  findClientByEmail: (email: string) => Promise<Client | null>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      const clients = await clientService.getAll();
      dispatch({ type: 'SET_CLIENTS', payload: clients });
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  // Load sessions from Supabase
  const loadSessions = async () => {
    try {
      const sessions = await sessionService.getAll();
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
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

  // Create session in Supabase
  const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    try {
      const session = await sessionService.create(sessionData);
      dispatch({ type: 'ADD_SESSION', payload: session });
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

  // Load initial data on mount
  useEffect(() => {
    loadClients();
    loadSessions();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      loadClients,
      loadSessions,
      createClient,
      updateClient,
      deleteClient,
      createSession,
      updateSession,
      deleteSession,
      findClientByEmail,
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
