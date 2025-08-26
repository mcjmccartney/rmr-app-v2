'use client';

import { useState, useEffect } from 'react';
import { Session, Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { generateHourOptions, generateMinuteOptions, sessionTypeOptions } from '@/utils/timeOptions';
import { formatClientWithAllDogs, formatClientWithSelectedDog } from '@/utils/dateFormatting';


interface EditSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose }: EditSessionModalProps) {
  const { state, updateSession, deleteSession } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    dogName: '',
    sessionType: 'In-Person',
    date: '',
    time: '',
    quote: '',
    notes: ''
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Helper function to check if session is in the past
  const isSessionInPast = (date: string, time: string) => {
    if (!date || !time) return false;

    const sessionDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();

    return sessionDateTime < now;
  };

  // Generate time options
  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  // Helper functions for time handling
  const getHourFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    const hour = parts[0] || '';
    // Ensure it's a valid hour option (00-23)
    const hourNum = parseInt(hour, 10);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) return '';
    return hour.padStart(2, '0');
  };

  const getMinuteFromTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    const minute = parts[1] || '';
    // Ensure it's a valid minute option (00, 05, 10, etc.)
    const minuteNum = parseInt(minute, 10);
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) return '';
    // Round to nearest 5-minute increment
    const roundedMinute = Math.round(minuteNum / 5) * 5;
    return roundedMinute.toString().padStart(2, '0');
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
      const client = state.clients.find(c => c.id === session.clientId);
      setSelectedClient(client || null);

      setFormData({
        clientId: session.clientId || '', // Handle optional clientId for Group/RMR Live sessions
        dogName: session.dogName || '',
        sessionType: session.sessionType,
        date: session.bookingDate, // Already in YYYY-MM-DD format
        time: session.bookingTime.substring(0, 5), // Ensure HH:mm format (remove seconds)
        quote: session.quote.toString(),
        notes: session.notes || ''
      });
    }
  }, [session, state.clients]);

  const handleClientChange = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    setSelectedClient(client || null);

    // Set default dog name to primary dog if available, or keep current if it's valid for the new client
    const allDogs = [
      ...(client?.dogName ? [client.dogName] : []),
      ...(client?.otherDogs || [])
    ];

    const currentDogIsValid = formData.dogName && allDogs.includes(formData.dogName);
    const defaultDogName = currentDogIsValid ? formData.dogName : (client?.dogName || '');

    setFormData({
      ...formData,
      clientId,
      dogName: defaultDogName
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || isSubmitting) return;

    setIsSubmitting(true);

    const updates: Partial<Session> = {
      clientId: formData.clientId || undefined, // Allow undefined for Group/RMR Live sessions
      dogName: formData.dogName || undefined,
      sessionType: formData.sessionType as Session['sessionType'],
      bookingDate: formData.date, // YYYY-MM-DD format
      bookingTime: formData.time, // HH:mm format
      quote: parseFloat(formData.quote),
      notes: formData.notes || undefined
    };

    try {
      console.log('Updating session...');

      // Update the session - calendar updates are now handled automatically in updateSession
      await updateSession(session.id, updates);

      // Booking terms webhook is now automatically triggered by updateSession in AppContext
      // Calendar updates are also handled automatically for Date, Time, and Session Type changes

      onClose();
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session || isSubmitting) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ${session.sessionType} session?\n\n` +
      `Date: ${session.bookingDate}\n` +
      `Time: ${session.bookingTime}\n\n` +
      `This action cannot be undone and will also delete the associated Google Calendar event.`
    );

    if (!confirmDelete) return;

    setIsSubmitting(true);

    try {
      console.log('Deleting session...');
      await deleteSession(session.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            Client {(formData.sessionType === 'Group' || formData.sessionType === 'RMR Live') && '(Optional)'}
          </label>
          <SearchableDropdown
            value={formData.clientId}
            onChange={handleClientChange}
            options={[
              ...(formData.sessionType === 'Group' || formData.sessionType === 'RMR Live'
                ? [{ value: '', label: 'No client (Group/RMR Live session)' }]
                : []
              ),
              ...state.clients.map((client) => ({
                value: client.id,
                label: client.id === formData.clientId && formData.dogName
                  ? formatClientWithSelectedDog(client, formData.dogName)
                  : formatClientWithAllDogs(client)
              }))
            ]}
            placeholder={
              formData.sessionType === 'Group' || formData.sessionType === 'RMR Live'
                ? "Select a client (optional)"
                : "Select a client"
            }
            searchPlaceholder="Search clients..."
          />
        </div>

        {/* Dog Selection - Only show if client has multiple dogs */}
        {selectedClient && (selectedClient.dogName || (selectedClient.otherDogs && selectedClient.otherDogs.length > 0)) && (
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Dog
            </label>
            <CustomDropdown
              value={formData.dogName}
              onChange={(value) => setFormData({ ...formData, dogName: value })}
              options={[
                ...(selectedClient.dogName ? [{ value: selectedClient.dogName, label: `${selectedClient.dogName} (Primary)` }] : []),
                ...(selectedClient.otherDogs?.map((dog: string) => ({ value: dog, label: dog })) || [])
              ]}
              placeholder="Select a dog"
              className="w-full"
            />
          </div>
        )}

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Session Type
          </label>
          <CustomDropdown
            value={formData.sessionType}
            onChange={(value) => setFormData({ ...formData, sessionType: value })}
            options={sessionTypeOptions}
            className="w-full"
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
            onWheel={(e) => e.currentTarget.blur()} // Prevent trackpad scrolling from affecting the input
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-amber-800 text-white hover:bg-amber-700'
            }`}
          >
            {isSubmitting ? 'Updating...' : 'Update Session'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </form>
    </SlideUpModal>
  );
}
