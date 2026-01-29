'use client';

import { useState, useEffect, memo } from 'react';
import { Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { ClientEmailAliasService } from '@/services/clientEmailAliasService';
import { getMostRecentMembership, updateFutureSessionPricesForMember } from '@/utils/membershipPricing';
import { X, Plus } from 'lucide-react';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditClientModal = memo(function EditClientModal({ client, isOpen, onClose }: EditClientModalProps) {
  const { updateClient, state, loadClientEmailAliases } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    partnerName: '',
    email: '',
    phone: '',
    dogName: '',
    otherDogs: [] as string[],
    address: '',
    active: true,
    membership: false
  });

  const [emailAliases, setEmailAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [isAddingAlias, setIsAddingAlias] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        partnerName: client.partnerName || '',
        email: client.email || '',
        phone: client.phone || '',
        dogName: client.dogName || '',
        otherDogs: (client.otherDogs || []) as string[],
        address: client.address || '',
        active: client.active,
        membership: client.membership
      });

      // Load email aliases for this client
      const aliases = state.clientEmailAliases?.[client.id] || [];
      const aliasEmails = aliases
        .filter(alias => alias.email.toLowerCase() !== client.email?.toLowerCase())
        .map(alias => alias.email);
      setEmailAliases(aliasEmails);
    }
  }, [client, state.clientEmailAliases]);



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

  const handleAddEmailAlias = async () => {
    if (!client || !newAlias.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAlias.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    // Check if alias already exists
    const normalizedNewAlias = newAlias.trim().toLowerCase();
    if (formData.email?.toLowerCase() === normalizedNewAlias) {
      alert('This email is already the primary email for this client.');
      return;
    }

    if (emailAliases.some(alias => alias.toLowerCase() === normalizedNewAlias)) {
      alert('This email alias already exists for this client.');
      return;
    }

    setIsAddingAlias(true);
    try {
      await ClientEmailAliasService.addAlias(client.id, newAlias.trim(), false);
      setEmailAliases([...emailAliases, newAlias.trim()]);
      setNewAlias('');
      // Reload aliases to update the state
      await loadClientEmailAliases();
    } catch (error) {
      console.error('Failed to add email alias:', error);
      alert('Failed to add email alias. Please try again.');
    } finally {
      setIsAddingAlias(false);
    }
  };

  const handleRemoveEmailAlias = async (aliasEmail: string) => {
    if (!client) return;

    if (!confirm(`Remove email alias "${aliasEmail}"?`)) {
      return;
    }

    try {
      // Find the alias ID
      const aliases = state.clientEmailAliases?.[client.id] || [];
      const aliasToRemove = aliases.find(a => a.email === aliasEmail);

      if (aliasToRemove) {
        await ClientEmailAliasService.removeAlias(aliasToRemove.id);
        setEmailAliases(emailAliases.filter(email => email !== aliasEmail));
        // Reload aliases to update the state
        await loadClientEmailAliases();
      }
    } catch (error) {
      console.error('Failed to remove email alias:', error);
      alert('Failed to remove email alias. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const updates: Partial<Client> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      partnerName: formData.partnerName.trim() || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      dogName: formData.dogName || undefined,
      otherDogs: formData.otherDogs.filter(dog => dog.trim() !== '') || undefined,
      address: formData.address || undefined,
      active: formData.active,
      membership: formData.membership
    };

    try {
      await updateClient(client.id, updates);

      // If membership was just enabled, update future session prices
      if (formData.membership && !client.membership) {
        try {
          console.log('[EDIT CLIENT] Membership enabled - updating future session prices...');

          // Get the most recent membership payment date
          const recentMembership = await getMostRecentMembership(client.id);

          if (recentMembership) {
            const { updatedCount } = await updateFutureSessionPricesForMember(
              client.id,
              recentMembership.date
            );
            console.log(`[EDIT CLIENT] ✅ Updated ${updatedCount} future session price(s)`);

            if (updatedCount > 0) {
              alert(`Client updated! Updated ${updatedCount} future session price(s) to member rates.`);
            }
          } else {
            console.log('[EDIT CLIENT] No membership payment found - cannot update session prices');
          }
        } catch (pricingError) {
          console.error('[EDIT CLIENT] Failed to update future session prices:', pricingError);
          // Don't fail the whole operation - client was updated successfully
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client. Please try again.');
    }
  };

  if (!client) return null;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter first name"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter last name"
              required
            />
          </div>

        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Partner Name
          </label>
          <input
            type="text"
            value={formData.partnerName}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter partner name (optional)"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Dog Name
          </label>
          <input
            type="text"
            value={formData.dogName}
            onChange={(e) => setFormData({ ...formData, dogName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter primary dog name"
            required
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
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Other Dogs
            </label>
            {formData.otherDogs.map((dog, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={dog}
                  onChange={(e) => updateDogField(index, e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Phone (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>

        {/* Email Aliases Section */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Email Aliases (Optional)
          </label>

          {/* Display existing aliases */}
          {emailAliases.length > 0 && (
            <div className="mb-3 space-y-2">
              {emailAliases.map((alias, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 text-sm text-gray-700">{alias}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmailAlias(alias)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Remove alias"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new alias */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmailAlias();
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="Add email alias"
              disabled={isAddingAlias}
            />
            <button
              type="button"
              onClick={handleAddEmailAlias}
              disabled={isAddingAlias || !newAlias.trim()}
              className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Add alias"
            >
              <Plus size={16} />
              <span className="text-sm">Add</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Address (Optional)
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          Update Client
        </button>
      </form>
    </SlideUpModal>
  );
});

export default EditClientModal;
