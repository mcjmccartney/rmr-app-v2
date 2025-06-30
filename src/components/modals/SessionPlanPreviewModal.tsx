'use client';

import { useState } from 'react';
import SlideUpModal from './SlideUpModal';
import { predefinedActionPoints, personalizeActionPoint } from '@/data/actionPoints';
import { useApp } from '@/context/AppContext';

interface SessionPlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionPlan: {
    dogName: string;
    clientName: string;
    sessionType: string;
    sessionDate: string;
    sessionTime: string;
    mainGoal1: string;
    mainGoal2: string;
    mainGoal3: string;
    mainGoal4: string;
    explanationOfBehaviour: string;
    selectedActionPoints: string[];
  };
  onSave: (editedContent: string) => void;
}

export default function SessionPlanPreviewModal({ 
  isOpen, 
  onClose, 
  sessionPlan, 
  onSave 
}: SessionPlanPreviewModalProps) {
  const { state } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Get dog's gender from questionnaire for proper pronoun replacement
  const getDogGender = (dogName: string): 'Male' | 'Female' => {
    if (!dogName) return 'Male';

    const questionnaire = state.behaviourQuestionnaires.find(q =>
      q.dogName?.toLowerCase() === dogName.toLowerCase()
    );

    return questionnaire?.sex || 'Male';
  };

  // Generate the document content
  const generateDocumentContent = () => {
    const actionPointsText = sessionPlan.selectedActionPoints
      .map((actionPointId, index) => {
        const actionPoint = predefinedActionPoints.find(ap => ap.id === actionPointId);
        if (!actionPoint) return '';
        
        const personalizedActionPoint = personalizeActionPoint(
          actionPoint,
          sessionPlan.dogName,
          getDogGender(sessionPlan.dogName)
        );
        
        return `Action Point ${index + 1}: ${personalizedActionPoint.header}\n${personalizedActionPoint.details}`;
      })
      .filter(Boolean)
      .join('\n\n');

    return `RAISING MY RESCUE - SESSION PLAN

═══════════════════════════════════════════════════════════════

CLIENT INFORMATION
Dog Name: ${sessionPlan.dogName}
Client: ${sessionPlan.clientName}
Session Type: ${sessionPlan.sessionType}
Date: ${sessionPlan.sessionDate}
Time: ${sessionPlan.sessionTime}

═══════════════════════════════════════════════════════════════

MAIN GOALS

Goal 1:
${sessionPlan.mainGoal1 || 'Not specified'}

Goal 2:
${sessionPlan.mainGoal2 || 'Not specified'}

Goal 3:
${sessionPlan.mainGoal3 || 'Not specified'}

Goal 4:
${sessionPlan.mainGoal4 || 'Not specified'}

═══════════════════════════════════════════════════════════════

EXPLANATION OF BEHAVIOUR

${sessionPlan.explanationOfBehaviour || 'Not provided'}

═══════════════════════════════════════════════════════════════

ACTION POINTS

${actionPointsText || 'No action points selected'}

═══════════════════════════════════════════════════════════════

Document generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}
Raising My Rescue - Professional Dog Training Services`;
  };

  const handleEdit = () => {
    setEditedContent(generateDocumentContent());
    setIsEditing(true);
  };

  const handleSaveEdited = () => {
    onSave(editedContent);
    setIsEditing(false);
    onClose();
  };

  const handleDownloadPDF = () => {
    const content = isEditing ? editedContent : generateDocumentContent();

    // Create a temporary element to trigger download
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${sessionPlan.dogName}_Session_Plan_${sessionPlan.sessionDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <SlideUpModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Session Plan' : 'Session Plan Preview'}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Session Plan' : 'Session Plan Preview'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isEditing ? (
            /* Edit Mode */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edit Document Content:
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 resize-none font-mono text-sm"
                placeholder="Edit your session plan document here..."
              />
            </div>
          ) : (
            /* Preview Mode */
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {generateDocumentContent()}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdited}
                  className="flex-1 bg-amber-800 text-white py-3 rounded-md font-medium hover:bg-amber-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white text-amber-800 py-3 rounded-md font-medium border border-amber-800 hover:bg-amber-800/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleEdit}
                  className="w-full bg-amber-800 text-white py-3 rounded-md font-medium hover:bg-amber-700 transition-colors"
                >
                  Edit Document
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-white text-amber-800 py-3 rounded-md font-medium border border-amber-800 hover:bg-amber-800/10 transition-colors"
                >
                  Download as Text File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideUpModal>
  );
}
