'use client';

import { useState, useEffect } from 'react';
import { SessionPlan, ActionPoint, Session, Client } from '@/types';
import { predefinedActionPoints, personalizeActionPoint } from '@/data/actionPoints';
// import { sessionPlanService } from '@/services/sessionPlanService';
// import { googleDocsService } from '@/services/googleDocsService';
// import SessionPlanPreview from './SessionPlanPreview';

interface SessionPlanFormProps {
  session: Session;
  client: Client;
  existingPlan?: SessionPlan | null;
  onSave: (sessionPlan: SessionPlan) => void;
  onClose: () => void;
}

export default function SessionPlanForm({ session, client, existingPlan, onSave, onClose }: SessionPlanFormProps) {
  const [sessionPlan, setSessionPlan] = useState<Partial<SessionPlan>>({
    sessionId: session.id,
    sessionNumber: 1,
    mainGoal1: '',
    mainGoal2: '',
    mainGoal3: '',
    mainGoal4: '',
    explanationOfBehaviour: '',
    actionPoints: [],
    ...existingPlan,
  });

  const [selectedActionPoints, setSelectedActionPoints] = useState<string[]>(
    existingPlan?.actionPoints || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showActionPointSelector, setShowActionPointSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // For now, just default to session number 1
    // Later we can enable database session number calculation
    if (!existingPlan) {
      setSessionPlan(prev => ({ ...prev, sessionNumber: 1 }));
    }

    // Optionally try to calculate session number from database
    // sessionPlanService.calculateSessionNumber(session.id)
    //   .then(number => {
    //     setSessionPlan(prev => ({ ...prev, sessionNumber: number }));
    //   })
    //   .catch(error => {
    //     console.error('Error calculating session number (database may not be set up):', error);
    //   });
  }, [session.id, existingPlan]);

  const handleInputChange = (field: keyof SessionPlan, value: string) => {
    setSessionPlan(prev => ({ ...prev, [field]: value }));
  };

  const handleActionPointToggle = (actionPointId: string) => {
    setSelectedActionPoints(prev => {
      if (prev.includes(actionPointId)) {
        return prev.filter(id => id !== actionPointId);
      } else {
        return [...prev, actionPointId];
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // For now, create a temporary session plan without database
      // Later we can enable database saving
      const tempPlan: SessionPlan = {
        id: 'temp-' + Date.now(),
        sessionId: session.id,
        sessionNumber: sessionPlan.sessionNumber || 1,
        mainGoal1: sessionPlan.mainGoal1,
        mainGoal2: sessionPlan.mainGoal2,
        mainGoal3: sessionPlan.mainGoal3,
        mainGoal4: sessionPlan.mainGoal4,
        explanationOfBehaviour: sessionPlan.explanationOfBehaviour,
        actionPoints: selectedActionPoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSessionPlan(tempPlan);
      alert('Session plan saved locally! (Database saving will be enabled once you run the database schema)');

      // Optionally try database save
      // const planData = {
      //   ...sessionPlan,
      //   actionPoints: selectedActionPoints,
      // } as Omit<SessionPlan, 'id' | 'createdAt' | 'updatedAt'>;
      //
      // let savedPlan: SessionPlan;
      // if (existingPlan) {
      //   savedPlan = await sessionPlanService.update(existingPlan.id, planData);
      // } else {
      //   savedPlan = await sessionPlanService.create(planData);
      // }
      // onSave(savedPlan);

    } catch (error) {
      console.error('Error saving session plan:', error);
      alert('Failed to save session plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewDocument = async () => {
    if (!sessionPlan.sessionId) return;

    setIsLoading(true);
    try {
      // For now, just show an alert - we'll add preview functionality later
      alert('Preview functionality will be added once the basic form is working!');
    } catch (error) {
      console.error('Error preparing preview:', error);
      alert('Failed to prepare preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const dogName = client.dogName || 'Unknown Dog';
  const sessionNumber = sessionPlan.sessionNumber || 1;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 safe-area-pt">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Session Plan</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white p-4 space-y-6">
        {/* Session Info */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">
            {dogName} - Session {sessionNumber}
          </h2>
          <p className="text-gray-600">
            {client.firstName} {client.lastName} • {session.sessionType}
          </p>
        </div>

        {/* Main Goals */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map(goalNumber => (
            <div key={goalNumber}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Goal {goalNumber}
              </label>
              <textarea
                value={sessionPlan[`mainGoal${goalNumber}` as keyof SessionPlan] as string || ''}
                onChange={(e) => handleInputChange(`mainGoal${goalNumber}` as keyof SessionPlan, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
                rows={2}
                placeholder={`Enter main goal ${goalNumber}...`}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {((sessionPlan[`mainGoal${goalNumber}` as keyof SessionPlan] as string) || '').length}/80
              </div>
            </div>
          ))}
        </div>

        {/* Explanation of Behaviour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation of Behaviour
          </label>
          <textarea
            value={sessionPlan.explanationOfBehaviour || ''}
            onChange={(e) => handleInputChange('explanationOfBehaviour', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
            rows={6}
            placeholder="Explain the dog's behaviour patterns and background..."
          />
        </div>

        {/* Action Points */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Action Points</h3>
            <button
              onClick={() => setShowActionPointSelector(!showActionPointSelector)}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              {showActionPointSelector ? 'Hide Options' : 'Add Action Points'}
            </button>
          </div>

          {/* Selected Action Points */}
          {selectedActionPoints.length > 0 && (
            <div className="space-y-3 mb-4">
              {selectedActionPoints.map((actionPointId, index) => {
                const actionPoint = predefinedActionPoints.find(ap => ap.id === actionPointId);
                if (!actionPoint) return null;

                const personalizedActionPoint = personalizeActionPoint(actionPoint, dogName, 'Male');

                return (
                  <div key={actionPointId} className="border border-gray-200 p-4 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Action Point {index + 1}: {personalizedActionPoint.header}</h4>
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
          {showActionPointSelector && (
            <div className="border border-gray-200 p-4 rounded-md max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-3 text-gray-900">Select Action Points:</h4>
              <div className="space-y-2">
                {predefinedActionPoints.map(actionPoint => {
                  const isSelected = selectedActionPoints.includes(actionPoint.id);
                  const personalizedActionPoint = personalizeActionPoint(actionPoint, dogName, 'Male');

                  return (
                    <div
                      key={actionPoint.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50'
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
                          isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
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

        {/* Action Buttons */}
        <div className="space-y-3 pb-8 border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-gray-900 text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Session Plan'}
          </button>

          <button
            onClick={handlePreviewDocument}
            disabled={isLoading || !sessionPlan.sessionId}
            className="w-full bg-white text-gray-900 py-3 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Preparing...' : 'Preview & Edit Document'}
          </button>
        </div>
      </div>

      {/* Preview Modal - Temporarily disabled */}
      {/* {sessionPlan.sessionId && (
        <SessionPlanPreview
          sessionPlan={sessionPlan as SessionPlan}
          session={session}
          client={client}
          actionPoints={predefinedActionPoints.filter(ap => selectedActionPoints.includes(ap.id))}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onSavePDF={handleSavePDF}
        />
      )} */}
    </div>
  );
}
