'use client';

import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { formatDateTime } from '@/utils/dateFormatting';
import { paymentService } from '@/services/paymentService';
import { sessionService } from '@/services/sessionService';

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

  if (!session) return null;

  // Find the client for this session
  const client = state.clients.find(c => c.id === session.clientId);

  // Find behavioural brief and questionnaire for this client
  const behaviouralBrief = client
    ? state.behaviouralBriefs.find(b => b.client_id === client.id) ||
      (client.behaviouralBriefId ? state.behaviouralBriefs.find(b => b.id === client.behaviouralBriefId) : null)
    : null;

  const behaviourQuestionnaire = client
    ? state.behaviourQuestionnaires.find(q => q.client_id === client.id) ||
      (client.behaviourQuestionnaireId ? state.behaviourQuestionnaires.find(q => q.id === client.behaviourQuestionnaireId) : null) ||
      (client.email && client.dogName ? state.behaviourQuestionnaires.find(q =>
        q.email?.toLowerCase() === client.email?.toLowerCase() &&
        q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
      ) : null)
    : null;

  const handleDelete = async () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await deleteSession(session.id);
        onClose();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session. Please try again.');
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

  const handleMarkAsUnpaid = async () => {
    try {
      await updateSession(session.id, {
        sessionPaid: false,
        paymentConfirmedAt: null
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

  // For Group and RMR Live sessions, show session type instead of "Unknown Client"
  const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';
  const displayName = client
    ? `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
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
                  <span className="font-semibold text-green-600">Paid</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="font-semibold text-amber-600">Pending</span>
                </>
              )}
            </div>
          </div>

          {session.sessionPaid && session.paymentConfirmedAt && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Paid On</span>
              <span className="font-semibold text-gray-900 text-right">
                {new Date(session.paymentConfirmedAt).toLocaleDateString('en-GB')}
              </span>
            </div>
          )}

          {client && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">Booking Terms</span>
              <div className="flex items-center space-x-2">
                {client.email && state.bookingTerms.some(bt => bt.email?.toLowerCase() === client.email?.toLowerCase()) ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-600">Signed</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-600">Not Signed</span>
                  </>
                )}
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

        {/* Payment Buttons */}
        {client && (
          <div className="pb-3 border-b border-gray-200">
            {!session.sessionPaid ? (
              <button
                onClick={handleMarkAsPaid}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#4f6749' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
              >
                Mark as Paid
              </button>
            ) : (
              <button
                onClick={handleMarkAsUnpaid}
                className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
              >
                Mark as Unpaid
              </button>
            )}
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
              Create Session Plan
            </button>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full bg-amber-800 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Delete Session
        </button>
      </div>
    </SlideUpModal>
  );
}
