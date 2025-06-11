'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useApp } from '@/context/AppContext';
import { Session, Client } from '@/types';
import { calculateQuote } from '@/utils/pricing';

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
        className={`fixed top-0 right-0 bottom-0 w-96 bg-white shadow-2xl transition-transform duration-300 ease-out overflow-hidden hidden md:block ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
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
        <div className="p-6 overflow-y-auto h-full">
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
    sessionType: 'In-Person' as Session['sessionType'],
    date: '',
    time: '',
    notes: '',
    quote: 0
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientChange = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData({
      ...formData,
      clientId,
      quote: calculateQuote(formData.sessionType, client?.membership || false)
    });
  };

  const handleSessionTypeChange = (sessionType: Session['sessionType']) => {
    setFormData({
      ...formData,
      sessionType,
      quote: calculateQuote(sessionType, selectedClient?.membership || false)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSession({
        clientId: formData.clientId,
        sessionType: formData.sessionType,
        bookingDate: formData.date, // YYYY-MM-DD format
        bookingTime: formData.time, // HH:mm format
        quote: formData.quote,
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
          Client
        </label>
        <select
          value={formData.clientId}
          onChange={(e) => handleClientChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        >
          <option value="">Select a client</option>
          {state.clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}{client.dogName ? ` w/ ${client.dogName}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Type
        </label>
        <select
          value={formData.sessionType}
          onChange={(e) => handleSessionTypeChange(e.target.value as Session['sessionType'])}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quote (£)
        </label>
        <input
          type="number"
          value={formData.quote}
          onChange={(e) => setFormData({ ...formData, quote: parseFloat(e.target.value) || 0 })}
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
