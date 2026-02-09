'use client';

import { useState, useEffect } from 'react';
import { Session, SessionParticipant, Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { formatDateTime, formatClientWithAllDogs } from '@/utils/dateFormatting';
import { Users, Plus, Trash2, Check, X, Mail } from 'lucide-react';
import SearchableDropdown from '../ui/SearchableDropdown';

interface GroupSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onEditSession: (session: Session) => void;
}

export default function GroupSessionModal({ session, isOpen, onClose, onEditSession }: GroupSessionModalProps) {
  const { state, getSessionParticipants, createSessionParticipant, updateSessionParticipant, deleteSessionParticipant, sendGroupEventEmail } = useApp();
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [individualQuote, setIndividualQuote] = useState(5); // Default £5 per participant
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (session && isOpen) {
      loadParticipants();
    }
  }, [session, isOpen]);

  const loadParticipants = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const sessionParticipants = await getSessionParticipants(session.id);
      setParticipants(sessionParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!session || !selectedClientId) return;

    try {
      const newParticipant = await createSessionParticipant({
        sessionId: session.id,
        clientId: selectedClientId,
        individualQuote,
        paid: false
      });
      
      setParticipants([...participants, newParticipant]);
      setSelectedClientId('');
      setShowAddParticipant(false);
      
      // Update session total quote
      await updateSessionTotal();
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Failed to add participant. Please try again.');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await deleteSessionParticipant(participantId);
      setParticipants(participants.filter(p => p.id !== participantId));
      
      // Update session total quote
      await updateSessionTotal();
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant. Please try again.');
    }
  };

  const handleTogglePayment = async (participant: SessionParticipant) => {
    try {
      const updatedParticipant = await updateSessionParticipant(participant.id, {
        paid: !participant.paid,
        paidAt: !participant.paid ? new Date().toISOString() : undefined
      });
      
      setParticipants(participants.map(p => 
        p.id === participant.id ? updatedParticipant : p
      ));
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const updateSessionTotal = async () => {
    if (!session) return;

    const totalQuote = participants.length * individualQuote;
    // This would need to be implemented to update the session's quote
    // For now, we'll just log it
    console.log('Session total should be updated to:', totalQuote);
  };

  const handleSendEventEmail = async () => {
    if (!session) return;

    if (participants.length === 0) {
      console.warn('Cannot send event email: No participants found');
      return;
    }

    try {
      setSendingEmail(true);
      await sendGroupEventEmail(session);
      console.log('✅ Event email sent successfully');
    } catch (error) {
      console.error('❌ Failed to send event email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    return client ? formatClientWithAllDogs(client) : 'Unknown Client';
  };

  const availableClients = state.clients.filter(client => 
    client.active && !participants.some(p => p.clientId === client.id)
  );

  const clientOptions = availableClients.map(client => ({
    value: client.id,
    label: formatClientWithAllDogs(client)
  }));

  const totalAmount = participants.reduce((sum, p) => sum + p.individualQuote, 0);
  const paidAmount = participants.filter(p => p.paid).reduce((sum, p) => sum + p.individualQuote, 0);
  const unpaidAmount = totalAmount - paidAmount;

  if (!session) return null;

  const isGroupOrRMRLive = session.sessionType === 'Group' || session.sessionType === 'RMR Live';

  return (
    <SlideUpModal isOpen={isOpen} onClose={onClose} title={`${session.sessionType} Session`}>
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{session.sessionType} Session</h3>
          <p className="text-sm text-gray-600">
            {formatDateTime(session.bookingDate, session.bookingTime)}
          </p>
          {session.notes && (
            <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Financial Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-medium">£{totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Paid</p>
              <p className="font-medium text-green-600">£{paidAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Outstanding</p>
              <p className="font-medium text-red-600">£{unpaidAmount.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
            {participants.length > 0 && participants.every(p => p.individualQuote === participants[0].individualQuote)
              ? ` × £${participants[0].individualQuote.toFixed(2)} each`
              : ' (individual pricing)'
            }
          </div>
        </div>

        {/* Participants List */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">Participants ({participants.length})</h4>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="flex items-center gap-2 px-3 py-1 text-white rounded-md text-sm hover:opacity-90"
              style={{ backgroundColor: '#973b00' }}
            >
              <Plus size={16} />
              Add Participant
            </button>
          </div>

          {/* Add Participant Form - appears right below the button */}
          {showAddParticipant && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Add Participant</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Client
                  </label>
                  <SearchableDropdown
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    options={clientOptions}
                    placeholder="Choose a client..."
                    searchPlaceholder="Search clients..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Individual Quote (£)
                  </label>
                  <input
                    type="number"
                    value={individualQuote}
                    onChange={(e) => setIndividualQuote(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddParticipant}
                    disabled={!selectedClientId}
                    className="flex-1 px-4 py-2 text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#973b00' }}
                  >
                    Add Participant
                  </button>
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedClientId('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>No participants added yet</p>
              <p className="text-sm">Click "Add Participant" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getClientName(participant.clientId)}</p>
                    <p className="text-sm text-gray-600">£{participant.individualQuote.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePayment(participant)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                        participant.paid
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {participant.paid ? <Check size={14} /> : <X size={14} />}
                      {participant.paid ? 'Paid' : 'Unpaid'}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>



        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          {/* Send Event Email Button */}
          <button
            onClick={handleSendEventEmail}
            disabled={sendingEmail || participants.length === 0}
            className="w-full flex items-center justify-center gap-2 text-white py-3 px-4 rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#973b00' }}
          >
            <Mail size={18} />
            {sendingEmail ? 'Sending...' : 'Send Event Email'}
          </button>

          {/* Other Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onEditSession(session)}
              className="flex-1 text-white py-3 px-4 rounded-md hover:opacity-90 font-medium"
              style={{ backgroundColor: '#973b00' }}
            >
              Edit Session Details
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </SlideUpModal>
  );
}
