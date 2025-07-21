'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Client } from '@/types';
import SlideUpModal from '@/components/modals/SlideUpModal';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

interface AddMembershipSidepaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMembershipSidepane({ isOpen, onClose }: AddMembershipSidepaneProps) {
  const { state, createMembership } = useApp();
  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    amount: ''
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientChange = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData(prev => ({
      ...prev,
      clientId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.date || !formData.amount) {
      alert('Please fill in all fields.');
      return;
    }

    if (!selectedClient?.email) {
      alert('Selected client must have an email address.');
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createMembership({
        email: selectedClient.email,
        date: formData.date, // YYYY-MM-DD format
        amount: amount
      });

      // Reset form
      setFormData({
        clientId: '',
        date: '',
        amount: ''
      });
      setSelectedClient(null);

      onClose();
    } catch (error) {
      console.error('Error creating membership:', error);
      alert('Failed to create membership. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        clientId: '',
        date: '',
        amount: ''
      });
      setSelectedClient(null);
      onClose();
    }
  };

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Membership"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client
          </label>
          <SearchableDropdown
            value={formData.clientId}
            onChange={handleClientChange}
            options={state.clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName}${client.dogName ? ` w/ ${client.dogName}` : ''}`
            }))}
            placeholder="Select a client"
            searchPlaceholder="Search clients..."
            disabled={isSubmitting}
          />
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (£)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="50.00"
            min="0"
            step="0.01"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Membership...' : 'Create Membership'}
          </button>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </form>
    </SlideUpModal>
  );
}
