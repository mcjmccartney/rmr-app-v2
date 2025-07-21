'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import SlideUpModal from '@/components/modals/SlideUpModal';

interface AddMembershipSidepaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMembershipSidepane({ isOpen, onClose }: AddMembershipSidepaneProps) {
  const { createMembership } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    date: '',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.date || !formData.amount) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
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
        email: formData.email.trim(),
        date: formData.date, // YYYY-MM-DD format
        amount: amount
      });

      // Reset form
      setFormData({
        email: '',
        date: '',
        amount: ''
      });

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
        email: '',
        date: '',
        amount: ''
      });
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
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="client@example.com"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            The email address associated with this membership payment
          </p>
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            The date when the membership payment was received
          </p>
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (£) <span className="text-red-500">*</span>
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
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            The membership payment amount in pounds
          </p>
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
