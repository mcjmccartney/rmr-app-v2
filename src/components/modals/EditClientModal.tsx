'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditClientModal({ client, isOpen, onClose }: EditClientModalProps) {
  const { updateClient } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    partnerNames: [] as { firstName: string; lastName: string }[],
    email: '',
    phone: '',
    dogName: '',
    otherDogs: [] as string[],
    address: '',
    active: true,
    membership: false
  });

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        partnerNames: (client.partnerNames || []) as { firstName: string; lastName: string }[],
        email: client.email || '',
        phone: client.phone || '',
        dogName: client.dogName || '',
        otherDogs: (client.otherDogs || []) as string[],
        address: client.address || '',
        active: client.active,
        membership: client.membership
      });
    }
  }, [client]);

  const addPartnerField = () => {
    setFormData({ ...formData, partnerNames: [...formData.partnerNames, { firstName: '', lastName: '' }] });
  };

  const removePartnerField = (index: number) => {
    const newPartnerNames = formData.partnerNames.filter((_, i) => i !== index);
    setFormData({ ...formData, partnerNames: newPartnerNames });
  };

  const updatePartnerField = (index: number, field: 'firstName' | 'lastName', value: string) => {
    const newPartnerNames = [...formData.partnerNames];
    newPartnerNames[index][field] = value;
    setFormData({ ...formData, partnerNames: newPartnerNames });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const updates: Partial<Client> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      partnerNames: formData.partnerNames.filter(partner => partner.firstName.trim() !== '' && partner.lastName.trim() !== '') || undefined,
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

          {/* Add Partner Name button */}
          <button
            type="button"
            onClick={addPartnerField}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2"
          >
            + Add partner name
          </button>
        </div>

        {/* Additional partner fields - only show if there are partners */}
        {formData.partnerNames.length > 0 && (
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Partner Names
            </label>
            {formData.partnerNames.map((partner, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                <input
                  type="text"
                  value={partner.firstName}
                  onChange={(e) => updatePartnerField(index, 'firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="First name"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partner.lastName}
                    onChange={(e) => updatePartnerField(index, 'lastName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                  <button
                    type="button"
                    onClick={() => removePartnerField(index)}
                    className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
}
