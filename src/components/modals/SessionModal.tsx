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
  const behaviouralBrief = client?.behaviouralBriefId ?
    state.behaviouralBriefs.find(b => b.id === client.behaviouralBriefId) : null;

  const behaviourQuestionnaire = client && client.email && client.dogName ?
    state.behaviourQuestionnaires.find(q =>
      q.email?.toLowerCase() === client.email?.toLowerCase() &&
      q.dogName?.toLowerCase() === client.dogName?.toLowerCase()
    ) : null;

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

  const handleGeneratePaymentLink = () => {
    if (!client) {
      alert('Client information is required to generate payment link');
      return;
    }

    try {
      const paymentLink = paymentService.getPaymentUrl(session, client);

      // Copy to clipboard
      navigator.clipboard.writeText(paymentLink).then(() => {
        alert('Payment link copied to clipboard!');
      }).catch(() => {
        // Fallback: show the link in an alert
        alert(`Payment link: ${paymentLink}`);
      });
    } catch (error) {
      console.error('Error generating payment link:', error);
      alert('Failed to generate payment link. Please try again.');
    }
  };

  const handleGeneratePaymentInstructions = () => {
    if (!client) {
      alert('Client information is required to generate payment instructions');
      return;
    }

    try {
      const instructions = paymentService.generatePaymentInstructions(session, client);

      // Copy to clipboard
      navigator.clipboard.writeText(instructions).then(() => {
        alert('Payment instructions copied to clipboard!');
      }).catch(() => {
        // Fallback: show in a new window
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`<pre>${instructions}</pre>`);
        }
      });
    } catch (error) {
      console.error('Error generating payment instructions:', error);
      alert('Failed to generate payment instructions. Please try again.');
    }
  };

  const handleMarkAsPaid = async () => {
    if (window.confirm('Mark this session as paid?')) {
      try {
        const updatedSession = await sessionService.markAsPaid(session.id);
        await updateSession(session.id, {
          sessionPaid: true,
          paymentConfirmedAt: updatedSession.paymentConfirmedAt
        });
        alert('Session marked as paid!');
      } catch (error) {
        console.error('Error marking session as paid:', error);
        alert('Failed to mark session as paid. Please try again.');
      }
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
        {client && !session.sessionPaid && (
          <div className="space-y-3 pb-3 border-b border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={handleGeneratePaymentLink}
                className="flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
              >
                Copy Payment Link
              </button>
              <button
                onClick={handleGeneratePaymentInstructions}
                className="flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
              >
                Copy Instructions
              </button>
            </div>
            <button
              onClick={handleMarkAsPaid}
              className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#4f6749' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
            >
              Mark as Paid
            </button>
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
              Edit Client
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
