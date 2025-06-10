'use client';

import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { formatDateTime } from '@/utils/dateFormatting';

interface SessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onEditSession: (session: Session) => void;
  onEditClient: (session: Session) => void;
  onCreateSessionPlan?: (session: Session) => void;
}

export default function SessionModal({ session, isOpen, onClose, onEditSession, onEditClient, onCreateSessionPlan }: SessionModalProps) {
  const { dispatch, state, deleteSession } = useApp();

  if (!session) return null;

  // Find the client for this session
  const client = state.clients.find(c => c.id === session.clientId);

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

  const displayName = client
    ? `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
    : 'Unknown Client';

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
    >
      <div className="space-y-6">
        {/* Session Details */}
        <div className="space-y-4">
          {client && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Owner(s) Name</span>
                <span className="font-medium text-gray-900">{client.firstName} {client.lastName}</span>
              </div>

              {client.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium text-gray-900">{client.phone}</span>
                </div>
              )}

              {client.email && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{client.email}</span>
                </div>
              )}

              {client.address && (
                <div className="space-y-1">
                  <span className="text-gray-600">Address</span>
                  <div className="font-medium text-gray-900 text-right">{client.address}</div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Booking</span>
            <span className="font-medium text-gray-900">
              {formatDateTime(session.bookingDate, session.bookingTime)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Session Type</span>
            <span className="font-medium text-gray-900">{session.sessionType}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Quote</span>
            <span className="font-medium text-gray-900">£{session.quote}</span>
          </div>

          {session.notes && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Notes</span>
              <span className="font-medium text-gray-900 text-right max-w-48">{session.notes}</span>
            </div>
          )}

        </div>

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
