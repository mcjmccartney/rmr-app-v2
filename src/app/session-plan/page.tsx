'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { predefinedActionPoints, personalizeActionPoint } from '@/data/actionPoints';
import { sessionPlanService } from '@/services/sessionPlanService';
import { clientService } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import { useRobustAutoSave } from '@/hooks/useRobustAutoSave';
import type { SessionPlan, Client, Session } from '@/types';
// import SessionPlanPreviewModal from '@/components/modals/SessionPlanPreviewModal';

function SessionPlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useApp();

  const sessionId = searchParams.get('sessionId');
  const session = sessionId ? state.sessions.find(s => s.id === sessionId) : null;
  const client = session ? state.clients.find(c => c.id === session.clientId) : null;



  // Use action points from state (loaded from Supabase) or fallback to predefined ones
  const actionPoints = state.actionPoints.length > 0 ? state.actionPoints : predefinedActionPoints;



  const [formData, setFormData] = useState({
    mainGoal1: '',
    mainGoal2: '',
    mainGoal3: '',
    mainGoal4: '',
    explanationOfBehaviour: '',
  });

  // Legacy state (will be replaced by robust auto-save)
  const [legacyLastSaved, setLegacyLastSaved] = useState<Date | null>(null);
  const [legacyIsSaving, setLegacyIsSaving] = useState(false);
  const [legacyHasUnsavedChanges, setLegacyHasUnsavedChanges] = useState(false);

  const [selectedActionPoints, setSelectedActionPoints] = useState<string[]>([]);
  const [showActionPoints, setShowActionPoints] = useState(false);
  const [editableActionPoints, setEditableActionPoints] = useState<{[key: string]: {header: string, details: string}}>({});
  const [actionPointSearch, setActionPointSearch] = useState('');
  const [existingSessionPlan, setExistingSessionPlan] = useState<SessionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [fallbackClient, setFallbackClient] = useState<Client | null>(null);
  const [fallbackSession, setFallbackSession] = useState<Session | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);
  const [isPollingForUrl, setIsPollingForUrl] = useState(false);
  // const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Use fallback data if state data is not available (moved up for scope)
  const currentSession = session || fallbackSession;
  const currentClient = client || fallbackClient;



  // Create the save function for robust auto-save
  const saveFunction = useCallback(async (isAutoSave = false) => {
    if (!currentSession || !currentClient) {
      throw new Error('Session or client not available');
    }

    const sessionPlanData = {
      sessionId: currentSession.id,
      mainGoal1: formData.mainGoal1,
      mainGoal2: formData.mainGoal2,
      mainGoal3: formData.mainGoal3,
      mainGoal4: formData.mainGoal4,
      explanationOfBehaviour: formData.explanationOfBehaviour,
      actionPoints: selectedActionPoints,
      editedActionPoints: editableActionPoints,
      sessionNumber: sessionNumber
    };

    let savedPlan;
    if (existingSessionPlan) {
      savedPlan = await sessionPlanService.update(existingSessionPlan.id, sessionPlanData);
    } else {
      savedPlan = await sessionPlanService.create(sessionPlanData);
      setExistingSessionPlan(savedPlan);
    }

    return savedPlan;
  }, [currentSession, currentClient, formData, selectedActionPoints, editableActionPoints, sessionNumber, existingSessionPlan]);

  // Initialize robust auto-save
  const { autoSaveState, changeState, trackChange, forceSave, clearUnsavedChanges } = useRobustAutoSave({
    saveFunction,
    onSaveSuccess: () => {
      setLegacyLastSaved(new Date());
      setLegacyHasUnsavedChanges(false);
    },
    onSaveError: () => {
      // Silent error handling
    },
    enablePeriodicSave: true,
    enableCriticalSave: true,
  });

  // Sync legacy state with robust auto-save state
  const isSaving = autoSaveState.isSaving || legacyIsSaving;
  const hasUnsavedChanges = autoSaveState.hasUnsavedChanges || legacyHasUnsavedChanges;
  const lastSaved = autoSaveState.lastSaved || legacyLastSaved;

  // Load existing session plan and calculate session number
  useEffect(() => {
    const loadExistingSessionPlan = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        if (!session || !client) {
          if (!session) {
            const dbSession = await sessionService.getById(sessionId);
            if (dbSession) {
              setFallbackSession(dbSession);

              if (dbSession.clientId) {
                const dbClient = await clientService.getById(dbSession.clientId);
                if (dbClient) {
                  setFallbackClient(dbClient);
                }
              }
            }
          }
        }

        // Calculate session number for this session
        const calculatedSessionNumber = await sessionPlanService.calculateSessionNumber(sessionId);
        setSessionNumber(calculatedSessionNumber);

        const existingPlan = await sessionPlanService.getBySessionId(sessionId);

        if (existingPlan) {

          setExistingSessionPlan(existingPlan);
          setFormData({
            mainGoal1: replaceDogNames(existingPlan.mainGoal1 || ''),
            mainGoal2: replaceDogNames(existingPlan.mainGoal2 || ''),
            mainGoal3: replaceDogNames(existingPlan.mainGoal3 || ''),
            mainGoal4: replaceDogNames(existingPlan.mainGoal4 || ''),
            explanationOfBehaviour: replaceDogNames(existingPlan.explanationOfBehaviour || ''),
          });
          setSelectedActionPoints(existingPlan.actionPoints || []);
          // Use existing session number if plan already exists
          setSessionNumber(existingPlan.sessionNumber);

          if (existingPlan.editedActionPoints) {
            setEditableActionPoints(existingPlan.editedActionPoints);
          }

          // Check if document URL exists
          if (existingPlan.documentEditUrl) {
            setGeneratedDocUrl(existingPlan.documentEditUrl);
          }

          // Set last saved time and mark as no unsaved changes
          setLegacyLastSaved(existingPlan.updatedAt);
          setLegacyHasUnsavedChanges(false);
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingSessionPlan();
  }, [sessionId]); // Only depend on sessionId to prevent unnecessary re-runs

  // Initialize robust auto-save when data is loaded
  useEffect(() => {
    if (existingSessionPlan && !autoSaveState.hasUnsavedChanges) {
      // Clear unsaved changes when session plan is loaded
      clearUnsavedChanges();
    }
  }, [existingSessionPlan, clearUnsavedChanges, autoSaveState.hasUnsavedChanges]);

  const handleBack = async () => {
    if (hasUnsavedChanges || autoSaveState.hasUnsavedChanges ||
        formData.mainGoal1 || formData.mainGoal2 || formData.mainGoal3 ||
        formData.mainGoal4 || formData.explanationOfBehaviour ||
        selectedActionPoints.length > 0 || Object.keys(editableActionPoints).length > 0) {
      try {
        await forceSave();
      } catch (error) {
        // Continue with navigation even if save fails
      }
    }

    const from = searchParams.get('from');
    const clientId = searchParams.get('clientId');

    // Navigate based on where user came from
    if (from === 'clients' && clientId) {
      router.push(`/clients?openClient=${clientId}`);
    } else if (from === 'calendar') {
      router.push('/calendar');
    } else {
      // Fallback: if no 'from' parameter, try to determine best navigation
      // If we have a client, go to clients page with that client open
      if (currentClient) {
        router.push(`/clients?openClient=${currentClient.id}`);
      } else {
        // Default fallback to calendar
        router.push('/calendar');
      }
    }
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLegacyHasUnsavedChanges(true);

    // Track change with robust auto-save
    const isCritical = field === 'explanationOfBehaviour'; // Mark explanation as critical
    trackChange('hasTextChanges', isCritical);
  }, [trackChange]);

  // Poll for document URL from the API endpoint
  const pollForDocumentUrl = async (sessionId: string, maxAttempts = 30) => {
    setIsPollingForUrl(true);
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/session-plan/document-url?sessionId=${sessionId}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.documentUrl) {
            if (data.documentUrl !== generatedDocUrl) {
              setGeneratedDocUrl(data.documentUrl);
              setIsPollingForUrl(false);
              window.open(data.documentUrl, '_blank');
              return;
            }
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsPollingForUrl(false);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsPollingForUrl(false);
        }
      }
    };

    setTimeout(poll, 3000);
  };

  // (currentSession and currentClient moved up for scope)

  const getSessionDogName = (): string => {
    return currentSession?.dogName || currentClient?.dogName || 'Unknown Dog';
  };

  // Save function that navigates away (for the main Save button)
  const handleSave = async () => {
    if (!currentSession || !currentClient) {
      return;
    }

    try {
      await saveFunction(false);
    } catch (error) {
      // Continue with navigation even if save fails
    }

    // Navigate directly without additional save attempts
    const from = searchParams.get('from');
    const clientId = searchParams.get('clientId');

    // Navigate based on where user came from
    if (from === 'clients' && clientId) {
      router.push(`/clients?openClient=${clientId}`);
    } else if (from === 'calendar') {
      router.push('/calendar');
    } else {
      // Fallback: if no 'from' parameter, try to determine best navigation
      // If we have a client, go to clients page with that client open
      if (currentClient) {
        router.push(`/clients?openClient=${currentClient.id}`);
      } else {
        // Default fallback to calendar
        router.push('/calendar');
      }
    }
  };

  // Legacy save function for manual saves and backward compatibility
  const saveSessionPlan = async (isAutoSave = false) => {
    if (isAutoSave) {
      // For auto-save, use the robust auto-save system
      return await forceSave();
    } else {
      // For manual saves, use the robust save function directly
      return await saveFunction(false);
    }
  };

  // Replace dog names in text content (for stored session plan content)
  const replaceDogNames = (text: string): string => {
    if (!text) return '';

    const currentDogName = getSessionDogName();
    let result = text;

    // Replace the client's primary dog name with the session dog name
    if (currentClient?.dogName && currentClient.dogName !== currentDogName) {
      const regex = new RegExp(`\\b${currentClient.dogName}\\b`, 'gi');
      result = result.replace(regex, currentDogName);
    }

    // Also replace any other dogs from the client's other_dogs array
    if (currentClient?.otherDogs && Array.isArray(currentClient.otherDogs)) {
      currentClient.otherDogs.forEach(otherDog => {
        if (otherDog !== currentDogName) {
          const regex = new RegExp(`\\b${otherDog}\\b`, 'gi');
          result = result.replace(regex, currentDogName);
        }
      });
    }

    return result;
  };

  // Get dog's gender from questionnaire for proper pronoun replacement
  const getDogGender = (): 'Male' | 'Female' => {
    const sessionDogName = getSessionDogName();
    if (!currentClient || !sessionDogName) return 'Male';

    // Comprehensive questionnaire matching function
    const findQuestionnaireForClient = (client: any, dogName: string, questionnaires: any[]) => {
      if (!client || !dogName) return null;

      // Method 1: Match by client_id and dog name (case-insensitive)
      let questionnaire = questionnaires.find(q =>
        (q.client_id === client.id || q.clientId === client.id) &&
        q.dogName?.toLowerCase() === dogName.toLowerCase()
      );
      if (questionnaire) return questionnaire;

      // Method 2: Match by email and dog name (case-insensitive)
      if (client.email) {
        questionnaire = questionnaires.find(q =>
          q.email?.toLowerCase() === client.email?.toLowerCase() &&
          q.dogName?.toLowerCase() === dogName.toLowerCase()
        );
        if (questionnaire) return questionnaire;
      }

      // Method 3: Match by client_id and dog name (exact case)
      questionnaire = questionnaires.find(q =>
        (q.client_id === client.id || q.clientId === client.id) &&
        q.dogName === dogName
      );
      if (questionnaire) return questionnaire;

      // Method 4: Match by email and dog name (exact case)
      if (client.email) {
        questionnaire = questionnaires.find(q =>
          q.email === client.email &&
          q.dogName === dogName
        );
        if (questionnaire) return questionnaire;
      }

      // Method 5: Match by partial dog name (case-insensitive)
      questionnaire = questionnaires.find(q =>
        (q.client_id === client.id || q.clientId === client.id) &&
        (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
         dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
      );
      if (questionnaire) return questionnaire;

      // Method 6: Match by email and partial dog name (case-insensitive)
      if (client.email) {
        questionnaire = questionnaires.find(q =>
          q.email?.toLowerCase() === client.email?.toLowerCase() &&
          (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
           dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
        );
      }

      return questionnaire || null;
    };

    const questionnaire = findQuestionnaireForClient(currentClient, sessionDogName, state.behaviourQuestionnaires);
    return questionnaire?.sex || 'Male';
  };

  const handleActionPointToggle = useCallback((actionPointId: string) => {
    setSelectedActionPoints(prev => {
      const newSelected = prev.includes(actionPointId)
        ? prev.filter(id => id !== actionPointId)
        : [...prev, actionPointId];

      // If removing an action point, also remove its editable version
      if (prev.includes(actionPointId)) {
        setEditableActionPoints(prevEditable => {
          const newEditable = { ...prevEditable };
          delete newEditable[actionPointId];
          return newEditable;
        });
      }

      return newSelected;
    });
    setLegacyHasUnsavedChanges(true);

    // Track action point selection change
    trackChange('hasActionPointChanges', false);
  }, [trackChange]);

  // Initialize editable action point with personalized content
  const initializeEditableActionPoint = (actionPointId: string) => {
    const actionPoint = actionPoints.find(ap => ap.id === actionPointId);
    if (!actionPoint) return;

    const personalizedActionPoint = personalizeActionPoint(
      actionPoint,
      getSessionDogName(),
      getDogGender()
    );

    setEditableActionPoints(prev => ({
      ...prev,
      [actionPointId]: {
        header: personalizedActionPoint.header,
        details: personalizedActionPoint.details
      }
    }));
  };

  // Update editable action point
  const updateEditableActionPoint = useCallback((actionPointId: string, field: 'header' | 'details', value: string) => {
    setEditableActionPoints(prev => ({
      ...prev,
      [actionPointId]: {
        ...prev[actionPointId],
        [field]: value
      }
    }));
    setLegacyHasUnsavedChanges(true);

    // Track action point change with robust auto-save
    trackChange('hasActionPointChanges', false);
  }, [trackChange]);

  // Move action point up or down
  const moveActionPoint = useCallback((actionPointId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedActionPoints.indexOf(actionPointId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= selectedActionPoints.length) return;

    const newSelectedActionPoints = [...selectedActionPoints];
    [newSelectedActionPoints[currentIndex], newSelectedActionPoints[newIndex]] =
    [newSelectedActionPoints[newIndex], newSelectedActionPoints[currentIndex]];

    setSelectedActionPoints(newSelectedActionPoints);
    setLegacyHasUnsavedChanges(true);

    // Track action point reordering
    trackChange('hasActionPointChanges', false);
  }, [selectedActionPoints, trackChange]);

  const handlePreviewAndEdit = async () => {
    if (!currentSession || !currentClient) return;

    setIsGeneratingDoc(true);

    try {
      await saveSessionPlan();
    } catch (error) {
      // Continue with document generation even if save fails
    }

    await generateDocument();
  };

  const handleReGenerate = async () => {
    if (!currentSession || !currentClient) return;

    setIsGeneratingDoc(true);

    try {
      await saveSessionPlan();
      setGeneratedDocUrl(null);

      try {
        await fetch('/api/session-plan/document-url', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: currentSession.id })
        });
      } catch (error) {
        // Silent error handling
      }
    } catch (error) {
      // Continue with document generation even if save fails
    }

    await generateDocument();
  };

  const generateDocument = async () => {
    if (!currentSession || !currentClient) return;

    // Prepare the data for the webhook with current form state
    const sessionData = {
      // Session identification for callback
      sessionId: currentSession.id,

      // Document title
      title: `Session ${sessionNumber} - ${getSessionDogName()}`,

      // Basic session info
      sessionNumber: sessionNumber.toString(),
      dogName: getSessionDogName(),
      clientName: `${currentClient.firstName} ${currentClient.lastName}`.trim(),
      sessionType: currentSession.sessionType,
      sessionDate: new Date(currentSession.bookingDate).toLocaleDateString('en-GB'),
      sessionTime: currentSession.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)

      // Main goals (current form state) - Add bullet points before each goal
      mainGoal1: formData.mainGoal1 ? `• ${formData.mainGoal1}` : '',
      mainGoal2: formData.mainGoal2 ? `• ${formData.mainGoal2}` : '',
      mainGoal3: formData.mainGoal3 ? `• ${formData.mainGoal3}` : '',
      mainGoal4: formData.mainGoal4 ? `• ${formData.mainGoal4}` : '',

      // Explanation (current form state)
      explanationOfBehaviour: formData.explanationOfBehaviour || '',

      // Action points (current selection - use edited versions if available, otherwise personalized)
      actionPoints: selectedActionPoints.map((actionPointId) => {
        // Check if we have an edited version
        if (editableActionPoints[actionPointId]) {
          return {
            header: editableActionPoints[actionPointId].header,
            details: editableActionPoints[actionPointId].details
          };
        }

        // Otherwise use personalized version with correct gender
        const actionPoint = actionPoints.find(ap => ap.id === actionPointId);
        if (!actionPoint) return null;

        const personalizedActionPoint = personalizeActionPoint(
          actionPoint,
          getSessionDogName(),
          getDogGender()
        );

        return {
          header: personalizedActionPoint.header,
          details: personalizedActionPoint.details
        };
      }).filter(Boolean),

      // Callback URL for Make.com to send the document URL back
      callbackUrl: `${window.location.origin}/api/session-plan/document-url`,

      // Add timestamp and unique request ID to ensure fresh generation
      timestamp: new Date().toISOString(),
      requestId: `${currentSession.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    try {

      // Validate essential data before sending webhook
      const hasEssentialData = sessionData.sessionId &&
                               sessionData.clientName &&
                               sessionData.dogName &&
                               sessionData.sessionNumber;

      // Additional validation to prevent empty/invalid payloads
      const hasValidData = sessionData.sessionId?.trim() &&
                          sessionData.clientName?.trim() &&
                          sessionData.dogName?.trim() &&
                          sessionData.sessionNumber && sessionData.sessionNumber !== '0' &&
                          sessionData.actionPoints &&
                          sessionData.actionPoints.length > 0;

      if (!hasEssentialData || !hasValidData) {
        const missingFields = [];
        if (!sessionData.sessionId?.trim()) missingFields.push('Session ID');
        if (!sessionData.clientName?.trim()) missingFields.push('Client Name');
        if (!sessionData.dogName?.trim()) missingFields.push('Dog Name');
        if (!sessionData.sessionNumber || sessionData.sessionNumber === '0') missingFields.push('Session Number');
        if (!sessionData.actionPoints || sessionData.actionPoints.length === 0) missingFields.push('Action Points');

        alert(`Cannot generate document. Missing or invalid data for: ${missingFields.join(', ')}`);
        setIsGeneratingDoc(false);
        return;
      }



      // Send data to Make.com webhook to generate the document
      const response = await fetch('https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      const responseText = await response.text();

      if (response.ok) {
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (jsonError) {
          result = { success: true, rawResponse: responseText };
        }

        if (result.documentUrl) {
          setGeneratedDocUrl(result.documentUrl);
          window.open(result.documentUrl, '_blank');
        } else {
          pollForDocumentUrl(currentSession?.id || '');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }
    } catch (error) {
      pollForDocumentUrl(currentSession?.id || '');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleEditGoogleDoc = () => {
    if (generatedDocUrl && generatedDocUrl !== 'pending') {
      // Open the specific document URL for editing
      window.open(generatedDocUrl, '_blank');
    } else {
      // If we don't have a specific URL, open Google Drive to find the document
      // The document should be named with the client and session info
      const searchQuery = `${currentClient?.firstName} ${currentClient?.lastName} Session ${sessionNumber}`;
      const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(searchQuery)}`;
      window.open(driveSearchUrl, '_blank');
    }
  };



  // Removed unused function handleSaveEditedContent

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading session...</h1>
        </div>
      </div>
    );
  }

  // Show error state if session not found after loading
  if (!sessionId || (!currentSession && !session) || (!currentClient && !client)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Session not found</h1>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {existingSessionPlan ? 'Edit Session Plan' : 'Create Session Plan'}
            </h1>
            {/* Silent auto-save - no visible status */}
            <div className="text-xs text-gray-500 mt-1">
              {existingSessionPlan ? 'Edit Session Plan' : 'Create Session Plan'}
            </div>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading session plan...</div>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {getSessionDogName()} - Session Plan
                </h2>
                <p className="text-gray-600">
                  {currentClient?.firstName} {currentClient?.lastName} • {currentSession?.sessionType}
                </p>
              </div>

              <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Goal 1
              </label>
              <textarea
                value={formData.mainGoal1}
                onChange={(e) => handleInputChange('mainGoal1', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Goal 2
              </label>
              <textarea
                value={formData.mainGoal2}
                onChange={(e) => handleInputChange('mainGoal2', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Goal 3
              </label>
              <textarea
                value={formData.mainGoal3}
                onChange={(e) => handleInputChange('mainGoal3', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Goal 4
              </label>
              <textarea
                value={formData.mainGoal4}
                onChange={(e) => handleInputChange('mainGoal4', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Explanation of Behaviour
                </label>
                <span className={`text-xs ${
                  formData.explanationOfBehaviour.length > 1600 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formData.explanationOfBehaviour.length}/1600
                </span>
              </div>
              <textarea
                value={formData.explanationOfBehaviour}
                onChange={(e) => {
                  if (e.target.value.length <= 1600) {
                    handleInputChange('explanationOfBehaviour', e.target.value);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={8}
                maxLength={1600}
                placeholder="Describe the behaviour patterns, triggers, and context..."
              />
            </div>

            {/* Action Points */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Action Points
                </label>
                <button
                  onClick={() => setShowActionPoints(!showActionPoints)}
                  className="bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm"
                >
                  {showActionPoints ? 'Edit Action Points' : 'Add Action Points'}
                </button>
              </div>

              {/* Selected Action Points - Editable */}
              {selectedActionPoints.length > 0 && !showActionPoints && (
                <div className="space-y-3 mb-4">
                  {selectedActionPoints.map((actionPointId, index) => {
                    // Check if we have an editable version, otherwise create one
                    if (!editableActionPoints[actionPointId]) {
                      initializeEditableActionPoint(actionPointId);
                    }

                    const editableContent = editableActionPoints[actionPointId];
                    if (!editableContent) return null;

                    return (
                      <div key={actionPointId} className="border border-gray-200 p-4 rounded-md">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            Action Point {index + 1}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {/* Move Up Button */}
                            <button
                              onClick={() => moveActionPoint(actionPointId, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${
                                index === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                              }`}
                              title="Move up"
                            >
                              <ChevronUp size={16} />
                            </button>

                            {/* Move Down Button */}
                            <button
                              onClick={() => moveActionPoint(actionPointId, 'down')}
                              disabled={index === selectedActionPoints.length - 1}
                              className={`p-1 rounded ${
                                index === selectedActionPoints.length - 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                              }`}
                              title="Move down"
                            >
                              <ChevronDown size={16} />
                            </button>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleActionPointToggle(actionPointId)}
                              className="text-red-600 hover:text-red-800 text-sm ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Editable Header */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Header
                          </label>
                          <input
                            type="text"
                            value={editableContent.header}
                            onChange={(e) => updateEditableActionPoint(actionPointId, 'header', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                            placeholder="Action point header"
                          />
                        </div>

                        {/* Editable Details */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Details
                          </label>
                          <textarea
                            value={editableContent.details}
                            onChange={(e) => updateEditableActionPoint(actionPointId, 'details', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                            placeholder="Action point details"
                            rows={6}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Point Selector */}
              {showActionPoints && (
                <div className="border border-gray-200 p-4 rounded-md max-h-96 overflow-y-auto mb-6">
                  <h4 className="font-medium mb-3 text-gray-900">Select Action Points:</h4>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search action points..."
                      value={actionPointSearch}
                      onChange={(e) => setActionPointSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    {actionPoints
                      .filter(actionPoint => {
                        if (!actionPointSearch) return true;
                        const searchLower = actionPointSearch.toLowerCase();
                        return actionPoint.header.toLowerCase().includes(searchLower) ||
                               actionPoint.details.toLowerCase().includes(searchLower);
                      })
                      .map(actionPoint => {
                      const isSelected = selectedActionPoints.includes(actionPoint.id);
                      const personalizedActionPoint = personalizeActionPoint(
                        actionPoint,
                        getSessionDogName(),
                        getDogGender()
                      );

                      return (
                        <div
                          key={actionPoint.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-amber-800 bg-amber-800/10'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => handleActionPointToggle(actionPoint.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{personalizedActionPoint.header}</h5>
                              <p className="text-sm text-gray-600 mt-1">{personalizedActionPoint.details}</p>
                            </div>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'border-amber-800 bg-amber-800' : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

                <div className="border-t border-gray-200 pt-6 space-y-3">
                  {/* Auto-save status */}
                  <div className="text-center text-sm text-gray-500">
                    {autoSaveState.isSaving ? (
                      <span className="text-blue-600">💾 Saving...</span>
                    ) : autoSaveState.lastSaved ? (
                      <span className="text-green-600">
                        ✅ Last saved: {new Date(autoSaveState.lastSaved).toLocaleString()}
                      </span>
                    ) : autoSaveState.hasUnsavedChanges ? (
                      <span className="text-amber-600">⚠️ Unsaved changes</span>
                    ) : (
                      <span className="text-gray-400">Ready to save</span>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isLoading || (!currentSession && !currentClient)}
                    className="w-full bg-amber-800 text-white py-3 rounded-md font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Loading...' : 'Save & Go Back'}
                  </button>

                  {!generatedDocUrl ? (
                    <button
                      onClick={handlePreviewAndEdit}
                      disabled={isGeneratingDoc || isPollingForUrl}
                      className="w-full bg-white text-amber-800 py-3 rounded-md font-medium border border-amber-800 hover:bg-amber-800/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingDoc
                        ? 'Generating Document...'
                        : isPollingForUrl
                        ? 'Waiting for Document...'
                        : 'Generate Google Doc'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleEditGoogleDoc}
                        className="w-full text-white py-3 rounded-md font-medium transition-colors"
                        style={{ backgroundColor: '#4f6749' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5037'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                      >
                        Edit Google Doc
                      </button>
                      <button
                        onClick={handleReGenerate}
                        disabled={isGeneratingDoc || isPollingForUrl}
                        className="w-full text-white py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#973b00' }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#7a2f00')}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#973b00')}
                      >
                        {isGeneratingDoc
                          ? 'Re-Generating Document...'
                          : isPollingForUrl
                          ? 'Waiting for Document...'
                          : 'Re-Generate Google Doc'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal - Replaced with Make webhook */}
      {/* <SessionPlanPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        sessionPlan={{
          dogName: client?.dogName || 'Unknown Dog',
          clientName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
          sessionType: session?.sessionType || '',
          sessionDate: session ? new Date(session.bookingDate).toLocaleDateString('en-GB') : '',
          sessionTime: session?.bookingTime || '',
          mainGoal1: formData.mainGoal1,
          mainGoal2: formData.mainGoal2,
          mainGoal3: formData.mainGoal3,
          mainGoal4: formData.mainGoal4,
          explanationOfBehaviour: formData.explanationOfBehaviour,
          selectedActionPoints: selectedActionPoints,
        }}
        onSave={handleSaveEditedContent}
      /> */}
    </div>
  );
}

export default function SessionPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <SessionPlanContent />
    </Suspense>
  );
}