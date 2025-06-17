'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { generateHourOptions, generateMinuteOptions, sessionTypeOptions } from '@/utils/timeOptions';


interface EditSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose }: EditSessionModalProps) {
  const { state, updateSession } = useApp();
  const [formData, setFormData] = useState({
    clientId: '',
    sessionType: 'In-Person',
    date: '',
    time: '',
    quote: '',
    notes: ''
  });

  // Generate time options
  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  // Helper functions for time handling
  const getHourFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return parts[0] || '';
  };

  const getMinuteFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return parts[1] || '';
  };

  const updateTime = (hour: string, minute: string) => {
    if (hour !== '' && minute !== '') {
      const newTime = `${hour}:${minute}`;
      setFormData({ ...formData, time: newTime });
    } else if (hour !== '' || minute !== '') {
      // If only one is selected, still update to show partial selection
      const currentHour = hour !== '' ? hour : '00';
      const currentMinute = minute !== '' ? minute : '00';
      const newTime = `${currentHour}:${currentMinute}`;
      setFormData({ ...formData, time: newTime });
    }
  };

  useEffect(() => {
    if (session) {
      setFormData({
        clientId: session.clientId,
        sessionType: session.sessionType,
        date: session.bookingDate, // Already in YYYY-MM-DD format
        time: session.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)
        quote: session.quote.toString(),
        notes: session.notes || ''
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const updates: Partial<Session> = {
      clientId: formData.clientId,
      sessionType: formData.sessionType as Session['sessionType'],
      bookingDate: formData.date, // YYYY-MM-DD format
      bookingTime: formData.time, // HH:mm format
      quote: parseFloat(formData.quote),
      notes: formData.notes || undefined
    };

    try {
      await updateSession(session.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session. Please try again.');
    }
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
          <CustomDropdown
            value={formData.sessionType}
            onChange={(value) => setFormData({ ...formData, sessionType: value })}
            options={sessionTypeOptions}
            placeholder="Select session type"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Date
          </label>
          <CustomDatePicker
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Time
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Hour
              </label>
              <CustomDropdown
                value={getHourFromTime(formData.time)}
                onChange={(hour) => updateTime(hour, getMinuteFromTime(formData.time))}
                options={hourOptions}
                placeholder="00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Minutes
              </label>
              <CustomDropdown
                value={getMinuteFromTime(formData.time)}
                onChange={(minute) => updateTime(getHourFromTime(formData.time), minute)}
                options={minuteOptions}
                placeholder="00"
              />
            </div>
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
