'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Edit3, Eye } from 'lucide-react';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import { personalizeActionPoint } from '@/data/actionPoints';
import RichTextEditor from '@/components/RichTextEditor';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

interface SessionPlanPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionPlan: SessionPlan;
  session: Session;
  client: Client;
  actionPoints: ActionPoint[];
  selectedActionPoints: string[];
  editableActionPoints: {[key: string]: {header: string, details: string}};
  formData: {
    mainGoal1: string;
    mainGoal2: string;
    mainGoal3: string;
    mainGoal4: string;
    explanationOfBehaviour: string;
  };
  getSessionDogName: () => string;
  getDogGender: () => 'Male' | 'Female';
}

interface EditableContent {
  title: string;
  sessionNumber: number;
  dogName: string;
  ownerName: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  mainGoals: string[];
  explanationOfBehaviour: string;
  actionPoints: { header: string; details: string }[];
}

export default function SessionPlanPDFModal({
  isOpen,
  onClose,
  sessionPlan,
  session,
  client,
  actionPoints,
  selectedActionPoints,
  editableActionPoints,
  formData,
  getSessionDogName,
  getDogGender
}: SessionPlanPDFModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [editableContent, setEditableContent] = useState<EditableContent>({
    title: '',
    sessionNumber: 0,
    dogName: '',
    ownerName: '',
    sessionDate: '',
    sessionTime: '',
    sessionType: '',
    mainGoals: [],
    explanationOfBehaviour: '',
    actionPoints: []
  });

  // Initialize editable content when modal opens
  useEffect(() => {
    if (isOpen) {
      const dogName = getSessionDogName();
      const sessionNumber = sessionPlan.sessionNumber || 1;
      const ownerName = `${client.firstName} ${client.lastName}`;

      // Process action points with personalization and editing
      const processedActionPoints = selectedActionPoints.map(actionPointId => {
        // Check if we have an edited version
        if (editableActionPoints[actionPointId]) {
          return {
            header: editableActionPoints[actionPointId].header,
            details: editableActionPoints[actionPointId].details
          };
        }

        // Otherwise use personalized version from library
        const actionPoint = actionPoints.find(ap => ap.id === actionPointId);
        if (actionPoint) {
          const personalizedActionPoint = personalizeActionPoint(
            actionPoint,
            dogName,
            getDogGender()
          );
          return {
            header: personalizedActionPoint.header,
            details: personalizedActionPoint.details
          };
        }

        return { header: '', details: '' };
      }).filter(ap => ap.header || ap.details);

      setEditableContent({
        title: `Session ${sessionNumber} - ${dogName}`,
        sessionNumber,
        dogName,
        ownerName,
        sessionDate: session.bookingDate,
        sessionTime: session.bookingTime,
        sessionType: session.sessionType,
        mainGoals: [
          formData.mainGoal1,
          formData.mainGoal2,
          formData.mainGoal3,
          formData.mainGoal4,
        ].filter(Boolean),
        explanationOfBehaviour: formData.explanationOfBehaviour || '',
        actionPoints: processedActionPoints
      });
    }
  }, [isOpen, sessionPlan, session, client, selectedActionPoints, editableActionPoints, formData, actionPoints, getSessionDogName, getDogGender]);



  const handleGeneratePDF = () => {
    // Simply trigger the browser's print dialog
    // User can save as PDF from there
    window.print();
  };

  const updateMainGoal = (index: number, value: string) => {
    const newMainGoals = [...editableContent.mainGoals];
    newMainGoals[index] = value;
    setEditableContent(prev => ({ ...prev, mainGoals: newMainGoals }));
  };

  const updateActionPoint = (index: number, field: 'header' | 'details', value: string) => {
    const newActionPoints = [...editableContent.actionPoints];
    newActionPoints[index] = { ...newActionPoints[index], [field]: value };
    setEditableContent(prev => ({ ...prev, actionPoints: newActionPoints }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #session-plan-preview,
          #session-plan-preview * {
            visibility: visible;
          }
          #session-plan-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Force Action Points section to start on new page */
          .action-points-section {
            page-break-before: always !important;
            break-before: page !important;
          }

          /* Prevent individual action point boxes from splitting across pages */
          .action-point-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* If an action point would split, start it on a new page */
          .action-point-box {
            page-break-before: auto !important;
            break-before: auto !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Session Plan Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isEditing
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
                {isEditing ? 'Preview Mode' : 'Edit Mode'}
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Print / Save as PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={editableContent.title}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
                />
              </div>

              {/* Main Goals */}
              {editableContent.mainGoals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Goals
                  </label>
                  <div className="space-y-3">
                    {editableContent.mainGoals.map((goal, index) => (
                      <div key={index}>
                        <label className="block text-xs text-gray-500 mb-1">
                          Main Goal {index + 1}
                        </label>
                        <RichTextEditor
                          value={goal}
                          onChange={(value) => updateMainGoal(index, value)}
                          placeholder={`Enter main goal ${index + 1}...`}
                          className="min-h-[80px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation of Behaviour */}
              {editableContent.explanationOfBehaviour && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation of Behaviour
                  </label>
                  <RichTextEditor
                    value={editableContent.explanationOfBehaviour}
                    onChange={(value) => setEditableContent(prev => ({ ...prev, explanationOfBehaviour: value }))}
                    placeholder="Describe the behaviour patterns, triggers, and context..."
                    className="min-h-[120px]"
                  />
                </div>
              )}

              {/* Action Points */}
              {editableContent.actionPoints.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Points
                  </label>
                  <div className="space-y-4">
                    {editableContent.actionPoints.map((actionPoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <label className="block text-xs text-gray-500 mb-1">
                          Action Point {index + 1} - Header
                        </label>
                        <RichTextEditor
                          value={actionPoint.header}
                          onChange={(value) => updateActionPoint(index, 'header', value)}
                          placeholder="Action point header..."
                          className="min-h-[60px] mb-3"
                        />
                        <label className="block text-xs text-gray-500 mb-1">
                          Action Point {index + 1} - Details
                        </label>
                        <RichTextEditor
                          value={actionPoint.details}
                          onChange={(value) => updateActionPoint(index, 'details', value)}
                          placeholder="Action point details..."
                          className="min-h-[100px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Mode */
            <div id="session-plan-preview" ref={previewRef} className="bg-white">
              {/* Header Section */}
              <div style={{ backgroundColor: '#4f6749' }} className="text-white p-6 rounded-t-lg mb-6">
                <h1 className="text-2xl font-bold">RAISING MY RESCUE</h1>
                <p className="text-gray-300">Professional Dog Training Services</p>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-6">{editableContent.title}</h2>

              {/* Main Goals */}
              {editableContent.mainGoals.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Main Goals</h3>
                  <div className="space-y-2">
                    {editableContent.mainGoals.map((goal, index) => (
                      <div key={index} className="flex items-start">
                        <span className="font-medium text-gray-700 mr-2">•</span>
                        <div className="flex-1">
                          <strong>Main Goal {index + 1}:</strong>{' '}
                          <SafeHtmlRenderer html={goal} className="inline" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation of Behaviour */}
              {editableContent.explanationOfBehaviour && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Explanation of Behaviour</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <SafeHtmlRenderer html={editableContent.explanationOfBehaviour} />
                  </div>
                </div>
              )}

              {/* Action Points - Start on new page */}
              {editableContent.actionPoints.length > 0 && (
                <div className="mb-6 action-points-section">
                  <h3 className="font-semibold text-gray-900 mb-3">Action Points</h3>
                  <div className="space-y-4">
                    {editableContent.actionPoints.map((actionPoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4 action-point-box">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Action Point {index + 1}: <SafeHtmlRenderer html={actionPoint.header} className="inline" />
                        </h4>
                        <div className="text-gray-700">
                          <SafeHtmlRenderer html={actionPoint.details} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
