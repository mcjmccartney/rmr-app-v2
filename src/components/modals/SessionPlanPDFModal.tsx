'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Edit3, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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



  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    try {
      // Get the preview element
      const element = previewRef.current;
      if (!element) {
        throw new Error('Preview element not found');
      }

      // Clone the element and fix all styles before passing to html2canvas
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Add to document temporarily (off-screen) to compute styles
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      document.body.appendChild(clonedElement);

      // Get all elements and convert their styles
      const allOriginalElements = element.getElementsByTagName('*');
      const allClonedElements = clonedElement.getElementsByTagName('*');

      for (let i = 0; i < allOriginalElements.length; i++) {
        const originalEl = allOriginalElements[i] as HTMLElement;
        const clonedEl = allClonedElements[i] as HTMLElement;

        if (originalEl && clonedEl) {
          const computedStyle = window.getComputedStyle(originalEl);

          // Convert all color-related properties to inline styles
          if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            clonedEl.style.backgroundColor = computedStyle.backgroundColor;
          }
          if (computedStyle.color) {
            clonedEl.style.color = computedStyle.color;
          }
          if (computedStyle.borderColor) {
            clonedEl.style.borderColor = computedStyle.borderColor;
          }
          if (computedStyle.borderTopColor) {
            clonedEl.style.borderTopColor = computedStyle.borderTopColor;
          }
          if (computedStyle.borderRightColor) {
            clonedEl.style.borderRightColor = computedStyle.borderRightColor;
          }
          if (computedStyle.borderBottomColor) {
            clonedEl.style.borderBottomColor = computedStyle.borderBottomColor;
          }
          if (computedStyle.borderLeftColor) {
            clonedEl.style.borderLeftColor = computedStyle.borderLeftColor;
          }
        }
      }

      // Convert the cloned element to canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher quality
        useCORS: true, // Allow cross-origin images
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Remove the cloned element
      document.body.removeChild(clonedElement);

      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content is longer than one page, add additional pages
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 297; // A4 height in mm

      while (heightLeft > pageHeight) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`Session_Plan_${editableContent.dogName}_Session_${editableContent.sessionNumber || 1}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
              disabled={isGenerating}
              className="flex items-center gap-2 bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
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
            <div ref={previewRef} className="bg-white">
              {/* Header Section */}
              <div className="bg-gray-900 text-white p-6 rounded-t-lg mb-6">
                <h1 className="text-2xl font-bold">RAISING MY RESCUE</h1>
                <p className="text-gray-300">Professional Dog Training Services</p>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-6">{editableContent.title}</h2>

              {/* Session Information */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Session Information</h3>
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

              {/* Action Points */}
              {editableContent.actionPoints.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Action Points</h3>
                  <div className="space-y-4">
                    {editableContent.actionPoints.map((actionPoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
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
  );
}

// Declare jsPDF for TypeScript
declare global {
  interface Window {
    jsPDF: any;
  }
}
