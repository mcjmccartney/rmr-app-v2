'use client';

import { useState } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { formatDateTime, formatClientWithAllDogs } from '@/utils/dateFormatting';
import { paymentService } from '@/services/paymentService';
import { sessionService } from '@/services/sessionService';
import { Circle, CircleSlash } from 'lucide-react';

interface SessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onEditSession: (session: Session) => void;
  onEditClient: (session: Session) => void;
  onCreateSessionPlan?: (session: Session) => void;
  onViewBehaviouralBrief?: (behaviouralBriefId: string) => void;
  onViewBehaviourQuestionnaire?: (behaviourQuestionnaireId: string) => void;
}

export default function SessionModal({ session, isOpen, onClose, onEditSession, onEditClient, onCreateSessionPlan, onViewBehaviouralBrief, onViewBehaviourQuestionnaire }: SessionModalProps) {
  const { state, deleteSession, updateSession } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!session) return null;

  // Find the client for this session
  const client = state.clients.find(c => c.id === session.clientId);

  // Helper function to get all emails for a client (including aliases)
  const getClientEmails = (client: any) => {
    const emails: string[] = [];
    if (client?.email) {
      emails.push(client.email.toLowerCase());
    }
    // Add email aliases if available
    const aliases = state.clientEmailAliases?.[client?.id];
    if (aliases && Array.isArray(aliases)) {
      aliases.forEach((alias: any) => {
        const aliasEmail = alias?.email?.toLowerCase();
        if (aliasEmail && !emails.includes(aliasEmail)) {
          emails.push(aliasEmail);
        }
      });
    }
    return emails;
  };

  // Find behavioural brief and questionnaire for this client
  const behaviouralBrief = client
    ? state.behaviouralBriefs.find(b => b.client_id === client.id) ||
      (client.behaviouralBriefId ? state.behaviouralBriefs.find(b => b.id === client.behaviouralBriefId) : null)
    : null;

  // Helper function to get the correct dog name (prioritizes client's current name over session's stored name)
  const getSessionDogName = (): string => {
    const sessionDogName = session.dogName;
    if (!sessionDogName) {
      return client?.dogName || '';
    }
    if (!client) {
      return sessionDogName;
    }
    // Check if session dog matches client's primary dog (case-insensitive)
    if (client.dogName && sessionDogName.toLowerCase() === client.dogName.toLowerCase()) {
      return client.dogName; // Use client's current name (may have been edited)
    }
    // Check if session dog matches any of the other dogs
    if (client.otherDogs && Array.isArray(client.otherDogs)) {
      const matchingOtherDog = client.otherDogs.find(
        dog => dog.toLowerCase() === sessionDogName.toLowerCase()
      );
      if (matchingOtherDog) {
        return matchingOtherDog; // Use the current name from otherDogs array
      }
    }
    // Fallback to session's dog name
    return sessionDogName;
  };

  // Get the specific dog name for this session
  const sessionDogName = getSessionDogName();

  // Comprehensive questionnaire matching function
  const findQuestionnaireForSession = (client: any, dogName: string, questionnaires: any[]) => {
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
    }

    if (questionnaire) return questionnaire;

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
    }

    if (questionnaire) return questionnaire;

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

  const behaviourQuestionnaire = sessionDogName
    ? findQuestionnaireForSession(client, sessionDogName, state.behaviourQuestionnaires)
    : null;

  const handleDelete = async () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteSession(session.id);
        onClose();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };



  const handleMarkAsPaid = async () => {
    try {
      const updatedSession = await sessionService.markAsPaid(session.id);
      await updateSession(session.id, {
        sessionPaid: true,
        paymentConfirmedAt: updatedSession.paymentConfirmedAt
      });
      onClose(); // Close the modal
      // Refresh the page to show updated payment status
      window.location.reload();
    } catch (error) {
      console.error('Error marking session as paid:', error);
      alert('Failed to mark session as paid. Please try again.');
    }
  };

  const handleToggleSpecialMarking = async () => {
    try {
      await updateSession(session.id, {
        specialMarking: !session.specialMarking // Toggle special marking
      });
      onClose(); // Close the modal
      // Refresh the page to show updated special marking status
      window.location.reload();
    } catch (error) {
      console.error('Error toggling special marking:', error);
      alert('Failed to toggle special marking. Please try again.');
    }
  };

  const handleMarkAsUnpaid = async () => {
    try {
      await updateSession(session.id, {
        sessionPaid: false,
        paymentConfirmedAt: undefined
        // Keep specialMarking unchanged - it's independent of payment status
      });
      onClose(); // Close the modal
      // Refresh the page to show updated payment status
      window.location.reload();
    } catch (error) {
      console.error('Error marking session as unpaid:', error);
      alert('Failed to mark session as unpaid. Please try again.');
    }
  };

  const handleSessionPlanSent = async () => {
    try {
      await updateSession(session.id, {
        sessionPlanSent: true
      });
      onClose(); // Close the modal
      // Refresh the page to show updated session plan status
      window.location.reload();
    } catch (error) {
      console.error('Error marking session plan as sent:', error);
      alert('Failed to mark session plan as sent. Please try again.');
    }
  };

  const handleSessionPlanUnsent = async () => {
    try {
      await updateSession(session.id, {
        sessionPlanSent: false
      });
      onClose(); // Close the modal
      // Refresh the page to show updated session plan status
      window.location.reload();
    } catch (error) {
      console.error('Error marking session plan as unsent:', error);
      alert('Failed to mark session plan as unsent. Please try again.');
    }
  };

  const handleQuestionnaireBypass = async () => {
    try {
      await updateSession(session.id, {
        questionnaireBypass: true
      });
      onClose(); // Close the modal
      // Refresh the page to show updated questionnaire status
      window.location.reload();
    } catch (error) {
      console.error('Error setting questionnaire bypass:', error);
      alert('Failed to set questionnaire bypass. Please try again.');
    }
  };

  const handleQuestionnaireBypassRemove = async () => {
    try {
      await updateSession(session.id, {
        questionnaireBypass: false
      });
      onClose(); // Close the modal
      // Refresh the page to show updated questionnaire status
      window.location.reload();
    } catch (error) {
      console.error('Error removing questionnaire bypass:', error);
      alert('Failed to remove questionnaire bypass. Please try again.');
    }
  };

  // For Group and RMR Live sessions, show session type instead of "Unknown Client"
  const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
  const displayName = client
    ? `${client.firstName} ${client.lastName}${sessionDogName ? ` w/ ${sessionDogName}` : ''}`
    : isGroupOrRMRLive
    ? session.sessionType
    : 'Unknown Client';

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
    >
      <div className="space-y-6">
        {/* Session Details */}
        <div className="space-y-0 divide-y divide-gray-100">
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Booking</span>
            <span className="font-semibold text-gray-900 text-right">
              {formatDateTime(session.bookingDate, session.bookingTime)}
            </span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Session Type</span>
            <span className="font-semibold text-gray-900 text-right">{session.sessionType}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Quote</span>
            <span className="font-semibold text-gray-900 text-right">£{session.quote}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Payment Status</span>
            <div className="flex items-center space-x-2">
              {session.sessionPaid ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-600">
                    Paid {session.paymentConfirmedAt && new Date(session.paymentConfirmedAt).toLocaleDateString('en-GB')}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="font-semibold text-amber-600">Pending</span>
                </>
              )}
            </div>
          </div>

          {client && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Booking Terms</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const clientEmails = getClientEmails(client);
                  const hasSignedBookingTerms = clientEmails.length > 0 &&
                    state.bookingTerms.some(bt => clientEmails.includes(bt.email?.toLowerCase() || ''));

                  if (hasSignedBookingTerms) {
                    const bookingTerm = state.bookingTerms.find(bt => clientEmails.includes(bt.email?.toLowerCase() || ''));
                    return (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-600">
                          Signed {bookingTerm?.submitted ? new Date(bookingTerm.submitted).toLocaleDateString('en-GB') : ''}
                        </span>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-600">Not Signed</span>
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {client?.phone && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Phone</span>
              <span className="font-semibold text-gray-900 text-right">{client.phone}</span>
            </div>
          )}

          {client?.email && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="font-semibold text-gray-900 text-right break-all">{client.email}</span>
            </div>
          )}

          {(client?.phone || behaviourQuestionnaire?.contactNumber) && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Phone</span>
              <span className="font-semibold text-gray-900 text-right">
                {client?.phone || behaviourQuestionnaire?.contactNumber}
              </span>
            </div>
          )}

          {client?.address && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Address</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">{client.address}</span>
            </div>
          )}

          {session.notes && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Notes</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">{session.notes}</span>
            </div>
          )}
        </div>

        {/* Behavioural Brief and Questionnaire Buttons */}
        {(behaviouralBrief || behaviourQuestionnaire) && (
          <div className="space-y-3 pb-3 border-b border-gray-200">
            {behaviouralBrief && onViewBehaviouralBrief && (
              <button
                onClick={() => onViewBehaviouralBrief(behaviouralBrief.id)}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
              >
                View Behavioural Brief
              </button>
            )}

            {behaviourQuestionnaire && onViewBehaviourQuestionnaire && (
              <button
                onClick={() => onViewBehaviourQuestionnaire(behaviourQuestionnaire.id)}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
              >
                View Behaviour Questionnaire
              </button>
            )}
          </div>
        )}

        {/* Payment and Special Marking Buttons */}
        {client && (
          <div className="pb-3 border-b border-gray-200">
            <div className="flex gap-2">
              {/* Payment Button */}
              {!session.sessionPaid ? (
                <button
                  onClick={handleMarkAsPaid}
                  className="flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#4f6749' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                >
                  Mark as Paid
                </button>
              ) : (
                <button
                  onClick={handleMarkAsUnpaid}
                  className="flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#973b00' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
                >
                  Mark as Unpaid
                </button>
              )}

              {/* Special Marking Toggle Button - Always Available */}
              <button
                onClick={handleToggleSpecialMarking}
                className="w-12 h-12 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                style={{ backgroundColor: session.specialMarking ? '#973b00' : '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = session.specialMarking ? '#7a2f00' : '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = session.specialMarking ? '#973b00' : '#4f6749'}
                title={session.specialMarking ? "Remove Special Marking" : "Add Special Marking"}
              >
                {session.specialMarking ? <CircleSlash size={20} /> : <Circle size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* Session Plan Buttons */}
        {client && (
          <div className="pb-3 border-b border-gray-200">
            {!session.sessionPlanSent ? (
              <button
                onClick={handleSessionPlanSent}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#000000' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
              >
                Session Plan Sent
              </button>
            ) : (
              <button
                onClick={handleSessionPlanUnsent}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
              >
                Session Plan Unsent
              </button>
            )}
          </div>
        )}

        {/* Questionnaire Bypass Buttons - Only show if no questionnaire is connected and not charcoal grey */}
        {client && !behaviourQuestionnaire && !session.sessionPlanSent && (
          <div className="pb-3 border-b border-gray-200">
            {!session.questionnaireBypass ? (
              <button
                onClick={handleQuestionnaireBypass}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#e17100' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e17100'}
              >
                Questionnaire N/A
              </button>
            ) : (
              <button
                onClick={handleQuestionnaireBypassRemove}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
              >
                Remove Questionnaire N/A
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => onEditSession(session)}
              className="flex-1 bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Edit Session
            </button>
            <button
              onClick={() => onEditClient(session)}
              className="flex-1 bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              View Client
            </button>
          </div>

          {/* Session Plan Button */}
          {onCreateSessionPlan && (
            <button
              onClick={() => onCreateSessionPlan(session)}
              className="w-full bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {session.sessionPlanSent ? 'View Session Plan' : 'Create Session Plan'}
            </button>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isDeleting
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-amber-800 hover:bg-amber-700 text-white'
          }`}
        >
          {isDeleting ? 'Deleting...' : 'Delete Session'}
        </button>
      </div>
    </SlideUpModal>
  );
}
