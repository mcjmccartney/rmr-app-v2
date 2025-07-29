'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useApp } from '@/context/AppContext';
import { Session, Client } from '@/types';
import { calculateQuote } from '@/utils/pricing';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { generateHourOptions, generateMinuteOptions, sessionTypeOptions } from '@/utils/timeOptions';
import { formatClientWithAllDogs, formatClientWithSelectedDog } from '@/utils/dateFormatting';


interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'session' | 'client';
}

export default function AddModal({ isOpen, onClose, type }: AddModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { registerModal, unregisterModal } = useModal();
  const [modalId] = useState(() => `add-modal-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      registerModal(modalId);
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding and unregistering
      setTimeout(() => {
        setIsVisible(false);
        unregisterModal(modalId);
      }, 300);
    }
  }, [isOpen, registerModal, unregisterModal, modalId]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      unregisterModal(modalId);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isAnimating ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Mobile: slide up from bottom */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {type === 'session' ? 'Add Session' : 'Add Client'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {type === 'session' ? (
            <SessionForm onSubmit={handleClose} />
          ) : (
            <ClientForm onSubmit={handleClose} />
          )}
        </div>
      </div>

      {/* Desktop: slide in from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-96 bg-white shadow-2xl transition-transform duration-300 ease-out hidden md:flex md:flex-col ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold">
            {type === 'session' ? 'Add Session' : 'Add Client'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {type === 'session' ? (
            <SessionForm onSubmit={handleClose} />
          ) : (
            <ClientForm onSubmit={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function SessionForm({ onSubmit }: { onSubmit: () => void }) {
  const { state, createSession } = useApp();
  const [formData, setFormData] = useState({
    clientId: '',
    dogName: '',
    sessionType: 'In-Person' as Session['sessionType'],
    date: '',
    time: '',
    notes: '',
    quote: ''
  });

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
    console.log('updateTime called with:', { hour, minute, currentTime: formData.time });
    if (hour !== '' && minute !== '') {
      const newTime = `${hour}:${minute}`;
      console.log('Setting new time:', newTime);
      setFormData({ ...formData, time: newTime });
    } else if (hour !== '' || minute !== '') {
      // If only one is selected, still update to show partial selection
      const currentHour = hour !== '' ? hour : '00';
      const currentMinute = minute !== '' ? minute : '00';
      const newTime = `${currentHour}:${currentMinute}`;
      console.log('Setting partial time:', newTime);
      setFormData({ ...formData, time: newTime });
    }
  };

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientChange = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    setSelectedClient(client || null);

    // Set default dog name to primary dog if available
    const defaultDogName = client?.dogName || '';

    setFormData({
      ...formData,
      clientId,
      dogName: defaultDogName,
      quote: calculateQuote(formData.sessionType, client?.membership || false).toString()
    });
  };

  const handleSessionTypeChange = (sessionType: Session['sessionType']) => {
    setFormData({
      ...formData,
      sessionType,
      quote: calculateQuote(sessionType, selectedClient?.membership || false).toString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    // Client is only required for non-Group and non-RMR Live sessions
    const isGroupOrRMRLive = formData.sessionType === 'Group' || formData.sessionType === 'RMR Live';
    if (!isGroupOrRMRLive && !formData.clientId) {
      alert('Please select a client');
      return;
    }

    if (!formData.date) {
      alert('Please select a date');
      return;
    }

    if (!formData.time) {
      alert('Please select a time');
      return;
    }

    console.log('Form data before submission:', {
      clientId: formData.clientId,
      dogName: formData.dogName,
      sessionType: formData.sessionType,
      date: formData.date,
      time: formData.time,
      quote: formData.quote,
      notes: formData.notes
    });

    try {
      await createSession({
        clientId: formData.clientId || undefined, // Allow undefined for Group/RMR Live sessions
        dogName: formData.dogName || undefined,
        sessionType: formData.sessionType,
        bookingDate: formData.date, // YYYY-MM-DD format
        bookingTime: formData.time, // HH:mm format
        quote: parseFloat(formData.quote) || 0,
        notes: formData.notes || undefined,
      });

      onSubmit();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dog
          </label>
          <CustomDropdown
            value={formData.dogName}
            onChange={(value) => setFormData({ ...formData, dogName: value })}
            options={[
              ...(selectedClient.dogName ? [{ value: selectedClient.dogName, label: `${selectedClient.dogName} (Primary)` }] : []),
              ...(selectedClient.otherDogs?.map(dog => ({ value: dog, label: dog })) || [])
            ]}
            placeholder="Select a dog"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Type
        </label>
        <CustomDropdown
          value={formData.sessionType}
          onChange={(value) => handleSessionTypeChange(value as Session['sessionType'])}
          options={sessionTypeOptions}
          placeholder="Select session type"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date
        </label>
        <CustomDatePicker
          value={formData.date}
          onChange={(value) => setFormData({ ...formData, date: value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Hour
            </label>
            <CustomDropdown
              value={getHourFromTime(formData.time)}
              onChange={(hour) => {
                console.log('Hour changed to:', hour);
                updateTime(hour, getMinuteFromTime(formData.time));
              }}
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
              onChange={(minute) => {
                console.log('Minute changed to:', minute);
                updateTime(getHourFromTime(formData.time), minute);
              }}
              options={minuteOptions}
              placeholder="00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quote (£)
        </label>
        <input
          type="number"
          value={formData.quote}
          onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
          onWheel={(e) => e.currentTarget.blur()} // Prevent trackpad scrolling from affecting the input
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter quote amount"
          min="0"
          step="0.01"
          required
        />
        {selectedClient && (
          <p className="text-sm text-gray-500 mt-1">
            Auto-calculated: £{calculateQuote(formData.sessionType, selectedClient.membership)}
            {selectedClient.membership ? ' (Member)' : ' (Non-member)'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Add any notes about the session"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-amber-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors"
      >
        Create Session
      </button>
    </form>
  );
}

function ClientForm({ onSubmit }: { onSubmit: () => void }) {
  const { createClient } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    partnerName: '',
    dogName: '',
    otherDogs: [] as string[],
    phone: '',
    email: '',
    address: '',
    active: true,
    membership: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createClient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        partnerName: formData.partnerName.trim() || undefined,
        dogName: formData.dogName,
        otherDogs: formData.otherDogs.filter(dog => dog.trim() !== ''),
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        active: formData.active,
        membership: formData.membership,
      });

      onSubmit();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    }
  };



  const addDogField = () => {
    setFormData({ ...formData, otherDogs: [...formData.otherDogs, ''] });
  };

  const removeDogField = (index: number) => {
    const newOtherDogs = formData.otherDogs.filter((_, i) => i !== index);
    setFormData({ ...formData, otherDogs: newOtherDogs });
  };

  const updateDogField = (index: number, value: string) => {
    const newOtherDogs = [...formData.otherDogs];
    newOtherDogs[index] = value;
    setFormData({ ...formData, otherDogs: newOtherDogs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter first name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter last name"
            required
          />
        </div>

      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Partner Name <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.partnerName}
          onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter partner name (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dog Name <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.dogName}
          onChange={(e) => setFormData({ ...formData, dogName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter primary dog name (optional)"
        />

        {/* Add another dog button */}
        <button
          type="button"
          onClick={addDogField}
          className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2"
        >
          + Add another dog
        </button>
      </div>

      {/* Additional dog fields - only show if there are other dogs */}
      {formData.otherDogs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Dogs
          </label>
          {formData.otherDogs.map((dog, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={dog}
                onChange={(e) => updateDogField(index, e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter dog name"
              />
              <button
                type="button"
                onClick={() => removeDogField(index)}
                className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter full address"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <label className="text-gray-600">
            Active
          </label>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, active: !formData.active })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.active ? 'bg-gray-200' : 'bg-gray-200'
            }`}
            style={formData.active ? { backgroundColor: '#4f6749' } : {}}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-gray-600">
            Membership
          </label>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, membership: !formData.membership })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.membership ? 'bg-gray-200' : 'bg-gray-200'
            }`}
            style={formData.membership ? { backgroundColor: '#4f6749' } : {}}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.membership ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-amber-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors"
      >
        Create Client
      </button>
    </form>
  );
}
