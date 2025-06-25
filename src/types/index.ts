export interface Session {
  id: string;
  clientId: string;
  dogName?: string; // Which dog the session is for (if client has multiple dogs)
  sessionType: 'In-Person' | 'Online' | 'Training' | 'Online Catchup' | 'Group' | 'RMR Live' | 'Phone Call' | 'Coaching';
  bookingDate: string; // Date in YYYY-MM-DD format
  bookingTime: string; // Time in HH:mm format
  notes?: string;
  quote: number;
  email?: string; // For linking during import
  sessionPlanId?: string; // Link to session plan
  sessionPaid?: boolean; // Payment status
  paymentConfirmedAt?: string; // When payment was confirmed
  sessionPlanSent?: boolean; // Whether session plan has been sent
  questionnaireBypass?: boolean; // Whether questionnaire requirement is bypassed
  eventId?: string; // Google Calendar Event ID for deletion
  googleMeetLink?: string; // Google Meet link from Make.com
}

export interface ActionPoint {
  id: string;
  header: string;
  details: string;
}

export interface SessionPlan {
  id: string;
  sessionId: string;
  sessionNumber: number; // Auto-calculated based on client's session count
  mainGoal1?: string;
  mainGoal2?: string;
  mainGoal3?: string;
  mainGoal4?: string;
  explanationOfBehaviour?: string;
  actionPoints: string[]; // Array of ActionPoint IDs
  documentEditUrl?: string; // Google Doc edit URL from Make.com
  createdAt: Date;
  updatedAt: Date;
}

export interface BehaviouralBrief {
  id: string;
  clientId: string;
  client_id?: string; // New foreign key field added by SQL scripts
  // Contact Information
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  contactNumber: string;
  postcode: string;
  // Dog Information
  dogName: string;
  sex: 'Male' | 'Female';
  breed: string;
  lifeWithDog: string;
  bestOutcome: string;
  sessionType: 'Online Session' | 'In-Person Session' | 'Rescue Remedy Session (Dog Club members & current clients only)';
  submittedAt: Date;
}

export interface BehaviourQuestionnaire {
  id: string;
  clientId: string;
  client_id?: string; // New foreign key field added by SQL scripts
  // Owner Information
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  contactNumber: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  howDidYouHear: string;
  // Dog Information
  dogName: string;
  age: string;
  sex: 'Male' | 'Female';
  breed: string;
  neuteredSpayed: string;
  mainHelp: string;
  firstNoticed: string;
  whenWhereHow: string;
  recentChange: string;
  canAnticipate: string;
  whyThinking: string;
  whatDoneSoFar: string;
  idealGoal: string;
  anythingElse: string;
  // Health and Veterinary
  medicalHistory: string;
  vetAdvice: string;
  // Background
  whereGotDog: string;
  rescueBackground: string;
  ageWhenGot: string;
  // Diet and Feeding
  whatFeed: string;
  foodMotivated: number;
  mealtime: string;
  treatRoutine: string;
  happyWithTreats: string;
  // Routines
  typesOfPlay: string;
  affectionate: string;
  exercise: string;
  useMuzzle: string;
  familiarPeople: string;
  unfamiliarPeople: string;
  housetrained: string;
  likesToDo: string;
  // Temperament
  likeAboutDog: string;
  mostChallenging: string;
  // Training
  howGood: string;
  favouriteRewards: string;
  howBad: string;
  effectOfBad: string;
  professionalTraining: string;
  // Sociability
  sociabilityDogs: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested';
  sociabilityPeople: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested';
  anythingElseToKnow: string;
  timePerWeek: string;
  submittedAt: Date;
}

export interface Membership {
  id: string;
  email: string;
  date: string; // Date in YYYY-MM-DD format
  amount: number;
}

export interface BookingTerms {
  id: string;
  email: string;
  submitted: string;
  created_at?: string;
}

export interface ClientEmailAlias {
  id: string;
  clientId: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface PotentialDuplicate {
  id: string;
  primaryClient: Client;
  duplicateClient: Client;
  matchReasons: string[];
  confidence: 'high' | 'medium' | 'low';
  dogName: string;
  suggestedAction: 'merge' | 'review';
  createdAt: string;
}

export interface DismissedDuplicate {
  id: string;
  duplicateId: string;
  dismissedAt: string;
  createdAt?: string;
}

export interface GroupCoachingReset {
  id: string;
  clientId: string;
  resetDate: string; // YYYY-MM-DD format
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dogName?: string; // Made optional - some clients might not have a dog yet
  otherDogs?: string[];
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  membership: boolean;
  avatar?: string;
  behaviouralBriefId?: string;
  behaviourQuestionnaireId?: string;
  booking_terms_signed?: boolean;
  booking_terms_signed_date?: string;
}

export interface MonthlyFinance {
  month: string;
  year: number;
  expected: number;
  actual: number;
  variance: number;
}

export interface AppState {
  sessions: Session[];
  clients: Client[];
  finances: MonthlyFinance[];
  behaviouralBriefs: BehaviouralBrief[];
  behaviourQuestionnaires: BehaviourQuestionnaire[];
  sessionPlans: SessionPlan[];
  actionPoints: ActionPoint[];
  memberships: Membership[];
  bookingTerms: BookingTerms[];
  clientEmailAliases: { [clientId: string]: ClientEmailAlias[] };
  potentialDuplicates: PotentialDuplicate[];
  selectedSession: Session | null;
  selectedClient: Client | null;
  selectedBehaviouralBrief: BehaviouralBrief | null;
  selectedBehaviourQuestionnaire: BehaviourQuestionnaire | null;
  selectedSessionPlan: SessionPlan | null;
  isModalOpen: boolean;
  modalType: 'session' | 'client' | 'behaviouralBrief' | 'behaviourQuestionnaire' | 'sessionPlan' | null;
}

export type AppAction =
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_BEHAVIOURAL_BRIEFS'; payload: BehaviouralBrief[] }
  | { type: 'ADD_BEHAVIOURAL_BRIEF'; payload: BehaviouralBrief }
  | { type: 'UPDATE_BEHAVIOURAL_BRIEF'; payload: BehaviouralBrief }
  | { type: 'DELETE_BEHAVIOURAL_BRIEF'; payload: string }
  | { type: 'SET_BEHAVIOUR_QUESTIONNAIRES'; payload: BehaviourQuestionnaire[] }
  | { type: 'SET_MEMBERSHIPS'; payload: Membership[] }
  | { type: 'ADD_MEMBERSHIP'; payload: Membership }
  | { type: 'UPDATE_MEMBERSHIP'; payload: Membership }
  | { type: 'DELETE_MEMBERSHIP'; payload: string }
  | { type: 'SET_BOOKING_TERMS'; payload: BookingTerms[] }
  | { type: 'ADD_BOOKING_TERMS'; payload: BookingTerms }
  | { type: 'SET_CLIENT_EMAIL_ALIASES'; payload: { [clientId: string]: ClientEmailAlias[] } }
  | { type: 'SET_ACTION_POINTS'; payload: ActionPoint[] }
  | { type: 'ADD_ACTION_POINT'; payload: ActionPoint }
  | { type: 'UPDATE_ACTION_POINT'; payload: ActionPoint }
  | { type: 'DELETE_ACTION_POINT'; payload: string }
  | { type: 'SET_POTENTIAL_DUPLICATES'; payload: PotentialDuplicate[] }
  | { type: 'REMOVE_POTENTIAL_DUPLICATE'; payload: string }
  | { type: 'SET_SESSION_PLANS'; payload: SessionPlan[] }
  | { type: 'ADD_SESSION_PLAN'; payload: SessionPlan }
  | { type: 'UPDATE_SESSION_PLAN'; payload: SessionPlan }
  | { type: 'DELETE_SESSION_PLAN'; payload: string }
  | { type: 'ADD_BEHAVIOUR_QUESTIONNAIRE'; payload: BehaviourQuestionnaire }
  | { type: 'UPDATE_BEHAVIOUR_QUESTIONNAIRE'; payload: BehaviourQuestionnaire }
  | { type: 'DELETE_BEHAVIOUR_QUESTIONNAIRE'; payload: string }
  | { type: 'SET_SELECTED_SESSION'; payload: Session | null }
  | { type: 'SET_SELECTED_CLIENT'; payload: Client | null }
  | { type: 'SET_SELECTED_BEHAVIOURAL_BRIEF'; payload: BehaviouralBrief | null }
  | { type: 'SET_SELECTED_BEHAVIOUR_QUESTIONNAIRE'; payload: BehaviourQuestionnaire | null }
  | { type: 'SET_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_MODAL_TYPE'; payload: 'session' | 'client' | 'behaviouralBrief' | 'behaviourQuestionnaire' | null };
