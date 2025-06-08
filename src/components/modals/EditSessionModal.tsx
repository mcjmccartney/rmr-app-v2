'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { format } from 'date-fns';

interface EditSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose }: EditSessionModalProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    clientId: '',
    sessionType: 'In-Person',
    date: '',
    time: '',
    quote: '',
    notes: ''
  });

  useEffect(() => {
    if (session) {
      const sessionDate = new Date(session.bookingDate);
      setFormData({
        clientId: session.clientId,
        sessionType: session.sessionType,
        date: format(sessionDate, 'yyyy-MM-dd'),
        time: format(sessionDate, 'HH:mm'),
        quote: session.quote.toString(),
        notes: session.notes || ''
      });
    }
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const bookingDate = new Date(`${formData.date}T${formData.time}`);

    const updatedSession: Session = {
      ...session,
      clientId: formData.clientId,
      sessionType: formData.sessionType as Session['sessionType'],
      bookingDate,
      quote: parseFloat(formData.quote),
      notes: formData.notes || undefined
    };

    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
    onClose();
  };

  if (!session) return null;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Session"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Client
          </label>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          >
            <option value="">Select a client</option>
            {state.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}{client.dogName ? ` w/ ${client.dogName}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Session Type
          </label>
          <select
            value={formData.sessionType}
            onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="In-Person">In-Person</option>
            <option value="Online">Online</option>
            <option value="Training">Training</option>
            <option value="Online Catchup">Online Catchup</option>
            <option value="Group">Group</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Coaching">Coaching</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Time
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Quote (£)
          </label>
          <input
            type="number"
            value={formData.quote}
            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter quote amount"
            min="0"
            step="0.01"
            required
          />
        </div>



        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Add any notes about the session"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          Update Session
        </button>
      </form>
    </SlideUpModal>
  );
}
