'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { predefinedActionPoints, personalizeActionPoint } from '@/data/actionPoints';
import { sessionPlanService } from '@/services/sessionPlanService';
import { clientService } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import type { SessionPlan, Client, Session } from '@/types';
// import SessionPlanPreviewModal from '@/components/modals/SessionPlanPreviewModal';

export default function SessionPlanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useApp();

  const sessionId = searchParams.get('sessionId');
  const session = sessionId ? state.sessions.find(s => s.id === sessionId) : null;
  const client = session ? state.clients.find(c => c.id === session.clientId) : null;

  // Debug logging for Lisa Gebler issue
  useEffect(() => {
    if (sessionId && session) {
      console.log('Session Plan Debug:', {
        sessionId,
        session,
        sessionClientId: session.clientId,
        availableClients: state.clients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
        foundClient: client
      });
    }
  }, [sessionId, session, client, state.clients]);

  const [formData, setFormData] = useState({
    mainGoal1: '',
    mainGoal2: '',
    mainGoal3: '',
    mainGoal4: '',
    explanationOfBehaviour: '',
  });

  const [selectedActionPoints, setSelectedActionPoints] = useState<string[]>([]);
  const [showActionPoints, setShowActionPoints] = useState(false);
  const [existingSessionPlan, setExistingSessionPlan] = useState<SessionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [fallbackClient, setFallbackClient] = useState<Client | null>(null);
  const [fallbackSession, setFallbackSession] = useState<Session | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);
  const [isPollingForUrl, setIsPollingForUrl] = useState(false);
  // const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load existing session plan and calculate session number
  useEffect(() => {
    const loadExistingSessionPlan = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        // If session or client not found in state, try to fetch from database
        if (!session || !client) {
          console.log('Session or client not found in state, fetching from database...');

          // Fetch session from database
          if (!session) {
            const dbSession = await sessionService.getById(sessionId);
            if (dbSession) {
              setFallbackSession(dbSession);
              console.log('Fetched session from database:', dbSession);

              // Fetch client from database using the session's clientId
              if (dbSession.clientId) {
                const dbClient = await clientService.getById(dbSession.clientId);
                if (dbClient) {
                  setFallbackClient(dbClient);
                  console.log('Fetched client from database:', dbClient);
                }
              }
            }
          }
        }

        // Calculate session number for this session
        const calculatedSessionNumber = await sessionPlanService.calculateSessionNumber(sessionId);
        setSessionNumber(calculatedSessionNumber);

        // Load existing session plan if it exists
        console.log('Attempting to load session plan for sessionId:', sessionId);
        const existingPlan = await sessionPlanService.getBySessionId(sessionId);
        console.log('Loaded session plan:', existingPlan);

        if (existingPlan) {
          console.log('Setting form data from existing plan:', {
            mainGoal1: existingPlan.mainGoal1,
            mainGoal2: existingPlan.mainGoal2,
            mainGoal3: existingPlan.mainGoal3,
            mainGoal4: existingPlan.mainGoal4,
            explanationOfBehaviour: existingPlan.explanationOfBehaviour,
            actionPoints: existingPlan.actionPoints
          });

          setExistingSessionPlan(existingPlan);
          setFormData({
            mainGoal1: existingPlan.mainGoal1 || '',
            mainGoal2: existingPlan.mainGoal2 || '',
            mainGoal3: existingPlan.mainGoal3 || '',
            mainGoal4: existingPlan.mainGoal4 || '',
            explanationOfBehaviour: existingPlan.explanationOfBehaviour || '',
          });
          setSelectedActionPoints(existingPlan.actionPoints || []);
          // Use existing session number if plan already exists
          setSessionNumber(existingPlan.sessionNumber);

          // Check if document URL exists
          if (existingPlan.documentEditUrl) {
            setGeneratedDocUrl(existingPlan.documentEditUrl);
          }
        } else {
          console.log('No existing session plan found for sessionId:', sessionId);
        }
      } catch (error) {
        console.error('Error loading existing session plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingSessionPlan();
  }, [sessionId]); // Only depend on sessionId to prevent unnecessary re-runs

  const handleBack = () => {
    router.push('/calendar');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Poll for document URL from the API endpoint
  const pollForDocumentUrl = async (sessionId: string, maxAttempts = 30) => {
    setIsPollingForUrl(true);
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/session-plan/document-url?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.documentUrl) {
            console.log('Document URL received:', data.documentUrl);
            setGeneratedDocUrl(data.documentUrl);
            setIsPollingForUrl(false);

            // Auto-redirect to the document
            window.open(data.documentUrl, '_blank');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Poll every 2 seconds
          setTimeout(poll, 2000);
        } else {
          console.log('Polling timeout - document URL not received');
          setIsPollingForUrl(false);
        }
      } catch (error) {
        console.error('Error polling for document URL:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsPollingForUrl(false);
        }
      }
    };

    // Start polling after a short delay to allow Make.com to process
    setTimeout(poll, 3000);
  };

  // Use fallback data if state data is not available
  const currentSession = session || fallbackSession;
  const currentClient = client || fallbackClient;

  const handleSave = async () => {
    if (!currentSession || !currentClient) return;

    try {
      const sessionPlanData = {
        sessionId: currentSession.id,
        mainGoal1: formData.mainGoal1,
        mainGoal2: formData.mainGoal2,
        mainGoal3: formData.mainGoal3,
        mainGoal4: formData.mainGoal4,
        explanationOfBehaviour: formData.explanationOfBehaviour,
        actionPoints: selectedActionPoints,
        sessionNumber: sessionNumber
      };

      console.log('Saving session plan data:', sessionPlanData);
      console.log('Existing session plan:', existingSessionPlan);

      let savedPlan;
      if (existingSessionPlan) {
        console.log('Updating existing session plan with ID:', existingSessionPlan.id);
        savedPlan = await sessionPlanService.update(existingSessionPlan.id, sessionPlanData);
      } else {
        console.log('Creating new session plan');
        savedPlan = await sessionPlanService.create(sessionPlanData);
      }

      console.log('Session plan saved successfully:', savedPlan);
      router.push('/calendar');

    } catch (error) {
      console.error('Error saving session plan:', error);
      router.push('/calendar');
    }
  };

  const handleActionPointToggle = (actionPointId: string) => {
    setSelectedActionPoints(prev =>
      prev.includes(actionPointId)
        ? prev.filter(id => id !== actionPointId)
        : [...prev, actionPointId]
    );
  };

  const handlePreviewAndEdit = async () => {
    if (!currentSession || !currentClient) return;

    setIsGeneratingDoc(true);

    // Prepare the data for the webhook
    const sessionData = {
      // Session identification for callback
      sessionId: currentSession.id,

      // Basic session info
      sessionNumber: sessionNumber.toString(),
      dogName: currentClient.dogName || 'Unknown Dog',
      clientName: `${currentClient.firstName} ${currentClient.lastName}`.trim(),
      sessionType: currentSession.sessionType,
      sessionDate: new Date(currentSession.bookingDate).toLocaleDateString('en-GB'),
      sessionTime: currentSession.bookingTime,

      // Main goals
      mainGoal1: formData.mainGoal1 || '',
      mainGoal2: formData.mainGoal2 || '',
      mainGoal3: formData.mainGoal3 || '',
      mainGoal4: formData.mainGoal4 || '',

      // Explanation
      explanationOfBehaviour: formData.explanationOfBehaviour || '',

      // Action points (personalized)
      actionPoints: selectedActionPoints.map((actionPointId) => {
        const actionPoint = predefinedActionPoints.find(ap => ap.id === actionPointId);
        if (!actionPoint) return null;

        const personalizedActionPoint = personalizeActionPoint(
          actionPoint,
          currentClient?.dogName || 'Dog',
          'Male'
        );

        return {
          header: personalizedActionPoint.header,
          details: personalizedActionPoint.details
        };
      }).filter(Boolean),

      // Callback URL for Make.com to send the document URL back
      callbackUrl: `${window.location.origin}/api/session-plan/document-url`
    };

    try {
      console.log('Sending data to Make.com webhook:', sessionData);

      // Send data to Make.com webhook to generate the document
      const response = await fetch('https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      console.log('Make.com response status:', response.status);

      if (response.ok) {
        let result;
        try {
          result = await response.json();
          console.log('Make.com response data:', result);
        } catch {
          console.log('Response is not JSON, treating as success');
          result = { success: true };
        }

        // If Make.com returns a document URL immediately, store it and open it
        if (result.documentUrl) {
          setGeneratedDocUrl(result.documentUrl);
          window.open(result.documentUrl, '_blank');
        } else {
          // Document generation was initiated successfully
          // Start polling for the document URL
          console.log('Document generation initiated, starting to poll for URL...');
          pollForDocumentUrl(currentSession.id);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      // Don't show alert popup - just log the error
      console.log('Document generation may still be in progress despite the error');
      // Still start polling since Make.com might be processing it
      pollForDocumentUrl(currentSession.id);
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
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {existingSessionPlan ? 'Edit Session Plan' : 'Create Session Plan'}
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading session plan...</div>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentClient.dogName || 'Unknown Dog'} - Session Plan
                </h2>
                <p className="text-gray-600">
                  {currentClient.firstName} {currentClient.lastName} • {currentSession.sessionType}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation of Behaviour
              </label>
              <textarea
                value={formData.explanationOfBehaviour}
                onChange={(e) => handleInputChange('explanationOfBehaviour', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none"
                rows={4}
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
                  {showActionPoints ? 'Hide Options' : 'Add Action Points'}
                </button>
              </div>

              {/* Selected Action Points */}
              {selectedActionPoints.length > 0 && (
                <div className="space-y-3 mb-4">
                  {selectedActionPoints.map((actionPointId, index) => {
                    const actionPoint = predefinedActionPoints.find(ap => ap.id === actionPointId);
                    if (!actionPoint) return null;

                    const personalizedActionPoint = personalizeActionPoint(
                      actionPoint,
                      client?.dogName || 'Dog',
                      'Male'
                    );

                    return (
                      <div key={actionPointId} className="border border-gray-200 p-4 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            Action Point {index + 1}: {personalizedActionPoint.header}
                          </h4>
                          <button
                            onClick={() => handleActionPointToggle(actionPointId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm">{personalizedActionPoint.details}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Point Selector */}
              {showActionPoints && (
                <div className="border border-gray-200 p-4 rounded-md max-h-96 overflow-y-auto mb-6">
                  <h4 className="font-medium mb-3 text-gray-900">Select Action Points:</h4>
                  <div className="space-y-2">
                    {predefinedActionPoints.map(actionPoint => {
                      const isSelected = selectedActionPoints.includes(actionPoint.id);
                      const personalizedActionPoint = personalizeActionPoint(
                        actionPoint,
                        client?.dogName || 'Dog',
                        'Male'
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
                  <button
                    onClick={handleSave}
                    className="w-full bg-amber-800 text-white py-3 rounded-md font-medium hover:bg-amber-700 transition-colors"
                  >
                    {existingSessionPlan ? 'Update Session Plan' : 'Save Session Plan'}
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
                    <button
                      onClick={handleEditGoogleDoc}
                      className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
                    >
                      Edit Google Doc
                    </button>
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