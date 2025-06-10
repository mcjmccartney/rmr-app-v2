'use client';

import { useState } from 'react';
import { SessionPlan, ActionPoint, Session, Client } from '@/types';
import { personalizeActionPoint } from '@/data/actionPoints';
import { X, Download, Edit3 } from 'lucide-react';

interface SessionPlanPreviewProps {
  sessionPlan: SessionPlan;
  session: Session;
  client: Client;
  actionPoints: ActionPoint[];
  isOpen: boolean;
  onClose: () => void;
  onSavePDF: (editedContent: EditableContent) => void;
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

export default function SessionPlanPreview({
  sessionPlan,
  session,
  client,
  actionPoints,
  isOpen,
  onClose,
  onSavePDF
}: SessionPlanPreviewProps) {
  const dogName = client.dogName || 'Unknown Dog';
  const sessionNumber = sessionPlan.sessionNumber || 1;
  const ownerName = `${client.firstName} ${client.lastName}`;

  // Get selected action points and personalize them
  const selectedActionPoints = actionPoints
    .filter(ap => sessionPlan.actionPoints.includes(ap.id))
    .map(ap => personalizeActionPoint(ap, dogName, 'Male'));

  const [editableContent, setEditableContent] = useState<EditableContent>({
    title: `Session Plan - ${dogName} - Session ${sessionNumber}`,
    sessionNumber,
    dogName,
    ownerName,
    sessionDate: session.bookingDate,
    sessionTime: session.bookingTime,
    sessionType: session.sessionType,
    mainGoals: [
      sessionPlan.mainGoal1,
      sessionPlan.mainGoal2,
      sessionPlan.mainGoal3,
      sessionPlan.mainGoal4,
    ].filter(Boolean),
    explanationOfBehaviour: sessionPlan.explanationOfBehaviour || '',
    actionPoints: selectedActionPoints,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSavePDF = () => {
    onSavePDF(editableContent);
  };

  const updateMainGoal = (index: number, value: string) => {
    const newGoals = [...editableContent.mainGoals];
    newGoals[index] = value;
    setEditableContent(prev => ({ ...prev, mainGoals: newGoals }));
  };

  const updateActionPoint = (index: number, field: 'header' | 'details', value: string) => {
    const newActionPoints = [...editableContent.actionPoints];
    newActionPoints[index] = { ...newActionPoints[index], [field]: value };
    setEditableContent(prev => ({ ...prev, actionPoints: newActionPoints }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 size={16} />
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </button>
            <button
              onClick={handleSavePDF}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Save as PDF
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Title */}
            <div className="text-center">
              {isEditing ? (
                <input
                  type="text"
                  value={editableContent.title}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold text-center w-full border-b border-gray-300 focus:border-gray-900 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{editableContent.title}</h1>
              )}
            </div>

            {/* Session Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Session Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Dog Name:</strong> {editableContent.dogName}</div>
                <div><strong>Session Number:</strong> {editableContent.sessionNumber}</div>
                <div><strong>Owner:</strong> {editableContent.ownerName}</div>
                <div><strong>Session Type:</strong> {editableContent.sessionType}</div>
                <div><strong>Date:</strong> {new Date(editableContent.sessionDate).toLocaleDateString('en-GB')}</div>
                <div><strong>Time:</strong> {editableContent.sessionTime}</div>
              </div>
            </div>

            {/* Main Goals */}
            {editableContent.mainGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Main Goals</h2>
                <div className="space-y-3">
                  {editableContent.mainGoals.map((goal, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-700 mb-2">Main Goal {index + 1}:</div>
                      {isEditing ? (
                        <textarea
                          value={goal}
                          onChange={(e) => updateMainGoal(index, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
                          rows={2}
                        />
                      ) : (
                        <p className="text-gray-900">{goal}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation of Behaviour */}
            {editableContent.explanationOfBehaviour && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Explanation of Behaviour</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {isEditing ? (
                    <textarea
                      value={editableContent.explanationOfBehaviour}
                      onChange={(e) => setEditableContent(prev => ({ ...prev, explanationOfBehaviour: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
                      rows={6}
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{editableContent.explanationOfBehaviour}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Points */}
            {editableContent.actionPoints.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Action Points</h2>
                <div className="space-y-4">
                  {editableContent.actionPoints.map((actionPoint, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium text-gray-700 mb-2">Action Point {index + 1}:</div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={actionPoint.header}
                            onChange={(e) => updateActionPoint(index, 'header', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black font-medium"
                            placeholder="Action point header"
                          />
                          <textarea
                            value={actionPoint.details}
                            onChange={(e) => updateActionPoint(index, 'details', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
                            rows={3}
                            placeholder="Action point details"
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">{actionPoint.header}</h3>
                          <p className="text-gray-700">{actionPoint.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
              Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
