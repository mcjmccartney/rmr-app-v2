import { useMemo } from 'react';
import { Session, Client, BehaviourQuestionnaire, BookingTerms, SessionPlan, ClientEmailAlias } from '@/types';

interface SessionColorData {
  sessions: Session[];
  clients: Client[];
  behaviourQuestionnaires: BehaviourQuestionnaire[];
  bookingTerms: BookingTerms[];
  sessionPlans: SessionPlan[];
  clientEmailAliases: { [clientId: string]: ClientEmailAlias[] };
}

interface SessionColorResult {
  backgroundColor: string;
  className: string;
  mobileClassName: string;
  isAllComplete: boolean;
  isPaid: boolean;
  hasSignedTerms: boolean;
  hasQuestionnaire: boolean;
}

// Helper function to get client emails including aliases
const getClientEmails = (client: Client | undefined, aliases: { [clientId: string]: ClientEmailAlias[] }): string[] => {
  if (!client?.email) return [];

  const emails = [client.email.toLowerCase()];
  const clientAliases = aliases[client.id] || [];
  const aliasEmails = clientAliases.map(alias => alias.email.toLowerCase());
  return [...emails, ...aliasEmails];
};

// Helper function to check if client has questionnaire for specific dog
const hasQuestionnaireForDog = (
  client: Client | undefined, 
  session: Session, 
  questionnaires: BehaviourQuestionnaire[]
): boolean => {
  if (!client) return false;
  
  const clientEmails = [client.email?.toLowerCase()].filter(Boolean);
  const dogName = session.dogName || client.dogName;
  
  return questionnaires.some(q => 
    clientEmails.includes(q.email?.toLowerCase() || '') && 
    q.dogName?.toLowerCase() === dogName?.toLowerCase()
  );
};

// Helper function to check if session plan has content
const sessionPlanHasContent = (sessionPlan: SessionPlan): boolean => {
  if (!sessionPlan) return false;

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

export const useSessionColors = (data: SessionColorData) => {
  return useMemo(() => {
    const colorMap = new Map<string, SessionColorResult>();
    
    data.sessions.forEach(session => {
      const client = data.clients.find(c => c.id === session.clientId);
      const clientEmails = getClientEmails(client, data.clientEmailAliases);
      
      // Check session status
      const hasSignedBookingTerms = clientEmails.length > 0 ?
        data.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || '')) : false;
      const hasFilledQuestionnaire = hasQuestionnaireForDog(client, session, data.behaviourQuestionnaires);
      const isPaid = !!session.sessionPaid;
      const isSessionPlanSent = !!session.sessionPlanSent;

      const isFullyCompleted = hasSignedBookingTerms && (hasFilledQuestionnaire || !!session.questionnaireBypass);
      const isAllComplete = isPaid && hasSignedBookingTerms && isSessionPlanSent;
      
      let backgroundColor: string;
      let className: string;
      let mobileClassName: string;

      if (!client) {
        // No client = amber-800 background
        backgroundColor = '#973b00';
        className = "w-full bg-amber-800 text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:bg-amber-700 cursor-pointer";
        mobileClassName = "w-full bg-amber-800 text-white p-4 rounded-lg text-left hover:bg-amber-700 transition-colors cursor-pointer";
      } else if (isAllComplete) {
        // All complete (Paid + Terms + Session Plan Sent) = dark charcoal grey background (highest priority)
        backgroundColor = '#36454F';
        className = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80 cursor-pointer";
        mobileClassName = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80 cursor-pointer";
      } else if (isFullyCompleted && isPaid) {
        // Fully completed AND paid = green background
        backgroundColor = '#4f6749';
        className = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80 cursor-pointer";
        mobileClassName = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80 cursor-pointer";
      } else if (isFullyCompleted) {
        // Terms + Questionnaire (but not paid) = amber background
        backgroundColor = '#e17100';
        className = "w-full text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:opacity-80 cursor-pointer";
        mobileClassName = "w-full text-white p-4 rounded-lg text-left transition-colors hover:opacity-80 cursor-pointer";
      } else {
        // Default = amber-800 background
        backgroundColor = '#973b00';
        className = "w-full bg-amber-800 text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:bg-amber-700 cursor-pointer";
        mobileClassName = "w-full bg-amber-800 text-white p-4 rounded-lg text-left hover:bg-amber-700 transition-colors cursor-pointer";
      }
      
      colorMap.set(session.id, {
        backgroundColor,
        className,
        mobileClassName,
        isAllComplete,
        isPaid,
        hasSignedTerms: hasSignedBookingTerms,
        hasQuestionnaire: hasFilledQuestionnaire || !!session.questionnaireBypass
      });
    });
    
    return colorMap;
  }, [
    data.sessions,
    data.clients,
    data.behaviourQuestionnaires,
    data.bookingTerms,
    data.clientEmailAliases
  ]);
};

// Helper function to get session color from the memoized map
export const getSessionColor = (sessionId: string, colorMap: Map<string, SessionColorResult>): SessionColorResult => {
  return colorMap.get(sessionId) || {
    backgroundColor: '#973b00',
    className: "w-full bg-amber-800 text-white text-xs px-2 py-1 rounded text-left transition-colors flex-shrink-0 hover:bg-amber-700 cursor-pointer",
    mobileClassName: "w-full bg-amber-800 text-white p-4 rounded-lg text-left hover:bg-amber-700 transition-colors cursor-pointer",
    isAllComplete: false,
    isPaid: false,
    hasSignedTerms: false,
    hasQuestionnaire: false
  };
};
